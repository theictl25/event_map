export const $ = (selector) => document.querySelector(selector);
export const isBoothsPage = document.body.classList.contains("booths-page");
export const SVG_NS = "http://www.w3.org/2000/svg";
export const desktopQuery = matchMedia("(min-width: 1100px)");
export const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
export const GOOGLE_SHEET_API =
  "https://script.google.com/macros/s/AKfycbyp6sGnYVMorD19sv47KpBCKQ5mu1DlQbSKH-EOhF8jr3r4Waz2AOPMwDzG-DJ7mktO/exec";

export const zones = {
  A: { background: "#ffebee", border: "#ffbac4", text: "#a32847" },
  B: { background: "#fff5cc", border: "#f6d963", text: "#946126" },
  C: { background: "#eaf7ed", border: "#bce9c7", text: "#137658" },
  D: { background: "#e1f2ff", border: "#a7dcff", text: "#07628e" },
};

import { getMapLayout } from "./map-layout.js";

const mapSettings = getMapLayout();
export const MAP_WIDTH = mapSettings.width;
export const MAP_HEIGHT = mapSettings.height;

export const MAP_CONFIG = {
  maxScaleMultiplier: 5,
  edgePadding: 0,
  zoomButtonFactor: 1.25,
  wheelSensitivity: 0.0025,
  pinchSensitivity: 1,
  dragThreshold: 6,
};
