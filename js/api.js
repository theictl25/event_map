import { GOOGLE_SHEET_API } from "./config.js";
import { setFeaturedShops, setEventInfo } from "./state.js";

// New key prevents an older cached API response (without eventInfo) from
// hiding the newly added Information-dialog content after deployment.
const STORAGE_KEY = "booths_data_v2";

function applyApiPayload(payload) {
  if (payload?.error) {
    throw new Error(payload.error);
  }

  // Supports both the new API shape ({ booths, eventInfo }) and the old
  // shape where booth ids such as A01 were at the top level.
  const shops = payload?.booths && typeof payload.booths === "object"
    ? payload.booths
    : payload;

  setFeaturedShops(shops && typeof shops === "object" ? shops : {});
  setEventInfo(payload?.eventInfo);
  return shops;
}

export async function loadShopsFromGoogleSheet(onSuccessCallback) {
  try {
    // -----------------------------
    // 1. ตรวจว่าเป็นการ Refresh หรือไม่
    // -----------------------------
    const navigation = performance.getEntriesByType("navigation")[0];

    const isRefresh = navigation && navigation.type === "reload";

    // -----------------------------
    // 2. ถ้า Refresh → ล้าง cache
    // -----------------------------
    if (isRefresh) {
      sessionStorage.removeItem(STORAGE_KEY);
    }

    // -----------------------------
    // 3. เช็คข้อมูลที่เคยโหลดไว้
    // -----------------------------
    const cachedData = sessionStorage.getItem(STORAGE_KEY);

    if (cachedData) {
      const payload = JSON.parse(cachedData);
      const shops = applyApiPayload(payload);

      console.log("Using cached booth data");

      if (onSuccessCallback) {
        onSuccessCallback(shops);
      }

      return shops;
    }

    // -----------------------------
    // 4. ถ้ายังไม่มีข้อมูล → โหลด Google Sheet
    // -----------------------------
    console.log("Loading booth data from Google Sheet...");

    const response = await fetch(GOOGLE_SHEET_API);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const payload = await response.json();
    const shops = applyApiPayload(payload);

    // -----------------------------
    // 5. เก็บข้อมูลไว้ใน sessionStorage
    // -----------------------------
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));

    // -----------------------------
    // 6. callback
    // -----------------------------
    if (onSuccessCallback) {
      onSuccessCallback(shops);
    }

    return shops;
  } catch (error) {
    console.error("Error loading shop data:", error);
  }
}
