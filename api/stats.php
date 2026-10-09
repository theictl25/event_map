<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');

$requestMethod = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if (isset($_SERVER['HTTP_ORIGIN'])) {
    header('Access-Control-Allow-Origin: ' . $_SERVER['HTTP_ORIGIN']);
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
}
if ($requestMethod === 'OPTIONS') {
    exit;
}

require_once dirname(__DIR__) . '/lib/stats.php';

$action = $_GET['action'] ?? $_POST['action'] ?? 'getStats';
$sid = trim((string)($_GET['sid'] ?? $_POST['sid'] ?? ''));

if ($sid === '' && $requestMethod === 'POST') {
    $raw = @file_get_contents('php://input');
    if ($raw) {
        $parsed = json_decode($raw, true);
        if (is_array($parsed)) {
            $sid = trim((string)($parsed['sid'] ?? ''));
            if (!empty($parsed['action'])) {
                $action = (string)$parsed['action'];
            }
        }
    }
}

// Fallback to cookie if sid was not sent in query or body
if ($sid === '' && !empty($_COOKIE['eventmap_visitor_sid'])) {
    $sid = trim((string)$_COOKIE['eventmap_visitor_sid']);
}

// If ping without sid, generate a new sid and set cookie
if ($sid === '' && $action === 'ping') {
    try {
        $sid = bin2hex(random_bytes(6)) . dechex(time());
    } catch (\Throwable $_) {
        $sid = uniqid('v', true);
    }
    setcookie('eventmap_visitor_sid', $sid, [
        'expires' => time() + 86400 * 30,
        'path' => '/',
        'httponly' => false,
        'samesite' => 'Lax',
        'secure' => (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off'),
    ]);
}

if ($action === 'ping' || $action === 'leave') {
    $result = record_visitor_ping($sid, $action);
    echo json_encode($result, JSON_UNESCAPED_UNICODE);
    exit;
}

$stats = get_visitor_stats();
echo json_encode($stats, JSON_UNESCAPED_UNICODE);
exit;
