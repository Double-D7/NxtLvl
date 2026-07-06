// Cloud speech-to-text. Runs in the main process so the API key never reaches
// the renderer. The renderer captures mic audio and hands raw bytes here; we
// forward them to a transcription API and return plain text.
//
// Defaults to OpenAI's audio transcription endpoint (Whisper / gpt-4o-transcribe
// family), which is the most widely available. Any OpenAI-compatible
// transcription endpoint works via STT_BASE_URL.

const BASE_URL = process.env.STT_BASE_URL || "https://api.openai.com/v1";
const MODEL = process.env.STT_MODEL || "gpt-4o-mini-transcribe";

export function isConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY || process.env.STT_API_KEY);
}

function apiKey(): string {
  return (process.env.STT_API_KEY || process.env.OPENAI_API_KEY) as string;
}

export const NOT_CONFIGURED_MSG =
  "Voice input needs a speech-to-text key. Add OPENAI_API_KEY to your .env " +
  "(see .env.example), then restart Jarvis. Typing still works meanwhile.";

/**
 * Transcribe a chunk of recorded audio. `bytes` is the raw audio file (e.g. a
 * webm/opus blob from MediaRecorder); `mimeType` describes it.
 */
export async function transcribe(bytes: ArrayBuffer, mimeType: string): Promise<string> {
  if (!isConfigured()) throw new Error(NOT_CONFIGURED_MSG);

  const ext = mimeType.includes("wav") ? "wav" : mimeType.includes("mp4") ? "mp4" : "webm";
  const form = new FormData();
  form.append("file", new Blob([bytes], { type: mimeType }), `audio.${ext}`);
  form.append("model", MODEL);
  form.append("response_format", "json");
  // A short prompt nudges the model to spell the wake word consistently.
  form.append("prompt", "Hey Jarvis.");

  const resp = await fetch(`${BASE_URL}/audio/transcriptions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey()}` },
    body: form,
  });

  const text = await resp.text();
  if (!resp.ok) {
    let msg = `transcription failed (${resp.status})`;
    try {
      msg = JSON.parse(text)?.error?.message || msg;
    } catch {
      /* keep default */
    }
    throw new Error(msg);
  }
  return (JSON.parse(text).text || "").trim();
}
