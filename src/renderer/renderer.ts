// Renderer: microphone capture with voice-activity detection, a "Hey Jarvis"
// wake word, streaming speech (Jarvis starts talking as words arrive), and a
// conversational follow-up window so you can keep talking without repeating the
// wake word. All "thinking" and transcription happen in the main process.

const conversation = document.getElementById("conversation") as HTMLElement;
const micBtn = document.getElementById("mic") as HTMLButtonElement;
const textForm = document.getElementById("text-form") as HTMLFormElement;
const textInput = document.getElementById("text-input") as HTMLInputElement;
const banner = document.getElementById("banner") as HTMLElement;
const hint = document.getElementById("hint") as HTMLElement;
const subtitle = document.getElementById("subtitle") as HTMLElement;
const wakeToggle = document.getElementById("wake-toggle") as HTMLInputElement;
const wakeDot = document.getElementById("wake-dot") as HTMLElement;

const FOLLOWUP_MS = 9000; // how long to keep listening for a follow-up

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

// ── Streaming text-to-speech ──────────────────────────────────────────
// Buffers incoming text and speaks it one sentence at a time, so Jarvis starts
// talking almost immediately instead of waiting for the whole reply. Suspends
// the mic while speaking so it never hears itself.
class SpeechStreamer {
  private buffer = "";
  private queue: string[] = [];
  private speaking = false;
  private producing = true; // true until finish() is called
  private drained: () => void = () => {};
  readonly done: Promise<void>;

  constructor() {
    this.done = new Promise((resolve) => (this.drained = resolve));
    listener?.suspend();
  }

  push(delta: string): void {
    this.buffer += delta;
    // Flush everything up to the last sentence terminator; keep the remainder.
    const m = this.buffer.match(/^[\s\S]*[.!?\n](?=\s|$)/);
    if (!m) return;
    const chunk = m[0].trim();
    this.buffer = this.buffer.slice(m[0].length);
    if (chunk) this.enqueue(chunk);
  }

  finish(): void {
    this.producing = false;
    const rest = this.buffer.trim();
    this.buffer = "";
    if (rest) this.enqueue(rest);
    this.pump();
  }

  cancel(): void {
    this.producing = false;
    this.queue = [];
    window.speechSynthesis?.cancel();
    this.finalize();
  }

  private enqueue(sentence: string): void {
    this.queue.push(sentence);
    this.pump();
  }

  private pump(): void {
    if (this.speaking) return;
    const next = this.queue.shift();
    if (!next) {
      if (!this.producing) this.finalize();
      return;
    }
    if (!("speechSynthesis" in window)) {
      // No TTS available — just drain.
      this.pump();
      return;
    }
    this.speaking = true;
    const utter = new SpeechSynthesisUtterance(next);
    utter.rate = 1.03;
    const step = () => {
      this.speaking = false;
      this.pump();
    };
    utter.onend = step;
    utter.onerror = step;
    window.speechSynthesis.speak(utter);
  }

  private finalized = false;
  private finalize(): void {
    if (this.finalized) return;
    this.finalized = true;
    // Small tail so the speaker audio drains before the mic resumes.
    setTimeout(() => listener?.resume(), 250);
    this.drained();
  }
}

// A one-shot speak for short cues (greeting, "Yes?", reminders).
function speakOnce(text: string): Promise<void> {
  return new Promise((resolve) => {
    if (!("speechSynthesis" in window) || !text) return resolve();
    window.speechSynthesis.cancel();
    listener?.suspend();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1.03;
    const done = () => {
      setTimeout(() => listener?.resume(), 250);
      resolve();
    };
    utter.onend = done;
    utter.onerror = done;
    window.speechSynthesis.speak(utter);
  });
}

