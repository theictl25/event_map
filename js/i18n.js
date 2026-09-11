import { $, isBoothsPage } from "./config.js";
import { state, booths, boothById } from "./state.js";

export const translations = {
  lo: {
    docTitleHome: "Event Map — ຄົ້ນຫາບູທທີ່ທ່ານຊື່ນຊອບ",
    docTitleBooths: "ບູທທັງໝົດ — Event Map",
    brandTitle: "EVENT MAP",
    brandSubtitle: "ຄົ້ນຫາບູທທີ່ທ່ານຊື່ນຊອບ",
    navMap: "ແຜນທີ່",
    navBooths: "ບູທທັງໝົດ",
    navInfo: "ຂໍ້ມູນ",
    directoryTitle: "ບູທທັງໝົດ",
    viewAllBooths: "ເບິ່ງບູທທັງໝົດ →",
    searchPlaceholder: "ຄົ້ນຫາຮ້ານ ຫຼື ເລກບູທ...",
    searchLabel: "ຄົ້ນຫາຮ້ານ ຫຼື ເລກບູທ",
    categoryLabel: "ໝວດໝູ່",
    catAll: "ໝວດໝູ່ທັງໝົດ",
    catFood: "ອາຫານ ແລະ ເຄື່ອງດື່ມ",
    catCrafts: "ຫັດຖະກຳ",
    catFashion: "ແຟຊັ່ນ",
    catPlants: "ຕົ້ນໄມ້",
    catOther: "ອື່ນໆ",
    zoneAll: "ໂຊນທັງໝົດ",
    mainStage: "ເວທີຫຼັກ",
    walkway: "ທາງຍ່າງ",
    entrance1: "ທາງເຂົ້າ 1",
    exit1: "ທາງອອກ 1",
    entrance2: "ທາງເຂົ້າ 2",
    exit2: "ທາງອອກ 2",
    entranceLegend: "ທາງເຂົ້າ",
    exitLegend: "ທາງອອກ",
    zoomIn: "ຂະຫຍາຍ",
    zoomOut: "ຍໍ້",
    fitMap: "ປັບພໍດີໜ້າຈໍ",
    dialogDetailsTitle: "ລາຍລະອຽດບູທ",
    aboutTitle: "ກ່ຽວກັບ",
    facebook: "Facebook",
    getDirections: "ນຳທາງໄປບູທ",
    shareBooth: "ແຊຣ໌ບູທ",
    infoTitle: "ຍິນດີຕ້ອນຮັບສູ່ Event Map",
    infoText1: "ຄົ້ນຫາຊື່ຮ້ານ ຫຼື ເລກບູທ, ກົດທີ່ບູທເພື່ອເບິ່ງລາຍລະອຽດ ແລະ ໃຊ້ຕົວຕອງໂຊນ ຫຼື ໝວດໝູ່ເພື່ອສຳຫຼວດ.",
    infoText2: "ລາກເພື່ອຍ້າຍແຜນທີ່. ໃຊ້ສອງນິ້ວ, ສະກຣອນ ຫຼື ກົດປຸ່ມ + ແລະ − ເພື່ອຂະຫຍາຍ/ຍໍ້. ຜູ້ໃຊ້ຄີບອດສາມາດໃຊ້ Tab ແລະ Enter ໄດ້.",
    infoText3: "ນີ້ແມ່ນແຜນທີ່ຈຳລອງ. ຂໍ້ມູນຮ້ານ ແລະ ເສັ້ນທາງນຳທາງແມ່ນເພື່ອການສາທິດເທົ່ານັ້ນ.",
    gotIt: "ເຂົ້າໃຈແລ້ວ",
    boothCount: (count) => `${count} ບູທ`,
    noBooths: "ບໍ່ພົບບູທ. ກະລຸນາລອງຄົ້ນຫາໃໝ່ ຫຼື ຣີເຊັດຕົວຕອງ.",
    boothsFoundAnnounce: (count) => `ພົບ ${count} ບູທ.`,
    selectedBoothAnnounce: (name, id, zone) => `ເລືອກ ${name}, ບູທ ${id}, ໂຊນ ${zone}.`,
    routeNotice: (entrance, zone, name, id) => `ເສັ້ນທາງສາທິດ: ທາງເຂົ້າ ${entrance} → ໂຊນ ${zone} → ${name} (${id}). ຕິດຕາມເສັ້ນປະ. ບໍ່ມີການຕິດຕາມຕຳແໜ່ງຈິງ.`,
    routeAnnounce: (entrance, id) => `ສະແດງເສັ້ນທາງຈາກ ທາງເຂົ້າ ${entrance} ໄປຫາບູທ ${id}.`,
    linkCopied: "ຄັດລອກລິ້ງບູທແລ້ວ.",
    promptCopy: "ຄັດລອກລາຍລະອຽດບູທ:",
    promptCopyLink: "ຄັດລອກລິ້ງບູທນີ້:",
    footerText: (count) => `EventMap · ${count} ຕຳແໜ່ງບູທ · ລະບົບແນະນຳບູທ`,
    defaultDesc: "ຍັງບໍ່ທັນມີຂໍ້ມູນລາຍລະອຽດຮ້ານເທື່ອ.",
    defaultHours: "ບໍ່ໄດ້ລະບຸເວລາເປີດ-ປິດ",
  },
  en: {
    docTitleHome: "Event Map — Find Your Favorite Booth",
    docTitleBooths: "All Booths — Event Map",
    brandTitle: "EVENT MAP",
    brandSubtitle: "Find Your Favorite Booth",
    navMap: "Map",
    navBooths: "All Booths",
    navInfo: "Information",
    directoryTitle: "All Booths",
    viewAllBooths: "View All Booths →",
    searchPlaceholder: "Search shops or booth numbers...",
    searchLabel: "Search shops or booth numbers",
    categoryLabel: "Category",
    catAll: "All categories",
    catFood: "Food & Drink",
    catCrafts: "Crafts",
    catFashion: "Fashion",
    catPlants: "Plants",
    catOther: "Other",
    zoneAll: "All Zones",
    mainStage: "MAIN STAGE",
    walkway: "WALKWAY",
    entrance1: "Entrance 1",
    exit1: "Exit 1",
    entrance2: "Entrance 2",
    exit2: "Exit 2",
    entranceLegend: "Entrance",
    exitLegend: "Exit",
    zoomIn: "Zoom in",
    zoomOut: "Zoom out",
    fitMap: "Fit entire map",
    dialogDetailsTitle: "Booth details",
    aboutTitle: "About",
    facebook: "Facebook",
    getDirections: "Get Directions",
    shareBooth: "Share Booth",
    infoTitle: "Welcome to Event Map",
    infoText1: "Search for a shop or booth number, tap a booth to see its details, and use the zone and category filters to explore.",
    infoText2: "Drag to move the map. Pinch, scroll, or use the + and − buttons to zoom. Keyboard users can focus booths with Tab and open them with Enter.",
    infoText3: "This is a demonstration venue. Store information and walking routes are illustrative, not live event or emergency guidance.",
    gotIt: "Got it",
    boothCount: (count) => `${count} booths`,
    noBooths: "No booths found. Try another search or reset your filters.",
    boothsFoundAnnounce: (count) => `${count} booths found.`,
    selectedBoothAnnounce: (name, id, zone) => `Selected ${name}, booth ${id}, Zone ${zone}.`,
    routeNotice: (entrance, zone, name, id) => `Illustrative route: Entrance ${entrance} → Zone ${zone} → ${name} (${id}). Follow the dashed line. Your live location is not tracked; follow venue signage on site.`,
    routeAnnounce: (entrance, id) => `Route displayed from Entrance ${entrance} to booth ${id}.`,
    linkCopied: "Booth link copied.",
    promptCopy: "Copy booth details. Host this page online to share a link:",
    promptCopyLink: "Copy this booth link:",
    footerText: (count) => `EventMap · ${count} booth locations · Demo event directory`,
    defaultDesc: "Shop details have not been published for this booth yet.",
    defaultHours: "Hours not published",
  }
};

