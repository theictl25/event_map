const WRITE_TOKEN = PropertiesService.getScriptProperties().getProperty(
  "EVENTMAP_WRITE_TOKEN",
);

function doGet(e) {
  try {
    const params = (e && e.parameter) || {};
    const action = params.action;

    if (action === "ping" || action === "leave") {
      return handleVisitorPing(params);
    }

    if (action === "getStats") {
      return handleGetStats();
    }

    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const boothsSheet = spreadsheet.getSheetByName("Booths");
    const eventInfoSheet = spreadsheet.getSheetByName("EventInfo");
    const eventSheet = spreadsheet.getSheetByName("Event");

    if (!boothsSheet)
      return jsonResponse({ error: 'Sheet "Booths" not found' });
    if (!eventInfoSheet)
      return jsonResponse({ error: 'Sheet "EventInfo" not found' });
    if (!eventSheet) {
      return jsonResponse({ error: 'Sheet "Event" not found' });
    }

    return jsonResponse({
      booths: readBooths(boothsSheet),
      eventInfo: readEventInfo(eventInfoSheet),
      event: readEvent(eventSheet),
      mapLayout: readMapLayout(),
    });
  } catch (error) {
    return jsonResponse({ error: String(error.message || error) });
  }
}

function doPost(e) {
  try {
    const body = JSON.parse((e.postData && e.postData.contents) || "{}");
    if (!WRITE_TOKEN || body.token !== WRITE_TOKEN) {
      return jsonResponse({ ok: false, error: "Unauthorized" });
    }
    if (body.action !== "saveMapLayout" || !isValidLayout(body.layout)) {
      return jsonResponse({ ok: false, error: "Invalid map layout" });
    }

    const sheet = getMapLayoutSheet(SpreadsheetApp.getActiveSpreadsheet());
    if (!sheet)
      return jsonResponse({ ok: false, error: 'Sheet "MapLayout" not found' });

    const jsonStr = JSON.stringify(body.layout);
    const chunkSize = 45000;
    const chunks = [];
    for (let i = 0; i < jsonStr.length; i += chunkSize) {
      chunks.push([jsonStr.substring(i, i + chunkSize)]);
    }

    sheet.getRange("A1").setValue("layout_json");
    const lastRow = Math.max(sheet.getLastRow(), 2);
    sheet
      .getRange(2, 1, Math.max(lastRow - 1, chunks.length), 1)
      .clearContent();
    sheet.getRange(2, 1, chunks.length, 1).setValues(chunks);
    return jsonResponse({ ok: true });
  } catch (error) {
    return jsonResponse({ ok: false, error: String(error.message || error) });
  }
}

function isValidLayout(layout) {
  return (
    layout &&
    typeof layout === "object" &&
    Number(layout.width) > 0 &&
    Number(layout.height) > 0 &&
    Array.isArray(layout.elements)
  );
}

function readBooths(sheet) {
  const data = sheet.getDataRange().getDisplayValues();
  if (data.length < 2) return {};

  const columns = indexColumns(data[0]);
  const boothIdColumn = columns.booth_id ?? columns.id;
  const required = [
    "name",
    "category",
    "description",
    "hours",
    "facebook",
    "logo",
    "color",
  ];
  const missing = required.filter((field) => columns[field] === undefined);
  if (boothIdColumn === undefined)
    throw new Error('Missing column: "booth_id" or "id"');
  if (missing.length) throw new Error(`Missing columns: ${missing.join(", ")}`);

  const result = {};
  data.slice(1).forEach((row) => {
    const id = String(row[boothIdColumn] || "")
      .trim()
      .toUpperCase();
    if (!id) return;
    const get = (field) => String(row[columns[field]] || "").trim();
    result[id] = {
      name: get("name"),
      category: get("category"),
      description: get("description"),
      hours: get("hours"),
      facebook: get("facebook"),
      logo: get("logo"),
      color: get("color"),
    };
  });
  return result;
}

function readEventInfo(sheet) {
  const data = sheet.getDataRange().getDisplayValues();
  if (data.length < 2) return {};
  const columns = indexColumns(data[0]);
  const missing = ["key", "lo", "en"].filter(
    (field) => columns[field] === undefined,
  );
  if (missing.length)
    throw new Error(`EventInfo missing columns: ${missing.join(", ")}`);

  const result = {};
  data.slice(1).forEach((row) => {
    const key = String(row[columns.key] || "").trim();
    if (key)
      result[key] = {
        lo: String(row[columns.lo] || "").trim(),
        en: String(row[columns.en] || "").trim(),
      };
  });
  return result;
}

function readEvent(sheet) {
  const data = sheet.getDataRange().getDisplayValues();

  if (data.length < 2) return {};

  const columns = indexColumns(data[0]);

  const missing = ["key", "lo", "en"].filter(
    (field) => columns[field] === undefined,
  );

  if (missing.length) {
    throw new Error(`Event missing columns: ${missing.join(", ")}`);
  }

  const result = {};

  data.slice(1).forEach((row) => {
    const key = String(row[columns.key] || "").trim();

    if (!key) return;

    result[key] = {
      lo: String(row[columns.lo] || "").trim(),
      en: String(row[columns.en] || "").trim(),
    };
  });

  return result;
}

