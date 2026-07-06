# NxtLvl — Jarvis 🎙️

Your own voice-controlled personal assistant, powered by Claude.

Jarvis is a desktop app (Electron + TypeScript) with a Claude brain that can
actually *do* things for you by voice or text:

- 🗒️ **Reminders & tasks** — "remind me to call the dentist tomorrow at 3" →
  it's saved, and a desktop notification fires when it's due. _(Works out of the
  box, no setup beyond an API key.)_
- 📅 **Calendar** — "what's on my calendar Friday?" / "book a meeting with Sam at
  2pm" _(needs Google credentials — see below)_
- 📧 **Email** — "any new email from my boss?" / "email Alex that I'm running
  late" _(needs Google credentials — always confirms before sending)_
- 💬 **General chat & Q&A** — ask it anything.

It **speaks its answers aloud** and **listens for your voice** — including a
hands-free **"Hey Jarvis" wake word** — with a text box as a reliable fallback.

---

## Quick start

```bash
# 1. Install dependencies
npm install

# 2. Configure your keys
cp .env.example .env
#    then edit .env and add:
#      ANTHROPIC_API_KEY  (required — https://console.anthropic.com/)
#      OPENAI_API_KEY     (for voice input + wake word — https://platform.openai.com/)

# 3. Run Jarvis
npm start
```

Reminders, chat, and voice **output** work with just the Anthropic key. Add the
OpenAI key to unlock voice **input** and "Hey Jarvis".

---

## How it's built

```
src/
  main/                 ← Electron main process (Node) — the secure side
    main.ts             ← app window, IPC, reminder scheduler
    brain.ts            ← the Claude agent loop (tool-calling)
    google.ts           ← Google OAuth + REST helpers (optional)
    store.ts            ← simple JSON persistence (per-user data dir)
    tools/              ← what Jarvis can DO
      datetime.ts       ← knows "now" so it can handle "tomorrow at 3"
      reminders.ts      ← local reminders + due-time notifications
      calendar.ts       ← Google Calendar (list / create events)
      email.ts          ← Gmail (search / send)
    stt.ts              ← cloud speech-to-text (key stays server-side)
  renderer/             ← the UI (Chromium) — the voice side
    renderer.ts         ← mic capture + VAD, "Hey Jarvis" wake word, TTS, chat
    index.html / styles.css
  shared/types.ts       ← types shared across both processes
```

**Your Anthropic API key never leaves the main process** — the UI talks to the
brain over a locked-down IPC bridge (`contextIsolation` on, `nodeIntegration`
off), so nothing sensitive is exposed to the web layer.

The brain runs a standard tool-use loop: it calls Claude with the available
tools, executes any tool Claude asks for (locally), feeds the results back, and
repeats until Claude has a final spoken answer.

---

## Enabling Calendar & Email (optional)

Jarvis is fully useful without this — but here's how to unlock Google:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a project and enable the **Google Calendar API** and **Gmail API**.
3. Create an **OAuth 2.0 Client ID** of type **Desktop app**.
4. Put the client ID and secret in your `.env`:
   ```
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   ```
5. Restart Jarvis. The first time you use a calendar/email command it opens a
   browser to authorize; after that it just works. Tokens are stored locally and
   refreshed automatically.

Sending email is treated as irreversible — Jarvis always reads the recipient,
subject, and body back to you and waits for an explicit "yes, send it."

---

## How the voice works

- **"Hey Jarvis" wake word (hands-free).** When voice is enabled the mic listens
  in the background. It only records when it hears you speaking (local
  voice-activity detection — silence is never sent anywhere), then transcribes
  that clip. If the clip starts with "Hey Jarvis" (or just "Jarvis"), the rest is
  treated as your command. Say _"Hey Jarvis, what's on my calendar"_ and it just
  answers; say _"Hey Jarvis"_ alone and it replies "Yes?" and waits for you.
  Toggle it off anytime with the **"Hey Jarvis" wake word** switch.
- **Push-to-talk.** Click the mic to speak a command immediately, no wake word
  needed.
- **Text-to-speech.** Jarvis speaks replies aloud. While it's talking, the mic
  pauses so it doesn't hear itself.
- **Reliability.** Transcription runs through a cloud speech-to-text API (Whisper
  / gpt-4o-transcribe by default), so it works consistently across machines —
  the key stays in the main process, never in the UI. Point `STT_BASE_URL` at any
  OpenAI-compatible endpoint (a local Whisper server, Groq, etc.) if you prefer.

If no OpenAI key is set, voice input is simply disabled and Jarvis tells you so —
typing and spoken replies still work.

---

## Configuration reference

All settings live in `.env` (see `.env.example`):

| Variable | Required | Purpose |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | ✅ | Your Anthropic API key |
| `ANTHROPIC_MODEL` | — | Which Claude model to use |
| `JARVIS_EFFORT` | — | `low` / `medium` / `high` reasoning depth |
| `JARVIS_USER_NAME` | — | What Jarvis calls you |
| `OPENAI_API_KEY` | — | Enables voice input + "Hey Jarvis" |
| `STT_MODEL` | — | Transcription model (default `gpt-4o-mini-transcribe`) |
| `STT_BASE_URL` / `STT_API_KEY` | — | Use any OpenAI-compatible STT endpoint |
| `GOOGLE_CLIENT_ID` | — | Enables Calendar + Email |
| `GOOGLE_CLIENT_SECRET` | — | Enables Calendar + Email |

Your data (reminders, Google tokens) is stored locally in Electron's per-user
`userData` directory — nothing is sent anywhere except the Anthropic and (if
enabled) Google APIs.
