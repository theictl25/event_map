const STORAGE_KEY = "eventmap_lang";

const copy = {
  en: {
    pageTitle: "Event Map Manager",
    managerTitle: "Map Manager",
    managerOnly: "For signed-in managers only",
    viewMap: "View map",
    signOut: "Sign out",
    visitorsOnline: "Online",
    visitorsTotal: "Total",
    visitorsPeak: "Peak",
    mapBounds: "Map boundaries",
    width: "Width",
    height: "Height",
    grid: "Grid",
    saveForEveryone: "Save for everyone",
    newBlankMap: "Start a new blank map",
    newMapConfirm: "Start a new blank map? Unsaved changes will be lost.",
    addElements: "Add elements",
    addHelp: "Add an item, then drag it on the grid.",
    mapBuilder: "Map Builder",
    builderHint: "Select mode moves items. Use Pan map or hold Space to move around a zoomed map.",
    panMap: "Pan map",
    centerSelected: "Center map layout",
    layers: "Layers",
    layersHint: "Top items appear in front.",
    moveLayerUp: "Move layer forward",
    moveLayerDown: "Move layer backward",
    undo: "Undo",
    forward: "Forward",
    previewMap: "Preview",
    exportMap: "Export PNG",
    exported: "Map image downloaded.",
    canvasLabel: "Map editing area",
    properties: "Properties",
    selectElement: "Select an item on the map to edit it.",
    multiSelectHint: "Multiple items selected. Drag one selected item to move them together.",
    laoName: "Lao name",
    englishName: "English name",
    boothId: "Booth ID",
    zone: "Zone",
    zoneColors: "Zone colors",
    color: "Color",
    fontSize: "Font size",
    textColor: "Text color",
    rotateWalkway: "Switch horizontal / vertical",
    shape: "Shape",
    shapes: { rectangle: "Rectangle", circle: "Circle", triangle: "Triangle", hexagon: "Hexagon" },
    deleteElement: "Delete this item",
    saving: "Saving…",
    draftRestored: "Restored your unsaved map edits.",
    restored: "Template restored. Save to publish it.",
    saved: "Saved to Google Sheet.",
    saveFailed: "Save failed:",
    invalidServerResponse: "Server returned an invalid response. Check PHP error logs.",
    saveFailedServer: "Save failed",
    types: { booth: "Booth", walkway: "Walkway", entrance: "Entrance", exit: "Exit", tree: "Tree", stage: "Stage", label: "Label", other: "Other" },
  },
  lo: {
    pageTitle: "ຈັດການແຜນທີ່ງານ",
    managerTitle: "ຈັດການແຜນທີ່",
    managerOnly: "ສຳລັບຜູ້ຈັດການທີ່ເຂົ້າລະບົບແລ້ວເທົ່ານັ້ນ",
    viewMap: "ເບິ່ງແຜນທີ່",
    signOut: "ອອກຈາກລະບົບ",
    visitorsOnline: "ອອນລາຍ",
    visitorsTotal: "ທັງໝົດ",
    visitorsPeak: "ສູງສຸດ",
    mapBounds: "ຂອບເຂດແຜນທີ່",
    width: "ຄວາມກວ້າງ",
    height: "ຄວາມສູງ",
    grid: "ຕາຕະລາງ Grid",
    saveForEveryone: "ບັນທຶກສຳລັບທຸກຄົນ",
    newBlankMap: "ເລີ່ມແຜນທີ່ວ່າງໃໝ່",
    newMapConfirm: "ເລີ່ມແຜນທີ່ວ່າງໃໝ່ບໍ? ການແກ້ໄຂທີ່ຍັງບໍ່ບັນທຶກຈະຫາຍໄປ.",
    addElements: "ເພີ່ມອົງປະກອບ",
    addHelp: "ເພີ່ມລາຍການ ແລ້ວລາກໄປໃສ່ເທິງ Grid.",
    mapBuilder: "ສ້າງແຜນທີ່",
    builderHint: "ໂໝດເລືອກໃຊ້ຍ້າຍອົງປະກອບ. ໃຊ້ Pan map ຫຼື ກົດ Space ຄ້າງເພື່ອເລື່ອນແຜນທີ່ທີ່ຊູມແລ້ວ.",
    panMap: "ເລື່ອນແຜນທີ່",
    centerSelected: "ຈັດອົງປະກອບທັງໝົດໄວ້ກາງແຜນທີ່",
    layers: "ລຳດັບຊັ້ນ",
    layersHint: "ລາຍການເທິງສຸດຈະຢູ່ດ້ານໜ້າ.",
    moveLayerUp: "ຍ້າຍຊັ້ນໄປຂ້າງໜ້າ",
    moveLayerDown: "ຍ້າຍຊັ້ນໄປຂ້າງຫຼັງ",
    undo: "ຍ້ອນກັບ",
    forward: "ໄປຂ້າງໜ້າ",
    previewMap: "ເບິ່ງຕົວຢ່າງ",
    exportMap: "ສົ່ງອອກ PNG",
    exported: "ດາວໂຫຼດຮູບແຜນທີ່ແລ້ວ.",
    canvasLabel: "ພື້ນທີ່ແກ້ໄຂແຜນທີ່",
    properties: "ຄຸນສົມບັດ",
    selectElement: "ເລືອກອົງປະກອບໃນແຜນທີ່ເພື່ອແກ້ໄຂ.",
    multiSelectHint: "ເລືອກຫຼາຍອົງປະກອບແລ້ວ. ລາກລາຍການທີ່ເລືອກເພື່ອຍ້າຍພ້ອມກັນ.",
    laoName: "ຊື່ພາສາລາວ",
    englishName: "ຊື່ພາສາອັງກິດ",
    boothId: "ລະຫັດບູທ",
    zone: "ໂຊນ",
    zoneColors: "ສີຂອງໂຊນ",
    color: "ສີ",
    fontSize: "ຂະໜາດຕົວອັກສອນ",
    textColor: "ສີຕົວອັກສອນ",
    rotateWalkway: "ສະຫຼັບແນວນອນ / ແນວຕັ້ງ",
    shape: "ຮູບຊົງ",
    shapes: { rectangle: "ສີ່ຫຼ່ຽມ", circle: "ວົງມົນ", triangle: "ສາມຫຼ່ຽມ", hexagon: "ຫົກຫຼ່ຽມ" },
    deleteElement: "ລຶບອົງປະກອບນີ້",
    saving: "ກຳລັງບັນທຶກ…",
    draftRestored: "ກູ້ຄືນການແກ້ໄຂແຜນທີ່ທີ່ຍັງບໍ່ໄດ້ບັນທຶກແລ້ວ.",
    restored: "ຄືນຄ່າແບບຕົ້ນສະບັບແລ້ວ. ບັນທຶກເພື່ອເຜີຍແຜ່.",
    saved: "ບັນທຶກລົງ Google Sheet ແລ້ວ.",
    saveFailed: "ບັນທຶກບໍ່ສຳເລັດ:",
    invalidServerResponse: "ເຊີບເວີຕອບກັບບໍ່ຖືກຕ້ອງ. ກວດສອບ PHP error logs.",
    saveFailedServer: "ບັນທຶກບໍ່ສຳເລັດ",
    types: { booth: "ບູທ", walkway: "ທາງຍ່າງ", entrance: "ທາງເຂົ້າ", exit: "ທາງອອກ", tree: "ຕົ້ນໄມ້", stage: "ເວທີ", label: "ປ້າຍຊື່", other: "ອື່ນໆ" },
  },
};

