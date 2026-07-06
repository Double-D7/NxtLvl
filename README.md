# NxtLvl — Jarvis 🎙️

Your own voice-controlled personal assistant, powered by Claude.

Jarvis is a desktop app (Electron + TypeScript) with a Claude brain that can
actually *do* things for you by voice or text:

- 🗒️ **Reminders & tasks** — "remind me to call the dentist tomorrow at 3" →
  it's saved, and a desktop notification fires when it's due. _(Works out of the
  box, no setup beyond an API key.)_
- 📧 **Outlook email** — "any new email from my boss?", "summarize my unread
  messages." Reads and summarizes your Microsoft 365 inbox _(one-time sign-in —
  see "Connecting Outlook" below)_.
- 💬 **General chat & Q&A** — ask it anything.
- 📟 **Live dashboard** — an arc-reactor core that reacts to your voice, a
  waveform strip, a diagnostics panel (CPU, memory, uptime, host), a live clock,
  and your pending tasks + next reminder.

It **speaks its answers aloud** and **listens for your voice** — including a
hands-free **"Hey Jarvis" wake word** (click the core or press Esc to interrupt)
— all inside a **Tony-Stark-style HUD** with a live audio-reactive arc
reactor, a real-time waveform, and system telemetry. A text box is always there
as a fallback.

> The HUD: a glowing arc-reactor core in the center that pulses and spins with
> your voice, a **Diagnostics** panel on the left (CPU, memory, uptime, host,
> pending tasks, next reminder), a **Transcript** panel on the right, a live
> clock up top, and a reactive waveform under the core.

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
    microsoft.ts        ← Microsoft Graph OAuth (PKCE) + fetch helper
    store.ts            ← simple JSON persistence (per-user data dir)
    tools/              ← what Jarvis can DO
      datetime.ts       ← knows "now" so it can handle "tomorrow at 3"
      reminders.ts      ← local reminders + due-time notifications
      outlook.ts        ← Outlook / Microsoft 365 email (read / search)
    stt.ts              ← cloud speech-to-text (key stays server-side)
    telemetry.ts        ← live CPU / memory / uptime for the dashboard
  renderer/             ← the UI (Chromium) — the HUD + voice side
    renderer.ts         ← mic + VAD + barge-in, wake word, streaming TTS,
                          arc-reactor + waveform visualizers, telemetry binding
    index.html / styles.css  ← the JARVIS HUD
  shared/types.ts       ← types shared across both processes
```

**Your Anthropic API key never leaves the main process** — the UI talks to the
brain over a locked-down IPC bridge (`contextIsolation` on, `nodeIntegration`
off), so nothing sensitive is exposed to the web layer.

The brain runs a standard tool-use loop: it calls Claude with the available
tools, executes any tool Claude asks for (locally), feeds the results back, and
repeats until Claude has a final spoken answer.

---

## Connecting Outlook (Microsoft 365 email)

Jarvis reads and summarizes your Outlook email via **Microsoft Graph**. It's
optional — everything else works without it. One-time setup: register a small app
in your Microsoft directory, then sign in from Jarvis's ⚙ Settings.

**1. Register an app** (once) at [entra.microsoft.com](https://entra.microsoft.com)
→ **Applications → App registrations → New registration**:

- **Name:** `Jarvis Assistant`
- **Supported account types:** "Accounts in this organizational directory only".
- Click **Register**.

**2. Add the redirect + enable public client** — in the app's **Authentication**:

- **Add a platform → Mobile and desktop applications**, check `http://localhost`.
- Scroll to **Advanced settings → Allow public client flows → Yes**. Save.

**3. Grant permissions** — in **API permissions → Add a permission → Microsoft
Graph → Delegated permissions**, add: **`Mail.Read`**, **`User.Read`**,
**`offline_access`**. Then click **Grant admin consent**.

**4. Connect Jarvis** — copy the **Application (client) ID** and **Directory
(tenant) ID** from the app's Overview page, open Jarvis's **⚙ Settings → Outlook /
Microsoft 365**, paste them in, and click **Connect Outlook**. A Microsoft
sign-in opens in your browser; approve it once. Done.

No passwords or client secrets are stored — sign-in uses OAuth with PKCE, and only
a refreshable token is kept locally on your PC. Jarvis has **read-only** email
access (`Mail.Read`); it can't send or delete anything. Sending mail, calendar,
and more are the natural next additions.

---

## How the voice works

- **"Hey Jarvis" wake word (hands-free).** When voice is enabled the mic listens
  in the background. It only records when it hears you speaking (local
  voice-activity detection — silence is never sent anywhere), then transcribes
  that clip. If the clip starts with "Hey Jarvis" (or just "Jarvis"), the rest is
  treated as your command. Say _"Hey Jarvis, what's on my calendar"_ and it just
  answers; say _"Hey Jarvis"_ alone and it replies "Yes?" and waits for you.
  Toggle it off anytime with the **"Hey Jarvis" wake word** switch.
