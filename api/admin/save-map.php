<?php

declare(strict_types=1);
require dirname(__DIR__, 2) . '/lib/auth.php';
require_admin();
header('Content-Type: application/json');
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit(json_encode(['error' => 'POST required']));
}
$payload = json_decode(file_get_contents('php://input'), true);
if (!is_array($payload) || !isset($payload['width'], $payload['height'], $payload['booths'])) {
    http_response_code(422);
    exit(json_encode(['error' => 'Invalid layout']));
}
$config = app_config();
$request = curl_init($config['apps_script_write_url']);
curl_setopt_array($request, [CURLOPT_POST => true, CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 15, CURLOPT_HTTPHEADER => ['Content-Type: application/json'], CURLOPT_POSTFIELDS => json_encode(['action' => 'saveMapLayout', 'token' => $config['apps_script_write_token'], 'layout' => $payload])]);
$result = curl_exec($request);
$status = curl_getinfo($request, CURLINFO_HTTP_CODE);
curl_close($request);
if ($result === false || $status < 200 || $status >= 300) {
    http_response_code(502);
    exit(json_encode(['error' => 'Could not save map layout']));
}
echo $result;
