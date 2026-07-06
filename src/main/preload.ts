import { contextBridge, ipcRenderer } from "electron";
import type { JarvisReply } from "../shared/types";

export interface JarvisStatus {
  hasApiKey: boolean;
  googleConfigured: boolean;
  sttConfigured: boolean;
  userName: string;
}

export interface TranscriptResult {
  text: string;
  error?: string;
}

// Safely expose a small, typed API to the renderer. The renderer never touches
// Node, the Anthropic key, or the STT key directly — everything goes through
// these channels.
contextBridge.exposeInMainWorld("jarvis", {
  ask: (text: string): Promise<JarvisReply> => ipcRenderer.invoke("jarvis:ask", text),
  reset: (): Promise<void> => ipcRenderer.invoke("jarvis:reset"),
  getStatus: (): Promise<JarvisStatus> => ipcRenderer.invoke("jarvis:status"),
  // Send recorded audio bytes to the main process for transcription.
  transcribe: (bytes: ArrayBuffer, mimeType: string): Promise<TranscriptResult> =>
    ipcRenderer.invoke("jarvis:transcribe", bytes, mimeType),
  // Fires when a reminder comes due and should be spoken aloud.
  onSpeak: (cb: (text: string) => void) => {
    ipcRenderer.on("jarvis:speak", (_e, text: string) => cb(text));
  },
});
