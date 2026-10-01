import { GOOGLE_SHEET_API } from "./config.js";

import { setFeaturedShops, setEventInfo, setEvent } from "./state.js";

import { setMapLayout } from "./map-layout.js";

const STORAGE_KEY = "eventmap_api_payload_v5";

function applyApiPayload(payload) {
  if (payload?.error) {
    throw new Error(payload.error);
  }

  const shops =
    payload?.booths && typeof payload.booths === "object"
      ? payload.booths
      : payload;

  // Booths
  setFeaturedShops(shops && typeof shops === "object" ? shops : {});

  // EventInfo
  setEventInfo(payload?.eventInfo);

  // Event
  setEvent(payload?.event);

  // Map Layout
  if (payload?.mapLayout) {
    setMapLayout(payload.mapLayout);
  }

  return shops;
}

export async function loadShopsFromGoogleSheet(onSuccessCallback) {
  try {
    const navigation = performance.getEntriesByType("navigation")[0];

    const isRefresh = navigation?.type === "reload";

    /*
     * ถ้า Refresh หน้าเว็บ
     * ให้โหลดข้อมูลจาก Google Sheet ใหม่
     */
    if (isRefresh) {
      sessionStorage.removeItem(STORAGE_KEY);
    }

    /*
     * ตรวจสอบ Cache
     */
    const cached = sessionStorage.getItem(STORAGE_KEY);

    if (cached) {
      console.log("Using cached EventMap data.");

      const shops = applyApiPayload(JSON.parse(cached));

      if (onSuccessCallback) {
        onSuccessCallback(shops);
      }

      return shops;
    }

    /*
     * ไม่มี Cache
     * → โหลดจาก Google Sheet
     */
    console.log("Loading EventMap data from Google Sheet...");

    const response = await fetch(GOOGLE_SHEET_API);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const payload = await response.json();

    /*
     * เอาข้อมูลทั้งหมดเข้า State
     */
    const shops = applyApiPayload(payload);

    /*
     * Cache ทั้ง payload
     *
     * รวม:
     * booths
     * eventInfo
     * event
     * mapLayout
     */
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));

    if (onSuccessCallback) {
      onSuccessCallback(shops);
    }

    return shops;
  } catch (error) {
    console.error("Error loading EventMap data:", error);

    throw error;
  }
}

/**
 * Load map layout directly from Google Sheet.
 *
 * Source:
 * MapLayout!A1 = layout_json
 * MapLayout!A2:A... = JSON data
 */
export async function loadMapLayoutFromGoogleSheet() {
  const response = await fetch(GOOGLE_SHEET_API + "?mapLayout=1", {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const payload = await response.json();

  if (payload?.error) {
    throw new Error(payload.error);
  }

  if (!payload?.mapLayout) {
    throw new Error("MapLayout!A2 does not contain a valid map layout.");
  }

  return setMapLayout(payload.mapLayout);
}
