const $ = (selector) => document.querySelector(selector);
const isBoothsPage = document.body.classList.contains("booths-page");
const SVG_NS = "http://www.w3.org/2000/svg";
const desktopQuery = matchMedia("(min-width: 1100px)");
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const GOOGLE_SHEET_API =
  "https://script.google.com/macros/s/AKfycbwouLK9bHHELMFXHuZtLUfXGawipv318_TAsZMPjiMtfC1hXlSAjXw4flbwpYDEBe2P/exec";

let featuredShops = {};
const booths = [];
const boothElements = new Map();
let boothById = new Map();

const zones = {
  A: { background: "#ffebee", border: "#ffbac4", text: "#a32847" },
  B: { background: "#fff5cc", border: "#f6d963", text: "#946126" },
  C: { background: "#eaf7ed", border: "#bce9c7", text: "#137658" },
  D: { background: "#e1f2ff", border: "#a7dcff", text: "#07628e" },
};

const state = {
  selected: "",
  query: "",
  category: "all",
  zone: "all",
  scale: 1,
  minScale: 1,
  maxScale: 5,
  x: 0,
  y: 0,
};

function svgElement(tag, attributes = {}, text) {
  const element = document.createElementNS(SVG_NS, tag);
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
  if (text !== undefined) element.textContent = text;
  return element;
}

function icon(name) {
  return `<svg class="icon" aria-hidden="true"><use href="#i-${name}"/></svg>`;
}

