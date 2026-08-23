/* Show Team — calculation core tests.  Run:  node tests/calc.test.mjs
   Pure, dependency-free. Exercises the edge cases that break naive ADG /
   target / cost math: same-day weights, missing/edited/backdated/deleted
   weights, feed-program boundaries, timezone boundaries, future & past
   target dates. */
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const C = require('../calc.js');

let pass = 0, fail = 0;
const approx = (a, b, e = 1e-9) => a != null && b != null && Math.abs(a - b) <= e;
function ok(name, cond) { if (cond) { pass++; } else { fail++; console.error('  ✗ ' + name); } }
function eq(name, a, b) { ok(name + `  (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`, JSON.stringify(a) === JSON.stringify(b)); }
function near(name, a, b) { ok(name + `  (got ${a}, want ~${b})`, approx(a, b, 1e-6)); }

/* ---------- daysBetween / tz ---------- */
eq('daysBetween forward', C.daysBetween('2026-08-01', '2026-08-08'), 7);
eq('daysBetween backward is negative', C.daysBetween('2026-08-08', '2026-08-01'), -7);
eq('daysBetween same day', C.daysBetween('2026-08-08', '2026-08-08'), 0);
eq('daysBetween invalid → null', C.daysBetween('nope', '2026-08-08'), null);
// timezone boundary: date-only strings must not drift across DST/UTC edges
eq('tz: spring-forward boundary', C.daysBetween('2026-03-08', '2026-03-09'), 1);
eq('tz: year boundary', C.daysBetween('2025-12-31', '2026-01-01'), 1);

/* ---------- lastWeighAdg ---------- */
near('lastWeighAdg basic', C.lastWeighAdg([{ date: '2026-08-01', weight: 200 }, { date: '2026-08-08', weight: 214 }]).adg, 2);
eq('lastWeighAdg one weight → null', C.lastWeighAdg([{ date: '2026-08-01', weight: 200 }]), null);
eq('lastWeighAdg empty → null', C.lastWeighAdg([]), null);
// same-day weights must never divide by zero → skip to the prior distinct day
eq('same-day only → null', C.lastWeighAdg([{ date: '2026-08-08', weight: 210 }, { date: '2026-08-08', weight: 212 }]), null);
near('same-day dupe ignored, uses prior distinct day',
  C.lastWeighAdg([{ date: '2026-08-01', weight: 200 }, { date: '2026-08-08', weight: 210 }, { date: '2026-08-08', weight: 214 }]).adg, 2);
// backdated / out-of-order input is sorted before computing
near('backdated rows sorted',
  C.lastWeighAdg([{ date: '2026-08-08', weight: 214 }, { date: '2026-08-01', weight: 200 }]).adg, 2);
// edited weight changes the result deterministically
near('edited weight reflected',
  C.lastWeighAdg([{ date: '2026-08-01', weight: 200 }, { date: '2026-08-08', weight: 221 }]).adg, 3);
// a bad/missing weight row is dropped, not crashed on
near('missing weight row dropped',
  C.lastWeighAdg([{ date: '2026-08-01', weight: 200 }, { date: '2026-08-05', weight: null }, { date: '2026-08-08', weight: 214 }]).adg, 2);

/* ---------- rollingAdg ---------- */
const series = [
  { date: '2026-07-01', weight: 150 },
  { date: '2026-07-15', weight: 172 },
  { date: '2026-08-01', weight: 200 },
  { date: '2026-08-08', weight: 214 },
];
near('rolling 7d', C.rollingAdg(series, '2026-08-08', 7), 2);           // 200→214 over 7d
// 14d window from Aug-08 starts Jul-25, so Jul-15 is excluded → only Aug-01 & Aug-08
near('rolling 14d excludes out-of-window point', C.rollingAdg(series, '2026-08-08', 14), 2);
eq('rolling window with <2 points → null (no manufacturing)',
  C.rollingAdg([{ date: '2026-08-08', weight: 214 }], '2026-08-08', 7), null);
eq('rolling with only one in-window point → null',
  C.rollingAdg(series, '2026-08-08', 3), null);

/* ---------- lifetimeAdg ---------- */
near('lifetimeAdg (rounded to 2dp)', C.lifetimeAdg(150, '2026-07-01', 214, '2026-08-08'), 1.68);
eq('lifetimeAdg zero span → null', C.lifetimeAdg(150, '2026-08-08', 160, '2026-08-08'), null);
eq('lifetimeAdg missing start → null', C.lifetimeAdg(null, '2026-07-01', 214, '2026-08-08'), null);

