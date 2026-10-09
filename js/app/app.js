import { $ } from "../shared/config.js";
import { boothById, state } from "../shared/state.js";
import {
  injectIconsSVG,
  renderHeader,
  renderEvent,
  injectDialogs,
  injectMainContent,
} from "./components.js";
import {
  setLanguage,
  updateLanguageUI,
  registerUIUpdateCallback,
  t,
} from "./i18n.js";
import {
  buildMapData,
  renderMap,
  fitMap,
  setSelectBoothHandler,
  setClearSelectionHandler,
  setupMapInteractions,
} from "./map.js";
import {
  loadShopsFromGoogleSheet,
  trackVisitorSession,
} from "../shared/api.js";
import {
  populateCategoryDropdown,
  applyFilters,
  selectBooth,
  clearSelectedBooth,
  setupUIEventListeners,
  detailHTML,
  initDetailDrag,
  initDetailBackdrop,
} from "./ui.js";

function setMapLoading(isLoading) {
  const overlay = $("#map-loading");
  if (overlay) overlay.hidden = !isLoading;
}

function initApp() {
  // 1. Inject shared layout components to eliminate HTML code duplication
  injectIconsSVG();
  renderHeader();
  injectMainContent(); // Fills <main> with shared directory + map + detail HTML
  injectDialogs();
  initDetailDrag();
  initDetailBackdrop();

  // 2. Set up handler references and UI callbacks
  setSelectBoothHandler(selectBooth);
  setClearSelectionHandler(clearSelectedBooth);

  registerUIUpdateCallback(() => {
    buildMapData(populateCategoryDropdown);
    renderMap(applyFilters);
    applyFilters();

    if (state.selected && boothById.has(state.selected)) {
      const booth = boothById.get(state.selected);
      const desktopDetail = $("#desktop-detail");
      const mobileDetail = $("#mobile-detail");
      if (desktopDetail) desktopDetail.innerHTML = detailHTML(booth);
      if (mobileDetail) mobileDetail.innerHTML = detailHTML(booth);
    }
  });

  // 3. Set up event listeners for Language Buttons, Search, Filters, Map
  document.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const lang = e.currentTarget.dataset.lang;
      if (lang) setLanguage(lang);
      renderEvent();
    });
  });

  setupUIEventListeners();
  setupMapInteractions();

  // 4. Initial render & Map Fit
  fitMap();

  // 5. Select only an explicitly linked booth. A normal page load starts
  // without a selected booth, including after a browser refresh.
  const initialId = location.hash.slice(1).toUpperCase();
  if (boothById.has(initialId)) selectBooth(initialId);
}

// Initialize application DOM
document.addEventListener("DOMContentLoaded", () => {
  initApp();
  trackVisitorSession();
  // Fetch live booth data from Google Sheets API
  setMapLoading(true);
  loadShopsFromGoogleSheet(() => {
    renderEvent();
    // This also redraws the map through the registered UI callback and
    // replaces Information-dialog text with the current event's Sheet data.
    updateLanguageUI();
    // The remote response may contain a map with different boundaries.
    // Refit after it has replaced the initial local layout.
    fitMap();

    // Re-select booth from URL hash after fresh data is loaded
    const hashId = location.hash.slice(1).toUpperCase();
    if (boothById.has(hashId)) {
      selectBooth(hashId, false, true);

      // Trigger directions if redirected from booths page with ?directions=1
      const urlParams = new URLSearchParams(location.search);
      if (urlParams.get("directions") === "1") {
        const directionsBtn = document.querySelector(
          '[data-action="directions"]',
        );
        if (directionsBtn) directionsBtn.click();
      }
    }
  }).finally(() => setMapLoading(false));
});
