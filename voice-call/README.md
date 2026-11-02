# 📞 K.LINKO Voice Call

A free AI voice-call web app. Tap the green button and talk in Thai (or English, Arabic, French); the AI listens, thinks with Google Gemini (free tier), and answers out loud. Before each step of a task, it asks "ไปต่อไหมครับ?" (shall I continue?).

**Cost: 0 baht.** GitHub Pages hosting is free, Gemini has a free tier, and voice uses the phone's built-in speech engine.

## Put it online (GitHub Pages, ~3 minutes)
1. Go to github.com → **New repository** → name it `voice-call` → **Public** → Create.
2. Click **Add file → Upload files**, upload `index.html` (and this README), then **Commit**.
3. Go to **Settings → Pages** → Source: **Deploy from a branch** → Branch: `main` / `(root)` → **Save**.
4. After about 1 minute your app is at: `https://khalil203.github.io/khalil203/voice-call/`

## First use
1. Get a free Gemini key: https://aistudio.google.com/apikey → **Create API key**.
2. Open the app in **Chrome on Android** → tap ⚙️ → paste the key → **บันทึก** (save).
3. Tap 📞 → allow the microphone → start talking.
4. Tip: in Chrome's menu choose **Add to Home screen** so it opens like a real app.

## Notes
- Your key is stored only in your browser on that phone.
- Thai voice: if it speaks with a wrong accent, install **Speech Services by Google** and download the Thai voice (Android Settings → Text-to-speech).
- iPhone: works in Safari, but voice input is less stable than on Android Chrome.
- If the model name stops working, change it in ⚙️ (e.g. `gemini-2.5-flash` or a newer Gemini Flash model).
