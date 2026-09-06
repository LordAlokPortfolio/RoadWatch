# Test this before giving the link to anyone

None of this code has been run yet. Do these steps yourself, in order, before
sharing with your 10 people.

## 1. Backend alone (no phone needed)

- [ ] Paste `YOUR_URL?action=ping` in a browser. Expect
      `{"ok":true,"time":"..."}`. If you get a Google login page instead,
      your deploy access setting is wrong - go back and set
      **Who has access: Anyone** (not "Anyone with Google account").
- [ ] Paste `YOUR_URL?action=list`. Expect `[]` on an empty sheet.

## 2. Submit a fake report by hand

In a browser console or a tool like Postman, or just temporarily add this
button to `web/index.html` for testing:

```js
fetch(API_URL, {
  method: "POST",
  body: JSON.stringify({ action: "report", lat: 43.65, lng: -79.66, animal: "Test" })
}).then(r => r.json()).then(console.log)
```

- [ ] Response should be `{"success":true,"id":"..."}`.
- [ ] Check the Sheet directly - a new row should appear with status
      `reported`.
- [ ] Reload `?action=list` - the test row should be in the JSON.

## 3. Map page (this is the picker's app - the reporter never opens it)

- [ ] Open `web/index.html` (via GitHub Pages, once deployed). Tap
      "Enable" on the notification bar and grant permission.
- [ ] The test pin should appear, red, near Mississauga.
- [ ] From a second browser/tab, submit another fake report (repeat the
      fetch snippet above with a different animal). Within 20 seconds the
      first tab should show a browser notification and a red on-page
      banner - this is the actual "new report" notification path, not
      email.
- [ ] Click the pin, click "Mark Removed."
- [ ] Refresh the page - pin should now be green.
- [ ] Check the Sheet - that row's status column should say `removed`.

## 4. Phone script

- [ ] Install `ios/RoadWatch.js` in Scriptable per `ios/INSTALL.md`.
- [ ] Open it directly (tap mode) - tap an animal - confirm the alert says
      "recorded and reported," not "saved locally."
- [ ] Check the map - the real pin should appear at your actual location.

## 5. Watch voice mode

- [ ] Set up the Shortcut per `ios/INSTALL.md`.
- [ ] Trigger it from the Watch, say an animal name, confirm Siri speaks
      back a confirmation.
- [ ] Check the map again for the new pin.

## 6. Delete the test data

- [ ] Remove any test rows from the Sheet by hand before this goes to real
      users - a "Test" pin sitting on the public map looks broken to the
      first person who opens it.

Only once all six pass, cleanly, on your own account - send the link to
your 10 people.
