import { GOOGLE_SHEET_API } from "./config.js";
import { setFeaturedShops, setEventInfo } from "./state.js";
import { setMapLayout } from "./map-layout.js";

const STORAGE_KEY = "eventmap_api_payload_v4";

function applyApiPayload(payload) {
  if (payload?.error) {
    throw new Error(payload.error);
  }

  // Supports both the new API shape ({ booths, eventInfo }) and the old
  // shape where booth ids such as A01 were at the top level.
  const shops =
    payload?.booths && typeof payload.booths === "object"
      ? payload.booths
      : payload;

  setFeaturedShops(shops && typeof shops === "object" ? shops : {});
  setEventInfo(payload?.eventInfo);
  if (payload?.mapLayout) setMapLayout(payload.mapLayout);
  return shops;
}

export async function loadShopsFromGoogleSheet(onSuccessCallback) {
  try {
    const navigation = performance.getEntriesByType("navigation")[0];
    const isRefresh = navigation?.type === "reload";
    if (isRefresh) sessionStorage.removeItem(STORAGE_KEY);

    const cached = sessionStorage.getItem(STORAGE_KEY);
    if (cached) {
      const shops = applyApiPayload(JSON.parse(cached));
      if (onSuccessCallback) onSuccessCallback(shops);
      return shops;
    }

    console.log("Loading booth data from Google Sheet...");

    const response = await fetch(GOOGLE_SHEET_API);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const payload = await response.json();
    const shops = applyApiPayload(payload);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));

    if (onSuccessCallback) {
      onSuccessCallback(shops);
    }

    return shops;
  } catch (error) {
    console.error("Error loading shop data:", error);
  }
}

/**
 * Loads the published map layout for Map Manager. This deliberately bypasses
 * the public-page session cache so a manager can refresh the current layout
 * that is stored in Google Sheets.
 */
export async function loadMapLayoutFromGoogleSheet() {
  const response = await fetch(GOOGLE_SHEET_API);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const payload = await response.json();
  if (payload?.error) {
    throw new Error(payload.error);
  }
  if (!payload?.mapLayout) {
    throw new Error("Google Sheet does not contain a map layout yet.");
  }

  return setMapLayout(payload.mapLayout);
}
