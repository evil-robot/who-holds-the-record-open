// Figure: how often each leading country is ranked first, for the published random seed and 15 other seeds of the same
// main-model simulation (analysis/robustness/seed_sweep.json). "First" counts ties: ranks are competition ranks on the
// rounded score, so tied countries share first place, and the lead-group rule (rank90 lower bound 1) is exactly a first
// share of at least 5%. A hollow ring shows the published seed's share of draws first alone (robustness.json soleFirstShare).
// Countries shown: every country in the lead group under any seed, or first in at least 2% of draws under any seed
// (the rule in seed_sweep.py), recomputed here and asserted equal to the sweep's list. Log scale, 1% to 60%.
const L = require('./fig_lib');
const { C, PAL, F, txt, line, circle, assert } = L;
const S = L.read('analysis/robustness/seed_sweep.json'), RB = L.read('analysis/robustness/robustness.json');
assert(S.meta.model === RB.meta.main, 'seed sweep model differs from the main model');
assert(S.meta.dataSha256 === RB.meta.data.dataSha256, 'seed sweep ran on other data');
const M = RB.monteCarlo[RB.meta.main].countries;
const pub = String(S.meta.publishedSeed), seeds = Object.keys(S.perSeed), others = seeds.filter(k => k !== pub);
assert(others.length === S.meta.otherSeeds.length && S.perSeed[pub], 'seed list mismatch');
const anyLead = new Set(Object.values(S.leadGroups).flat());
const sel = Object.keys(M).filter(k => anyLead.has(k) || seeds.some(sd => S.perSeed[sd][k] && S.perSeed[sd][k].firstShare >= 0.02)).sort();
assert(sel.join() === Object.keys(S.meta.names).sort().join(), `selection rule gives ${sel}, sweep lists ${Object.keys(S.meta.names)}`);
const ks = sel.sort((a, b) => S.perSeed[pub][b].firstShare - S.perSeed[pub][a].firstShare);
ks.forEach(k => { assert(Math.abs(S.perSeed[pub][k].firstShare - M[k].firstShare) < 1e-9, `published share differs for ${k}`); assert(M[k].soleFirstShare != null, `no soleFirstShare for ${k}`); });
const inLeadN = k => Object.values(S.leadGroups).filter(g => g.includes(k)).length, nSeeds = Object.keys(S.leadGroups).length;
const LW = 82, X0 = LW + 8, X1 = 480, lo = 0.01, hi = 0.6, x = v => X0 + (Math.log(Math.max(v, lo)) - Math.log(lo)) / (Math.log(hi) - Math.log(lo)) * (X1 - X0);
const RH = 20, TOP = 34, NAME = S.meta.names;
let s = '';
[0.01, 0.02, 0.05, 0.1, 0.2, 0.5].forEach(v => { s += line(x(v), TOP - 4, x(v), TOP + ks.length * RH, { stroke: C.grid, w: 0.5 });
  s += txt(x(v), TOP + ks.length * RH + 12, `${v * 100}%`, { size: F.xs, fill: C.muted, anchor: 'middle', mono: true }); });
s += line(x(0.05), TOP - 16, x(0.05), TOP + ks.length * RH, { stroke: PAL.lead, w: 0.9 });
s += txt(x(0.05) + 4, TOP - 20, 'first, or tied for first, in 5% of draws:', { size: F.s, fill: PAL.lead, weight: 600 });
s += txt(x(0.05) + 4, TOP - 8, 'the lead-group line', { size: F.s, fill: PAL.lead, weight: 600 });
ks.forEach((k, i) => { const y = TOP + 8 + i * RH, lead = S.summary[k].inPublishedLead;
  s += txt(0, y + 4, NAME[k], { size: F.m, fill: lead ? C.ink : C.muted, weight: lead ? 600 : 400 });
  const vals = others.map(sd => S.perSeed[sd][k].firstShare);
  s += line(x(Math.min(...vals)), y, x(Math.max(...vals)), y, { stroke: PAL.otherInterval, w: 0.6 });
  vals.forEach(v => { s += line(x(v), y - 3.5, x(v), y + 3.5, { stroke: PAL.otherInterval, w: 0.6 }); });
  const p = S.perSeed[pub][k].firstShare, so = M[k].soleFirstShare;
  s += line(x(p), y - 7, x(p), y + 7, { stroke: lead ? PAL.lead : C.body, w: 1.8, cap: 'round' });
  s += circle(x(so), y, 3, { fill: 'none', stroke: C.body, w: 0.9 });
  s += txt(X1 + 10, y + 4, `${(p * 100).toFixed(1)}%`, { size: F.s, fill: C.ink, mono: true });
  s += txt(X1 + 56, y + 4, `${(so * 100).toFixed(1)}%`, { size: F.s, fill: C.body, mono: true });
  s += txt(X1 + 104, y + 4, `${inLeadN(k)} of ${nSeeds}`, { size: F.s, fill: C.body, mono: true }); });
[[X1 + 10, 'first or', 'tied'], [X1 + 56, 'first', 'alone'], [X1 + 104, 'seeds with it', 'in lead group']].forEach(([xx, a, b]) => {
  s += txt(xx, TOP - 16, a, { size: F.xs, fill: C.muted }); s += txt(xx, TOP - 5, b, { size: F.xs, fill: C.muted }); });
const yk = TOP + ks.length * RH + 30;
s += txt(X0, yk, 'Share of draws ranked first (ties share first place), log scale.', { size: F.xs, fill: C.body });
s += line(X0, yk + 10, X0, yk + 22, { stroke: PAL.lead, w: 1.8, cap: 'round' }) + txt(X0 + 6, yk + 19, 'published seed', { size: F.xs, fill: C.body });
s += line(X0 + 92, yk + 13, X0 + 92, yk + 19, { stroke: PAL.otherInterval, w: 0.6 }) + line(X0 + 96, yk + 13, X0 + 96, yk + 19, { stroke: PAL.otherInterval, w: 0.6 }) + txt(X0 + 101, yk + 19, `the ${others.length} other seeds`, { size: F.xs, fill: C.body });
s += circle(X0 + 212, yk + 16, 3, { fill: 'none', stroke: C.body, w: 0.9 }) + txt(X0 + 219, yk + 19, 'first alone, published seed', { size: F.xs, fill: C.body });
const [src, sh] = L.srcBlock(yk + 36, `Shown: every country in the lead group under any seed, or first in at least 2% of draws under any seed. ${S.meta.draws.toLocaleString('en-US')} draws per seed of the main model; ranks are competition ranks on the rounded score. Monte Carlo standard error at 5%: ${S.meta.mcStandardErrorAt5pct}. Seeds listed in analysis/robustness/seed_sweep.json. Source: Health Record Rights Index, SuperTruth.`);
s += src; L.write('fig_seeds', s, yk + 32 + sh);
console.log(`Sweden in lead under ${inLeadN('SWE')} of ${nSeeds} seeds; sole first ${(M.SWE.soleFirstShare * 100).toFixed(1)}%`);
