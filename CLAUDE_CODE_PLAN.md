# RoadWatch — Claude Code execution plan

Hand this file to Claude Code along with this repo in the morning. It's
written so Claude Code can execute top to bottom without you narrating it.

## Non-negotiable: this is a deploy job, not a rewrite job

Every file in this repo (`backend/Code.gs`, `web/index.html`,
`ios/RoadWatch.js`, `ios/INSTALL.md`) is already finished code. Claude
Code's job is to deploy it and fill in the URL placeholder — nothing else.

- Do not refactor, "improve," add error handling, or change any logic in
  any of these files.
- The only text that should change in `web/index.html` and
  `ios/RoadWatch.js` is the literal string
  `PASTE_SHARED_APPS_SCRIPT_WEB_APP_URL_HERE`, replaced with the real URL.
- `backend/Code.gs` gets pasted into Apps Script byte-for-byte. If it
  doesn't work as-is, stop and report the error — don't patch it silently.
- If something seems like it needs a code change to work, stop and ask
  before making it. Don't guess.

After Claude Code finishes, diff its committed files against the ones in
this delivery. The only difference should be the URL swap. If anything
else changed, that's the thing to ask about before shipping.

## If this is going on a new, separate Google account

Confirm Claude Code's Google Drive connector is authorized against the
*new* account, not your personal one, before step 1. If it's still pointed
at your personal login, everything below will get built in the wrong
place. Re-authorize first if needed.

## One thing only you can do first (2 minutes, before granting access)

Google requires this as an account-level security setting — no API scope or
Drive permission covers it. Go to:

**script.google.com/home/usersettings** → turn on **"Google Apps Script API"**

Without this toggle, every step below that touches Apps Script will fail
with a permissions error, regardless of what access Claude Code is granted.
This cannot be automated — it's a manual account setting, not something
OAuth consent replaces.

## What Claude Code needs access to

- Google Drive connector, with scopes covering: creating spreadsheets,
  creating and editing bound Apps Script projects, and creating Apps Script
  deployments (`script.projects`, `script.deployments`, in addition to
  standard Drive scope). If the connected Google Drive tool only grants
  file read/write and not the Apps Script scopes, step 3 below will fail —
  in that case Claude Code should stop and report exactly which step needs
  you to do it manually, not silently skip it.
- GitHub access (existing `gh` auth or repo push access) to create the repo
  and enable Pages.

## Ordered tasks

1. **Create the spreadsheet.** New Google Sheet, name it "RoadWatch
   Reports." Rename the first tab to `Reports`. Set row 1 to:
   `id, timestamp, lat, lng, animal, status, notes`. Add a second tab named
   `Responders` with row 1: `email`. Add the actual responder's email
   address (the person who wants direction notifications) as row 2 — this
   is a manual entry, not a signup form, since it's 1–2 people right now.

2. **Create the bound Apps Script project.** Attach a script project to
   that sheet. Replace its default content with the contents of
   `backend/Code.gs` from this repo, unmodified.

3. **Deploy as a web app.** Create a deployment: type Web app, execute as
   the owner, access level "Anyone." Retrieve the resulting `/exec` URL.
   If this step fails on a permissions error, stop here and report the
   exact error — don't retry blindly or fall back to a different access
   level without saying so.

4. **Self-test the deployment.** `GET {url}?action=ping` and confirm the
   response is `{"ok":true,...}`. If this fails, stop and report before
   continuing — steps 5+ are pointless against a broken backend.

5. **Wire the URL into the repo.** Replace
   `PASTE_SHARED_APPS_SCRIPT_WEB_APP_URL_HERE` in both `web/index.html` and
   `ios/RoadWatch.js` with the real URL from step 3.

6. **Submit one test report** using the fetch snippet in `TESTING.md`
   against the live URL. Confirm the row appears in the Sheet with status
   `reported`.

7. **Test mark-removed** by POSTing `{"action":"markRemoved","id":"<the
   test id from step 6>"}`. Confirm the Sheet row flips to `removed`.

7a. **Test the notification.** Before deleting the test row, confirm the
    responder email from step 1 actually received a message with a maps
    link when step 6 ran. If no email arrived, check the Apps Script
    execution log for the `notifyResponders` call before assuming it's
    broken — MailApp failures there don't block the report itself, so the
    report can succeed while the email silently fails.

8. **Delete the test row** from the Sheet directly — don't leave it for a
   real user to see.

9. **Push to the existing repo, on a new branch.** Don't touch `main`.
   Create a branch (e.g. `roadwatch`), commit these files there, push it.

10. **Check Pages before touching it.** If GitHub Pages is already enabled
    on this repo serving something else, stop and report that before
    changing anything — switching Pages to the `roadwatch` branch will
    replace whatever it currently serves, not add a second site alongside
    it. If Pages isn't in use yet, enable it on the `roadwatch` branch
    (`web` folder, or repo root if this branch's Pages config needs that).

11. **Verify the live map** by fetching the published Pages URL and
    confirming the page loads (a fetch/curl check is enough — you don't
    need a screenshot).

## Report back when done

- The live map URL
- The GitHub repo URL
- Confirmation that steps 4, 6, and 7 passed
- Anything that failed or required a manual step, named specifically —
  not glossed over

## What Claude Code should NOT do

- Don't lower the deployment access level below "Anyone" to work around an
  auth error — that breaks the whole point (a stranger with the repo link
  needs to hit this with no login). Report the error instead.
- Don't invent a workaround for the script.google.com toggle. If it wasn't
  turned on, stop and say so plainly.
- Don't leave test data in the live Sheet.
