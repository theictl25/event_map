import {
  $,
  SVG_NS,
  zones,
  MAP_CONFIG,
  desktopQuery,
  reducedMotion,
} from "../shared/config.js";
import {
  state,
  booths,
  boothElements,
  boothById,
  featuredShops,
  updateBoothByIdMap,
} from "../shared/state.js";
import { t } from "./i18n.js";
import { getMapLayout } from "../shared/map-layout.js";

function mapSize() {
  const layout = getMapLayout();
  return { width: layout.width, height: layout.height };
}

export function svgElement(tag, attributes = {}, text) {
  const element = document.createElementNS(SVG_NS, tag);
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
  if (text !== undefined) element.textContent = text;
  return element;
}

export function addBooth(
  zone,
  number,
  x,
  y,
  width = 64,
  height = 44,
  shape = "rectangle",
  color = "#eff2f6",
  fontSize = 12,
  textColor = "#425066",
  boothId = "",
  mapLabel = "",
) {
  const id = String(boothId || zone + String(number).padStart(2, "0")).trim();
  const shop = featuredShops[id];
  const defaultName = id;
  const DEFAULT_LOGO = new URL("./assets/default_logo.png", document.baseURI)
    .href;
  booths.push({
    id,
    mapLabel: String(mapLabel || id).trim(),
    zone,
    x,
    y,
    width,
    height,
    shape,
    name: shop?.name || defaultName,
    category: shop?.category || "Other",
    logo: String(shop?.logo ?? "").trim() || DEFAULT_LOGO,
    color,
    fontSize,
    textColor,
    description: shop?.description || t("defaultDesc"),
    hours: shop?.hours || t("defaultHours"),
    facebook: String(shop?.facebook ?? "").trim(),
    featured: Boolean(shop),
  });
}

export function buildMapData(populateCategoryDropdownCb) {
  booths.length = 0;

  getMapLayout()
    .elements.filter((element) => element.type === "booth")
    .forEach((booth) => {
      const id = booth.boothId || booth.id;
      const zone = booth.zone;
      const number = Number(id.replace(/\D/g, "")) || 1;
      addBooth(
        zone,
        number,
        booth.x,
        booth.y,
        booth.width,
        booth.height,
        booth.shape,
        booth.color,
        booth.fontSize,
        booth.textColor,
        id,
        booth.label_en,
      );
    });

  updateBoothByIdMap();
  if (populateCategoryDropdownCb) populateCategoryDropdownCb();
}

function zoneStyle(zone) {
  const fallback = zones[zone] || {
    background: "#eff2f6",
    border: "#94a3b8",
    text: "#334155",
  };
  const color = getMapLayout().zoneColors?.[zone];
  return color ? { ...fallback, background: color } : fallback;
}

function mapShape(item, attributes) {
  const centerX = item.x + item.width / 2;
  const centerY = item.y + item.height / 2;
  if (item.type === "walkway") {
    return svgElement("rect", {
      ...attributes,
      x: item.x,
      y: item.y,
      width: item.width,
      height: item.height,
      stroke: "none",
    });
  }
  if (item.shape === "circle") {
    return svgElement("ellipse", {
      ...attributes,
      cx: centerX,
      cy: centerY,
      rx: item.width / 2,
      ry: item.height / 2,
    });
  }
  if (item.shape === "triangle") {
    return svgElement("polygon", {
      ...attributes,
      points: `${centerX},${item.y} ${item.x + item.width},${item.y + item.height} ${item.x},${item.y + item.height}`,
    });
  }
  if (item.shape === "hexagon") {
    return svgElement("polygon", {
      ...attributes,
      points: `${item.x + item.width * 0.25},${item.y} ${item.x + item.width * 0.75},${item.y} ${item.x + item.width},${centerY} ${item.x + item.width * 0.75},${item.y + item.height} ${item.x + item.width * 0.25},${item.y + item.height} ${item.x},${centerY}`,
    });
  }
  return svgElement("rect", {
    ...attributes,
    x: item.x,
    y: item.y,
    width: item.width,
    height: item.height,
    rx: 8,
  });
}

function appendBlossom(group, cx, cy, size) {
  const petal = size * 0.45;
  [
    [0, -size],
    [size, 0],
    [0, size],
    [-size, 0],
    [size * 0.7, -size * 0.7],
  ].forEach(([x, y]) => {
    group.append(
      svgElement("circle", {
        cx: cx + x,
        cy: cy + y,
        r: petal,
        fill: "#fecdd3",
      }),
    );
  });
  group.append(
    svgElement("circle", { cx, cy, r: size * 0.38, fill: "#facc15" }),
  );
}

