<?php

declare(strict_types=1);

// Do not share PHP's default PHPSESSID cookie with other local PHP projects.
// The Manager page and its save API must always read the same EventMap session.
session_name('eventmap_manager_session');
session_set_cookie_params([
  'path' => '/',
  'httponly' => true,
  'samesite' => 'Lax',
  'secure' => (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off'),
]);
session_start();

function app_config(): array
{
  $file = dirname(__DIR__) . '/config.php';
  if (!is_file($file)) {
    http_response_code(500);
    exit('Server configuration is incomplete.');
  }
  $config = require $file;
  if (!is_array($config)) {
    http_response_code(500);
    exit('Server configuration is invalid.');
  }
  return $config;
}

function app_base_url(): string
{
  $projectRoot = str_replace('\\', '/', realpath(dirname(__DIR__)) ?: dirname(__DIR__));
  $documentRoot = str_replace('\\', '/', realpath($_SERVER['DOCUMENT_ROOT'] ?? '') ?: '');
  return ($documentRoot && str_starts_with($projectRoot, $documentRoot))
    ? rtrim(substr($projectRoot, strlen($documentRoot)), '/')
    : '';
}

function app_url(string $path): string
{
  return app_base_url() . '/' . ltrim($path, '/');
}

function is_admin_configured(array $config): bool
{
  return !empty($config['admin_username'])
    && $config['admin_username'] !== 'change-me'
    && !empty($config['admin_password_hash'])
    && $config['admin_password_hash'] !== 'PASTE_PASSWORD_HASH_HERE';
}

function require_admin(): void
{
  if (empty($_SESSION['eventmap_admin'])) {
    header('Location: ' . app_url('login.php'));
    exit;
  }
}
