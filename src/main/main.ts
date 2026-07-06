import { app, BrowserWindow, ipcMain, session } from "electron";
import * as path from "path";
import * as dotenv from "dotenv";

// Load .env from the project root (works in dev; in a packaged app the user
// can place a .env next to the executable).
dotenv.config({ path: path.join(app.getAppPath(), ".env") });

import { Brain } from "./brain";
import { startReminderScheduler } from "./tools/reminders";
import * as google from "./google";
import * as stt from "./stt";

let mainWindow: BrowserWindow | null = null;
let brain: Brain | null = null;
let stopScheduler: (() => void) | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 460,
    height: 720,
    minWidth: 380,
    minHeight: 560,
    title: "Jarvis",
    backgroundColor: "#0b0f1a",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
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
}

app.whenReady().then(() => {
  // Allow the renderer to use the microphone (getUserMedia). Only 'media' is
  // granted; everything else is denied.
  session.defaultSession.setPermissionRequestHandler((_wc, permission, callback) => {
    callback(permission === "media");
  });

  registerIpc();
  createWindow();

  // When a reminder comes due, speak it aloud in the renderer too.
  stopScheduler = startReminderScheduler((r) => {
    mainWindow?.webContents.send("jarvis:speak", `Reminder: ${r.text}`);
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  stopScheduler?.();
  if (process.platform !== "darwin") app.quit();
});
