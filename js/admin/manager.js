import {
  DEFAULT_NEW_ZONE_COLOR,
  DEFAULT_ZONE_COLORS,
  ELEMENT_TYPES,
  ELEMENT_SHAPES,
  defaultMapLayout,
  getMapLayout,
  normalizeMapLayout,
  saveMapLayout,
} from "../shared/map-layout.js";
import { loadMapLayoutFromGoogleSheet } from "../shared/api.js";
import {
  initialiseManagerLanguage,
  managerLanguage,
  managerT,
  onManagerLanguageChange,
} from "./manager-i18n.js";

const canvas = document.querySelector("#manager-preview");
const palette = document.querySelector("#element-palette");
const inspector = document.querySelector("#element-inspector");
const message = document.querySelector("#manager-message");
const widthInput = document.querySelector("#map-width");
const heightInput = document.querySelector("#map-height");
const gridInput = document.querySelector("#grid-size");
const zoneColorList = document.querySelector("#zone-color-list");
const zoomLabel = document.querySelector("#manager-zoom-label");
const mapLoading = document.querySelector("#manager-map-loading");
const mapLoadingText = document.querySelector("#manager-map-loading-text");
const previewDialog = document.querySelector("#map-preview-dialog");
const previewImage = document.querySelector("#map-preview-image");
const layersList = document.querySelector("#layers-list");
let layout = structuredClone(normalizeMapLayout(getMapLayout()));
let selectedId = null;
let interaction = null;
let editStart = null;
let undoStack = [];
let camera = { scale: 1, x: 0, y: 0 };
const pointers = new Map();
let panMode = false;
let spaceHeld = false;
let cameraPaintFrame = null;

const layoutSourceCopy = {
  en: {
    load: "Load from Google Sheet",
    default: "Use default layout",
    confirm: "Replace this editor map? Unsaved changes will be lost.",
    loading: "Loading map layout from Google Sheet…",
    loaded: "Google Sheet layout loaded. Save to publish changes.",
    defaultLoaded: "Default layout loaded. Save to publish changes.",
    loadFailed: "Could not load the Google Sheet layout:",
  },
  lo: {
    load: "ໂຫຼດຈາກ Google Sheet",
    default: "ໃຊ້ແຜນທີ່ຕົ້ນສະບັບ",
    confirm: "ແທນທີ່ແຜນທີ່ໃນໜ້າແກ້ໄຂບໍ? ການແກ້ໄຂທີ່ຍັງບໍ່ບັນທຶກຈະຫາຍໄປ.",
    loading: "ກຳລັງໂຫຼດແຜນທີ່ຈາກ Google Sheet…",
    loaded: "ໂຫຼດແຜນທີ່ຈາກ Google Sheet ແລ້ວ. ກົດບັນທຶກເພື່ອເຜີຍແຜ່.",
    defaultLoaded: "ໂຫຼດແຜນທີ່ຕົ້ນສະບັບແລ້ວ. ກົດບັນທຶກເພື່ອເຜີຍແຜ່.",
    loadFailed: "ບໍ່ສາມາດໂຫຼດແຜນທີ່ຈາກ Google Sheet:",
  },
};

function layoutCopy() {
  return layoutSourceCopy[managerLanguage()];
}

function setMapLoading(isLoading) {
  if (!mapLoading) return;
  if (mapLoadingText) mapLoadingText.textContent = layoutCopy().loading;
  mapLoading.hidden = !isLoading;
}

const snapshot = () => structuredClone(layout);
const selected = () => layout.elements.find((item) => item.id === selectedId);
const snap = (value) =>
  Math.round(value / Number(layout.gridSize || 25)) *
  Number(layout.gridSize || 25);
const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const escapeHTML = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ],
  );

