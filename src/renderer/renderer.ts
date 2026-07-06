// Renderer: handles the mic (speech-to-text), the on-screen conversation, and
// speaking Jarvis's replies (text-to-speech). All "thinking" happens in the
// main process via window.jarvis.ask().

const conversation = document.getElementById("conversation") as HTMLElement;
const micBtn = document.getElementById("mic") as HTMLButtonElement;
const textForm = document.getElementById("text-form") as HTMLFormElement;
const textInput = document.getElementById("text-input") as HTMLInputElement;
const banner = document.getElementById("banner") as HTMLElement;
const hint = document.getElementById("hint") as HTMLElement;
const subtitle = document.getElementById("subtitle") as HTMLElement;

let busy = false;

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

// ── Text-to-speech ────────────────────────────────────────────────────
function speak(text: string): void {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = 1.02;
  utter.pitch = 1.0;
  window.speechSynthesis.speak(utter);
}

// ── Send a message to Jarvis ──────────────────────────────────────────
async function send(text: string): Promise<void> {
  const clean = text.trim();
  if (!clean || busy) return;
  busy = true;
  micBtn.disabled = true;
  addBubble("user", clean);

  const thinking = addBubble("jarvis", "…");
  thinking.classList.add("thinking");

  try {
    const reply = await window.jarvis.ask(clean);
    thinking.classList.remove("thinking");
    thinking.textContent = reply.text;
    if (reply.error) thinking.classList.add("error");
    setToolsUsed(thinking, reply.toolsUsed);
    speak(reply.text);
  } catch (err) {
    thinking.classList.remove("thinking");
    thinking.textContent = "Something went wrong talking to Jarvis.";
    thinking.classList.add("error");
  } finally {
    busy = false;
    micBtn.disabled = false;
  }
}

textForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = textInput.value;
  textInput.value = "";
  void send(text);
});

// ── Speech-to-text ────────────────────────────────────────────────────
const RecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition: SpeechRecognitionLike | null = null;
let listening = false;

if (RecognitionCtor) {
  recognition = new RecognitionCtor();
  recognition.lang = "en-US";
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onstart = () => {
    listening = true;
    micBtn.classList.add("listening");
    hint.textContent = "Listening… speak now.";
  };
  recognition.onend = () => {
    listening = false;
    micBtn.classList.remove("listening");
    hint.textContent = "Click the mic and speak, or type below.";
  };
  recognition.onerror = (event: any) => {
    listening = false;
    micBtn.classList.remove("listening");
    if (event.error === "not-allowed" || event.error === "service-not-allowed") {
      hint.textContent = "Microphone access was blocked. Check your OS/mic permissions.";
    } else if (event.error !== "no-speech" && event.error !== "aborted") {
      hint.textContent = `Speech error: ${event.error}. You can type instead.`;
    }
  };
  recognition.onresult = (event: any) => {
    const transcript = event.results?.[0]?.[0]?.transcript ?? "";
    if (transcript) void send(transcript);
  };

  micBtn.addEventListener("click", () => {
    if (busy) return;
    // Barge-in: stop Jarvis talking when the user wants to speak.
    window.speechSynthesis?.cancel();
    if (listening) recognition!.stop();
    else recognition!.start();
  });
} else {
  micBtn.disabled = true;
  micBtn.title = "Speech recognition isn't available in this build — type instead.";
  hint.textContent = "Voice input isn't available here. Type to Jarvis below.";
}

// ── Startup: status check + greeting ──────────────────────────────────
window.jarvis.onSpeak((text) => {
  addBubble("jarvis", text);
  speak(text);
});

(async () => {
  const status = await window.jarvis.getStatus();
  if (status.userName) subtitle.textContent = `assistant to ${status.userName}`;

  if (!status.hasApiKey) {
    banner.classList.remove("hidden");
    banner.textContent =
      "No Anthropic API key found. Copy .env.example to .env and add your ANTHROPIC_API_KEY, then restart.";
  } else if (!status.googleConfigured) {
    banner.classList.remove("hidden");
    banner.classList.add("subtle");
    banner.textContent =
      "Tip: reminders and chat are ready. Add Google credentials in .env to unlock Calendar and Email.";
  }

  const greeting = status.userName
    ? `Hello ${status.userName}. How can I help?`
    : "Hello. How can I help?";
  addBubble("jarvis", greeting);
})();
