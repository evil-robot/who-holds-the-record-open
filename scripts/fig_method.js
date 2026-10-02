// Figure 1 for the paper: how the index was built. Writes paper/figures/fig1_method.svg and .html (render to PNG with
// headless Chrome). Layout follows the PaperBanana draft JAS liked (teal header bands, tinted panels, white cards,
// line icons); every label follows the paper's method wording and every count is read from the data, so the figure
// follows the data when countries are added. Weight bars are drawn to scale (20% is four times 5%).
const fs = require('fs');
const facts = JSON.parse(fs.readFileSync('out/facts.json', 'utf8'));
const rob = JSON.parse(fs.readFileSync('analysis/robustness/robustness.json', 'utf8')).meta;
const rel = JSON.parse(fs.readFileSync('analysis/reliability/reliability.json', 'utf8')).headline;
const relAll = JSON.parse(fs.readFileSync('analysis/reliability/reliability.json', 'utf8'));
const N = facts.N, DRAWS = rob.draws.toLocaleString('en-US'), CELLS = rel.n, SAMPLE = relAll.sample.cells;
// link check, counted the way paper_gen.js counts it (url_check.csv, last column final_outcome)
const uc = fs.readFileSync('analysis/url_check.csv', 'utf8').trim().split(/\r?\n/).slice(1).map(l => l.split(',').at(-1).trim());
const LINKS = uc.length.toLocaleString('en-US'), OPENED = uc.filter(o => o === 'ok').length.toLocaleString('en-US');
const STORIES = facts.storyTotal;
const W = [['Access to the full record', 20], ['Control and consent', 20], ['Privacy and security', 15], ['Connected care journey', 15],
  ['Protection from commercial use', 10], ['Clinician access', 10], ['Research consent', 5], ['Clinical AI governance', 5]];
const BANDS = [['Poor', 0, 24, '#AADDD4'], ['Weak', 25, 44, '#80C7BB'], ['Mixed', 45, 64, '#50AEA0'], ['Strong', 65, 84, '#0D9488'], ['Leading', 85, 100, '#0F766E']];

const INK = '#111827', BODY = '#374151', MUTED = '#6B7280', TEAL = '#0F766E', TINT = '#F0FDFA', LINE = '#99D5CC', CARD = '#fff';
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const wrap = (s, max) => { const out = []; let l = ''; for (const w of s.split(' ')) { if ((l + ' ' + w).trim().length > max) { out.push(l); l = w; } else l = (l + ' ' + w).trim(); } if (l) out.push(l); return out; };
// centred multi-line text; bold lead (before ':') when asked
const ctext = (cx, y, s, max, { size = 13, fill = BODY, lh = 17, weight = 400 } = {}) => wrap(s, max).map((l, i) =>
  `<text x="${cx}" y="${y + i * lh}" font-size="${size}" fill="${fill}" font-weight="${weight}" text-anchor="middle">${esc(l)}</text>`).join('');
const nlines = (s, max) => wrap(s, max).length;

