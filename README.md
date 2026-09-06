# RoadWatch

Public wildlife-collision reporting for Ontario roads. Report a dead animal
by tapping a button, or hands-free via Apple Watch / CarPlay / Siri
Shortcuts. Every report shows up on a public map. Built to eventually feed
data to MTO or a university wildlife research program - that handoff
doesn't exist yet (see Status below).

## Live deployment

- **Map**: https://lordalokportfolio.github.io/RoadWatch/
- **Backend** (`/exec` URL): the shared Apps Script Web App, bound to the
  "RoadWatch Reports" Google Sheet. Only the maintainer can see/redeploy
  this from the Apps Script editor; it's baked into `index.html` and
  `RoadWatch.js` already, everyone else just uses those files as-is.

## What's in this repo

Note: this repo is **flat at the root** - there is no `web/`, `ios/`, or
`backend/` subfolder, despite some older docs or comments referencing
those paths.

- `Code.gs` - Google Apps Script backend. The maintainer deploys this once,
  bound to a Google Sheet. It's the single shared database everyone's
  reports go into.
- `index.html` - the public map, served via GitHub Pages from this repo's
  root. Shows red pins (reported) and green pins (removed), with a "Mark
  Removed" button on each. Never submits reports itself.
- `RoadWatch.js` - a Scriptable script for iPhone/Watch tap-mode and
  voice-mode reporting (Method B in `INSTALL.md`).
- `INSTALL.md` - how to install and use RoadWatch on a phone or Watch,
  including a Shortcuts-only method that needs no extra app (Method A).

## Setup order (already done for this deployment)

1. **Maintainer only**: deploy `Code.gs` via Extensions → Apps Script on
   the Sheet, following the comments at the top of the file. Copy the
   resulting `/exec` URL.
2. Paste that URL into `index.html` and `RoadWatch.js`.
3. Push to GitHub, enable Pages on this repo (root folder, `main` branch).
4. Share the repo/map link. Anyone installing from `INSTALL.md` points at
   the same shared backend automatically - they don't deploy their own.

## Two separate users, two separate tools

- **Reporter**: uses a Shortcut (Method A) or `RoadWatch.js` in Scriptable
  (Method B) via phone, Watch, or CarPlay/Siri. Never opens the web page.
- **Picker** (person removing the carcass): only ever opens `index.html`,
  kept open on their phone. New reports show as a browser notification and
  an on-page banner while that tab is open - this is not a background push
  notification. If they close the tab entirely, they get nothing until
  they reopen it.

## Two different keys - reporting vs. removal

There are two separate, non-interchangeable keys. This split exists
because a single shared key for everything would let any reporter also
mark reports removed - the two roles need different levels of trust.

### Reporting key (`report` / `subscribe`)

- Everyone uses the same shared value: `roadwatch`. This is **not a
  secret and not authentication** - say this plainly to anyone who asks.
- The backend accepts any non-empty string here and remembers it the
  first time it's used (via `checkOrRegisterKey()`, against a `Keys` tab
  in the Sheet, auto-created on first use). It works like picking your
  own password on signup - nobody approves it, it just becomes valid.
  It's plainly visible in this public repo and in any shared Shortcut, so
  it stops nothing but casual scripted abuse - never call it secure.

### Responder key (`markRemoved` only)

- A **separate, real gate**. `index.html`'s "Mark Removed" button prompts
  whoever clicks it for a responder key (remembered afterward via
  `localStorage` in that browser only).
- Unlike the reporting key, this one does **not** self-register. The
  backend checks it against a `ResponderKeys` tab in the Sheet that only
  the maintainer populates by hand (`checkResponderKey()` - rejects
  anything not already in that tab). A reporter's `roadwatch` key does
  not work here.
- The maintainer must manually add at least one value to the
  `ResponderKeys` tab (create the tab if `Code.gs` hasn't auto-created it
  yet, add a `key` column, add one row per responder) and hand that value
  directly to whoever actually removes carcasses - not published in this
  repo or any shared Shortcut.
- This is still just a shared string, not real cryptographic
  authentication - if a responder key leaks, treat it as compromised and
  replace it in the `ResponderKeys` tab. But it does close the earlier gap
  where any reporter could also mark things removed.

## Flood cap

`Code.gs` rejects a `report` once more than 30 reports have landed in the
last 60 minutes (checked by scanning `Reports` row timestamps). This is an
additional, independent layer on top of the key check - not a replacement
for it.

## Status - read before distributing this further

- **No real authentication**, as above - the `key` field is friction, not a
  gate. Combined with the flood cap it raises the bar against casual
  scripted spam, but a deliberate abuser can still post arbitrarily many
  reports under their own key (just not more than 30/hour).
- **No city integration.** "Removed" only changes when a person - you, a
  volunteer, or eventually a city account - clicks the button. Nobody at
  Animal Control or MTO is watching this automatically.
- **Single shared backend.** Every install points at one Google account's
  Apps Script deployment. Consumer Google accounts have daily execution
  quotas; this has not been tested past a handful of users.
- **No de-duplication.** Two people reporting the same carcass creates two
  pins.
- **Watch-only location** can be less precise than the phone's GPS if the
  phone isn't nearby when a report is made from the Watch alone.

Before this goes out to more than a few testers: confirm whether
Mississauga (or the relevant municipality) already has a 311 or open-data
channel for dead-animal removal, and decide who is actually closing the
loop on the first 50 reports. Neither of those is a code problem.

## Confirmed working (live, tested against the deployed backend)

- `?action=ping` and `?action=list`
- `report` with a valid reporting key → row appended, status `reported`
- `report` with no key → rejected
- Reporting key auto-registration → new keys land in the `Keys` tab on
  first use
- End-to-end Shortcuts flow (Method A): Dictate Text → location →
  POST to backend → real coordinates and animal name landed in the Sheet
- Siri "Hey Siri, Road Watch" trigger, including on Apple Watch once
  Location Services permission was granted to Shortcuts on the Watch

Tested against an earlier version of `markRemoved` (single self-registering
key, since replaced by the separate responder-key check above): valid key
→ row flips to `removed`; no key → rejected. **Not yet re-verified since
the responder-key split** - still needs: a reporting key rejected by
`markRemoved`, a real value in `ResponderKeys` accepted, and the
`index.html` prompt/localStorage flow clicked through by hand. Do this
after the next redeploy, before relying on it.