function remember(before = snapshot()) {
  if (!undoStack.length || !equal(undoStack.at(-1), before))
    undoStack.push(before);
  if (undoStack.length > 50) undoStack.shift();
  document.querySelector("#undo-map").disabled = !undoStack.length;
}
function undo() {
  const previous = undoStack.pop();
  if (!previous) return;
  layout = previous;
  if (!selected()) selectedId = null;
  renderAll();
}
function itemLabel(item) {
  const translated =
    managerLanguage() === "lo"
      ? item.label_lo || item.label_en
      : item.label_en || item.label_lo;
  return translated || item.boothId || item.id;
}
function clampCamera() {
  const viewWidth = layout.width / camera.scale,
    viewHeight = layout.height / camera.scale;
  camera.x = Math.min(
    Math.max(camera.x, 0),
    Math.max(0, layout.width - viewWidth),
  );
  camera.y = Math.min(
    Math.max(camera.y, 0),
    Math.max(0, layout.height - viewHeight),
  );
}
function updateViewBox() {
  clampCamera();
  canvas.setAttribute(
    "viewBox",
    [
      camera.x,
      camera.y,
      layout.width / camera.scale,
      layout.height / camera.scale,
    ].join(" "),
  );
  zoomLabel.textContent = Math.round(camera.scale * 100) + "%";
  document.querySelector("#manager-zoom-out").disabled = camera.scale <= 1;
}
function scheduleCameraPaint() {
  if (cameraPaintFrame !== null) return;
  cameraPaintFrame = requestAnimationFrame(() => {
    cameraPaintFrame = null;
    updateViewBox();
  });
}
function eventPoint(event) {
  const point = canvas.createSVGPoint();
  point.x = event.clientX;
  point.y = event.clientY;
  return point.matrixTransform(canvas.getScreenCTM().inverse());
}
function startPan(event) {
  return {
    kind: "pan",
    pointerId: event.pointerId,
    clientX: event.clientX,
    clientY: event.clientY,
    camera: { ...camera },
  };
}
function panToPointer(event, start) {
  const viewWidth = layout.width / start.camera.scale;
  const viewHeight = layout.height / start.camera.scale;
  const screenScale = Math.min(
    canvas.clientWidth / viewWidth,
    canvas.clientHeight / viewHeight,
  );

  // Use fixed screen-space movement. SVG coordinates from eventPoint() change
  // as the viewBox moves, which causes visible feedback and jerky panning.
  camera.x = start.camera.x - (event.clientX - start.clientX) / screenScale;
  camera.y = start.camera.y - (event.clientY - start.clientY) / screenScale;
}
function itemFill(item) {
  return item.type === "booth"
    ? layout.zoneColors[item.zone] || item.color
    : item.color;
}
function ensureZoneColor(zone) {
  layout.zoneColors ||= {};
  const key = String(zone || "").trim().toUpperCase();
  if (key) layout.zoneColors[key] ||= DEFAULT_ZONE_COLORS[key] || DEFAULT_NEW_ZONE_COLOR;
}
function zonesInLayout() {
  return [...new Set([
    ...Object.keys(DEFAULT_ZONE_COLORS),
    ...Object.keys(layout.zoneColors || {}),
    ...layout.elements
      .filter((item) => item.type === "booth" && item.zone)
      .map((item) => item.zone.trim().toUpperCase()),
  ])].sort();
}
function shapeMarkup(item, fill) {
  const x = item.x, y = item.y, width = item.width, height = item.height;
  const centerX = x + width / 2, centerY = y + height / 2;

  if (item.type === "tree") {
    const crown = Math.min(width, height) * 0.24;
    return '<rect x="' + x + '" y="' + y + '" width="' + width + '" height="' + height + '" fill="transparent"/>'
      + '<rect x="' + (centerX - crown * 0.3) + '" y="' + (y + height * 0.58) + '" width="' + crown * 0.6 + '" height="' + height * 0.3 + '" rx="2" fill="#8b5a2b"/>'
      + '<circle cx="' + centerX + '" cy="' + (y + height * 0.42) + '" r="' + crown + '" fill="' + fill + '"/>'
      + '<circle cx="' + (centerX - crown * 0.62) + '" cy="' + (y + height * 0.54) + '" r="' + (crown * 0.78) + '" fill="' + fill + '"/>'
      + '<circle cx="' + (centerX + crown * 0.62) + '" cy="' + (y + height * 0.54) + '" r="' + (crown * 0.78) + '" fill="' + fill + '"/>';
  }
  if (item.shape === "circle") return '<ellipse cx="' + centerX + '" cy="' + centerY + '" rx="' + (width / 2) + '" ry="' + (height / 2) + '" fill="' + fill + '"/>';
  if (item.shape === "triangle") return '<polygon points="' + centerX + ',' + y + ' ' + (x + width) + ',' + (y + height) + ' ' + x + ',' + (y + height) + '" fill="' + fill + '"/>';
  if (item.shape === "hexagon") return '<polygon points="' + (x + width * 0.25) + ',' + y + ' ' + (x + width * 0.75) + ',' + y + ' ' + (x + width) + ',' + centerY + ' ' + (x + width * 0.75) + ',' + (y + height) + ' ' + (x + width * 0.25) + ',' + (y + height) + ' ' + x + ',' + centerY + '" fill="' + fill + '"/>';
  return '<rect x="' + x + '" y="' + y + '" width="' + width + '" height="' + height + '" rx="6" fill="' + fill + '"/>';
}
function renderCanvas() {
  updateViewBox();
  const grid = Number(layout.gridSize || 25);
  let html =
    '<defs><pattern id="grid" width="' +
    grid +
    '" height="' +
    grid +
    '" patternUnits="userSpaceOnUse"><path d="M ' +
    grid +
    " 0 L 0 0 0 " +
    grid +
    '" fill="none" stroke="#d9dee8" stroke-width="1"/></pattern></defs><rect class="builder-background" width="' +
    layout.width +
    '" height="' +
    layout.height +
    '" fill="url(#grid)"/>';
  layout.elements.forEach((item) => {
    const active = item.id === selectedId;
    const handle = active
      ? '<rect class="resize-handle" data-resize-id="' +
        escapeHTML(item.id) +
        '" x="' +
        (item.x + item.width - 9) +
        '" y="' +
        (item.y + item.height - 9) +
        '" width="18" height="18" rx="3"/>'
      : "";
    html +=
      '<g class="builder-item type-' +
      escapeHTML(item.type) +
      (active ? " selected" : "") +
      '" data-id="' +
      escapeHTML(item.id) +
      '">' +
      shapeMarkup(item, escapeHTML(itemFill(item))) +
      '<text x="' +
      (item.x + item.width / 2) +
      '" y="' +
      (item.y + item.height / 2 + 4) +
      '" text-anchor="middle">' +
      (item.type === "tree" ? "" : escapeHTML(itemLabel(item))) +
      "</text>" +
      handle +
      "</g>";
  });
  canvas.innerHTML = html;
}
function renderInspector() {
  const item = selected();
  if (!item) {
    inspector.innerHTML =
      "<h2>" +
      managerT("properties") +
      "</h2><p>" +
      managerT("selectElement") +
      "</p>";
    return;
  }
  const field = (label, key, type = "text", min = "") =>
    "<label>" +
    label +
    '<input type="' +
    type +
    '" ' +
    min +
    ' data-key="' +
    key +
    '" value="' +
    escapeHTML(item[key] ?? "") +
    '"></label>';
  const shapeField =
    "<label>" +
    managerT("shape") +
    '<select data-key="shape">' +
    ELEMENT_SHAPES.map(
      (shape) =>
        '<option value="' +
        shape +
        '"' +
        (item.shape === shape ? " selected" : "") +
        ">" +
        managerT("shapes." + shape) +
        "</option>",
    ).join("") +
    "</select></label>";
  inspector.innerHTML =
    "<h2>" +
    managerT("properties") +
    '</h2><div class="selected-element-title">' +
    managerT("types." + item.type) +
    ": " +
    escapeHTML(item.id) +
    "</div>" +
    field(managerT("laoName"), "label_lo") +
    field(managerT("englishName"), "label_en") +
    (item.type === "booth"
      ? field(managerT("boothId"), "boothId") + field(managerT("zone"), "zone")
      : "") +
    (item.type !== "tree" ? shapeField : "") +
    field("X", "x", "number", 'min="0"') +
    field("Y", "y", "number", 'min="0"') +
    field(managerT("width"), "width", "number", 'min="1"') +
    field(managerT("height"), "height", "number", 'min="1"') +
    field(managerT("color"), "color", "color") +
    '<button class="button danger" id="delete-element">' +
    managerT("deleteElement") +
    "</button>";
}
function renderSettings() {
  widthInput.value = layout.width;
  heightInput.value = layout.height;
  gridInput.value = layout.gridSize;
  zoneColorList.replaceChildren();
  zonesInLayout().forEach((zone) => {
    const label = document.createElement("label");
    const input = document.createElement("input");
    input.type = "color";
    input.dataset.zoneColor = zone;
    input.value = layout.zoneColors[zone] || DEFAULT_ZONE_COLORS[zone] || DEFAULT_NEW_ZONE_COLOR;
    label.append("Zone " + zone + " ", input);
    zoneColorList.append(label);
  });
}
function renderLayers() {
  layersList.replaceChildren();
  const layerOrder = [...layout.elements].reverse();
  layerOrder.forEach((item) => {
    const row = document.createElement("div");
    row.className = "layer-row" + (item.id === selectedId ? " selected" : "");
    row.draggable = true;
    row.dataset.id = item.id;
    row.innerHTML =
      '<span class="layer-drag-handle" aria-hidden="true">⠿</span><button class="layer-select" type="button"><span class="layer-swatch" style="background:' +
      escapeHTML(item.color) +
      '"></span><span><strong>' +
      escapeHTML(itemLabel(item)) +
      "</strong><small>" +
      managerT("types." + item.type) +
      "</small></span></button>";
    row.querySelector(".layer-select").addEventListener("click", () => {
      selectedId = item.id;
      renderAll();
    });
    row.addEventListener("dragstart", (event) => {
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", item.id);
      row.classList.add("dragging");
    });
    row.addEventListener("dragend", () => {
      document
        .querySelectorAll(".layer-row")
        .forEach((entry) => entry.classList.remove("dragging", "drag-over"));
    });
    row.addEventListener("dragover", (event) => {
      event.preventDefault();
      const sourceId = event.dataTransfer.getData("text/plain");
      if (sourceId !== item.id) row.classList.add("drag-over");
    });
    row.addEventListener("dragleave", () => row.classList.remove("drag-over"));
    row.addEventListener("drop", (event) => {
      event.preventDefault();
      const sourceId = event.dataTransfer.getData("text/plain");
      const sourceIndex = layerOrder.findIndex(
        (entry) => entry.id === sourceId,
      );
      const targetIndex = layerOrder.findIndex((entry) => entry.id === item.id);
      if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex)
        return;
      const before = snapshot();
      const reordered = [...layerOrder];
      const [moved] = reordered.splice(sourceIndex, 1);
      reordered.splice(targetIndex, 0, moved);
      // Layers display front-to-back, while SVG draws layout.elements
      // back-to-front. Reverse once to preserve that existing data model.
      layout.elements = reordered.reverse();
      remember(before);
      renderAll();
    });
    layersList.append(row);
  });
}
function renderAll() {
  renderSettings();
  renderCanvas();
  renderInspector();
  renderLayers();
  document.querySelector("#undo-map").disabled = !undoStack.length;
  document.querySelector("#center-element").disabled = !layout.elements.length;
}
function renderPalette() {
  palette.replaceChildren();
  Object.keys(ELEMENT_TYPES).forEach((type) => {
    const button = document.createElement("button");
    button.className = "button";
    button.textContent = "+ " + managerT("types." + type);
    button.addEventListener("click", () => addElement(type));
    palette.append(button);
  });
}
function addElement(type) {
  const before = snapshot(),
    meta = ELEMENT_TYPES[type];
  const count = layout.elements.filter((item) => item.type === type).length + 1,
    id = type + "-" + count;
  layout.elements.push({
    id,
    type,
    boothId: type === "booth" ? "NEW" + count : "",
    zone: type === "booth" ? "A" : "",
    label_lo: "",
    label_en: managerT("types." + type),
    x: snap(layout.width / 2 - meta.width / 2),
    y: snap(layout.height / 2 - meta.height / 2),
    width: meta.width,
    height: meta.height,
    color: meta.color,
    shape: "rectangle",
  });
  selectedId = id;
  remember(before);
  renderAll();
}
function zoomAt(nextScale, clientX, clientY) {
  const oldScale = camera.scale,
    scale = Math.min(5, Math.max(1, nextScale));
  if (scale === oldScale) return;
  const anchor =
    clientX === undefined
      ? { x: layout.width / 2, y: layout.height / 2 }
      : eventPoint({ clientX, clientY });
  camera.x = anchor.x - ((anchor.x - camera.x) * oldScale) / scale;
  camera.y = anchor.y - ((anchor.y - camera.y) * oldScale) / scale;
  camera.scale = scale;
  updateViewBox();
}
function newBlankMap() {
  if (!confirm(managerT("newMapConfirm"))) return;
  remember();
  layout = {
    width: 800,
    height: 900,
    gridSize: 25,
    zoneColors: { ...DEFAULT_ZONE_COLORS },
    elements: [],
  };
  selectedId = null;
  camera = { scale: 1, x: 0, y: 0 };
  message.textContent = "";
  renderAll();
}
function replaceEditorLayout(nextLayout) {
  layout = structuredClone(normalizeMapLayout(nextLayout));
  selectedId = null;
  undoStack = [];
  camera = { scale: 1, x: 0, y: 0 };
  renderAll();
}
function addLayoutSourceButtons() {
  const newMapButton = document.querySelector("#new-map");
  if (!newMapButton) return;

  const loadButton = document.createElement("button");
  loadButton.id = "load-sheet-layout";
  loadButton.className = "button";
  loadButton.type = "button";

  const defaultButton = document.createElement("button");
  defaultButton.id = "load-default-layout";
  defaultButton.className = "button";
  defaultButton.type = "button";

  newMapButton.insertAdjacentElement("afterend", defaultButton);
  defaultButton.insertAdjacentElement("afterend", loadButton);

  const updateLabels = () => {
    const copy = layoutCopy();
    loadButton.textContent = copy.load;
    defaultButton.textContent = copy.default;
  };

  loadButton.addEventListener("click", () => loadGoogleSheetLayout(true));
  defaultButton.addEventListener("click", () => {
    if (!confirm(layoutCopy().confirm)) return;
    replaceEditorLayout(defaultMapLayout());
    message.textContent = layoutCopy().defaultLoaded;
  });

  onManagerLanguageChange(updateLabels);
  updateLabels();
}
async function loadGoogleSheetLayout(confirmReplace = false) {
  if (confirmReplace && !confirm(layoutCopy().confirm)) return;

  const loadButton = document.querySelector("#load-sheet-layout");
  if (loadButton) loadButton.disabled = true;
  message.textContent = layoutCopy().loading;
  setMapLoading(true);

  try {
    const sheetLayout = await loadMapLayoutFromGoogleSheet();
    replaceEditorLayout(sheetLayout);
    message.textContent = layoutCopy().loaded;
  } catch (error) {
    message.textContent = `${layoutCopy().loadFailed} ${error.message}`;
  } finally {
    if (loadButton) loadButton.disabled = false;
    setMapLoading(false);
  }
}
function exportPNG() {
  const svg = canvas.cloneNode(true);
  svg.setAttribute("viewBox", "0 0 " + layout.width + " " + layout.height);
  svg.setAttribute("width", layout.width);
  svg.setAttribute("height", layout.height);
  svg.querySelectorAll(".resize-handle").forEach((node) => node.remove());
  const image = new Image(),
    source = new XMLSerializer().serializeToString(svg);
  image.onload = () => {
    const output = document.createElement("canvas"),
      context = output.getContext("2d");
    output.width = layout.width * 2;
    output.height = layout.height * 2;
    context.scale(2, 2);
    context.fillStyle = "#fff";
    context.fillRect(0, 0, layout.width, layout.height);
    context.drawImage(image, 0, 0, layout.width, layout.height);
    const link = document.createElement("a");
    link.download = "event-map.png";
    link.href = output.toDataURL("image/png");
    link.click();
    URL.revokeObjectURL(image.src);
    message.textContent = managerT("exported");
  };
  image.src = URL.createObjectURL(
    new Blob([source], { type: "image/svg+xml;charset=utf-8" }),
  );
}

