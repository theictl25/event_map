<?php

require __DIR__ . '/lib/auth.php';
require_admin();
require_once __DIR__ . '/lib/stats.php';

$initialStats = get_visitor_stats();
?>
<!doctype html>
<html lang="en">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Event Map Manager</title>
    <link rel="stylesheet" href="style.css">
    <link rel="stylesheet" href="manager.css">
</head>

<body class="manager-page">
    <header class="header manager-header">
        <div class="header-inner">
            <a class="brand" href="./index.php">
                <span class="brand-mark">
                    <img src="./assets/default_logo.png" class="logo" alt="">
                </span>
                <span>
                    <strong data-manager-i18n="managerTitle">Map Manager</strong>
                </span>
            </a>

            <div class="manager-actions">
                <div class="manager-stats" id="manager-stats" aria-label="Visitor statistics" title="Click to refresh statistics">
                    <div class="stat-badge stat-online" title="Real-time online visitors">
                        <span class="stat-pulse" aria-hidden="true"></span>
                        <span class="stat-label" data-manager-i18n="visitorsOnline">Online</span>
                        <span class="stat-value" id="stat-online-val"><?= number_format($initialStats['online']) ?></span>
                    </div>
                    <div class="stat-badge stat-total" title="Total website visitors">
                        <span class="stat-icon" aria-hidden="true">👥</span>
                        <span class="stat-label" data-manager-i18n="visitorsTotal">Total</span>
                        <span class="stat-value" id="stat-total-val"><?= number_format($initialStats['totalViews']) ?></span>
                    </div>
                    <div class="stat-badge stat-peak" title="Peak concurrent visitors">
                        <span class="stat-icon" aria-hidden="true">🏆</span>
                        <span class="stat-label" data-manager-i18n="visitorsPeak">Peak</span>
                        <span class="stat-value" id="stat-peak-val"><?= number_format($initialStats['peak']) ?></span>
                    </div>
                </div>

                <div class="lang-switcher" role="group" aria-label="Language selector">
                    <button type="button" class="lang-btn" data-lang="lo" aria-label="ພາສາລາວ">ລາວ</button>
                    <button type="button" class="lang-btn" data-lang="en" aria-label="English">English</button>
                </div>
                <div class="action">
                    <a class="nav-button" href="./index.php" data-manager-i18n="viewMap">View map</a>
                    <a class="nav-button manager-sign-out" href="./logout.php" data-manager-i18n="signOut">Sign out</a>
                </div>
            </div>
        </div>
    </header>
    <main class="manager">
        <section class="panel manager-settings" aria-labelledby="map-boundaries-title">
            <h2 id="map-boundaries-title" data-manager-i18n="mapBounds">Map boundaries</h2>

            <label>
                <span data-manager-i18n="width">Width</span>
                <input id="map-width" type="number" min="100">
            </label>
            <label>
                <span data-manager-i18n="height">Height</span>
                <input id="map-height" type="number" min="100">
            </label>
            <label>
                <span data-manager-i18n="grid">Grid</span>
                <input id="grid-size" type="number" min="5">
            </label>
            <button class="button primary" id="save-map" type="button" data-manager-i18n="saveForEveryone">
                Save for everyone
            </button>
            <button class="button" id="new-map" type="button" data-manager-i18n="newBlankMap">
                Start a new blank map
            </button>

            <p id="manager-message" role="status"></p>
        </section>

        <section class="manager-builder">
            <aside class="panel manager-sidebar" aria-labelledby="layers-title">
                <section class="manager-layers">
                    <div class="manager-panel-heading">
                        <h2 id="layers-title" data-manager-i18n="layers">Layers</h2>
                        <p data-manager-i18n="layersHint">Top items appear in front.</p>

                    </div>
                    <div id="layers-list"></div>
                </section>
            </aside>

            <section class="manager-editor" aria-labelledby="map-builder-title">
                <section class="panel manager-preview-panel">
                    <header class="manager-preview-heading">
                        <div>
                            <h2 id="map-builder-title" data-manager-i18n="mapBuilder">Map Builder</h2>
                            <p data-manager-i18n="builderHint">
                                Select mode moves items. Use Pan map or hold Space to move around a zoomed map.
                            </p>
                        </div>
                    </header>

                    <section class="manager-canvas-add" aria-labelledby="add-elements-title">
                        <div class="manager-panel-heading">
                            <h3 id="add-elements-title" data-manager-i18n="addElements">Add elements</h3>
                            <p data-manager-i18n="addHelp">Add an item, then drag it on the grid.</p>
                        </div>
                        <div id="element-palette"></div>
                    </section>

                    <div class="manager-preview-wrap">
                        <button class="map-side-toggle map-side-toggle--left" id="toggle-sidebar" type="button" aria-pressed="false" title="Toggle Layers panel">&#8249;</button>
                        <button class="map-side-toggle map-side-toggle--right" id="toggle-inspector" type="button" aria-pressed="false" title="Toggle Properties panel">&#8250;</button>
                        <svg
                            id="manager-preview"
                            preserveAspectRatio="xMidYMid meet"
                            data-manager-i18n-aria="canvasLabel"
                            aria-label="Map editing area"></svg>
                        <div class="manager-map-loading" id="manager-map-loading" role="status" aria-live="polite" hidden>
                            <span class="manager-map-loading-spinner" aria-hidden="true"></span>
                            <span id="manager-map-loading-text"></span>
                        </div>
                    </div>

                    <footer class="manager-map-bottom">
                        <div class="manager-map-actions">
                            <button class="button" id="pan-mode" type="button" aria-pressed="false" data-manager-i18n="panMap">
                                Pan map
                            </button>
                            <button class="button" id="center-element" type="button" data-manager-i18n="centerSelected">
                                Center selected
                            </button>
                            <button class="button" id="undo-map" type="button" data-manager-i18n="undo">Undo</button>
                            <button class="button" id="redo-map" type="button" data-manager-i18n="forward">Forward</button>
                            <button class="button" id="preview-map" type="button" data-manager-i18n="previewMap">Preview</button>
                            <button class="button" id="export-map" type="button" data-manager-i18n="exportMap">Export PNG</button>
                        </div>

                        <div class="manager-map-view">
                            <div class="map-controls" aria-label="Map zoom controls">
                                <button class="control-button" id="manager-zoom-out" type="button" aria-label="Zoom out">−</button>
                                <button class="control-button" id="manager-zoom-in" type="button" aria-label="Zoom in">+</button>
                                <button class="control-button fit" id="manager-fit-map" type="button" aria-label="Fit map">⛶</button>
                            </div>
                            <span class="zoom-value" id="manager-zoom-label">100%</span>
                        </div>
                    </footer>
                </section>
            </section>

            <aside class="panel manager-inspector" id="element-inspector" aria-label="Element properties"></aside>
        </section>
    </main>

    <dialog class="info-dialog manager-preview-dialog" id="map-preview-dialog">
        <div class="dialog-heading">
            <span data-manager-i18n="previewMap">Preview</span>
            <button class="close-button" id="close-map-preview" type="button" aria-label="Close">×</button>
        </div>
        <div class="manager-preview-image" id="map-preview-image"></div>
    </dialog>

    <script type="module" src="js/admin/admin-manager.js"></script>
</body>

</html>