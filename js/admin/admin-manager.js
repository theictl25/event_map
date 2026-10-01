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
      credentials: "same-origin",
      body: JSON.stringify(event.detail),
    });
    const body = await response.text();
    let data;
    try {
      data = JSON.parse(body);
    } catch {
      if (response.redirected || /\/login\.php(?:[?#]|$)/.test(response.url)) {
        throw new Error(
          "Your Manager session has ended. Please sign in again.",
        );
      }
      const stripped = body.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      if (stripped && stripped.length > 0 && stripped.length < 200 && !/<!doctype/i.test(body)) {
        throw new Error(stripped);
      }
      throw new Error(managerT("invalidServerResponse"));
    }
    if (!response.ok || !data.ok)
      throw new Error(data.error || managerT("saveFailedServer"));
    message.textContent = managerT("saved");
    document.dispatchEvent(new CustomEvent("eventmap:layout-saved"));
  } catch (error) {
    message.textContent = `${managerT("saveFailed")} ${error.message}`;
  } finally {
    setMapSaveLoading(false);
  }
});
