// Figure: how the index was built, for print. Six stages on the shared 664-unit grid (two rows of three), text at 7 pt or
// more, no icons and no internal title (the caption names it). Every count is read from the repository:
// out/facts.json, analysis/robustness/robustness.json, analysis/reliability/reliability.json, analysis/testretest/testretest.json,
// analysis/url_check.csv (final_outcome; the recheck date is the latest recheck timestamp), and, only if it exists,
// analysis/reliability2/reliability2.json (the blind re-score of the added countries, once the paper reports it). The research system and dates are
// read from the paper's own "System and dates" line. Replaces fig1_method in the paper; the site's fig1 is left as it is.
const L = require('./fig_lib');
const { C, PAL, F, txt, line, rect, assert, wrap } = L;
const facts = L.read('out/facts.json'), RB = L.read('analysis/robustness/robustness.json'), RL = L.read('analysis/reliability/reliability.json');
const TR = L.read('analysis/testretest/testretest.json');
const md = L.fs.readFileSync(L.path.join(L.ROOT, 'paper/paper.md'), 'utf8');
const sys = md.match(/\*System and dates\.\*[^\n]*\((Claude [^,]+), run through ([^)]+)\), used from ([^.]+?)\./);
assert(sys, 'the "System and dates" line in paper.md has changed: update the parser');
// url_check.csv with quoted fields
const parseCsv = t => { const rows = []; let row = [], f = '', q = false;
  for (let i = 0; i < t.length; i++) { const ch = t[i];
    if (q) { if (ch === '"' && t[i + 1] === '"') { f += '"'; i++; } else if (ch === '"') q = false; else f += ch; }
    else if (ch === '"') q = true; else if (ch === ',') { row.push(f); f = ''; } else if (ch === '\n') { row.push(f.replace(/\r$/, '')); rows.push(row); row = []; f = ''; } else f += ch; }
  if (f || row.length) { row.push(f); rows.push(row); } return rows; };
