// Figure: overall score against GDP per head (PPP, log scale) with the least-squares fit on log income and the countries
// furthest above and below it labelled. Selection replicates analysis/external_corr.py exactly (latest year with a value
// per country in the cached World Bank WDI response; countries in the index); the script refuses to draw unless its n,
// Spearman-free fit (slope per natural-log unit, R^2) and residual lists match analysis/external/external_corr.json.
const L = require('./fig_lib');
const { C, F, txt, line, rect, circle, lin, assert, textW } = L;
const facts = L.read('out/facts.json'), EX = L.read('analysis/external/external_corr.json').income;
const wdi = L.read('analysis/external/wdi_gdp_pcap_ppp.json')[1];
// external_corr.py fits on the unrounded overall: the weighted mean of the eight category scores
const WT = L.read('analysis/robustness/robustness.json').meta.weights;
const ours = Object.fromEntries(facts.ranked.map(d => { const u = Object.entries(WT).reduce((a, [k, w]) => a + d.cats[k] * w, 0) / 100;
  assert(Math.abs(u - d.overall) <= 0.5 + 1e-9, `unrounded overall far from published for ${d.iso3}`); return [d.iso3, { ...d, overall: u }]; }));
const GDP = {}, GDPY = {};
for (const r of wdi) { const k = r.countryiso3code, v = r.value, y = +r.date; if (ours[k] && v != null && y > (GDPY[k] || 0)) { GDP[k] = +v; GDPY[k] = y; } }
const ks = Object.keys(GDP).sort();
assert(ks.length === EX.overallVsGdp.n, `n ${ks.length} differs from external_corr.json ${EX.overallVsGdp.n}`);
const yrs = Object.values(GDPY); assert(`${Math.min(...yrs)} to ${Math.max(...yrs)}` === EX.overallVsGdp.years, 'years string differs');
const lg = ks.map(k => Math.log(GDP[k])), ov = ks.map(k => ours[k].overall), n = ks.length;
const mx = lg.reduce((a, b) => a + b) / n, my = ov.reduce((a, b) => a + b) / n;
const b1 = lg.reduce((a, x, i) => a + (x - mx) * (ov[i] - my), 0) / lg.reduce((a, x) => a + (x - mx) ** 2, 0), b0 = my - b1 * mx;
const res = ks.map((k, i) => ov[i] - (b0 + b1 * lg[i]));
const r2 = 1 - res.reduce((a, r) => a + r * r, 0) / ov.reduce((a, y) => a + (y - my) ** 2, 0);
assert(Math.round(b1 * 10) / 10 === EX.fit.slopePerLogUnit, `slope ${b1} differs from ${EX.fit.slopePerLogUnit}`);
assert(Math.round(r2 * 100) / 100 === EX.fit.r2, `r2 ${r2} differs from ${EX.fit.r2}`);
const order = ks.map((k, i) => [k, res[i]]).sort((a, b) => a[1] - b[1]);
const below = order.slice(0, EX.below.length), above = order.slice(-EX.above.length).reverse();
below.forEach(([k, r], i) => assert(k === EX.below[i].iso3 && Math.abs(r - EX.below[i].resid) < 0.06, `below list differs at ${k}`));
above.forEach(([k, r], i) => assert(k === EX.above[i].iso3 && Math.abs(r - EX.above[i].resid) < 0.06, `above list differs at ${k}`));
const missing = facts.ranked.filter(d => !GDP[d.iso3]).map(d => d.name);

const X0 = 34, X1 = 650, Y0 = 14, Y1 = 330;
const gx = [500, 1000, 2000, 5000, 10000, 20000, 50000, 100000, 200000];
const gmin = Math.min(...ks.map(k => GDP[k])), gmax = Math.max(...ks.map(k => GDP[k]));
const lo = gx.filter(v => v <= gmin).pop(), hi = gx.find(v => v >= gmax);
const x = v => lin(Math.log(lo), Math.log(hi), X0, X1)(Math.log(v)), y = lin(15, 75, Y1, Y0);
let s = '';
// range frame: axes only span the data
s += line(x(gmin), Y1 + 6, x(gmax), Y1 + 6, { stroke: C.muted, w: 0.5 });
gx.filter(v => v >= gmin && v <= gmax).forEach(v => { s += line(x(v), Y1 + 6, x(v), Y1 + 9, { stroke: C.muted, w: 0.5 });
  s += txt(x(v), Y1 + 19, v >= 1000 ? `$${v / 1000}k` : `$${v}`, { size: F.xs, fill: C.muted, anchor: 'middle', mono: true }); });
