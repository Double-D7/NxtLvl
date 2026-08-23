/* Show Team — team-document merge tests.  Run:  node tests/merge.test.mjs
   Covers the conflict cases the cloud sync must survive: two people adding
   different records offline, the same record edited on both sides, config
   objects, and preservation of records that exist on only one side. */
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const M = require('../merge.js');

let pass = 0, fail = 0;
const ok = (n, c) => c ? pass++ : (fail++, console.error('  ✗ ' + n));
const eq = (n, a, b) => ok(n + `  (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`, JSON.stringify(a) === JSON.stringify(b));
const ids = arr => arr.map(r => r.id).sort();

const base = () => ({ version: 2, updatedAt: '2026-08-20T00:00:00Z', currentUserId: 'u1',
  team: { name: 'Devitt' }, settings: { plan: { tolLb: 8 } }, notifPrefs: {}, milestones: {}, alertAcks: {}, fedLog: {},
  users: [{ id: 'u1', name: 'David' }], animals: [{ id: 'a1', name: 'Batman', updatedAt: '2026-08-10T00:00:00Z' }],
  weights: [{ id: 'w1', animalId: 'a1', weight: 200, updatedAt: '2026-08-10T00:00:00Z' }] });

/* ---- two people add DIFFERENT weigh-ins offline → both survive ---- */
let mine = base(); mine.weights = mine.weights.concat([{ id: 'wA', animalId: 'a1', weight: 210, updatedAt: '2026-08-21T09:00:00Z' }]); mine.updatedAt = '2026-08-21T09:00:00Z';
let theirs = base(); theirs.weights = theirs.weights.concat([{ id: 'wB', animalId: 'a1', weight: 208, updatedAt: '2026-08-21T08:00:00Z' }]); theirs.updatedAt = '2026-08-21T08:00:00Z';
let m = M.mergeTeamDocs(mine, theirs);
eq('both offline weigh-ins preserved', ids(m.weights), ['w1', 'wA', 'wB']);

/* ---- same record edited on both sides → newer updatedAt wins ---- */
mine = base(); mine.weights = [{ id: 'w1', animalId: 'a1', weight: 205, updatedAt: '2026-08-22T10:00:00Z' }];
theirs = base(); theirs.weights = [{ id: 'w1', animalId: 'a1', weight: 199, updatedAt: '2026-08-21T10:00:00Z' }];
m = M.mergeTeamDocs(mine, theirs);
eq('same-id conflict keeps newer', m.weights.find(w => w.id === 'w1').weight, 205);
theirs.weights[0].updatedAt = '2026-08-23T10:00:00Z';
m = M.mergeTeamDocs(mine, theirs);
eq('same-id conflict keeps newer (other side)', m.weights.find(w => w.id === 'w1').weight, 199);

/* ---- a record only on the remote side is preserved (not dropped) ---- */
mine = base();
theirs = base(); theirs.animals = theirs.animals.concat([{ id: 'a2', name: 'Brutus', updatedAt: '2026-08-19T00:00:00Z' }]);
m = M.mergeTeamDocs(mine, theirs);
eq('remote-only record preserved', ids(m.animals), ['a1', 'a2']);

/* ---- currentUserId always stays local ---- */
mine = base(); mine.currentUserId = 'u1';
theirs = base(); theirs.currentUserId = 'u2';
m = M.mergeTeamDocs(mine, theirs);
eq('currentUserId stays local', m.currentUserId, 'u1');

/* ---- config object: newer document wins on key conflict ---- */
mine = base(); mine.team = { name: 'Devitt Show Team' }; mine.updatedAt = '2026-08-21T00:00:00Z';
theirs = base(); theirs.team = { name: 'Old Name', subtitle: 'x' }; theirs.updatedAt = '2026-08-19T00:00:00Z';
m = M.mergeTeamDocs(mine, theirs);
eq('newer doc wins team name', m.team.name, 'Devitt Show Team');
eq('but non-conflicting remote key kept', m.team.subtitle, 'x');

/* ---- map objects unioned (fedLog from both sides) ---- */
mine = base(); mine.fedLog = { 'a1|2026-08-23|AM': { by: 'u1' } };
theirs = base(); theirs.fedLog = { 'a1|2026-08-23|PM': { by: 'u2' } };
m = M.mergeTeamDocs(mine, theirs);
eq('fedLog unioned', Object.keys(m.fedLog).sort(), ['a1|2026-08-23|AM', 'a1|2026-08-23|PM']);

/* ---- null-safety ---- */
eq('null mine → theirs', M.mergeTeamDocs(null, theirs) === theirs, true);
eq('null theirs → mine', M.mergeTeamDocs(mine, null) === mine, true);

/* ---- mergeArray drops nothing and de-dupes by id ---- */
eq('mergeArray union de-dupes', ids(M.mergeArray([{ id: 'x' }, { id: 'y' }], [{ id: 'y' }, { id: 'z' }])), ['x', 'y', 'z']);

console.log(`\nmerge.test: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
