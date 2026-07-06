// Renderer: microphone capture with voice-activity detection, a "Hey Jarvis"
// wake-word state machine, on-screen conversation, and text-to-speech. All
// "thinking" and transcription happen in the main process via window.jarvis.

const conversation = document.getElementById("conversation") as HTMLElement;
const micBtn = document.getElementById("mic") as HTMLButtonElement;
const textForm = document.getElementById("text-form") as HTMLFormElement;
const textInput = document.getElementById("text-input") as HTMLInputElement;
const banner = document.getElementById("banner") as HTMLElement;
const hint = document.getElementById("hint") as HTMLElement;
const subtitle = document.getElementById("subtitle") as HTMLElement;
const wakeToggle = document.getElementById("wake-toggle") as HTMLInputElement;
const wakeDot = document.getElementById("wake-dot") as HTMLElement;

let busy = false;
let sttReady = false;

// ── Conversation rendering ────────────────────────────────────────────
function addBubble(role: "user" | "jarvis", text: string): HTMLElement {
  const el = document.createElement("div");
  el.className = `bubble ${role}`;
  el.textContent = text;
  conversation.appendChild(el);
  conversation.scrollTop = conversation.scrollHeight;
  return el;
}

function setToolsUsed(bubble: HTMLElement, tools: string[]): void {
  if (tools.length === 0) return;
  const tag = document.createElement("div");
  tag.className = "tools";
  tag.textContent = tools.join(" · ");
  bubble.appendChild(tag);
}

function setHint(text: string): void {
  hint.textContent = text;
}

// ── Text-to-speech (with mic suspension to avoid self-hearing) ────────
function speak(text: string): Promise<void> {
  return new Promise((resolve) => {
    if (!("speechSynthesis" in window) || !text) return resolve();
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1.03;
    listener?.suspend(); // don't transcribe Jarvis's own voice
    const done = () => {
      // Small tail so the speaker audio fully drains before we listen again.
      setTimeout(() => listener?.resume(), 250);
      resolve();
    };
    utter.onend = done;
    utter.onerror = done;
    window.speechSynthesis.speak(utter);
  });
}

// ── Talking to Jarvis's brain ─────────────────────────────────────────
async function handleCommand(text: string): Promise<void> {
  const clean = text.trim();
  if (!clean || busy) return;
  busy = true;
  listener?.suspend(); // pause listening while we think + reply
  addBubble("user", clean);

  const thinking = addBubble("jarvis", "…");
  thinking.classList.add("thinking");

  try {
    const reply = await window.jarvis.ask(clean);
    thinking.classList.remove("thinking");
    thinking.textContent = reply.text;
    if (reply.error) thinking.classList.add("error");
    setToolsUsed(thinking, reply.toolsUsed);
    await speak(reply.text);
  } catch {
    thinking.classList.remove("thinking");
    thinking.textContent = "Something went wrong talking to Jarvis.";
    thinking.classList.add("error");
  } finally {
    busy = false;
    listener?.resume();
    updateHint();
  }
}

textForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = textInput.value;
  textInput.value = "";
  void handleCommand(text);
});

// ── Wake-word detection ───────────────────────────────────────────────
// Match "jarvis" / "hey jarvis" / "hey, jarvis" at/near the start and return
// whatever the user said AFTER it (e.g. "hey jarvis what's next" → "what's next").
const WAKE_RE = /(?:^|\b)(?:hey[,\s]+|ok[,\s]+|hi[,\s]+)?jarvis\b[\s,.!?]*/i;

function stripWake(text: string): { matched: boolean; rest: string } {
  const m = text.match(WAKE_RE);
  if (!m) return { matched: false, rest: "" };
  const rest = text.slice((m.index ?? 0) + m[0].length).trim();
  return { matched: true, rest };
}

function isMeaningful(text: string): boolean {
  return text.replace(/[^a-z0-9]/gi, "").length >= 3;
}

