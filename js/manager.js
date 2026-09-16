import {
  defaultBoothLayouts,
  getMapSettings,
  resetMapSettings,
  saveMapSettings,
} from "./map-layout.js";

const editor = document.querySelector("#booth-editor");
const widthInput = document.querySelector("#map-width");
const heightInput = document.querySelector("#map-height");
const preview = document.querySelector("#manager-preview");
const message = document.querySelector("#manager-message");
let settings = getMapSettings();
let layouts = [];

function number(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function currentLayouts() {
  return defaultBoothLayouts().map((booth) => {
    const saved = settings.booths[booth.id] || {};
    return {
      ...booth,
      x: number(saved.x, booth.x),
      y: number(saved.y, booth.y),
      width: number(saved.width, booth.width),
      height: number(saved.height, booth.height),
    };
  });
}

function renderPreview() {
  const width = number(widthInput.value, 800);
  const height = number(heightInput.value, 900);
  preview.setAttribute("viewBox", `0 0 ${width} ${height}`);
  preview.innerHTML = `<defs><pattern id="grid" width="25" height="25" patternUnits="userSpaceOnUse"><path d="M 25 0 L 0 0 0 25" fill="none" stroke="#d9dee8" stroke-width="1"/></pattern></defs><rect width="${width}" height="${height}" fill="url(#grid)"/>${layouts.map((booth) => `<rect class="preview-booth zone-${booth.zone}" x="${booth.x}" y="${booth.y}" width="${booth.width}" height="${booth.height}" rx="5"><title>${booth.id}</title></rect><text x="${booth.x + booth.width / 2}" y="${booth.y + booth.height / 2 + 4}" text-anchor="middle">${booth.id}</text>`).join("")}`;
}

function renderTable() {
  layouts = currentLayouts();
  editor.innerHTML = layouts
    .map(
      (booth) =>
        `<tr data-id="${booth.id}"><td>${booth.id}</td><td>${booth.zone}</td>${["x", "y", "width", "height"].map((field) => `<td><input data-field="${field}" type="number" min="1" value="${booth[field]}"></td>`).join("")}</tr>`,
    )
    .join("");
  renderPreview();
}

function syncEditedBooth(event) {
  const input = event.target;
  const row = input.closest("tr");
  if (!row) return;
  const booth = layouts.find((item) => item.id === row.dataset.id);
  booth[input.dataset.field] = number(input.value, booth[input.dataset.field]);
  settings.booths[booth.id] = {
    x: booth.x,
    y: booth.y,
    width: booth.width,
    height: booth.height,
  };
  renderPreview();
}

widthInput.value = settings.width;
heightInput.value = settings.height;
renderTable();
editor.addEventListener("input", syncEditedBooth);
widthInput.addEventListener("input", renderPreview);
heightInput.addEventListener("input", renderPreview);

document.querySelector("#save-map").addEventListener("click", () => {
  settings.width = number(widthInput.value, 800);
  settings.height = number(heightInput.value, 900);
  saveMapSettings(settings);
  document.dispatchEvent(
    new CustomEvent("eventmap:save-layout", { detail: settings }),
  );
  message.textContent = "กำลังบันทึก...";
});

document.querySelector("#reset-map").addEventListener("click", () => {
  resetMapSettings();
  settings = getMapSettings();
  widthInput.value = settings.width;
  heightInput.value = settings.height;
  message.textContent = "คืนค่าเริ่มต้นแล้ว";
  renderTable();
});
