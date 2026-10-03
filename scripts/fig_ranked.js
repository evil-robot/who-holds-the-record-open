// Figure: all countries in rank order. Top: overall score with its 90% interval, on the full 0 to 100 scale, bands as
// labelled zones (the empty Leading zone is drawn and labelled). Bottom: the 90% rank range (the OECD/JRC Handbook's
// Figure 18 form), band boundaries as hairlines only. Labelled directly: the countries Section 4.1 names (the lead group,
// read from the data as every country whose range includes first place, and the last-ranked country).
// Data: out/facts.json; analysis/robustness/robustness.json, main model (meta.main), the key paper_gen.js uses for Table 2.
const L = require('./fig_lib');
const { C, PAL, F, txt, line, rect, circle, lin, assert, textW } = L;
const facts = L.read('out/facts.json'), RB = L.read('analysis/robustness/robustness.json');
const MAIN = RB.meta.main; assert(MAIN, 'robustness.json names no main model');
const MC = RB.monteCarlo[MAIN].countries, rows = facts.ranked, N = rows.length;
assert(N === facts.N, 'ranked length differs from N');
rows.forEach(d => {
  assert(RB.reference.overall[d.iso3] === d.overall, `robustness reference score differs for ${d.iso3}`);
  assert(String(RB.reference.rank[d.iso3]) === String(d.rank).replace('=', ''), `robustness reference rank differs for ${d.iso3}`);
  assert(MC[d.iso3] && MC[d.iso3].rank90 && MC[d.iso3].score90, `no ${MAIN} interval for ${d.iso3}`);
});
const lead = rows.filter(d => MC[d.iso3].rank90[0] === 1), last = rows[N - 1];
assert(lead.length >= 1, 'no lead group');
const rk = d => +String(d.rank).replace('=', '');
const X0 = 30, X1 = 576, x = lin(0.5, N + 0.5, X0, X1);
const isLead = d => lead.includes(d);
let s = '';
const spans = []; rows.forEach((d, i) => { const l = spans[spans.length - 1]; if (l && l.band === d.band) l.to = i + 1; else spans.push({ band: d.band, from: i + 1, to: i + 1 }); });
const counts = Object.fromEntries(L.BANDS.map(([b]) => [b, rows.filter(d => d.band === b).length]));

// top panel: score, 0 to 100
const T0 = 24, T1 = 226, ys = lin(0, 100, T1, T0);
L.BANDS.forEach(([name, lo, hi], i) => {
  const a = lo, b = Math.min(hi + 1, 100);
  s += rect(X0, ys(b), X1 - X0, ys(a) - ys(b), { fill: i % 2 ? PAL.zoneB : PAL.zoneA });
  s += txt(X1 + 6, (ys(a) + ys(b)) / 2 + 3.5, counts[name] ? name : `${name}: none`, { size: F.s, fill: counts[name] ? C.body : C.ink, weight: counts[name] ? 400 : 600 });
});
s += line(X0, ys(100), X1, ys(100), { stroke: C.grid, w: 0.5 }) + line(X0, ys(0), X1, ys(0), { stroke: C.grid, w: 0.5 });
for (const v of [0, 25, 45, 65, 85, 100]) s += txt(X0 - 5, ys(v) + 3.5, v, { size: F.xs, fill: C.muted, anchor: 'end', mono: true });
s += line(X0, ys(facts.median), X1, ys(facts.median), { stroke: C.muted, w: 0.5, dash: '2 2' });
s += txt(X1 - 2, ys(facts.median) - 3, `median ${facts.median}`, { size: F.xs, fill: PAL.textBody, anchor: 'end' });
rows.forEach((d, i) => { const [a, b] = MC[d.iso3].score90;
  s += line(x(i + 1), ys(a), x(i + 1), ys(b), { stroke: isLead(d) ? PAL.lead : PAL.otherInterval, w: 0.9 });
  s += circle(x(i + 1), ys(d.overall), 1.25, { fill: isLead(d) ? PAL.lead : PAL.other }); });