// Mode: 'idle' = not listening, 'armed' = waiting for wake word,
// 'command' = the next utterance is a command (post-wake or manual mic).
type Mode = "idle" | "armed" | "command";
let mode: Mode = "idle";
// Set by the mic button: force the next captured utterance to be a command,
// bypassing the wake word.
let forceNextAsCommand = false;

async function onUtterance(text: string): Promise<void> {
  if (!text) return;

  if (forceNextAsCommand || mode === "command") {
    forceNextAsCommand = false;
    if (mode === "command") mode = wakeToggle.checked ? "armed" : "idle";
    await handleCommand(text);
    if (!wakeToggle.checked) stopListening();
    return;
  }

  // Armed: only react if the wake word is present.
  const { matched, rest } = stripWake(text);
  if (!matched) {
    updateHint();
    return;
  }
  if (isMeaningful(rest)) {
    // "Hey Jarvis, what's on my calendar" — command came with the wake word.
    await handleCommand(rest);
  } else {
    // Just "Hey Jarvis" — acknowledge and capture the next utterance.
    mode = "command";
    setHint("Yes? I'm listening…");
    await speak("Yes?");
  }
}

// ── Microphone capture + voice-activity detection ─────────────────────
// Energy-gated: we start recording when you begin speaking and stop after a
// short silence, then send just that clip to be transcribed. Nothing is sent
// while you're silent.
class MicListener {
  private stream: MediaStream | null = null;
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private recorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private running = false;
  private suspended = false;
  private speaking = false;
  private silenceStart = 0;
  private speechStart = 0;
  private raf = 0;

  // Tunables (RMS is 0..1).
  private readonly startThreshold = 0.025;
  private readonly stopThreshold = 0.018;
  private readonly silenceHangMs = 750;
  private readonly minSpeechMs = 250;
  private readonly maxSpeechMs = 15000;

  onListening?: () => void;

  async start(): Promise<void> {
    if (this.running) return;
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true },
    });
    this.ctx = new AudioContext();
    const src = this.ctx.createMediaStreamSource(this.stream);
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 1024;
    src.connect(this.analyser);
    this.running = true;
    this.loop();
    this.onListening?.();
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.raf);
    if (this.recorder && this.recorder.state !== "inactive") this.recorder.stop();
    this.recorder = null;
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    void this.ctx?.close();
    this.ctx = null;
    this.speaking = false;
  }

  suspend(): void {
    this.suspended = true;
    if (this.recorder && this.recorder.state === "recording") this.recorder.stop();
    this.speaking = false;
  }

  resume(): void {
    this.suspended = false;
  }

  private rms(): number {
    if (!this.analyser) return 0;
    const buf = new Uint8Array(this.analyser.fftSize);
    this.analyser.getByteTimeDomainData(buf);
    let sum = 0;
    for (let i = 0; i < buf.length; i++) {
      const v = (buf[i] - 128) / 128;
      sum += v * v;
    }
    return Math.sqrt(sum / buf.length);
  }

  private beginSegment(): void {
    if (!this.stream) return;
    this.chunks = [];
    const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : "audio/webm";
    this.recorder = new MediaRecorder(this.stream, { mimeType: mime });
    this.recorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.chunks.push(e.data);
    };
    this.recorder.onstop = () => this.finishSegment();
    this.recorder.start();
    this.speechStart = performance.now();
  }

  private async finishSegment(): Promise<void> {
    const blob = new Blob(this.chunks, { type: this.recorder?.mimeType || "audio/webm" });
    this.chunks = [];
    const durationMs = performance.now() - this.speechStart;
    if (durationMs < this.minSpeechMs || blob.size < 1200) return; // ignore blips
    try {
      const bytes = await blob.arrayBuffer();
      const result = await window.jarvis.transcribe(bytes, blob.type);
      if (result.error) {
        setHint(`Transcription error: ${result.error}`);
        return;
      }
      if (result.text) await onUtterance(result.text);
    } catch {
      setHint("Couldn't transcribe that. Try again or type.");
    }
  }

  private loop = (): void => {
    if (!this.running) return;
    this.raf = requestAnimationFrame(this.loop);
    if (this.suspended || busy) return;

    const level = this.rms();
    const now = performance.now();

    if (!this.speaking) {
      if (level > this.startThreshold) {
        this.speaking = true;
        this.silenceStart = 0;
        this.beginSegment();
      }
    } else {
      const tooLong = now - this.speechStart > this.maxSpeechMs;
      if (level < this.stopThreshold) {
        if (this.silenceStart === 0) this.silenceStart = now;
        if (now - this.silenceStart > this.silenceHangMs || tooLong) {
          this.speaking = false;
          this.silenceStart = 0;
          if (this.recorder && this.recorder.state === "recording") this.recorder.stop();
        }
      } else {
        this.silenceStart = 0;
        if (tooLong && this.recorder?.state === "recording") {
          this.speaking = false;
          this.recorder.stop();
        }
      }
    }
  };
}