function escapeHTML(value) {
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

function addBooth(zone, number, x, y, width = 64, height = 44) {
  const id = zone + String(number).padStart(2, "0");
  const shop = featuredShops[id];

  booths.push({
    id,
    zone,
    x,
    y,
    width,
    height,
    name: shop?.name || `Booth ${id}`,
    category: shop?.category || "Other",
    logo: shop?.logo || "🛍️",
    color: shop?.color || "#eff2f6",
    description:
      shop?.description ||
      "Shop details have not been published for this booth yet.",
    promotion: shop?.promotion || "No current promotion listed.",
    hours: shop?.hours || "Hours not published",
    featured: Boolean(shop),
  });
}

function buildMapData() {
  booths.length = 0;

  ["A", "B", "C"].forEach((zone, zoneIndex) => {
    for (let number = 1; number <= 12; number++) {
      const index = number - 1;
      const block = Math.floor(index / 4);
      const row = Math.floor((index % 4) / 2);
      const column = index % 2;

      addBooth(
        zone,
        number,
        145 + zoneIndex * 210 + column * 70,
        300 + block * 145 + row * 50,
      );
    }
  });

  for (let number = 1; number <= 6; number++) {
    addBooth("D", number, 155 + (number - 1) * 78, 175);
  }

  // Update lookup map after rebuilding booths array
  boothById = new Map(booths.map((booth) => [booth.id, booth]));
}

async function loadShopsFromGoogleSheet() {
  try {
    const response = await fetch(GOOGLE_SHEET_API);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    featuredShops = await response.json();

    // โหลดข้อมูลร้านเสร็จแล้วค่อย rebuild
    buildMapData();
    renderMap();
    applyFilters();

    const selectedId = state.selected || "A01";

    if (boothById.has(selectedId)) {
      selectBooth(selectedId);
    }
  } catch (error) {
    console.error("Error loading shop data:", error);
  }
}

function addZoneLabel(zone, x, y) {
  const color = zones[zone];
  const group = svgElement("g");

  group.append(
    svgElement("rect", {
      x: x - 39,
      y: y - 18,
      width: 78,
      height: 28,
      rx: 7,
      fill: color.background,
    }),
    svgElement(
      "text",
      {
        x,
        y,
        "text-anchor": "middle",
        fill: color.text,
        "font-size": 15,
        "font-weight": 700,
      },
      `Zone ${zone}`,
    ),
  );

  $("#zone-labels").append(group);
}

function renderMap() {
  $("#zone-labels").replaceChildren();
  $("#booth-layer").replaceChildren();
  $("#gates").replaceChildren();
  $("#zone-filters").replaceChildren();
  boothElements.clear();

  addZoneLabel("D", 400, 155);
  addZoneLabel("A", 212, 277);
  addZoneLabel("B", 422, 277);
  addZoneLabel("C", 632, 277);

  booths.forEach((booth) => {
    const color = zones[booth.zone];
    const group = svgElement("g", {
      class: "booth",
      role: "button",
      tabindex: "0",
      "aria-label": `${booth.id}, ${booth.name}, Zone ${booth.zone}`,
      "aria-pressed": "false",
      "data-id": booth.id,
    });

    group.append(
      svgElement("rect", {
        x: booth.x,
        y: booth.y,
        width: booth.width,
        height: booth.height,
        rx: 8,
        fill: color.background,
        stroke: color.border,
      }),
      svgElement(
        "text",
        {
          x: booth.x + booth.width / 2,
          y: booth.y + booth.height / 2 + 4,
          "text-anchor": "middle",
          "font-size": 12,
          fill: "#425066",
          class: "booth-label",
        },
        booth.id,
      ),
    );

    group.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        event.stopPropagation();
        selectBooth(booth.id, true, true);
      }
    });

    boothElements.set(booth.id, group);
    $("#booth-layer").append(group);
  });

  [
    { x: 255, label: "Entrance 1", entry: true },
    { x: 355, label: "Exit 1", entry: false },
    { x: 545, label: "Entrance 2", entry: true },
    { x: 645, label: "Exit 2", entry: false },
  ].forEach((gate) => {
    const group = svgElement("g", {
      "aria-label": gate.label,
      role: "img",
    });

    group.append(
      svgElement("rect", {
        x: gate.x - 43,
        y: 837,
        width: 86,
        height: 53,
        rx: 14,
        fill: "#fff",
        stroke: "#e0e5ee",
      }),
      svgElement(
        "text",
        {
          x: gate.x,
          y: 859,
          "text-anchor": "middle",
          "font-size": 26,
          fill: gate.entry ? "#00996b" : "#ed3660",
        },
        gate.entry ? "↑" : "↓",
      ),
      svgElement(
        "text",
        {
          x: gate.x,
          y: 878,
          "text-anchor": "middle",
          "font-size": 10,
          "font-weight": 650,
          fill: "#465269",
        },
        gate.label,
      ),
    );

    $("#gates").append(group);
  });

  ["all", ...Object.keys(zones)].forEach((zone) => {
    const button = document.createElement("button");
    button.className = "zone-chip";
    button.dataset.zone = zone;
    button.textContent = zone === "all" ? "All Zones" : `Zone ${zone}`;

    button.addEventListener("click", () => {
      state.zone = zone;
      applyFilters();
    });

    $("#zone-filters").append(button);
  });
}

function filteredBooths() {
  return booths.filter((booth) => {
    const searchable =
      `${booth.id} ${booth.name} Zone ${booth.zone} ${booth.category} ${booth.description}`.toLowerCase();

    return (
      searchable.includes(state.query) &&
      (state.zone === "all" || booth.zone === state.zone) &&
      (state.category === "all" || booth.category === state.category)
    );
  });
}

function renderList(results) {
  const container = $("#booth-list");
  container.replaceChildren();
  $("#result-count").textContent = `${results.length} booths`;

  if (!results.length) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent =
      "No booths found. Try another search or reset your filters.";
    container.append(empty);
    return;
  }

  const sorted = [...results].sort(
    (a, b) =>
      Number(b.featured) - Number(a.featured) || a.id.localeCompare(b.id),
  );

  sorted.forEach((booth) => {
    const card = document.createElement("button");
    card.className = "shop-card";
    card.dataset.id = booth.id;
    card.classList.toggle("selected", booth.id === state.selected);
    card.setAttribute("aria-pressed", String(booth.id === state.selected));

    card.innerHTML = `
          <span class="shop-logo" style="--logo-bg:${booth.color}" aria-hidden="true">
            ${booth.logo}
          </span>
          <span class="shop-text">
            <span class="shop-title">
              <span class="small-badge">${booth.id}</span>
              ${escapeHTML(booth.name)}
            </span>
            <span class="shop-meta" style="display:block">
              Zone ${booth.zone} · ${escapeHTML(booth.category)}
            </span>
          </span>
        `;

    card.addEventListener("click", () => {
      selectBooth(booth.id, true, true);
    });

    container.append(card);
  });
}