canvas.addEventListener("pointerdown", (event) => {
  if (event.pointerType === "mouse" && event.button !== 0) return;
  pointers.set(event.pointerId, {
    clientX: event.clientX,
    clientY: event.clientY,
  });
  const handle = event.target.closest("[data-resize-id]"),
    group = event.target.closest("[data-id]"),
    point = eventPoint(event);
  if (pointers.size === 2) {
    const [first, second] = [...pointers.values()];
    const midpoint = {
      clientX: (first.clientX + second.clientX) / 2,
      clientY: (first.clientY + second.clientY) / 2,
    };
    const anchor = eventPoint(midpoint);
    interaction = {
      kind: "pinch",
      distance: Math.max(
        1,
        Math.hypot(
          first.clientX - second.clientX,
          first.clientY - second.clientY,
        ),
      ),
      scale: camera.scale,
      mapX: anchor.x,
      mapY: anchor.y,
    };
    event.preventDefault();
    canvas.setPointerCapture(event.pointerId);
    return;
  }
  if (!handle && !group && selectedId !== null) {
    selectedId = null;
    renderAll();
  }
  // Pan mode has priority over moving an element. This prevents accidental
  // element moves while inspecting a zoomed-in portion of the map.
  if ((panMode || spaceHeld) && camera.scale > 1) {
    event.preventDefault();
    interaction = startPan(event);
    canvas.setPointerCapture(event.pointerId);
    return;
  }
  if (handle) {
    event.preventDefault();
    selectedId = handle.dataset.resizeId;
    const item = selected(),
      before = snapshot();
    interaction = {
      kind: "resize",
      pointerId: event.pointerId,
      start: point,
      item: { ...item },
      before,
    };
    canvas.setPointerCapture(event.pointerId);
    renderCanvas();
    renderInspector();
    renderLayers();
    return;
  }
  if (group) {
    event.preventDefault();
    const clickedId = group.dataset.id;

    // The first click is selection only. A later press-and-drag on the
    // selected element moves it, avoiding accidental moves while inspecting.
    if (selectedId !== clickedId) {
      selectedId = clickedId;
      renderAll();
      return;
    }

    const item = selected(),
      before = snapshot();
    interaction = {
      kind: "drag",
      pointerId: event.pointerId,
      offsetX: point.x - item.x,
      offsetY: point.y - item.y,
      before,
    };
    canvas.setPointerCapture(event.pointerId);
    renderCanvas();
    renderInspector();
    renderLayers();
    return;
  }
  if (camera.scale > 1) {
    event.preventDefault();
    interaction = startPan(event);
    canvas.setPointerCapture(event.pointerId);
  } else if (event.pointerType === "touch") {
    interaction = {
      kind: "page-scroll",
      pointerId: event.pointerId,
      clientY: event.clientY,
    };
    canvas.setPointerCapture(event.pointerId);
  } else if (selectedId !== null) {
    selectedId = null;
    renderAll();
  }
});
canvas.addEventListener("pointermove", (event) => {
  if (!pointers.has(event.pointerId)) return;
  pointers.set(event.pointerId, {
    clientX: event.clientX,
    clientY: event.clientY,
  });
  if (interaction?.kind === "pinch" && pointers.size >= 2) {
    const [first, second] = [...pointers.values()];
    const distance = Math.max(
      1,
      Math.hypot(
        first.clientX - second.clientX,
        first.clientY - second.clientY,
      ),
    );
    const midpoint = {
      clientX: (first.clientX + second.clientX) / 2,
      clientY: (first.clientY + second.clientY) / 2,
    };
    const scale = Math.min(
      5,
      Math.max(1, (interaction.scale * distance) / interaction.distance),
    );
    camera.scale = scale;
    camera.x = midpoint.clientX - canvas.getBoundingClientRect().left;
    camera.y = midpoint.clientY - canvas.getBoundingClientRect().top;
    const viewWidth = layout.width / scale,
      viewHeight = layout.height / scale;
    camera.x = interaction.mapX - (camera.x / canvas.clientWidth) * viewWidth;
    camera.y = interaction.mapY - (camera.y / canvas.clientHeight) * viewHeight;
    event.preventDefault();
    scheduleCameraPaint();
    return;
  }
  if (!interaction || interaction.pointerId !== event.pointerId) return;
  if (interaction.kind === "page-scroll") {
    window.scrollBy({
      top: interaction.clientY - event.clientY,
      left: 0,
      behavior: "auto",
    });
    interaction.clientY = event.clientY;
    return;
  }
  const item = selected();
  if (interaction.kind === "drag" && item) {
    const point = eventPoint(event);
    item.x = Math.max(
      0,
      Math.min(layout.width - item.width, snap(point.x - interaction.offsetX)),
    );
    item.y = Math.max(
      0,
      Math.min(
        layout.height - item.height,
        snap(point.y - interaction.offsetY),
      ),
    );
    renderCanvas();
  } else if (interaction.kind === "resize" && item) {
    const point = eventPoint(event);
    item.width = Math.max(
      10,
      Math.min(
        layout.width - item.x,
        snap(interaction.item.width + point.x - interaction.start.x),
      ),
    );
    item.height = Math.max(
      10,
      Math.min(
        layout.height - item.y,
        snap(interaction.item.height + point.y - interaction.start.y),
      ),
    );
    renderCanvas();
  } else if (interaction.kind === "pan") {
    panToPointer(event, interaction);
    scheduleCameraPaint();
  }
});
canvas.addEventListener("pointerup", (event) => {
  pointers.delete(event.pointerId);
  if (
    !interaction ||
    (interaction.pointerId !== event.pointerId && interaction.kind !== "pinch")
  )
    return;
  if (interaction.before) remember(interaction.before);
  if (interaction.kind === "pinch" && pointers.size === 1) {
    const [remaining] = pointers.entries();
    interaction = startPan({ pointerId: remaining[0], ...remaining[1] });
    return;
  }
  interaction = null;
  renderInspector();
});
canvas.addEventListener("pointercancel", (event) => {
  pointers.delete(event.pointerId);
  interaction = null;
});
canvas.addEventListener(
  "wheel",
  (event) => {
    // At 100% the page keeps its normal vertical scroll. Once the manager is
    // zoomed in, the wheel belongs to the map just like the public map page.
    let delta = event.deltaY;
    if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) delta *= 16;
    if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE)
      delta *= window.innerHeight;
    delta = Math.max(-120, Math.min(120, delta));
    if (camera.scale <= 1) {
      event.preventDefault();
      window.scrollBy({ top: delta, left: 0, behavior: "auto" });
      return;
    }
    event.preventDefault();
    zoomAt(
      camera.scale * Math.exp(-delta * 0.0025),
      event.clientX,
      event.clientY,
    );
  },
  { passive: false },
);
canvas.addEventListener("dblclick", (event) => {
  event.preventDefault();
  zoomAt(camera.scale * 1.25, event.clientX, event.clientY);
});

