import "./manager.js";
import { managerT } from "./manager-i18n.js";
import { fetchVisitorStats } from "../shared/api.js";

const STATS_CACHE_KEY = "eventmap_manager_stats_cache";

function renderStats(data) {
  if (!data) return;
  const onlineEl = document.querySelector("#stat-online-val");
  const totalEl = document.querySelector("#stat-total-val");
  const peakEl = document.querySelector("#stat-peak-val");

  if (onlineEl && data.online !== undefined) {
    onlineEl.textContent = Number(data.online).toLocaleString();
  }
  if (totalEl && data.totalViews !== undefined) {
    totalEl.textContent = Number(data.totalViews).toLocaleString();
  }
  if (peakEl && data.peak !== undefined) {
    peakEl.textContent = Number(data.peak).toLocaleString();
  }
}

// Immediately render cached stats from previous fetch so numbers show without delay
try {
  const cached = JSON.parse(sessionStorage.getItem(STATS_CACHE_KEY) || "null");
  if (cached) renderStats(cached);
} catch (_) {}

let isRefreshingStats = false;
async function refreshManagerStats() {
  if (isRefreshingStats) return;
  const onlineEl = document.querySelector("#stat-online-val");
  if (!onlineEl) return;

  const statsContainer = document.querySelector("#manager-stats");
  if (statsContainer) statsContainer.classList.add("refreshing");

  isRefreshingStats = true;
  try {
    const data = await fetchVisitorStats();
    if (data && data.ok) {
      renderStats(data);
      try {
        sessionStorage.setItem(STATS_CACHE_KEY, JSON.stringify(data));
      } catch (_) {}
    }
  } catch (error) {
    console.debug("Could not refresh visitor stats:", error);
  } finally {
    isRefreshingStats = false;
    if (statsContainer) {
      setTimeout(() => statsContainer.classList.remove("refreshing"), 250);
    }
  }
}

// Initial fetch and periodic polling (every 10s for real-time updates)
refreshManagerStats();
setInterval(refreshManagerStats, 10000);
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    refreshManagerStats();
  }
});

// Click on stats widget to refresh immediately
const statsContainer = document.querySelector("#manager-stats");
if (statsContainer) {
  statsContainer.addEventListener("click", () => {
    refreshManagerStats();
  });
}

function setMapSaveLoading(isSaving) {
  const overlay = document.querySelector("#manager-map-loading");
  const text = document.querySelector("#manager-map-loading-text");
  if (!overlay) return;

  if (text) text.textContent = managerT("saving");
  overlay.hidden = !isSaving;
}

document.addEventListener("eventmap:save-layout", async (event) => {
  const message = document.querySelector("#manager-message");
  setMapSaveLoading(true);
  try {
    const response = await fetch("./api/admin/save-map.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(event.detail),
    });
    const body = await response.text();
    let data;
    try {
      data = JSON.parse(body);
    } catch {
      if (response.redirected || /\/login\.php(?:[?#]|$)/.test(response.url)) {
        throw new Error(
          "Your Manager session has ended. Please sign in again.",
        );
      }
      const stripped = body.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      if (stripped && stripped.length > 0 && stripped.length < 200 && !/<!doctype/i.test(body)) {
        throw new Error(stripped);
      }
      throw new Error(managerT("invalidServerResponse"));
    }
    if (!response.ok || !data.ok)
      throw new Error(data.error || managerT("saveFailedServer"));
    message.textContent = managerT("saved");
    document.dispatchEvent(new CustomEvent("eventmap:layout-saved"));
  } catch (error) {
    message.textContent = `${managerT("saveFailed")} ${error.message}`;
  } finally {
    setMapSaveLoading(false);
  }
});

// Panel toggle buttons (desktop only ≥1200px)
(function initPanelToggles() {
  const builder = document.querySelector('.manager-builder');
  const btnSidebar = document.querySelector('#toggle-sidebar');
  const btnInspector = document.querySelector('#toggle-inspector');
  if (!builder || !btnSidebar || !btnInspector) return;

  const KEY_SIDEBAR = 'mgr_hide_sidebar';
  const KEY_INSPECTOR = 'mgr_hide_inspector';

  function applyState(hideSidebar, hideInspector) {
    builder.classList.toggle('hide-sidebar', hideSidebar);
    builder.classList.toggle('hide-inspector', hideInspector);
    btnSidebar.setAttribute('aria-pressed', String(hideSidebar));
    btnInspector.setAttribute('aria-pressed', String(hideInspector));
    // Flip arrows: collapsed = point inward to expand, expanded = point outward to collapse
    btnSidebar.innerHTML   = hideSidebar  ? '&#8250;' : '&#8249;';
    btnInspector.innerHTML = hideInspector ? '&#8249;' : '&#8250;';
    try {
      sessionStorage.setItem(KEY_SIDEBAR, hideSidebar ? '1' : '');
      sessionStorage.setItem(KEY_INSPECTOR, hideInspector ? '1' : '');
    } catch (_) {}
    // Notify map to re-fit after layout shift
    setTimeout(() => document.dispatchEvent(new CustomEvent('eventmap:panel-toggled')), 220);
  }

  // Restore saved state
  try {
    const s = !!sessionStorage.getItem(KEY_SIDEBAR);
    const i = !!sessionStorage.getItem(KEY_INSPECTOR);
    applyState(s, i);
  } catch (_) { applyState(false, false); }

  btnSidebar.addEventListener('click', () => {
    applyState(!builder.classList.contains('hide-sidebar'), builder.classList.contains('hide-inspector'));
  });
  btnInspector.addEventListener('click', () => {
    applyState(builder.classList.contains('hide-sidebar'), !builder.classList.contains('hide-inspector'));
  });
})();
