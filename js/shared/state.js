const savedLang = localStorage.getItem("eventmap_lang");

export let featuredShops = {};
export let boothImages = {};

export function getBoothImages(boothId) {
  return (
    boothImages[
      String(boothId || "")
        .trim()
        .toUpperCase()
    ] || []
  );
}
export function setFeaturedShops(shops) {
  featuredShops = shops;
}
export function getFeaturedShops() {
  return featuredShops;
}

// Event-level copy used by the Information dialog. Each key may contain
// language variants, for example: { infoTitle: { lo: "...", en: "..." } }.
export let eventInfo = {};
export function setEventInfo(info) {
  eventInfo = info && typeof info === "object" ? info : {};
}

export let event = {};
export function setEvent(data) {
  event = data && typeof data === "object" ? data : {};
}
export function getEvent() {
  return event;
}

export const booths = [];
export const boothElements = new Map();
export let boothById = new Map();
export function updateBoothByIdMap() {
  boothById = new Map(booths.map((booth) => [booth.id, booth]));
}

export const state = {
  selected: "",
  query: "",
  category: "all",
  zone: "all",
  scale: 1,
  minScale: 1,
  maxScale: 5,
  x: 0,
  y: 0,
  lang: savedLang === "en" ? "en" : "lo",
};