inspector.addEventListener("focusin", (event) => {
  if (event.target.matches("[data-key]")) editStart = snapshot();
});
inspector.addEventListener("input", (event) => {
  const item = selected(),
    key = event.target.dataset.key;
  if (!item || !key) return;
  item[key] = ["x", "y", "width", "height"].includes(key)
    ? Math.max(1, Number(event.target.value) || 1)
    : key === "zone"
      ? event.target.value.trim().toUpperCase()
      : event.target.value;
  if (key === "zone") ensureZoneColor(item.zone);
  renderCanvas();
});
inspector.addEventListener("change", (event) => {
  const item = selected(), key = event.target.dataset.key;
  if (item && key) {
    item[key] = ["x", "y", "width", "height"].includes(key)
      ? Math.max(1, Number(event.target.value) || 1)
      : key === "zone"
        ? event.target.value.trim().toUpperCase()
        : event.target.value;
    if (key === "zone") ensureZoneColor(item.zone);
    renderCanvas();
  }
  if (editStart && !equal(editStart, layout)) remember(editStart);
  editStart = null;
  if (key === "zone") renderAll();
});
inspector.addEventListener("click", (event) => {
  if (event.target.id !== "delete-element") return;
  remember();
  layout.elements = layout.elements.filter((item) => item.id !== selectedId);
  selectedId = null;
  renderAll();
});
[widthInput, heightInput, gridInput].forEach((input) => {
  input.addEventListener("focusin", () => {
    editStart = snapshot();
  });
  input.addEventListener("input", () => {
    layout.width = Math.max(100, Number(widthInput.value) || 800);
    layout.height = Math.max(100, Number(heightInput.value) || 900);
    layout.gridSize = Math.max(5, Number(gridInput.value) || 25);
    renderCanvas();
  });
  input.addEventListener("change", () => {
    if (editStart && !equal(editStart, layout)) remember(editStart);
    editStart = null;
    renderAll();
  });
});
zoneColorList.addEventListener("focusin", (event) => {
  if (event.target.matches("[data-zone-color]")) {
    editStart = snapshot();
  }
});
zoneColorList.addEventListener("input", (event) => {
  if (event.target.matches("[data-zone-color]")) {
    layout.zoneColors[event.target.dataset.zoneColor] = event.target.value;
    renderCanvas();
  }
});
zoneColorList.addEventListener("change", (event) => {
  if (event.target.matches("[data-zone-color]")) {
    if (editStart && !equal(editStart, layout)) remember(editStart);
    editStart = null;
    renderAll();
  }
});
document.querySelector("#save-map").addEventListener("click", () => {
  saveMapLayout(layout);
  document.dispatchEvent(
    new CustomEvent("eventmap:save-layout", { detail: layout }),
  );
  message.textContent = managerT("saving");
});
document.querySelector("#new-map").addEventListener("click", newBlankMap);
document.querySelector("#pan-mode").addEventListener("click", (event) => {
  panMode = !panMode;
  event.currentTarget.classList.toggle("active", panMode);
  event.currentTarget.setAttribute("aria-pressed", String(panMode));
  canvas.classList.toggle("pan-mode", panMode);
});
document.querySelector("#center-element").addEventListener("click", () => {
  if (!layout.elements.length) return;
  const before = snapshot();
  const left = Math.min(...layout.elements.map((item) => item.x));
  const top = Math.min(...layout.elements.map((item) => item.y));
  const right = Math.max(...layout.elements.map((item) => item.x + item.width));
  const bottom = Math.max(...layout.elements.map((item) => item.y + item.height));
  const offsetX = (layout.width - (right - left)) / 2 - left;
  const offsetY = (layout.height - (bottom - top)) / 2 - top;

  layout.elements.forEach((item) => {
    item.x += offsetX;
    item.y += offsetY;
  });
  remember(before);
  renderAll();
});
document.querySelector("#undo-map").addEventListener("click", undo);
document
  .querySelector("#manager-zoom-in")
  .addEventListener("click", () => zoomAt(camera.scale * 1.25));
