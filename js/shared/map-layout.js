/**
 * Map layout data module.
 *
 * This module is deliberately independent from the Manager UI. It owns the
 * default map, validates saved data, and provides one in-memory active layout.
 * The element field names are kept compatible with Google Sheets / Apps Script.
 */

export const MAP_SETTINGS_KEY = "eventmap_map_layout_v2";
export const DEFAULT_MAP_WIDTH = 800;
export const DEFAULT_MAP_HEIGHT = 900;
export const ELEMENT_SHAPES = ["rectangle", "circle", "triangle", "hexagon"];
export const DEFAULT_ZONE_COLORS = {
  A: "#ffebee",
  B: "#fff5cc",
  C: "#eaf7ed",
  D: "#e1f2ff",
};
export const DEFAULT_NEW_ZONE_COLOR = "#e9d5ff";

export const ELEMENT_TYPES = {
  booth: { color: "#ffebee", width: 70, height: 48 },
  walkway: { color: "#f1f5f9", width: 220, height: 45 },
  entrance: { color: "#dcfce7", width: 90, height: 42 },
  exit: { color: "#ffe4e6", width: 90, height: 42 },
  tree: { color: "#bbf7d0", width: 44, height: 44 },
  stage: { color: "#dbeafe", width: 220, height: 75 },
  label: { color: "#fef3c7", width: 140, height: 36 },
  other: { color: "#e9d5ff", width: 90, height: 55 },
};

/**
 * Creates the original demonstration booths. It is used only when there is
 * no saved map layout yet; it never overwrites an existing map.
 */
export function defaultBoothLayouts() {
  const booths = [];

  ["A", "B", "C"].forEach((zone, zoneIndex) => {
    for (let number = 1; number <= 12; number += 1) {
      const boothIndex = number - 1;
      const id = zone + String(number).padStart(2, "0");

      booths.push({
        id,
        type: "booth",
        boothId: id,
        zone,
        x: 145 + zoneIndex * 210 + (boothIndex % 2) * 70,
        y:
          300 +
          Math.floor(boothIndex / 4) * 145 +
          Math.floor((boothIndex % 4) / 2) * 50,
        width: 64,
        height: 44,
        color: "#ffebee",
      });
    }
  });

  for (let number = 1; number <= 6; number += 1) {
    const id = "D" + String(number).padStart(2, "0");
    booths.push({
      id,
      type: "booth",
      boothId: id,
      zone: "D",
      x: 155 + (number - 1) * 78,
      y: 175,
      width: 64,
      height: 44,
      color: "#ffebee",
    });
  }

  return booths;
}

/**
 * Returns a complete new layout object. Callers can safely edit it because
 * each call creates fresh objects and arrays.
 */
export function defaultMapLayout() {
  return {
    width: DEFAULT_MAP_WIDTH,
    height: DEFAULT_MAP_HEIGHT,
    gridSize: 25,
    zoneColors: { ...DEFAULT_ZONE_COLORS },
    elements: [
      {
        id: "stage-1",
        type: "stage",
        label_lo: "ເວທີຫຼັກ",
        label_en: "MAIN STAGE",
        x: 290,
        y: 35,
        width: 220,
        height: 70,
        color: "#dbeafe",
      },
      {
        id: "walkway-1",
        type: "walkway",
        x: 80,
        y: 760,
        width: 640,
        height: 30,
        color: "#f1f5f9",
      },
      {
        id: "entrance-1",
        type: "entrance",
        label_lo: "ທາງເຂົ້າ",
        label_en: "Entrance",
        x: 210,
        y: 830,
        width: 90,
        height: 42,
        color: "#dcfce7",
      },
      {
        id: "exit-1",
        type: "exit",
        label_lo: "ທາງອອກ",
        label_en: "Exit",
        x: 500,
        y: 830,
        width: 90,
        height: 42,
        color: "#ffe4e6",
      },
      ...defaultBoothLayouts(),
    ],
  };
}

function positiveNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : fallback;
}

function normalizeZoneColors(sourceColors, elements) {
  const colors = { ...DEFAULT_ZONE_COLORS };
  Object.entries(sourceColors || {}).forEach(([zone, color]) => {
    const key = String(zone).trim().toUpperCase();
    if (/^[A-Z0-9_-]{1,24}$/.test(key) && /^#[0-9a-f]{6}$/i.test(String(color))) {
      colors[key] = String(color);
    }
  });
  elements.forEach((element) => {
    if (element.type !== "booth") return;
    const zone = element.zone.trim().toUpperCase();
    if (/^[A-Z0-9_-]{1,24}$/.test(zone) && !colors[zone]) {
      colors[zone] = DEFAULT_NEW_ZONE_COLOR;
    }
  });
  return colors;
}

/**
 * Makes an individual element safe for rendering without changing its
 * external schema. Unknown element types become "other".
 */
function normalizeElement(element, index) {
  const type = ELEMENT_TYPES[element?.type] ? element.type : "other";
  const defaults = ELEMENT_TYPES[type];

  return {
    id: String(element?.id || type + "-" + (index + 1)),
    type,
    boothId: String(element?.boothId || ""),
    zone: String(element?.zone || ""),
    label_lo: String(element?.label_lo || ""),
    label_en: String(element?.label_en || ""),
    x: Math.max(0, Number(element?.x) || 0),
    y: Math.max(0, Number(element?.y) || 0),
    width: positiveNumber(element?.width, defaults.width),
    height: positiveNumber(element?.height, defaults.height),
    color: String(element?.color || defaults.color),
    shape: ELEMENT_SHAPES.includes(element?.shape)
      ? element.shape
      : "rectangle",
  };
}

/**
 * Accepts data from localStorage, Apps Script, or the Manager and always
 * returns a renderable layout with the current element schema.
 */
export function normalizeMapLayout(value) {
  const fallback = defaultMapLayout();
  const source = value && typeof value === "object" ? value : fallback;
  const elements = Array.isArray(source.elements)
    ? source.elements
    : fallback.elements;
  const normalizedElements = elements.map(normalizeElement);

  return {
    width: positiveNumber(source.width, fallback.width),
    height: positiveNumber(source.height, fallback.height),
    gridSize: positiveNumber(source.gridSize, fallback.gridSize),
    zoneColors: normalizeZoneColors(source?.zoneColors, normalizedElements),
    elements: normalizedElements,
  };
}

function readLocalLayout() {
  try {
    return normalizeMapLayout(
      JSON.parse(localStorage.getItem(MAP_SETTINGS_KEY) || "null"),
    );
  } catch {
    return defaultMapLayout();
  }
}

let activeLayout = readLocalLayout();

export function getMapLayout() {
  return activeLayout;
}

/**
 * Updates the shared in-memory layout. Set persist=true only after an editor
 * action is intentionally saved locally.
 */
export function setMapLayout(layout, persist = false) {
  activeLayout = normalizeMapLayout(layout);

  if (persist) {
    localStorage.setItem(MAP_SETTINGS_KEY, JSON.stringify(activeLayout));
  }

  return activeLayout;
}

export function saveMapLayout(layout) {
  return setMapLayout(layout, true);
}

export function resetMapLayout() {
  localStorage.removeItem(MAP_SETTINGS_KEY);
  activeLayout = defaultMapLayout();
  return activeLayout;
}
