import { $, isBoothsPage, desktopQuery, reducedMotion } from "./config.js";
import { state, booths, boothElements, boothById } from "./state.js";
import { t, getCategoryName } from "./i18n.js";
import { centerBooth, fitMap, routeFromEntrance } from "./map.js";

function getBoothLogo(booth) {
  const defaultLogo = "./assets/default_logo.png";

  const logo = String(booth.logo ?? "").trim();

  return logo || defaultLogo;
}
export function icon(name) {
  return `<svg class="icon" aria-hidden="true"><use href="#i-${name}"/></svg>`;
}

export function escapeHTML(value) {
  return String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character],
  );
}

function getSafeFacebookURL(value) {
  try {
    const url = new URL(String(value || "").trim());
    return /^https?:$/.test(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

export function populateCategoryDropdown() {
  const select = $("#category");
  if (!select) return;

  const currentSelection = state.category;
  const uniqueCategories = Array.from(
    new Set(booths.map((b) => b.category).filter(Boolean)),
  ).sort((a, b) =>
    getCategoryName(a).localeCompare(
      getCategoryName(b),
      state.lang === "lo" ? "lo" : "en",
    ),
  );

  select.replaceChildren();

  const allOption = document.createElement("option");
  allOption.value = "all";
  allOption.dataset.i18n = "catAll";
  allOption.textContent = t("catAll");
  select.append(allOption);

  uniqueCategories.forEach((cat) => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = getCategoryName(cat);
    select.append(option);
  });

  if (
    currentSelection === "all" ||
    uniqueCategories.includes(currentSelection)
  ) {
    select.value = currentSelection;
  } else {
    select.value = "all";
    state.category = "all";
  }
}

export function filteredBooths() {
  return booths.filter((booth) => {
    const categoryName = getCategoryName(booth.category);
    const searchable =
      `${booth.id} ${booth.name} Zone ${booth.zone} ໂຊນ ${booth.zone} ${booth.category} ${categoryName} ${booth.description}`.toLowerCase();

    return (
      searchable.includes(state.query) &&
      (state.zone === "all" || booth.zone === state.zone) &&
      (state.category === "all" || booth.category === state.category)
    );
  });
}

export function renderList(results) {
  const container = $("#booth-list");
  if (!container) return;
  container.replaceChildren();

  const resultCount = $("#result-count");
  if (resultCount) resultCount.textContent = t("boothCount", results.length);

  if (!results.length) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = t("noBooths");
    container.append(empty);
    return;
  }

  const sorted = [...results].sort(
    (a, b) =>
      Number(b.featured) - Number(a.featured) || a.id.localeCompare(b.id),
  );

  sorted.forEach((booth) => {
    const logo = getBoothLogo(booth);
    const card = document.createElement("button");
    card.className = "shop-card";
    card.dataset.id = booth.id;
    card.classList.toggle("selected", booth.id === state.selected);
    card.setAttribute("aria-pressed", String(booth.id === state.selected));

    const zoneText =
      state.lang === "lo" ? `ໂຊນ ${booth.zone}` : `Zone ${booth.zone}`;
    const categoryName = getCategoryName(booth.category);

    card.innerHTML = `
      <span class="shop-logo" style="--logo-bg:${booth.color}">
  <img
    src="${escapeHTML(logo)}"
    alt="${escapeHTML(booth.name)} logo"
    loading="lazy"
     onerror="this.onerror=null; this.src='./assets/default_logo.png';"
  >
</span>
      <span class="shop-text">
        <span class="shop-title">
          <span class="small-badge">${booth.id}</span>
          ${escapeHTML(booth.name)}
        </span>
        <span class="shop-meta" style="display:block">
          ${zoneText} · ${escapeHTML(categoryName)}
        </span>
      </span>
    `;

    card.addEventListener("click", () => {
      selectBooth(booth.id, true, true);
    });

    container.append(card);
  });
}

export function applyFilters(centerSearch = false) {
  const results = filteredBooths();
  const ids = new Set(results.map((booth) => booth.id));

  renderList(results);

  document.querySelectorAll(".zone-chip").forEach((button) => {
    const active = button.dataset.zone === state.zone;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });

  booths.forEach((booth) => {
    const element = boothElements.get(booth.id);
    if (element) {
      element.classList.toggle("muted-booth", !ids.has(booth.id));
      element.classList.toggle(
        "match",
        Boolean(state.query) && ids.has(booth.id),
      );
    }
  });

  if (centerSearch && state.query && results.length) {
    const exact = results.find(
      (booth) =>
        booth.id.toLowerCase() === state.query ||
        booth.name.toLowerCase() === state.query,
    );

    selectBooth((exact || results[0]).id, false, true);
  }

  const announce = $("#announcement");
  if (announce) announce.textContent = t("boothsFoundAnnounce", results.length);
}

export function resetFilters() {
  state.query = "";
  state.zone = "all";
  state.category = "all";

  const searchInput = $("#search");
  if (searchInput) searchInput.value = "";

  const categorySelect = $("#category");
  if (categorySelect) categorySelect.value = "all";

  applyFilters();
}

export function detailHTML(booth) {
  const logo = getBoothLogo(booth);
  const zoneText =
    state.lang === "lo" ? `ໂຊນ ${booth.zone}` : `Zone ${booth.zone}`;
  const boothText =
    state.lang === "lo" ? `ບູທ ${booth.id}` : `Booth ${booth.id}`;
  const categoryName = getCategoryName(booth.category);
  const facebookURL = getSafeFacebookURL(booth.facebook);
  const facebookHTML = facebookURL
    ? `
        <div class="fact">
          <span aria-hidden="true">f</span>
          <a href="${escapeHTML(facebookURL)}" target="_blank" rel="noopener noreferrer">${t("facebook")}</a>
        </div>`
    : "";

  return `
    <div class="detail-top">
      <span class="detail-badge">${booth.id}</span>
      <span class="detail-category">${escapeHTML(categoryName)}</span>
    </div>

    <div class="detail-body">
      <h2>${escapeHTML(booth.name)}</h2>

      <div class="detail-hero" style="--hero-bg:${booth.color}">
        <span class="hero-logo">
  <img
    src="${escapeHTML(logo)}"
    alt="${escapeHTML(booth.name)} logo"
     onerror="this.onerror=null; this.src='./assets/default_logo.png';"
  >
</span>
        <span class="hero-caption">${escapeHTML(categoryName)}</span>
      </div>

      <section class="detail-section">
        <h3>${t("aboutTitle")}</h3>
        <p class="description">${escapeHTML(booth.description)}</p>
      </section>

      <div class="detail-facts">
        <div class="fact">
          ${icon("pin")}
          <span><strong>${zoneText}</strong> | ${boothText}</span>
        </div>
        <div class="fact">
          ${icon("clock")}
          <span>${escapeHTML(booth.hours)}</span>
        </div>
        ${facebookHTML}
      </div>
    </div>

    <div class="detail-actions">
      <button class="button primary" data-action="directions">
        ${icon("route")} ${t("getDirections")}
      </button>
      <button class="button" data-action="share">
        ${icon("share")} ${t("shareBooth")}
      </button>
    </div>
  `;
}

export function selectBooth(id, openMobile = false, center = false) {
  const booth = boothById.get(id);
  if (!booth) return;

  if (state.selected !== id) {
    const routePath = $("#route-path");
    const routeNotice = $("#route-notice");
    if (routePath) routePath.setAttribute("d", "");
    if (routeNotice) routeNotice.hidden = true;
  }

  state.selected = id;

  const desktopDetail = $("#desktop-detail");
  const mobileDetail = $("#mobile-detail");
  if (desktopDetail) desktopDetail.innerHTML = detailHTML(booth);
  if (mobileDetail) mobileDetail.innerHTML = detailHTML(booth);

  boothElements.forEach((element, boothId) => {
    const selected = boothId === id;
    element.classList.toggle("selected", selected);
    element.setAttribute("aria-pressed", String(selected));
  });

  document.querySelectorAll(".shop-card").forEach((card) => {
    const selected = card.dataset.id === id;
    card.classList.toggle("selected", selected);
    card.setAttribute("aria-pressed", String(selected));
  });

  const pin = $("#selection-pin");
  if (pin) {
    pin.removeAttribute("hidden");
    pin.setAttribute(
      "transform",
      `translate(${booth.x + booth.width / 2} ${booth.y - 3})`,
    );
  }

  if (center) centerBooth(booth);

  if (openMobile && !desktopQuery.matches) {
    const dialog = $("#detail-dialog");
    if (dialog && !dialog.open) dialog.showModal();
  }

  const announce = $("#announcement");
  if (announce)
    announce.textContent = t(
      "selectedBoothAnnounce",
      booth.name,
      booth.id,
      booth.zone,
    );

  try {
    const url = new URL(location.href);
    url.hash = id;
    history.replaceState(null, "", url);
  } catch {
    // Local file execution safeguard
  }
}

export function showDirections() {
  if (isBoothsPage) {
    const url = new URL("./index.html", location.href);
    url.hash = state.selected;
    url.searchParams.set("directions", "1");
    location.assign(url.href);
    return;
  }

  const booth = boothById.get(state.selected);
  if (!booth) return;

  const routes = [routeFromEntrance(booth, 255), routeFromEntrance(booth, 545)];
  const route = routes.sort((a, b) => a.length - b.length)[0];

  const routePath = $("#route-path");
  if (routePath) {
    routePath.setAttribute(
      "d",
      route.points
        .map((point, index) => `${index ? "L" : "M"}${point[0]} ${point[1]}`)
        .join(" "),
    );
  }

  resetFilters();
  fitMap();

  const routeNotice = $("#route-notice");
  if (routeNotice) {
    routeNotice.hidden = false;
    routeNotice.textContent = t(
      "routeNotice",
      route.entrance,
      booth.zone,
      booth.name,
      booth.id,
    );
  }

  const detailDialog = $("#detail-dialog");
  if (detailDialog && detailDialog.open) detailDialog.close();

  const mapSection = $("#map-section");
  if (mapSection) {
    mapSection.scrollIntoView({
      behavior: reducedMotion.matches ? "auto" : "smooth",
      block: "start",
    });
  }

  const announce = $("#announcement");
  if (announce)
    announce.textContent = t("routeAnnounce", route.entrance, booth.id);
}

let toastTimer;
export function toast(message) {
  clearTimeout(toastTimer);
  const toastEl = $("#toast");
  if (!toastEl) return;
  toastEl.textContent = message;
  toastEl.hidden = false;
  toastTimer = setTimeout(() => (toastEl.hidden = true), 3500);
}

export async function shareBooth() {
  const booth = boothById.get(state.selected);
  if (!booth) return;

  const url = new URL(location.href);
  url.hash = booth.id;
  const zoneText = state.lang === "lo" ? "ໂຊນ" : "Zone";
  const boothText = state.lang === "lo" ? "ບູທ" : "Booth";
  const text = `${booth.name} — ${zoneText} ${booth.zone}, ${boothText} ${booth.id}`;

  if (!/^https?:$/.test(url.protocol)) {
    window.prompt(t("promptCopy"), text);
    return;
  }

  try {
    if (navigator.share) {
      await navigator.share({
        title: "Event Map",
        text,
        url: url.href,
      });
    } else if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(`${text}\n${url.href}`);
      toast(t("linkCopied"));
    } else {
      window.prompt(t("promptCopyLink"), url.href);
    }
  } catch (error) {
    if (error.name !== "AbortError") {
      window.prompt(t("promptCopyLink"), url.href);
    }
  }
}

