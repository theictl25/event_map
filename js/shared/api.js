import { GOOGLE_SHEET_API } from "./config.js";

import { setFeaturedShops, setEventInfo, setEvent } from "./state.js";

import { setMapLayout } from "./map-layout.js";

const STORAGE_KEY = "eventmap_api_payload_v8";

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

/**
 * Heartbeat tracking for active visitors on the public EventMap pages.
/**
 * Heartbeat tracking for active visitors on the public EventMap pages.
 * Runs silently in the background without affecting UI or performance.
 */
export function trackVisitorSession() {
  try {
    const STORAGE_KEY_SID = "eventmap_visitor_sid";
    const cookieMatch = document.cookie.match(
      /(?:^|;\s*)eventmap_visitor_sid=([^;]+)/,
    );
    let sid = cookieMatch
      ? decodeURIComponent(cookieMatch[1])
      : sessionStorage.getItem(STORAGE_KEY_SID);
    if (!sid) {
      sid =
        Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
      sessionStorage.setItem(STORAGE_KEY_SID, sid);
    } else {
      sessionStorage.setItem(STORAGE_KEY_SID, sid);
    }

    const sendPing = (action = "ping") => {
      const localUrl = `./api/stats.php?action=${action}&sid=${encodeURIComponent(sid)}`;
      if (action === "leave" && typeof navigator.sendBeacon === "function") {
        navigator.sendBeacon(localUrl);
      } else {
        fetch(localUrl, { keepalive: true, cache: "no-store" }).catch(() => {
          // Fallback to Google Sheet API if local fails
          const remoteUrl = `${GOOGLE_SHEET_API}?action=${action}&sid=${encodeURIComponent(sid)}`;
          fetch(remoteUrl, { keepalive: true, cache: "no-store" }).catch(
            () => {},
          );
        });
      }
    };

    // Initial ping
    sendPing("ping");

    // Heartbeat every 30 seconds while tab is active
    setInterval(() => {
      if (document.visibilityState === "visible") {
        sendPing("ping");
      }
    }, 30000);

    // Refresh ping immediately when user returns to this tab
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        sendPing("ping");
      }
    });

    // Notify leave when closing page
    window.addEventListener("pagehide", () => sendPing("leave"));
  } catch (error) {
    console.debug("Visitor tracking omitted:", error);
  }
}

/**
 * Fetch visitor statistics (Online, Total, Peak) for the Manager page.
 * Prioritizes the fast local cPanel PHP endpoint (sub-millisecond), falling back to Google Apps Script.
 */
export async function fetchVisitorStats() {
  try {
    const response = await fetch("./api/stats.php?action=getStats", {
      cache: "no-store",
    });
    if (response.ok) {
      const data = await response.json();
      if (data && data.ok) return data;
    }
  } catch (localError) {
    console.debug(
      "Local stats endpoint error, falling back to Google Apps Script:",
      localError,
    );
  }

  // Fallback to Google Sheet API
  const response = await fetch(`${GOOGLE_SHEET_API}?action=getStats`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return await response.json();
}
