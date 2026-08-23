/* Show Team — pure calculation core (STCalc)
   ------------------------------------------------------------------
   THE single authoritative source for every derived number in the app.
   Rules:
     • No DOM, no DB, no globals. Inputs are primitives/arrays; outputs are
       numbers or small {value,label,state} objects.
     • Never manufacture a value from insufficient data — return null and let
       the caller show "Not enough data" / a CTA.
     • Dates are date-only ISO strings ('YYYY-MM-DD'); comparisons are tz-safe.
   Loaded before app.js in the browser (window.STCalc) and imported directly
   by the Node test suite (tests/calc.test.mjs) — so the math is tested in
   isolation from the UI. DB-aware wrappers live in app.js (the `Calc` object)
   and delegate here. */
(function (factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;   // Node / tests
  if (typeof window !== 'undefined') window.STCalc = api;                       // browser
})(function () {
  'use strict';
  const DAY = 86400000;

  const isISO = s => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}/.test(s);
  const parseD = s => isISO(s) ? new Date(s.slice(0, 10) + 'T00:00:00') : (s instanceof Date ? s : null);
  const num = n => (n == null || n === '' || !isFinite(+n)) ? null : +n;
  const round = (n, d = 2) => { if (n == null || !isFinite(n)) return null; const f = 10 ** d; return Math.round(n * f) / f; };

  // signed whole days from a → b  (b − a); null if either date is invalid
  function daysBetween(a, b) { const x = parseD(a), y = parseD(b); if (!x || !y) return null; return Math.round((y - x) / DAY); }

  // Normalize + sort a weigh-in list; drops rows with a bad date or weight.
  function normWeights(ws) {
    return (ws || [])
      .filter(w => w && isISO(w.date) && num(w.weight) != null)
      .map(w => ({ date: w.date.slice(0, 10), weight: +w.weight }))
      .sort((p, q) => p.date < q.date ? -1 : p.date > q.date ? 1 : 0);
  }

  /* ---- ADG variants (each with explicit, documented semantics) ---- */

  // Between the last two DISTINCT-day weigh-ins. null if <2 distinct days.
  function lastWeighAdg(ws) {
    const s = normWeights(ws); if (s.length < 2) return null;
    const last = s[s.length - 1]; let prev = null;
    for (let i = s.length - 2; i >= 0; i--) { if (s[i].date !== last.date) { prev = s[i]; break; } }
    if (!prev) return null;
    const d = daysBetween(prev.date, last.date); if (!(d > 0)) return null;
    return { adg: round((last.weight - prev.weight) / d), gain: round(last.weight - prev.weight, 1), days: d, from: prev, to: last };
  }

  // Trailing-window rolling ADG ending at `asOf`. Requires ≥2 weigh-ins that
  // actually fall inside the window and span >0 days — else null (no guessing).
  function rollingAdg(ws, asOf, windowDays) {
    const s = normWeights(ws); if (s.length < 2 || !windowDays) return null;
    const end = parseD(asOf); if (!end) return null;
    const startISO = new Date(end.getTime() - windowDays * DAY).toISOString().slice(0, 10);
    const win = s.filter(w => w.date >= startISO && daysBetween(w.date, asOf) >= 0);
    if (win.length < 2) return null;
    const a = win[0], b = win[win.length - 1]; const d = daysBetween(a.date, b.date);
    if (!(d > 0)) return null;
    return round((b.weight - a.weight) / d);
  }

  // Lifetime ADG from an explicit start point to the current weight.
  function lifetimeAdg(startW, startD, curW, curD) {
    startW = num(startW); curW = num(curW); if (startW == null || curW == null) return null;
    const d = daysBetween(startD, curD); if (!(d > 0)) return null;
    return round((curW - startW) / d);
  }

  // Feed-program ADG: caller passes ONLY the weigh-ins that fall within the
  // program's effective window. Never divides a gain by an unrelated period.
  function programAdg(weightsInRange) {
    const s = normWeights(weightsInRange);
    if (s.length < 2) return { adg: null, gain: null, days: null, weighCount: s.length, reason: 'Not enough weight data' };
    const a = s[0], b = s[s.length - 1]; const d = daysBetween(a.date, b.date);
    if (!(d > 0)) return { adg: null, gain: null, days: 0, weighCount: s.length, reason: 'Not enough weight data' };
    return { adg: round((b.weight - a.weight) / d), gain: round(b.weight - a.weight, 1), days: d, weighCount: s.length, reason: null };
  }

  /* ---- Targets & projection ---- */

  // ADG still required to reach target by the target date. null if no days left.
  function requiredAdg(curW, targetW, curD, targetD) {
    curW = num(curW); targetW = num(targetW); if (curW == null || targetW == null) return null;
    const d = daysBetween(curD, targetD); if (!(d > 0)) return null;
    return round((targetW - curW) / d);
  }

  // Projected weight on the target date at a given ADG.
  function projectedWeight(curW, adg, curD, targetD) {
    curW = num(curW); adg = num(adg); if (curW == null || adg == null) return null;
    const d = daysBetween(curD, targetD); if (d == null) return null;
    if (d <= 0) return Math.round(curW);
    return Math.round(curW + adg * d);
  }

  // Human-readable target countdown. null when there's no valid target date,
  // so callers can render a "set a Game Plan" CTA instead of a bogus number.
  function targetState(todayISO, targetISO) {
    if (!isISO(targetISO)) return null;
    const d = daysBetween(todayISO, targetISO); if (d == null) return null;
    if (d > 0) return { days: d, state: 'future', label: `${d} day${d === 1 ? '' : 's'} to target` };
    if (d === 0) return { days: 0, state: 'today', label: 'Target today' };
    const n = -d; return { days: d, state: 'past', label: `${n} day${n === 1 ? '' : 's'} past target` };
  }

  /* ---- Cost completeness (never imply certainty that isn't there) ---- */

  function feedCostCompleteness(knownCostPerDay, uncostedCount) {
    const c = round(+knownCostPerDay || 0, 2), u = uncostedCount || 0;
    return {
      knownCostPerDay: c, uncostedCount: u, complete: u === 0,
      label: u === 0 ? `Feed $${c.toFixed(2)}/day` : `Known feed cost: $${c.toFixed(2)}/day`,
      note: u === 0 ? null : `${u} ingredient${u === 1 ? ' still needs' : 's still need'} pricing`
    };
  }

  function costPerLbGain(totalCost, gainLb) {
    gainLb = num(gainLb); if (gainLb == null || !(gainLb > 0)) return null;
    return round((+totalCost || 0) / gainLb, 2);
  }

  /* ---- Plan status: "is this animal on plan?" (not "who's gaining fastest") ----
     states: ahead | onplan | slightly_behind | needs_attention | no_plan | insufficient
     Thresholds (lb) are configurable; sensible defaults below. */
  const PLAN_DEFAULTS = { tolLb: 8, criticalLb: 20, aheadPaceLb: 8 };

  function planStatus(o) {
    o = o || {};
    const th = Object.assign({}, PLAN_DEFAULTS, o.thresholds || {});
    const curW = num(o.curW), startW = num(o.startW), targetW = num(o.targetW);
    const { startD, targetD, todayISO } = o;

    if (targetW == null || !isISO(targetD)) return { state: 'no_plan', label: 'No plan set' };
    const dLeft = daysBetween(todayISO, targetD);
    if (dLeft != null && dLeft < 0) return { state: 'no_plan', label: 'Show passed' };
    if (curW == null) return { state: 'insufficient', label: 'Insufficient data' };

    const adg = o.adgForProjection != null ? num(o.adgForProjection) : lifetimeAdg(startW, startD, curW, todayISO);
    const proj = projectedWeight(curW, adg, todayISO, targetD);
    if (proj == null) return { state: 'insufficient', label: 'Insufficient data' };

    const low = o.rangeLow != null ? num(o.rangeLow) : targetW - th.tolLb;
    const high = o.rangeHigh != null ? num(o.rangeHigh) : targetW + th.tolLb;

    // straight-line pace: where should it be today?
    let paceDelta = null;
    if (startW != null && isISO(startD)) {
      const total = daysBetween(startD, targetD), elapsed = daysBetween(startD, todayISO);
      if (total > 0) { const frac = Math.max(0, Math.min(1, elapsed / total)); paceDelta = Math.round(curW - (startW + (targetW - startW) * frac)); }
    }

    if (proj < low) { const g = low - proj; if (g >= th.criticalLb) return { state: 'needs_attention', label: 'Needs attention' }; if (g >= th.tolLb) return { state: 'slightly_behind', label: 'Slightly behind' }; return { state: 'onplan', label: 'On plan' }; }
    if (proj > high) { const g = proj - high; if (g >= th.criticalLb) return { state: 'needs_attention', label: 'Needs attention' }; if (g >= th.tolLb) return { state: 'slightly_behind', label: 'Trending heavy' }; return { state: 'onplan', label: 'On plan' }; }
    // projected within the acceptable range
    if (paceDelta != null && paceDelta >= th.aheadPaceLb) return { state: 'ahead', label: 'Ahead of plan' };
    return { state: 'onplan', label: 'On plan' };
  }

  return {
    DAY, isISO, parseD, round, daysBetween, normWeights,
    lastWeighAdg, rollingAdg, lifetimeAdg, programAdg,
    requiredAdg, projectedWeight, targetState,
    feedCostCompleteness, costPerLbGain, planStatus, PLAN_DEFAULTS,
  };
});
