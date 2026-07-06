// Headless integration test of Jarvis's main-process logic.
// Stubs ONLY the external boundaries — Electron and the Anthropic SDK — so the
// real compiled Brain, tool-use loop, reminders store, scheduler, and telemetry
// all execute for real against a temp data dir.

const Module = require("module");
const os = require("os");
const fs = require("fs");
const path = require("path");

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "jarvis-test-"));

// ── Stub: electron ────────────────────────────────────────────────────
const notifications = [];
const electronStub = {
  app: { getPath: () => TMP },
  Notification: class {
    static isSupported() { return true; }
    constructor(opts) { this.opts = opts; }
    show() { notifications.push(this.opts); }
  },
  shell: { openExternal: async () => {} },
};

// ── Stub: Anthropic SDK — drives a scripted tool-use conversation ──────
const future = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
let call = 0;
const script = [
  { stop_reason: "tool_use", content: [
    { type: "text", text: "Let me check the time." },
    { type: "tool_use", id: "t1", name: "get_current_datetime", input: {} },
  ] },
  { stop_reason: "tool_use", content: [
    { type: "tool_use", id: "t2", name: "add_reminder",
      input: { text: "Call the dentist", due_at: future } },
  ] },
  { stop_reason: "end_turn", content: [
    { type: "text", text: "Done. I'll remind you to call the dentist." },
  ] },
];
class AnthropicStub {
  constructor() {
    this.messages = {
      stream: () => {
        const msg = script[call++] || script[script.length - 1];
        let textCb = null;
        return {
          on: (ev, cb) => { if (ev === "text") textCb = cb; },
          finalMessage: async () => {
            const text = msg.content.filter((b) => b.type === "text").map((b) => b.text).join(" ");
            if (textCb && text) for (const w of text.split(" ")) textCb(w + " ");
            return msg;
          },
        };
      },
    };
  }
}

const origLoad = Module._load;
Module._load = function (request) {
  if (request === "electron") return electronStub;
  if (request === "@anthropic-ai/sdk") return { __esModule: true, default: AnthropicStub };
  return origLoad.apply(this, arguments);
};

process.env.ANTHROPIC_API_KEY = "test-key";
process.env.JARVIS_USER_NAME = "David";

// ── Test harness ──────────────────────────────────────────────────────
let pass = 0, fail = 0;
function check(name, cond, detail) {
  if (cond) { console.log(`  ✓ ${name}`); pass++; }
  else { console.log(`  ✗ ${name}${detail ? "  — " + detail : ""}`); fail++; }
}

const D = (p) => path.join(__dirname, "..", "dist", p);

