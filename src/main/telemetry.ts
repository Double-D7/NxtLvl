// Live system telemetry for the JARVIS dashboard. Pure Node `os` — no external
// calls. Sampled and pushed to the renderer on an interval.
import * as os from "os";
import { summary as reminderSummary } from "./tools/reminders";

export interface Telemetry {
  cpu: number; // 0..100 percent, averaged across cores
  memUsed: number; // 0..100 percent
  memGb: number; // used GB
  memTotalGb: number;
  uptime: number; // process uptime seconds
  hostname: string;
  platform: string;
  time: string; // ISO
  reminders: { pending: number; next: string | null; nextAt: string | null };
}

let prevIdle = 0;
let prevTotal = 0;

function cpuPercent(): number {
  const cpus = os.cpus();
  let idle = 0;
  let total = 0;
  for (const c of cpus) {
    for (const t of Object.values(c.times)) total += t;
    idle += c.times.idle;
  }
  const idleDelta = idle - prevIdle;
  const totalDelta = total - prevTotal;
  prevIdle = idle;
  prevTotal = total;
  if (totalDelta <= 0) return 0;
  const usage = 100 * (1 - idleDelta / totalDelta);
  return Math.max(0, Math.min(100, Math.round(usage)));
}

export function sample(): Telemetry {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  return {
    cpu: cpuPercent(),
    memUsed: Math.round((usedMem / totalMem) * 100),
    memGb: +(usedMem / 1024 ** 3).toFixed(1),
    memTotalGb: +(totalMem / 1024 ** 3).toFixed(1),
    uptime: Math.round(process.uptime()),
    hostname: os.hostname(),
    platform: `${os.type()} ${os.release()}`,
    time: new Date().toISOString(),
    reminders: reminderSummary(),
  };
}