/* ---------- programAdg (feed-program boundary) ---------- */
// Program runs Aug 1–15; only in-range weigh-ins count. A weigh-in on Jul 20
// (before the program) and Aug 20 (after) must NOT leak into the gain/period.
const inRange = [{ date: '2026-08-02', weight: 205 }, { date: '2026-08-14', weight: 227 }];
const prog = C.programAdg(inRange);
near('programAdg uses only in-range span (rounded 2dp)', prog.adg, 1.83);
eq('programAdg weighCount', prog.weighCount, 2);
eq('programAdg insufficient → reason', C.programAdg([{ date: '2026-08-02', weight: 205 }]).reason, 'Not enough weight data');
eq('programAdg insufficient → adg null', C.programAdg([]).adg, null);
eq('programAdg same-day only → not enough', C.programAdg([{ date: '2026-08-02', weight: 205 }, { date: '2026-08-02', weight: 208 }]).adg, null);

/* ---------- requiredAdg / projectedWeight ---------- */
near('requiredAdg', C.requiredAdg(280, 315, '2026-08-23', '2026-09-02'), 3.5);
eq('requiredAdg past target → null', C.requiredAdg(280, 315, '2026-09-05', '2026-09-02'), null);
eq('requiredAdg target today → null (no days left)', C.requiredAdg(280, 315, '2026-09-02', '2026-09-02'), null);
eq('projectedWeight future', C.projectedWeight(280, 3.5, '2026-08-23', '2026-09-02'), 315);
eq('projectedWeight past date → current weight', C.projectedWeight(280, 3.5, '2026-09-05', '2026-09-02'), 280);
eq('projectedWeight no adg → null', C.projectedWeight(280, null, '2026-08-23', '2026-09-02'), null);

/* ---------- targetState (the "-29d to target" bug) ---------- */
eq('target future', C.targetState('2026-08-23', '2026-09-21').label, '29 days to target');
eq('target today', C.targetState('2026-09-21', '2026-09-21').label, 'Target today');
eq('target past → human, positive number', C.targetState('2026-10-20', '2026-09-21').label, '29 days past target');
eq('target 1 day singular', C.targetState('2026-08-23', '2026-08-24').label, '1 day to target');
eq('no target date → null', C.targetState('2026-08-23', ''), null);
eq('never renders a negative countdown', /-\d/.test(C.targetState('2026-10-20', '2026-09-21').label), false);

/* ---------- feedCostCompleteness ---------- */
eq('cost complete label', C.feedCostCompleteness(19.16, 0).label, 'Feed $19.16/day');
eq('cost complete note', C.feedCostCompleteness(19.16, 0).note, null);
eq('cost incomplete label', C.feedCostCompleteness(19.16, 3).label, 'Known feed cost: $19.16/day');
eq('cost incomplete note', C.feedCostCompleteness(19.16, 3).note, '3 ingredients still need pricing');
eq('cost incomplete singular', C.feedCostCompleteness(5, 1).note, '1 ingredient still needs pricing');
eq('costPerLbGain', C.costPerLbGain(320, 64), 5);
eq('costPerLbGain zero gain → null', C.costPerLbGain(320, 0), null);

/* ---------- planStatus ---------- */
const today = '2026-08-23';
eq('plan: no target → no_plan', C.planStatus({ curW: 280, targetW: null, targetD: null, todayISO: today }).state, 'no_plan');
eq('plan: past show → no_plan', C.planStatus({ curW: 280, startW: 60, startD: '2026-05-01', targetW: 315, targetD: '2026-08-01', todayISO: today }).state, 'no_plan');
eq('plan: no weight → insufficient', C.planStatus({ curW: null, targetW: 315, targetD: '2026-09-21', todayISO: today }).state, 'insufficient');
// on plan: projects into range
eq('plan: on plan', C.planStatus({ curW: 280, startW: 60, startD: '2026-04-01', targetW: 315, targetD: '2026-09-21', todayISO: today }).state, 'onplan');
// slightly behind: projects 8–20 lb under the low end (deterministic ADG)
eq('plan: slightly behind', C.planStatus({ curW: 300, targetW: 315, targetD: '2026-09-02', todayISO: today, adgForProjection: -0.5, thresholds: { tolLb: 8, criticalLb: 20 } }).state, 'slightly_behind'); // proj 295, low 307, gap 12
// needs attention: projects ≥20 lb under
eq('plan: needs attention', C.planStatus({ curW: 300, targetW: 315, targetD: '2026-09-02', todayISO: today, adgForProjection: -2 }).state, 'needs_attention'); // proj 280, gap 27
// ahead of pace but still inside the acceptable range
const ahead = C.planStatus({ curW: 310, startW: 60, startD: '2026-04-01', targetW: 315, targetD: '2026-12-01', todayISO: today, adgForProjection: 0, rangeLow: 305, rangeHigh: 325 });
ok('plan: ahead of pace, in range → ahead  (got ' + ahead.state + ')', ahead.state === 'ahead');
eq('plan: target today still evaluates (dLeft 0 is a live plan)',
  C.planStatus({ curW: 312, startW: 60, startD: '2026-04-01', targetW: 315, targetD: today, todayISO: today, rangeLow: 305, rangeHigh: 325 }).state,
  'onplan');

console.log(`\ncalc.test: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
