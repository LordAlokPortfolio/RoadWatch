// RoadWatch.js
// Public wildlife-collision reporting for Ontario roads.
//
// TAP MODE: open the script, tap the animal, done.
// VOICE MODE: a Siri Shortcut passes a dictated animal name in as input
//   (see ios/INSTALL.md for the Shortcut setup, including Raise to Speak).
//
// Every report posts to the shared public sheet at API_URL below.
// A local backup copy is also kept in iCloud in case there's no signal.

const API_URL = "https://script.google.com/macros/s/AKfycbwyJ8v_vYPBAvgmmCNJ6iKpbmK6xZagXPPPTUmmYj06rUP8kxe8B50yKyY5WfGovG1a/exec"
// This works like a self-chosen password, not a secret: the backend accepts
// any non-empty value and remembers it the first time it's used. Change it
// to anything you like, or leave the default - it's a friction layer against
// casual scripted abuse, not real authentication.
const REPORT_KEY = "roadwatch-default"
const DATA_FILE = "roadwatch_data.json"
const ANIMALS = ["Deer", "Raccoon", "Skunk", "Coyote", "Squirrel", "Bird", "Other"]

// ─── LOCAL BACKUP ───────────────────────────────────────────────────────────

function loadLocal() {
  let fm = FileManager.iCloud()
  let path = fm.joinPath(fm.documentsDirectory(), DATA_FILE)
  if (!fm.fileExists(path)) return []
  try {
    return JSON.parse(fm.readString(path))
  } catch (e) {
    return []
  }
}

function appendLocal(record) {
  let records = loadLocal()
  records.push(record)
  let fm = FileManager.iCloud()
  let path = fm.joinPath(fm.documentsDirectory(), DATA_FILE)
  fm.writeString(path, JSON.stringify(records, null, 2))
}

// ─── SERVER SYNC ────────────────────────────────────────────────────────────

async function postToServer(record) {
  let req = new Request(API_URL)
  req.method = "POST"
  req.body = JSON.stringify({
    action: "report",
    key: REPORT_KEY,
    lat: record.lat,
    lng: record.lng,
    animal: record.animal,
    notes: record.notes || ""
  })
  return await req.loadJSON()
}

// ─── LOCATION ───────────────────────────────────────────────────────────────

async function getLocation() {
  Location.setAccuracyToBest()
  let loc = await Location.current()
  return { lat: loc.latitude, lng: loc.longitude }
}

// ─── SHARED RECORD FLOW ─────────────────────────────────────────────────────

async function recordSighting(animal) {
  let loc = await getLocation()
  let record = {
    animal: animal,
    lat: loc.lat,
    lng: loc.lng,
    timestamp: new Date().toISOString()
  }
  appendLocal(record)
  try {
    await postToServer(record)
    return `${animal} recorded and reported.`
  } catch (e) {
    return `${animal} saved locally. Needs a signal to report.`
  }
}

// ─── ENTRY POINT ─────────────────────────────────────────────────────────────

if (args.shortcutParameter) {
  // VOICE MODE
  let animal = String(args.shortcutParameter).trim()
  let result = await recordSighting(animal)
  Script.setShortcutOutput(result)
  Script.complete()
} else {
  // TAP MODE
  let webView = new WebView()
  let buttonsHtml = ANIMALS.map(a =>
    `<button onclick="window._tapped='${a}'" style="
      display:block;width:100%;padding:20px;margin:8px 0;font-size:20px;
      background:#222;color:#fff;border:none;border-radius:8px;">${a}</button>`
  ).join("")
  await webView.loadHTML(`<html><body style="background:#000;margin:0;padding:20px;">${buttonsHtml}</body></html>`)
  webView.present(false)

  let tapped = null
  while (!tapped) {
    tapped = await webView.evaluateJavaScript("window._tapped", false)
    if (!tapped) await new Promise(r => Timer.schedule(250, false, r))
  }

  let result = await recordSighting(tapped)
  let alert = new Alert()
  alert.title = "RoadWatch"
  alert.message = result
  alert.addAction("OK")
  await alert.presentAlert()
  Script.complete()
}
