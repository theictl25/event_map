import { GOOGLE_SHEET_API } from "./config.js";
import { setFeaturedShops, getFeaturedShops } from "./state.js";

const STORAGE_KEY = "booths_data";

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
      const shops = JSON.parse(cachedData);

      setFeaturedShops(shops);

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
      throw new Error(`HTTP ${sresponse.status}`);
    }

    const shops = await response.json();

    // -----------------------------
    // 5. เก็บข้อมูลไว้ใน State
    // -----------------------------
    setFeaturedShops(shops);

    // -----------------------------
    // 6. เก็บข้อมูลไว้ใน sessionStorage
    // -----------------------------
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(shops));

    // -----------------------------
    // 7. callback
    // -----------------------------
    if (onSuccessCallback) {
      onSuccessCallback(shops);
    }

    return shops;
  } catch (error) {
    console.error("Error loading shop data:", error);
  }
}
