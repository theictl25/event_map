export const MAP_SETTINGS_KEY = "eventmap_map_settings_v1";
export const DEFAULT_MAP_WIDTH = 800;
export const DEFAULT_MAP_HEIGHT = 900;

export function defaultBoothLayouts() {
  const booths = [];
  ["A", "B", "C"].forEach((zone, zoneIndex) => {
    for (let number = 1; number <= 12; number++) {
      const index = number - 1;
      const block = Math.floor(index / 4);
      const row = Math.floor((index % 4) / 2);
      const column = index % 2;
      booths.push({
        id: `${zone}${String(number).padStart(2, "0")}`,
        zone,
        number,
        x: 145 + zoneIndex * 210 + column * 70,
        y: 300 + block * 145 + row * 50,
        width: 64,
        height: 44,
      });
    }
  });
  for (let number = 1; number <= 6; number++) {
    booths.push({
      id: `D${String(number).padStart(2, "0")}`,
      zone: "D",
      number,
      x: 155 + (number - 1) * 78,
      y: 175,
      width: 64,
      height: 44,
    });
  }
  return booths;
}

function positiveNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : fallback;
}

export function getMapSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(MAP_SETTINGS_KEY) || "{}");
    return {
      width: positiveNumber(saved.width, DEFAULT_MAP_WIDTH),
      height: positiveNumber(saved.height, DEFAULT_MAP_HEIGHT),
      booths:
        saved.booths && typeof saved.booths === "object" ? saved.booths : {},
    };
  } catch {
    return { width: DEFAULT_MAP_WIDTH, height: DEFAULT_MAP_HEIGHT, booths: {} };
  }
}

export function saveMapSettings(settings) {
  localStorage.setItem(MAP_SETTINGS_KEY, JSON.stringify(settings));
}

export function resetMapSettings() {
  localStorage.removeItem(MAP_SETTINGS_KEY);
}

export function applyBoothOverrides(layouts) {
  const overrides = getMapSettings().booths;
  return layouts.map((booth) => {
    const saved = overrides[booth.id] || {};
    return {
      ...booth,
      x: positiveNumber(saved.x, booth.x),
      y: positiveNumber(saved.y, booth.y),
      width: positiveNumber(saved.width, booth.width),
      height: positiveNumber(saved.height, booth.height),
    };
  });
}