// ── Talking to Jarvis's brain (streaming) ─────────────────────────────
async function handleCommand(text: string): Promise<void> {
  const clean = text.trim();
  if (!clean || busy) return;
  busy = true;
  clearFollowup();
  addBubble("user", clean);

  const bubble = addBubble("jarvis", "…");
  bubble.classList.add("thinking");
  const speaker = new SpeechStreamer();
  let acc = "";
  const toolLabels: string[] = [];

  try {
    const reply = await window.jarvis.ask(
      clean,
      (delta) => {
        acc += delta;
        bubble.classList.remove("thinking");
        bubble.textContent = acc;
        conversation.scrollTop = conversation.scrollHeight;
        speaker.push(delta);
      },
      (label) => {
        if (!toolLabels.includes(label)) toolLabels.push(label);
      },
    );

    // Fallback if streaming produced nothing (e.g. very short reply).
    if (!acc && reply.text) {
      bubble.classList.remove("thinking");
      bubble.textContent = reply.text;
      speaker.push(reply.text);
    }
    if (reply.error) bubble.classList.add("error");
    setToolsUsed(bubble, reply.toolsUsed.length ? reply.toolsUsed : toolLabels);
    speaker.finish();
    await speaker.done;
  } catch {
    speaker.cancel();
    bubble.classList.remove("thinking");
    bubble.textContent = "Something went wrong talking to Jarvis.";
    bubble.classList.add("error");
  } finally {
    busy = false;
  }
}

textForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = textInput.value;
  textInput.value = "";
  void runCommand(text);
});

// ── Wake word + conversational state machine ──────────────────────────
const WAKE_RE = /(?:^|\b)(?:hey[,\s]+|ok[,\s]+|hi[,\s]+)?jarvis\b[\s,.!?]*/i;

function stripWake(text: string): { matched: boolean; rest: string } {
  const m = text.match(WAKE_RE);
  if (!m) return { matched: false, rest: "" };
  return { matched: true, rest: text.slice((m.index ?? 0) + m[0].length).trim() };
}

function isMeaningful(text: string): boolean {
  return text.replace(/[^a-z0-9]/gi, "").length >= 3;
}

type Mode = "idle" | "armed" | "command";
let mode: Mode = "idle";
let forceNextAsCommand = false;
let followupTimer = 0;

function clearFollowup(): void {
  if (followupTimer) {
    clearTimeout(followupTimer);
    followupTimer = 0;
  }
}

// After a reply, keep listening briefly so the user can keep the conversation
// going without saying "Hey Jarvis" again.
function openFollowupWindow(): void {
  if (!wakeToggle.checked) {
    stopListening(); // pure push-to-talk: stop after one command
    return;
  }
  mode = "command";
  setHint("Still listening — just keep talking, or stay quiet to stop.");
  clearFollowup();
  followupTimer = window.setTimeout(() => {
    if (mode === "command") {
      mode = "armed";
      updateHint();
    }
  }, FOLLOWUP_MS);
}

// Runs a command end-to-end, then opens the follow-up window.
async function runCommand(text: string): Promise<void> {
  clearFollowup();
  await handleCommand(text);
  openFollowupWindow();
}

async function onUtterance(text: string): Promise<void> {
  if (!text) return;

  if (forceNextAsCommand || mode === "command") {
    forceNextAsCommand = false;
    await runCommand(text);
    return;
  }

  // Armed: only react to the wake word.
  const { matched, rest } = stripWake(text);
  if (!matched) {
    updateHint();
    return;
  }
  if (isMeaningful(rest)) {
    await runCommand(rest); // "Hey Jarvis, <command>" in one breath
  } else {
    // Bare "Hey Jarvis" — acknowledge and wait for the command.
    mode = "command";
    setHint("Yes? I'm listening…");
    await speakOnce("Yes?");
    clearFollowup();
    followupTimer = window.setTimeout(() => {
      if (mode === "command") {
        mode = "armed";
        updateHint();
      }
    }, FOLLOWUP_MS);
  }
}

// ── Microphone capture + voice-activity detection ─────────────────────
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
    this.silenceStart = 0;
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
    this.recorder.onstop = () => void this.finishSegment();
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
  } catch {
    setHint("Microphone unavailable. Check mic permissions. You can still type.");
    return false;
  }
}

function stopListening(): void {
  listener?.stop();
  wakeDot.classList.remove("live");
  mode = "idle";
  clearFollowup();
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
  setHint("Listening… speak your command.");
});

// ── Reminders spoken proactively ──────────────────────────────────────
window.jarvis.onSpeak((text) => {
  addBubble("jarvis", text);
  void speakOnce(text);
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

  // Auto-arm the wake word so it's hands-free out of the box.
  if (sttReady) {
    wakeToggle.checked = true;
    const ok = await ensureListener();
    if (ok) mode = "armed";
    else wakeToggle.checked = false;
    updateHint();
  }
})();
