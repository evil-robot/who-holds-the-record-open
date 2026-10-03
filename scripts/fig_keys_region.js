// Figure: who holds the keys, by region. One row per region (Table 3's order and regions), one column per keys class,
// each cell a bar for the share of that region's countries in the class, with the count. Same scale in every cell.
// Data: data/*.json (region, controlModel); totals asserted against out/facts.json modelCount.
const L = require('./fig_lib');
const { C, F, txt, line, rect, lin, assert } = L;
const facts = L.read('out/facts.json');
const files = L.fs.readdirSync(L.path.join(L.ROOT, 'data')).filter(f => /^[A-Z]{3}\.json$/.test(f));
const D = files.map(f => L.read('data/' + f)); assert(D.length === facts.N, `data files ${D.length} differ from N ${facts.N}`);
const CLASSES = ['Shared', 'Institutional', 'State', 'Individual'];
for (const k of CLASSES) assert(D.filter(d => d.controlModel === k).length === facts.modelCount[k], `${k} count differs from facts.modelCount`);
assert(D.every(d => CLASSES.includes(d.controlModel)), 'unknown keys class');
// regions in Table 3 order (mean overall, high to low), as paper_gen.js orders them
const regions = [...new Set(D.map(d => d.region))].map(r => { const ds = facts.ranked.filter(x => D.find(d => d.iso3 === x.iso3).region === r);
  return { r, n: ds.length, mean: ds.reduce((a, d) => a + d.overall, 0) / ds.length }; }).sort((a, b) => b.mean - a.mean);
const LW = 112, CW = 124, GX = 14, RH = 24, TOP = 30;
let s = '';
CLASSES.forEach((k, j) => { const x0 = LW + j * (CW + GX);
  s += txt(x0, TOP - 16, k, { size: F.m, fill: C.ink, weight: 600 });
  s += txt(x0, TOP - 5, `${facts.modelCount[k]} of ${facts.N} countries`, { size: F.xs, fill: C.muted }); });
const all = [...regions, { r: 'All countries', n: facts.N, all: true }];
all.forEach((g, i) => {
  const y0 = TOP + 6 + i * RH + (g.all ? 8 : 0), ds = g.all ? D : D.filter(d => d.region === g.r);
  if (g.all) s += line(0, y0 - 6, LW + 4 * CW + 3 * GX, y0 - 6, { stroke: C.muted, w: 0.5 });
  s += txt(0, y0 + 10, g.r, { size: F.m, fill: C.ink, weight: g.all ? 600 : 400 });
  s += txt(LW - 8, y0 + 10, `n ${ds.length}`, { size: F.xs, fill: C.muted, anchor: 'end', mono: true });
  CLASSES.forEach((k, j) => { const x0 = LW + j * (CW + GX), c = ds.filter(d => d.controlModel === k).length, sh = c / ds.length, bw = CW - 46;
    s += rect(x0, y0 + 2, bw, 11, { fill: L.PAL.track });
    if (c) s += rect(x0, y0 + 2, bw * sh, 11, { fill: g.all ? L.PAL.barAll : L.PAL.barRegion });
    s += txt(x0 + bw + 5, y0 + 11, `${c}`, { size: F.s, fill: c ? C.ink : C.muted, mono: true });
    s += txt(x0 + CW - 2, y0 + 11, `${Math.round(100 * sh)}%`, { size: F.xs, fill: C.muted, anchor: 'end', mono: true }); });
});
const yb = TOP + 6 + all.length * RH + 8 + 12;
const [src, sh] = L.srcBlock(yb, `Bar: share of the region's countries in each class, on one 0 to 100% scale (the grey track is 100%); figures: count and share. Regions in the order of Table 3. Classes as defined in Section 2.3 (rubric v1.1 anchors). Data as of ${facts.asOf}. Source: Health Record Rights Index, SuperTruth.`);
s += src; const H = yb + sh;
L.write('fig_keys_region', s, H + 3);
