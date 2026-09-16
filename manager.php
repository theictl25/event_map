<?php require __DIR__ . '/lib/auth.php';
require_admin(); ?>
<!doctype html>
<html lang="th">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Event Map Manager</title>
    <link rel="stylesheet" href="style.css">
    <link rel="stylesheet" href="manager.css">
</head>

<body class="manager-page">
    <main class="manager">
        <div class="manager-heading">
            <div>
                <h1>Map Manager</h1>
                <p>เฉพาะผู้จัดการที่เข้าสู่ระบบ</p>
            </div>
            <div><a class="button" href="./index.php">ดูแผนที่</a> <a class="button" href="./logout.php">ออกจากระบบ</a></div>
        </div>
        <section class="panel manager-settings">
            <h2>ขนาดแผนที่</h2><label>ความกว้าง <input id="map-width" type="number" min="100"></label><label>ความสูง <input id="map-height" type="number" min="100"></label><button class="button primary" id="save-map">บันทึกสำหรับทุกคน</button><button class="button" id="reset-map">คืนค่าเริ่มต้น</button>
            <p id="manager-message" role="status"></p>
        </section>
        <section class="panel manager-preview-panel">
            <h2>ตัวอย่างแผนที่</h2>
            <div class="manager-preview-wrap"><svg id="manager-preview"></svg></div>
        </section>
        <section class="panel manager-table-panel">
            <h2>ตำแหน่งบูท</h2>
            <div class="manager-table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th>Booth</th>
                            <th>Zone</th>
                            <th>X</th>
                            <th>Y</th>
                            <th>Width</th>
                            <th>Height</th>
                        </tr>
                    </thead>
                    <tbody id="booth-editor"></tbody>
                </table>
            </div>
        </section>
    </main>
    <script type="module" src="js/admin-manager.js"></script>
</body>

</html>