// Figure: what EU law adds for the five parts of the record, and when. One row per part: where it stands today on
// MyHealth@EU, and the date from which the EHDS gives a right to ask for it to be sent to a provider in another Member
// State and to a free download (Article 105 with Articles 3(2) and 7(2)). Data via scripts/fig_travel_common.js.
const L = require('./fig_lib');
const { C, F, txt, line, rect, circle, lin } = L;
const T = require('./fig_travel_common');
const t = iso => { const d = new Date(iso + 'T00:00:00Z'); return d.getUTCFullYear() + (d - Date.UTC(d.getUTCFullYear(), 0, 1)) / (365.25 * 864e5); };
const SX = 198, X0 = 352, X1 = 656, x = lin(2026.7, 2032.6, X0, X1), TOP = 76, RH = 28, BOT = TOP + 5 * RH - 8;
const today = new Date(T.asOf + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
let s = '';
s += txt(0, 12, 'Part of the record', { size: F.s, fill: C.muted }) + txt(SX, 12, 'Today, on MyHealth@EU', { size: F.s, fill: C.muted }) + txt(SX, 23, `(${today})`, { size: F.s, fill: C.muted });
s += txt(X0, 12, 'EU law: a right to ask for it to be sent to a provider', { size: F.s, fill: C.teal, weight: 600 }) + txt(X0, 23, 'in another Member State, and to a free download, from:', { size: F.s, fill: C.teal, weight: 600 });
for (let y = 2027; y <= 2032; y++) { s += line(x(y), TOP - 8, x(y), BOT, { stroke: C.grid, w: 0.5 }); s += txt(x(y), BOT + 11, y, { size: F.xs, fill: C.muted, anchor: 'middle', mono: true }); }
[[T.D.apply, 'regulation applies', C.muted, 38], [T.D.d29, '', C.teal, 50], [T.D.d31, '', C.teal, 50]].forEach(([d, lab, col, ly]) => {
  s += line(x(t(d.iso)), ly + 3, x(t(d.iso)), BOT, { stroke: col, w: 0.8, dash: col === C.muted ? '2 2' : '' });
  s += txt(x(t(d.iso)) + 3, ly, d.label + (lab ? `: ${lab}` : ''), { size: F.xs, fill: col, weight: col === C.teal ? 600 : 400 }); });
// today, from the data's as-of date: the waits to 2029 and 2031 read as waits
s += line(x(t(T.asOf)), 64, x(t(T.asOf)), BOT, { stroke: C.ink, w: 0.8 });
s += txt(x(t(T.asOf)) + 3, 62, `today, ${today}`, { size: F.xs, fill: C.ink });
T.PARTS.forEach((p, i) => { const y = TOP + i * RH + 4;
  if (i) s += line(0, y - 11, X0 - 12, y - 11, { stroke: C.grid, w: 0.5 });
  s += txt(0, y + 1, p.name, { size: F.m, fill: C.ink, weight: 600 }); s += txt(0, y + 12, p.legal, { size: F.xs, fill: C.muted });
  const on = p.send != null;
  s += circle(SX + 4, y - 2, 3, on ? { fill: C.teal } : { fill: '#fff', stroke: C.body, w: 0.8 });
  s += txt(SX + 12, y + 1, on ? `live: ${p.send} send, ${p.recv} receive` : 'not carried', { size: F.s, fill: on ? C.ink : C.muted });
  const a = x(t(p.date.iso)); s += rect(a, y - 5, X1 - a, 6, { fill: '#80C7BB' }); s += circle(a, y - 2, 3.2, { fill: C.teal }); });
const yb = BOT + 26;
const [src, sh] = L.srcBlock(yb, `Today: countries live among the ${T.eea} EU and EEA countries (Table 10); MyHealth@EU carries no other part. Dates: Regulation (EU) 2025/327, Article 105 with Articles 3(2), 7(2) and 14(1); they bind the 27 EU members (EEA take-up not checked). A right in law does not move a record today. Source: Health Record Rights Index, SuperTruth; analysis/crossborder.`);
s += src; L.write('fig_ehds_timeline', s, yb + sh);