export function t(key, ...args) {
  const lang = state.lang || "lo";
  const val = translations[lang]?.[key] || translations["lo"]?.[key] || key;
  if (typeof val === "function") {
    return val(...args);
  }
  return val;
}

export function getCategoryName(category) {
  const catKeyMap = {
    "all": "catAll",
    "Food & Drink": "catFood",
    "Crafts": "catCrafts",
    "Fashion": "catFashion",
    "Plants": "catPlants",
    "Other": "catOther"
  };
  const key = catKeyMap[category];
  return key ? t(key) : category;
}

let uiUpdateCallbacks = [];
export function registerUIUpdateCallback(cb) {
  uiUpdateCallbacks.push(cb);
}

export function setLanguage(lang) {
  if (lang !== "lo" && lang !== "en") return;
  state.lang = lang;
  localStorage.setItem("eventmap_lang", lang);
  updateLanguageUI();
}

export function updateLanguageUI() {
  document.documentElement.lang = state.lang;

  document.querySelectorAll(".lang-btn").forEach((btn) => {
    const isActive = btn.dataset.lang === state.lang;
    btn.classList.toggle("active", isActive);
    btn.setAttribute("aria-pressed", String(isActive));
  });

  const titleKey = isBoothsPage ? "docTitleBooths" : "docTitleHome";
  document.title = t(titleKey);

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n;
    if (key) {
      el.textContent = t(key);
    }
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.dataset.i18nPlaceholder;
    if (key) {
      el.placeholder = t(key);
    }
  });

  document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
    const key = el.dataset.i18nAria;
    if (key) {
      el.setAttribute("aria-label", t(key));
    }
  });

  uiUpdateCallbacks.forEach(cb => cb());

  const footer = $("#footer");
  if (footer) {
    footer.textContent = t("footerText", booths.length);
  }
}
