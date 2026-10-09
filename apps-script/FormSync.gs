/**
 * FormSync.gs
 * Auto-sync Google Form responses → Sheet "Booths"
 *
 * HOW TO SET UP TRIGGER:
 *   Apps Script Editor → Triggers (clock icon) →
 *   + Add Trigger → onFormSubmit → From form → On form submit
 *
 * REQUIRED: Form fields must be named exactly as listed in FIELD_MAP below.
 */

// ── Configuration ────────────────────────────────────────────────────────────

/** Map Form question titles → Booths sheet column names */
const FIELD_MAP = {
  booth_id:    "booth_id",   // must match Form question title exactly
  name:        "name",
  category:    "category",
  description: "description",
  hours:       "hours",
  facebook:    "facebook",
  logo:        "logo",
  color:       "color",
};

/** Column header used as the primary key in Sheet "Booths" */
const BOOTH_ID_COLUMN = "booth_id";

/** Name of the target sheet */
const BOOTHS_SHEET_NAME = "Booths";

/** (Optional) List of valid booth IDs — leave empty [] to skip validation */
const VALID_BOOTH_IDS = [];
// Example: const VALID_BOOTH_IDS = ["C1", "C2", "B1", "B2"];

// ── Main Trigger ─────────────────────────────────────────────────────────────

/**
 * Triggered on every Google Form submission.
 * @param {GoogleAppsScript.Events.SheetsOnFormSubmit} e
 */
function onFormSubmit(e) {
  try {
    const responses = e.namedValues; // { "Question Title": ["Answer"], ... }

    // Extract and normalize booth_id
    const boothId = String(
      (responses[FIELD_MAP.booth_id] || [""])[0]
    ).trim().toUpperCase();

    if (!boothId) {
      logError("onFormSubmit", "booth_id is empty — skipping.");
      return;
    }

    // Validate booth_id if list is provided
    if (VALID_BOOTH_IDS.length > 0 && !VALID_BOOTH_IDS.includes(boothId)) {
      logError("onFormSubmit", `Invalid booth_id "${boothId}" — skipping.`);
      return;
    }

    // Build data object from form response
    const data = {};
    for (const [formField, sheetColumn] of Object.entries(FIELD_MAP)) {
      data[sheetColumn] = String(
        (responses[formField] || [""])[0]
      ).trim();
    }
    data[BOOTH_ID_COLUMN] = boothId; // override with normalized ID

    // Write to Booths sheet
    upsertBooth(data);

  } catch (err) {
    logError("onFormSubmit", err.message || String(err));
  }
}

// ── Core Logic ────────────────────────────────────────────────────────────────

/**
 * Insert or update a row in Sheet "Booths" matching booth_id.
 * @param {Object} data - key: sheet column name, value: string
 */
function upsertBooth(data) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName(BOOTHS_SHEET_NAME);

  if (!sheet) {
    throw new Error(`Sheet "${BOOTHS_SHEET_NAME}" not found.`);
  }

  const sheetData = sheet.getDataRange().getValues();
  if (sheetData.length < 1) {
    throw new Error(`Sheet "${BOOTHS_SHEET_NAME}" has no header row.`);
  }

  // Build column index from header row
  const headers = sheetData[0].map((h) => String(h).trim());
  const colIndex = {};
  headers.forEach((h, i) => { colIndex[h] = i; });

  // Ensure all required columns exist in the sheet
  const missing = Object.values(FIELD_MAP).filter(
    (col) => colIndex[col] === undefined
  );
  if (missing.length) {
    throw new Error(`Missing columns in Booths sheet: ${missing.join(", ")}`);
  }

  const boothIdColIdx = colIndex[BOOTH_ID_COLUMN];
  const boothId = data[BOOTH_ID_COLUMN];

  // Find existing row for this booth_id (1-based row, 0 = not found)
  let targetRow = 0;
  for (let r = 1; r < sheetData.length; r++) {
    const existingId = String(sheetData[r][boothIdColIdx] || "").trim().toUpperCase();
    if (existingId === boothId) {
      targetRow = r + 1; // convert to 1-based
      break;
    }
  }

  // Build the row values array aligned to headers
  const rowValues = headers.map((header) => {
    return data[header] !== undefined ? data[header] : "";
  });

  if (targetRow > 0) {
    // UPDATE existing row
    sheet.getRange(targetRow, 1, 1, headers.length).setValues([rowValues]);
    Logger.log(`[FormSync] Updated booth "${boothId}" at row ${targetRow}.`);
  } else {
    // INSERT new row
    sheet.appendRow(rowValues);
    Logger.log(`[FormSync] Inserted new booth "${boothId}".`);
  }
}

// ── Helper ────────────────────────────────────────────────────────────────────

function logError(fn, msg) {
  Logger.log(`[FormSync][ERROR][${fn}] ${msg}`);
}
