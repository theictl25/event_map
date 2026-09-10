import { $ } from "./config.js";
import { boothById, state } from "./state.js";
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
import { loadShopsFromGoogleSheet } from "./api.js";
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
  const defaultBooth = boothById.has(initialId);
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
    buildMapData(populateCategoryDropdown);
    renderMap(applyFilters);
    applyFilters();

    const selectedId = state.selected;
    if (boothById.has(selectedId)) {
      selectBooth(selectedId);
    }
  });
});
