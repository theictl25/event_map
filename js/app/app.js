import { $ } from "../shared/config.js";
import { boothById, state } from "../shared/state.js";
import {
  injectIconsSVG,
  renderHeader,
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
  setupMapInteractions,
} from "./map.js";
import { loadShopsFromGoogleSheet } from "../shared/api.js";
import {
  populateCategoryDropdown,
  applyFilters,
  selectBooth,
  setupUIEventListeners,
  detailHTML,
} from "./ui.js";

function initApp() {
  // 1. Inject shared layout components to eliminate HTML code duplication
  injectIconsSVG();
  renderHeader();
  injectMainContent(); // Fills <main> with shared directory + map + detail HTML
  injectDialogs();

  // 2. Set up handler references and UI callbacks
  setSelectBoothHandler(selectBooth);

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
    });
  });

  setupUIEventListeners();
  setupMapInteractions();

  // 4. Initial render & Map Fit
  updateLanguageUI();
  fitMap();

  // 5. Select default booth or initial hash booth
  const initialId = location.hash.slice(1).toUpperCase();
  const defaultBooth = boothById.has(initialId)
    ? initialId
    : boothById.keys().next().value;
  selectBooth(defaultBooth);

  // 6. Check for URL search params (e.g. directions=1)
  const urlParams = new URLSearchParams(location.search);
  if (urlParams.get("directions") === "1" && state.selected) {
    const directionsBtn = document.querySelector('[data-action="directions"]');
    if (directionsBtn) directionsBtn.click();
  }
}

// Initialize application DOM
document.addEventListener("DOMContentLoaded", () => {
  initApp();
  // Fetch live booth data from Google Sheets API
  loadShopsFromGoogleSheet(() => {
    // This also redraws the map through the registered UI callback and
    // replaces Information-dialog text with the current event's Sheet data.
    updateLanguageUI();
    // The remote response may contain a map with different boundaries.
    // Refit after it has replaced the initial local layout.
    fitMap();

    const selectedId = state.selected;
    if (boothById.has(selectedId)) {
      selectBooth(selectedId);
    }
  });
});
