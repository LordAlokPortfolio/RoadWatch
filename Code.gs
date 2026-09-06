// RoadWatch Backend — Code.gs
// Deploy: Extensions > Apps Script > paste this in.
// Deploy > New deployment > Web app > Execute as: Me, Who has access: Anyone.
// Sheet must have a tab named "Reports" with header row:
// id | timestamp | lat | lng | animal | status | notes

const SHEET_NAME = "Reports";
const RESPONDER_SHEET_NAME = "Responders";

function getSheet() {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
}

function getResponderSheet() {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(RESPONDER_SHEET_NAME);
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

// Shared-secret check for report/subscribe. This is a friction layer against
// casual scripted abuse, not real authentication — anyone who obtains the
// key (e.g. by inspecting a shared Shortcut) can still bypass it.
function checkKey(providedKey) {
  const requiredKey = PropertiesService.getScriptProperties().getProperty("REPORT_KEY");
  return !!requiredKey && providedKey === requiredKey;
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
      if (!checkKey(data.key)) {
        return jsonOut({ success: false, error: "invalid or missing key" });
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
      if (!checkKey(data.key)) {
        return jsonOut({ success: false, error: "invalid or missing key" });
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
