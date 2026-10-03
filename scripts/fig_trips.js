// Figure: the three worked trips of Section 10.6 as a small multiple for print. One panel per trip, stops as columns,
// the five parts of the record as rows; inside a cell, one square per piece (that part, held in one earlier country).
// Every cell state and count comes from the interactive page's own derivation (traveller.js: readRc, compactXb,
// deriveRoute on VISITOR, ATHLETE and USEU), loaded the way scripts/paper_gen.js loads it; nothing is typed.
// States, in this order of precedence: arrives by itself (live or partial link); not known (no source says whether the
// link works; the person may still have a copy); copy only (no link, but a right to a copy); and, where it occurs, neither
// found (no link and no copy right found), drawn as an empty square. Totals asserted against the paper's GEN spans.
const L = require('./fig_lib');
const { C, PAL, F, txt, line, rect, assert, textW } = L;
const fs = L.fs, path = L.path, T = require('../traveller.js');
const XF = L.read('analysis/crossborder/crossborder.json'), RJ = L.read('analysis/crossborder/relocation_and_copy.json');
const data = {}; for (const f of fs.readdirSync(path.join(L.ROOT, 'data')).filter(f => /^[A-Z]{3}\.json$/.test(f))) { const d = L.read('data/' + f); data[d.iso3] = d; }
XF.rc = T.readRc(RJ); const xb = T.compactXb(XF);
const md = fs.readFileSync(path.join(L.ROOT, 'paper/paper.md'), 'utf8'), gen = k => (md.split(`<!-- GEN:${k} -->`)[1] || '').split(`<!-- /GEN:${k} -->`)[0];
const stateOf = c => ['live', 'partial'].includes(c.ch.state) ? 'arrive' : c.border.state === 'unknown' ? 'unknown' : ['carried', 'carried_partial'].includes(c.ch.state) ? 'copy' : 'neither';
const NAME = { summary: 'Health summary', prescriptions: 'Medicines', labs: 'Lab results', images: 'Scans and X-rays', notes: 'Hospital notes' };
T.PART_KEYS.forEach(k => assert(NAME[k] && T.PARTS.find(p => p.k === k).f === NAME[k], `part name for ${k} differs from traveller-core`));
const MODE = { visiting: 'visiting', moved: 'moved', return: 'back home' };
const TRIPS = [T.VISITOR, T.ATHLETE, T.USEU].map(R => ({ R, d: T.deriveRoute(xb, R) }));
// checks against the paper's own spans (Section 10.6)
{ const a = TRIPS[1].d, all = a.flatMap(s => T.PART_KEYS.flatMap(p => s.cells[p]));
  assert(String(all.length) === gen('xbathpieces'), `athlete pieces ${all.length} differ from the paper's ${gen('xbathpieces')}`);
  const unk = all.filter(c => c.border.state === 'unknown').length; assert(gen("xbathunk").startsWith(`${unk} of the ${all.length}`), `athlete not-known ${unk} differs from "${gen('xbathunk')}"`);
  const v = TRIPS[0].d, vall = v.flatMap(s => T.PART_KEYS.flatMap(p => s.cells[p])), vunk = vall.filter(c => c.border.state === 'unknown').length;
  assert(gen('xbvisitunk') === `${vunk} of the ${vall.length}`, `visitor not-known differs from "${gen('xbvisitunk')}"`); }
const FILL = { arrive: PAL.trip.arrive, unknown: PAL.trip.unknown, copy: PAL.trip.copy, neither: '#FFFFFF' };
const LW = 94, CWs = 79, SQ = 8, SG = 1.6, LANE = 13;
let s = '', y = 0, seen = new Set();
TRIPS.forEach(({ R, d }, ti) => {
  if (ti) { y += 10; s += line(0, y, 664, y, { stroke: C.grid, w: 0.5 }); y += 8; }
  s += txt(0, y + 12, R.title, { size: F.l, fill: C.ink, weight: 650 });
  s += txt(textW(R.title, F.l) + 14, y + 12, `from ${data[R.home].name}, ${R.note}`, { size: F.s, fill: C.body });
  y += 22;
  const nameLines = st => { const n = data[st.iso3].name; if (textW(n, F.s) <= CWs - 6) return [n]; const w = n.split(' '), h = Math.ceil(w.length / 2); return [w.slice(0, h).join(' '), w.slice(h).join(' ')]; };
  const hl = Math.max(...d.map(st => nameLines(st).length));
  d.forEach((st, j) => { const x0 = LW + j * CWs, nl = nameLines(st);
    nl.forEach((l, k) => { s += txt(x0, y + 10 + k * 11, l, { size: F.s, fill: C.ink, weight: 600 }); });
    s += txt(x0, y + 10 + hl * 11, MODE[st.kind] || st.kind, { size: F.xs, fill: C.body }); });
  y += 17 + hl * 11;
  T.PART_KEYS.forEach((p, r) => { const ly = y + r * LANE;
    s += txt(0, ly + 8, NAME[p], { size: F.s, fill: C.body });
    d.forEach((st, j) => { const x0 = LW + j * CWs;
      st.cells[p].forEach((c, h) => { const k = stateOf(c); seen.add(k);
        s += rect(x0 + h * (SQ + SG), ly, SQ, SQ, { fill: FILL[k], stroke: k === 'neither' ? C.body : '', w: 0.7 }); }); }); });
  y += 5 * LANE + 4;
  d.forEach((st, j) => { const x0 = LW + j * CWs, n = st.counts;
    s += txt(x0, y + 9, `${n.sysCells} of ${n.cells} arrive`, { size: F.xs, fill: n.sysCells ? C.ink : C.body, weight: n.sysCells ? 600 : 400 });
    const nf = T.PART_KEYS.flatMap(p => st.cells[p]).filter(c => stateOf(c) === 'neither').length;
    const extra = [n.unknownCells ? `${n.unknownCells} not known` : '', nf ? `${nf} neither found` : ''].filter(Boolean);
    extra.forEach((e, k) => { s += txt(x0, y + 20 + k * 11, e, { size: F.xs, fill: C.body }); }); });
  y += 33;
});
// key: only states that occur
y += 12; let kx = 0;
[['arrive', 'arrives by itself'], ['unknown', 'not known'], ['copy', 'copy only'], ['neither', 'neither found']].filter(([k]) => seen.has(k)).forEach(([k, lab]) => {
  s += rect(kx, y - 8, SQ, SQ, { fill: FILL[k], stroke: k === 'neither' ? C.body : '', w: 0.7 }); s += txt(kx + 12, y, lab, { size: F.xs, fill: C.body }); kx += 12 + textW(lab, F.xs) + 18; });
y += 14; s += txt(0, y, 'One square: one part of the record, held in one earlier country. Under each stop: pieces that arrive by themselves; pieces not known.', { size: F.xs, fill: C.body });
const [src, sh] = L.srcBlock(y + 16, `Made-up trips, the three examples on the interactive page (healthrecordrights.com/traveler/), status as of ${XF.meta.as_of}. "Arrive": a live link sends that part to a doctor there by itself. "Not known": no source says whether a link works; never counted as a break. "Neither found": no link and no right to a copy found. Computed with the page's own code (traveller-core.js). Source: Health Record Rights Index, SuperTruth; analysis/crossborder.`);
s += src; L.write('fig_trips', s, y + 12 + sh);
console.log(`states seen: ${[...seen].join(', ')}`);