// line icons, 40x40, drawn at (x,y) top-left, teal strokes
const S = `fill="none" stroke="${TEAL}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"`;
const ICON = {
  doc: (x, y) => `<g transform="translate(${x},${y})" ${S}><path d="M8 3h17l8 8v26H8z"/><path d="M25 3v8h8"/><path d="M13 18h14M13 23h14M13 28h9"/></g>`,
  check: (x, y) => `<g transform="translate(${x},${y})" ${S}><path d="M6 3h17l8 8v20H6z"/><path d="M23 3v8h8"/><path d="M11 17h12M11 22h8"/><circle cx="30" cy="31" r="7" fill="#fff"/><path d="M26.5 31l2.5 2.5 4.5-5"/></g>`,
  agent: (x, y) => `<g transform="translate(${x},${y})" ${S}><rect x="7" y="12" width="26" height="20" rx="5"/><path d="M20 12V6"/><circle cx="20" cy="5" r="2"/><circle cx="15" cy="21" r="2"/><circle cx="25" cy="21" r="2"/><path d="M15 27h10"/><path d="M4 19v6M36 19v6"/></g>`,
  target: (x, y) => `<g transform="translate(${x},${y})" ${S}><circle cx="20" cy="20" r="12"/><circle cx="20" cy="20" r="5"/><path d="M20 2v8M20 30v8M2 20h8M30 20h8"/></g>`,
  peers: (x, y) => `<g transform="translate(${x},${y})" ${S}><circle cx="20" cy="20" r="4"/><circle cx="7" cy="8" r="3"/><circle cx="33" cy="8" r="3"/><circle cx="7" cy="32" r="3"/><circle cx="33" cy="32" r="3"/><path d="M10 10l7 7M30 10l-7 7M10 30l7-7M30 30l-7-7"/></g>`,
  scales: (x, y) => `<g transform="translate(${x},${y})" ${S}><path d="M20 5v29M10 34h20M8 10h24"/><path d="M8 10l-5 12h10zM32 10l-5 12h10z"/></g>`,
  curve: (x, y) => `<g transform="translate(${x},${y})" ${S}><path d="M3 36h34"/><path d="M4 35c7 0 9-28 16-28s9 28 16 28"/><path d="M20 8v27" stroke-dasharray="3 3"/></g>`,
  pair: (x, y) => `<g transform="translate(${x},${y})" ${S}><path d="M3 6h13l5 5v18H3z"/><path d="M19 11h13l5 5v18H19z" fill="#fff"/><path d="M24 22l3 3 6-6"/></g>`,
  globe: (x, y) => `<g transform="translate(${x},${y})" ${S}><circle cx="20" cy="20" r="15"/><ellipse cx="20" cy="20" rx="6.5" ry="15"/><path d="M5 20h30M8 12h24M8 28h24"/></g>`,
  data: (x, y) => `<g transform="translate(${x},${y})" ${S}><rect x="5" y="5" width="30" height="30" rx="3"/><path d="M5 14h30M5 23h30M15 5v30M25 5v30"/></g>`,
  briefs: (x, y) => `<g transform="translate(${x},${y})" ${S}><path d="M12 3h17l6 6v24H12z"/><path d="M8 7v30h21" /><path d="M17 15h13M17 20h13M17 25h8"/></g>`,
  book: (x, y) => `<g transform="translate(${x},${y})" ${S}><path d="M7 5h22a4 4 0 0 1 4 4v26H11a4 4 0 0 1-4-4z"/><path d="M7 31a4 4 0 0 1 4-4h22"/><path d="M13 12h14M13 17h10"/></g>`,
  law: (x, y) => `<g transform="translate(${x},${y}) scale(0.6)" ${S}><path d="M6 8h28v24H6z"/><path d="M20 8v24M10 14h6M10 19h6M24 14h6M24 19h6"/></g>`,
  gov: (x, y) => `<g transform="translate(${x},${y}) scale(0.6)" ${S}><path d="M4 14L20 5l16 9z"/><path d="M8 16v14M16 16v14M24 16v14M32 16v14M4 33h32"/></g>`,
  court: (x, y) => `<g transform="translate(${x},${y}) scale(0.6)" ${S}><path d="M8 28l14-14M18 10l8 8M14 14l8 8M24 6l10 10M6 34h18"/></g>`,
  news: (x, y) => `<g transform="translate(${x},${y}) scale(0.6)" ${S}><rect x="5" y="7" width="30" height="26" rx="2"/><path d="M10 13h20M10 19h9M10 25h9M23 19h7v6h-7z"/></g>`,
};

