// A tiny JSON-file-backed key/value store. Persists Jarvis's data (reminders,
// Google tokens, etc.) in Electron's per-user `userData` directory so it
// survives restarts. No external database needed.
import { app } from "electron";
import * as fs from "fs";
import * as path from "path";

function dataDir(): string {
  // Falls back to cwd when running outside Electron (e.g. unit checks).
  const base = app?.getPath ? app.getPath("userData") : process.cwd();
  const dir = path.join(base, "jarvis-data");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function fileFor(key: string): string {
  return path.join(dataDir(), `${key}.json`);
}

export function read<T>(key: string, fallback: T): T {
  try {
    const raw = fs.readFileSync(fileFor(key), "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function write<T>(key: string, value: T): void {
  const tmp = fileFor(key) + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(value, null, 2), "utf8");
  fs.renameSync(tmp, fileFor(key)); // atomic-ish replace
}
