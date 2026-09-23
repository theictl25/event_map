import "./manager.js";
import { managerT } from "./manager-i18n.js";

function setMapSaveLoading(isSaving) {
  const overlay = document.querySelector("#manager-map-loading");
  const text = document.querySelector("#manager-map-loading-text");
  if (!overlay) return;

  if (text) text.textContent = managerT("saving");
  overlay.hidden = !isSaving;
}

document.addEventListener("eventmap:save-layout", async (event) => {
  const message = document.querySelector("#manager-message");
  setMapSaveLoading(true);
  try {
    const response = await fetch("./api/admin/save-map.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event.detail),
    });
    const contentType = response.headers.get("content-type") || "";
    const data = contentType.includes("application/json")
      ? await response.json()
      : { error: managerT("invalidServerResponse") };
    if (!response.ok || !data.ok)
      throw new Error(data.error || managerT("saveFailedServer"));
    message.textContent = managerT("saved");
  } catch (error) {
    message.textContent = `${managerT("saveFailed")} ${error.message}`;
  } finally {
    setMapSaveLoading(false);
  }
});
