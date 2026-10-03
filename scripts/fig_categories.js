// Figure: the distribution of each of the eight category scores across all countries, one panel per category, the same
// 0 to 100 axis and the same count axis in every panel, median marked. Category names and weights are read from the
// paper's Table 1 (paper.md, GEN:categories), checked against robustness.json meta.weights; scores from out/facts.json.
// Every median is asserted equal to facts.dist, so the figure cannot disagree with Table 1.
const L = require('./fig_lib');
const { C, F, txt, line, rect, lin, assert } = L;
const facts = L.read('out/facts.json'), RB = L.read('analysis/robustness/robustness.json');
const md = L.fs.readFileSync(L.path.join(L.ROOT, 'paper/paper.md'), 'utf8');
const block = (md.split('<!-- GEN:categories -->')[1] || '').split('<!-- /GEN:categories -->')[0];
const t1 = block.split('\n').filter(l => /^\| [A-Z]/.test(l) && !/^\| Category/.test(l)).map(l => l.split('|').map(c => c.trim()));
assert(t1.length === 8, 'Table 1 rows not found in paper.md');
const KEYS = Object.keys(facts.dist);
// Table 1 order is by weight; map each row to a key by its median and weight (names differ in wording only)
const used = new Set();
const cats = t1.map(r => {
  const w = parseInt(r[2]), med = +r[5];
  const k = KEYS.find(k => !used.has(k) && RB.meta.weights[k] === w && facts.dist[k].med === med && facts.dist[k].min === +r[3] && facts.dist[k].max === +r[7]);
  assert(k, `cannot match Table 1 row "${r[1]}" to a category`); used.add(k);
  return { key: k, name: r[1], weight: w };
});
const rows = facts.ranked; assert(rows.length === facts.N, 'N');
const median = a => { const s = [...a].sort((x, y) => x - y), n = s.length; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; };
const BIN = 5, nb = 100 / BIN;
const hist = cats.map(c => { const v = rows.map(d => d.cats[c.key]); assert(v.every(x => Number.isFinite(x)), `missing ${c.key}`);
  const m = median(v); assert(Math.round(m) === facts.dist[c.key].med, `median of ${c.key} ${m} differs from facts.dist ${facts.dist[c.key].med}`);
  const h = Array(nb).fill(0); v.forEach(x => h[Math.min(nb - 1, Math.floor(x / BIN))]++); return { ...c, h, m }; });
const ymax = Math.ceil(Math.max(...hist.flatMap(c => c.h)) / 10) * 10;
const heapKey = hist.reduce((m, c) => Math.max(...c.h) > Math.max(...m.h) ? c : m).key;   // the category with the tallest bin
const TR = L.read('analysis/testretest/testretest.json'); assert(TR.perCategoryIcc && TR.perCategoryIcc[heapKey] != null, 'test-retest per-category ICC missing');
const COLS = 2, PW = 292, GX = 56, LM = 22, PH = 74, GY = 40, TOP = 18;
let s = '';
hist.forEach((c, i) => {
  const col = i % COLS, row = Math.floor(i / COLS), x0 = LM + col * (PW + GX), y0 = TOP + row * (PH + GY), x = lin(0, 100, x0, x0 + PW), y = lin(0, ymax, y0 + PH, y0);
  s += txt(x0, y0 - 8, c.name, { size: F.m, fill: C.ink, weight: 600 }) + txt(x0 + PW, y0 - 8, `weight ${c.weight}%`, { size: F.s, fill: C.muted, anchor: 'end' });
  c.h.forEach((n, b) => { if (n) s += rect(x(b * BIN) + 0.4, y(n), x(BIN) - x(0) - 0.8, y(0) - y(n), { fill: L.PAL.bar }); });
  s += line(x0, y(0), x0 + PW, y(0), { stroke: C.muted, w: 0.5 });
  [0, 25, 50, 75, 100].forEach(v => s += txt(x(v), y(0) + 10, v, { size: F.xs, fill: C.muted, anchor: v === 0 ? 'start' : v === 100 ? 'end' : 'middle', mono: true }));
  s += line(x(c.m), y0 - 1, x(c.m), y(0), { stroke: C.ink, w: 0.9 });
  s += txt(x(c.m) + 3, y0 + 7, `median ${Math.round(c.m)}`, { size: F.s, fill: C.ink, halo: true });
  if (col === 0) [ymax / 2, ymax].forEach(v => { s += txt(x0 - 4, y(v) + 3.5, v, { size: F.xs, fill: C.muted, anchor: 'end', mono: true }); s += line(x0 - 2, y(v), x0, y(v), { stroke: C.muted, w: 0.5 }); });
  // the panel whose heap sets the shared count axis: say so on the data (counted, and the test-retest agreement read from file)
  if (c.key === heapKey) { const v = rows.map(d => d.cats[c.key]), lo = 45, hi = 50, n = v.filter(t => t >= lo && t <= hi).length;
    s += txt(x(56), y(ymax * 0.62), `${n} of ${v.length} countries score ${lo} to ${hi}`, { size: F.s, fill: C.ink, weight: 600 });
    s += txt(x(56), y(ymax * 0.62) + 12, `test-retest agreement: ${TR.perCategoryIcc[c.key]}`, { size: F.s, fill: C.body });
    s += txt(x(56), y(ymax * 0.62) + 24, `(${TR.countries} countries read twice, Section 3)`, { size: F.xs, fill: C.body }); }
});
const H = TOP + 4 * (PH + GY) - GY + 40;
s += L.source(H - 14, `Countries per ${BIN}-point bin; the same axes in every panel (count axis 0 to ${ymax}). ${rows.length} countries, data as of ${facts.asOf}. Weights as published.`);
s += L.source(H - 3, 'Source: Health Record Rights Index, SuperTruth.');
L.write('fig_categories', s, H + 2);
