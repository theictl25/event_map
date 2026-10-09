import {
  $,
  isBoothsPage,
  desktopQuery,
  reducedMotion,
} from "../shared/config.js";
import { state, booths, boothElements, boothById } from "../shared/state.js";
import { t, getCategoryName } from "./i18n.js";
import { centerBooth, fitMap } from "./map.js";
import { findRouteToBooth } from "./map-routing.js";

function getBoothLogo(booth) {
  const defaultLogo = "./assets/default_logo.png";

  const logo = String(booth.logo ?? "").trim();

  return logo || defaultLogo;
}

function getBoothImages(booth) {
  if (!Array.isArray(booth.images)) return [];

  return booth.images
    .map((image) => String(image || "").trim())
    .filter(Boolean);
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
      // `${booth.id} ${booth.name} Zone ${booth.zone} ໂຊນ ${booth.zone} ${booth.category} ${categoryName} ${booth.description}`.toLowerCase();
      `${booth.id} ${booth.name} ${booth.category} ${categoryName} `.toLowerCase();

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

  const directoryTitle = $("#directory-title");
  if (directoryTitle) {
    if (state.zone && state.zone !== "all") {
      delete directoryTitle.dataset.i18n;
      directoryTitle.textContent =
        state.lang === "lo"
          ? `ລາຍການບູທຂອງໂຊນ ${state.zone}`
          : `Zone ${state.zone} Booth List`;
    } else {
      directoryTitle.dataset.i18n = "directoryTitle";
      directoryTitle.textContent = t("directoryTitle");
    }
  }

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
      Number(b.featured) - Number(a.featured) ||
      a.id.localeCompare(b.id, undefined, { numeric: true }),
  );

  sorted.forEach((booth) => {
    const logo = getBoothLogo(booth);
    const card = document.createElement("button");
    card.className = "shop-card";
    card.dataset.id = booth.id;
    card.classList.toggle("selected", booth.id === state.selected);
    card.setAttribute("aria-pressed", String(booth.id === state.selected));

    const boothText =
      state.lang === "lo" ? `ບູທ ${booth.id}` : `Booth ${booth.id}`;
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
          ${boothText} · ${escapeHTML(categoryName)}
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
  const categorySelect = $("#category");
  if (categorySelect) {
    categorySelect.classList.toggle("has-selection", state.category !== "all");
  }

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
        (Boolean(state.query) || state.category !== "all") && ids.has(booth.id),
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
  const boothZone =
    state.lang === "lo" ? `ໂຊນ ${booth.zone}` : `Zone ${booth.zone}`;
  const boothText =
    state.lang === "lo" ? `ບູທ ${booth.id}` : `Booth ${booth.id}`;
  const categoryName = getCategoryName(booth.category);
  const images = getBoothImages(booth);

  const galleryHTML = images.length
    ? `
        <section class="detail-gallery" data-index="0"
             data-images="${escapeHTML(JSON.stringify(images))}"
             aria-label="${escapeHTML(booth.name)} photos">
      <div class="detail-gallery-main">
        <img
          src="${escapeHTML(images[0])}"
          alt="${escapeHTML(booth.name)}"
          data-action="gallery-zoom"
          loading="lazy"
          onerror="this.style.display='none';"
        >
        ${
          images.length > 1
            ? `
        <span class="gallery-counter">1 / ${images.length}</span>
        <button type="button" class="gallery-nav prev" data-action="gallery-prev" aria-label="Previous">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>
        </button>
        <button type="button" class="gallery-nav next" data-action="gallery-next" aria-label="Next">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>
        </button>`
            : ""
        }
      </div>

      ${
        images.length > 1
          ? `
      <div class="detail-gallery-thumbs">
        ${images
          .map(
            (image, index) => `
          <button type="button" class="gallery-thumb ${index === 0 ? "active" : ""}"
                  ${index >= 4 ? "hidden" : ""}
                  data-action="gallery" data-index="${index}" data-src="${escapeHTML(image)}"
                  aria-label="${escapeHTML(booth.name)} ${index + 1}">
            <img src="${escapeHTML(image)}" alt="" loading="lazy"
                 onerror="this.style.visibility='hidden';">
            <span class="thumb-more" hidden></span>
          </button>`,
          )
          .join("")}
      </div>
      <div class="gallery-dots">
        ${images
          .map(
            (_, index) => `
          <button type="button" class="gallery-dot ${index === 0 ? "active" : ""}"
                  data-action="gallery" data-index="${index}"
                  aria-label="${index + 1}"></button>`,
          )
          .join("")}
      </div>`
          : ""
      }
    </section>
  `
    : "";
  const facebookURL = getSafeFacebookURL(booth.facebook);
  const facebookHTML = facebookURL
    ? `
      <div class="fact">
        
        <a href="${escapeHTML(facebookURL)}" target="_blank" rel="noopener noreferrer">
        <svg class="icon fb-logo" viewBox="0 0 24 24" aria-hidden="true">
          <rect width="24" height="24" rx="5" fill="#1877F2"/>
          <path fill="#fff" d="M16.67 15.47l.53-3.47h-3.33V9.75c0-.95.47-1.88 1.96-1.88h1.51V4.92s-1.37-.23-2.68-.23c-2.74 0-4.53 1.66-4.53 4.67V12H7.08v3.47h3.05V24h3.74v-8.53h2.8z"/>
        </svg>
        ${t("facebook")}</a>
      </div>`
    : "";

  return `
    <div class="detail-top">
      <span class="detail-badge">${booth.id}</span>
      <span class="detail-category">${escapeHTML(categoryName)}</span>
    </div>

    <div class="detail-body">
      <header class="detail-header">
        <span class="detail-logo" style="--logo-bg:${booth.color}">
          <img
            src="${escapeHTML(logo)}"
            alt="${escapeHTML(booth.name)} logo"
            onerror="this.onerror=null; this.src='./assets/default_logo.png';"
          >
        </span>
        <div class="detail-title">
          <h2>${escapeHTML(booth.name)}</h2>
          <p class="detail-subtitle">${boothZone} · ${boothText}</p>
        </div>
      </header>

      ${galleryHTML}

      <section class="detail-section">
        <h3>${t("aboutTitle")}</h3>
        <p class="description">${escapeHTML(booth.description)}</p>
      </section>

      <div class="detail-facts">
        <div class="fact">
          ${icon("pin")}
          <span><strong>${boothZone}</strong></span>|
          <span><strong>${boothText}</strong></span>
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
    if (routeNotice) {
      routeNotice.classList.remove("is-visible");
      routeNotice.textContent = "";
    }
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

    if (dialog) {
      dialog.classList.remove("closing", "expanded", "dragging");
      dialog.style.transform = "";

      if (!dialog.open) {
        dialog.showModal();

        requestAnimationFrame(() => {
          dialog.classList.add("is-open");
        });
      }
    }
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

export function clearSelectedBooth() {
  if (!state.selected) return;

  state.selected = null;

  boothElements.forEach((element) => {
    element.classList.remove("selected");
    element.setAttribute("aria-pressed", "false");
  });

  document.querySelectorAll(".shop-card").forEach((card) => {
    card.classList.remove("selected");
    card.setAttribute("aria-pressed", "false");
  });

  const pin = $("#selection-pin");
  if (pin) pin.setAttribute("hidden", "");

  const desktopDetail = $("#desktop-detail");
  const mobileDetail = $("#mobile-detail");
  if (desktopDetail) desktopDetail.replaceChildren();
  if (mobileDetail) mobileDetail.replaceChildren();

  const detailDialog = $("#detail-dialog");

  if (detailDialog?.open) {
    closeDetailDialog();
  }

  const routePath = $("#route-path");
  const routeNotice = $("#route-notice");
  if (routePath) routePath.setAttribute("d", "");
  if (routeNotice) {
    routeNotice.classList.remove("is-visible");
    routeNotice.textContent = "";
  }

  try {
    const url = new URL(location.href);
    url.hash = "";
    history.replaceState(null, "", url);
  } catch {
    // Local file execution safeguard
  }
}

export function showDirections() {
  if (isBoothsPage) {
    const url = new URL("./index.php", location.href);
    url.hash = state.selected;
    url.searchParams.set("directions", "1");
    location.assign(url.href);
    return;
  }

  const booth = boothById.get(state.selected);
  if (!booth) return;

  const route = findRouteToBooth(booth);
  if (!route) {
    toast(
      state.lang === "lo"
        ? "ຍັງບໍ່ມີທາງເຂົ້າໃນແຜນທີ່"
        : "Add an entrance in Map Manager first.",
    );
    return;
  }

  const routePath = $("#route-path");
  if (routePath) {
    routePath.setAttribute(
      "d",
      route.points
        .map((point, index) => `${index ? "L" : "M"}${point.x} ${point.y}`)
        .join(" "),
    );
  }

  resetFilters();
  fitMap();

  const routeNotice = $("#route-notice");
  if (routeNotice) {
    routeNotice.textContent = t(
      "routeNotice",
      route.entrance,
      booth.zone,
      booth.name,
      booth.id,
    );
    routeNotice.classList.add("is-visible");
  }

  const detailDialog = $("#detail-dialog");

  if (detailDialog && detailDialog.open) {
    closeDetailDialog();
  }

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

function closeDetailDialog() {
  const dialog = $("#detail-dialog");

  if (!dialog || !dialog.open) return;

  dialog.classList.remove("expanded");
  dialog.classList.add("closing");

  setTimeout(() => {
    dialog.classList.remove("closing");
    dialog.close();

    dialog.style.transform = "";
  }, 350);
}
function setGalleryIndex(gallery, index) {
  const thumbs = [...gallery.querySelectorAll(".gallery-thumb")];
  const dots = [...gallery.querySelectorAll(".gallery-dot")];
  const total = thumbs.length;
  if (!total) return;

  const VISIBLE = 4;
  index = (index + total) % total;
  gallery.dataset.index = index;

  const main = gallery.querySelector(".detail-gallery-main img");
  if (main) {
    main.style.display = "";
    main.src = thumbs[index].dataset.src;
  }

  const counter = gallery.querySelector(".gallery-counter");
  if (counter) counter.textContent = `${index + 1} / ${total}`;

  // เลื่อนหน้าต่าง thumbnail ให้รูปที่เลือกอยู่ในช่วงที่มองเห็นเสมอ
  let start = 0;
  if (total > VISIBLE) {
    start = Math.min(Math.max(index - (VISIBLE - 2), 0), total - VISIBLE);
  }
  const remaining = total - (start + VISIBLE);

  thumbs.forEach((thumb, i) => {
    const inWindow = i >= start && i < start + VISIBLE;
    thumb.hidden = !inWindow;
    thumb.classList.toggle("active", i === index);

    const more = thumb.querySelector(".thumb-more");
    if (more) {
      const showMore = i === start + VISIBLE - 1 && remaining > 0;
      more.hidden = !showMore;
      more.textContent = showMore ? `+${remaining}` : "";
    }
  });

  dots.forEach((dot, i) => dot.classList.toggle("active", i === index));
}

let lightbox = null;
const lightboxState = { sources: [], index: 0, gallery: null };

function ensureLightbox() {
  if (lightbox) return lightbox;

  lightbox = document.createElement("dialog");
  lightbox.className = "lightbox";
  lightbox.innerHTML = `
    <button type="button" class="lightbox-close" data-lb="close" aria-label="Close">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
    </button>
    <span class="lightbox-counter"></span>
    <button type="button" class="lightbox-nav prev" data-lb="prev" aria-label="Previous">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>
    </button>
    <img class="lightbox-img" alt="">
    <button type="button" class="lightbox-nav next" data-lb="next" aria-label="Next">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>
    </button>
  `;
  document.body.append(lightbox);

  lightbox.addEventListener("click", (event) => {
    const action = event.target.closest("[data-lb]")?.dataset.lb;
    if (action === "prev") showLightbox(lightboxState.index - 1);
    else if (action === "next") showLightbox(lightboxState.index + 1);
    else if (action === "close" || event.target === lightbox) lightbox.close();
  });

  lightbox.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") showLightbox(lightboxState.index - 1);
    if (event.key === "ArrowRight") showLightbox(lightboxState.index + 1);
  });

  // ปัดซ้าย/ขวาเพื่อเปลี่ยนรูป
  let startX = 0;
  lightbox.addEventListener("pointerdown", (event) => {
    startX = event.clientX;
  });
  lightbox.addEventListener("pointerup", (event) => {
    if (event.target.closest("[data-lb]")) return;
    const dx = event.clientX - startX;
    if (Math.abs(dx) > 50)
      showLightbox(lightboxState.index + (dx < 0 ? 1 : -1));
  });

  // ปิดแล้วให้รูปใน gallery ตรงกับที่ดูล่าสุด
  lightbox.addEventListener("close", () => {
    const { gallery, index } = lightboxState;
    if (gallery?.isConnected) setGalleryIndex(gallery, index);
  });

  return lightbox;
}

function showLightbox(index) {
  const { sources } = lightboxState;
  const total = sources.length;
  if (!total) return;

  index = (index + total) % total;
  lightboxState.index = index;

  const img = lightbox.querySelector(".lightbox-img");
  img.src = sources[index];

  lightbox.querySelector(".lightbox-counter").textContent =
    `${index + 1} / ${total}`;
  lightbox.classList.toggle("single", total < 2);
}

function openLightbox(gallery) {
  let sources = [];
  try {
    sources = JSON.parse(gallery.dataset.images || "[]");
  } catch {
    sources = [];
  }
  if (!sources.length) return;

  ensureLightbox();
  lightboxState.sources = sources;
  lightboxState.gallery = gallery;
  showLightbox(Number(gallery.dataset.index || 0));

  if (!lightbox.open) lightbox.showModal();
}

export function setupUIEventListeners() {
  const brand = document.querySelector(".brand");
  if (brand) {
    let brandClickCount = 0;
    let brandClickTimer;

    brand.addEventListener("click", (event) => {
      // The brand is a normal home-page link. Prevent its immediate navigation
      // briefly so five consecutive clicks can be detected reliably.
      event.preventDefault();
      clearTimeout(brandClickTimer);
      brandClickCount += 1;

      if (brandClickCount >= 5) {
        brandClickCount = 0;
        location.assign("./manager.php");
        return;
      }

      // A normal single click still goes to the map after a short delay.
      brandClickTimer = setTimeout(() => {
        brandClickCount = 0;
        location.assign(brand.href);
      }, 500);
    });
  }
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
    closeDetail.addEventListener("click", closeDetailDialog);
  }
  const detailDialog = $("#detail-dialog");

  if (detailDialog) {
    detailDialog.addEventListener("cancel", (event) => {
      event.preventDefault();
      closeDetailDialog();
    });

    detailDialog.addEventListener("close", () => {
      detailDialog.classList.remove("is-open", "closing");
    });
  }

  desktopQuery.addEventListener("change", (event) => {
    const dialog = $("#detail-dialog");

    if (event.matches && dialog && dialog.open) {
      closeDetailDialog();
    }
  });

  ["#desktop-detail", "#mobile-detail"].forEach((selector) => {
    const el = $(selector);
    if (el) {
      el.addEventListener("click", (event) => {
        const target = event.target.closest("[data-action]");
        const action = target?.dataset.action;
        if (action === "directions") showDirections();
        if (action === "share") shareBooth();

        if (
          action === "gallery" ||
          action === "gallery-prev" ||
          action === "gallery-next"
        ) {
          const gallery = target.closest(".detail-gallery");
          if (!gallery) return;

          const current = Number(gallery.dataset.index || 0);

          if (action === "gallery") {
            setGalleryIndex(gallery, Number(target.dataset.index));
          } else if (action === "gallery-prev") {
            setGalleryIndex(gallery, current - 1);
          } else {
            setGalleryIndex(gallery, current + 1);
          }
        }
        if (action === "gallery-zoom") {
          const gallery = target.closest(".detail-gallery");
          if (gallery) openLightbox(gallery);
        }
      });
    }
  });

  const viewAllBtn = $("#view-all");
  if (viewAllBtn) {
    viewAllBtn.addEventListener("click", resetFilters);
  }
  const resetFilterBtn = $("#reset-all");
  if (resetFilterBtn) {
    resetFilterBtn.addEventListener("click", resetFilters);
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
export function initDetailDrag() {
  const dialog = $("#detail-dialog");
  if (!dialog) return;

  const handle = dialog.querySelector(".detail-drag-handle");
  const heading = dialog.querySelector(".dialog-heading");

  if (!handle || !heading) return;

  let dragging = false;
  let startY = 0;
  let currentY = 0;
  let startTime = 0;

  const CLOSE_DISTANCE = 120;
  const CLOSE_VELOCITY = 0.8;
  const EXPAND_DISTANCE = 80;

  function startDrag(event) {
    if (!dialog.open || desktopQuery.matches) return;

    // ไม่ให้ปุ่ม Close เริ่ม drag
    if (event.target.closest("#close-detail")) {
      return;
    }

    // รับเฉพาะ mouse ปุ่มซ้าย
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    dragging = true;
    startY = event.clientY;
    currentY = 0;
    startTime = performance.now();

    dialog.classList.add("dragging");

    event.currentTarget.setPointerCapture?.(event.pointerId);

    event.preventDefault();
  }

  function moveDrag(event) {
    if (!dragging) return;

    currentY = event.clientY - startY;

    /*
     * ลากลง
     */
    if (currentY > 0) {
      // ลากลง → เลื่อน sheet ลงเพื่อเตรียมปิด
      dialog.style.transform = `translateY(${currentY}px)`;
    } else {
      // ลากขึ้น → ไม่ยก sheet ลอยขึ้น
      // ปล่อยให้มันอยู่ติดด้านล่าง
      dialog.style.transform = "";
    }

    event.preventDefault();
  }

  function endDrag(event) {
    if (!dragging) return;

    dragging = false;

    const elapsed = Math.max(performance.now() - startTime, 1);

    const distance = currentY;
    const velocity = Math.abs(distance) / elapsed;

    dialog.classList.remove("dragging");

    /*
     * ==========================
     * ลากลง → ปิด
     * ==========================
     */
    if (
      distance > CLOSE_DISTANCE ||
      (distance > 40 && velocity > CLOSE_VELOCITY)
    ) {
      dialog.style.transform = "";
      closeDetailDialog();
      return;
    }

    /*
     * ==========================
     * ลากขึ้น → Expand
     * ==========================
     */
    if (distance < -EXPAND_DISTANCE) {
      dialog.classList.add("expanded");
      dialog.style.transform = "";

      return;
    }

    /*
     * ==========================
     * ลากนิดเดียว → กลับ
     * ==========================
     */
    dialog.style.transform = "";

    event.preventDefault();
  }

  /*
   * ==========================
   * Handle
   * ==========================
   */
  handle.addEventListener("pointerdown", startDrag);

  handle.addEventListener("pointermove", moveDrag);

  handle.addEventListener("pointerup", endDrag);

  handle.addEventListener("pointercancel", endDrag);

  /*
   * ==========================
   * Header
   * ==========================
   */
  heading.addEventListener("pointerdown", startDrag);

  heading.addEventListener("pointermove", moveDrag);

  heading.addEventListener("pointerup", endDrag);

  heading.addEventListener("pointercancel", endDrag);
}
export function initDetailBackdrop() {
  const dialog = $("#detail-dialog");
  if (!dialog) return;

  let openedAt = 0;
  new MutationObserver(() => {
    if (dialog.open) openedAt = performance.now();
  }).observe(dialog, { attributes: true, attributeFilter: ["open"] });

  dialog.addEventListener("click", (event) => {
    if (performance.now() - openedAt < 400) return; // ignore ghost click
    if (event.target === dialog) closeDetailDialog();
  });
}
