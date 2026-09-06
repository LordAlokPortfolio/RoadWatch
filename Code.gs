// RoadWatch Backend — Code.gs
// Deploy: Extensions > Apps Script > paste this in.
// Deploy > New deployment > Web app > Execute as: Me, Who has access: Anyone.
// Sheet must have a tab named "Reports" with header row:
// id | timestamp | lat | lng | animal | status | notes

const SHEET_NAME = "Reports";
const RESPONDER_SHEET_NAME = "Responders";
const KEYS_SHEET_NAME = "Keys";

function getSheet() {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
}

function getResponderSheet() {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(RESPONDER_SHEET_NAME);
}

// Creates the Keys tab on first use if it isn't there yet.
function getKeysSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(KEYS_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(KEYS_SHEET_NAME);
    sheet.appendRow(["key"]);
  }
  return sheet;
}

// Emails everyone in the Responders tab a maps link when a new report comes in.
// Never throws — a bad email address or missing tab should not block the
// report itself from being saved.
function notifyResponders(record) {
  try {
    const sheet = getResponderSheet();
    if (!sheet) return; // Responders tab not set up yet — skip silently
    const emails = sheet.getDataRange().getValues().flat().filter(v => v && v !== "email");
    if (emails.length === 0) return;
    const mapsLink = `https://www.google.com/maps?q=${record.lat},${record.lng}`;
    const subject = `RoadWatch: ${record.animal} reported`;
    const body = `A ${record.animal} was reported at ${record.timestamp}.\n\nDirections: ${mapsLink}`;
    emails.forEach(email => {
      try {
        MailApp.sendEmail(email, subject, body);
      } catch (e) {
        // one bad address shouldn't block the rest
      }
    });
  } catch (e) {
    // notification failures never bubble up to the reporter
  }
}

// Self-service key check for report/subscribe: any non-empty string is
// accepted and remembered the first time it's used (like picking your own
// password on signup — nobody approves it, it just becomes valid). This is
// a friction layer against casual scripted abuse, not real authentication —
// it only requires *some* key be present, not a specific secret one.
function checkOrRegisterKey(providedKey) {
  if (!providedKey || typeof providedKey !== "string" || providedKey.trim() === "") {
    return false;
  }
  const sheet = getKeysSheet();
  const existing = sheet.getDataRange().getValues().flat().filter(v => v && v !== "key");
  if (existing.includes(providedKey)) return true;
  sheet.appendRow([providedKey]);
  return true;
}

// Caps reports to 30/hour by counting existing rows with a timestamp in the
// last 60 minutes.
function isOverFloodCap(sheet) {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const rows = sheet.getDataRange().getValues();
  const recentCount = rows.slice(1).filter(row => new Date(row[1]) > oneHourAgo).length;
  return recentCount >= 30;
}

function jsonOut(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  if (e.parameter.action === "ping") {
    return jsonOut({ ok: true, time: new Date().toISOString() });
  }

  if (e.parameter.action === "list") {
    const sheet = getSheet();
    const data = sheet.getDataRange().getValues();
    const headers = data.shift();
    const rows = data.map(row => {
      const obj = {};
      headers.forEach((h, i) => obj[h] = row[i]);
      return obj;
    });
    return jsonOut(rows);
  }

  return jsonOut({ error: "unknown action" });
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const sheet = getSheet();

    if (data.action === "report") {
      if (!checkOrRegisterKey(data.key)) {
        return jsonOut({ success: false, error: "missing key" });
      }
      if (data.lat == null || data.lng == null || !data.animal) {
        return jsonOut({ success: false, error: "missing lat, lng, or animal" });
      }
      if (isOverFloodCap(sheet)) {
        return jsonOut({ success: false, error: "rate limit exceeded: max 30 reports/hour" });
      }
      const id = Utilities.getUuid();
      const timestamp = new Date().toISOString();
      sheet.appendRow([id, timestamp, data.lat, data.lng, data.animal, "reported", data.notes || ""]);
      notifyResponders({ animal: data.animal, lat: data.lat, lng: data.lng, timestamp: timestamp });
      return jsonOut({ success: true, id });
    }

    if (data.action === "subscribe") {
      if (!checkOrRegisterKey(data.key)) {
        return jsonOut({ success: false, error: "missing key" });
      }
      if (!data.email) {
        return jsonOut({ success: false, error: "missing email" });
      }
      const respSheet = getResponderSheet();
      if (!respSheet) {
        return jsonOut({ success: false, error: "Responders tab not set up" });
      }
      const existing = respSheet.getDataRange().getValues().flat();
      if (existing.includes(data.email)) {
        return jsonOut({ success: true, note: "already subscribed" });
      }
      respSheet.appendRow([data.email]);
      return jsonOut({ success: true });
    }

    if (data.action === "markRemoved") {
      if (!data.id) {
        return jsonOut({ success: false, error: "missing id" });
      }
      const rows = sheet.getDataRange().getValues();
      for (let i = 1; i < rows.length; i++) {
        if (rows[i][0] === data.id) {
          sheet.getRange(i + 1, 6).setValue("removed"); // column 6 = status
          return jsonOut({ success: true });
        }
      }
      return jsonOut({ success: false, error: "id not found" });
    }

    return jsonOut({ success: false, error: "unknown action" });
  } catch (err) {
    return jsonOut({ success: false, error: "server error: " + err.message });
  }
}