export function setupUIEventListeners() {
  let searchTimer;
  const searchInput = $("#search");
  if (searchInput) {
    searchInput.addEventListener("input", (event) => {
      state.query = event.target.value.toLowerCase().trim();
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => applyFilters(true), 180);
    });

    searchInput.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      clearTimeout(searchTimer);
      applyFilters(true);

      const results = filteredBooths();
      if (results.length)
        selectBooth(state.selected || results[0].id, true, true);
    });
  }

  const categorySelect = $("#category");
  if (categorySelect) {
    categorySelect.addEventListener("change", (event) => {
      state.category = event.target.value;
      applyFilters(Boolean(state.query));
    });
  }

  const closeDetail = $("#close-detail");
  if (closeDetail) {
    closeDetail.addEventListener("click", () => {
      const dialog = $("#detail-dialog");
      if (dialog) dialog.close();
    });
  }

  desktopQuery.addEventListener("change", (event) => {
    const dialog = $("#detail-dialog");
    if (event.matches && dialog && dialog.open) {
      dialog.close();
    }
  });

  ["#desktop-detail", "#mobile-detail"].forEach((selector) => {
    const el = $(selector);
    if (el) {
      el.addEventListener("click", (event) => {
        const action = event.target.closest("[data-action]")?.dataset.action;
        if (action === "directions") showDirections();
        if (action === "share") shareBooth();
      });
    }
  });

  const viewAllBtn = $("#view-all");
  if (viewAllBtn) {
    viewAllBtn.addEventListener("click", resetFilters);
  }

  const navInfoBtn = $("#nav-info");
  if (navInfoBtn) {
    navInfoBtn.addEventListener("click", () => {
      const infoDialog = $("#info-dialog");
      if (infoDialog) infoDialog.showModal();
    });
  }

  const activeNavId = isBoothsPage ? "nav-booths" : "nav-map";
  ["nav-map", "nav-booths"].forEach((id) => {
    const link = document.getElementById(id);
    if (!link) return;
    const active = id === activeNavId;
    link.classList.toggle("current", active);
    if (active) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });

  window.addEventListener("hashchange", () => {
    const id = location.hash.slice(1).toUpperCase();
    if (boothById.has(id)) selectBooth(id, false, true);
  });
}