(async () => {
  console.log("\n▶ Brain tool-use loop (streaming + real tools + store)");
  const { Brain } = require(D("main/brain.js"));
  const brain = new Brain();
  const deltas = [];
  const reply = await brain.ask("Remind me to call the dentist tomorrow at 3pm",
    { onDelta: (d) => deltas.push(d), onTool: () => {} });
  check("returns a spoken reply", !!reply.text && !reply.error, JSON.stringify(reply));
  check("streamed text deltas fired", deltas.length > 0, `${deltas.length} deltas`);
  check("reported the tools it used", reply.toolsUsed.length >= 2, reply.toolsUsed.join(","));
  check("used the datetime + reminder tools",
    reply.toolsUsed.some((t) => /time/i.test(t)) && reply.toolsUsed.some((t) => /reminder/i.test(t)),
    reply.toolsUsed.join(","));

  console.log("\n▶ Reminders persisted to disk");
  const reminders = require(D("main/tools/reminders.js"));
  const listed = await reminders.listRemindersTool.run({});
  check("dentist reminder is stored", /dentist/i.test(listed), listed);
  const sum = reminders.summary();
  check("summary counts it as pending", sum.pending >= 1, JSON.stringify(sum));
  check("summary surfaces it as next", /dentist/i.test(sum.next || ""), JSON.stringify(sum));

  console.log("\n▶ Reminder CRUD");
  const idMatch = listed.match(/\[(\w+)\]/);
  const id = idMatch && idMatch[1];
  const doneMsg = await reminders.completeReminderTool.run({ id });
  check("complete marks it done", /done/i.test(doneMsg), doneMsg);
  const afterDone = await reminders.listRemindersTool.run({});
  check("completed item hidden from default list", !/dentist/i.test(afterDone), afterDone);
  const add2 = await reminders.addReminderTool.run({ text: "Undated task" });
  check("can add an undated task", /created/i.test(add2), add2);

  console.log("\n▶ Due-reminder scheduler + notification");
  await reminders.addReminderTool.run({
    text: "Overdue item", due_at: new Date(Date.now() - 60000).toISOString(),
  });
  const before = notifications.length;
  let spoken = null;
  const stop = reminders.startReminderScheduler((r) => (spoken = r.text));
  check("fires a desktop notification when due", notifications.length > before,
    `${notifications.length - before} shown`);
  check("passes the due item to the speak callback", spoken === "Overdue item", String(spoken));
  stop();
  const secondPass = notifications.length;
  reminders.startReminderScheduler(() => {})();
  check("does not re-notify an already-notified reminder", notifications.length === secondPass);

  console.log("\n▶ Telemetry");
  const telemetry = require(D("main/telemetry.js"));
  telemetry.sample(); // prime CPU delta
  const t = telemetry.sample();
  check("cpu is a 0–100 number", typeof t.cpu === "number" && t.cpu >= 0 && t.cpu <= 100, String(t.cpu));
  check("memory reported in GB", t.memGb > 0 && t.memTotalGb >= t.memGb, `${t.memGb}/${t.memTotalGb}`);
  check("uptime present", typeof t.uptime === "number", String(t.uptime));
  check("reminders summary embedded", typeof t.reminders.pending === "number");

  console.log("\n▶ Datetime tool");
  const { datetimeTool } = require(D("main/tools/datetime.js"));
  const dt = JSON.parse(await datetimeTool.run());
  check("returns iso + timezone + weekday", !!dt.iso && !!dt.timezone && !!dt.weekday, JSON.stringify(dt));

  console.log("\n▶ STT guard (unconfigured)");
  const stt = require(D("main/stt.js"));
  delete process.env.OPENAI_API_KEY; delete process.env.STT_API_KEY;
  check("reports not configured without a key", stt.isConfigured() === false);
  let threw = false;
  try { await stt.transcribe(new ArrayBuffer(8), "audio/webm"); } catch { threw = true; }
  check("transcribe throws a helpful error when unconfigured", threw);

  console.log("\n▶ Renderer pure logic (wake word / voice / TTS chunking)");
  const WAKE = /(?:^|\b)(?:hey[,\s]+|ok[,\s]+|hi[,\s]+)?jarvis\b[\s,.!?]*/i;
  const strip = (s) => { const m = s.match(WAKE); return m ? s.slice((m.index ?? 0) + m[0].length).trim() : null; };
  check('"hey jarvis, what\'s next" → command', strip("hey jarvis, what's next") === "what's next");
  check('bare "hey jarvis" → empty (prompts Yes?)', strip("hey jarvis") === "");
  check('"good morning" → ignored', strip("good morning") === null);

  const score = (v) => { const n = v.name.toLowerCase(), l = v.lang.toLowerCase();
    let s = 0; if (/(david|mark|george|ryan|daniel)/.test(n)) s += 5;
    if (l.startsWith("en-gb")) s += 3; else if (l.startsWith("en-us")) s += 2; return s; };
  const voices = [
    { name: "Microsoft David", lang: "en-US" }, { name: "Microsoft George", lang: "en-GB" },
    { name: "Microsoft Zira", lang: "en-US" }];
  const best = [...voices].sort((a, b) => score(b) - score(a))[0].name;
  check("prefers British male voice (George)", best === "Microsoft George", best);

  let buf = ""; const spokenChunks = [];
  const pushTTS = (d) => { buf += d; const m = buf.match(/^[\s\S]*[.!?\n](?=\s|$)/);
    if (m) { spokenChunks.push(m[0].trim()); buf = buf.slice(m[0].length); } };
  ["You ", "have ", "two ", "meetings. ", "First ", "at ", "ten."].forEach(pushTTS);
  if (buf.trim()) spokenChunks.push(buf.trim());
  check("speaks first sentence before reply finishes", spokenChunks[0] === "You have two meetings.",
    JSON.stringify(spokenChunks));

  console.log(`\n${"═".repeat(48)}`);
  console.log(`  RESULT: ${pass} passed, ${fail} failed`);
  console.log(`${"═".repeat(48)}\n`);
  fs.rmSync(TMP, { recursive: true, force: true });
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error("Test harness crashed:", e); process.exit(2); });
