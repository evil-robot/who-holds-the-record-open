// Figure: evidence grades (the DTI adaptation of Section 8), share of cells in each tier by category, plus countries.
// One ordered teal ramp, darkest = Platinum. Category names and order from the paper's Table 1; tiers and thresholds
// from analysis/dti/dti_evidence.json meta.tiers; totals asserted against the paper's GEN:dticells and GEN:dtitiers spans.
const L = require('./fig_lib');
const { C, F, txt, line, rect, assert } = L;
const DT = L.read('analysis/dti/dti_evidence.json'), facts = L.read('out/facts.json'), RB = L.read('analysis/robustness/robustness.json');
const md = L.fs.readFileSync(L.path.join(L.ROOT, 'paper/paper.md'), 'utf8');
const gen = k => ((md.split(`<!-- GEN:${k} -->`)[1] || '').split(`<!-- /GEN:${k} -->`)[0]);
const TIERS = Object.entries(DT.meta.tiers).sort((a, b) => b[1] - a[1]).map(t => t[0]);   // Platinum ... Below Bronze
const FILL = L.PAL.tier;
TIERS.forEach(t => assert(FILL[t], `no fill for tier ${t}`));
const cells = Object.values(DT.countries).flatMap(c => Object.entries(c.cells));
const cnt = (arr) => Object.fromEntries(TIERS.map(t => [t, arr.filter(x => x === t).length]));
const allc = cnt(cells.map(([, c]) => c.tier));
const cellsSpan = gen('dticells'); assert(cellsSpan, 'GEN:dticells not in paper.md');
TIERS.forEach(t => { if (allc[t]) assert(new RegExp(`\\b${allc[t]} ${t}\\b`).test(cellsSpan), `cell count ${allc[t]} ${t} not in paper's "${cellsSpan}"`); });
const countryC = cnt(Object.values(DT.countries).map(c => c.tier)), tiersSpan = gen('dtitiers');
TIERS.forEach(t => { if (countryC[t]) assert(new RegExp(`\\b${countryC[t]} ${t}\\b`).test(tiersSpan), `country count ${countryC[t]} ${t} not in paper's "${tiersSpan}"`); });
// Table 1 names and order
const t1 = gen('categories').split('\n').filter(l => /^\| [A-Z]/.test(l) && !/^\| Category/.test(l)).map(l => l.split('|').map(c => c.trim()));
const used = new Set(), cats = t1.map(r => { const k = Object.keys(facts.dist).find(k => !used.has(k) && RB.meta.weights[k] === parseInt(r[2]) && facts.dist[k].med === +r[5] && facts.dist[k].min === +r[3] && facts.dist[k].max === +r[7]);
  assert(k, `Table 1 row ${r[1]}`); used.add(k); return { key: k, name: r[1] }; });
const rows = [{ name: `All countries (${Object.keys(DT.countries).length})`, c: countryC, bold: true },
  ...cats.map(k => ({ name: k.name, c: cnt(cells.filter(([kk]) => kk === k.key).map(([, c]) => c.tier)) })),
  { name: `All cells (${cells.length})`, c: allc, bold: true }];
const goldUp = Object.values(DT.countries).filter(c => DT.meta.tiers[c.tier] >= DT.meta.tiers.Gold).length, nC = Object.keys(DT.countries).length;
const bronzeCells = cells.filter(([, c]) => DT.meta.tiers[c.tier] < DT.meta.tiers.Silver);
const LW = 196, X0 = LW, X1 = 600, RH = 18, TOP = 48;
let s = '';
s += txt(0, 12, `${goldUp} of ${nC} countries grade Gold or better on the evidence behind their scores.`, { size: F.m, fill: C.ink, weight: 600 });
// tier key across the top, in ramp order, with thresholds
let kx = X0; TIERS.filter(t => allc[t] || countryC[t]).forEach(t => { s += rect(kx, TOP - 22, 9, 9, { fill: FILL[t], stroke: '#9CA3AF', w: 0.4 });
  const lab = `${t} (${DT.meta.tiers[t]}+)`; s += txt(kx + 13, TOP - 14.5, lab, { size: F.s, fill: C.body }); kx += 13 + L.textW(lab, F.s) + 16; });
rows.forEach((r, i) => { const y = TOP + i * RH + (i > 0 ? 6 : 0) + (i === rows.length - 1 ? 6 : 0), n = TIERS.reduce((a, t) => a + r.c[t], 0);
  if (i === 1 || i === rows.length - 1) s += line(0, y - 4, X1, y - 4, { stroke: C.grid, w: 0.5 });
  s += txt(0, y + 9, r.name, { size: F.m, fill: C.ink, weight: r.bold ? 600 : 400 });
  let x = X0; TIERS.forEach(t => { const w = (X1 - X0) * r.c[t] / n; if (!w) return;
    const light = ['Silver', 'Bronze', 'Below Bronze'].includes(t);
    s += rect(x, y, w, 12, { fill: FILL[t], stroke: light ? '#9CA3AF' : '', w: 0.4 }); if (w > 24) s += txt(x + w / 2, y + 9.5, r.c[t], { size: F.xs, fill: t === 'Platinum' ? '#fff' : C.ink, anchor: 'middle', mono: true });
    x += w; });
  const bg = TIERS.filter(t => DT.meta.tiers[t] < DT.meta.tiers.Gold).reduce((a, t) => a + r.c[t], 0);
  s += txt(660, y + 9.5, bg, { size: F.s, fill: bg ? C.ink : C.muted, mono: true, anchor: 'end' }); });
s += txt(660, TOP - 15, 'below', { size: F.xs, fill: C.muted, anchor: 'end' }) + txt(660, TOP - 4, 'Gold', { size: F.xs, fill: C.muted, anchor: 'end' });
const yb = TOP + rows.length * RH + 12 + 12;
const [src, sh] = L.srcBlock(yb, `Bars: share of cells (one country, one category) or of countries in each tier; numbers: counts. Below Silver: ${bronzeCells.length ? `${bronzeCells.length} ${bronzeCells.length === 1 ? 'cell' : 'cells'} (${[...new Set(bronzeCells.map(([k]) => cats.find(c => c.key === k).name.toLowerCase()))].join(', ')})` : 'none'}. Grades are of the evidence behind a score, not of the score. DTI dimensions and weights adapted as in Section 8 (Table 8); run ${DT.meta.asOfRun}. Source: Health Record Rights Index, SuperTruth; scripts/dti_evidence.py.`);
s += src; const H = yb + sh;
L.write('fig_dti', s, H);
