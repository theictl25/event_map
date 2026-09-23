<?php
declare(strict_types=1);

require dirname(__DIR__, 2) . '/lib/auth.php';
require_admin();
header('Content-Type: application/json; charset=UTF-8');

function respond(int $status, array $data): never {
  http_response_code($status);
  exit(json_encode($data, JSON_UNESCAPED_UNICODE));
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  respond(405, ['ok' => false, 'error' => 'POST required']);
}

$layout = json_decode(file_get_contents('php://input'), true);
if (!is_array($layout) || !isset($layout['width'], $layout['height'], $layout['elements']) || !is_array($layout['elements'])) {
  respond(422, ['ok' => false, 'error' => 'Invalid map layout']);
}

$config = app_config();
if (empty($config['apps_script_write_url']) || str_starts_with($config['apps_script_write_url'], 'PASTE_')) {
  respond(500, ['ok' => false, 'error' => 'Apps Script URL is not configured']);
}

// Google Apps Script URLs always use HTTPS. Without OpenSSL, PHP cannot
// create that secure connection and file_get_contents() only reports a vague
// "Could not contact" error.
if (!extension_loaded('openssl')) {
  respond(500, [
    'ok' => false,
    'error' => 'PHP OpenSSL is not enabled. Configure Five Server/PHP to use a PHP installation with OpenSSL.',
  ]);
}

$body = json_encode([
  'action' => 'saveMapLayout',
  'token' => $config['apps_script_write_token'] ?? '',
  'layout' => $layout,
], JSON_UNESCAPED_UNICODE);

// stream_context works in ordinary PHP installations, including this local
// runtime where the optional cURL extension is not enabled.
$context = stream_context_create(['http' => [
  'method' => 'POST',
  'header' => "Content-Type: application/json\r\nAccept: application/json\r\n",
  'content' => $body,
  'timeout' => 20,
  'ignore_errors' => true,
]]);

$response = @file_get_contents($config['apps_script_write_url'], false, $context);
if ($response === false) {
  respond(502, ['ok' => false, 'error' => 'Could not contact Google Apps Script']);
}

$decoded = json_decode($response, true);
if (!is_array($decoded)) {
  respond(502, ['ok' => false, 'error' => 'Apps Script returned an invalid response']);
}
if (empty($decoded['ok'])) {
  respond(502, ['ok' => false, 'error' => $decoded['error'] ?? 'Google Sheets did not save the map']);
}

respond(200, ['ok' => true]);