let listener: MicListener | null = null;

async function ensureListener(): Promise<boolean> {
  if (!sttReady) return false;
  if (!listener) {
    listener = new MicListener();
    listener.onListening = () => wakeDot.classList.add("live");
  }
  try {
    await listener.start();
    return true;
  } catch (err: any) {
    setHint("Microphone unavailable. Check mic permissions. You can still type.");
    wakeToggle.checked = false;
    return false;
  }
}

function stopListening(): void {
  listener?.stop();
  wakeDot.classList.remove("live");
  mode = "idle";
}

function updateHint(): void {
  if (busy) return;
  if (mode === "armed") setHint('Listening for “Hey Jarvis”…');
  else if (mode === "command") setHint("Listening for your command…");
  else if (sttReady) setHint("Click the mic and speak, or type below.");
  else setHint("Add an OpenAI key for voice. Typing works now.");
}

// ── Controls ──────────────────────────────────────────────────────────
wakeToggle.addEventListener("change", async () => {
  if (wakeToggle.checked) {
    const ok = await ensureListener();
    if (ok) {
      mode = "armed";
      updateHint();
    } else {
      wakeToggle.checked = false;
    }
  } else {
    stopListening();
    updateHint();
  }
});

micBtn.addEventListener("click", async () => {
  if (busy || !sttReady) return;
  window.speechSynthesis?.cancel();
  const ok = await ensureListener();
  if (!ok) return;
  forceNextAsCommand = true;
  if (mode === "idle") mode = "command";
  micBtn.classList.add("listening");
  setHint("Listening… speak your command.");
  // Visual reset once we start processing/replying.
  const clear = setInterval(() => {
    if (busy) {
      micBtn.classList.remove("listening");
      clearInterval(clear);
    }
  }, 200);
});

// ── Reminders spoken proactively ──────────────────────────────────────
window.jarvis.onSpeak((text) => {
  addBubble("jarvis", text);
  void speak(text);
});

// ── Startup ───────────────────────────────────────────────────────────
(async () => {
  const status = await window.jarvis.getStatus();
  sttReady = status.sttConfigured;
  if (status.userName) subtitle.textContent = `assistant to ${status.userName}`;

  if (!status.hasApiKey) {
    banner.classList.remove("hidden");
    banner.textContent =
      "No Anthropic API key found. Copy .env.example to .env and add your ANTHROPIC_API_KEY, then restart.";
  } else if (!sttReady) {
    banner.classList.remove("hidden");
    banner.classList.add("subtle");
    banner.textContent =
      "Voice input is off — add OPENAI_API_KEY to .env to enable the mic and “Hey Jarvis”. Typing and voice replies work now.";
    micBtn.disabled = true;
    wakeToggle.disabled = true;
  }

  updateHint();

  const greeting = status.userName
    ? `Hello ${status.userName}. Say “Hey Jarvis” or click the mic when you need me.`
    : "Hello. Say “Hey Jarvis” or click the mic when you need me.";
  addBubble("jarvis", greeting);

  // Auto-arm the wake word if voice is ready, so it's hands-free out of the box.
  if (sttReady) {
    wakeToggle.checked = true;
    const ok = await ensureListener();
    if (ok) mode = "armed";
    else wakeToggle.checked = false;
    updateHint();
  }
})();