function appendTree(group, item) {
  const x = item.x;
  const y = item.y;
  const width = item.width;
  const height = item.height;
  const circle = (cx, cy, r, opacity = 1) =>
    group.append(
      svgElement("circle", {
        cx,
        cy,
        r,
        fill: item.color,
        "fill-opacity": opacity,
      }),
    );

  group.append(
    svgElement("path", {
      d: `M ${x + width * 0.43} ${y + height * 0.46} C ${x + width * 0.45} ${y + height * 0.66}, ${x + width * 0.36} ${y + height * 0.84}, ${x + width * 0.39} ${y + height} L ${x + width * 0.72} ${y + height} C ${x + width * 0.69} ${y + height * 0.82}, ${x + width * 0.59} ${y + height * 0.63}, ${x + width * 0.61} ${y + height * 0.46} Z`,
      fill: "#8b6b53",
    }),
  );
  circle(x + width * 0.5, y + height * 0.24, Math.min(width, height) * 0.24);
  circle(
    x + width * 0.28,
    y + height * 0.43,
    Math.min(width, height) * 0.25,
    0.96,
  );
  circle(
    x + width * 0.72,
    y + height * 0.45,
    Math.min(width, height) * 0.28,
    0.92,
  );
  circle(
    x + width * 0.5,
    y + height * 0.59,
    Math.min(width, height) * 0.3,
    0.94,
  );
  circle(
    x + width * 0.14,
    y + height * 0.61,
    Math.min(width, height) * 0.18,
    0.9,
  );
  circle(
    x + width * 0.88,
    y + height * 0.62,
    Math.min(width, height) * 0.18,
    0.9,
  );
  appendBlossom(
    group,
    x + width * 0.31,
    y + height * 0.3,
    Math.min(width, height) * 0.06,
  );
  appendBlossom(
    group,
    x + width * 0.62,
    y + height * 0.53,
    Math.min(width, height) * 0.07,
  );
  appendBlossom(
    group,
    x + width * 0.84,
    y + height * 0.63,
    Math.min(width, height) * 0.06,
  );
}

export function addZoneLabel(zone, x, y) {
  const color = zoneStyle(zone);
  const group = svgElement("g");
  const labelText = state.lang === "lo" ? `ໂຊນ ${zone}` : `Zone ${zone}`;

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
      labelText,
    ),
  );

  $("#zone-labels").append(group);
}

let selectBoothRef = null;
let clearSelectionRef = null;

export function setSelectBoothHandler(handler) {
  selectBoothRef = handler;
}

export function setClearSelectionHandler(handler) {
  clearSelectionRef = handler;
}