function applyFilters(centerSearch = false) {
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

  $("#announcement").textContent = `${results.length} booths found.`;
}

let searchTimer;

$("#search").addEventListener("input", (event) => {
  state.query = event.target.value.toLowerCase().trim();
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => applyFilters(true), 180);
});

$("#search").addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;
  clearTimeout(searchTimer);
  applyFilters(true);

  const results = filteredBooths();
  if (results.length) selectBooth(state.selected || results[0].id, true, true);
});

$("#category").addEventListener("change", (event) => {
  state.category = event.target.value;
  applyFilters(Boolean(state.query));
});

function resetFilters() {
  clearTimeout(searchTimer);
  state.query = "";
  state.zone = "all";
  state.category = "all";
  $("#search").value = "";
  $("#category").value = "all";
  applyFilters();
}

function detailHTML(booth) {
  return `
        <div class="detail-top">
          <span class="detail-badge">${booth.id}</span>
          <span class="detail-category">${escapeHTML(booth.category)}</span>
        </div>

        <div class="detail-body">
          <h2>${escapeHTML(booth.name)}</h2>

          <div class="detail-hero" style="--hero-bg:${booth.color}">
            <span class="hero-logo" role="img" aria-label="${escapeHTML(booth.name)} logo">
              ${booth.logo}
            </span>
            <span class="hero-caption">${escapeHTML(booth.category)}</span>
          </div>

          <section class="detail-section">
            <h3>About</h3>
            <p class="description">${escapeHTML(booth.description)}</p>
          </section>

          <div class="promotion">
            <strong>✦ Current promotion</strong>
            ${escapeHTML(booth.promotion)}
          </div>

          <div class="detail-facts">
            <div class="fact">
              ${icon("pin")}
              <span><strong>Zone ${booth.zone}</strong> | Booth ${booth.id}</span>
            </div>
            <div class="fact">
              ${icon("clock")}
              <span>${escapeHTML(booth.hours)}</span>
            </div>
          </div>
        </div>

        <div class="detail-actions">
          <button class="button primary" data-action="directions">
            ${icon("route")} Get Directions
          </button>
          <button class="button" data-action="share">
            ${icon("share")} Share Booth
          </button>
        </div>
      `;
}

function selectBooth(id, openMobile = false, center = false) {
  const booth = boothById.get(id);
  if (!booth) return;

  if (state.selected !== id) {
    $("#route-path").setAttribute("d", "");
    $("#route-notice").hidden = true;
  }

  state.selected = id;

  $("#desktop-detail").innerHTML = detailHTML(booth);
  $("#mobile-detail").innerHTML = detailHTML(booth);

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
  pin.removeAttribute("hidden");
  pin.setAttribute(
    "transform",
    `translate(${booth.x + booth.width / 2} ${booth.y - 3})`,
  );

  if (center) centerBooth(booth);

  if (openMobile && !desktopQuery.matches) {
    const dialog = $("#detail-dialog");
    if (!dialog.open) dialog.showModal();
  }

  $("#announcement").textContent =
    `Selected ${booth.name}, booth ${booth.id}, Zone ${booth.zone}.`;

  try {
    const url = new URL(location.href);
    url.hash = id;
    history.replaceState(null, "", url);
  } catch {
    // Local file execution safeguard
  }
}

$("#close-detail").addEventListener("click", () => {
  $("#detail-dialog").close();
});

desktopQuery.addEventListener("change", (event) => {
  if (event.matches && $("#detail-dialog").open) {
    $("#detail-dialog").close();
  }
});

