# RoadWatch - analysis brief

Purpose of this document: a complete, unvarnished factual record of this
project for use in a separate first-principles / values-based review. It is
not a pitch. Where something is a real weakness, it's stated as one, not
softened. Written so that a review elsewhere doesn't have to reconstruct
context or go hunting for what's wrong - the weak points are already named
here.

## 1. What this actually is

A single person's side project: a public form (several front-ends) that
lets anyone post a lat/lng + animal name + timestamp to a shared Google
Sheet, and a public map that shows those pins so a second person (a
"picker") can go remove the carcass and mark it done. No organization,
municipality, or research body is involved. It is not connected to MTO,
a university, 311, or any city system - that's aspirational language in
the README, not a built integration.

Actual current scale: ~10 known people, coordinated directly by the
maintainer. Not a public product with unknown users, despite the backend
being technically open to anyone with the URL.

## 2. Who bears what

- **The maintainer** (owns `roadwatch0906@gmail.com`, the Sheet, and the
  Apps Script deployment): bears all operational risk - Google account
  quota limits, any abuse of the public endpoint, and is the only person
  who can actually fix, redeploy, or shut down the backend. No one else
  has that access.
- **Reporters**: bear a possible safety cost. The core interaction is
  designed to be triggerable while driving (Watch Raise-to-Speak,
  CarPlay/Siri voice). The project's stated selling point is "hands-free
  while driving." Voice interaction is lower-risk than typing/looking at a
  screen, but it is not zero-risk - dictating a word and listening for a
  Siri response is still a cognitive distraction during operation of a
  vehicle. This tradeoff was never separately evaluated in this project;
  it was accepted implicitly by the choice of interaction design.
- **The animal**: the entire premise is response after death (removal of
  a carcass), not prevention. Nothing in this system reduces collisions;
  it only manages the aftermath.
- **The "picker"**: has no automation, no scheduling, no compensation
  model. Removal depends entirely on a person voluntarily keeping the map
  page open and personally driving out to remove carcasses. There's no
  evidence in this project that this workflow has been exercised with a
  real dead animal - only test rows.
- **Responders/subscribers**: their email addresses sit in plaintext in a
  Sheet tab, collected via a `subscribe` action that (like `report`) only
  requires an arbitrary non-secret key. Any of the ~10 keys in use, or a
  stranger who reads the repo, could add or read that list depending on
  Sheet sharing settings (this was not audited as part of this work).

## 3. Technical facts as of the last commit (`fd909d8`)

- Repo is flat at root (`Code.gs`, `index.html`, `RoadWatch.js`,
  `INSTALL.md`, `README.md`) - despite `README.md`'s and comments'
  original references to a `web/`/`ios/`/`backend/` structure that was
  never actually built that way.
- Backend: Google Apps Script bound to a Google Sheet, deployed as a
  public web app, "Anyone" access, executed as the maintainer.
- Three Sheet tabs: `Reports` (id, timestamp, lat, lng, animal, status,
  notes), `Responders` (email), `Keys` (key - added in this work).
- `report` and `subscribe` require a non-empty `key` field. The backend
  does not validate the key against anything pre-approved - it accepts
  any non-empty string and appends it to `Keys` the first time it's seen.
  This means **the "key" mechanism provides zero access control** against
  anyone willing to type a value. It only requires the field be present,
  which stops the most naive/copy-pasted abuse (a bot hitting the raw URL
  with a payload that predates this change) but nothing else.
- A 30-reports-per-60-minutes flood cap exists, counting `Reports` rows by
  timestamp. This is the only layer that imposes an actual numeric limit.
- `markRemoved` has **no key requirement at all** - anyone can flip any
  report's status to `removed` with just its id, and ids are returned in
  the public `?action=list` response. This was flagged nowhere in this
  project's threat discussion until now: it means the "picker" workflow
  (marking things removed) has strictly weaker protection than submitting
  a new report.
- No de-duplication, no audit log of who changed what, no way to undo a
  wrongful `markRemoved`.
- Notifications to `Responders` run via `MailApp.sendEmail`, wrapped in a
  try/catch that silently swallows failures - a responder may believe
  they're covered and never find out email delivery is broken.

## 4. Explicit history of a claim that had to be walked back

Worth including because it's the clearest data point on this project's
actual security posture, and on how confidently wrong framing can sound
before scrutiny: The key mechanism was originally specified and built as
a single hardcoded "secret" value, stored in `PropertiesService`, and
described as something that "raises the bar against casual scripted
abuse." When pushed to GitHub, the value was - necessarily - sitting in
plaintext in `RoadWatch.js` and `INSTALL.md`, because a client-side value
distributed to installers cannot simultaneously be secret. The user
correctly identified this as a contradiction ("if the key is called
secret then it should be secure"). The fix was to strip out the pretense
of secrecy entirely and rebuild it as an openly self-chosen, self-
registering identifier - which is honest about what it is, but is also,
by design, not a security control in any real sense. The lesson worth
carrying into a first-principles review: **the original design was sold
internally (in code comments and chat) as more protective than it could
possibly be, and this was not caught until the person outside the
implementation loop questioned the naming.**

## 5. Things this project has not done, and has not claimed to have done incorrectly, but that a first-principles review would ask about

- No confirmation that any municipality has, needs, or wants this data.
- No consent mechanism for anyone whose location/animal report becomes a
  permanently public pin (arguably low stakes here, but not zero - a
  precise lat/lng tied to a timestamp is a location trace of the
  reporter, not just the animal).
- No data-retention or deletion policy - reports live in the Sheet
  indefinitely.
- No consideration of what happens if usage actually grows past "10
  people the maintainer knows" - the entire trust model (self-chosen
  keys, single Google account, no admin tooling) assumes a small,
  known group. It was explicitly built for that scale and would not hold
  at any other.
- The safety tradeoff in section 2 (voice interaction while driving) was
  never weighed against alternatives (e.g., requiring the vehicle be
  stopped, or logging the report after the fact rather than in the
  moment) - it was accepted as the interaction model from the start
  without an explicit safety-vs-utility discussion.
- `markRemoved`'s lack of any key check (section 3) is a gap that was not
  caught during the "add a key" work because the task was scoped only to
  `report` and `subscribe` - nobody asked whether that scoping was
  complete, including the assistant that implemented it.

## 6. What was actually verified end-to-end (not aspirational)

- `ping`, `list`, `report` (with/without key), `subscribe` semantics as
  coded, `markRemoved`, key auto-registration into the `Keys` tab, GitHub
  Pages serving the live map, and a real Shortcuts-based phone report
  landing in the Sheet with real GPS coordinates. All confirmed against
  the live deployment, not just read from source.

This document is current as of commit `fd909d8` on `main`. If more
changes land after this, note the new commit hash before relying on this
for review.