const CW = 250, GAP = 30, X0 = 30, TOPY = 86, HEAD = 74, PAD = 14; const ENDS = [];
const col = i => X0 + i * (CW + GAP);
let svg = `<text x="${X0}" y="56" font-size="34" font-weight="700" fill="${INK}" letter-spacing="-0.5">How the index was built</text>`;
const card = (x, y, w, h, fill = CARD, dash) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="${fill}" stroke="${LINE}"${dash ? ' stroke-dasharray="5 4"' : ''}/>`;
// a card with an icon on top and centred text below; returns [svg, height]
const iconCard = (x, y, w, icon, lead, rest) => {
  const max = Math.floor((w - 20) / 7.2), leadL = lead ? nlines(lead, max) : 0, restL = rest ? nlines(rest, max) : 0;
  const h = 18 + 40 + 12 + leadL * 18 + restL * 17 + 14, cx = x + w / 2;
  let s = card(x, y, w, h) + ICON[icon](cx - 20, y + 16);
  let ty = y + 16 + 40 + 22;
  if (lead) { s += ctext(cx, ty, lead, max, { weight: 600, fill: INK, lh: 18 }); ty += leadL * 18; }
  if (rest) s += ctext(cx, ty, rest, max);
  return [s, h];
};
const STAGES = [
  ['Research', `One agent per country, in its own languages (${N} countries)`],
  ['Cross-check', 'Second agent session, same model family'],
  ['Review and audit', 'Agent audit; authors rule on findings'],
  ['Scoring', 'Weighted sum, 0 to 100'],
  ['Testing', 'Four checks'],
  ['Publication', 'Open data'],
];
STAGES.forEach(([t, sub], i) => {
  const x = col(i);
  svg += `<rect x="${x}" y="${TOPY}" width="${CW}" height="__COLH__" rx="12" fill="${TINT}" stroke="${LINE}"/>`;
  svg += `<path d="M${x} ${TOPY + 12}a12 12 0 0 1 12-12h${CW - 24}a12 12 0 0 1 12 12v${HEAD - 12}h-${CW}z" fill="${TEAL}"/>`;
  svg += `<text x="${x + CW / 2}" y="${TOPY + 28}" font-size="18" font-weight="600" fill="#fff" text-anchor="middle">Stage ${i + 1}: ${esc(t)}</text>`;
  svg += ctext(x + CW / 2, TOPY + 50, sub, 32, { size: 13, fill: '#E6F4F1', lh: 16 });
  if (i < STAGES.length - 1) { const ax = x + CW + 5, ay = TOPY + HEAD + 260; svg += `<path d="M${ax} ${ay}h${GAP - 14}" stroke="#9CA3AF" stroke-width="1.5"/><path d="M${ax + GAP - 14} ${ay - 4}l7 4-7 4z" fill="#9CA3AF"/>`; }
});
const IN = (i) => [col(i) + PAD, CW - 2 * PAD];
let y, s, h;
// 1 Research
{ const [x, w] = IN(0); y = TOPY + HEAD + 16;
  const chips = [['law', 'Laws'], ['gov', 'Government and regulators'], ['court', 'Court decisions'], ['news', 'Published news']];
  chips.forEach(([ic, l], k) => { const cy = y + k * 34; svg += `<rect x="${x}" y="${cy}" width="${w}" height="28" rx="14" fill="#fff" stroke="${LINE}"/>` + ICON[ic](x + 8, cy + 2) + `<text x="${x + 38}" y="${cy + 18}" font-size="12.5" fill="${BODY}">${esc(l)}</text>`; });
  y += 4 * 34 + 8; svg += ctext(x + w / 2, y + 12, 'Public sources only. The rubric requires every cited source to be opened.', 30, { weight: 600, fill: INK }); y += nlines('Public sources only. The rubric requires every cited source to be opened.', 30) * 17 + 18;
  [s, h] = iconCard(x, y, w, 'agent', 'AI research agent', 'Claude Opus 5.5, 30 Sep to 2 Oct 2026'); svg += s; y += h + 14;
  [s, h] = iconCard(x, y, w, 'doc', 'Draft country file', '8 category scores, 0 to 100, each with a summary and dated sources, against a written rubric'); svg += s; ENDS.push(y + h); }
// 2 Cross-check
{ const [x, w] = IN(1); y = TOPY + HEAD + 16;
  [s, h] = iconCard(x, y, w, 'agent', 'AI cross-check agent', 'a separate session'); svg += s; y += h + 14;
  [s, h] = iconCard(x, y, w, 'target', 'Rubric anchors:', 'each score compared with the anchor band for its legal situation'); svg += s; y += h + 14;
  [s, h] = iconCard(x, y, w, 'peers', 'Publisher classes:', 'every cited publisher reclassified'); svg += s; y += h + 14;
  [s, h] = iconCard(x, y, w, 'globe', 'Links:', 'every cited link rechecked'); svg += s; ENDS.push(y + h); }
// 3 Review and audit
{ const [x, w] = IN(2); y = TOPY + HEAD + 16;
  [s, h] = iconCard(x, y, w, 'check', 'Authors rule', 'on every audit finding and every proposed score change'); svg += s; y += h + 14;
  [s, h] = iconCard(x, y, w, 'scales', 'Consistency audit by agents:', 'countries with the same legal right compared'); svg += s; y += h + 14;
  [s, h] = iconCard(x, y, w, 'check', 'Published change log', 'every score change, with its reason'); svg += s; ENDS.push(y + h); }
// 4 Scoring: weights to scale, formula, bands
{ const [x, w] = IN(3); y = TOPY + HEAD + 16;
  const unit = (w - 60) / 20; let hh = 16 + W.length * 38 + 6;
  svg += card(x, y, w, hh); let wy = y + 22;
  for (const [n, p] of W) { svg += `<text x="${x + 12}" y="${wy}" font-size="12.5" fill="${BODY}">${esc(n)}</text><rect x="${x + 12}" y="${wy + 7}" width="${(p * unit).toFixed(1)}" height="7" rx="2" fill="${TEAL}"/><text x="${x + 18 + p * unit}" y="${wy + 14}" font-size="11" font-family="JetBrains Mono" fill="${MUTED}">${p}%</text>`; wy += 38; }
  y += hh + 14;
  svg += card(x, y, w, 64) + `<text x="${x + w / 2}" y="${y + 28}" font-size="12" fill="${INK}" text-anchor="middle">Overall = Σ category score × weight</text><text x="${x + w / 2}" y="${y + 48}" font-size="12.5" fill="${MUTED}" text-anchor="middle">weights sum to 100%; 0 to 100</text>`;
  y += 64 + 14;
  const BH = 142; svg += card(x, y, w, BH) + `<text x="${x + w / 2}" y="${y + 24}" font-size="14" font-weight="600" fill="${INK}" text-anchor="middle">Five bands, to scale</text>`;
  const sw = w - 24, sx = x + 12, X = v => sx + v / 100 * sw;
  BANDS.forEach(([n, lo, hi, c]) => { const bx = X(lo), bw = X(hi + (hi === 100 ? 0 : 1)) - bx, cx = bx + bw / 2;
    svg += `<rect x="${bx.toFixed(1)}" y="${y + 36}" width="${bw.toFixed(1)}" height="22" fill="${c}"/>`;
    svg += `<text x="${cx.toFixed(1)}" y="${y + 92}" font-size="9.5" fill="${INK}" text-anchor="middle">${n}</text><text x="${cx.toFixed(1)}" y="${y + 108}" font-size="10.5" font-family="JetBrains Mono" fill="${INK}" font-weight="600" text-anchor="middle">${facts.bandCount[n]}</text>`; });
  [0, 25, 45, 65, 85, 100].forEach(v => { svg += `<text x="${X(v).toFixed(1)}" y="${y + 72}" font-size="9.5" font-family="JetBrains Mono" fill="${MUTED}" text-anchor="middle">${v}</text>`; });
  svg += `<text x="${x + w / 2}" y="${y + 128}" font-size="10.5" fill="${MUTED}" text-anchor="middle">countries in each band</text>`; ENDS.push(y + BH); }
// 5 Testing
{ const [x, w] = IN(4); y = TOPY + HEAD + 16;
  [s, h] = iconCard(x, y, w, 'curve', 'Stability:', `${DRAWS} draws re-weight the categories and perturb the scores; a rank range for each country`); svg += s; y += h + 14;
  [s, h] = iconCard(x, y, w, 'pair', 'Blind re-scoring:', `a separate session of the same model family re-scores a random sample of ${SAMPLE} cells (${CELLS} scorable) from the sources alone`); svg += s; y += h + 14;
  [s, h] = iconCard(x, y, w, 'globe', 'Comparison with outside measures', ''); svg += s; y += h + 14;
  [s, h] = iconCard(x, y, w, 'check', 'Link check:', `${OPENED} of ${LINKS} cited links opened`); svg += s; ENDS.push(y + h); }
// 6 Publication + stories
{ const [x, w] = IN(5); y = TOPY + HEAD + 16;
  [s, h] = iconCard(x, y, w, 'data', 'Scores and every source', 'CSV and JSON, CC BY 4.0'); svg += s; y += h + 14;
  [s, h] = iconCard(x, y, w, 'briefs', `${N} country briefs`, 'one page each'); svg += s; y += h + 14;
  [s, h] = iconCard(x, y, w, 'book', 'The paper', ''); svg += s; y += h + 22;
  const max = 30, txt = `${STORIES} published accounts from regulators, courts and the news, shown with each country. They do not change any score.`;
  const sh = 18 + 40 + 12 + 18 + nlines(txt, max) * 17 + 14; svg += card(x, y, w, sh, '#fff', true) + ICON.doc(x + w / 2 - 20, y + 16) + ctext(x + w / 2, y + 78, 'Beside the scores, never in them', 34, { weight: 600, fill: INK, lh: 18 }) + ctext(x + w / 2, y + 78 + 22, txt, max); ENDS.push(y + sh); }

const BOTTOM = Math.max(...ENDS) + 18; svg = svg.split('__COLH__').join(String(BOTTOM - TOPY));
const WIDTH = X0 * 2 + 6 * CW + 5 * GAP, HEIGHT = BOTTOM + 48;
svg += `<text x="${X0}" y="${BOTTOM + 30}" font-size="12" fill="${MUTED}">Method as in Section 3 of the paper. Rubric v1.1. ${N} countries, data as of ${facts.asOf}. Source: Who Holds the Record, SuperTruth.</text>`;
const out = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" width="${WIDTH}" height="${HEIGHT}" font-family="Inter, system-ui, sans-serif"><rect width="100%" height="100%" fill="#fff"/>${svg}</svg>`;
fs.mkdirSync('paper/figures', { recursive: true });
fs.writeFileSync('paper/figures/fig1_method.svg', out);
const fonts = `@font-face{font-family:Inter;font-weight:100 900;src:url(../../out/assets/fonts/inter-latin.woff2)}@font-face{font-family:"JetBrains Mono";font-weight:100 800;src:url(../../out/assets/fonts/jetbrains-mono-latin.woff2)}`;
fs.writeFileSync('paper/figures/fig1_method.html', `<!doctype html><html><head><meta charset="utf-8"><style>${fonts}body{margin:0}</style></head><body>${out}</body></html>`);
console.log(`fig1: ${WIDTH}x${HEIGHT}, ${N} countries, ${DRAWS} draws, ${CELLS} cells`);