const viewport = $("#viewport");
const world = $("#world");
let animationFrame = 0;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function constrain() {
  const width = viewport.clientWidth;
  const height = viewport.clientHeight;
  const worldWidth = 800 * state.scale;
  const worldHeight = 900 * state.scale;

  state.x =
    worldWidth <= width
      ? (width - worldWidth) / 2
      : clamp(state.x, width - worldWidth - 35, 35);

  state.y =
    worldHeight <= height
      ? (height - worldHeight) / 2
      : clamp(state.y, height - worldHeight - 35, 35);
}

function paint() {
  constrain();
  world.setAttribute(
    "transform",
    `translate(${state.x} ${state.y}) scale(${state.scale})`,
  );

  $("#zoom-label").textContent =
    `${Math.round((state.scale / state.minScale) * 100)}%`;
}

function stopAnimation() {
  cancelAnimationFrame(animationFrame);
  animationFrame = 0;
}

function animateTo(x, y, scale) {
  stopAnimation();

  if (reducedMotion.matches) {
    Object.assign(state, { x, y, scale });
    paint();
    return;
  }

  const start = { x: state.x, y: state.y, scale: state.scale };
  const startTime = performance.now();

  function frame(now) {
    const progress = Math.min((now - startTime) / 260, 1);
    const easing = 1 - Math.pow(1 - progress, 3);

    state.x = start.x + (x - start.x) * easing;
    state.y = start.y + (y - start.y) * easing;
    state.scale = start.scale + (scale - start.scale) * easing;
    paint();

    if (progress < 1) animationFrame = requestAnimationFrame(frame);
  }

  animationFrame = requestAnimationFrame(frame);
}

function fitMap() {
  stopAnimation();

  if (!viewport.clientWidth || !viewport.clientHeight) {
    return;
  }

  state.minScale =
    Math.min(viewport.clientWidth / 800, viewport.clientHeight / 900) * 0.95;

  state.maxScale = state.minScale * 5;
  state.scale = state.minScale;

  state.x = (viewport.clientWidth - 800 * state.scale) / 2;
  state.y = (viewport.clientHeight - 900 * state.scale) / 2;

  paint();
}

function centerBooth(booth) {
  if (!viewport.clientWidth || !viewport.clientHeight) {
    return;
  }

  const scale = clamp(state.minScale * 2.2, state.minScale, state.maxScale);

  animateTo(
    viewport.clientWidth / 2 - (booth.x + booth.width / 2) * scale,
    viewport.clientHeight / 2 - (booth.y + booth.height / 2) * scale,
    scale,
  );
}

function zoomAt(factor, x, y) {
  stopAnimation();
  const newScale = clamp(state.scale * factor, state.minScale, state.maxScale);
  const ratio = newScale / state.scale;

  state.x = x - (x - state.x) * ratio;
  state.y = y - (y - state.y) * ratio;
  state.scale = newScale;
  paint();
}

$("#zoom-in").addEventListener("click", () =>
  zoomAt(1.3, viewport.clientWidth / 2, viewport.clientHeight / 2),
);

$("#zoom-out").addEventListener("click", () =>
  zoomAt(1 / 1.3, viewport.clientWidth / 2, viewport.clientHeight / 2),
);

$("#fit-map").addEventListener("click", fitMap);

viewport.addEventListener(
  "wheel",
  (event) => {
    event.preventDefault();
    const rect = viewport.getBoundingClientRect();

    zoomAt(
      Math.exp(-clamp(event.deltaY, -120, 120) * 0.004),
      event.clientX - rect.left,
      event.clientY - rect.top,
    );
  },
  { passive: false },
);

const pointers = new Map();
let gesture = null;
let tap = null;

function localPoint(event) {
  const rect = viewport.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
}