const smin = Math.min(...ov), smax = Math.max(...ov);
assert(smin >= 15 && smax <= 75, `plotted scores ${smin} to ${smax} fall outside the 15 to 75 axis`);
s += line(X0 - 6, y(smin), X0 - 6, y(smax), { stroke: C.muted, w: 0.5 });
[20, 30, 40, 50, 60, 70].forEach(v => { s += line(X0 - 9, y(v), X0 - 6, y(v), { stroke: C.muted, w: 0.5 }); s += txt(X0 - 11, y(v) + 3, v, { size: F.xs, fill: C.muted, anchor: 'end', mono: true }); });
s += txt(X0 - 6, Y0 - 2, 'Overall score (unrounded)', { size: F.s, fill: C.body });
s += txt(X1, Y1 + 32, 'GDP per head, PPP, current international dollars (log scale)', { size: F.s, fill: C.body, anchor: 'end' });
// fit line over the data range
s += line(x(gmin), y(b0 + b1 * Math.log(gmin)), x(gmax), y(b0 + b1 * Math.log(gmax)), { stroke: C.ink, w: 0.8 });
const lab = new Set([...below, ...above].map(a => a[0]));
ks.forEach(k => { if (!lab.has(k)) s += circle(x(GDP[k]), y(ours[k].overall), 1.7, { fill: 'none', stroke: C.faint, w: 0.7 }); });
// labels: try positions around the point, keep the first that hits no other label or labelled point
const boxes = [];
const hit = (a) => boxes.some(b => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h);
const place = (k, col) => {
  const px = x(GDP[k]), py = y(ours[k].overall), name = ours[k].name, w = textW(name, F.s) + 2, h = 10;
  const cand = [[6, 3], [-6 - w, 3]]; for (const dy of [-3, 9, -9, 15, -15, 21]) cand.push([6, dy], [-6 - w, dy]); cand.push([-w / 2, -8], [-w / 2, 16]);
  for (const [dx, dy] of cand) { const bx = { x: px + dx, y: py + dy - 8, w, h }; if (bx.x < X0 || bx.x + bx.w > X1 || hit(bx)) continue;
    boxes.push(bx);
    const ex = bx.x > px ? bx.x : bx.x + bx.w, ey = bx.y + 5, far = Math.hypot(ex - px, ey - py) > 8;
    return (far ? line(px + Math.sign(ex - px) * 2.5, py, ex + (bx.x > px ? -1 : 1), ey, { stroke: col, w: 0.4 }) : '') + txt(bx.x + 1, bx.y + 8, name, { size: F.s, fill: col, halo: true }); }
  assert(false, `no room for the label of ${k}`);
};
[...above, ...below].forEach(([k]) => boxes.push({ x: x(GDP[k]) - 2.5, y: y(ours[k].overall) - 2.5, w: 5, h: 5 }));
above.forEach(([k]) => { s += circle(x(GDP[k]), y(ours[k].overall), 2.3, { fill: C.ink }); });
below.forEach(([k]) => { s += circle(x(GDP[k]), y(ours[k].overall), 2.3, { fill: C.ink }); });
above.forEach(([k]) => { s += place(k, C.ink); });
// the six below the line sit in a tight cluster; their label positions were chosen by eye on the render to keep clear of
// other points (layout only). A country not in this table (the residual list changed) falls back to the automatic placer.
const SPOT = { LBY: 'r', DMA: 'r', VCT: 'r', GUY: 'u', KNA: 'ur', TTO: 'dr' };
below.forEach(([k]) => { const px = x(GDP[k]), py = y(ours[k].overall), nm = ours[k].name, o = SPOT[k];
  if (!o) { s += place(k, C.ink); return; }
  if (o === 'r') s += txt(px + 6, py + 3.5, nm, { size: F.s, fill: C.ink });
  if (o === 'ur') { s += line(px + 2, py - 2, px + 6, py - 13, { stroke: C.ink, w: 0.4 }); s += txt(px + 7, py - 14, nm, { size: F.s, fill: C.ink }); }
  if (o === 'u') s += txt(px, py - 6, nm, { size: F.s, fill: C.ink, anchor: 'middle' });
  if (o === 'dr') { s += line(px + 2, py + 2, px + 6, py + 6, { stroke: C.ink, w: 0.4 }); s += txt(px + 7, py + 9.5, nm, { size: F.s, fill: C.ink }); }
  if (o === 'dl') { s += line(px - 2, py + 2, px - 6, py + 7, { stroke: C.ink, w: 0.4 }); s += txt(px - 7, py + 12, nm, { size: F.s, fill: C.ink, anchor: 'end' }); } });
const sg = v => (v >= 0 ? '+' : '') + v.toFixed(2);
const o = EX.overallVsGdp;
s += txt(X0 + 4, Y0 + 12, `Spearman ${sg(o.rho)} (95% interval ${sg(o.lo)} to ${sg(o.hi)}), n ${o.n}`, { size: F.s, fill: C.ink, weight: 600 });
s += txt(X0 + 4, Y0 + 24, `Line: least squares on log income, ${EX.fit.slopePerLogUnit} points per natural-log unit, R² ${EX.fit.r2}`, { size: F.s, fill: C.body });
s += txt(X0 + 4, Y0 + 36, `Labelled: the ${above.length} largest residuals above the line and the ${below.length} largest below it`, { size: F.s, fill: C.body });
const srcl = L.wrap(`Scores as of ${facts.asOf}. GDP: World Bank WDI NY.GDP.PCAP.PP.CD, latest year per country (${o.years}). Not in the World Bank data (${missing.length}): ${missing.join(', ')}. Source: Health Record Rights Index, SuperTruth; analysis/external_corr.py.`, 150);
srcl.forEach((l, i) => { s += L.source(Y1 + 48 + i * 11, l); });
L.write('fig_gdp', s, Y1 + 42 + srcl.length * 11);