- **Keep talking — no repeating the wake word.** After Jarvis replies it stays
  listening for a few seconds, so you can go back and forth naturally: _"Hey
  Jarvis, what's on my calendar?"_ … _"move the 2pm to 3"_ … _"and remind me an
  hour before."_ Stay quiet and it quietly returns to waiting for the wake word.
- **Streaming replies.** Jarvis speaks each sentence the moment it's ready
  instead of waiting for the whole answer, so it feels like a conversation, not a
  request/response. The reply also types out on screen as it's spoken.
- **Interrupt.** Click the arc-reactor core (or the mic), or press **Esc**, to
  stop Jarvis mid-sentence. The mic stays fully closed while he speaks — browser
  echo-cancellation can't remove OS text-to-speech, so an open mic would hear and
  answer his own voice; closing it is the reliable fix.
- **Push-to-talk.** Click the mic — or the arc-reactor core — to speak a command
  immediately, no wake word needed.
- **Text-to-speech + voice picker.** Jarvis auto-selects a deep, movie-Jarvis
  voice — a British male if your system has one (e.g. "Microsoft George"),
  otherwise a US male like "Microsoft David" — and speaks at a slightly lowered
  pitch. Use the **VOICE** dropdown (bottom-left) to switch voices and the **▶**
  button to preview; your choice is remembered. The mic reopens a fraction of a
  second after he finishes, so it never catches the tail of his own reply.
- **Reliability.** Transcription runs through a cloud speech-to-text API (Whisper
  / gpt-4o-transcribe by default), so it works consistently across machines —
  the key stays in the main process, never in the UI. Point `STT_BASE_URL` at any
  OpenAI-compatible endpoint (a local Whisper server, Groq, etc.) if you prefer.

If no OpenAI key is set, voice input is simply disabled and Jarvis tells you so —
typing and spoken replies still work.

---

## Building a real installer

Jarvis is packaged with [electron-builder](https://www.electron.build/). Build a
double-clickable app for your platform:

```bash
npm run pack        # quick unpacked build in release/ (fastest, for testing)
npm run dist        # installer for your current OS
npm run dist:mac    # .dmg + .zip   (run on macOS)
npm run dist:win    # .exe (NSIS installer)  (run on Windows)
npm run dist:linux  # .AppImage    (run on Linux)
```

Output lands in `release/`. Each OS's installer must be built on that OS (or via
CI). A default icon is used; drop your own at `build/icon.png` (1024×1024) to
brand it.

### Automated Windows releases (GitHub Actions)

A workflow at `.github/workflows/release.yml` builds the Windows installer
automatically. To cut a release:

```bash
# bump the version in package.json first (e.g. 0.1.0 → 0.2.0), then:
git tag v0.2.0
git push origin v0.2.0
```

On a `v*` tag push (or a manual run from the **Actions** tab), it builds on
`windows-latest`, uploads the `.exe` as a build artifact, and — for tag pushes —
attaches it to the matching GitHub Release. To ship a **signed** installer with
no SmartScreen warning, add two repo secrets and the workflow picks them up
automatically:

- `CSC_LINK` — your code-signing certificate (`.pfx`) as base64
- `CSC_KEY_PASSWORD` — the certificate password

**Where do the keys go in the installed app?** Easiest: launch it and click the
**⚙ button** (top of the window) — paste your Anthropic key (and an OpenAI key
for voice) and hit **Save & apply**. Keys are stored locally on your device and
applied instantly, no restart or file editing. On first launch with no key, the
panel opens automatically. (Advanced: a `.env` next to the executable, in your
home folder, or the working directory still works too.) Keys are never bundled
into the installer.

## Running on Windows

Jarvis is built to run great on Windows — its built-in voices ("Microsoft David")
sound genuinely Jarvis-like. A few Windows notes:

- **Microphone privacy.** Turn on **Settings → Privacy & security → Microphone →
  "Let desktop apps access your microphone."** If this is off, Windows blocks the
  mic even though Jarvis has permission, and the app will tell you the mic is
  unavailable.
- **Background listening.** The app keeps the wake word and visualizers alive
  even when the window isn't focused (background throttling is disabled), so
  "Hey Jarvis" works while you're in another app.
- **Notifications** show as **Jarvis** in the Action Center (the app sets a
  Windows App User Model ID).
- **Installer warning.** The `.exe` from `npm run dist:win` is unsigned, so
  SmartScreen shows "Windows protected your PC" the first time — click **More
  info → Run anyway**. Code-signing (an EV/OV certificate) removes this; wire the
  cert into electron-builder when you're ready to distribute.
- **Build on Windows.** Run `npm run dist:win` on a Windows machine (or in CI) to
  produce the NSIS installer.

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
| `MS_CLIENT_ID` | — | Outlook: your Microsoft app (client) ID |
| `MS_TENANT_ID` | — | Outlook: your directory (tenant) ID |

Most people set these in the in-app ⚙ Settings panel instead of a `.env`. Your
data (reminders, keys, Microsoft token) is stored locally in Electron's per-user
`userData` directory — nothing is sent anywhere except the Anthropic, OpenAI, and
(if connected) Microsoft Graph APIs.
