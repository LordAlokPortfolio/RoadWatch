Installing RoadWatch on a phone or watch
You need the free Scriptable app from the App Store first. That's the runtime — this `.js` file can't run standalone, it needs Scriptable's APIs (Location, WebView, FileManager).
1. Get the script onto the phone

1. On the phone, open `ios/RoadWatch.js` from this repo on GitHub (use the "Raw" view).
2. Select all, copy.
3. Open Scriptable → tap + → paste the code in → name it `RoadWatch`.

The `API_URL` at the top is already pointed at the shared public sheet. Don't change it unless you're deploying your own separate backend.
2. Tap mode
Just open the RoadWatch script in Scriptable. Tap the animal. Done.
3. Voice mode (hands-free while driving)

1. On the Watch: Settings → Siri → turn on Raise to Speak. This lets you raise your wrist to your mouth to trigger Siri, no "Hey Siri" needed.
2. On the phone: open the Shortcuts app → tap +.
3. Add action "Ask for Text" or "Dictate Text" — this becomes the animal name.
4. Add action "Run Script" (Scriptable) → Script: `RoadWatch` → Input: the dictated text from step 3.
5. Add action "Speak Text" → Text: the script's output from step 4.
6. Name the shortcut "Road Watch". It's now callable by Siri.

While driving: raise your wrist, say "Road Watch," say the animal name when asked, and Siri speaks back a confirmation. No screen, no typing.
Set "Show When Run" to off in the shortcut's settings for it to run without pulling up a screen.
What happens to your report
The report posts to the shared public sheet immediately if there's signal. If there's no signal, it's saved locally in iCloud and you'll need to open the script again later with signal for it to sync — this version does not auto-retry failed posts in the background.
