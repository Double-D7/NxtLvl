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
  // Streams the reply: onDelta fires with text as it arrives, onTool with tool
  // labels; the returned promise resolves with the final reply.
  ask: (
    text: string,
    onDelta?: (delta: string) => void,
    onTool?: (label: string) => void,
  ): Promise<JarvisReply> => {
    const id = Math.random().toString(36).slice(2);
    const channel = `jarvis:stream:${id}`;
    const listener = (_e: unknown, msg: { type: string; text?: string; label?: string }) => {
      if (msg.type === "delta" && msg.text) onDelta?.(msg.text);
      else if (msg.type === "tool" && msg.label) onTool?.(msg.label);
    };
    ipcRenderer.on(channel, listener);
    return ipcRenderer
      .invoke("jarvis:ask", { id, text })
      .finally(() => ipcRenderer.removeListener(channel, listener));
  },
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