// direct labels, top panel
const top = lead[0];
s += line(x(lead.length) + 2, ys(MC[top.iso3].score90[1]) - 1, x(lead.length) + 16, ys(MC[top.iso3].score90[1]) - 6, { stroke: PAL.lead, w: 0.5 });
s += txt(x(lead.length) + 18, ys(MC[top.iso3].score90[1]) - 4, `Lead group: ${lead.map(d => `${d.name} ${d.overall}`).join(', ')}`, { size: F.s, fill: PAL.lead, weight: 600 });
s += txt(x(N) - 4, ys(MC[last.iso3].score90[0]) + 12, `${last.name} ${last.overall}`, { size: F.s, fill: C.ink, anchor: 'end' });
s += txt(X0, T0 - 10, 'Overall score, with its 90% interval (0 to 100)', { size: F.m, fill: C.ink, weight: 600 });

// bottom panel: rank range, rank 1 at the top; band boundaries as hairlines
const B0 = 268, B1 = 470, yr = lin(1, N, B0, B1);
spans.forEach((sp, i) => {
  if (i) s += line(x(sp.from - 0.5), B0 - 2, x(sp.from - 0.5), B1 + 2, { stroke: C.muted, w: 0.5 });
  s += txt((x(sp.from - 0.5) + x(sp.to + 0.5)) / 2, B1 + 13, `${sp.band} ${sp.to - sp.from + 1}`, { size: F.xs, fill: C.body, anchor: 'middle' });
});
for (const v of [1, 50, 100, 150, N]) s += txt(X0 - 5, yr(v) + 3.5, v, { size: F.xs, fill: C.muted, anchor: 'end', mono: true });
rows.forEach((d, i) => { const [a, b] = MC[d.iso3].rank90;
  s += line(x(i + 1), yr(a), x(i + 1), yr(b), { stroke: isLead(d) ? PAL.lead : PAL.otherInterval, w: 0.9 });
  s += circle(x(i + 1), yr(rk(d)), 1.25, { fill: isLead(d) ? PAL.lead : PAL.other }); });
s += txt(X0, B0 - 12, 'Rank, with the range of ranks it holds in 90% of draws', { size: F.m, fill: C.ink, weight: 600 });
// direct labels, bottom panel (the empty lower left)
const lx = X0 + 14, ly = yr(146);
s += line(x(lead.length) + 1.5, yr(MC[lead[lead.length - 1].iso3].rank90[1]) + 2, lx + 4, ly - 12, { stroke: PAL.lead, w: 0.5 });
s += txt(lx, ly, `Lead group: range includes first place`, { size: F.s, fill: PAL.lead, weight: 600, halo: true });
{ const ll = lead.map(d => `${d.name} ${MC[d.iso3].rank90[0]} to ${MC[d.iso3].rank90[1]}`), h = Math.ceil(ll.length / 2);
  s += txt(lx, ly + 13, ll.slice(0, h).join(', ') + ',', { size: F.s, fill: PAL.lead, halo: true }); s += txt(lx, ly + 26, ll.slice(h).join(', '), { size: F.s, fill: PAL.lead, halo: true }); }
const [la, lb] = MC[last.iso3].rank90;
s += txt(x(N), yr(70), `${last.name}, rank ${last.rank}`, { size: F.s, fill: C.ink, anchor: 'end' }); s += txt(x(N), yr(70) + 12, `(range ${la} to ${lb})`, { size: F.xs, fill: C.body, anchor: 'end' });
s += line(x(N) - 1, yr(70) + 16, x(N), yr(rk(last)) - 4, { stroke: C.ink, w: 0.5 });
const widths = Object.values(MC).map(c => c.rank90[1] - c.rank90[0]).sort((a, b) => a - b), mw = widths[Math.floor(widths.length / 2)];
s += txt(0, B1 + 30, `Countries in rank order, left to right; every country is in Table 2. Median width of a rank range: ${mw} places.`, { size: F.xs, fill: C.muted });
const [src, sh] = L.srcBlock(B1 + 44, `${N} countries, data as of ${facts.asOf}. Intervals: ${RB.meta.draws.toLocaleString('en-US')} draws of the main model (weights and scoring error varied together), analysis/robustness. Source: Health Record Rights Index, SuperTruth.`);
s += src; L.write('fig_ranked', s, B1 + 40 + sh);
console.log(`lead group: ${lead.map(d => d.iso3).join(' ')}; median rank-range width ${mw}`);
