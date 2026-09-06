# Installing RoadWatch on a phone or watch

There are two ways to get this running. Use the first one unless you
specifically want the offline backup behavior described at the bottom.

## Method A — Shortcuts app only (no extra app needed, recommended)

This uses Apple's built-in Shortcuts app. Nothing to install, nothing to
paste. One person builds this once (see below), then shares a link that
anyone can tap to add it — no Scriptable, no code, no typing.

### Building the master copy (do this once, on one phone)

Open the **Shortcuts** app → tap **+** to create a new shortcut, then add
these actions in this exact order:

1. **Dictate Text**
2. **Get Current Location**
3. **Get Details of Location** — set the dropdown to **Latitude**. Long-press
   its output and rename the variable to `Latitude`.
4. **Get Details of Location** (a second copy) — set the dropdown to
   **Longitude**. Rename its output to `Longitude`.
5. **Get Contents of URL**
   - URL: paste your deployed `/exec` URL
   - Method: **POST**
   - Request Body: **JSON**
   - Add these fields:
     - `action` (Text) = `report`
     - `lat` (Number) = the `Latitude` variable from step 3
     - `lng` (Number) = the `Longitude` variable from step 4
     - `animal` (Text) = the **Dictated Text** variable from step 1
     - `notes` (Text) = leave empty
6. **Text** — type: `[Dictated Text] reported` (insert the Dictated Text
   variable where the animal name goes)
7. **Speak Text** — input: the result of step 6

Name the shortcut **"Road Watch"**. Open its settings (the ⓘ icon) and turn
on **"Add to Siri"** — record a phrase like "Road Watch."

### Sharing it with someone else (the actual one-tap install)

1. In Shortcuts, tap **⋯** on the Road Watch shortcut → **Share**.
2. Choose **Copy iCloud Link**.
3. Send that link to anyone — text, email, whatever.
4. They tap the link → Shortcuts opens showing the actions → they tap
   **Add Shortcut**. Done. It already has your deployed URL baked in — they
   configure nothing.

### Setting up hands-free voice mode

1. On the Watch: **Settings → Siri → Raise to Speak** — turn this on. This
   triggers Siri by raising your wrist to your mouth, no "Hey Siri" needed.
2. Say the shortcut's name (e.g. "Road Watch") after raising your wrist.
   Siri runs it, asks you to dictate, you say the animal name, and it
   speaks back confirmation.

### The honest tradeoff of this method

If there's no signal when the POST happens, it just fails silently — no
local backup, no retry. For occasional roadside reports this is a real but
survivable gap, not a dealbreaker. If you want offline backup instead, use
Method B.

## Method B — Scriptable app (adds an offline backup, needs an extra app)

You need the free **Scriptable** app from the App Store. This is the
runtime — `RoadWatch.js` can't run standalone, it needs Scriptable's
APIs (Location, WebView, FileManager).

1. On the phone, open `RoadWatch.js` from this repo on GitHub (use the
   "Raw" view).
2. Select all, copy.
3. Open Scriptable → tap **+** → paste the code in → name it `RoadWatch`.

The `API_URL` at the top is already pointed at the shared public sheet.
Don't change it unless you're deploying your own separate backend.

**Tap mode**: just open the RoadWatch script in Scriptable. Tap the animal.

**Voice mode**: same Raise to Speak setup as Method A, but build the
Shortcut with: Dictate Text → **Run Script** (Scriptable) → Script:
`RoadWatch` → Input: the dictated text → Speak Text → the script's output.
Set **"Show When Run"** off in the shortcut's settings so it runs headless.

Unlike Method A, this version keeps a local backup in iCloud if there's no
signal, and you'll need to reopen the script later with signal to sync it.
It still doesn't auto-retry in the background.
