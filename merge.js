/* Show Team — conflict-safe team-document merge (STMerge)
   ------------------------------------------------------------------
   The cloud sync stores each team as ONE JSON document. A naive
   last-write-wins overwrite loses data when two people edit offline, or
   when a remote update arrives while you have unsynced local edits.
   mergeTeamDocs() reconciles two documents at the RECORD level:
     • record arrays (weights, feed, health, meds, …) are unioned by id;
       a record present on both sides keeps the newer updatedAt.
     • records that exist on only one side are PRESERVED (so two people's
       offline weigh-ins both survive — the spec's "prefer preserving both").
     • config objects (team, settings, notifPrefs) merge shallowly, the
       newer document winning on a key conflict.
     • map objects (milestones, alertAcks, fedLog) are unioned.
   No tombstones yet: a record deleted on one side while edited on the
   other is kept, not silently dropped — data-preserving on purpose.
   Pure (no DOM/DB); loaded before app.js in the browser (window.STMerge)
   and imported by tests/merge.test.mjs. */
(function (factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') window.STMerge = api;
})(function () {
  'use strict';

  // Record arrays keyed by `id`.
  const ARRAY_KEYS = ['users','animals','weights','feed','media','measurements','exercise',
    'health','meds','medLog','shows','entries','tasks','notes','expenses','income','relatives',
    'recs','activity','savedViews','shares','inventory','purchases','layovers','care','helpers',
    'events','bedding','evals','breeds'];
  // Shallow-merged config objects (newer document wins on key conflict).
  const CONFIG_KEYS = ['team','settings','notifPrefs'];
  // Unioned map objects (key → value).
  const MAP_KEYS = ['milestones','alertAcks','fedLog'];

  const t = r => (r && typeof r.updatedAt === 'string') ? r.updatedAt : '';
  const newerRec = (a, b) => (t(b) > t(a) ? b : a);

  function mergeArray(A, B) {
    A = Array.isArray(A) ? A : []; B = Array.isArray(B) ? B : [];
    const map = new Map(); const idless = [];
    for (const r of A) { if (r && r.id != null) map.set(r.id, r); else if (r) idless.push(r); }
    for (const r of B) { if (!r) continue; if (r.id == null) { idless.push(r); continue; }
      const cur = map.get(r.id); map.set(r.id, cur ? newerRec(cur, r) : r); }
    return [...map.values(), ...idless];
  }

  function mergeTeamDocs(mine, theirs) {
    if (!mine) return theirs || null;
    if (!theirs) return mine;
    const out = Object.assign({}, theirs, mine);   // base: local values win for anything not handled below
    const theirsNewer = t(theirs) > t(mine);        // doc-level recency

    for (const k of ARRAY_KEYS) out[k] = mergeArray(mine[k], theirs[k]);
    for (const k of CONFIG_KEYS) {
      const mv = mine[k] || {}, tv = theirs[k] || {};
      out[k] = theirsNewer ? Object.assign({}, mv, tv) : Object.assign({}, tv, mv);
    }
    for (const k of MAP_KEYS) out[k] = Object.assign({}, theirs[k] || {}, mine[k] || {});

    out.currentUserId = mine.currentUserId || theirs.currentUserId || null;
    out.version = Math.max(+mine.version || 2, +theirs.version || 2);
    out.updatedAt = t(mine) > t(theirs) ? t(mine) : t(theirs);
    return out;
  }

  return { mergeTeamDocs, mergeArray, ARRAY_KEYS, CONFIG_KEYS, MAP_KEYS };
});
