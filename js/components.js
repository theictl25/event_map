import { $, isBoothsPage } from "./config.js";

/**
 * Dynamically injects shared SVG Icons into body to eliminate duplication
 */
export function injectIconsSVG() {
  if ($("#reusable-icons-svg")) return;

  const svgHTML = `
    <svg id="reusable-icons-svg" width="0" height="0" aria-hidden="true" style="position: absolute">
      <symbol id="i-pin" viewBox="0 0 24 24">
        <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </symbol>
      <symbol id="i-search" viewBox="0 0 24 24">
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m16 16 5 5" />
      </symbol>
      <symbol id="i-shop" viewBox="0 0 24 24">
        <path d="M4 21V4h16v17M2 21h20M8 8h2m4 0h2M8 12h2m4 0h2M10 21v-5h4v5" />
      </symbol>
      <symbol id="i-info" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v6m0-10h.01" />
      </symbol>
      <symbol id="i-clock" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </symbol>
      <symbol id="i-route" viewBox="0 0 24 24">
        <path d="m12 3 9 18-9-3-9 3 9-18Zm0 15v-7" />
      </symbol>
      <symbol id="i-share" viewBox="0 0 24 24">
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <path d="m9 10 6-3m-6 7 6 3" />
      </symbol>
    </svg>
  `;
  document.body.insertAdjacentHTML("afterbegin", svgHTML);
}

/**
 * Dynamically renders Header Navigation bar
 */
export function renderHeader() {
  const headerContainer = $("header.header");
  if (!headerContainer) return;

  headerContainer.innerHTML = `
    <div class="header-inner">
      <a class="brand" href="./index.html">
        <span class="brand-mark">
          <svg class="icon" aria-hidden="true">
            <use href="#i-pin" />
          </svg>
        </span>
        <div>
          <h1 data-i18n="brandTitle">EVENT MAP</h1>
          <p data-i18n="brandSubtitle">Find Your Favorite Booth</p>
        </div>
      </a>

      <div class="header-actions">
        <div class="lang-switcher" role="group" aria-label="Language Selector">
          <button type="button" class="lang-btn active" data-lang="lo" aria-label="ພາສາລາວ" aria-pressed="true">
            <span class="flag-icon">Lao</span>
          </button>
          <button type="button" class="lang-btn" data-lang="en" aria-label="English" aria-pressed="false">
            <span class="flag-icon">English</span>
          </button>
        </div>

        <nav class="navigation" aria-label="Main navigation">
          <a class="nav-button" id="nav-map" href="./index.html">
            <svg class="icon" aria-hidden="true">
              <use href="#i-pin"></use>
            </svg>
            <span class="nav-label" data-i18n="navMap">Map</span>
          </a>

          <a class="nav-button" id="nav-booths" href="./booths.html">
            <svg class="icon" aria-hidden="true">
              <use href="#i-shop"></use>
            </svg>
            <span class="nav-label" data-i18n="navBooths">All Booths</span>
          </a>

          <button class="nav-button" id="nav-info" type="button">
            <svg class="icon" aria-hidden="true">
              <use href="#i-info"></use>
            </svg>
            <span class="nav-label" data-i18n="navInfo">Information</span>
          </button>
        </nav>
      </div>
    </div>
  `;
}

/**
 * Dynamically injects Dialog Modals & Toast UI
 */
export function injectDialogs() {
  if ($("#app-dialogs-container")) return;

  const dialogsHTML = `
    <div id="app-dialogs-container">
      <dialog class="detail-dialog" id="detail-dialog" aria-label="Booth details">
        <div class="dialog-heading">
          <span data-i18n="dialogDetailsTitle">Booth details</span>
          <button class="close-button" id="close-detail" aria-label="Close booth details">
            ×
          </button>
        </div>
        <div id="mobile-detail"></div>
      </dialog>

      <dialog class="info-dialog" id="info-dialog" aria-labelledby="info-title">
        <h2 id="info-title" data-i18n="infoTitle">Welcome to Event Map</h2>
        <p data-i18n="infoText1">
          Search for a shop or booth number, tap a booth to see its details, and
          use the zone and category filters to explore.
        </p>
        <p data-i18n="infoText2">
          Drag to move the map. Pinch, scroll, or use the + and − buttons to zoom.
          Keyboard users can focus booths with Tab and open them with Enter.
        </p>
        <p data-i18n="infoText3">
          This is a demonstration venue. Store information and
          walking routes are illustrative, not live event or emergency guidance.
        </p>
        <form method="dialog">
          <button class="button primary" data-i18n="gotIt">Got it</button>
        </form>
      </dialog>

      <div class="toast" id="toast" role="status" hidden></div>
      <div class="sr-only" id="announcement" aria-live="polite"></div>
    </div>
  `;

  document.body.insertAdjacentHTML("beforeend", dialogsHTML);
}

/**
 * Dynamically injects the shared main page layout (Directory + Map + Detail panel).
 * This eliminates the HTML duplication between index.html and booths.html —
 * both pages are now thin shells; all repeated content lives here.
 */