function restartGesture() {
  const points = [...pointers.values()];

  if (points.length >= 2) {
    const [a, b] = points;
    gesture = {
      type: "pinch",
      distance: Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)),
      midpoint: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
      x: state.x,
      y: state.y,
      scale: state.scale,
    };
  } else if (points.length === 1) {
    gesture = {
      type: "pan",
      point: points[0],
      x: state.x,
      y: state.y,
    };
  } else {
    gesture = null;
  }
}

viewport.addEventListener("pointerdown", (event) => {
  if (event.pointerType === "mouse" && event.button !== 0) return;

  stopAnimation();
  const point = localPoint(event);
  pointers.set(event.pointerId, point);

  if (pointers.size === 1) {
    tap = {
      pointerId: event.pointerId,
      point,
      id: event.target.closest(".booth")?.dataset.id,
      moved: false,
    };
  } else if (tap) {
    tap.moved = true;
  }

  viewport.setPointerCapture(event.pointerId);
  viewport.classList.add("dragging");
  restartGesture();
});

viewport.addEventListener("pointermove", (event) => {
  if (!pointers.has(event.pointerId)) return;

  const point = localPoint(event);
  pointers.set(event.pointerId, point);

  if (tap && Math.hypot(point.x - tap.point.x, point.y - tap.point.y) > 7) {
    tap.moved = true;
  }

  if (gesture?.type === "pinch") {
    const [a, b] = [...pointers.values()];
    const distance = Math.max(1, Math.hypot(a.x - b.x, a.y - b.y));
    const midpoint = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };

    state.scale = clamp(
      (gesture.scale * distance) / gesture.distance,
      state.minScale,
      state.maxScale,
    );

    const ratio = state.scale / gesture.scale;
    state.x = midpoint.x - (gesture.midpoint.x - gesture.x) * ratio;
    state.y = midpoint.y - (gesture.midpoint.y - gesture.y) * ratio;
  } else if (gesture?.type === "pan") {
    state.x = gesture.x + point.x - gesture.point.x;
    state.y = gesture.y + point.y - gesture.point.y;
  }

  paint();
});

function endPointer(event) {
  if (!pointers.has(event.pointerId)) return;

  const shouldSelect =
    event.type === "pointerup" &&
    tap?.pointerId === event.pointerId &&
    !tap.moved &&
    tap.id &&
    pointers.size === 1;

  const selectedId = tap?.id;

  pointers.delete(event.pointerId);
  if (viewport.hasPointerCapture(event.pointerId)) {
    viewport.releasePointerCapture(event.pointerId);
  }

  if (!pointers.size) {
    viewport.classList.remove("dragging");
    tap = null;
  }

  restartGesture();

  if (shouldSelect) selectBooth(selectedId, true, false);
}

viewport.addEventListener("pointerup", endPointer);
viewport.addEventListener("pointercancel", endPointer);
viewport.addEventListener("lostpointercapture", endPointer);

viewport.addEventListener("keydown", (event) => {
  if (event.target.closest(".booth")) return;

  const movements = {
    ArrowLeft: [50, 0],
    ArrowRight: [-50, 0],
    ArrowUp: [0, 50],
    ArrowDown: [0, -50],
  };

  if (movements[event.key]) {
    event.preventDefault();
    stopAnimation();
    state.x += movements[event.key][0];
    state.y += movements[event.key][1];
    paint();
  } else if (event.key === "+" || event.key === "=") {
    event.preventDefault();
    $("#zoom-in").click();
  } else if (event.key === "-") {
    event.preventDefault();
    $("#zoom-out").click();
  } else if (event.key === "0") {
    event.preventDefault();
    fitMap();
  }
});

new ResizeObserver(fitMap).observe(viewport);