let language = localStorage.getItem(STORAGE_KEY) === "lo" ? "lo" : "en";
const listeners = new Set();

export function managerT(key) {
  const value = key.split(".").reduce((item, part) => item?.[part], copy[language]);
  return typeof value === "string" ? value : key;
}

export function managerLanguage() {
  return language;
}

export function onManagerLanguageChange(listener) {
  listeners.add(listener);
}

export function setManagerLanguage(nextLanguage) {
  if (nextLanguage !== "lo" && nextLanguage !== "en") return;
  language = nextLanguage;
  localStorage.setItem(STORAGE_KEY, language);
  document.documentElement.lang = language;
  document.title = managerT("pageTitle");
  document.querySelectorAll("[data-manager-i18n]").forEach((element) => {
    element.textContent = managerT(element.dataset.managerI18n);
  });
  document.querySelectorAll("[data-manager-i18n-aria]").forEach((element) => {
    element.setAttribute("aria-label", managerT(element.dataset.managerI18nAria));
  });
  document.querySelectorAll(".lang-btn").forEach((button) => {
    const active = button.dataset.lang === language;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  listeners.forEach((listener) => listener());
}

export function initialiseManagerLanguage() {
  document.querySelectorAll(".lang-btn").forEach((button) => {
    button.addEventListener("click", () => setManagerLanguage(button.dataset.lang));
  });
  setManagerLanguage(language);
}