function getMapLayoutSheet(spreadsheet) {
  return (
    spreadsheet.getSheetByName("MapLayout") ||
    spreadsheet.getSheetByName("maplayout") ||
    spreadsheet.getSheetByName("Map Layout")
  );
}

function readMapLayout() {
  const sheet = getMapLayoutSheet(SpreadsheetApp.getActiveSpreadsheet());
  if (!sheet) return null;
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return null;
  const values = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  const jsonStr = values
    .map((r) => String(r[0] || ""))
    .join("")
    .trim();
  if (!jsonStr) return null;
  try {
    return JSON.parse(jsonStr);
  } catch (error) {
    return null;
  }
}

function indexColumns(headers) {
  return headers.reduce((columns, header, index) => {
    columns[String(header).trim()] = index;
    return columns;
  }, {});
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(
    ContentService.MimeType.JSON,
  );
}

function handleVisitorPing(params) {
  const props = PropertiesService.getScriptProperties();
  const lock = LockService.getScriptLock();
  const hasLock = lock.tryLock(1000);

  try {
    const sid = String(params.sid || "").trim();
    const action = params.action;
    const now = Date.now();
    const cutoff = now - 90 * 1000; // 90-second activity window

    let sessions = {};
    try {
      sessions = JSON.parse(props.getProperty("ACTIVE_SESSIONS") || "{}");
    } catch (_) {
      sessions = {};
    }

    // Clean expired sessions
    for (const key in sessions) {
      if (sessions[key] < cutoff) {
        delete sessions[key];
      }
    }

    if (action === "leave") {
      if (sid) delete sessions[sid];
    } else if (sid) {
      if (!sessions[sid]) {
        const totalViews = Number(props.getProperty("TOTAL_VIEWS") || 0) + 1;
        props.setProperty("TOTAL_VIEWS", String(totalViews));
      }
      sessions[sid] = now;
    }

    const currentOnline = Object.keys(sessions).length;
    let peakCount = Number(props.getProperty("PEAK_VISITORS") || 0);

    if (currentOnline > peakCount) {
      peakCount = currentOnline;
      props.setProperty("PEAK_VISITORS", String(peakCount));
      props.setProperty("PEAK_TIME", new Date().toISOString());
    }

    props.setProperty("ACTIVE_SESSIONS", JSON.stringify(sessions));

    // Throttled sync to Google Sheet
    const lastSync = Number(props.getProperty("LAST_SHEET_SYNC") || 0);
    if (now - lastSync > 60000 || currentOnline >= peakCount) {
      syncStatsToSheet(
        currentOnline,
        peakCount,
        Number(props.getProperty("TOTAL_VIEWS") || 0),
      );
      props.setProperty("LAST_SHEET_SYNC", String(now));
    }

    return jsonResponse({
      ok: true,
      online: currentOnline,
      peak: peakCount,
    });
  } finally {
    if (hasLock) {
      try {
        lock.releaseLock();
      } catch (_) {}
    }
  }
}

function handleGetStats() {
  const props = PropertiesService.getScriptProperties();
  const now = Date.now();
  const cutoff = now - 90 * 1000;

  let sessions = {};
  try {
    sessions = JSON.parse(props.getProperty("ACTIVE_SESSIONS") || "{}");
  } catch (_) {
    sessions = {};
  }

  let cleaned = false;
  for (const key in sessions) {
    if (sessions[key] < cutoff) {
      delete sessions[key];
      cleaned = true;
    }
  }
  if (cleaned) {
    props.setProperty("ACTIVE_SESSIONS", JSON.stringify(sessions));
  }

  const online = Object.keys(sessions).length;
  const peak = Number(props.getProperty("PEAK_VISITORS") || 0);
  const totalViews = Number(props.getProperty("TOTAL_VIEWS") || 0);

  // Throttled sync to Google Sheet to keep query response fast
  const lastSync = Number(props.getProperty("LAST_SHEET_SYNC") || 0);
  if (now - lastSync > 60000) {
    syncStatsToSheet(online, peak, totalViews);
    props.setProperty("LAST_SHEET_SYNC", String(now));
  }

  return jsonResponse({
    ok: true,
    online: online,
    peak: peak,
    totalViews: totalViews,
  });
}

function syncStatsToSheet(online, peak, totalViews) {
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    let statsSheet = spreadsheet.getSheetByName("Stats");
    if (!statsSheet) {
      statsSheet = spreadsheet.insertSheet("Stats");
      statsSheet
        .getRange(1, 1, 1, 3)
        .setValues([["Metric", "Value", "Last Updated"]]);
      statsSheet.getRange(1, 1, 1, 3).setFontWeight("bold");
    }

    const nowStr = Utilities.formatDate(
      new Date(),
      Session.getScriptTimeZone() || "GMT+7",
      "yyyy-MM-dd HH:mm:ss",
    );

    statsSheet.getRange(2, 1, 3, 3).setValues([
      ["Current Online", online, nowStr],
      ["Peak Online", peak, nowStr],
      ["Total Visits", totalViews, nowStr],
    ]);
  } catch (_) {
    // Non-blocking: Spreadsheet quota or contention must not fail the request
  }
}
