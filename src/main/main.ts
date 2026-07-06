import { app, BrowserWindow, ipcMain, session } from "electron";
import * as path from "path";
import * as os from "os";
import * as dotenv from "dotenv";

// Load .env from wherever it might live: the project root (dev), next to the
// packaged executable, the home directory, or the current working directory.
// First value wins; dotenv won't overwrite variables already set.
for (const dir of [app.getAppPath(), path.dirname(app.getPath("exe")), os.homedir(), process.cwd()]) {
  dotenv.config({ path: path.join(dir, ".env") });
}

import { Brain } from "./brain";
import { startReminderScheduler } from "./tools/reminders";
import * as google from "./google";
import * as stt from "./stt";
import * as store from "./store";
import { sample as sampleTelemetry } from "./telemetry";

interface Settings {
  anthropicApiKey?: string;
  openaiApiKey?: string;
}

// Keys entered in the app's Settings panel are saved locally and applied here,
// so users never have to hand-place a .env file. Env vars take precedence.
function applyStoredKeys(): void {
  const s = store.read<Settings>("settings", {});
  if (!process.env.ANTHROPIC_API_KEY && s.anthropicApiKey) process.env.ANTHROPIC_API_KEY = s.anthropicApiKey;
  if (!process.env.OPENAI_API_KEY && !process.env.STT_API_KEY && s.openaiApiKey)
    process.env.OPENAI_API_KEY = s.openaiApiKey;
}

// Windows: give the app a stable identity so desktop notifications show
// "Jarvis" (and land in the Action Center) instead of "electron.app.Electron".
// No-op on macOS/Linux.
if (process.platform === "win32") app.setAppUserModelId("com.nxtlvl.jarvis");

let mainWindow: BrowserWindow | null = null;
let brain: Brain | null = null;
let stopScheduler: (() => void) | null = null;
let telemetryTimer: NodeJS.Timeout | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1040,
    height: 720,
    minWidth: 760,
    minHeight: 600,
    title: "JARVIS",
    backgroundColor: "#04070d",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      // Keep the mic loop, wake word, and visualizers running when the window
      // isn't focused — Windows throttles background renderers by default,
      // which would freeze an always-listening assistant.
      backgroundThrottling: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, "..", "renderer", "index.html"));
  mainWindow.on("closed", () => (mainWindow = null));
}

function registerIpc(): void {
  ipcMain.handle("jarvis:ask", async (e, payload: { id: string; text: string }) => {
    if (!brain) brain = new Brain();
    const channel = `jarvis:stream:${payload.id}`;
    return brain.ask(payload.text, {
      onDelta: (delta) => e.sender.send(channel, { type: "delta", text: delta }),
      onTool: (label) => e.sender.send(channel, { type: "tool", label }),
    });
  });

  ipcMain.handle("jarvis:reset", async () => {
    brain?.reset();
  });

  ipcMain.handle("jarvis:status", async () => ({
    hasApiKey: Boolean(process.env.ANTHROPIC_API_KEY),
    googleConfigured: google.isConfigured(),
    sttConfigured: stt.isConfigured(),
    userName: process.env.JARVIS_USER_NAME || "",
  }));

  ipcMain.handle("jarvis:transcribe", async (_e, bytes: ArrayBuffer, mimeType: string) => {
    try {
      return { text: await stt.transcribe(bytes, mimeType) };
    } catch (err: any) {
      return { text: "", error: err?.message ?? String(err) };
    }
  });

  ipcMain.handle("jarvis:save-keys", async (_e, keys: { anthropic?: string; openai?: string }) => {
    const s = store.read<Settings>("settings", {});
    if (keys.anthropic !== undefined) s.anthropicApiKey = keys.anthropic.trim() || undefined;
    if (keys.openai !== undefined) s.openaiApiKey = keys.openai.trim() || undefined;
    store.write("settings", s);
    // Apply immediately so no restart is needed.
    if (s.anthropicApiKey) process.env.ANTHROPIC_API_KEY = s.anthropicApiKey;
    if (s.openaiApiKey && !process.env.STT_API_KEY) process.env.OPENAI_API_KEY = s.openaiApiKey;
    brain = null; // rebuild the Anthropic client with the new key on next ask
    return { hasApiKey: Boolean(process.env.ANTHROPIC_API_KEY), sttConfigured: stt.isConfigured() };
  });
}

app.whenReady().then(() => {
  // Allow the renderer to use the microphone (getUserMedia). Only 'media' is
  // granted; everything else is denied.
  session.defaultSession.setPermissionRequestHandler((_wc, permission, callback) => {
    callback(permission === "media");
  });

  applyStoredKeys();
  registerIpc();
  createWindow();

  // When a reminder comes due, speak it aloud in the renderer too.
  stopScheduler = startReminderScheduler((r) => {
    mainWindow?.webContents.send("jarvis:speak", `Reminder: ${r.text}`);
  });

  // Push live telemetry to the dashboard every couple of seconds.
  const pushStats = () => mainWindow?.webContents.send("jarvis:stats", sampleTelemetry());
  telemetryTimer = setInterval(pushStats, 2000);
  setTimeout(pushStats, 400); // one quick sample after the UI loads

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  stopScheduler?.();
  if (telemetryTimer) clearInterval(telemetryTimer);
  if (process.platform !== "darwin") app.quit();
});
