# RoadWatch

Public wildlife-collision reporting for Ontario roads. Report a dead animal
by tapping a button or speaking to your Apple Watch. Every report shows up
on a public map. Built to eventually feed data to MTO or a university
wildlife research program — that handoff doesn't exist yet (see Status
below).

## What's in this repo

- `backend/Code.gs` — Google Apps Script backend. One person (the maintainer)
  deploys this once, connected to a Google Sheet. It's the single shared
  database everyone's reports go into.
- `web/index.html` — the public map. Deploy via GitHub Pages. Shows red pins
  (reported) and green pins (removed), with a "Mark Removed" button on each.
- `ios/RoadWatch.js` — the Scriptable script that runs on someone's phone or
  Watch and posts reports to the shared backend.
- `ios/INSTALL.md` — how someone installs the script and sets up the Watch
  voice trigger.

## Setup order

1. **Maintainer only**: deploy `backend/Code.gs` following the comments at
   the top of the file. Copy the resulting `/exec` URL.
2. Paste that URL into `web/index.html` and `ios/RoadWatch.js` (replace
   `PASTE_SHARED_APPS_SCRIPT_WEB_APP_URL_HERE` in both).
3. Push this repo to GitHub. Enable Pages on the `web/` folder (or move
   `index.html` to the repo root if your Pages setup expects that).
4. Share the repo link. Anyone installing from `ios/INSTALL.md` will point
   at the same shared backend automatically — they don't deploy their own.

## Two separate users, two separate tools

- **Reporter**: only ever touches `ios/RoadWatch.js` via Watch/Shortcut.
  Never opens the web page.
- **Picker** (person removing the carcass): only ever opens
  `web/index.html`, kept open on their phone. New reports show as a
  browser notification and an on-page banner while that tab is open —
  this is not a background push notification. If they close the tab
  entirely, they get nothing until they reopen it.

## Status — read before distributing this

- **No auth.** Anyone can submit a report or mark one removed. There is
  nothing stopping spam or a false "removed" click.
- **No city integration.** "Removed" only changes when a person — you, a
  volunteer, or eventually a city account — clicks the button. Nobody at
  Animal Control or MTO is watching this automatically.
- **Single shared backend.** Every install points at one Google account's
  Apps Script deployment. Consumer Google accounts have daily execution
  quotas; this has not been tested past a handful of users.
- **No de-duplication.** Two people reporting the same carcass creates two
  pins.

Before this goes out to more than a few testers: confirm whether Mississauga
(or the relevant municipality) already has a 311 or open-data channel for
dead-animal removal, and decide who is actually closing the loop on the
first 50 reports. Neither of those is a code problem.
