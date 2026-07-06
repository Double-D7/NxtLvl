// Renderer: the JARVIS HUD. Handles mic capture with voice-activity detection
// and barge-in, a "Hey Jarvis" wake word, streaming speech, an audio-reactive
// arc-reactor visualizer + waveform, live telemetry, and a conversational
// follow-up window. All "thinking" and transcription happen in the main process.

const conversation = document.getElementById("conversation") as HTMLElement;
const micBtn = document.getElementById("mic") as HTMLButtonElement;
const textForm = document.getElementById("text-form") as HTMLFormElement;
const textInput = document.getElementById("text-input") as HTMLInputElement;
const banner = document.getElementById("banner") as HTMLElement;
const hint = document.getElementById("hint") as HTMLElement;
const subtitle = document.getElementById("subtitle") as HTMLElement;
const wakeToggle = document.getElementById("wake-toggle") as HTMLInputElement;
const wakeDot = document.getElementById("wake-dot") as HTMLElement;
const reactorWrap = document.querySelector(".reactor-wrap") as HTMLElement;
const stateLabel = document.getElementById("visual-state") as HTMLElement;
const voiceSelect = document.getElementById("voice-select") as HTMLSelectElement;
const voiceTest = document.getElementById("voice-test") as HTMLButtonElement;

const FOLLOWUP_MS = 9000;

let busy = false;
let sttReady = false;

// ── Visual state ──────────────────────────────────────────────────────
type VisualState = "standby" | "listening" | "thinking" | "speaking";
let visualState: VisualState = "standby";

function setVisual(s: VisualState): void {
  visualState = s;
  const labels: Record<VisualState, string> = {
    standby: "STANDBY",
    listening: "LISTENING",
    thinking: "PROCESSING",
    speaking: "SPEAKING",
  };
  stateLabel.textContent = labels[s];
  reactorWrap.classList.toggle("state-thinking", s === "thinking");
  reactorWrap.classList.toggle("state-speaking", s === "speaking");
}

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
  tag.textContent = "⟐ " + tools.join(" · ");
  bubble.appendChild(tag);
}

function setHint(text: string): void {
  hint.textContent = text;
}

// ── Voice selection ───────────────────────────────────────────────────
// Picks a deep, Jarvis-like voice by default (British male if available, e.g.
// "Microsoft George" / "Daniel"; otherwise a US male like "Microsoft David"),
// and lets the user switch. Applied to every utterance with a lowered pitch.
function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (!("speechSynthesis" in window)) return resolve([]);
    const ready = window.speechSynthesis.getVoices();
    if (ready.length) return resolve(ready);
    window.speechSynthesis.onvoiceschanged = () => resolve(window.speechSynthesis.getVoices());
    setTimeout(() => resolve(window.speechSynthesis.getVoices()), 1800);
  });
}

class VoiceManager {
  voices: SpeechSynthesisVoice[] = [];
  current: SpeechSynthesisVoice | null = null;
  pitch = 0.9; // slightly deeper for the Jarvis feel
  rate = 1.02;

  async init(): Promise<void> {
    this.voices = await loadVoices();
    const saved = localStorage.getItem("jarvis-voice");
    this.current = (saved ? this.voices.find((v) => v.name === saved) : null) ?? this.pickBest();
    this.populate();
  }

  private score(v: SpeechSynthesisVoice): number {
    const n = v.name.toLowerCase();
    const l = (v.lang || "").toLowerCase();
    const male = /(david|mark|guy|george|ryan|arthur|daniel|james|thomas|william|brian|matthew|alex|oliver|aaron)/;
    let s = 0;
    if (male.test(n)) s += 5;
    if (l.startsWith("en-gb")) s += 3;
    else if (l.startsWith("en-us")) s += 2;
    else if (l.startsWith("en")) s += 1;
    if (/microsoft/.test(n)) s += 0.5; // native Windows SAPI voices are reliable
    return s;
  }

  pickBest(): SpeechSynthesisVoice | null {
    if (!this.voices.length) return null;
    return [...this.voices].sort((a, b) => this.score(b) - this.score(a))[0];
  }