function routeFromEntrance(booth, entranceX) {
  const points = [
    [entranceX, 837],
    [entranceX, 808],
  ];

  if (booth.zone === "E") {
    const centerX = booth.x + booth.width / 2;
    points.push([centerX, 808], [centerX, booth.y + booth.height + 4]);
  } else if (booth.zone === "D") {
    const aisleX = entranceX < 400 ? 104 : 734;
    const centerX = booth.x + booth.width / 2;
    points.push(
      [aisleX, 808],
      [aisleX, 240],
      [centerX, 240],
      [centerX, booth.y + booth.height + 4],
    );
  } else {
    const number = Number(booth.id.slice(1));
    const isLeft = number % 2 === 1;
    const zoneIndex = ["A", "B", "C"].indexOf(booth.zone);
    const aisleX = 104 + zoneIndex * 210 + (isLeft ? 0 : 210);
    const centerY = booth.y + booth.height / 2;
    const edgeX = isLeft ? booth.x - 4 : booth.x + booth.width + 4;

    const outerX = entranceX < 400 ? 104 : 734;
    points.push(
      [outerX, 808],
      [outerX, 708],
      [aisleX, 708],
      [aisleX, centerY],
      [edgeX, centerY],
    );
  }

  const length = points.reduce((total, point, index) => {
    if (!index) return total;
    const previous = points[index - 1];
    return total + Math.hypot(point[0] - previous[0], point[1] - previous[1]);
  }, 0);

  return { points, length, entrance: entranceX === 255 ? 1 : 2 };
}

function showDirections() {
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

  $("#route-path").setAttribute(
    "d",
    route.points
      .map((point, index) => `${index ? "L" : "M"}${point[0]} ${point[1]}`)
      .join(" "),
  );

  resetFilters();
  fitMap();

  $("#route-notice").hidden = false;
  $("#route-notice").textContent =
    `Illustrative route: Entrance ${route.entrance} → Zone ${booth.zone} → ` +
    `${booth.name} (${booth.id}). Follow the dashed line. ` +
    `Your live location is not tracked; follow venue signage on site.`;

  if ($("#detail-dialog").open) $("#detail-dialog").close();

  $("#map-section").scrollIntoView({
    behavior: reducedMotion.matches ? "auto" : "smooth",
    block: "start",
  });

  $("#announcement").textContent =
    `Route displayed from Entrance ${route.entrance} to booth ${booth.id}.`;
}

let toastTimer;

function toast(message) {
  clearTimeout(toastTimer);
  $("#toast").textContent = message;
  $("#toast").hidden = false;
  toastTimer = setTimeout(() => ($("#toast").hidden = true), 3500);
}

async function shareBooth() {
  const booth = boothById.get(state.selected);
  if (!booth) return;

  const url = new URL(location.href);
  url.hash = booth.id;
  const text = `${booth.name} — Zone ${booth.zone}, Booth ${booth.id}`;

  if (!/^https?:$/.test(url.protocol)) {
    window.prompt(
      "Copy booth details. Host this page online to share a link:",
      text,
    );
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
      toast("Booth link copied.");
    } else {
      window.prompt("Copy this booth link:", url.href);
    }
  } catch (error) {
    if (error.name !== "AbortError") {
      window.prompt("Copy this booth link:", url.href);
    }
  }
}

["#desktop-detail", "#mobile-detail"].forEach((selector) => {
  $(selector).addEventListener("click", (event) => {
    const action = event.target.closest("[data-action]")?.dataset.action;
    if (action === "directions") showDirections();
    if (action === "share") shareBooth();
  });
});

$("#view-all").addEventListener("click", resetFilters);

$("#nav-info").addEventListener("click", () => {
  $("#info-dialog").showModal();
});

const activeNavId = isBoothsPage ? "nav-booths" : "nav-map";

["nav-map", "nav-booths"].forEach((id) => {
  const link = document.getElementById(id);
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

function initApp() {
  buildMapData();
  renderMap();
  applyFilters();
  fitMap();

  const initialId = location.hash.slice(1).toUpperCase();
  const defaultBooth = boothById.has(initialId) ? initialId : "A01";
  selectBooth(defaultBooth);

  $("#footer").textContent =
    `EventMap · ${booths.length} booth locations · Demo event directory`;
}

// เปิดหน้าเว็บก่อน
initApp();

// แล้วค่อยโหลด Google Sheet
loadShopsFromGoogleSheet();
