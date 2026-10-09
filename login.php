<?php
require __DIR__ . '/lib/auth.php';
$error = '';
$config = app_config();
if (!is_admin_configured($config)) {
  http_response_code(500);
  $error = 'Admin not yet configured. Please update admin_username and admin_password_hash in config.php first.';
}
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $user = $_POST['username'] ?? '';
  $password = $_POST['password'] ?? '';
  if (is_admin_configured($config)) {
    if (hash_equals($config['admin_username'], $user) && password_verify($password, $config['admin_password_hash'])) {
      session_regenerate_id(true);
      $_SESSION['eventmap_admin'] = true;
      // Commit the new session before redirecting. This ensures the first API
      // request from Manager receives the same authenticated session cookie.
      session_write_close();
      header('Location: ' . app_url('manager.php'), true, 303);
      exit;
    }
    $error = 'Incorrect username or password.';
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
      <input name="password" type="password" id="password" required>
      <div class="show-pass"><input type="checkbox" onclick="showPassword()">Show Password</div>
      <button class="button primary">Login</button>
    </form>
  </main>
  <script>
    function showPassword() {
      var x = document.getElementById("password");
      if (x.type === "password") {
        x.type = "text";
      } else {
        x.type = "password";
      }
    }
  </script>
</body>

</html>