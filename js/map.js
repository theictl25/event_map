import {
  $,
  SVG_NS,
  zones,
  MAP_WIDTH,
  MAP_HEIGHT,
  MAP_CONFIG,
  desktopQuery,
  reducedMotion,
} from "./config.js";
import {
  state,
  booths,
  boothElements,
  boothById,
  featuredShops,
  updateBoothByIdMap,
} from "./state.js";
import { t } from "./i18n.js";

export function svgElement(tag, attributes = {}, text) {
  const element = document.createElementNS(SVG_NS, tag);
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
  if (text !== undefined) element.textContent = text;
  return element;
}

export function addBooth(zone, number, x, y, width = 64, height = 44) {
  const id = zone + String(number).padStart(2, "0");
  const shop = featuredShops[id];
  const defaultName = state.lang === "lo" ? `ບູທ ${id}` : `Booth ${id}`;
  const DEFAULT_LOGO = new URL("./assets/default_logo.png", document.baseURI)
    .href;
  booths.push({
    id,
    zone,
    x,
    y,
    width,
    height,
    name: shop?.name || defaultName,
    category: shop?.category || "Other",
    logo: String(shop?.logo ?? "").trim() || DEFAULT_LOGO,
    color: shop?.color || "#eff2f6",
    description: shop?.description || t("defaultDesc"),
    hours: shop?.hours || t("defaultHours"),
    facebook: String(shop?.facebook ?? "").trim(),
    featured: Boolean(shop),
  });
}

export function buildMapData(populateCategoryDropdownCb) {
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

  updateBoothByIdMap();
  if (populateCategoryDropdownCb) populateCategoryDropdownCb();
}

export function addZoneLabel(zone, x, y) {
  const color = zones[zone];
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

export function setSelectBoothHandler(handler) {
  selectBoothRef = handler;
}

export function renderMap(applyFiltersCb) {
  $("#zone-labels").replaceChildren();
  $("#booth-layer").replaceChildren();
  $("#gates").replaceChildren();
  $("#zone-filters").replaceChildren();
  boothElements.clear();

  addZoneLabel("D", 400, 155);
  addZoneLabel("A", 212, 277);
  addZoneLabel("B", 422, 277);
  addZoneLabel("C", 632, 277);

  const zoneTextStr = state.lang === "lo" ? "ໂຊນ" : "Zone";

  booths.forEach((booth) => {
    const color = zones[booth.zone];
    const group = svgElement("g", {
      class: "booth",
      role: "button",
      tabindex: "0",
      "aria-label": `${booth.id}, ${booth.name}, ${zoneTextStr} ${booth.zone}`,
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
        if (selectBoothRef) selectBoothRef(booth.id, true, true);
      }
    });

    boothElements.set(booth.id, group);
    $("#booth-layer").append(group);
  });

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

  ["all", ...Object.keys(zones)].forEach((zone) => {
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

  const worldWidth = MAP_WIDTH * state.scale;
  const worldHeight = MAP_HEIGHT * state.scale;

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

  state.minScale = Math.min(width / MAP_WIDTH, height / MAP_HEIGHT) * 0.95;
  state.maxScale = state.minScale * MAP_CONFIG.maxScaleMultiplier;
  state.scale = state.minScale;
  state.x = (width - MAP_WIDTH * state.scale) / 2;
  state.y = (height - MAP_HEIGHT * state.scale) / 2;

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

export function routeFromEntrance(booth, entranceX) {
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
        event.pointerType === "touch" &&
        state.scale <= state.minScale + 0.0001;

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

    const shouldSelect =
      event.type === "pointerup" &&
      tap &&
      tap.pointerId === event.pointerId &&
      !tap.moved &&
      tap.id &&
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

    if (shouldSelect && selectedId && selectBoothRef) {
      selectBoothRef(selectedId, true, false);
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

    state.minScale = Math.min(width / MAP_WIDTH, height / MAP_HEIGHT) * 0.95;

    state.maxScale = state.minScale * MAP_CONFIG.maxScaleMultiplier;

    state.scale = clamp(state.scale, state.minScale, state.maxScale);

    constrain();
    paint();
  });

  resizeObserver.observe(viewport);
}