const csv = parseCsv(L.fs.readFileSync(L.path.join(L.ROOT, 'analysis/url_check.csv'), 'utf8')), H = csv[0], body = csv.slice(1).filter(r => r.length === H.length);
assert(body.length === csv.length - 1 - (csv.at(-1).length === 1 ? 1 : 0), 'url_check.csv has malformed rows');
const fo = H.indexOf('final_outcome'), ru = H.indexOf('recheck_utc'), cu = H.indexOf('checked_utc');
const links = body.length, open = body.filter(r => r[fo] === 'ok').length;
// the recheck date in US Eastern time, where the work was run: the last stamps fall just after midnight UTC on the
// evening of the data date, so a UTC calendar date would print a day later than the data it describes
const stamps = body.flatMap(r => [r[ru], r[cu]]).filter(d => /^\d{4}-\d\d-\d\dT/.test(d)).sort();
assert(stamps.length, 'no timestamps in url_check.csv');
const recheck = new Date(stamps.at(-1).replace(/Z?$/, 'Z')).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/New_York' }) + ' (US Eastern time)';
// the blind re-score of the added countries: shown only when its result file exists AND the paper reports it (a GEN span
// whose name starts rel2), so the figure never claims a study the text does not
const R2p = L.path.join(L.ROOT, 'analysis/reliability2/reliability2.json');
const R2 = L.fs.existsSync(R2p) && /<!-- GEN:rel2/.test(md) ? JSON.parse(L.fs.readFileSync(R2p, 'utf8')) : null;
const f2 = v => v.toFixed(2), N = facts.N;
const STAGES = [
  ['Research', [[`One agent per country, in the country's own languages; ${N} countries.`], ['Public sources only: laws, government and regulators, court decisions, published news.'],
    ['The rubric requires every cited source to be opened.'], [`${sys[1]} through ${sys[2]}, ${sys[3]}.`],
    ['Output: a draft country file with 8 category scores, 0 to 100, each with a summary and dated sources.']]],
  ['Cross-check', [['A second agent session, same model family.'], ['Rubric anchors: each score compared with the anchor band for its legal situation.'],
    ['Publisher classes: every cited publisher reclassified.']]],
  ['Review and audit', [['Agent consistency audit: countries with the same legal right compared.'], ['The authors rule on every finding and every proposed score change.'],
    ['Published change log: every change, with its reason.']]],
  ['Scoring', [['Overall score: the weighted sum of the eight category scores; weights sum to 100% (Table 1).'], ['__BANDS__']]],
  ['Testing', [[`Stability: ${RB.meta.draws.toLocaleString('en-US')} draws re-weight the categories and perturb the scores; a rank range for each country.`],
    [`Second full reading of ${TR.countries} countries: ICC ${f2(TR.overallIcc)} on the overall score, ${f2(TR.cellIcc)} per cell.`],
    [`Blind re-scoring of ${RL.sample.cells} sampled cells (${RL.headline.n} scorable): ICC ${f2(RL.headline.icc2_1)}.`],
    ...(R2 && R2.headline ? [[`Blind re-scoring of ${R2.sample.cells} cells from the added countries (${R2.headline.n} scorable): ICC ${f2(R2.headline.icc2_1)}.`]] : []),
    ['Comparison with outside measures (Section 6).'],
    [`Links: ${open.toLocaleString('en-US')} of ${links.toLocaleString('en-US')} cited links open on recheck, ${recheck}.`]]],
  ['Publication', [['Scores and every source, as CSV and JSON, CC BY 4.0.'], [`${N} one-page country briefs.`], ['The paper.'],
    [`Beside the scores, never in them: ${facts.storyTotal} published accounts from regulators, courts and the news. They change no score.`]]],
];
const CW = 206, GX = 23, ROWGAP = 26, LH = 12.4, MAXC = 38;
let s = '', y0 = 0, rowBottom = 0, ends = [];
STAGES.forEach(([title, items], i) => {
  const col = i % 3, row = Math.floor(i / 3), x0 = col * (CW + GX);
  if (col === 0 && row > 0) y0 = rowBottom + ROWGAP;
  let y = y0;
  s += line(x0, y, x0 + CW, y, { stroke: PAL.lead, w: 1.2 });
  s += txt(x0, y + 15, String(i + 1), { size: F.l, fill: PAL.lead, weight: 700, mono: true }) + txt(x0 + 14, y + 15, title, { size: F.l, fill: C.ink, weight: 650 });
  if (col < 2) { const ax = x0 + CW + GX / 2; s += line(ax - 6, y + 10, ax + 5, y + 10, { stroke: C.muted, w: 0.9 }) + `<path d="M${ax + 6} ${y + 10}l-4 -2.6v5.2z" fill="${C.muted}"/>`; }
  y += 32;
  for (const [it] of items) {
    if (it === '__BANDS__') {
      const sx = x0, sw = CW, X = v => sx + v / 100 * sw;
      s += txt(x0, y, 'Five bands, to scale; countries in each:', { size: F.s, fill: C.body }); y += 8;
      L.BANDS.forEach(([n, lo, hi], k) => { const bx = X(lo), bw = X(hi === 100 ? 100 : hi + 1) - bx;
        s += rect(bx, y, bw - 1, 12, { fill: L.RAMP[k + 1] });
        const lastBand = k === L.BANDS.length - 1, ax = lastBand ? x0 + CW : bx + bw / 2, an = lastBand ? 'end' : 'middle', dy = lastBand ? 26 : 0;
        s += txt(ax, y + 24 + dy, n, { size: F.xs, fill: C.body, anchor: an });
        s += txt(ax, y + 36 + dy, facts.bandCount[n], { size: F.s, fill: C.ink, anchor: an, mono: true, weight: 600 }); });
      y += 74; continue; }
    const ls = wrap(it, MAXC); ls.forEach((l, j) => { s += txt(x0, y + j * LH, l, { size: F.s, fill: C.body }); }); y += ls.length * LH + 5;
  }
  ends.push(y); if (col === 2) { rowBottom = Math.max(...ends.slice(-3)); }
});
const yb = rowBottom + 10;
const [src, sh] = L.srcBlock(yb, `Method as in Section 3. Rubric v1.1. ${N} countries, data as of ${facts.asOf}. Counts read from out/facts.json, analysis/robustness, analysis/reliability${R2 ? ', analysis/reliability2' : ''}, analysis/testretest and analysis/url_check.csv. Source: Health Record Rights Index, SuperTruth.`);
s += src; L.write('fig_method', s, yb + sh);
console.log(`links ${open}/${links} on ${recheck}; reliability2 ${R2 ? 'included' : 'absent, omitted'}`);
