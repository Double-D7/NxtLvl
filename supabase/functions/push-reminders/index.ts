// Devitt Family Show Team — scheduled push reminders (Supabase Edge Function)
//
// Runs on a schedule (see supabase/PUSH_SETUP.md). For every team it reads the
// team's JSON dataset, works out what's due today (weigh-ins, upcoming shows &
// deadlines, health follow-ups / withdrawals, tasks), and sends ONE tidy
// "Today in the barn" push per device — honouring each device's notify prefs.
//
// Secrets required (supabase secrets set ...):
//   VAPID_PUBLIC_KEY   — same key as config.js `vapidPublicKey`
//   VAPID_PRIVATE_KEY  — the matching private key (never commit this)
//   VAPID_SUBJECT      — a mailto: or https: contact URL (e.g. mailto:you@you.com)
// Provided automatically by Supabase: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const VAPID_PUBLIC = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") || "mailto:notify@example.com";

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);

const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

const dayISO = (d: Date) => d.toISOString().slice(0, 10);
const daysBetween = (a: string, b: string) =>
  Math.round((Date.parse(b + "T00:00:00Z") - Date.parse(a + "T00:00:00Z")) / 86400000);

// Build the reminder lines for one team, filtered to what a device wants.
function linesForTeam(data: any, prefs: Record<string, boolean>): string[] {
  const today = dayISO(new Date());
  const out: string[] = [];
  const animals = (data.animals || []).filter((a: any) => !a.archived);
  const weights = data.weights || [];
  const latest: Record<string, string> = {};
  for (const w of weights) {
    if (!latest[w.animalId] || w.date > latest[w.animalId]) latest[w.animalId] = w.date;
  }

  if (prefs.weightDue !== false) {
    const due = animals.filter((a: any) => {
      const d = latest[a.id];
      return !d || daysBetween(d, today) >= 7;
    }).length;
    if (due > 0) out.push(`⚖️ ${due} animal${due === 1 ? "" : "s"} due for a weigh-in`);
  }

  if (prefs.upcomingShow !== false) {
    for (const s of data.shows || []) {
      if (s.start) {
        const n = daysBetween(today, s.start);
        if (n >= 0 && n <= 3) out.push(`🏆 ${s.name || "Show"} ${n === 0 ? "is today" : n === 1 ? "is tomorrow" : `in ${n} days`}`);
      }
      if (s.entryDeadline) {
        const n = daysBetween(today, s.entryDeadline);
        if (n >= 0 && n <= 3) out.push(`⏰ Entry deadline ${n === 0 ? "today" : n === 1 ? "tomorrow" : `in ${n} days`} · ${s.name || "show"}`);
      }
    }
  }

  if (prefs.health !== false) {
    for (const h of data.health || []) {
      const a = animals.find((x: any) => x.id === h.animalId);
      const nm = a ? a.name : "";
      if (h.withdrawal) { const n = daysBetween(today, h.withdrawal); if (n === 0 || n === 1) out.push(`💊 ${nm} withdrawal ends ${n === 0 ? "today" : "tomorrow"}`); }
      if (h.followup && h.followup === today) out.push(`🩺 ${nm} health follow-up today`);
    }
  }

  if (prefs.mentions !== false) {
    const tasks = (data.tasks || []).filter((t: any) => {
      if (!t.date || t.date > today) return false;
      const ids = t.animalIds || (t.animalId ? [t.animalId] : []);
      if (ids.length) { const p = (t.progress && t.progress[today]) || []; return !ids.every((id: string) => p.includes(id)); }
      return t.recur ? !((t.doneDates || []).includes(today)) : !t.done;
    }).length;
    if (tasks > 0) out.push(`✅ ${tasks} task${tasks === 1 ? "" : "s"} due`);
  }

  // Active-layover care items still open for today
  const lay = (data.layovers || []).find((l: any) => l.start <= today && (!l.end || l.end >= today));
  if (lay) {
    const open = (data.care || []).filter((c: any) => c.layoverId === lay.id && c.date === today && !c.done).length;
    if (open > 0) out.push(`🏠 ${open} layover care item${open === 1 ? "" : "s"} to do (${lay.name || "layover"})`);
  }

  return out;
}

async function sendTo(sub: any, payload: object): Promise<boolean> {
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify(payload),
    );
    return true;
  } catch (e: any) {
    const code = e?.statusCode;
    if (code === 404 || code === 410) {
      // subscription is gone — clean it up
      await admin.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
    } else {
      console.error("push send failed", code, e?.body || e?.message);
    }
    return false;
  }
}

Deno.serve(async () => {
  const { data: teams, error: te } = await admin.from("teams").select("id,data");
  if (te) return new Response(JSON.stringify({ error: te.message }), { status: 500 });

  let sent = 0, considered = 0;
  for (const team of teams || []) {
    const { data: subs } = await admin.from("push_subscriptions").select("*").eq("team_id", team.id);
    if (!subs || !subs.length) continue;
    for (const sub of subs) {
      considered++;
      const lines = linesForTeam(team.data || {}, sub.prefs || {});
      if (!lines.length) continue;
      const payload = {
        title: "Today in the barn",
        body: lines.join("\n"),
        tag: "dfst-daily",
        data: { url: "./#/dashboard" },
      };
      if (await sendTo(sub, payload)) sent++;
    }
  }
  return new Response(JSON.stringify({ ok: true, considered, sent }), {
    headers: { "content-type": "application/json" },
  });
});