document
  .querySelector("#manager-zoom-out")
  .addEventListener("click", () => zoomAt(camera.scale / 1.25));
document.querySelector("#manager-fit-map").addEventListener("click", () => {
  camera = { scale: 1, x: 0, y: 0 };
  renderCanvas();
});
document.querySelector("#export-map").addEventListener("click", exportPNG);
document.querySelector("#preview-map").addEventListener("click", () => {
  const preview = canvas.cloneNode(true);
  preview.setAttribute("viewBox", "0 0 " + layout.width + " " + layout.height);
  preview.querySelectorAll(".resize-handle").forEach((node) => node.remove());
  previewImage.replaceChildren(preview);
  previewDialog.showModal();
});
document
  .querySelector("#close-map-preview")
  .addEventListener("click", () => previewDialog.close());
window.addEventListener("keydown", (event) => {
  if (
    event.code === "Space" &&
    !event.target.matches("input, textarea, button")
  ) {
    spaceHeld = true;
    canvas.classList.add("pan-mode");
    event.preventDefault();
  }
  if (
    (event.ctrlKey || event.metaKey) &&
    event.key.toLowerCase() === "z" &&
    !event.target.matches("input, textarea")
  ) {
    event.preventDefault();
    undo();
  }
});
window.addEventListener("keyup", (event) => {
  if (event.code !== "Space") return;
  spaceHeld = false;
  canvas.classList.toggle("pan-mode", panMode);
});
addLayoutSourceButtons();
onManagerLanguageChange(() => {
  renderPalette();
  renderAll();
});
initialiseManagerLanguage();
renderAll();
void loadGoogleSheetLayout();
