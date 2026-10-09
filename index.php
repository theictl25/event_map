<?php
require __DIR__ . '/lib/auth.php';

// Public pages never keep Manager access active. Returning to Manager after
// visiting the map will therefore require a fresh login.
if (!empty($_SESSION['eventmap_admin'])) {
    $_SESSION = [];
    session_destroy();
}

require_once __DIR__ . '/lib/stats.php';
$visitorCookie = 'eventmap_visitor_sid';
$vsid = $_COOKIE[$visitorCookie] ?? '';
if (empty($vsid)) {
    try {
        $vsid = bin2hex(random_bytes(6)) . dechex(time());
    } catch (\Throwable $_) {
        $vsid = uniqid('v', true);
    }
    setcookie($visitorCookie, $vsid, [
        'expires' => time() + 86400 * 30,
        'path' => '/',
        'httponly' => false,
        'samesite' => 'Lax',
        'secure' => (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off'),
    ]);
}
record_visitor_ping($vsid, 'ping');
?>
<!doctype html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="theme-color" content="#991b1e">
    <title data-i18n="docTitleHome">Event Map</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Noto+Sans+Lao:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="style.css">
</head>

<body>
    <header class="header"></header>
    <main class="layout"></main>
    <footer id="footer"></footer>
    <script type="module" src="js/app/app.js"></script>

</body>

</html>