  private populate(): void {
    voiceSelect.innerHTML = "";
    const sorted = [...this.voices].sort((a, b) => {
      const ae = (a.lang || "").startsWith("en") ? 0 : 1;
      const be = (b.lang || "").startsWith("en") ? 0 : 1;
      return ae - be || a.name.localeCompare(b.name);
    });
    if (sorted.length === 0) {
      const opt = document.createElement("option");
      opt.textContent = "System default";
      voiceSelect.appendChild(opt);
      voiceSelect.disabled = true;
      return;
    }
    for (const v of sorted) {
      const opt = document.createElement("option");
      opt.value = v.name;
      opt.textContent = `${v.name} · ${v.lang}`;
      if (this.current && v.name === this.current.name) opt.selected = true;
      voiceSelect.appendChild(opt);
    }
  }

  set(name: string): void {
    const v = this.voices.find((x) => x.name === name);
    if (v) {
      this.current = v;
      localStorage.setItem("jarvis-voice", name);
    }
  }

  apply(utter: SpeechSynthesisUtterance): void {
    if (this.current) utter.voice = this.current;
    utter.pitch = this.pitch;
    utter.rate = this.rate;
  }
}

const voiceManager = new VoiceManager();

voiceSelect.addEventListener("change", () => voiceManager.set(voiceSelect.value));
voiceTest.addEventListener("click", () => {
  window.speechSynthesis?.cancel();
  void speakOnce("Systems online. All functions nominal. How can I help?");
});

// ── Streaming text-to-speech ──────────────────────────────────────────
let activeSpeaker: SpeechStreamer | null = null;

class SpeechStreamer {
  private buffer = "";
  private queue: string[] = [];
  private speaking = false;
  private producing = true;
  private startedSpeaking = false;
  private finalized = false;
  private drained: () => void = () => {};
  readonly done: Promise<void>;
  onSpeakingStart?: () => void;

  constructor() {
    this.done = new Promise((resolve) => (this.drained = resolve));
    activeSpeaker = this;
  }

  push(delta: string): void {
    this.buffer += delta;
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
    if (!this.startedSpeaking) {
      this.startedSpeaking = true;
      this.onSpeakingStart?.();
    }
    if (!("speechSynthesis" in window)) {
      this.pump();
      return;
    }
    this.speaking = true;
    const utter = new SpeechSynthesisUtterance(next);
    voiceManager.apply(utter);
    const step = () => {
      this.speaking = false;
      this.pump();
    };
    utter.onend = step;
    utter.onerror = step;
    window.speechSynthesis.speak(utter);
  }

  private finalize(): void {
    if (this.finalized) return;
    this.finalized = true;
    if (activeSpeaker === this) activeSpeaker = null;
    this.drained();
  }
}