export function renderMap(applyFiltersCb) {
  const size = mapSize();
  $("#map-background")?.setAttribute("width", size.width);
  $("#map-background")?.setAttribute("height", size.height);
  $("#zone-labels").replaceChildren();
  $("#map-elements").replaceChildren();
  $("#booth-layer").replaceChildren();
  $("#gates").replaceChildren();
  $("#zone-filters").replaceChildren();
  boothElements.clear();

  getMapLayout()
    .elements.filter((item) => item.type !== "booth")
    .forEach((item) => {
      const group = svgElement("g", { class: `map-element map-${item.type}` });
      if (item.type === "tree") {
        appendTree(group, item);
      } else {
        group.append(mapShape(item, { fill: item.color, stroke: "#94a3b8" }));
      }
      const label =
        item.type === "tree"
          ? ""
          : (state.lang === "lo" ? item.label_lo : item.label_en) ||
            item.label_en ||
            item.label_lo ||
            item.type;
      group.append(
        svgElement(
          "text",
          {
            x: item.x + item.width / 2,
            y: item.y + item.height / 2 + 4,
            "text-anchor": "middle",
            "font-size": item.fontSize,
            fill: item.textColor,
            ...(item.type === "walkway" && item.height > item.width
              ? {
                  transform: `rotate(-90 ${item.x + item.width / 2} ${item.y + item.height / 2})`,
                }
              : {}),
          },
          label,
        ),
      );
      $("#map-elements").append(group);
    });

  const zoneTextStr = state.lang === "lo" ? "ໂຊນ" : "Zone";

  booths.forEach((booth) => {
    const color = zoneStyle(booth.zone);
    const group = svgElement("g", {
      class: "booth",
      role: "button",
      tabindex: "0",
      "aria-label": `${booth.id}, ${booth.name}, ${zoneTextStr} ${booth.zone}`,
      "aria-pressed": "false",
      "data-id": booth.id,
    });

    group.append(
      mapShape(booth, {
        fill: booth.color || color.background,
        stroke: "#64748b",
      }),
      svgElement(
        "text",
        {
          x: booth.x + booth.width / 2,
          y: booth.y + booth.height / 2 + 4,
          "text-anchor": "middle",
          "font-size": booth.fontSize,
          fill: booth.textColor,
          class: "booth-label",
        },
        booth.mapLabel,
      ),
    );

    group.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        event.stopPropagation();
        if (selectBoothRef) selectBoothRef(booth.id, true, true);
      }
    });

    boothElements.set(booth.id, group);
    $("#booth-layer").append(group);
  });

  /* Legacy gates are intentionally disabled: entrances/exits now come from MapLayout. */
  if (false)
    [
      { x: 255, key: "entrance1", entry: true },
      { x: 355, key: "exit1", entry: false },
      { x: 545, key: "entrance2", entry: true },
      { x: 645, key: "exit2", entry: false },
    ].forEach((gate) => {
      const label = t(gate.key);
      const group = svgElement("g", {
        "aria-label": label,
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
          label,
        ),
      );

      $("#gates").append(group);
    });

  // Build filters from the booths currently placed on the map. This lets a
  // newly-created zone appear without needing to edit the frontend config.
  const mapZones = [
    ...new Set(
      booths.map((booth) => String(booth.zone || "").trim()).filter(Boolean),
    ),
  ].sort((left, right) =>
    left.localeCompare(right, undefined, { numeric: true }),
  );

  // A saved selection may no longer exist after the manager changes a map.
  if (state.zone !== "all" && !mapZones.includes(state.zone)) {
    state.zone = "all";
  }

  ["all", ...mapZones].forEach((zone) => {
    const button = document.createElement("button");
    button.className = "zone-chip";
    button.dataset.zone = zone;
    const label =
      zone === "all"
        ? t("zoneAll")
        : state.lang === "lo"
          ? `ໂຊນ ${zone}`
          : `Zone ${zone}`;
    button.textContent = label;

    button.addEventListener("click", () => {
      state.zone = zone;
      if (applyFiltersCb) applyFiltersCb();
    });

    $("#zone-filters").append(button);
  });
}

/* =========================================================
   MAP PAN & ZOOM ENGINE
   ========================================================= */

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getViewportCenter() {
  const viewport = $("#viewport");
  return {
    x: viewport.clientWidth / 2,
    y: viewport.clientHeight / 2,
  };
}

function localPoint(event) {
  const viewport = $("#viewport");
  const rect = viewport.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
}

function constrain() {
  const viewport = $("#viewport");
  const width = viewport.clientWidth;
  const height = viewport.clientHeight;

  const size = mapSize();
  const worldWidth = size.width * state.scale;
  const worldHeight = size.height * state.scale;

  if (worldWidth <= width) {
    state.x = (width - worldWidth) / 2;
  } else {
    state.x = clamp(state.x, width - worldWidth, 0);
  }

  if (worldHeight <= height) {
    state.y = (height - worldHeight) / 2;
  } else {
    state.y = clamp(state.y, height - worldHeight, 0);
  }
}

let lastPaintX = null;
let lastPaintY = null;
let lastPaintScale = null;

export function paint() {
  constrain();
  const world = $("#world");
  const zoomLabel = $("#zoom-label");

  if (
    state.x !== lastPaintX ||
    state.y !== lastPaintY ||
    state.scale !== lastPaintScale
  ) {
    if (world) {
      world.setAttribute(
        "transform",
        `translate(${state.x} ${state.y}) scale(${state.scale})`,
      );
    }
    lastPaintX = state.x;
    lastPaintY = state.y;
    lastPaintScale = state.scale;
  }

  const zoomPercent = Math.round((state.scale / state.minScale) * 100);
  if (zoomLabel) zoomLabel.textContent = `${zoomPercent}%`;
}

let animationFrame = 0;

export function stopAnimation() {
  if (animationFrame) {
    cancelAnimationFrame(animationFrame);
    animationFrame = 0;
  }
}

