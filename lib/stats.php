<?php

declare(strict_types=1);

/**
 * Visitor statistics helper for Event Map.
 * Provides real-time concurrent visitor tracking and total visit counts.
 * Optimized for cPanel shared hosting with file locking (flock).
 */

function stats_storage_file(): string
{
    $dataDir = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'data';
    if (!is_dir($dataDir)) {
        @mkdir($dataDir, 0755, true);
        if (is_dir($dataDir)) {
            // Block direct web access to data files on Apache / cPanel
            $htaccess = $dataDir . DIRECTORY_SEPARATOR . '.htaccess';
            if (!is_file($htaccess)) {
                @file_put_contents(
                    $htaccess,
                    "<IfModule mod_authz_core.c>\n  Require all denied\n</IfModule>\n<IfModule !mod_authz_core.c>\n  Deny from all\n</IfModule>\n"
                );
            }
            $indexHtml = $dataDir . DIRECTORY_SEPARATOR . 'index.html';
            if (!is_file($indexHtml)) {
                @file_put_contents($indexHtml, '');
            }
        }
    }

    if (is_dir($dataDir) && is_writable($dataDir)) {
        return $dataDir . DIRECTORY_SEPARATOR . 'visitor_stats.json';
    }

    // Fallback to system temp directory if project folder is read-only
    return sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'eventmap_visitor_stats.json';
}

function get_visitor_stats(): array
{
    $file = stats_storage_file();
    $cutoff = time() - 90; // 90-second activity window

    $default = [
        'ok' => true,
        'online' => 0,
        'totalViews' => 0,
        'peak' => 0,
    ];

    if (!is_file($file)) {
        return $default;
    }

    $fp = @fopen($file, 'r');
    if (!$fp) {
        return $default;
    }

    $data = null;
    if (flock($fp, LOCK_SH)) {
        $content = stream_get_contents($fp);
        flock($fp, LOCK_UN);
        if ($content !== false && $content !== '') {
            $data = json_decode($content, true);
        }
    }
    fclose($fp);

    if (!is_array($data)) {
        return $default;
    }

    $sessions = is_array($data['sessions'] ?? null) ? $data['sessions'] : [];
    $activeCount = 0;
    foreach ($sessions as $lastSeen) {
        if ((int)$lastSeen >= $cutoff) {
            $activeCount++;
        }
    }

    $peak = max((int)($data['peak'] ?? 0), $activeCount);
    $totalViews = max((int)($data['totalViews'] ?? 0), $peak);

    return [
        'ok' => true,
        'online' => $activeCount,
        'totalViews' => $totalViews,
        'peak' => $peak,
    ];
}

function record_visitor_ping(string $sid, string $action = 'ping'): array
{
    $file = stats_storage_file();
    $now = time();
    $cutoff = $now - 90;

    $fp = @fopen($file, 'c+');
    if (!$fp) {
        return get_visitor_stats();
    }

    if (flock($fp, LOCK_EX)) {
        $data = [
            'totalViews' => 0,
            'peak' => 0,
            'peakTime' => '',
            'sessions' => [],
            'visited' => [],
        ];

        rewind($fp);
        $content = stream_get_contents($fp);
        if ($content !== false && trim($content) !== '') {
            $parsed = json_decode($content, true);
            if (is_array($parsed)) {
                $data['totalViews'] = (int)($parsed['totalViews'] ?? 0);
                $data['peak'] = (int)($parsed['peak'] ?? 0);
                $data['peakTime'] = (string)($parsed['peakTime'] ?? '');
                $data['sessions'] = is_array($parsed['sessions'] ?? null) ? $parsed['sessions'] : [];
                $data['visited'] = is_array($parsed['visited'] ?? null) ? $parsed['visited'] : [];
            }
        }

        // Clean expired active sessions (90s for real-time online count)
        $cleanedSessions = [];
        foreach ($data['sessions'] as $k => $ts) {
            if ((int)$ts >= $cutoff) {
                $cleanedSessions[(string)$k] = (int)$ts;
            }
        }
        $data['sessions'] = $cleanedSessions;

        // Clean expired visited history (24 hours TTL for unique visitors)
        $cleanedVisited = [];
        $visitedCutoff = $now - 86400;
        foreach ($data['visited'] as $k => $ts) {
            if ((int)$ts >= $visitedCutoff) {
                $cleanedVisited[(string)$k] = (int)$ts;
            }
        }
        $data['visited'] = $cleanedVisited;

        $sid = trim($sid);
        if ($action === 'leave') {
            if ($sid !== '') {
                // When leaving or switching pages, remove from active online sessions only
                unset($data['sessions'][$sid]);
            }
        } else {
            // Action is ping: only count as a new visitor if not seen in the last 24h
            if ($sid !== '') {
                if (!isset($data['visited'][$sid])) {
                    $data['totalViews']++;
                }
                $data['visited'][$sid] = $now;
                $data['sessions'][$sid] = $now;
            }
        }

        $online = count($data['sessions']);
        if ($online > $data['peak']) {
            $data['peak'] = $online;
            $data['peakTime'] = date('c');
        }

        if ($data['peak'] > $data['totalViews']) {
            $data['totalViews'] = $data['peak'];
        }

        ftruncate($fp, 0);
        rewind($fp);
        fwrite($fp, (string)json_encode($data, JSON_UNESCAPED_UNICODE));
        fflush($fp);
        flock($fp, LOCK_UN);
        fclose($fp);

        return [
            'ok' => true,
            'online' => $online,
            'totalViews' => $data['totalViews'],
            'peak' => $data['peak'],
        ];
    }

    fclose($fp);
    return get_visitor_stats();
}