function speakOnce(text: string): Promise<void> {
  return new Promise((resolve) => {
    if (!("speechSynthesis" in window) || !text) return resolve();
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    voiceManager.apply(utter);
    const done = () => resolve();
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
  setVisual("thinking");
  setListen("off");
  addBubble("user", clean);

  const bubble = addBubble("jarvis", "…");
  bubble.classList.add("thinking");
  const speaker = new SpeechStreamer();
  speaker.onSpeakingStart = () => {
    setVisual("speaking");
    setListen("guard"); // allow barge-in while Jarvis talks
  };
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

function backToStandby(): void {
  setVisual("standby");
  updateHint();
}

function openFollowupWindow(): void {
  if (!wakeToggle.checked && !forceNextAsCommand) {
    stopListening();
    backToStandby();
    return;
  }
  mode = "command";
  setListen("listen");
  setVisual("standby");
  setHint("Still listening — keep talking, or stay quiet to stop.");
  clearFollowup();
  followupTimer = window.setTimeout(() => {
    if (mode === "command") {
      mode = "armed";
      updateHint();
    }
  }, FOLLOWUP_MS);
}

async function runCommand(text: string): Promise<void> {
  clearFollowup();
  await handleCommand(text);
  openFollowupWindow();
}

async function onUtterance(text: string): Promise<void> {
  if (!text) {
    setListen(mode === "idle" ? "off" : "listen");
    return;
  }

  if (forceNextAsCommand || mode === "command") {
    forceNextAsCommand = false;
    await runCommand(text);
    return;
  }

  // Armed: only react to the wake word.
  const { matched, rest } = stripWake(text);
  if (!matched) {
    setListen("listen");
    updateHint();
    return;
  }
  if (isMeaningful(rest)) {
    await runCommand(rest);
  } else {
    mode = "command";
    setHint("Yes? I'm listening…");
    await speakOnce("Yes?");
    setListen("listen");
    clearFollowup();
    followupTimer = window.setTimeout(() => {
      if (mode === "command") {
        mode = "armed";
        updateHint();
      }
    }, FOLLOWUP_MS);
  }
}

// ── Microphone capture + VAD + barge-in ───────────────────────────────
type ListenMode = "off" | "listen" | "guard";

class MicListener {
  mode: ListenMode = "off";
  onBarge?: () => void;
  onSpeechStart?: () => void;
  onSpeechEnd?: () => void;

  private stream: MediaStream | null = null;
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private recorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private running = false;
  private speaking = false;
  private silenceStart = 0;
  private speechStart = 0;
  private guardSince = 0;
  private raf = 0;
  private timeBuf = new Uint8Array(1024);
  private freqBuf = new Uint8Array(512);

  private readonly startThreshold = 0.025;
  private readonly stopThreshold = 0.018;
  private readonly guardStart = 0.07; // higher bar so Jarvis's own voice won't trip it
  private readonly guardSustainMs = 140;
  private readonly silenceHangMs = 750;
  private readonly minSpeechMs = 250;
  private readonly maxSpeechMs = 15000;

  get analyserNode(): AnalyserNode | null {
    return this.mode !== "off" ? this.analyser : null;
  }

  level(): number {
    if (!this.analyser) return 0;
    this.analyser.getByteTimeDomainData(this.timeBuf);
    let sum = 0;
    for (let i = 0; i < this.timeBuf.length; i++) {
      const v = (this.timeBuf[i] - 128) / 128;
      sum += v * v;
    }
    return Math.min(1, Math.sqrt(sum / this.timeBuf.length) * 3.2);
  }

  freq(): Uint8Array | null {
    if (!this.analyser) return null;
    this.analyser.getByteFrequencyData(this.freqBuf);
    return this.freqBuf;
  }

  async start(): Promise<void> {
    if (this.running) return;
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });
    this.ctx = new AudioContext();
    // The context can start "suspended" under Chromium's autoplay policy (we
    // auto-arm without a click); resume it or the analyser reads only silence
    // and the wake word never triggers.
    if (this.ctx.state === "suspended") await this.ctx.resume();
    const src = this.ctx.createMediaStreamSource(this.stream);
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 1024;
    this.timeBuf = new Uint8Array(this.analyser.fftSize);
    this.freqBuf = new Uint8Array(this.analyser.frequencyBinCount);
    src.connect(this.analyser);
    this.running = true;
    this.loop();
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
    this.analyser = null;
    this.speaking = false;
    this.mode = "off";
  }

  private rms(): number {
    if (!this.analyser) return 0;
    this.analyser.getByteTimeDomainData(this.timeBuf);
    let sum = 0;
    for (let i = 0; i < this.timeBuf.length; i++) {
      const v = (this.timeBuf[i] - 128) / 128;
      sum += v * v;
    }
    return Math.sqrt(sum / this.timeBuf.length);
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

  private stopSegment(): void {
    if (this.recorder && this.recorder.state === "recording") this.recorder.stop();
    this.speaking = false;
    this.silenceStart = 0;
    this.onSpeechEnd?.();
    // Pause capture until the app decides what's next (transcribe → route).
    if (this.mode === "listen") this.mode = "off";
  }

  private async finishSegment(): Promise<void> {
    const blob = new Blob(this.chunks, { type: this.recorder?.mimeType || "audio/webm" });
    this.chunks = [];
    const durationMs = performance.now() - this.speechStart;
    if (durationMs < this.minSpeechMs || blob.size < 1200) {
      if (this.mode === "off" && (mode === "armed" || mode === "command")) this.mode = "listen";
      return;
    }
    try {
      const bytes = await blob.arrayBuffer();
      const result = await window.jarvis.transcribe(bytes, blob.type);
      if (result.error) {
        setHint(`Transcription error: ${result.error}`);
        if (mode === "armed" || mode === "command") this.mode = "listen";
        return;
      }
      await onUtterance(result.text);
    } catch {
      setHint("Couldn't transcribe that. Try again or type.");
      if (mode === "armed" || mode === "command") this.mode = "listen";
    }
  }

  private loop = (): void => {
    if (!this.running) return;
    this.raf = requestAnimationFrame(this.loop);
    if (this.mode === "off") return;

    const level = this.rms();
    const now = performance.now();

    if (this.mode === "guard") {
      // Barge-in: only a sustained, loud utterance interrupts Jarvis.
      if (level > this.guardStart) {
        if (this.guardSince === 0) this.guardSince = now;
        if (now - this.guardSince > this.guardSustainMs) {
          this.guardSince = 0;
          this.mode = "listen";
          this.onBarge?.();
          this.beginSegment();
          this.speaking = true;
          this.silenceStart = 0;
          this.onSpeechStart?.();
        }
      } else {
        this.guardSince = 0;
      }
      return;
    }

    // mode === "listen"
    if (!this.speaking) {
      if (level > this.startThreshold) {
        this.speaking = true;
        this.silenceStart = 0;
        this.beginSegment();
        this.onSpeechStart?.();
      }
    } else {
      const tooLong = now - this.speechStart > this.maxSpeechMs;
      if (level < this.stopThreshold) {
        if (this.silenceStart === 0) this.silenceStart = now;
        if (now - this.silenceStart > this.silenceHangMs || tooLong) this.stopSegment();
      } else {
        this.silenceStart = 0;
        if (tooLong) this.stopSegment();
      }
    }
  };
}

let listener: MicListener | null = null;

function setListen(m: ListenMode): void {
  if (listener) listener.mode = m;
}

async function ensureListener(): Promise<boolean> {
  if (!sttReady) return false;
  if (!listener) {
    listener = new MicListener();
    listener.onBarge = () => {
      activeSpeaker?.cancel();
      forceNextAsCommand = true;
      setVisual("listening");
      setHint("Go ahead…");
    };
    listener.onSpeechStart = () => {
      if (!busy) setVisual("listening");
    };
    listener.onSpeechEnd = () => {
      if (!busy && visualState === "listening") setVisual("standby");
    };
  }
  try {
    await listener.start();
    wakeDot.classList.add("live");
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
  else if (sttReady) setHint("Say “Hey Jarvis” or click the core.");
  else setHint("Add an OpenAI key for voice. Typing works now.");
}

// ── Push-to-talk ──────────────────────────────────────────────────────
async function pushToTalk(): Promise<void> {
  if (busy || !sttReady) return;
  window.speechSynthesis?.cancel();
  activeSpeaker?.cancel();
  const ok = await ensureListener();
  if (!ok) return;
  forceNextAsCommand = true;
  if (mode === "idle") mode = "command";
  setListen("listen");
  setVisual("listening");
  setHint("Listening… speak your command.");
}

micBtn.addEventListener("click", () => void pushToTalk());

// ── Controls ──────────────────────────────────────────────────────────
wakeToggle.addEventListener("change", async () => {
  if (wakeToggle.checked) {
    const ok = await ensureListener();
    if (ok) {
      mode = "armed";
      setListen("listen");
      updateHint();
    } else {
      wakeToggle.checked = false;
    }
  } else {
    stopListening();
    backToStandby();
  }
});

// ── Live clock ────────────────────────────────────────────────────────
const clockTime = document.getElementById("clock-time") as HTMLElement;
const clockDate = document.getElementById("clock-date") as HTMLElement;
function tickClock(): void {
  const d = new Date();
  clockTime.textContent = d.toLocaleTimeString(undefined, { hour12: false });
  clockDate.textContent = d
    .toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric", year: "numeric" })
    .toUpperCase();
}
setInterval(tickClock, 1000);
tickClock();

// ── Telemetry binding ─────────────────────────────────────────────────
const el = (id: string) => document.getElementById(id) as HTMLElement;
function fmtUptime(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}
function fmtWhen(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

window.jarvis.onStats((s) => {
  el("cpu-val").textContent = `${s.cpu}%`;
  const cpuBar = el("cpu-bar");
  cpuBar.style.width = `${s.cpu}%`;
  cpuBar.classList.toggle("hot", s.cpu > 80);
  el("mem-val").textContent = `${s.memGb}/${s.memTotalGb} GB`;
  const memBar = el("mem-bar");
  memBar.style.width = `${s.memUsed}%`;
  memBar.classList.toggle("hot", s.memUsed > 85);
  el("uptime-val").textContent = fmtUptime(s.uptime);
  el("host-val").textContent = s.hostname;
  el("platform-val").textContent = s.platform;
  el("rem-count").textContent = String(s.reminders.pending);
  const next = s.reminders.next
    ? `${s.reminders.next}${s.reminders.nextAt ? "  ·  " + fmtWhen(s.reminders.nextAt) : ""}`
    : "— none scheduled —";
  el("next-reminder").textContent = next;
});

// ── Arc-reactor visualizer ────────────────────────────────────────────
class Reactor {
  private ctx: CanvasRenderingContext2D;
  private w = 0;
  private h = 0;
  private smooth = 0;
  private rot = 0;

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext("2d")!;
    this.resize();
    window.addEventListener("resize", () => this.resize());
  }

  resize(): void {
    const r = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.w = r.width;
    this.h = r.height;
    this.canvas.width = Math.max(1, r.width * dpr);
    this.canvas.height = Math.max(1, r.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  private color(): [number, number, number] {
    switch (visualState) {
      case "thinking":
        return [255, 178, 77];
      case "speaking":
        return [53, 255, 206];
      case "listening":
        return [120, 240, 255];
      default:
        return [53, 230, 255];
    }
  }

  private levelAt(t: number): number {
    if (visualState === "listening" && listener?.analyserNode) return listener.level();
    switch (visualState) {
      case "speaking":
        return 0.4 + 0.4 * Math.abs(Math.sin(t * 7.3) * Math.sin(t * 2.1));
      case "thinking":
        return 0.22 + 0.12 * Math.sin(t * 3);
      case "listening":
        return 0.3;
      default:
        return 0.09 + 0.03 * Math.sin(t * 1.4);
    }
  }

  start(): void {
    const loop = () => {
      requestAnimationFrame(loop);
      this.draw();
    };
    loop();
  }

  private draw(): void {
    const { ctx, w, h } = this;
    if (!w || !h) return;
    const t = performance.now() / 1000;
    ctx.clearRect(0, 0, w, h);
    const cx = w / 2;
    const cy = h / 2;
    const R = Math.min(w, h) * 0.34;
    const [cr, cg, cb] = this.color();
    const raw = this.levelAt(t);
    this.smooth += (raw - this.smooth) * 0.18;
    const lvl = this.smooth;
    this.rot += 0.004 + lvl * 0.012;
    const stroke = (a: number) => `rgba(${cr},${cg},${cb},${a})`;
    const freq = visualState === "listening" ? listener?.freq() ?? null : null;

    // Outer tick ring
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(this.rot * 0.5);
    ctx.strokeStyle = stroke(0.45);
    ctx.lineWidth = 1;
    for (let i = 0; i < 60; i++) {
      const a = (i / 60) * Math.PI * 2;
      const inner = R * 1.16;
      const outer = R * (i % 5 === 0 ? 1.28 : 1.22);
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * inner, Math.sin(a) * inner);
      ctx.lineTo(Math.cos(a) * outer, Math.sin(a) * outer);
      ctx.stroke();
    }
    ctx.restore();

    // Segmented ring (counter-rotating)
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-this.rot);
    ctx.lineWidth = 2;
    ctx.strokeStyle = stroke(0.65);
    for (let i = 0; i < 8; i++) {
      const a0 = (i / 8) * Math.PI * 2 + 0.12;
      const a1 = a0 + (Math.PI * 2) / 8 * 0.62;
      ctx.beginPath();
      ctx.arc(0, 0, R * 1.04, a0, a1);
      ctx.stroke();
    }
    ctx.restore();

    // Audio bars
    ctx.save();
    ctx.translate(cx, cy);
    const bars = 72;
    for (let i = 0; i < bars; i++) {
      const a = (i / bars) * Math.PI * 2;
      const mag = freq
        ? freq[Math.floor((i / bars) * freq.length)] / 255
        : lvl * (0.5 + 0.5 * Math.abs(Math.sin(i * 0.5 + t * 4)));
      const r0 = R * 0.56;
      const len = R * 0.1 + mag * R * 0.42;
      ctx.strokeStyle = stroke(0.3 + mag * 0.6);
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r0, Math.sin(a) * r0);
      ctx.lineTo(Math.cos(a) * (r0 + len), Math.sin(a) * (r0 + len));
      ctx.stroke();
    }
    ctx.restore();

    // Inner ring + rotating triangle
    ctx.beginPath();
    ctx.arc(cx, cy, R * 0.5, 0, Math.PI * 2);
    ctx.strokeStyle = stroke(0.55);
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(this.rot * 0.8);
    ctx.strokeStyle = stroke(0.5);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2 - Math.PI / 2;
      const x = Math.cos(a) * R * 0.42;
      const y = Math.sin(a) * R * 0.42;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();

    // Glowing core
    const coreR = R * 0.3 * (1 + lvl * 0.4);
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR * 1.7);
    g.addColorStop(0, `rgba(${cr},${cg},${cb},0.95)`);
    g.addColorStop(0.4, `rgba(${cr},${cg},${cb},0.45)`);
    g.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, coreR * 1.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgba(${cr},${cg},${cb},0.9)`;
    ctx.beginPath();
    ctx.arc(cx, cy, coreR * 0.45, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ── Waveform strip ────────────────────────────────────────────────────
class Wave {
  private ctx: CanvasRenderingContext2D;
  private w = 0;
  private h = 0;
  private smooth = 0;

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext("2d")!;
    this.resize();
    window.addEventListener("resize", () => this.resize());
  }

  resize(): void {
    const r = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.w = r.width;
    this.h = r.height;
    this.canvas.width = Math.max(1, r.width * dpr);
    this.canvas.height = Math.max(1, r.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  private color(): string {
    switch (visualState) {
      case "thinking":
        return "255,178,77";
      case "speaking":
        return "53,255,206";
      case "listening":
        return "120,240,255";
      default:
        return "53,230,255";
    }
  }

  start(): void {
    const loop = () => {
      requestAnimationFrame(loop);
      this.draw();
    };
    loop();
  }

  private draw(): void {
    const { ctx, w, h } = this;
    if (!w || !h) return;
    const t = performance.now() / 1000;
    ctx.clearRect(0, 0, w, h);
    const mid = h / 2;
    const c = this.color();

    let raw: number;
    if (visualState === "listening" && listener?.analyserNode) raw = listener.level();
    else if (visualState === "speaking") raw = 0.5 + 0.4 * Math.abs(Math.sin(t * 6));
    else if (visualState === "thinking") raw = 0.25;
    else raw = 0.08;
    this.smooth += (raw - this.smooth) * 0.2;
    const amp = this.smooth * (h * 0.42);

    ctx.strokeStyle = `rgba(${c},0.9)`;
    ctx.lineWidth = 2;
    ctx.shadowBlur = 8;
    ctx.shadowColor = `rgba(${c},0.6)`;
    ctx.beginPath();
    const step = 3;
    for (let x = 0; x <= w; x += step) {
      const phase = (x / w) * Math.PI * 8 + t * 6;
      const env = Math.sin((x / w) * Math.PI); // taper at edges
      const y = mid + Math.sin(phase) * amp * env;
      x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // baseline
    ctx.strokeStyle = `rgba(${c},0.2)`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, mid);
    ctx.lineTo(w, mid);
    ctx.stroke();
  }
}

// ── Reminders spoken proactively ──────────────────────────────────────
window.jarvis.onSpeak((text) => {
  addBubble("jarvis", text);
  void speakOnce(text);
});

// ── Startup ───────────────────────────────────────────────────────────
const reactorCanvas = document.getElementById("reactor") as HTMLCanvasElement;
reactorCanvas.addEventListener("click", () => void pushToTalk());
const reactor = new Reactor(reactorCanvas);
const wave = new Wave(document.getElementById("wave") as HTMLCanvasElement);

(async () => {
  const status = await window.jarvis.getStatus();
  sttReady = status.sttConfigured;
  if (status.userName) subtitle.textContent = `Online · assistant to ${status.userName}`;

  if (!status.hasApiKey) {
    banner.classList.remove("hidden");
    banner.textContent =
      "No Anthropic API key found. Copy .env.example to .env and add ANTHROPIC_API_KEY, then restart.";
  } else if (!sttReady) {
    banner.classList.remove("hidden");
    banner.classList.add("subtle");
    banner.textContent =
      "Voice input is off — add OPENAI_API_KEY to .env to enable the mic and “Hey Jarvis”. Typing and voice replies work now.";
    micBtn.disabled = true;
    wakeToggle.disabled = true;
  }

  // Give the canvases a beat to get their laid-out size, then start drawing.
  requestAnimationFrame(() => {
    reactor.resize();
    wave.resize();
    reactor.start();
    wave.start();
  });

  updateHint();

  await voiceManager.init(); // load voices + pick a Jarvis-like default first

  const greeting = status.userName
    ? `Systems online. Good to see you, ${status.userName}. Say “Hey Jarvis” or click the core.`
    : "Systems online. Say “Hey Jarvis” or click the core when you need me.";
  addBubble("jarvis", greeting);

  if (sttReady) {
    wakeToggle.checked = true;
    const ok = await ensureListener();
    if (ok) {
      mode = "armed";
      setListen("listen");
    } else {
      wakeToggle.checked = false;
    }
    updateHint();
  }
})();