export function animateTo(x, y, scale, duration = 260) {
  stopAnimation();
  scale = clamp(scale, state.minScale, state.maxScale);

  const target = { x, y, scale };
  const previous = { x: state.x, y: state.y, scale: state.scale };

  state.x = target.x;
  state.y = target.y;
  state.scale = target.scale;
  constrain();
  target.x = state.x;
  target.y = state.y;

  state.x = previous.x;
  state.y = previous.y;
  state.scale = previous.scale;

  if (reducedMotion.matches) {
    Object.assign(state, target);
    paint();
    return;
  }

  const start = { x: state.x, y: state.y, scale: state.scale };
  const startTime = performance.now();

  function frame(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const easing = 1 - Math.pow(1 - progress, 3);

    state.x = start.x + (target.x - start.x) * easing;
    state.y = start.y + (target.y - start.y) * easing;
    state.scale = start.scale + (target.scale - start.scale) * easing;
    paint();

    if (progress < 1) {
      animationFrame = requestAnimationFrame(frame);
    } else {
      animationFrame = 0;
    }
  }

  animationFrame = requestAnimationFrame(frame);
}

export function fitMap() {
  stopAnimation();
  const viewport = $("#viewport");
  if (!viewport) return;

  const width = viewport.clientWidth;
  const height = viewport.clientHeight;
  if (!width || !height) return;

  const size = mapSize();
  state.minScale = Math.min(width / size.width, height / size.height) * 0.95;
  state.maxScale = state.minScale * MAP_CONFIG.maxScaleMultiplier;
  state.scale = state.minScale;
  state.x = (width - size.width * state.scale) / 2;
  state.y = (height - size.height * state.scale) / 2;

  paint();
}

export function centerBooth(booth) {
  const viewport = $("#viewport");
  if (!viewport) return;

  const width = viewport.clientWidth;
  const height = viewport.clientHeight;
  if (!width || !height) return;

  const scale = clamp(state.minScale * 2.2, state.minScale, state.maxScale);
  const boothCenterX = booth.x + booth.width / 2;
  const boothCenterY = booth.y + booth.height / 2;

  const x = width / 2 - boothCenterX * scale;
  const y = height / 2 - boothCenterY * scale;

  animateTo(x, y, scale);
}

export function zoomAt(factor, pointerX, pointerY) {
  stopAnimation();
  if (!state.scale) return;

  const oldScale = state.scale;
  const newScale = clamp(oldScale * factor, state.minScale, state.maxScale);
  if (newScale === oldScale) return;

  const mapX = (pointerX - state.x) / oldScale;
  const mapY = (pointerY - state.y) / oldScale;

  state.scale = newScale;
  state.x = pointerX - mapX * newScale;
  state.y = pointerY - mapY * newScale;

  paint();
}

