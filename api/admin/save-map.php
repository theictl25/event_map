<?php

declare(strict_types=1);

require dirname(__DIR__, 2) . '/lib/auth.php';

function respond(int $status, array $data): never
{
  header('Content-Type: application/json; charset=UTF-8');
  http_response_code($status);
  exit(json_encode($data, JSON_UNESCAPED_UNICODE));
}

// API calls must return JSON. Redirecting to login.php would return HTML and
// make the Manager report an unhelpful "invalid response" error instead.
if (empty($_SESSION['eventmap_admin'])) {
  respond(401, ['ok' => false, 'error' => 'Your Manager session has ended. Please sign in again.']);
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

function compact_layout(array $layout): array
{
  $defaultTextColorBooth = '#425066';
  $defaultTextColorOther = '#334155';

  $elements = [];
  foreach ($layout['elements'] as $el) {
    if (!is_array($el)) continue;
    $type = (string)($el['type'] ?? 'other');
    $item = [
      'id' => (string)($el['id'] ?? ''),
      'type' => $type,
    ];
    if (!empty($el['boothId'])) $item['boothId'] = (string)$el['boothId'];
    if (!empty($el['zone'])) $item['zone'] = (string)$el['zone'];
    if (!empty($el['label_lo'])) $item['label_lo'] = (string)$el['label_lo'];
    if (!empty($el['label_en'])) $item['label_en'] = (string)$el['label_en'];
    $item['x'] = round((float)($el['x'] ?? 0), 1);
    $item['y'] = round((float)($el['y'] ?? 0), 1);
    $item['width'] = round((float)($el['width'] ?? 0), 1);
    $item['height'] = round((float)($el['height'] ?? 0), 1);
    if (!empty($el['color'])) $item['color'] = (string)$el['color'];
    if (!empty($el['fontSize']) && (int)$el['fontSize'] !== 12) {
      $item['fontSize'] = (int)$el['fontSize'];
    }
    if (!empty($el['textColor'])) {
      $defaultColor = ($type === 'booth') ? $defaultTextColorBooth : $defaultTextColorOther;
      if (strcasecmp((string)$el['textColor'], $defaultColor) !== 0) {
        $item['textColor'] = (string)$el['textColor'];
      }
    }
    if (!empty($el['shape']) && $el['shape'] !== 'rectangle') {
      $item['shape'] = (string)$el['shape'];
    }
    $elements[] = $item;
  }

  return [
    'width' => (int)($layout['width'] ?? 800),
    'height' => (int)($layout['height'] ?? 900),
    'gridSize' => (int)($layout['gridSize'] ?? 5),
    'zoneColors' => is_array($layout['zoneColors'] ?? null) ? $layout['zoneColors'] : [],
    'elements' => $elements,
  ];
}

$body = json_encode([
  'action' => 'saveMapLayout',
  'token' => $config['apps_script_write_token'] ?? '',
  'layout' => compact_layout($layout),
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
  respond(500, ['ok' => false, 'error' => 'Could not contact Google Apps Script']);
}

$decoded = json_decode($response, true);
if (!is_array($decoded)) {
  $extracted = '';
  if (preg_match('/<div[^>]*class="errorMessage"[^>]*>(.*?)<\/div>/is', $response, $matches)) {
    $extracted = trim(strip_tags($matches[1]));
  } elseif (preg_match('/<div[^>]*style="[^"]*monospace[^"]*"[^>]*>(.*?)<\/div>/is', $response, $matches)) {
    $extracted = trim(strip_tags($matches[1]));
  } elseif (preg_match('/<title>(.*?)<\/title>/is', $response, $matches)) {
    $extracted = trim(strip_tags($matches[1]));
  }
  $errorMsg = $extracted !== ''
    ? 'Apps Script error: ' . $extracted
    : 'Apps Script returned an invalid response';
  respond(500, ['ok' => false, 'error' => $errorMsg]);
}
if (empty($decoded['ok'])) {
  respond(500, ['ok' => false, 'error' => $decoded['error'] ?? 'Google Sheets did not save the map']);
}

respond(200, ['ok' => true]);