export function injectMainContent() {
  const layout = document.querySelector("main.layout");
  // Guard: only inject if the layout is currently empty
  if (!layout || layout.children.length > 0) return;

  layout.innerHTML = `
    <!-- Booth directory list (left panel) -->
    <section class="panel directory" id="directory" aria-labelledby="directory-title">
      <div class="directory-heading">
        <h2 id="directory-title" data-i18n="directoryTitle">All Booths</h2>
        <span class="count" id="result-count" aria-live="polite"></span>
      </div>

      <div class="directory-list" id="booth-list"></div>

      <div class="directory-footer">
        <button class="link-button" id="view-all" data-i18n="viewAllBooths">
          View All Booths →
        </button>
      </div>
    </section>

    <!-- Map column (centre) -->
    <section class="map-column" id="map-section" aria-label="Interactive event map">
      <div class="search-toolbar">
        <div class="search-wrap">
          <label class="sr-only" for="search" data-i18n="searchLabel">Search shops or booth numbers</label>
          <svg class="icon" aria-hidden="true">
            <use href="#i-search" />
          </svg>
          <input type="search" id="search" placeholder="Search shops or booth numbers..."
            data-i18n-placeholder="searchPlaceholder" autocomplete="off" />
        </div>

        <label class="sr-only" for="category" data-i18n="categoryLabel">Category</label>
        <select id="category" class="category-select">
          <option value="all" data-i18n="catAll">All categories</option>
          <option value="Food &amp; Drink" data-i18n="catFood">Food &amp; Drink</option>
          <option value="Crafts" data-i18n="catCrafts">Crafts</option>
          <option value="Fashion" data-i18n="catFashion">Fashion</option>
          <option value="Plants" data-i18n="catPlants">Plants</option>
          <option value="Other" data-i18n="catOther">Other</option>
        </select>
      </div>

      <div class="zone-filters" id="zone-filters" aria-label="Filter by zone"></div>

      <div class="panel map-shell">
        <div class="map-viewport" id="viewport" tabindex="0"
          aria-label="Floor plan. Drag to pan, pinch or use controls to zoom. Arrow keys pan; plus and minus zoom.">
          <svg class="floor-svg" id="floor-svg" xmlns="http://www.w3.org/2000/svg" aria-label="Event floor plan">
            <defs>
              <marker id="route-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5"
                orient="auto-start-reverse">
                <path d="M0 0 10 5 0 10Z" fill="#991b1e" />
              </marker>
            </defs>

            <g id="world">
              <rect width="800" height="900" fill="#fff" />

              <rect x="245" y="35" width="310" height="75" rx="22" fill="#dfe3e9" stroke="#cbd1da" />
              <text x="400" y="65" text-anchor="middle" font-size="16" font-weight="750" fill="#394457"
                id="svg-main-stage" data-i18n="mainStage">MAIN STAGE</text>
              <text x="400" y="90" text-anchor="middle" font-size="22" fill="#59657a">♧</text>

              <path d="M45 125H755" stroke="#f0f2f6" />

              <!-- Aisles -->
              <g fill="#fafbfc">
                <rect x="93" y="235" width="22" height="573" rx="11" />
                <rect x="303" y="235" width="22" height="475" rx="11" />
                <rect x="513" y="235" width="22" height="475" rx="11" />
                <rect x="723" y="235" width="22" height="573" rx="11" />
                <rect x="94" y="797" width="651" height="22" rx="11" />
              </g>

              <text x="104" y="480" text-anchor="middle" font-size="9" fill="#a4acb9"
                transform="rotate(-90 104 480)" id="svg-walkway" data-i18n="walkway">WALKWAY</text>

              <g id="zone-labels"></g>
              <g id="booth-layer"></g>

              <path id="route-path" d="" fill="none" stroke="#991b1e" stroke-width="4" stroke-dasharray="7 7"
                stroke-linecap="round" stroke-linejoin="round" marker-end="url(#route-arrow)"
                pointer-events="none" />

              <g id="selection-pin" pointer-events="none" hidden>
                <path d="M0 0C-4-6-9-11-9-17a9 9 0 1 1 18 0C9-11 4-6 0 0Z" fill="#df3159"
                  stroke="white" stroke-width="2" />
                <circle cx="0" cy="-17" r="3" fill="white" />
              </g>

              <g id="gates"></g>
            </g>
          </svg>
        </div>


    <div class="map-bottom">

  <div class="legend">
    <span>
      <i class="legend-dot"></i>
      <span data-i18n="entranceLegend">Entrance</span>
    </span>

    <span>
      <i class="legend-dot exit"></i>
      <span data-i18n="exitLegend">Exit</span>
    </span>
  </div>

  <div class="map-actions">

    <div class="map-controls" aria-label="Map zoom controls">

      <button
        class="control-button"
        id="zoom-out"
        aria-label="Zoom out"
        data-i18n-aria="zoomOut"
      >
        −
      </button>

      <button
        class="control-button"
        id="zoom-in"
        aria-label="Zoom in"
        data-i18n-aria="zoomIn"
      >
        +
      </button>

      <button
        class="control-button fit"
        id="fit-map"
        aria-label="Fit entire map"
        data-i18n-aria="fitMap"
        title="Fit map"
      >
        ⛶
      </button>

    </div>

    <span class="zoom-value" id="zoom-label">100%</span>

  </div>

</div>
      </div>

      <p class="route-notice" id="route-notice" hidden></p>
    </section>

    <!-- Booth detail panel (right / desktop only) -->
    <aside class="panel desktop-detail" id="desktop-detail" aria-label="Selected booth details"></aside>
  `;
}
