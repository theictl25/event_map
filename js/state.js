const savedLang = localStorage.getItem("eventmap_lang");

export let featuredShops = {};
export function setFeaturedShops(shops) {
  featuredShops = shops;
}
export function getFeaturedShops() {
  return featuredShops;
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
