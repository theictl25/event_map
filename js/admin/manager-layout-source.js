/**
 * Manager-only controls for replacing the editor layout.
 * Saving remains owned by manager.js/admin-manager.js.
 */
import { loadMapLayoutFromGoogleSheet } from "../shared/api.js";
import { defaultMapLayout } from "../shared/map-layout.js";
import { managerLanguage, onManagerLanguageChange } from "./manager-i18n.js";

const copy = {
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

function text() {
  return copy[managerLanguage()];
}

/**
 * Adds source-layout buttons beside the existing Manager controls.
 */
export function setupManagerLayoutSourceControls({
  replaceLayout,
  setMessage,
}) {
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
    loadButton.textContent = text().load;
    defaultButton.textContent = text().default;
  };

  const loadFromGoogleSheet = async (confirmReplace = false) => {
    if (confirmReplace && !confirm(text().confirm)) return;

    loadButton.disabled = true;
    setMessage(text().loading);

    try {
      replaceLayout(await loadMapLayoutFromGoogleSheet());
      setMessage(text().loaded);
    } catch (error) {
      setMessage(`${text().loadFailed} ${error.message}`);
    } finally {
      loadButton.disabled = false;
    }
  };

  loadButton.addEventListener("click", () => loadFromGoogleSheet(true));
  defaultButton.addEventListener("click", () => {
    if (!confirm(text().confirm)) return;
    replaceLayout(defaultMapLayout());
    setMessage(text().defaultLoaded);
  });

  onManagerLanguageChange(updateLabels);
  updateLabels();
  void loadFromGoogleSheet();
}
