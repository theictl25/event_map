<?php
require __DIR__ . '/lib/auth.php';
$error = '';
$config = app_config();
if (!is_admin_configured($config)) {
  http_response_code(500);
  $error = 'ยังไม่ได้ตั้งค่า Admin กรุณาแก้ admin_username และ admin_password_hash ใน config.php ก่อน';
}
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $user = $_POST['username'] ?? '';
  $password = $_POST['password'] ?? '';
  if (is_admin_configured($config)) {
    if (hash_equals($config['admin_username'], $user) && password_verify($password, $config['admin_password_hash'])) {
      session_regenerate_id(true);
      $_SESSION['eventmap_admin'] = true;
      header('Location: ' . app_url('manager.php'));
      exit;
    }
    $error = 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง';
  }
}
?>
<!doctype html>
<html lang="th">

<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Admin Login</title>
  <link rel="stylesheet" href="style.css">
</head>

<body>
  <main style="max-width:420px;margin:10vh auto;padding:18px">
    <form class="panel" method="post" style="padding:24px;display:grid;gap:14px">
      <h1>Event Map Admin</h1>
      <?php if ($error): ?><p style="color:#991b1e"><?= htmlspecialchars($error, ENT_QUOTES, 'UTF-8') ?></p><?php endif; ?>
      <label>Username</label>
      <input name="username" required>
      <label>Password</label>
      <input name="password" type="password" required>
      <button class="button primary">Login</button>
    </form>
  </main>
</body>

</html>
