import { contextBridge, ipcRenderer } from "electron";
import type { JarvisReply } from "../shared/types";

// Safely expose a small, typed API to the renderer. The renderer never touches
// Node or the Anthropic key directly — everything goes through these channels.
contextBridge.exposeInMainWorld("jarvis", {
  ask: (text: string): Promise<JarvisReply> => ipcRenderer.invoke("jarvis:ask", text),
  reset: (): Promise<void> => ipcRenderer.invoke("jarvis:reset"),
  getStatus: (): Promise<{ hasApiKey: boolean; googleConfigured: boolean; userName: string }> =>
    ipcRenderer.invoke("jarvis:status"),
  // Fires when a reminder comes due and should be spoken aloud.
  onSpeak: (cb: (text: string) => void) => {
    ipcRenderer.on("jarvis:speak", (_e, text: string) => cb(text));
  },
});
