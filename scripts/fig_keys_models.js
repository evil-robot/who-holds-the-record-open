// Figure: who holds the keys, the four classes of Section 2.3 drawn as person, providers and the state: where the record
// sits by default, which way it flows by default, and who holds the key. A solid key decides who sees the record; a dashed
// key is a working choice only (opt-in, opt-out, blocking). Counts and date from out/facts.json. The short wording
// paraphrases the rubric v1.1 anchors; the script stops if the anchors' key phrases leave paper.md.
const L = require('./fig_lib');
const { C, PAL, F, txt, line, rect, circle, assert } = L;
const facts = L.read('out/facts.json');
const md = L.fs.readFileSync(L.path.join(L.ROOT, 'paper/paper.md'), 'utf8');
['held or directed by the person', 'nothing flows into a state or provider system by default', 'shares by default or by law',
 'at least one working choice', 'opt-in, opt-out, or blocking', 'government-run national record or exchange', 'held provider by provider']
  .forEach(p => assert(md.includes(p), `anchor phrase "${p}" not in paper.md: update the figure wording`));
const K = facts.modelCount;
const asOfLong = new Date(facts.asOf + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
const PANELS = [
  { k: 'Individual', rec: ['person'], key: ['person', 'full'], flows: [['person', 'prov', 'dash']],
    lines: ['The person holds or directs', 'the record. Nothing flows by', 'default; each disclosure needs', 'prior consent.'] },
  { k: 'Shared', rec: ['prov'], faint: ['state'], key: ['person', 'choice'], flows: [['prov', 'state', 'both']],
    lines: ['The system shares by default', 'or by law, but the person has', 'a working choice over who', 'sees the record in care.'] },
  { k: 'State', rec: ['prov', 'state'], key: ['state', 'full'], flows: [['prov', 'state', 'one']],
    lines: ['No working choice for the', 'person. A live government-run', 'national record holds the', 'data by default.'] },
  { k: 'Institutional', rec: ['prov'], key: ['prov', 'full'], flows: [], dimState: true,
    lines: ['No working choice for the', 'person. Records are held', 'provider by provider; no live', 'national record.'] },
];
PANELS.forEach(p => assert(K[p.k] != null, `no count for ${p.k}`));
const PW = 150, GX = 14.6, PT = 20, PH = 132;
const doc = (x, y, op = 1) => `<g transform="translate(${x},${y})" opacity="${op}"><path d="M0 0h8l3 3v11H0z" fill="#fff" stroke="${C.ink}" stroke-width="0.8"/><path d="M8 0v3h3" fill="none" stroke="${C.ink}" stroke-width="0.8"/><path d="M2 6h7M2 8.5h7M2 11h5" stroke="${C.ink}" stroke-width="0.5"/></g>`;
const key = (x, y, kind) => kind === 'full'
  ? `<g transform="translate(${x},${y})" fill="none" stroke="${PAL.key}" stroke-width="1.6" stroke-linecap="round"><circle cx="3.5" cy="3.5" r="3" fill="${PAL.key}"/><path d="M6.5 3.5h9M12.5 3.5v3M15 3.5v2.5"/></g>`
  : `<g transform="translate(${x},${y})" fill="none" stroke="${PAL.key}" stroke-width="0.9" stroke-linecap="round" stroke-dasharray="2 1.2"><circle cx="3.5" cy="3.5" r="3"/><path d="M6.5 3.5h9M12.5 3.5v3M15 3.5v2.5"/></g>`;
let s = `<defs><marker id="fkm-a" viewBox="0 0 6 6" refX="5" refY="3" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L6 3L0 6z" fill="${C.body}"/></marker><marker id="fkm-b" viewBox="0 0 6 6" refX="1" refY="3" markerWidth="6" markerHeight="6" orient="auto"><path d="M6 0L0 3L6 6z" fill="${C.body}"/></marker></defs>`;
let textBottom = 0;
PANELS.forEach((p, i) => {
  const x0 = i * (PW + GX), cx = x0 + PW / 2, zero = K[p.k] === 0;
  s += txt(x0, 12, p.k, { size: F.l, fill: C.ink, weight: 650 });
  s += txt(x0 + PW, 12, `${K[p.k]} of ${facts.N}`, { size: F.m, fill: zero ? C.muted : C.ink, anchor: 'end', mono: true });
  s += rect(x0, PT, PW, PH, { fill: zero ? '#FAFAFA' : '#F6FAF9', rx: 4, dash: zero ? '3 2' : '', stroke: zero ? '#D1D5DB' : '' });
  const N = { person: [cx, PT + 26], prov: [x0 + 30, PT + 92], state: [x0 + PW - 30, PT + 92] };
  for (const [a, b, kind] of p.flows) { const [x1, y1] = N[a], [x2, y2] = N[b], dx = x2 - x1, dy = y2 - y1, d = Math.hypot(dx, dy), r = 16;
    s += `<line x1="${x1 + dx / d * r}" y1="${y1 + dy / d * r}" x2="${x2 - dx / d * r}" y2="${y2 - dy / d * r}" stroke="${C.body}" stroke-width="0.9"${kind === 'dash' ? ' stroke-dasharray="3 2"' : ''}${kind === 'both' ? ' marker-start="url(#fkm-b)"' : ''} marker-end="url(#fkm-a)"/>`; }
  for (const n of ['person', 'prov', 'state']) { const [x, y] = N[n], dim = p.dimState && n === 'state';
    s += circle(x, y, 13, { fill: '#fff', stroke: dim ? '#D1D5DB' : C.body, w: 0.8 });
    if (n === 'person') s += txt(x + 18, y + 3.5, 'Person', { size: F.xs, fill: C.body });
    else s += txt(x, y + 24, n === 'prov' ? 'Providers' : dim ? 'State: none' : 'State', { size: F.xs, fill: dim ? C.muted : C.body, anchor: 'middle' });
    if (p.rec.includes(n)) s += doc(x - 5.5, y - 7);
    if ((p.faint || []).includes(n)) { s += doc(x - 5.5, y - 7, 0.35); s += txt(x0 + PW - 4, y + 35, 'where one exists', { size: F.xs, fill: C.body, anchor: 'end' }); }
    if (p.key[0] === n) s += key(x + 9, y - 19, p.key[1]); }
  if (p.key[1] === 'choice') { s += txt(cx, N.person[1] + 27, 'a working choice:', { size: F.xs, fill: C.body, anchor: 'middle' }); s += txt(cx, N.person[1] + 38, 'opt-in, opt-out, blocking', { size: F.xs, fill: C.body, anchor: 'middle' }); }
  if (p.k === 'Individual') s += txt(x0 + 62, PT + 62, 'only with consent', { size: F.xs, fill: C.body });
  const lines = zero ? [['No country met this anchor', true], [`on ${asOfLong}.`, true], ...p.lines.map(l => [l, false])] : p.lines.map(l => [l, false]);
  lines.forEach(([l, b], j) => { const y = PT + PH + 16 + j * 12; s += txt(x0, y, l, { size: F.s, fill: b ? C.ink : C.body, weight: b ? 600 : 400 }); textBottom = Math.max(textBottom, y); });
});
const ly = textBottom + 22;
{ s += doc(0, ly - 10) + txt(16, ly, 'where the record sits by default', { size: F.xs, fill: C.body });
  let lx = 16 + L.textW('where the record sits by default', F.xs) + 18;
  s += key(lx, ly - 7, 'full') + txt(lx + 20, ly, 'decides who sees the record', { size: F.xs, fill: C.body }); lx += 20 + L.textW('decides who sees the record', F.xs) + 18;
  s += key(lx, ly - 7, 'choice') + txt(lx + 20, ly, 'a working choice only', { size: F.xs, fill: C.body }); lx += 20 + L.textW('a working choice only', F.xs) + 18;
  s += line(lx, ly - 3, lx + 18, ly - 3, { stroke: C.body, w: 0.9 }) + txt(lx + 22, ly, 'default flow', { size: F.xs, fill: C.body }); }
const [src, sh] = L.srcBlock(ly + 16, `Counts: countries in each class, data as of ${facts.asOf}. Classes and anchors as in Section 2.3 (rubric v1.1, docs/RUBRIC_V1_1_ANCHORS.md); the wording here is a short paraphrase. Source: Health Record Rights Index, SuperTruth.`);
s += src; L.write('fig_keys_models', s, ly + 12 + sh);