export function setupMapInteractions() {
  const viewport = $("#viewport");

  if (!viewport) return;

  // =========================================================
  // ZOOM BUTTONS
  // =========================================================

  $("#zoom-in")?.addEventListener("click", () => {
    const center = getViewportCenter();

    zoomAt(MAP_CONFIG.zoomButtonFactor, center.x, center.y);
  });

  $("#zoom-out")?.addEventListener("click", () => {
    const center = getViewportCenter();

    zoomAt(1 / MAP_CONFIG.zoomButtonFactor, center.x, center.y);
  });

  $("#fit-map")?.addEventListener("click", () => {
    fitMap();
  });

  // =========================================================
  // MOUSE WHEEL
  // =========================================================

  viewport.addEventListener(
    "wheel",
    (event) => {
      let delta = event.deltaY;

      // Normalize wheel delta
      if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) {
        delta *= 16;
      }

      if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) {
        delta *= window.innerHeight;
      }

      delta = clamp(delta, -120, 120);

      if (Math.abs(delta) < 0.01) return;

      // =====================================================
      // SHIFT + SCROLL = PAN VERTICAL
      // =====================================================

      if (event.shiftKey) {
        event.preventDefault();

        stopAnimation();

        state.y -= delta;

        constrain();
        paint();

        return;
      }

      // =====================================================
      // AT MIN SCALE
      // SCROLL DOWN -> PAGE DOWN
      // SCROLL UP   -> PAGE UP
      // =====================================================

      const atMinScale = state.scale <= state.minScale + 0.0001;

      if (atMinScale) {
        event.preventDefault();

        window.scrollBy({
          top: delta,
          left: 0,
          behavior: "auto",
        });

        return;
      }

      // =====================================================
      // NORMAL SCROLL = ZOOM
      // =====================================================

      event.preventDefault();

      const point = localPoint(event);

      const factor = Math.exp(-delta * MAP_CONFIG.wheelSensitivity);

      zoomAt(factor, point.x, point.y);
    },
    {
      passive: false,
    },
  );

  // =========================================================
  // DOUBLE CLICK = ZOOM IN
  // =========================================================

  viewport.addEventListener("dblclick", (event) => {
    event.preventDefault();

    const point = localPoint(event);

    zoomAt(MAP_CONFIG.zoomButtonFactor, point.x, point.y);
  });

  // =========================================================
  // POINTER STATE
  // =========================================================

  const pointers = new Map();

  let gesture = null;
  let tap = null;

  // =========================================================
  // POINTER DOWN
  // Mouse:
  //   Left click = Pan
  //
  // Mobile:
  //   One finger at fit scale = page scroll
  //   One finger after zoom = map pan
  //   Two fingers = pinch zoom
  // =========================================================

  viewport.addEventListener("pointerdown", (event) => {
    // Mouse only accepts left button
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    stopAnimation();

    const point = localPoint(event);

    pointers.set(event.pointerId, point);

    // =====================================================
    // FIRST POINTER
    // =====================================================

    if (pointers.size === 1) {
      const boothElement = event.target.closest(".booth");

      tap = {
        pointerId: event.pointerId,

        point: {
          x: point.x,
          y: point.y,
        },

        id: boothElement?.dataset.id || null,

        moved: false,
      };

      // On mobile, let a one-finger drag scroll the page while the whole
      // map is already visible. Once the user zooms in, the same gesture
      // pans the map instead.
      const shouldScrollPage =
        event.pointerType === "touch" && state.scale <= state.minScale + 0.0001;

      gesture = {
        type: shouldScrollPage ? "page-scroll" : "pan",

        point: {
          x: point.x,
          y: point.y,
        },

        clientY: event.clientY,

        x: state.x,
        y: state.y,
      };
    }

    // =====================================================
    // SECOND POINTER
    // Start Pinch
    // =====================================================

    if (pointers.size >= 2) {
      if (tap) {
        tap.moved = true;
      }

      const points = [...pointers.values()];

      const [a, b] = points;

      const midpoint = {
        x: (a.x + b.x) / 2,
        y: (a.y + b.y) / 2,
      };

      const distance = Math.max(1, Math.hypot(a.x - b.x, a.y - b.y));

      gesture = {
        type: "pinch",

        distance,

        midpoint,

        scale: state.scale,

        mapX: (midpoint.x - state.x) / state.scale,

        mapY: (midpoint.y - state.y) / state.scale,
      };
    }

    // Capture pointer

    viewport.setPointerCapture(event.pointerId);

    viewport.classList.add("dragging");
  });

  // =========================================================
  // POINTER MOVE
  //
  // THIS IS THE IMPORTANT PART
  // ทำให้ Drag Map ได้จริง
  // =========================================================

  viewport.addEventListener("pointermove", (event) => {
    if (!pointers.has(event.pointerId)) {
      return;
    }

    const point = localPoint(event);

    pointers.set(event.pointerId, point);

    // =====================================================
    // DETECT DRAG
    // =====================================================

    if (tap) {
      const distance = Math.hypot(point.x - tap.point.x, point.y - tap.point.y);

      if (distance > MAP_CONFIG.dragThreshold) {
        tap.moved = true;
      }
    }

    // =====================================================
    // PINCH
    // =====================================================

    if (pointers.size >= 2) {
      const points = [...pointers.values()];

      const [a, b] = points;

      const midpoint = {
        x: (a.x + b.x) / 2,
        y: (a.y + b.y) / 2,
      };

      const distance = Math.max(1, Math.hypot(a.x - b.x, a.y - b.y));

      if (!gesture || gesture.type !== "pinch") {
        gesture = {
          type: "pinch",

          distance,

          midpoint,

          scale: state.scale,

          mapX: (midpoint.x - state.x) / state.scale,

          mapY: (midpoint.y - state.y) / state.scale,
        };
      }

      // Scale ratio

      const scaleRatio = distance / gesture.distance;

      const newScale = clamp(
        gesture.scale * Math.pow(scaleRatio, MAP_CONFIG.pinchSensitivity),

        state.minScale,

        state.maxScale,
      );

      state.scale = newScale;

      // Keep pinch center fixed

      state.x = midpoint.x - gesture.mapX * state.scale;

      state.y = midpoint.y - gesture.mapY * state.scale;

      constrain();
      paint();

      return;
    }

    // =====================================================
    // MOBILE PAGE SCROLL AT FIT SCALE
    // touch-action remains "none" so pinch zoom can be handled here. We
    // therefore scroll the document ourselves while the map has no extra
    // area to pan.
    if (pointers.size === 1 && gesture?.type === "page-scroll") {
      const deltaY = event.clientY - gesture.clientY;
      window.scrollBy({ top: -deltaY, left: 0, behavior: "auto" });
      gesture.clientY = event.clientY;
      return;
    }

    // NORMAL MAP PAN
    // =====================================================

    if (pointers.size === 1 && gesture?.type === "pan") {
      state.x = gesture.x + point.x - gesture.point.x;

      state.y = gesture.y + point.y - gesture.point.y;

      constrain();
      paint();
    }
  });

  // =========================================================
  // POINTER END
  // =========================================================

  function endPointer(event) {
    if (!pointers.has(event.pointerId)) {
      return;
    }

    // =====================================================
    // CHECK CLICK BOOTH
    // =====================================================

    const isTap =
      event.type === "pointerup" &&
      tap &&
      tap.pointerId === event.pointerId &&
      !tap.moved &&
      pointers.size === 1;

    const selectedId = tap?.id || null;

    // Remove pointer

    pointers.delete(event.pointerId);

    // Release pointer capture

    if (viewport.hasPointerCapture(event.pointerId)) {
      viewport.releasePointerCapture(event.pointerId);
    }

    // =====================================================
    // NO POINTER LEFT
    // =====================================================

    if (pointers.size === 0) {
      viewport.classList.remove("dragging");

      gesture = null;
      tap = null;
    }

    // =====================================================
    // ONE POINTER REMAINS
    // After pinch -> continue pan
    // =====================================================
    else if (pointers.size === 1) {
      const [point] = pointers.values();

      gesture = {
        type: "pan",

        point: {
          x: point.x,
          y: point.y,
        },

        x: state.x,
        y: state.y,
      };
    }

    // =====================================================
    // SELECT BOOTH
    // =====================================================

    if (isTap && selectedId && selectBoothRef) {
      if (state.selected === selectedId && clearSelectionRef) {
        clearSelectionRef();
      } else {
        selectBoothRef(selectedId, true, false);
      }
    }
  }

  viewport.addEventListener("pointerup", endPointer);

  viewport.addEventListener("pointercancel", endPointer);

  viewport.addEventListener("lostpointercapture", endPointer);

  // =========================================================
  // KEYBOARD
  // =========================================================

  viewport.addEventListener("keydown", (event) => {
    const step = 40;

    switch (event.key) {
      case "ArrowUp":
        event.preventDefault();

        state.y += step;

        constrain();
        paint();

        break;

      case "ArrowDown":
        event.preventDefault();

        state.y -= step;

        constrain();
        paint();

        break;

      case "ArrowLeft":
        event.preventDefault();

        state.x += step;

        constrain();
        paint();

        break;

      case "ArrowRight":
        event.preventDefault();

        state.x -= step;

        constrain();
        paint();

        break;

      case "+":
      case "=": {
        event.preventDefault();

        const center = getViewportCenter();

        zoomAt(MAP_CONFIG.zoomButtonFactor, center.x, center.y);

        break;
      }

      case "-":
      case "_": {
        event.preventDefault();

        const center = getViewportCenter();

        zoomAt(1 / MAP_CONFIG.zoomButtonFactor, center.x, center.y);

        break;
      }

      case "0":
        event.preventDefault();

        fitMap();

        break;
    }
  });

  // =========================================================
  // RESIZE
  // =========================================================

  const resizeObserver = new ResizeObserver(() => {
    if (!viewport.clientWidth) {
      return;
    }

    const width = viewport.clientWidth;

    const height = viewport.clientHeight;

    const size = mapSize();
    state.minScale = Math.min(width / size.width, height / size.height) * 0.95;

    state.maxScale = state.minScale * MAP_CONFIG.maxScaleMultiplier;

    state.scale = clamp(state.scale, state.minScale, state.maxScale);

    constrain();
    paint();
  });

  resizeObserver.observe(viewport);
}
