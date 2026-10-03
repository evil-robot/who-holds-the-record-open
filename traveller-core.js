// The traveling patient: the shared, pure core (docs/TRAVELLER_DESIGN.md 3.2 to 3.6, 4.1).
// One file runs in two places: traveller.js requires it at build time, and the build copies it verbatim into
// out/traveler/app.js for the browser. Same derivation, same markup, so the server still and the client render agree.
// No require(), no DOM, no network: data in, strings out.
// ---- The page's words, in one place (JAS, 2 Oct): a US 8th grader should follow every sentence. Later wording swaps
// change these, not the templates. One vocabulary everywhere: a part "reaches a doctor by itself"; "no source says yes
// or no"; "you can bring a copy"; a law "says it must work by" a year; "parts" are the 5 kinds, "pieces" are one part
// kept in one country. ----
const NUMW = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
const numWord = n => NUMW[n] || String(n);
const WD = {
  record: 'Your health record has 5 parts: a short health summary, your medicines (prescriptions), lab results, scans and X-rays, and the notes a hospital writes when you go home.',
  split: 'When you move, the country you leave keeps the records it made, and your new country starts its own. So your record ends up in pieces, one in each country you lived in.',
  arrives: 'arrives by itself', unknown: 'not known', noSource: 'no source says either way', copy: 'you can bring a copy',
  lawBy: y => `EU law from ${y}`, planned: 'planned, no date set in law', none: 'no link found',
  reloc: 'arrives for a visitor; not known after a move', unit: 'pieces',
};
const PARTS = [
  // n: stop tables; f: figure lane names (desktop); s: phone column heads and lane labels. One source for every label.
  { k: 'summary', n: 'Health summary', f: 'Health summary', s: 'summary', topic: 'ps' },
  { k: 'prescriptions', n: 'Medicines', f: 'Medicines', s: 'medicines', topic: 'ep' },
  { k: 'labs', n: 'Lab results', f: 'Lab results', s: 'labs' },
  { k: 'images', n: 'Scans and X-rays', f: 'Scans and X-rays', s: 'scans' },
  { k: 'notes', n: 'Hospital notes (what a hospital writes when you go home)', f: 'Hospital notes', s: 'notes' },
];
const PART_KEYS = PARTS.map(p => p.k);
const EHDS_EARLY = new Set(['summary', 'prescriptions']); // Article 105 point (a); the others fall under point (b)

// Colour (design 3.3, validated palette). No other hex may draw a lane mark.
const INK = '#111827', SYS = '#0F766E', CARRIED = '#AADDD4', GUIDE = '#E5E7EB', RULE = '#D1D5DB', UNK = '#6B7280', LAND = '#F3F4F6';

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
// Numerals in JetBrains Mono (tabular), words in Inter: wrap digit runs. html: <span class="n">, svg: <tspan class="n">.
const NUM_RE = /\d(?:[\d,.:/]*\d)?%?(?:-\d[\d-]*)?/g; // a number ends on a digit or %, so a trailing comma or full stop is left outside
const numH = s => esc(s).replace(NUM_RE, m => `<span class="n">${m}</span>`);
const numS = s => esc(s).replace(NUM_RE, m => `<tspan class="n">${m}</tspan>`);
const r2 = x => Math.round(x * 1000) / 1000;

// ---------------------------------------------------------------------------------------------
// 1. Adapter: crossborder.json (real schema) to one side's state for one part (design 3.1 shape).
// ---------------------------------------------------------------------------------------------
// Status values in the data: live, planned, not_live, unknown, "none found". The data has no "partial".
const MAP = { live: 'live', planned: 'scheduled', not_live: 'none_found', 'none found': 'none_found', unknown: 'unknown', not_applicable: 'none_found' };

function ehdsOf(c) {
  const e = (c.fallback && c.fallback.ehds) || {};
  if (e.applies === true) return { applies: true, early: +String(e.download_right_from).slice(0, 4), late: +String(e.other_categories_from).slice(0, 4), from: e };
  if (e.applies === false) return { applies: false };
  return { applies: 'unknown', note: String(e.applies || 'unknown') };
}

function dated(f) { return f && f.date && /^\d{4}/.test(f.date) ? f.date : ''; }
function pickFact(block) {
  const facts = block.facts || [];
  const same = facts.filter(f => MAP[f.status] === MAP[block.status]);
  const pool = same.length ? same : facts;
  return [...pool].sort((a, b) => (dated(b) > dated(a) ? 1 : dated(b) < dated(a) ? -1 : 0))[0] || null;
}
const srcOf = (f, extra = {}) => f ? { title: f.publisher || f.title || (f.search ? 'Our search found no source' : ''), url: f.url || '', date: f.date || f.searched_on || 'no date given', quote: f.quote || '', ...extra } : null;

function globalFact(xb, topic, test = () => true) { return (xb.global_facts || []).find(g => g.topic === topic && test(g)) || null; }

// One side of a border: dir 'send' (the holder, country A) or 'recv' (the stop, country B).
function sideState(xb, iso3, part, dir) {
  const c = xb.countries[iso3];
  if (!c) throw new Error('no cross-border entry for ' + iso3);
  const eh = ehdsOf(c);
  const p = PARTS.find(x => x.k === part);
  let state, year = null, source = null, conflict = false, why = '';
  if (p.topic) {
    const block = c.myhealtheu[`${p.topic}_${dir}`];
    state = MAP[block.status];
    if (state === undefined) throw new Error(`unmapped status ${block.status} for ${iso3} ${p.topic}_${dir}`);
    const f = pickFact(block);
    source = srcOf(f, { asOf: block.evidence_as_of || '' });
    if (block.status === 'planned') why = 'planned';
    if (block.status === 'not_live') why = 'not live';
    // Design 3.1: unknown means "not researched, or sources conflict". METHOD.md keeps the national status and flags it.
    if (block.conflict) { state = 'unknown'; conflict = true; why = `sources disagree: the country says ${block.status === 'not_live' ? 'not working' : block.status === 'planned' ? 'planned' : block.status}; EU figures show records being sent`; }
    if (state === 'none_found' && c.group === 'other') {
      const ne = (c.no_exchange || [])[0];
      const tc = globalFact(xb, 'ehds_third_countries');
      source = { title: 'Our search found no link; EU law Article 24(3) on countries outside the EU', url: tc ? tc.url : '', date: (ne && ne.searched_on) || (tc && tc.date) || '' };
    }
  } else {
    // Labs, images and discharge reports: MyHealth@EU carries only summaries and prescriptions today (Commission quote).
    if (eh.applies === true) { state = 'none_found'; why = "not in the EU's exchange yet"; const g = globalFact(xb, 'myhealtheu_overview', x => /ePrescriptions and Patient Summaries/.test(x.quote)); source = srcOf(g); }
    else if (eh.applies === false) { state = 'none_found'; const ne = (c.no_exchange || [])[0]; const tc = globalFact(xb, 'ehds_third_countries'); source = { title: 'Our search found no link; EU law Article 24(3) on countries outside the EU', url: tc ? tc.url : '', date: (ne && ne.searched_on) || '' }; }
    else { state = 'unknown'; why = 'outside the EU; we did not check whether the new EU law applies there'; const g = globalFact(xb, 'ehds_dates', x => /2031/.test(x.detail)); source = srcOf(g); }
  }
  // Design 3.2 step 0 (and the 3.1 entry rule): under EHDS, a part that is not live today is scheduled with its EHDS year.
  if (eh.applies === true && state === 'none_found') {
    state = 'scheduled';
    const g = globalFact(xb, 'ehds_dates', x => (EHDS_EARLY.has(part) ? /2029/ : /2031/).test(x.detail));
    source = { ...(source || {}), law: srcOf(g) };
  }
  if (state === 'scheduled') year = eh.applies === true ? (EHDS_EARLY.has(part) ? eh.early : eh.late) : null;
  return { iso3, part, dir, state, year, source, conflict, why, eu: eh.applies };
}

// The person-carried copy (depends on the holder only). With the research layer, every home's copy right comes from
// relocation_and_copy.json (electronic yes / no / not stated). Without it, the only sourced copy right is the US note
// in crossborder.json (45 CFR 164.524), and every other home is not known.
// Optional research layer, analysis/crossborder/relocation_and_copy.json, attached by the build as xb.rc (see
// docs/TRAVELLER_BUILD.md for the shape). Absent: the behaviour above (US note only; relocation not known).
const YES = /^(yes|true)$/i, NO = /^(no|false)$/i;
const rcOf = (xb, iso3) => (xb.rc && xb.rc.countries && xb.rc.countries[iso3]) || null;
function carriedOf(xb, iso3) {
  const c = xb.countries[iso3], rc = rcOf(xb, iso3);
  if (rc && (rc.copyRight !== undefined || rc.electronic !== undefined)) {
    const right = String(rc.copyRight ?? 'not stated'), el = String(rc.electronic ?? 'not stated'), src = rc.copySource || null;
    if (NO.test(right) || NO.test(el)) return { state: 'no', parts: [], source: src, right, electronic: el };
    if (YES.test(el)) { const parts = Array.isArray(rc.copyParts) && rc.copyParts.length ? rc.copyParts.filter(p => PART_KEYS.includes(p)) : PART_KEYS.slice(); return { state: parts.length === PART_KEYS.length ? 'yes' : 'partial', parts, source: src, right, electronic: el }; }
    return { state: 'unknown', parts: [], source: src, right, electronic: el };
  }
  const f = (c.us_note || []).find(x => x.status === 'live' && /electronic copy/.test(x.quote || ''));
  if (f) return { state: 'yes', parts: PART_KEYS.slice(), source: srcOf(f) };
  return { state: 'unknown', parts: [], source: null };
}
const carriedPart = (car, part) => car.state === 'yes' ? (car.parts.includes(part) ? 'yes' : 'partial') : car.state === 'partial' ? (car.parts.includes(part) ? 'partial' : 'no') : car.state;

// Live "other" arrangements (outside MyHealth@EU) that cover holder A, stop B and part c.
function otherLive(xb, a, b, part) {
  const hits = [];
  for (const [x, y] of [[a, b], [b, a]]) for (const o of (xb.countries[x] || {}).other_arrangements || [])
    if (o.status === 'live' && (o.partners || []).includes(y) && (o.parts || ['summary']).includes(part)) hits.push(o);
  return hits;
}

// ---------------------------------------------------------------------------------------------
// 2. Derivation (design 3.2). Pure: sides in, state out.
// ---------------------------------------------------------------------------------------------
// sides: [send side of the holder, receive side of the stop, ...extra sides such as write-back]; other: live arrangement found.
function borderState(sides, other = false) {
  const st = sides.map(s => s.state);
  if (other) return { state: 'live', year: null, rule: 1 };
  if (st.every(s => s === 'live')) return { state: 'live', year: null, rule: 1 };
  if (st.every(s => s === 'live' || s === 'partial')) return { state: 'partial', year: null, rule: 2 };
  if (st.includes('none_found')) return { state: 'none_found', year: null, rule: 3 };
  if (st.includes('unknown')) return { state: 'unknown', year: null, rule: 4 };
  if (st.includes('scheduled')) {
    const ys = sides.filter(s => s.state === 'scheduled').map(s => s.year);
    const pairEU = sides.every(s => s.eu === true); // a law year binds only when both countries are EU members
    return { state: 'scheduled', year: !pairEU || ys.includes(null) ? null : Math.max(...ys), rule: 5 };
  }
  return { state: 'none_found', year: null, rule: 6 };
}

// Moved mode (design pitfall 5): MyHealth@EU serves care while traveling; whether a new resident's earlier record
// reaches a clinician in the new home is not sourced in crossborder.json, so a system channel that would be live or
// partial becomes unknown. A known break (none found) and a date in law (scheduled) stand.
function relocate(b) { return b.state === 'live' || b.state === 'partial' ? { ...b, state: 'unknown', relocation: true } : b; }
// With the research layer: a channel either side states is for visitors only (no transfer on moving) is a known break
// (none found, by design, with its source); both sides stating it serves residents keeps the border; anything else stays not known.
const CH = { summary: ['summary', 'ps', 'patientSummary'], prescriptions: ['prescriptions', 'ep', 'ePrescription'] };
function relocConclusion(xb, iso3, part) {
  const rc = rcOf(xb, iso3); if (!rc || !rc.relocation || !CH[part]) return null;
  const k = CH[part].find(x => rc.relocation[x]); if (!k) return null;
  const v = rc.relocation[k], c = String((v && v.conclusion) || v || '').toLowerCase().replace(/[\s-]+/g, '_');
  const conclusion = /visitor_only|no_transfer/.test(c) ? 'visitor_only' : /serves_residents|transfers|resident/.test(c) ? 'serves_residents' : 'not_stated';
  return { iso3, conclusion, source: (v && v.source) || null, quote: (v && v.quote) || '' };
}
// The EHDS right for movers (Article 7(2), applied by Article 105 point (a)): a dated promise, EU members only on both sides.
function relocPromise(xb, holder, stop, part) {
  if (!(ehdsOf(xb.countries[holder]).applies === true && ehdsOf(xb.countries[stop]).applies === true)) return null;
  const e = [rcOf(xb, holder), rcOf(xb, stop)].map(rc => rc && rc.relocation && rc.relocation.ehds_2029);
  if (!e[0] || !e[1] || !e.every(x => /serves_residents/.test(x.conclusion || '') && (!x.parts || x.parts.includes(part)))) return null;
  return { year: +String(e[1].from).slice(0, 4), date: e[1].from, article: e[1].article || '', recital: e[1].recital_quote || '', source: e[1].source || null };
}
// The EU right to ask (EHDS, Regulation (EU) 2025/327, Article 7(2)): from 26 March 2029 for the health summary and
// medicines (relocation_and_copy.json, ehds_2029, both countries "serves_residents"), and from 26 March 2031 for the other
// parts (Article 105, ehds_dates). A dated annotation for a person who moved between two EU countries; it never changes
// the border or the channel, because a law that applies later moves no record today.
function rightOf(xb, holder, stop, part) {
  if (holder === stop) return null;
  if (!(ehdsOf(xb.countries[holder]).applies === true && ehdsOf(xb.countries[stop]).applies === true)) return null;
  const e = [rcOf(xb, holder), rcOf(xb, stop)].map(rc => rc && rc.relocation && rc.relocation.ehds_2029);
  if (!e[0] || !e[1] || !e.every(x => /serves_residents/.test(x.conclusion || '') && x.from)) return null;
  const early = !e[1].parts || e[1].parts.includes(part);
  if (early) return { year: +String(e[1].from).slice(0, 4), date: e[1].from, article: e[1].article || 'Article 7(2)', source: e[1].source || null };
  const g = globalFact(xb, 'ehds_dates', x => /from 26 March 2031/.test(x.quote || ''));
  return g ? { year: 2031, date: '2031-03-26', article: 'Article 7(2), applied by Article 105', source: { title: g.publisher, url: g.url, date: g.date } } : null;
}
function relocateWith(xb, holder, stop, part, b) {
  if (!(b.state === 'live' || b.state === 'partial')) return b;
  const cs = [relocConclusion(xb, holder, part), relocConclusion(xb, stop, part)].filter(Boolean);
  const vo = cs.find(c => c.conclusion === 'visitor_only');
  if (vo) return { ...b, state: 'none_found', relocation: true, byDesign: true, relocSource: vo.source, relocBy: vo.iso3 };
  if (cs.length === 2 && cs.every(c => c.conclusion === 'serves_residents')) return { ...b, residentSources: cs.map(c => c.source) };
  const ns = cs.find(c => c.conclusion === 'not_stated' && c.quote);
  return { ...relocate(b), ...(ns ? { relocNote: ns } : {}), ...(relocPromise(xb, holder, stop, part) ? { promise: relocPromise(xb, holder, stop, part) } : {}) };
}

// Channel shown in a lane cell: best of the border state and the carried copy (live > partial > carried > scheduled > none found).
function channel(border, carried) {
  const b = border.state;
  if (b === 'live' || b === 'partial') return { state: b, year: null, copy: carried };
  if (carried === 'yes' || carried === 'partial') return { state: carried === 'yes' ? 'carried' : 'carried_partial', year: null, notch: b === 'unknown', copy: carried, relocation: b === 'unknown' && !!border.relocation, promise: (b === 'unknown' && border.promise) || null };
  if (b === 'unknown') return { state: 'unknown', year: null, copy: carried, relocation: !!border.relocation, promise: border.promise || null };
  return { state: b, year: border.year, copy: carried, copyUnknown: carried === 'unknown', byDesign: !!border.byDesign };
}

// Holders per stop. visiting: the current home. moved: every earlier place lived in (the new home joins from the next stop).
// return (a visiting stop at the original home, or back where the person now lives): every other place visited or lived in;
// write-back joins as a side.
// A holder is never the stop itself: a piece of the record held where the person now is crosses no border.
function holdersFor(route) {
  const lived = [route.home];
  const seen = [];
  return route.stops.map((s, i) => {
    let holders, kind;
    const from = lived[lived.length - 1];
    if (s.mode === 'moved') { holders = lived.slice(); kind = 'moved'; lived.push(s.iso3); }
    else if ((s.iso3 === route.home || s.iso3 === from) && i > 0) { holders = [...lived, ...seen]; kind = 'return'; }
    else { holders = [from]; kind = 'visiting'; }
    seen.push(s.iso3);
    holders = [...new Set(holders)].filter(x => x !== s.iso3);
    return { ...s, holders, kind, from };
  });
}

function deriveRoute(xb, route, opts = {}) {
  const relocation = opts.relocation !== false;
  const writeBack = { state: 'unknown', iso3: route.home, dir: 'writeBack', why: 'not in our data' };
  return holdersFor(route).map(stop => {
    const cells = {};
    for (const part of PART_KEYS) {
      cells[part] = stop.holders.map(h => {
        const a = sideState(xb, h, part, 'send'), b = sideState(xb, stop.iso3, part, 'recv');
        const sides = stop.kind === 'return' ? [a, b, writeBack] : [a, b];
        let border = borderState(sides, otherLive(xb, h, stop.iso3, part).length > 0);
        if (stop.kind === 'moved' && relocation) border = relocateWith(xb, h, stop.iso3, part, border);
        const car = carriedPart(carriedOf(xb, h), part);
        return { holder: h, send: a, recv: b, border, carried: car, ch: channel(border, car), ehds: a.eu === true && b.eu === true ? (EHDS_EARLY.has(part) ? a.year || ehdsOf(xb.countries[h]).early : ehdsOf(xb.countries[h]).late) : (a.eu === 'unknown' || b.eu === 'unknown') && a.eu !== false && b.eu !== false ? 'unverified' : null };
      });
    }
    // Movers between EU countries: the dated right, only where the part does not already arrive by itself.
    if (stop.kind === 'moved') for (const part of PART_KEYS) for (const c of cells[part]) {
      if (c.ch.state === 'live' || c.ch.state === 'partial') continue;
      const rt = rightOf(xb, c.holder, stop.iso3, part); if (rt) c.right = rt;
    }
    return { ...stop, cells, counts: countStop(cells, stop) };
  });
}
// The years of the right at one stop, with the parts each covers (for the column note, the panel and the key).
function rightsAt(st) {
  const by = {};
  for (const p of PART_KEYS) for (const c of st.cells[p]) if (c.right) (by[c.right.year] = by[c.right.year] || new Set()).add(p);
  return Object.keys(by).sort().map(y => ({ year: +y, parts: PART_KEYS.filter(p => by[y].has(p)) }));
}
function rightSentence(st) {
  const rs = rightsAt(st); if (!rs.length) return '';
  const list = xs => xs.length > 2 ? `${xs.slice(0, -1).join(', ')}, and ${xs.at(-1)}` : joinAnd(xs);
  const names = ps => ps.length === 5 ? 'every part of your record' : list(ps.map(p => PANEL_NAME[p]));
  return `From ${rs[0].year}, EU law gives you a right to ask for your ${names(rs[0].parts)} to be sent here${rs[1] ? `; from ${rs[1].year}, for your ${names(rs[1].parts)}` : ''}. That is a right in law; it does not move a record today.`;
}

// Counts under a column (design 3.4 and pitfall 2). Live and partial count by system; carried never does; unknown never counts as a break.
function countStop(cells, stop) {
  const k = stop.holders.length;
  const full = PART_KEYS.filter(p => cells[p].every(c => c.ch.state === 'live' || c.ch.state === 'partial'));
  const fullLive = PART_KEYS.filter(p => cells[p].every(c => c.ch.state === 'live')).length;
  const all = PART_KEYS.flatMap(p => cells[p]);
  const sysCells = all.filter(c => c.border.state === 'live' || c.border.state === 'partial').length;
  const sysUnk = c => c.border.state === 'unknown'; // the system channel; a copy beside it does not make it known
  const unknownCells = all.filter(sysUnk).length;
  const holdersReached = stop.holders.filter((h, i) => PART_KEYS.some(p => ['live', 'partial'].includes(cells[p][i].ch.state))).length;
  const copyParts = PART_KEYS.filter(p => cells[p].some(c => c.ch.state === 'carried' || c.ch.state === 'carried_partial') && !cells[p].every(c => c.ch.state === 'live' || c.ch.state === 'partial')).length;
  const copyUnknown = all.every(c => c.carried === 'unknown');
  const copyCells = all.filter(c => c.ch.state === 'carried' || c.ch.state === 'carried_partial').length;
  return { bySystem: full.length, partial: full.length - fullLive, unknownParts: PART_KEYS.filter(p => cells[p].some(sysUnk)).length, unknownCells, cells: all.length, holders: k, holdersReached, sysCells, copy: copyParts, copyCells, copyUnknown };
}

// Base rate (design 3.5, rule 11): EU 27 ordered pairs, visiting, after normalisation.
function baseRate(xb) {
  const eu = Object.keys(xb.countries).filter(i => ehdsOf(xb.countries[i]).applies === true).sort();
  let pairs = 0, live = 0, states = 0, unknown = 0, states5 = 0, unknown5 = 0;
  for (const a of eu) for (const b of eu) {
    if (a === b) continue; pairs++;
    for (const part of PART_KEYS) {
      const bs = borderState([sideState(xb, a, part, 'send'), sideState(xb, b, part, 'recv')], otherLive(xb, a, b, part).length > 0);
      states5++; if (bs.state === 'unknown') unknown5++;
      if (part === 'summary' || part === 'prescriptions') { states++; if (bs.state === 'unknown') unknown++; }
      if (part === 'summary' && bs.state === 'live') live++;
    }
  }
  return { nEU: eu.length, pairs, live, states, unknown, unknownPct: Math.round(100 * unknown / states), states5, unknown5, unknown5Pct: Math.round(100 * unknown5 / states5) };
}

// ---------------------------------------------------------------------------------------------
// 3. Cost evidence (design 3.6): verbatim from EVIDENCE.md, scope-labelled, one per lane at its first break, never multiplied.
// ---------------------------------------------------------------------------------------------
const EVIDENCE = [
  { id: 'ia-rx', lane: 'prescriptions', scope: 'EU', where: 'eu-leg',
    figure: '46%', unit: 'non-dispensation rate',
    quote: 'almost 8 million cross-border prescriptions are presented for dispensation per year in EU, with a non-dispensation rate of 46%, which could generate up to EUR 240 million in unnecessary costs yearly',
    caveat: 'a low response rate of 158 pharmacists across 5 countries',
    label: 'EU-wide estimate · 2022', method: 'estimate from an impact assessment',
    cite: 'European Commission (2022), SWD(2022) 131 final, Part 1/4, p. 25', url: 'https://health.ec.europa.eu/system/files/2022-05/ehealth_ehds_2022ia_1_en_0.pdf' },
  { id: 'stoney', lane: 'summary', scope: 'USA', where: 'return-home',
    figure: '67%', unit: 'sought follow-up care at home',
    quote: '67% sought follow-up care in the US',
    caveat: '517 of 93,492 respondents (0.55%) travelled abroad for planned care in 2016',
    label: 'One country · United States · 2016', method: 'survey',
    cite: 'Stoney RJ, Kozarsky P, Walker AT, Gaines J (2022), Infect Control Hosp Epidemiol 43(7):870-875', url: 'https://doi.org/10.1017/ice.2021.245' },
];
// EVIDENCE.md's do-not-use list, as the strings that would betray a breach (tested).
const DO_NOT_USE = ['1,167,427', '14 billion', '2,478', '11 billion', '1.78 million', '81 billion', '77.8 billion', '42 billion', 'England C'];

function evidenceNotes(xb, derived, route) {
  const notes = [];
  const nonEU = route.stops.some(s => ehdsOf(xb.countries[s.iso3]).applies !== true) || ehdsOf(xb.countries[route.home]).applies !== true;
  for (const e of EVIDENCE) {
    let col = -1;
    derived.forEach((s, i) => {
      if (col >= 0) return;
      const cells = s.cells[e.lane];
      const broken = cells.some(c => c.ch.state === 'scheduled' || c.ch.state === 'none_found');
      if (!broken) return;
      if (e.where === 'eu-leg' && s.kind !== 'return' && cells.some(c => (c.ch.state === 'scheduled' || c.ch.state === 'none_found') && c.send.eu === true && c.recv.eu === true)) col = i;
      if (e.where === 'return-home' && s.kind === 'return' && route.home === e.scope) col = i;
    });
    if (col >= 0) notes.push({ ...e, col, scopeNote: e.scope === 'EU' && nonEU ? 'applies to the EU legs of this trip' : '' });
  }
  return notes;
}

// ---------------------------------------------------------------------------------------------
// 4. Rendering helpers
// ---------------------------------------------------------------------------------------------
const G = { label: 150, col: 120, pad: 6, laneH: 26, gap: 6, head: 58 };
G.inner = G.col - 2 * G.pad;
const laneY = i => G.head + i * (G.laneH + G.gap);
const BAND_H = laneY(5) - G.gap; // data area 5 x 26 + 4 x 6 = 154 px below the heads

// Lane marks (design 3.3, Tufte seat 2 Oct): shape carries every state; no text ever sits inside a cell.
// unknown with relocation: "live for a visitor; not known for a person who moved" = dashed outline + 2 px rule on the top edge.
function cellMarks(x, y, w, ch, attrs, h = G.laneH) {
  const a = attrs, o = `x="${r2(x + .5)}" y="${r2(y + .5)}" width="${r2(w - 1)}" height="${h - 1}"`;
  switch (ch.state) {
    case 'live': return `<rect class="f live" ${a} x="${r2(x)}" y="${y}" width="${r2(w)}" height="${h}" fill="${SYS}"/>`;
    case 'partial': return `<rect ${a} ${o} fill="none" stroke="${SYS}"/><rect class="f partial" ${a} x="${r2(x)}" y="${y}" width="${r2(w / 2)}" height="${h}" fill="${SYS}"/>`;
    case 'carried': return `<rect class="f carried" ${a} ${o} fill="${CARRIED}" stroke="${SYS}"/>${ch.relocation ? `<rect class="reloc-rule" x="${r2(x)}" y="${y}" width="${r2(w)}" height="3" fill="${SYS}"/><rect class="reloc-gap" x="${r2(x)}" y="${y + 3}" width="${r2(w)}" height="1" fill="#FFFFFF"/>` : ''}${ch.notch ? `<path d="M${r2(x + w - 6)} ${y + .5}h5.5v5.5z" fill="${UNK}"/>` : ''}`;
    case 'carried_partial': return `<rect ${a} ${o} fill="none" stroke="${SYS}"/><rect class="f carried-partial" ${a} x="${r2(x)}" y="${y}" width="${r2(w / 2)}" height="${h}" fill="${CARRIED}"/>`;
    case 'scheduled': return ch.year ? `<rect class="o scheduled" ${a} ${o} fill="none" stroke="${SYS}"/>` : `<rect class="o scheduled planned" ${a} ${o} fill="none" stroke="${SYS}" stroke-dasharray="6 3"/>`;
    case 'unknown': return `<rect class="o unknown${ch.relocation ? ' reloc' : ''}" ${a} ${o} fill="none" stroke="${UNK}" stroke-dasharray="2 2"/>${ch.relocation ? `<rect class="reloc-rule" x="${r2(x)}" y="${y}" width="${r2(w)}" height="3" fill="${SYS}"/><rect class="reloc-gap" x="${r2(x)}" y="${y + 3}" width="${r2(w)}" height="1" fill="#FFFFFF"/>` : ''}`;
    default: return `<rect class="o none" ${a} x="${r2(x)}" y="${y}" width="${r2(w)}" height="${h}" fill="none"/>`; // none found: the gap is the mark
  }
}
const markKey = ch => ch.state === 'carried' && ch.notch && ch.relocation ? 'carried_reloc' : ch.state === 'carried' && ch.notch ? 'carried_notch' : ch.state === 'unknown' && ch.relocation ? 'reloc' : ch.state === 'scheduled' && !ch.year ? 'planned' : ch.state === 'carried_partial' ? 'carried' : ch.state;

const chWords = ch => ch.state === 'scheduled' ? (ch.year ? `not yet; ${WD.lawBy(ch.year)}` : `not yet; ${WD.planned}`) : STATE_WORDS[ch.state];
const STATE_WORDS = {
  live: WD.arrives, partial: 'partly arrives by itself', carried: WD.copy, carried_partial: `${WD.copy} of part of it`,
  scheduled: 'not yet', none_found: WD.none, unknown: WD.unknown,
};

// One count line per column (13 px): by system of 5 parts, then not known, always together (a zero never stands alone).
const sysText = (n, k = 1) => k > 1 ? `${n.sysCells} of ${n.cells} pieces` : `${n.bySystem} of 5 parts`;
const arriveText = (n, k = 1) => k > 1 ? `${n.sysCells} of ${n.cells} pieces arrive` : `${n.bySystem} of 5 arrive`;
const unkText = (n, k) => k > 1 ? `${n.unknownCells} of ${n.cells} pieces` : `${n.unknownParts} of 5 parts`;
const relocText = st => `${relocCount(st)} of ${st.counts.cells} ${st.holders.length > 1 ? 'pieces' : 'parts'}`;
const copyText = (n, k) => n.copyUnknown ? 'not known' : k > 1 ? `${n.copyCells} of ${n.cells} pieces` : `${n.copy} of 5 parts`;
const countLine = (st) => { const n = st.counts, k = st.holders.length; return `${arriveText(n, k)} · ${unkText(n, k)} not known${st.kind === 'moved' ? ` · ${relocCount(st)} if visiting` : ''}`; };
const relocCount = st => PART_KEYS.reduce((a, p) => a + st.cells[p].filter(c => c.border.state === 'unknown' && c.border.relocation).length, 0);
const allNone = st => PART_KEYS.every(p => st.cells[p].every(c => c.ch.state === 'none_found'));
function ehdsLine(st) {
  const law = PART_KEYS.some(p => st.cells[p].some(c => typeof c.ehds === 'number'));
  if (law) return '';
  return PART_KEYS.some(p => st.cells[p].some(c => c.ehds === 'unverified')) ? 'EU law: not checked' : 'Not under EU law';
}

// One band: home column plus one column per stop. Rows under the lanes appear only where they vary (Tufte seat item 5).
function renderBand(xb, data, route, derived, notes, id, opts = {}) {
  const ncol = derived.length + 1;
  const W = G.label + ncol * G.col;
  const moved = derived.some(st => st.kind === 'moved');
  const showCopy = !derived.every(st => st.counts.copyUnknown);
  const noLaw = !!opts.noLaw;
  const R = { cnt: BAND_H + 22 }; let y = R.cnt;
  R.unk = (y += 18);
  if (moved) R.reloc = (y += 18);
  if (showCopy) R.copy = (y += 18);
  R.ehds = (y += 24);   // a little air above the EU law row, so it reads as its own variable (Tufte seat, 2 Oct)
  const home = data[route.home];
  // Journey markers start below the last count row, so no row label reads across into them (Tufte seat, 2 Oct);
  // their key (the states seen at this home) sits under them, in the home column.
  const lawRow = !noLaw && derived.some(st => (st.kind === 'moved' && rightsAt(st).length) || ehdsLine(st));
  // ...and below the EU law row when there is one, so 'EU law' never reads across into 'care at home' (QA, 2 Oct)
  const jHead = (lawRow ? R.ehds : showCopy ? R.copy : moved ? R.reloc : R.unk) + 22, jTop = jHead + 6;
  const jSeen = ['connected', 'partial', 'siloed', 'unknown'].filter(st => JOURNEY.some(([k]) => ((home.journey || {})[k] || 'unknown') === st));
  const jKey = jTop + 7 * 14 + 8;
  const H = Math.max(y + 26, jKey + jSeen.length * 13 + 4);
  let s = '';
  // lane guides and lane names; the EU law year per part, right-aligned under the head "EU law by"
  PARTS.forEach((p, i) => {
    const ly = laneY(i);
    s += `<line x1="${G.label}" x2="${W}" y1="${ly - .25}" y2="${ly - .25}" stroke="${GUIDE}" stroke-width=".5"/><line x1="${G.label}" x2="${W}" y1="${ly + G.laneH + .25}" y2="${ly + G.laneH + .25}" stroke="${GUIDE}" stroke-width=".5"/>`;
    s += `<text class="lane" x="0" y="${ly + 17}">${esc(p.f)}</text><text class="yr n" x="${G.label - 8}" y="${ly + 17}" text-anchor="end">${opts.years && !noLaw ? opts.years[p.k] : ''}</text>`;
  });
  if (!noLaw) s += `<text class="lab" x="${G.label - 8}" y="${G.head - 8}" text-anchor="end">EU law from</text>`;
  const rowLabel = (yy, t, cls = 'lab') => `<text class="${cls}" x="${G.label - 8}" y="${yy}" text-anchor="end">${numS(t)}</text>`;
  s += rowLabel(R.cnt, 'arrives by itself') + rowLabel(R.unk, 'not known');
  if (moved) s += rowLabel(R.reloc, 'would arrive on a visit', 'lab sys');
  if (showCopy) s += rowLabel(R.copy, WD.copy);
  if (lawRow) s += rowLabel(R.ehds, 'EU law');
  // border lines between stops (the only gridlines)
  for (let c = 1; c <= ncol; c++) s += `<line x1="${G.label + c * G.col}" x2="${G.label + c * G.col}" y1="4" y2="${H - 4}" stroke="${RULE}" stroke-width=".5"/>`;
  // home column
  const hx = G.label + G.pad;
  s += `<text class="head" x="${hx}" y="18">${esc(home.name)}</text><text class="mode" x="${hx}" y="34">home</text>`;
  PARTS.forEach((p, i) => { s += cellMarks(hx, laneY(i), G.inner, { state: 'live' }, `data-band="${id}" data-col="0" data-lane="${p.k}" data-unit="${G.inner}"`); });
  s += `<text class="cnt" x="${hx}" y="${R.cnt}">${numS('5 of 5')} <tspan class="sub">held at home</tspan></text>`;
  s += `<text class="jh" x="${hx}" y="${jHead}">care at home</text>`;
  JOURNEY.forEach(([k, n], i) => {
    const jy = jTop + i * 14;
    s += `<g transform="translate(${hx} ${jy})">${journeyMarker((home.journey || {})[k] || 'unknown', 10, true)}</g><text class="jl" x="${hx + 15}" y="${jy + 9}">${esc(n)}</text>`;
  });
  jSeen.forEach((st, i) => { const jy = jKey + i * 13; s += `<g transform="translate(${hx} ${jy})">${journeyMarker(st, 8, true)}</g><text class="jk" x="${hx + 13}" y="${jy + 7}">${JWORDS[st]}</text>`; });
  // stop columns
  derived.forEach((st, ci) => {
    const x0 = G.label + (ci + 1) * G.col, cx = x0 + G.pad;
    const k = st.holders.length, unit = G.inner / k;
    const [l1, l2] = splitName(data[st.iso3].name);
    s += `<text class="head" x="${cx}" y="18">${numS(String(ci + 1))} ${esc(l1)}</text>${l2 ? `<text class="head" x="${cx}" y="34">${esc(l2)}</text>` : ''}<text class="mode" x="${cx}" y="${l2 ? 49 : 34}">${esc(st.kind === 'return' ? 'back home' : st.kind === 'moved' ? 'moved here' : st.kind)}${st.iso3 === 'USA' ? ', US-wide' : ''}</text>`;
    PARTS.forEach((p, li) => {
      st.cells[p.k].forEach((c, hi) => {
        s += cellMarks(cx + hi * unit, laneY(li), unit, c.ch, `data-band="${id}" data-col="${ci + 1}" data-lane="${p.k}" data-holder="${c.holder}" data-unit="${r2(unit)}" data-k="${k}"`);
      });
      if (k > 1) for (let hi = 1; hi < k; hi++) s += `<line x1="${r2(cx + hi * unit)}" x2="${r2(cx + hi * unit)}" y1="${laneY(li)}" y2="${laneY(li) + G.laneH}" stroke="#FFFFFF" stroke-width="1"/>`;
    });
    if (allNone(st)) s += `<text class="nf" x="${x0 + G.col / 2}" y="${G.head + BAND_H / 2 + 4}" text-anchor="middle">none found</text>`;
    const n = st.counts;
    s += `<text class="cnt" x="${cx}" y="${R.cnt}">${numS(sysText(n, k))}</text><text class="cnt unk" x="${cx}" y="${R.unk}">${numS(unkText(n, k))}</text>`;
    if (moved) s += `<text class="cnt sys" x="${cx}" y="${R.reloc}">${numS(relocText(st))}</text>`;
    if (showCopy) s += `<text class="cnt copy" x="${cx}" y="${R.copy}">${n.copyUnknown ? '<tspan class="sub">not known</tspan>' : numS(copyText(n, k))}</text>`;
    const rs = st.kind === 'moved' ? rightsAt(st) : [];
    if (rs.length && !noLaw) s += `<text class="ehds right" x="${cx}" y="${R.ehds}">EU right to ask</text>`;   // the years sit beside each part, left
    const el = noLaw || rs.length ? '' : ehdsLine(st);
    if (el) { const cut = el.length > 19 ? el.lastIndexOf(' ', 19) : -1, [e1, e2] = cut > 0 ? [el.slice(0, cut), el.slice(cut + 1)] : [el, '']; s += `<text class="ehds" x="${cx}" y="${R.ehds}">${esc(e1)}</text>${e2 ? `<text class="ehds" x="${cx}" y="${R.ehds + 13}">${esc(e2)}</text>` : ''}`; }
  });
  // sidenote numerals inside the right edge of the cell they belong to (column right edge minus 10 px)
  for (const nt of notes) {
    const li = PART_KEYS.indexOf(nt.lane), x = G.label + (nt.col + 2) * G.col - 10;
    s += `<text class="sn n" x="${x}" y="${laneY(li) + 11}" text-anchor="end">${nt.num}</text>`;
  }
  return { svg: `<svg class="band" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-hidden="true" focusable="false">${s}</svg>`, W, H };
}

// Phone (design 4.4, Tufte seat item 9): the band turned 90 degrees. Stops run down the page, the five parts across:
// 70 px labels + 5 x 56 px columns = 350 px inside 358. Each holder is a 10 px sub-row with a 2 px gap.
function renderPhone(data, route, derived, notes, years, noLaw = false) {
  const LW = 70, CW = 56, SUB = 10, SG = 2, W = LW + 5 * CW, HEAD = 26;
  let s = '', y = HEAD;
  PARTS.forEach((p, i) => { const x = LW + i * CW + 3; s += `<text class="ph" x="${x}" y="10">${esc(p.s)}</text><text class="py n" x="${x}" y="21">${noLaw ? '' : years[p.k] || ''}</text>`; });
  const rows = [{ name: data[route.home].name, mode: 'home', home: true }, ...derived.map((st, i) => ({ st, name: `${i + 1} ${data[st.iso3].name}`, mode: st.kind === 'return' ? 'back home' : st.kind, idx: i }))];
  for (const r of rows) {
    const k = r.home ? 1 : r.st.holders.length, cellsH = k * SUB + (k - 1) * SG, rowH = Math.max(cellsH + (r.home ? 0 : 14), splitName(r.name)[1] ? 34 : 22) + 10;
    s += `<line x1="0" x2="${W}" y1="${y - 4}" y2="${y - 4}" stroke="${RULE}" stroke-width=".5"/>`;
    const [l1, l2] = splitName(r.name);
    s += `<text class="pn" x="0" y="${y + 8}">${numS(l1)}</text>${l2 ? `<text class="pn" x="0" y="${y + 20}">${esc(l2)}</text>` : ''}<text class="pm" x="0" y="${y + (l2 ? 31 : 19)}">${esc(r.mode)}</text>`;
        PARTS.forEach((p, li) => {
      const x = LW + li * CW + 3, w = CW - 6;
      if (r.home) s += cellMarks(x, y, w, { state: 'live' }, `data-lane="${p.k}"`, SUB);
      else r.st.cells[p.k].forEach((c, hi) => {
        const cy = y + hi * (SUB + SG);
        if (c.ch.state === 'none_found') s += `<line x1="${x}" x2="${x + w}" y1="${cy + .25}" y2="${cy + .25}" stroke="${GUIDE}" stroke-width=".5"/><line x1="${x}" x2="${x + w}" y1="${cy + SUB - .25}" y2="${cy + SUB - .25}" stroke="${GUIDE}" stroke-width=".5"/>`;
        s += cellMarks(x, cy, w, c.ch, `data-lane="${p.k}"`, SUB);
      });
    });
    // drawn after the guides, on a white halo, so no guide strikes through the label
    if (!r.home && allNone(r.st)) s += `<text class="pm nfp" x="${LW + 2.5 * CW}" y="${y + Math.min(cellsH, 60) / 2 + 3}" text-anchor="middle" stroke="#FFFFFF" stroke-width="3" paint-order="stroke">none found</text>`;
    if (!r.home) s += `<text class="pc" x="${LW + 3}" y="${y + cellsH + 11}">${numS(countLine(r.st))}</text>`;
    const prs = !r.home && !noLaw && r.st.kind === 'moved' ? rightsAt(r.st) : [];
    if (prs.length) s += `<text class="pc right" x="${LW + 3}" y="${y + cellsH + 23}">EU right to ask, from ${prs.map(x => x.year).join(' and ')}</text>`;
    y += rowH + (prs.length ? 12 : 0);
  }
  return `<svg class="phone" viewBox="0 0 ${W} ${y}" width="${W}" height="${y}" aria-hidden="true" focusable="false">${s}</svg>`;
}


function joinAnd(xs) { return xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs.at(-1)}`; }
const pct = (a, b) => Math.round(100 * a / b);

function journeyCoverage(data) {
  let n = 0, u = 0;
  for (const d of Object.values(data)) for (const v of Object.values(d.journey || {})) { n++; if (v === 'unknown') u++; }
  return { n, u, pct: pct(u, n) };
}

const JOURNEY = [['primaryCare', 'Primary care'], ['hospital', 'Hospital'], ['labs', 'Labs'], ['pharmacy', 'Pharmacy'], ['claims', 'Insurance claims'], ['publicHealth', 'Public health'], ['research', 'Research']];
function journeyMarker(state, size = 14, asGroup = false) {
  const c = SYS;
  const body = state === 'connected' ? `<circle cx="7" cy="7" r="5.5" fill="${c}"/>`
    : state === 'partial' ? `<circle cx="7" cy="7" r="5" fill="#FFFFFF" stroke="${c}" stroke-width="1"/><path d="M7 2 A5 5 0 0 0 7 12 Z" fill="${c}"/>`
    : state === 'siloed' ? `<circle cx="7" cy="7" r="5" fill="#FFFFFF" stroke="${c}" stroke-width="1"/>`
    : `<circle cx="7" cy="7" r="5" fill="#FFFFFF" stroke="${UNK}" stroke-width="1" stroke-dasharray="2 2"/>`;
  return asGroup ? `<g transform="scale(${r2(size / 14)})">${body}</g>` : `<svg width="${size}" height="${size}" viewBox="0 0 14 14" aria-hidden="true">${body}</svg>`;
}

function stopFrom(data, st, home) {
  const nm = i => theName(data[i].name);
  return st.kind === 'moved' ? (st.iso3 === home ? `moved back home from ${nm(st.from)}` : `moved from ${nm(st.from)}`) : st.kind === 'return' ? `back home from ${joinAnd(st.holders.map(nm))}` : `visiting from ${nm(st.from)}`;
}
function stopSentence(st, data) {
  const n = st.counts, k = st.holders.length, nm = i => theName(data[i].name);
  const unk = k > 1 ? n.unknownCells : n.unknownParts, tot = k > 1 ? n.cells : 5, unit = k > 1 ? 'pieces' : 'parts';
  const unkTxt = unk ? ` For ${ofAll(unk, tot, unit)}, ${WD.noSource}.` : '';
  const copy = copyLine(n, k), arrive = x => `${x} of the 5 parts of your record ${x === 1 ? 'reaches' : 'reach'} a doctor here by ${x === 1 ? 'itself' : 'themselves'}.`;
  if (st.kind === 'return') {
    const from = joinAnd(st.holders.map(nm));
    if (n.unknownCells === n.cells) return `No source says whether the care you had in ${from} reaches your doctor here. ${copy}`;
    if (!n.bySystem) return `${n.unknownCells ? `No source shows any of the care you had in ${from} reaching your doctor here by itself.` : `We found no part of the care you had in ${from} that reaches your doctor here by itself.`}${unkTxt} ${copy}`;
    return `${n.bySystem} of the 5 parts of the care you had in ${from} ${n.bySystem === 1 ? 'reaches' : 'reach'} your doctor here by ${n.bySystem === 1 ? 'itself' : 'themselves'}.${unkTxt} ${copy}`;
  }
  if (k > 1) {
    const lead = `Parts of your record are now held in ${k} countries.`;
    if (!n.holdersReached) return `${lead} ${n.unknownCells ? 'No source shows any of them sending a part to a doctor here.' : 'We found none of them sending a part to a doctor here.'}${unkTxt} ${copy}`;
    return `${lead} ${n.holdersReached} of them ${n.holdersReached === 1 ? 'sends' : 'send'} a part to a doctor here, and your whole history arrives for ${n.bySystem} of the 5 parts.${unkTxt} ${copy}`;
  }
  if (!n.bySystem) return unk ? `No source shows any part of your record reaching a doctor here from ${nm(st.holders[0])}.${unkTxt} ${copy}` : `We found no part of your record that reaches a doctor here by itself. ${copy}`;
  return `${arrive(n.bySystem)}${unkTxt} ${copy}`;
}
// Dates in tables as a reader writes them: 4 May 2016, May 2016, or "no date given".
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
function longDate(d) {
  const m = /^(\d{4})-(\d{2})(?:-(\d{2}))?/.exec(String(d || ''));
  if (!m) return d && !/undated/.test(d) ? String(d) : 'no date given';
  return `${m[3] ? `${+m[3]} ` : ''}${MONTHS[+m[2] - 1]} ${m[1]}`;
}
// The copy right, named once per table in plain words.
function copyRightName(src) {
  const t = `${src.title || ''} ${src.url || ''}`;
  if (/2016\/679/.test(t)) return 'EU data protection law (GDPR), 2016';
  if (/164\.524/.test(t)) return 'US health privacy law (HIPAA), 45 CFR 164.524';
  return shortPub(src.title);
}

function stopTable(xb, data, route, st, i, fig = 0) {
  const nm = i => data[i].name;
  const from = stopFrom(data, st, route.home);
  const n = st.counts, k = st.holders.length;
  const sentence = stopSentence(st, data);
  const when = s => numH(longDate(s.date));
  const src = s => s && s.url ? `<a href="${esc(s.url)}" rel="noopener">${esc(s.title || s.url)}</a> <span class="d">${when(s)}</span>` : s ? `${esc(s.title)} <span class="d">${when(s)}</span>` : 'not in our data';
  const sideWord = sd => sd.state === 'live' ? 'yes' : sd.state === 'partial' ? 'in part' : sd.state === 'scheduled' ? (sd.year ? `not yet; ${WD.lawBy(sd.year)}` : `not yet; ${WD.planned}`) : sd.state === 'unknown' ? WD.unknown : 'no';
  const side = (sd, who) => `${esc(cap(theName(nm(sd.iso3))))} ${who}: ${numH(sideWord(sd))}${sd.why && !(sd.state === 'scheduled' && /^(planned|not live)$/.test(sd.why)) ? ` (${esc(sd.why)})` : ''}`;
  const note3 = '(<a href="#note-3">note 3</a>)';
  const rows = PARTS.map(p => st.cells[p.k].map((c, hi) => {
    const ch = c.ch;
    let words = numH(chWords(ch));
    if (ch.state === 'none_found') words += ` (as of ${numH(longDate(xb.meta.as_of))})`;
    if (c.border.relocation && !c.border.byDesign) {
      // One pattern for every row (Tufte seat, 2 Oct): how it gets there today, then "; " and what qualifies it.
      words = `${ch.state === 'carried' || ch.state === 'carried_partial' ? `${WD.copy}; by itself: arrives on a visit, not known after a move` : 'not known after a move; arrives on a visit'} ${note3}`;
      if (c.border.promise) words += `; from ${numH(longDate(c.border.promise.date))}, EU law gives you the right to ask for it to be sent`;
    }
    if (c.border.byDesign) words += `; the service is for visitors and does not follow a person who moves (${esc(data[c.border.relocBy].name)})`;
    if (ch.notch && !c.border.relocation) words += `; by itself: ${WD.unknown}`;
    if (c.right && !c.border.promise) words += `; from ${numH(longDate(c.right.date))}, EU law gives you the right to ask for it to be sent`;
    const via = `${side(c.send, 'sends')}; ${side(c.recv, 'receives')}${st.kind === 'return' ? '; your home record taking it in: not known' : ''}`;
    const law = typeof c.ehds === 'number' ? numH(String(c.ehds)) : c.ehds === 'unverified' ? 'not checked' : 'does not apply';
    const sources = [c.send.source, c.recv.source].filter(Boolean);
    const lawSrc = [c.send.source && c.send.source.law, c.recv.source && c.recv.source.law].find(Boolean);
    return `<tr>${hi === 0 ? `<th scope="row" rowspan="${k}">${esc(p.n)}</th>` : ''}<td data-l="Kept in">${esc(theName(nm(c.holder)))}</td><td data-l="How it gets there today">${words}<div class="via">${via}</div></td><td data-l="EU law from">${law}</td><td class="src" data-l="Source (date)">${sources.map(src).join('<br>')}${lawSrc ? `<br>EU law: ${src(lawSrc)}` : ''}${c.border.byDesign && c.border.relocSource ? `<br>Moving: ${src(c.border.relocSource)}` : ''}${c.border.relocNote && c.border.relocNote.source ? `<br>Moving: ${src(c.border.relocNote.source)}` : ''}${c.border.promise && c.border.promise.source ? `<br>EU law, for people who move: ${src(c.border.promise.source)}` : ''}</td></tr>`;
  }).join('')).join('');
  // The copy right, once per table, as a footnote.
  const rights = [...new Map(st.holders.map(h => carriedOf(xb, h)).filter(c => c.state !== 'unknown' && c.source).map(c => [copyRightName(c.source), c.source])).entries()];
  const foot = rights.length ? `<p class="tfoot">Your right to a copy: ${rights.map(([name, sx]) => sx.url ? `<a href="${esc(sx.url)}" rel="noopener">${esc(name)}</a>` : esc(name)).join('; ')}.</p>` : '';
  return `<li id="f${fig + 1}-s${i + 1}"><section><h3>Stop ${i + 1}, ${esc(theName(nm(st.iso3)))}${st.iso3 === 'USA' ? ' (national rules only)' : ''}, ${esc(from)}</h3><p>${numH(sentence)}</p>
<table><caption class="vh">Stop ${i + 1}: each part of the record, where it is kept, how it gets there today, and the source</caption><thead><tr><th scope="col">Part of record</th><th scope="col">Kept in</th><th scope="col">How it gets there today</th><th scope="col">EU law from</th><th scope="col">Source (date)</th></tr></thead><tbody>${rows}</tbody></table>${foot}</section></li>`;
}

function columnSources(xb, data, route, derived, W, showCopy = true) {
  // One line under every column: the stop's own receive source for the summary and the copy channel.
  const cells = derived.map(st => {
    const c = st.cells.summary[0];
    const s = c.recv.source;
    const car = carriedOf(xb, st.holders[0]);
    const recv = s && s.url ? `<a href="${esc(s.url)}" rel="noopener" title="${esc(s.title)}">${esc(shortPub(s.title))}</a> ${numH(s.date)}` : `<span title="${esc(s && s.title || '')}">${esc(shortPub(s && s.title || ''))}</span>`;
    if (!showCopy) return `<div>${recv}</div>`;
    const carLabel = car.source ? (/164\.524/.test(car.source.title + car.source.url) || car.source.url.includes('164.524') ? '45 CFR 164.524' : shortPub(car.source.title)) : '';
    return `<div>${recv}<br>copy: ${car.source ? `<a href="${esc(car.source.url)}" rel="noopener">${esc(carLabel)}</a> ${numH(car.source.date)}` : 'not in our data'}</div>`;
  });
  return `<div class="colsrc" style="width:${W}px;grid-template-columns:${G.label + G.col}px repeat(${derived.length},${G.col}px)"><div>Sources, by column</div>${cells.join('')}</div>`;
}
function splitName(n) {
  if (n.length <= 11 || !n.includes(' ')) return [n, ''];
  const w = n.split(' '); let a = w.shift();
  while (w.length && (a + ' ' + w[0]).length <= 11) a += ' ' + w.shift();
  return [a, w.join(' ')];
}
function shortPub(t) { const x = String(t).replace(/\s*\(.*?\)\s*/g, ' '); const f = /^(.*?(?:no (?:exchange|source) found|found no (?:link|source)))/.exec(x); return (f ? f[1] : x.replace(/,.*$/, '')).trim(); }

function routeSentence(data, route) {
  const nm = i => theName(data[i].name);
  return `${nm(route.home)}, then ${joinAnd(holdersFor(route).map(s => `${nm(s.iso3)} (${s.kind === 'return' ? 'back home' : s.mode === 'moved' && s.iso3 === route.home ? 'moved back home' : s.mode})`))}`;
}


// The key: one line of small text under each figure, drawn with the real marks, listing only what that figure shows.
const JWORDS = { connected: 'connected', partial: 'partly connected', siloed: 'not shared', unknown: 'not known' };
const KEY_ORDER = ['live', 'partial', 'carried', 'carried_notch', 'carried_reloc', 'scheduled', 'planned', 'reloc', 'unknown', 'none_found'];
const keyMark = (k, w = 30, h = 12) => `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" aria-hidden="true">${k === 'none_found' ? `<rect x=".5" y=".5" width="${w - 1}" height="${h - 1}" fill="none" stroke="#9CA3AF" stroke-width="1" stroke-dasharray="1 2"/>` : /* key only: the blank needs an edge to be seen */ cellMarks(0, 0, w, k === 'carried_notch' ? { state: 'carried', notch: true } : k === 'carried_reloc' ? { state: 'carried', notch: true, relocation: true } : k === 'reloc' ? { state: 'unknown', relocation: true } : k === 'planned' ? { state: 'scheduled', year: null } : { state: k, year: 1 }, '', h)}</svg>`;
// The marks a route really draws, with their words: the figure keys and the wizard's key both come from here.
function keyItems(r) {
  const seen = new Set(['live']), cells = r.derived.flatMap(st => PART_KEYS.flatMap(p => st.cells[p]));
  for (const c of cells) seen.add(markKey(c.ch));
  const pr = cells.find(c => c.ch.promise), law = pr ? `; EU law from ${pr.ch.promise.year}` : '';
  const words = { live: WD.arrives, partial: 'partly arrives by itself', carried: WD.copy, carried_notch: `${WD.copy}; by itself: ${WD.unknown}`, carried_reloc: `${WD.copy}; by itself: arrives on a visit, not known after a move${law}`, scheduled: 'not yet; EU law from the year beside the part', planned: WD.planned, reloc: `${WD.reloc}${law}`, unknown: `${WD.unknown}: ${WD.noSource}`, none_found: `${WD.none} (left blank)` };
  return KEY_ORDER.filter(k => seen.has(k)).map(k => ({ k, words: words[k] }));
}
function keyLine(r) {
  const by = {};
  for (const st of r.derived) if (st.kind === 'moved') for (const x of rightsAt(st)) { by[x.year] = by[x.year] || new Set(); x.parts.forEach(p => by[x.year].add(p)); }
  const yrs = Object.keys(by).sort(), which = y => { const xs = PART_KEYS.filter(p => by[y].has(p)).map(p => PANEL_NAME[p]); return xs.length > 2 ? `${xs.slice(0, -1).join(', ')}, and ${xs.at(-1)}` : joinAnd(xs); };
  const right = yrs.length ? `<span class="kright"><i>EU right to ask</i> under a column: after a move between 2 EU countries, EU law gives you a right to ask for your record to be sent (${yrs.map(y => `${which(y)} from ${y}`).join('; ')}). It is a right in law. The boxes show what happens today.</span>` : '';
  return keyItems(r).map(({ k, words }) => `<span>${keyMark(k)}${esc(words)}</span>`).join('') + right;
}

// ---------------------------------------------------------------------------------------------
// 6. Routes: presets (design 4.1), limits, URL state
// ---------------------------------------------------------------------------------------------
const MAX_STOPS = 8;
const ATHLETE_CLUBS = ['ESP', 'FRA', 'ITA', 'DEU', 'NOR', 'GBR', 'QAT'];
// The athlete's title counts the moves on the actual trip (from Germany, a club country, it is six).
const athleteTitle = n => `An athlete who moves ${numWord(n)} times`;
const ATHLETE = { id: 'athlete', title: athleteTitle(['ESP', 'FRA', 'ITA', 'DEU', 'NOR', 'GBR', 'QAT'].length), home: 'PRT', note: 'a made-up career', stopWord: 'club',
  stops: ATHLETE_CLUBS.map(iso3 => ({ iso3, mode: 'moved' })) };
const USEU = { id: 'us-europe', title: 'From the US to Europe and back', home: 'USA', note: 'a made-up trip',
  stops: [{ iso3: 'FRA', mode: 'visiting' }, { iso3: 'ITA', mode: 'visiting' }, { iso3: 'USA', mode: 'visiting' }] };
const V = iso3 => ({ iso3, mode: 'visiting' }), Mv = iso3 => ({ iso3, mode: 'moved' });
// nb: for each country, its rated neighbours nearest first (shared land border first, then nearest centroid); built at build time.
const firstOther = (list, not) => (list || []).find(x => !not.includes(x));
const VISITOR = { id: 'visitor', title: 'A short trip', home: 'PRT', note: 'a made-up trip',
  stops: [{ iso3: 'ESP', mode: 'visiting' }, { iso3: 'FRA', mode: 'visiting' }, { iso3: 'PRT', mode: 'visiting' }] };
const PRESETS = [
  { id: 'visitor', title: VISITOR.title, note: VISITOR.note, fixedHome: 'PRT', modes: 'visiting two countries, then home',
    build: home => ({ home, stops: [...['ESP', 'FRA'].filter(i => i !== home), home === 'ESP' || home === 'FRA' ? 'PRT' : null].filter(Boolean).slice(0, 2).map(V).concat([V(home)]) }) },
  { id: 'weekend', title: 'A short trip next door', note: 'a made-up trip', fixedHome: null,
    modes: 'visiting a neighbouring country, then home',
    build: (home, nb) => ({ home, stops: [V(firstOther(nb[home], [home])), V(home)] }) },
  { id: 'us-europe', title: USEU.title, note: USEU.note, fixedHome: 'USA', modes: 'visiting two EU countries, then home',
    build: () => ({ home: USEU.home, stops: USEU.stops.map(s => ({ ...s })) }) },
  { id: 'athlete', title: ATHLETE.title, note: ATHLETE.note, fixedHome: null, stopWord: 'club', modes: 'moving to live in a new country with each club',
    build: home => ({ home, stops: ATHLETE_CLUBS.filter(i => i !== home).map(Mv) }) },
  { id: 'student', title: "A student's year abroad", note: 'a made-up person', fixedHome: null,
    modes: 'moved for a year abroad, visiting a neighbour from there, then home',
    build: (home, nb) => { const abroad = home === 'DEU' ? 'FRA' : 'DEU'; return { home, stops: [Mv(abroad), V(firstOther(nb[abroad], [home, abroad])), V(home)] }; } },
  { id: 'seasonal', title: 'A seasonal worker', note: 'a made-up person', fixedHome: null,
    modes: 'moved for a season, moved back home, moved again for a second season, moved back home',
    build: (home, nb) => { const x = firstOther(nb[home], [home]); return { home, stops: [Mv(x), Mv(home), Mv(x), Mv(home)] }; } },
];
const presetById = id => PRESETS.find(p => p.id === id);
function presetRoute(id, home, nb) { const p = presetById(id); const r = p.build(p.fixedHome || home, nb); return { ...r, id: p.id, title: p.id === 'athlete' ? athleteTitle(r.stops.length) : p.title, note: p.note, stopWord: p.stopWord, modes: p.modes }; }
const sameRoute = (a, b) => a.home === b.home && a.stops.length === b.stops.length && a.stops.every((s, i) => s.iso3 === b.stops[i].iso3 && s.mode === b.stops[i].mode);
function namedRoute(route, nb) {
  for (const p of PRESETS) { const r = presetRoute(p.id, route.home, nb); if (sameRoute(r, route)) return r; }
  return { ...route, id: 'custom', title: 'Your own trip', note: 'a trip you built' };
}

// Limits: 1 to 8 stops; a country may appear again only as a return leg (home, or a place the person moved to earlier);
// never the same country twice in a row, and the first stop is not home.
function validateRoute(route, valid) {
  const errs = [];
  if (!valid(route.home)) errs.push('Choose a home country.');
  if (!route.stops.length) errs.push('Add at least one stop.');
  if (route.stops.length > MAX_STOPS) errs.push(`A trip can have up to ${MAX_STOPS} stops.`);
  const lived = new Set([route.home]), seen = new Set([route.home]);
  let prev = route.home, current = route.home;
  route.stops.forEach((s, i) => {
    if (!valid(s.iso3)) errs.push(`Stop ${i + 1}: choose a country.`);
    else if (i === 0 && s.iso3 === route.home) errs.push('Stop 1 is your home country. Choose a country to visit or move to.');
    else if (s.iso3 === prev) errs.push(`Stop ${i + 1} is the same country as stop ${i}. Choose another.`);
    else if (s.mode === 'moved' && s.iso3 === current) errs.push(`Stop ${i + 1}: you already live there.`);
    else if (seen.has(s.iso3) && !lived.has(s.iso3)) errs.push(`Stop ${i + 1}: you can only come back to your home or a place you lived.`);
    seen.add(s.iso3); if (s.mode === 'moved') { lived.add(s.iso3); current = s.iso3; } prev = s.iso3;
  });
  return errs;
}

function encodeRoute(route) { return `r=${route.home}:${route.stops.map(s => s.iso3 + (s.mode === 'moved' ? '.m' : '')).join(',')}`; }
// Reading a shared link: either the whole route parses and passes the limits, or a plain reason comes back. Never a silent truncation.
function readRouteHash(hash, valid) {
  const m = /(?:^|[#&])r=([^&]*)/.exec(String(hash || ''));
  if (!m) return { route: null, problem: null };
  let raw; try { raw = decodeURIComponent(m[1] || ''); } catch (e) { return { route: null, problem: 'the link is damaged' }; }
  const mm = /^([A-Z]{3}):(.+)$/.exec(raw);
  if (!mm) return { route: null, problem: 'the trip in this link could not be read' };
  const toks = mm[2].split(','), bad = toks.find(t => !/^[A-Z]{3}(\.m)?$/.test(t));
  if (bad !== undefined) return { route: null, problem: `"${bad.slice(0, 12)}" is not a country code` };
  const route = { home: mm[1], stops: toks.map(t => ({ iso3: t.slice(0, 3), mode: t.endsWith('.m') ? 'moved' : 'visiting' })) };
  const unknown = [route.home, ...route.stops.map(x => x.iso3)].find(x => !valid(x));
  if (unknown) return { route: null, problem: `${unknown} is not a country we cover` };
  const errs = validateRoute(route, valid);
  return errs.length ? { route: null, problem: errs[0].replace(/\.$/, '') } : { route, problem: null };
}
function decodeRoute(hash, valid) { return readRouteHash(hash, valid).route; }
function readStopHash(hash, N) {
  const m = /[#&]s=([^&]*)/.exec(String(hash || ''));
  if (!m || m[1] === 'end') return { cur: 'end', problem: null };
  const v = /^\d+$/.test(m[1]) ? +m[1] : NaN;
  return v >= 0 && v <= N ? { cur: v, problem: null } : { cur: 'end', problem: `Stop ${String(m[1]).slice(0, 6)} is not on this trip. Showing the last stop.` };
}

// ---------------------------------------------------------------------------------------------
// 7. Locator: Equal Earth, scale 200, centred at 0,0 (the land shape in land.svg is projected the same way at build).
// The route is projected here, in the browser and at build time alike; the land is cropped by a transform.
// ---------------------------------------------------------------------------------------------
const LOC = { W: 200, H: 84, K: 200, padL: 34, padR: 14, padY: 10, zMax: 3 };
function eqEarth(lon, lat) {
  const A1 = 1.340264, A2 = -0.081106, A3 = 0.000893, A4 = 0.003796, M = Math.sqrt(3) / 2;
  const l = lon * Math.PI / 180, p = lat * Math.PI / 180;
  const t = Math.asin(M * Math.sin(p)), t2 = t * t, t6 = t2 * t2 * t2;
  const x = l * Math.cos(t) / (M * (A1 + 3 * A2 * t2 + t6 * (7 * A3 + 9 * A4 * t2)));
  const y = t * (A1 + A2 * t2 + t6 * (A3 + A4 * t2));
  return [LOC.K * x, -LOC.K * y];
}
function greatCircle(a, b, n = 24) {
  const rad = Math.PI / 180, toV = ([lo, la]) => [Math.cos(la * rad) * Math.cos(lo * rad), Math.cos(la * rad) * Math.sin(lo * rad), Math.sin(la * rad)];
  const va = toV(a), vb = toV(b), dot = Math.min(1, Math.max(-1, va[0] * vb[0] + va[1] * vb[1] + va[2] * vb[2])), w = Math.acos(dot);
  if (w < 1e-9) return [a, b];
  const out = [];
  for (let i = 0; i <= n; i++) {
    const f = i / n, s1 = Math.sin((1 - f) * w) / Math.sin(w), s2 = Math.sin(f * w) / Math.sin(w);
    const v = [s1 * va[0] + s2 * vb[0], s1 * va[1] + s2 * vb[1], s1 * va[2] + s2 * vb[2]];
    out.push([Math.atan2(v[1], v[0]) / rad, Math.asin(v[2]) / rad]);
  }
  return out;
}
function locator(route, data, label) {
  const { W, H } = LOC;
  const geo = [route.home, ...route.stops.map(s => s.iso3)].map(i => data[i].pos);
  const P = geo.map(([lo, la]) => eqEarth(lo, la));
  const xs = P.map(p => p[0]), ys = P.map(p => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const iw = W - LOC.padL - LOC.padR, ih = H - 2 * LOC.padY, bw = x1 - x0, bh = y1 - y0;
  const z = r2(Math.min(LOC.zMax, bw ? iw / bw : LOC.zMax, bh ? ih / bh : LOC.zMax));
  const a = r2(LOC.padL + (iw - bw * z) / 2 - x0 * z), b = r2(LOC.padY + (ih - bh * z) / 2 - y0 * z);
  const S = ([x, y]) => [r2(a + x * z), r2(b + y * z)];
  const worldW = 2 * eqEarth(180, 0)[0] * z;
  let legs = '';
  for (let i = 1; i < geo.length; i++) {
    const pts = greatCircle(geo[i - 1], geo[i]).map(([lo, la]) => S(eqEarth(lo, la)));
    let d = '';
    pts.forEach((p, k) => { d += (k === 0 || Math.abs(p[0] - pts[k - 1][0]) > worldW / 2 ? 'M' : 'L') + p[0] + ',' + p[1]; });
    legs += `<path d="${d}"/>`;
  }
  const scr = P.map(S);
  const dots = scr.map(([x, y], i) => {
    if (i === 0) return `<circle cx="${x}" cy="${y}" r="2.5" fill="${INK}"/><text x="${r2(x - 5)}" y="${r2(y + 3)}" text-anchor="end" class="ml">home</text>`;
    const onHome = i === scr.length - 1 && x === scr[0][0] && y === scr[0][1];
    const cx = onHome ? r2(x + 9) : x;
    return `<circle cx="${cx}" cy="${y}" r="5.5" fill="#FFFFFF" stroke="${INK}" stroke-width=".75"/><text x="${cx}" y="${r2(y + 2.6)}" text-anchor="middle" class="mn">${i}</text>`;
  }).join('');
  return `<svg class="loc" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(label)}" data-a="${a}" data-b="${b}" data-z="${z}"><g fill="${LAND}" transform="translate(${a} ${b}) scale(${z})"><use href="land.svg#land"/></g><g fill="none" stroke="${INK}" stroke-width=".75">${legs}</g>${dots}</svg>`;
}

// ---------------------------------------------------------------------------------------------
// 8. Words that recompute for any route: h2, captions, notes. Every figure comes from the derivation.
// ---------------------------------------------------------------------------------------------
const ORD = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth'];
const plural = (n, w) => `${w}${n === 1 ? '' : 's'}`;
const cellsOf = derived => derived.flatMap(s => PART_KEYS.flatMap(p => s.cells[p]));
const isEU = (xb, i) => ehdsOf(xb.countries[i]).applies === true;

// Plain words (JAS, 2 Oct): a person and a doctor, short sentences, verbs that agree with the number.
const partsReach = (n, where) => n === 0 ? `we found no part of your health record that reaches a doctor ${where} by itself` : `${n} of the 5 parts of your health record can reach a doctor ${where} by ${n === 1 ? 'itself' : 'themselves'}`;
const cap = t => t.charAt(0).toUpperCase() + t.slice(1);
// "No part reaches" only when nothing is unknown; with unknowns, say no source shows it (editorial truth rule).
const reachTxt = (n, unk, where) => n > 0 ? partsReach(n, where) : unk > 0 ? `no source shows any part of your health record reaching a doctor ${where} by itself` : partsReach(0, where);
const uniq = xs => [...new Set(xs)];
const ofAll = (n, tot, unit) => (n === tot ? (tot === 1 ? `the one` : `all ${tot}`) : `${n} of the ${tot}`) + (unit ? ` ${unit}` : '');
const copyLine = (n, k = 1) => n.copyUnknown ? 'Whether you can bring a copy is not in our data.' : k > 1 ? (n.copyCells ? `You can bring a copy of ${ofAll(n.copyCells, n.cells, 'pieces')}.` : 'There is no copy for you to bring.') : !n.copy ? 'There is no copy for you to bring.' : n.bySystem && n.bySystem + n.copy === 5 ? `For the other ${n.copy}, you can bring a copy.` : n.copy === 5 ? 'You can bring a copy of all 5.' : `You can bring a copy of ${n.copy} of the 5.`;

function routeH2(xb, data, r) {
  const d = r.derived, cells = cellsOf(d), unk = cells.filter(c => c.border.state === 'unknown').length, nm = i => theName(data[i].name);
  const moved = d.filter(s => s.kind === 'moved');
  const reloc = moved.filter(s => relocCount(s) > 0);
  if (unk * 3 > cells.length) return `On this trip, no source says either way for ${unk} of the ${cells.length} pieces (each part of your health record, at each stop).`;
  if (reloc.length) {
    // Say where the visit would come from: the country that keeps the piece that would arrive.
    const places = reloc.map(s => { const from = [...new Set(PART_KEYS.flatMap(p => s.cells[p].filter(c => c.border.state === 'unknown' && c.border.relocation).map(c => c.holder)))]; return `${nm(s.iso3)} (from ${joinAnd(from.map(nm))})`; });
    return `In ${joinAnd(places)}, part of your health record could reach a doctor if you were visiting. Once you live there, no source says whether it does.`;
  }
  const reached = d.filter(s => s.counts.bySystem > 0 && s.kind !== 'return'), copy = d.filter(s => !s.counts.copyUnknown && (s.counts.copy > 0 || s.counts.copyCells > 0) && s.kind !== 'return');
  const named = xs => joinAnd([...new Set(xs.map(s => nm(s.iso3)))]);
  const stops = d.filter(s => s.kind !== 'return');
  return `${reached.length ? `In ${named(reached)}, part of your health record can reach a doctor by itself.` : unk ? 'On this trip, no source shows any part of your health record reaching a doctor by itself.' : 'On this trip, we found no part of your health record that reaches a doctor by itself.'}${copy.length ? (copy.length === stops.length ? ' You can bring a copy at every stop.' : ` In ${named(copy)}, you can bring a copy.`) : ''}`;
}

// The page's h2 states the contrast between Figure 1 (a visit) and Figure 2 (the athlete) where they share a pair:
// the same home and the same country, visited in one and moved to in the other. Only for the visitor preset.
function contrastH2(xb, data, R1, R2) {
  if (R1.id !== 'visitor') return null;
  const v = R1.derived.find(st => st.kind === 'visiting' && R2.derived.some(m => m.kind === 'moved' && m.iso3 === st.iso3 && m.holders.includes(st.holders[0])));
  if (!v) return null;
  const m = R2.derived.find(x => x.kind === 'moved' && x.iso3 === v.iso3), h = v.holders[0], hi = m.holders.indexOf(h);
  const a = PART_KEYS.filter(p => ['live', 'partial'].includes(m.cells[p][hi].ch.state)).length;
  const reloc = PART_KEYS.filter(p => m.cells[p][hi].border.relocation && !m.cells[p][hi].border.byDesign).length;
  const design = PART_KEYS.filter(p => m.cells[p][hi].border.byDesign).length;
  const stop = theName(data[v.iso3].name), home = theName(data[h].name);
  const unkHere = PART_KEYS.filter(p => m.cells[p][hi].border.state === 'unknown').length;
  // Not known is never "no sign" (Tufte seat, 2 Oct): a piece no source covers either way is said as such.
  const moveTxt = a ? `${a} of the 5 parts can follow you` : unkHere ? 'no source says whether any part follows you' : design ? 'no part follows you, because the service is for visitors only' : 'we found no part that follows you by itself';
  const got = reachTxt(v.counts.bySystem, v.counts.unknownParts, 'there');
  return `Visit ${stop} from ${home}, and ${got}. Move to ${stop}, and ${moveTxt}.`;
}

const theName = n => /^(United |Netherlands|Czech Republic|Philippines|Bahamas|Gambia|Dominican Republic|Central African|Democratic Republic|Republic of|Marshall|Solomon|Comoros|Maldives)/.test(n) ? 'the ' + n : n;

function figCaption(xb, data, r, i, asOf) {
  const d = r.derived, last = d.at(-1), nm = x => theName(data[x].name), w = r.stopWord || 'stop';
  const out = [`Figure ${i + 1}. ${esc(r.title)}, ${esc(r.note)}: ${numH(routeSentence(data, r))}.`];
  const visits = d.filter(s => s.kind === 'visiting');
  // Visits grouped by both counts, so a group never hides an unknown.
  const groups = []; for (const s of visits) { const g = groups.find(x => x.n === s.counts.bySystem && x.u === s.counts.unknownParts); g ? g.names.push(nm(s.iso3)) : groups.push({ n: s.counts.bySystem, u: s.counts.unknownParts, names: [nm(s.iso3)] }); }
  const visitTxt = groups.map(g => `In ${joinAnd(uniq(g.names))}, ${reachTxt(g.n, g.u, 'there')}.${g.u ? ` For ${ofAll(g.u, 5, 'parts')}, ${WD.noSource}.` : ''}`).join(' ');
  const backTxt = last.kind === 'return'
    ? (last.counts.unknownCells === last.counts.cells
      ? `Back home in ${nm(r.home)}, no source says whether the care you had abroad reaches your home record.`
      : last.counts.bySystem ? `Back home in ${nm(r.home)}, ${last.counts.bySystem} of the 5 parts of the care you had abroad ${last.counts.bySystem === 1 ? 'reaches' : 'reach'} your home record by itself.` : last.counts.unknownCells ? `Back home in ${nm(r.home)}, no source shows any of the care you had abroad reaching your home record by itself.` : `Back home in ${nm(r.home)}, we found no part of the care you had abroad that reaches your home record by itself.`)
    : '';
  // The emphasis goes to the record crossing where it does (a visit), otherwise to the end of the route.
  const lastTxt = `${d.length <= ORD.length && r.stopWord ? `By the ${ORD[d.length - 1]} ${w}` : 'At the last stop'}, in ${nm(last.iso3)}, ${reachTxt(last.counts.bySystem, last.counts.unknownCells, 'there')}.`;
  const lead = visits.length ? visitTxt : last.kind === 'return' ? backTxt : lastTxt;
  out.push(`<em>${numH(lead)}</em>`);
  for (const x of [visitTxt, backTxt]) if (x && x !== lead) out.push(numH(x));
  const euMoved = d.filter(s => s.kind === 'moved' && isEU(xb, s.iso3) && s.iso3 !== r.home);
  if (euMoved.length) {
    const c = cellsOf(euMoved), live = c.filter(x => x.border.state === 'live' || x.border.state === 'partial').length;
    const unk = c.filter(x => x.border.state === 'unknown').length, sch = c.filter(x => x.border.state === 'scheduled').length, schYears = [...new Set(c.filter(x => x.border.state === 'scheduled').map(x => x.ch.year || x.border.year).filter(Boolean))].sort(); const schUndated = c.some(x => x.border.state === 'scheduled' && !(x.ch.year || x.border.year));
    const none = c.filter(x => x.border.state === 'none_found').length;
    const bits = [unk ? `for ${ofAll(unk, c.length, 'pieces')}, ${WD.noSource}` : '', sch ? `${ofAll(sch, c.length, '')} ${sch === 1 ? 'is' : 'are'} not working yet${schYears.length ? `, though a law says ${sch === 1 ? 'it' : 'they'} must by ${schYears.join(' or ')}${schUndated ? ', or with no date set' : ''}` : ', with no date set in law'}` : '', none ? `for ${ofAll(none, c.length, '')}, ${WD.none}` : ''].filter(Boolean);
    out.push(numH(`In ${joinAnd(uniq(euMoved.map(x => nm(x.iso3))))}, where you moved, ${live ? `${ofAll(live, c.length, 'pieces')} ${live === 1 ? 'reaches' : 'reach'} a doctor by ${live === 1 ? 'itself' : 'themselves'}` : unk ? 'no source shows any part of your record reaching a doctor by itself today' : 'we found no part of your record that reaches a doctor by itself today'}.${bits.length ? ` ${cap(bits.length === 2 ? bits.join(', and ') : joinAnd(bits))}.` : ''}`));
  }
  const all = cellsOf(d), allUnk = all.filter(x => x.border.state === 'unknown').length;
  if (allUnk) out.push(numH(`Over the whole trip, ${WD.noSource} for ${ofAll(allUnk, all.length, 'pieces')} (each stop counts 5 parts from every country that holds part of your record, ${all.length / 5} ${all.length / 5 === 1 ? 'time' : 'times'} in all). Not known is not the same as lost.`));
  const copied = all.filter(x => x.ch.state === 'carried' || x.ch.state === 'carried_partial').length;
  const notArriving = all.filter(x => !['live', 'partial'].includes(x.ch.state)).length;
  if (copied && copied === notArriving) out.push(`Wherever your record does not arrive by itself, you can bring a copy.${all.some(x => x.ch.notch) ? ' A corner notch means you can bring a copy, but no source says whether the record also goes by itself.' : ''}`);
  else if (copied) out.push(numH(`For ${ofAll(copied, all.length, 'pieces')}, you can bring a copy.${all.some(x => x.ch.notch) ? ' A corner notch means you can bring a copy, but no source says whether the record also goes by itself.' : ''}`));
  if (d.every(s => s.counts.copyUnknown)) out.push(`Whether ${esc(nm(r.home))}${d.some(s => s.kind === 'moved') ? ', or any later home,' : ''} lets you take a copy is not in our data.`);
  if (d.some(s => s.kind === 'moved')) out.push(`${WD.split} In each lane the pieces run in the order you lived there, home first (on a phone, top to bottom).`);
  else if (d.some(s => s.holders.length > 1)) out.push('Where a column holds several pieces, they run in the order visited (on a phone, top to bottom).');
  if (r.noLaw) out.push('The new EU health data law does not apply on this trip.');
  out.push(`Border status checked on ${numH(longDate(asOf))}.`);
  return out.join(' ');
}

const TOPIC_WORDS = { ps_send: 'sending health summaries', ps_recv: 'receiving health summaries', ep_send: 'sending medicines', ep_recv: 'receiving medicines' };

// renderDynamic: everything on the page that depends on the route in Figure 1 (and the note numbers after it).
// A = { xb, data, base } where base is baseRate(xb); route = { home, stops } (named by namedRoute).
function renderDynamic(A, route, nb) {
  const { xb, data } = A, BR = A.base;
  const asOf = xb.meta.as_of;
  const EH = ehdsOf(xb.countries[Object.keys(xb.countries).find(i => isEU(xb, i))]), EY1 = EH.early, EY2 = EH.late;
  const YEARS = Object.fromEntries(PARTS.map(p => [p.k, EHDS_EARLY.has(p.k) ? EY1 : EY2]));
  const routes = [namedRoute(route, nb), { ...ATHLETE }, { ...USEU }].map((r, ri) => {
    const derived = deriveRoute(xb, r);
    return { ...r, fig: ri, derived, notes: evidenceNotes(xb, derived, r) };
  });
  const [R1] = routes;
  const relocCells = cellsOf(R1.derived).filter(c => c.border.relocation).length;
  const visitPairs = R1.derived.filter(s => s.kind === 'visiting'), liveVisits = visitPairs.filter(s => s.cells.summary.every(c => c.border.state === 'live')).length;
  const notes = [];
  const add = (html, ref) => { notes.push({ html, ref }); return notes.length; };
  // Method notes 1 to 5, in the editorial seat's words (2 Oct), on the page's vocabulary.
  add(`"By itself" means an official source shows the service working between the two countries, or the European Commission's MyHealth@EU figures (up to ${numH(longDate(xb.meta.kpi_window[1]))}) show records being sent. It does not mean every pharmacy or hospital uses it. We do not know how many do.`, 'method');
  // Note 2 describes only the marks the figures on this page really draw (Tufte seat, 2 Oct).
  const drawn = new Set(routes.flatMap(rr => keyItems(rr).map(x => x.k)));
  const howUnk = [drawn.has('unknown') || drawn.has('reloc') ? 'Where no source says either way and there is no copy to bring, the box is dashed.' : '',
    drawn.has('carried_notch') || drawn.has('carried_reloc') ? 'Where you can bring a copy but no source says whether the part also arrives by itself, the box is pale with a small grey corner.' : '',
    drawn.has('reloc') || drawn.has('carried_reloc') ? 'A thin teal line along the top of a box means the part would arrive by itself on a visit, but no source says it does for someone who moved there. The "would arrive on a visit" row counts these boxes.' : ''].filter(Boolean).join(' ');
  add(`Not known never counts as lost. ${howUnk} The ${numH(String(BR.nEU))} EU countries have ${numH(String(BR.pairs))} one-way routes between them (Spain to France and France to Spain count as two). Today ${numH(String(BR.live))} of them send a health summary by itself. We researched two parts, the summary and medicines. Checking those two parts on every route, ${numH(`${BR.unknownPct}%`)} of the checks are not known (${numH(`${BR.unknown.toLocaleString('en-US')} of ${BR.states.toLocaleString('en-US')}`)}).${visitPairs.length ? ` On Figure 1's trip, ${numH(`${liveVisits} of ${visitPairs.length}`)} ${plural(visitPairs.length, 'visit')} ${visitPairs.length === 1 ? 'gets' : 'get'} a health summary by itself.` : ''}`, 'method');
  const rcNote = xb.rc && Object.values(xb.rc.countries || {}).map(c => c.relocation && c.relocation.summary).find(v => v && v.conclusion === 'not_stated' && v.quote);
  const rcLaw = xb.rc && Object.values(xb.rc.countries || {}).map(c => c.relocation && c.relocation.ehds_2029).find(v => v && v.recital_quote);
  const srcA = x => x && x.url ? `<a href="${esc(x.url)}" rel="noopener">${esc(x.title)}</a>${String(x.title).includes(longDate(x.date).split(' ').slice(-2).join(' ')) ? '' : ` (${numH(longDate(x.date))})`}` : ''; // no date twice when the title carries it
  add(`The European Commission says MyHealth@EU serves people "traveling abroad in the EU".${rcNote ? ` The guide the EU countries wrote for the service describes two cases: "${numH(rcNote.quote)}" (${srcA(rcNote.source)}).` : ''} No source we opened says whether the service covers someone who has moved to a new country and signed up there as a resident. So where the part would arrive for a visitor, we draw it as not known for someone who moved. On Figure 1's trip that is ${numH(String(relocCells))} ${plural(relocCells, 'piece')}.${rcLaw ? ` From ${numH(longDate(rcLaw.from))}, EU law gives you the right to ask for your record to be sent between doctors and hospitals in different EU countries (${esc(rcLaw.article)}; ${srcA(rcLaw.source)}). The law's own explanation says: "${numH(rcLaw.recital_quote)}" This applies only when both countries are in the EU. It does not cover Norway, Iceland or Liechtenstein, because we did not check whether the dates bind them. A right to ask is a promise in law. It is not a transfer that happens today.` : ''}`, 'method');
  const rcCopy = !!(xb.rc && xb.rc.countries);
  add(`"You can bring a copy" means your home country's law lets you take a copy of your record with you. ${rcCopy ? `In the EU, that right comes from the EU's data privacy law (the GDPR, Regulation (EU) ${numH('2016/679')}). In the United States, it comes from the HIPAA rule 45 CFR 164.524: you can ask for an electronic copy, or ask for it to be sent to someone you name. For each country, we noted whether the copy can be electronic. Where the law does not say, the figure says not known.` : `The only such right in our data is the US one (the HIPAA rule 45 CFR 164.524); for every other home it is not in our data.`} EU health data law adds a free download in a standard European format, from ${numH(String(EY1))} for some parts and ${numH(String(EY2))} for the rest. We do not know whether a clinic abroad will accept or read your copy.`, 'method');
  add(`Today MyHealth@EU offers only two services to all EU countries: health summaries and electronic prescriptions for medicines. Lab results, scans and X-rays, and hospital notes are not among them, and our research did not cover them. Inside the EU, we draw them as not yet, with ${numH(String(EY2))}, the year EU law sets for them (Article 105). "Hospital notes" means the letter a hospital writes when you leave. Outside the EU and Norway, Iceland and Liechtenstein, we found no link for any part.`, 'method');
  for (const r of routes) {
    r.marks = [];
    for (const nt of r.notes) {
      const prev = routes.slice(0, r.fig).flatMap(x => x.marks || []).find(x => x.id === nt.id);
      if (prev) { nt.num = add(`<span class="n">${esc(nt.figure)}</span> ${esc(nt.unit)}. Tied to the ${esc(nt.lane)} lane at stop ${numH(String(nt.col + 1))}, ${esc(data[r.derived[nt.col].iso3].name)}. The same figure, scope and source as note ${numH(String(prev.num))}.`, r.fig); r.marks.push(nt); continue; }
      nt.num = add(`<span class="n">${esc(nt.figure)}</span> ${esc(nt.unit)}. Tied to the ${esc(nt.lane)} lane at stop ${numH(String(nt.col + 1))}, ${esc(data[r.derived[nt.col].iso3].name)}. <span class="sc">${numH(nt.label)}</span>${nt.scopeNote ? `, ${esc(nt.scopeNote)}` : ''}. "${numH(nt.quote)}" Caveat: "${numH(nt.caveat)}". ${esc(nt.method[0].toUpperCase() + nt.method.slice(1))}. <a href="${esc(nt.url)}" rel="noopener">${numH(nt.cite)}</a>. A figure for its own scope, not a cost of this trip.`, r.fig);
      r.marks.push(nt);
    }
    const planned = st => PART_KEYS.filter(p => st.cells[p].some(c => c.ch.state === 'scheduled' && !c.ch.year));
    const ci = r.derived.findIndex(st => planned(st).length);
    if (ci >= 0) {
      const st = r.derived[ci], lanes = planned(st);
      const eea = [...new Set(lanes.flatMap(p => st.cells[p].filter(c => c.ch.state === 'scheduled' && !c.ch.year).flatMap(c => [c.send, c.recv]).filter(s => s.eu === 'unknown').map(s => s.iso3)))];
      const ownPlanned = lanes.filter(p => st.cells[p].some(c => c.recv.why === 'planned' && c.recv.eu !== true));
      const num = add(`${esc(theName(data[st.iso3].name))} (stop ${numH(String(ci + 1))}), ${esc(joinAnd(lanes.map(p => PANEL_NAME[p])))}: ${WD.planned}. ${eea.length ? `${esc(joinAnd(eea.map(x => data[x].name)))} ${eea.length === 1 ? 'is' : 'are'} outside the EU, and we did not check whether the new EU law reaches ${eea.length === 1 ? 'it' : 'them'}, so a trip that includes ${eea.length === 1 ? 'it' : 'one'} has no law year, even where the other country has one (${numH(String(EY1))} or ${numH(String(EY2))}).` : 'No law sets a date for this trip.'}${ownPlanned.length ? ` ${esc(theName(data[st.iso3].name))} says it plans to receive ${esc(joinAnd(ownPlanned.map(p => PANEL_NAME[p])))}.` : ''}`, 'method');
      for (const lane of lanes) r.marks.push({ lane, col: ci, num });
    }
  }
  const bands = routes.map(r => {
    r.noLaw = r.derived.every(st => ehdsLine(st));
    r.showCopy = !r.derived.every(st => st.counts.copyUnknown);
    const b = renderBand(xb, data, r, r.derived, r.marks, `fig${r.fig + 1}`, { years: YEARS, noLaw: r.noLaw });
    return { r, b, loc: locator(r, data, `Locator map: ${routeSentence(data, r)}`), phone: renderPhone(data, r, r.derived, r.marks, YEARS, r.noLaw) };
  });
  const Wmax = Math.max(...bands.map(x => x.b.W));
  const zoom = r2(Math.min(1, 700 / Wmax)); // fits an A4 or Letter page in either orientation (about 700 px of content in portrait)
  const LOC_H = LOC.H;
  const figs = bands.map(({ r, b, loc, phone }, i) => `<figure class="fig" id="fig${i + 1}">
<figcaption class="cap">${figCaption(xb, data, r, i, asOf)}</figcaption>
<div class="figbody">
<div class="main" style="width:${Wmax}px"><div class="scroll"><div class="bandwrap" style="width:${Wmax}px">${b.svg}${columnSources(xb, data, r, r.derived, b.W, r.showCopy)}</div></div>
<div class="phonewrap">${phone}</div>
<p class="key">${keyLine(r, data)}</p></div>
<aside class="margin">${loc}
${r.notes.map(nt => { const top = Math.max(laneY(PART_KEYS.indexOf(nt.lane)) - LOC_H, 6); return `<p class="sidenote" style="margin-top:${top}px"><span class="n">${nt.num}</span> ${notes[nt.num - 1].html}</p>`; }).join('')}</aside>
</div>
</figure>`).join('\n');
  const stops = bands.map(({ r }, i) => `<h3 class="route">Figure ${i + 1}, ${esc(r.title)}</h3>
<ol class="stops">${r.derived.map((st, k) => stopTable(xb, data, r, st, k, i)).join('')}</ol>`).join('\n');
  const methodNotes = notes.map((n, k) => ({ ...n, k: k + 1 })).filter(n => n.ref === 'method').map(n => `<li value="${n.k}" id="note-${n.k}">${n.html}</li>`).join('');
  const h2 = contrastH2(xb, data, R1, routes[1]) || routeH2(xb, data, R1);
  const stage = renderStage(A, R1, 'end');
  return { stage, h2, h2html: numH(h2), figs: `<div class="figs" style="--pz:${zoom}">${figs}</div>`, stops, methodNotes, routes, notes, zoom, Wmax, live: `${R1.title}: ${h2}` };
}


// ---------------------------------------------------------------------------------------------
// 9. The journey stage (docs/TRAVELLER_JOURNEY_UX.md, with the Tufte seat's rulings of 2 Oct).
// Every string and mark here quotes the derivation above; nothing is computed a second way.
// ---------------------------------------------------------------------------------------------
const PATH_INK = '#6B7280'; // the person's path: quieter than the record arcs (validator numbers in docs/TRAVELLER_BUILD.md)
const STAGE_PIC = { W: 900, H: 470, padL: 60, padR: 60, padY: 50, zMax: 9 };

// Record arcs: one per holder-to-stop pair where at least one part crosses by system now (a live or partial cell).
// No arc otherwise: not known, scheduled, planned, none found and a copy the person carries draw nothing.
function recordArcs(r) {
  const out = [];
  r.derived.forEach((st, idx) => st.holders.forEach((h, hi) => {
    const parts = PART_KEYS.filter(p => ['live', 'partial'].includes(st.cells[p][hi].ch.state));
    if (parts.length) out.push({ holder: h, stop: st.iso3, idx: idx + 1, parts: parts.length });
  }));
  return out;
}

// The trail: one entry per stop, home first, with the band's own strings and denominators.
function trailItems(data, r) {
  return [{ idx: 0, name: theName(data[r.home].name), label: `Home, ${theName(data[r.home].name)}`, text: `Home, ${theName(data[r.home].name)}` },
    ...r.derived.map((st, i) => {
      const name = st.kind === 'return' ? 'back home' : theName(data[st.iso3].name), k = st.holders.length, n = st.counts;
      const unk = k > 1 ? n.unknownCells : n.unknownParts;
      return { idx: i + 1, name, label: `${i + 1} ${name}`, text: `${i + 1} ${cap(name)}: ${arriveText(n, k)}${unk ? `, ${unkText(n, k)} not known` : ''}` };
    })];
}

// The static route picture: the core's Equal Earth projection on the cached land shape, sized to the stage.
// Person's path on the ground (quiet ink), record arcs lifted (teal, bowed), numerals at stops.
function routePicture(r, data, opts = {}) {
  const P0 = { ...STAGE_PIC, ...opts }, { W, H } = P0, cur = opts.current ?? 'end';
  const geo = [r.home, ...r.derived.map(s => s.iso3)].map(i => data[i].pos);
  const P = geo.map(([lo, la]) => eqEarth(lo, la));
  // Frame the route and, at a stop, that stop's whole country (its largest landmass), so nothing sits on the frame's edge.
  // A home-only view (the wizard's step 1) frames the home country itself.
  const curIso = typeof cur === 'number' && cur > 0 ? r.derived[cur - 1].iso3 : !r.derived.length ? r.home : null, bbx = curIso && data[curIso].bb;
  const extra = bbx ? [[bbx[0], bbx[1]], [bbx[2], bbx[1]], [bbx[0], bbx[3]], [bbx[2], bbx[3]], [(bbx[0] + bbx[2]) / 2, bbx[3]], [(bbx[0] + bbx[2]) / 2, bbx[1]]].map(([lo, la]) => eqEarth(lo, la)) : [];
  const xs = [...P, ...extra].map(p => p[0]), ys = [...P, ...extra].map(p => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const iw = W - P0.padL - P0.padR, ih = H - 2 * P0.padY, bw = x1 - x0, bh = y1 - y0;
  const z = r2(Math.min(P0.zMax, bw ? iw / bw : P0.zMax, bh ? ih / bh : P0.zMax));
  const a = r2(P0.padL + (iw - bw * z) / 2 - x0 * z), b = r2(P0.padY + (ih - bh * z) / 2 - y0 * z);
  const S = ([x, y]) => [r2(a + x * z), r2(b + y * z)], worldW = 2 * eqEarth(180, 0)[0] * z;
  const at = iso => S(eqEarth(...data[iso].pos));
  let path = '';
  for (let i = 1; i < geo.length; i++) {
    const pts = greatCircle(geo[i - 1], geo[i]).map(([lo, la]) => S(eqEarth(lo, la)));
    let d = ''; pts.forEach((p, k) => { d += (k === 0 || Math.abs(p[0] - pts[k - 1][0]) > worldW / 2 ? 'M' : 'L') + p[0] + ',' + p[1]; });
    path += `<path d="${d}"/>`;
  }
  const arcs = recordArcs(r).filter(x => cur === 'end' || x.idx === cur).map(x => {
    const [ax, ay] = at(x.holder), [bx, by] = at(x.stop), len = Math.hypot(bx - ax, by - ay);
    const lift = Math.max(18, 0.35 * len); // bow grows with the leg, as globe.gl's arcAltitudeAutoScale does
    const mx = (ax + bx) / 2, my = (ay + by) / 2 - lift;
    return `<path class="arc" data-holder="${x.holder}" data-stop="${x.stop}" data-idx="${x.idx}" d="M${ax},${ay}Q${r2(mx)},${r2(my)} ${bx},${by}"/>`;
  }).join('');
  const curSt = typeof cur === 'number' && cur > 0 ? r.derived[cur - 1] : null;
  const scr = P.map(S);
  const homeCovered = scr.some(([x, y], i) => i > 0 && x === scr[0][0] && y === scr[0][1]);
  const dots = scr.map(([x, y], i) => {
    // A numeral on the home point covers the home dot; "home" then ends 3 px before the numeral's circle.
    if (i === 0) return homeCovered ? `<text x="${r2(x + 14 - 9 - 3)}" y="${r2(y + 4)}" text-anchor="end" class="ph">home</text>` : `<circle cx="${x}" cy="${y}" r="3.5" fill="${INK}"/><text x="${r2(x - 8)}" y="${r2(y + 4)}" text-anchor="end" class="ph">home</text>`;
    const onHome = x === scr[0][0] && y === scr[0][1], cx = onHome ? r2(x + 14) : x;
    const isCur = cur === i, isHolder = curSt && curSt.kind === 'moved' && curSt.holders.includes(r.derived[i - 1].iso3) && i < cur;
    const solid = isCur || isHolder;
    return `<g class="stopnum${isCur ? ' cur' : ''}"><circle cx="${cx}" cy="${y}" r="9" fill="${solid ? INK : '#FFFFFF'}" stroke="${INK}" stroke-width="1"/><text x="${cx}" y="${r2(y + 4)}" text-anchor="middle" class="pn${solid ? ' inv' : ''}">${i}</text></g>`;
  }).join('');
  let label = '';
  if (curSt) {
    const [x, y] = scr[cur], st = curSt, txt = `${st.kind === 'return' ? 'Back home' : data[st.iso3].name}: ${arriveText(st.counts, st.holders.length)}`;
    const cx = x === scr[0][0] && y === scr[0][1] ? x + 14 : x, tw = txt.length * 7.2;
    // The current label goes right of its numeral, unless that box runs off the frame or hits another marker: then left (the sea side).
    const marks = scr.map(([mx, my], k) => [k > 0 && mx === scr[0][0] && my === scr[0][1] ? mx + 14 : mx, my]).filter((m, k) => k !== cur);
    const hits = (x0, x1) => marks.some(([mx, my]) => mx + 9 > x0 && mx - 9 < x1 && my + 9 > y - 10 && my - 9 < y + 5);
    const right = cx + 14 + tw > W - 4 || hits(cx + 12, cx + 14 + tw);
    label = `<text x="${r2(right ? cx - 14 : cx + 14)}" y="${r2(y + 4)}"${right ? ' text-anchor="end"' : ''} class="pl" stroke="#FFFFFF" stroke-width="4" paint-order="stroke">${numS(txt)}</text>`;
  }
  return `<svg class="routepic" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-hidden="true" focusable="false" data-a="${a}" data-b="${b}" data-z="${z}"><g fill="${LAND}" stroke="#D1D5DB" stroke-width="${r2(0.6 / z)}" transform="translate(${a} ${b}) scale(${z})"><use href="land.svg#land"/></g><g fill="none" stroke="${PATH_INK}" stroke-width="1">${path}</g><g fill="none" stroke="${SYS}" stroke-width="1.5">${arcs}</g>${dots}${label}</svg>`;
}

// The stop panel: the band's marks and strings for one stop (idx 0 = home), unboxed.
const SHORT = ch => ch.state === 'live' ? WD.arrives : ch.state === 'partial' ? 'partly arrives by itself' : ch.state === 'carried' || ch.state === 'carried_partial' ? (ch.notch ? (ch.relocation ? `${WD.copy}; by itself: arrives on a visit, not known after a move${ch.promise ? ` (EU law from ${ch.promise.year})` : ''}` : `${WD.copy}; by itself: ${WD.unknown}`) : WD.copy)
  : ch.state === 'scheduled' ? (ch.year ? `not yet; ${WD.lawBy(ch.year)}` : `not yet; ${WD.planned}`) : ch.state === 'unknown' ? (ch.relocation ? `${WD.reloc}${ch.promise ? ` (EU law from ${ch.promise.year})` : ''}` : WD.unknown) : WD.none;
// Split lanes (a person who moved): one short line in the same categories as the count rows below them, so a row and
// the counts never disagree. Each piece is counted once for how it travels and once more if you can bring a copy.
function laneLine(cells, data) {
  const k = cells.length, from = n => n === k && k > 1 ? `from all ${n}` : `from ${n}`;
  const n = st => cells.filter(c => c.border.state === st).length;
  const live = cells.filter(c => ['live', 'partial'].includes(c.border.state)).length, unk = n('unknown'), none = n('none_found');
  const sched = cells.filter(c => c.border.state === 'scheduled'), years = [...new Set(sched.map(c => c.ch.year || c.border.year).filter(Boolean))];
  const copies = cells.filter(c => c.ch.state === 'carried' || c.ch.state === 'carried_partial').length;
  return [live ? `by itself ${from(live)}` : '', unk ? `not known ${from(unk)}` : '', sched.length ? `not yet ${from(sched.length)}${years.length === 1 ? ` (law from ${years[0]})` : ''}` : '', none ? `no link ${from(none)}` : '', copies ? `a copy ${from(copies)}` : ''].filter(Boolean).join('; ');
}
const PANEL_NAME = { summary: 'health summary', prescriptions: 'medicines', labs: 'lab results', images: 'scans and X-rays', notes: 'hospital notes' };
function stopPanel(xb, data, r, idx, fig = 0) {
  const N = r.derived.length, LW = 160, LH = 26;
  const lane = (cells, ch1) => { const k = cells ? cells.length : 1, u = LW / k; return `<svg class="pl-lane" width="${LW}" height="${LH}" viewBox="0 0 ${LW} ${LH}" aria-hidden="true">${cells ? cells.map((c, hi) => cellMarks(hi * u, 0, u, c.ch, '', LH)).join('') + (k > 1 ? Array.from({ length: k - 1 }, (_, i) => `<line x1="${r2((i + 1) * u)}" x2="${r2((i + 1) * u)}" y1="0" y2="${LH}" stroke="#FFFFFF" stroke-width="1"/>`).join('') : '') : cellMarks(0, 0, LW, ch1, '', LH)}</svg>`; };
  if (idx === 0) {
    const home = data[r.home];
    return `<div class="panel" data-idx="0"><p class="pl-head">HOME · START</p><p class="pl-pair">At home in ${esc(theName(home.name))}</p>
<table class="pl-rows"><tbody>${PARTS.map(p => `<tr><th scope="row">${esc(PANEL_NAME[p.k])}</th><td>${lane(null, { state: 'live' })}</td><td>kept by your doctors at home</td></tr>`).join('')}</tbody></table>
<p class="pl-cnt"><span>All 5 parts are kept here.</span></p>
<details class="pl-jm"><summary>How joined-up is care at home?</summary>${JOURNEY.map(([k, nn]) => `<span>${journeyMarker((home.journey || {})[k] || 'unknown', 10)} ${esc(nn)}: ${esc({ connected: 'connected', partial: 'partly connected', siloed: 'not shared', unknown: 'not known' }[(home.journey || {})[k] || 'unknown'])}</span>`).join(' ')}</details></div>`;
  }
  const st = r.derived[idx - 1], k = st.holders.length, n = st.counts, nm = i => theName(data[i].name);
  const pair = st.kind === 'moved' ? `You moved to ${nm(st.iso3)}. Parts of your record are in ${joinAnd(st.holders.map(nm))}.` : st.kind === 'return' ? `Back home in ${nm(st.iso3)}, from ${joinAnd(st.holders.map(nm))}` : `Visiting ${nm(st.iso3)} from ${nm(st.holders[0])}`;
  const word = st.kind === 'return' ? 'BACK HOME' : st.kind === 'moved' ? 'MOVED HERE' : 'VISITING';
  const rows = PARTS.map(p => {
    const cells = st.cells[p.k];
    const txt = cells.length === 1 ? SHORT(cells[0].ch) : laneLine(cells, data);
    return `<tr><th scope="row">${esc(PANEL_NAME[p.k])}</th><td>${lane(cells)}</td><td>${numH(txt)}</td></tr>`;
  }).join('');
  const showCopy = !r.derived.every(s => s.counts.copyUnknown), moved = r.derived.some(s => s.kind === 'moved');
  const cnt = [`Arrives by itself: ${sysText(n, k)}`, `Not known: ${unkText(n, k)}${k > 1 ? ` (5 parts × ${k} countries)` : ''}`, ...(moved && st.kind === 'moved' ? [`Would arrive on a visit: ${relocText(st)}`] : []), ...(showCopy ? [n.copyUnknown ? 'Copy: not known' : `You can bring a copy: ${copyText(n, k)}`] : [])];
  const srcs = []; const seen = new Set();
  for (const p of PARTS) for (const c of st.cells[p.k]) for (const sx of [c.recv.source, c.send.source]) if (sx && sx.title && !seen.has(sx.title + sx.date)) { seen.add(sx.title + sx.date); srcs.push(sx); }
  const srcTxt = srcs.slice(0, 2).map(sx => `${sx.url ? `<a href="${esc(sx.url)}" rel="noopener">${esc(shortPub(sx.title))}</a>` : esc(shortPub(sx.title))} ${numH(longDate(sx.date))}`).join(' · ') + (srcs.length > 2 ? ` · +${srcs.length - 2} more` : '');
  return `<div class="panel" data-idx="${idx}"><p class="pl-head">STOP ${numH(`${idx} OF ${N}`)} · ${word}</p><p class="pl-pair">${esc(pair)}</p>
<table class="pl-rows"><tbody>${rows}</tbody></table>
<p class="pl-cnt">${cnt.map(x => `<span>${numH(x)}</span>`).join('')}</p>
<p class="pl-sent">${numH(stopSentence(st, data))}</p>${st.kind === 'moved' && rightsAt(st).length ? `<p class="pl-right">${numH(rightSentence(st))}</p>` : ''}
<p class="pl-src">Sources: ${srcTxt}</p>
<p class="pl-dig"><a href="#f${fig + 1}-s${idx}">Stop ${numH(String(idx))}: details and sources</a></p></div>`;
}

// The trail (server and client): labelled stops and a range scrubber that snaps to them.
function trailHtml(data, r, cur, buttons = false) {
  const items = trailItems(data, r), N = items.length - 1, c = cur === 'end' ? N : cur;
  return `<ol class="trail-list">${items.map(it => `<li${it.idx === c ? ' class="cur" aria-current="step"' : ''}>${buttons ? `<button type="button" class="tick" data-s="${it.idx}">${numH(it.text)}</button>` : `<span class="tick">${numH(it.text)}</span>`}</li>`).join('')}</ol>`;
}

// The stage for Figure 1's route: picture, panel and trail at stop `cur` (0 = home, n, or 'end' = last stop settled).
function renderStage(A, r, cur = 'end', opts = {}) {
  const { xb, data } = A, N = r.derived.length, idx = cur === 'end' ? N : cur;
  const it = trailItems(data, r)[idx];
  return { picture: routePicture(r, data, { current: cur }), panel: stopPanel(xb, data, r, idx, 0), trail: trailHtml(data, r, cur, !!opts.buttons), idx, N,
    valuetext: idx === 0 ? `Home, ${theName(data[r.home].name)}` : `Stop ${idx} of ${N}, ${r.derived[idx - 1].kind === 'return' ? '' : `${it.name}, `}${stopFrom(data, r.derived[idx - 1], r.home)}`,
    settle: idx === 0 ? `Home, ${theName(data[r.home].name)}: all 5 parts of your record are held here.` : `Stop ${idx}, ${it.name}: ${stopSentence(r.derived[idx - 1], data)}` };
}

// URL: the stop index rides beside the route, #r=PRT:ESP,FRA,PRT&s=2 (absent or invalid: end).
function decodeStop(hash, N) { return readStopHash(hash, N).cur; }
function encodeHash(route, cur) { return encodeRoute(route) + (cur === 'end' || cur === undefined ? '' : `&s=${cur}`); }


// ---------------------------------------------------------------------------------------------
// 10. The globe scene (stage B) and the beats (stage C): pure data for globe.gl, from the same derivation.
// ---------------------------------------------------------------------------------------------
const GLOBE = { arcScale: 1.0, arcMinAlt: 0.06, arcPx: 1.5, lookSouth: 6, capAlt: 0.006, curCapAlt: 0.009, // the camera looks a little south (a pan, never a pitch) only when the frame holds an arc, so its lift reads above the ground path
  pathAlt: 0.011, // the path sits just above the land caps (polygonAltitude 0.006), or the caps hide it
  flyBase: 800, flyPerKm: 0.12, flyCap: 1600 };
const BEATS = { rewind: 600, home: 1600, surface: 1200, arcDraw: 600, collapse: 900, settle: 1400, retract: 400, end: 1200 };
const KM = 6371.0088;
function gcKm(a, b) { // a, b: [lon, lat]
  const r = Math.PI / 180, dl = (b[1] - a[1]) * r, dn = (b[0] - a[0]) * r;
  const h = Math.sin(dl / 2) ** 2 + Math.cos(a[1] * r) * Math.cos(b[1] * r) * Math.sin(dn / 2) ** 2;
  return 2 * KM * Math.asin(Math.min(1, Math.sqrt(h)));
}
const flyMs = km => Math.min(GLOBE.flyCap, Math.round(GLOBE.flyBase + GLOBE.flyPerKm * km));
const inEurope = ([lo, la]) => lo > -25 && lo < 45 && la > 34 && la < 72;
// Camera for a stop: altitude by the leg that arrives there (Europe 1.1; 3,000 to 7,000 km 1.6; above, 2.0).
function camFor(prev, here, pan) {
  const km = gcKm(prev, here);
  const altitude = inEurope(prev) && inEurope(here) && km < 3000 ? 1.1 : km <= 7000 ? 1.6 : 2.0;
  const south = pan ? r2(GLOBE.lookSouth * altitude) : 0;
  return { lat: r2(here[1] - south), lng: here[0], altitude, south };
}
// The end state fits the route: the spherical centroid, and an altitude for the widest pair of points.
function camFit(pts, pan) {
  const r = Math.PI / 180; let x = 0, y = 0, z = 0;
  for (const [lo, la] of pts) { x += Math.cos(la * r) * Math.cos(lo * r); y += Math.cos(la * r) * Math.sin(lo * r); z += Math.sin(la * r); }
  const lng = Math.atan2(y, x) / r, lat = Math.atan2(z, Math.hypot(x, y)) / r;
  let far = 0; for (const a of pts) for (const b of pts) far = Math.max(far, gcKm(a, b));
  const altitude = r2(Math.min(2.6, Math.max(0.9, far / 2600))); // zoom range 0.9 to 2.6 (doc 4.1)
  const south = pan ? r2(GLOBE.lookSouth * altitude) : 0;
  return { lat: r2(lat - south), lng: r2(lng), altitude, south };
}
// globeScene(r, data, cur): paths drawn so far, the record arcs for this moment, labels, camera. cur: 0..N or 'end'.
function globeScene(r, data, cur = 'end') {
  const N = r.derived.length, idx = cur === 'end' ? N : cur;
  const pos = [r.home, ...r.derived.map(s => s.iso3)].map(i => data[i].pos);
  const legs = [];
  for (let i = 1; i <= idx; i++) legs.push({ idx: i, points: greatCircle(pos[i - 1], pos[i], 32).map(([lo, la]) => ({ lat: r2(la), lng: r2(lo) })), km: Math.round(gcKm(pos[i - 1], pos[i])) });
  // Arc height: globe.gl's auto scale (angular distance / 2 x scale), with a floor so a short leg still reads as a bow.
  const arcs = recordArcs(r).filter(x => cur === 'end' || x.idx === cur).map(x => ({ ...x, startLat: data[x.holder].pos[1], startLng: data[x.holder].pos[0], endLat: data[x.stop].pos[1], endLng: data[x.stop].pos[0],
    alt: r2(Math.max(GLOBE.arcMinAlt, gcKm(data[x.holder].pos, data[x.stop].pos) / KM / 2 * GLOBE.arcScale)) }));
  const curSt = idx > 0 ? r.derived[idx - 1] : null;
  const labels = pos.map(([lo, la], i) => {
    const st = i ? r.derived[i - 1] : null, onHome = i > 0 && lo === pos[0][0] && la === pos[0][1];
    return { i, lat: la, lng: lo, home: i === 0, onHome, current: cur !== 'end' && i === idx,
      solid: cur !== 'end' && (i === idx || (curSt && curSt.kind === 'moved' && i < idx && curSt.holders.includes(st && st.iso3))),
      text: i === 0 ? 'home' : `${st.kind === 'return' ? 'Back home' : data[st.iso3].name}: ${arriveText(st.counts, st.holders.length)}` };
  });
  const pan = arcs.length > 0;
  const pov = cur === 'end' ? camFit(pos, pan) : idx === 0 ? { lat: pos[0][1], lng: pos[0][0], altitude: 1.1, south: 0 } : camFor(pos[idx - 1], pos[idx], pan);
  // When the current stop sits at home (home itself, or a return there), the home label is not drawn twice.
  const curAtHome = cur !== 'end' && (idx === 0 || (pos[idx][0] === pos[0][0] && pos[idx][1] === pos[0][1]));
  const shown = labels.filter(l => !(l.home && curAtHome && idx > 0)).map(l => l.home && labels.some(x => x.onHome) ? { ...l, dotless: true } : l); // a numeral on the home point covers the home dot
  return { legs, arcs, labels: shown, pov, stopIso: cur === 'end' ? null : curSt ? curSt.iso3 : r.home, fly: idx > 0 ? flyMs(gcKm(pos[idx - 1], pos[idx])) : BEATS.rewind };
}
// The wizard's view (JAS, 2 Oct): step 1 shows only the chosen home; a trip appears only once the reader picks one.
// Never a route the reader did not choose while the wizard is open. ms: the camera's turn (none under reduced motion).
const homeRoute = home => ({ home, stops: [], derived: [], id: 'home' });
function wizardScene(A, nb, home, trip, reduced) {
  const tr = trip ? tripRoute(trip, home, nb) : null;
  const r = tr ? { ...tr, derived: deriveRoute(A.xb, tr) } : homeRoute(home);
  const cur = r.derived.length ? 'end' : 0;
  return { route: r, cur, scene: globeScene(r, A.data, cur), ms: reduced ? 0 : 1000 };
}
// globe.json (compact) to GeoJSON for globe.gl: [iso3, polygons[rings[flat hundredths]]].
function decodeGlobe(j) {
  return { type: 'FeatureCollection', features: j.f.map(([iso3, polys]) => ({ type: 'Feature', properties: { iso3 },
    geometry: { type: 'MultiPolygon', coordinates: polys.map(rings => rings.map(fl => { const out = []; for (let i = 0; i < fl.length; i += 2) out.push([fl[i] / 100, fl[i + 1] / 100]); return out; })) } })) };
}
// The beat plan for one pass (stage C): durations from the doc's 1.3 table, the fly from the leg length.
function beatPlan(r, data) {
  const pos = [r.home, ...r.derived.map(s => s.iso3)].map(i => data[i].pos);
  const stops = r.derived.map((st, i) => ({ idx: i + 1, fly: flyMs(gcKm(pos[i], pos[i + 1])), surface: BEATS.surface, collapse: BEATS.collapse, settle: BEATS.settle }));
  const total = BEATS.rewind + BEATS.home + stops.reduce((a, b) => a + b.fly + b.surface + b.collapse + b.settle, 0) + BEATS.end;
  return { rewind: BEATS.rewind, home: BEATS.home, stops, end: BEATS.end, total };
}
// The surface state of a stop: its lanes held at the holder (live mark), labelled so, before the collapse to the real marks.
function stopPanelSurface(xb, data, r, idx) {
  const st = r.derived[idx - 1], N = r.derived.length, nm = i => theName(data[i].name), LW = 160, LH = 26;
  const pair = st.kind === 'moved' ? `You moved to ${nm(st.iso3)}. Parts of your record are in ${joinAnd(st.holders.map(nm))}.` : st.kind === 'return' ? `Back home in ${nm(st.iso3)}, from ${joinAnd(st.holders.map(nm))}` : `Visiting ${nm(st.iso3)} from ${nm(st.holders[0])}`;
  const held = `kept in ${joinAnd(st.holders.map(nm))}`, k = st.holders.length, u = LW / k;
  const lane = `<svg class="pl-lane" width="${LW}" height="${LH}" viewBox="0 0 ${LW} ${LH}" aria-hidden="true">${st.holders.map((h, hi) => `<rect class="f held" x="${r2(hi * u)}" y="0" width="${r2(u)}" height="${LH}" fill="${RULE}"/>`).join('')}${k > 1 ? Array.from({ length: k - 1 }, (_, i) => `<line x1="${r2((i + 1) * u)}" x2="${r2((i + 1) * u)}" y1="0" y2="${LH}" stroke="#FFFFFF" stroke-width="1"/>`).join('') : ''}</svg>`;
  return `<div class="panel surface" data-idx="${idx}" aria-hidden="true"><p class="pl-head">STOP ${numH(`${idx} OF ${N}`)} · ${st.kind === 'return' ? 'BACK HOME' : st.kind === 'moved' ? 'MOVED HERE' : 'VISITING'}</p><p class="pl-pair">${esc(pair)}</p>
<table class="pl-rows"><tbody>${PARTS.map(p => `<tr><th scope="row">${esc(PANEL_NAME[p.k])}</th><td>${lane}</td><td>${esc(held)}</td></tr>`).join('')}</tbody></table>
<p class="pl-cnt"><span>all ${numH('5')} parts, before the border</span></p></div>`;
}


// ---------------------------------------------------------------------------------------------
// 11. The wizard (JAS, 2 Oct): three short steps in the stage's left column. Pure parts here; the DOM in the client.
// ---------------------------------------------------------------------------------------------
const WIZ_KEY = 'whr-traveller-wizard'; // sessionStorage only
const WIZ_TRIPS = [
  { id: 'trip', label: 'A short trip, then back home (vacation or work)' },
  { id: 'moved', label: 'An athlete who moves to live in new countries' },
  { id: 'useu', label: 'From the US to Europe and back' },
  { id: 'own', label: 'Your own trip' },
];
// Home from the browser's languages: the first tag with a two-letter region that is a rated country; otherwise Portugal.
function homeFromLocales(langs, data) {
  for (const tag of langs || []) {
    const parts = String(tag || '').split(/[-_]/).slice(1);
    const region = parts.find(p => /^[A-Za-z]{2}$/.test(p));
    if (!region) continue;
    const iso = Object.keys(data).find(i => data[i].a2 && data[i].a2.toUpperCase() === region.toUpperCase());
    if (iso) return iso;
  }
  return 'PRT';
}
// The route for a trip choice. null means: open the stop editor.
// Why the wizard's short trip goes where it goes (lay reader: "why Guatemala?"). Portugal's trip is the fixed sample.
function wizWhy(choice, home, nb, nbl, data) {
  if (choice !== 'trip' || home === 'PRT' || !nb || !nb[home]) return '';
  const r = tripRoute('trip', home, nb), to = r.stops[0].iso3, land = nbl && nbl[home] > 0;
  return `We picked ${theName(data[to].name)} because it is the ${land ? 'closest country we cover that shares a border with' : 'closest country we cover to'} ${theName(data[home].name)}.`;
}
function tripRoute(choice, home, nb) {
  if (choice === 'trip') return presetRoute(home === 'PRT' ? 'visitor' : 'weekend', home, nb);
  if (choice === 'moved') return presetRoute('athlete', home, nb);
  if (choice === 'useu') return presetRoute('us-europe', home, nb);
  return null;
}
// How many cells cross by system (live or partial) on a derived route; zero means an empty sky.
const crossingCells = r => r.derived.reduce((a, st) => a + PART_KEYS.reduce((b, p) => b + st.cells[p].filter(c => ['live', 'partial'].includes(c.ch.state)).length, 0), 0);
// The empty-sky line: a known "no part reaches" only when nothing is unknown; otherwise say what is not known.
function wizardEmptyLine(r) {
  if (crossingCells(r) !== 0) return '';
  const cells = r.derived.flatMap(st => PART_KEYS.flatMap(p => st.cells[p])), unk = cells.filter(c => c.border.state === 'unknown').length;
  return unk ? `On this trip, no source shows any part of your record reaching a doctor by itself. For ${unk === cells.length ? `all ${cells.length}` : `${unk} of the ${cells.length}`} pieces, ${WD.noSource}.` : WIZ_EMPTY;
}
const WIZ_EMPTY = 'On this trip, we found no part of your health record that reaches a doctor by itself. The map shows where it stops.';
// Show the wizard only on a fresh visit: never with a shared route in the URL, never twice in a tab.
const wizardShouldShow = (hash, stored) => !/(?:^|[#&])r=/.test(String(hash || '')) && stored !== 'done';
// The wizard's key: the arc (when anything crosses), the five lanes, then the marks this trip really draws, in the figure keys' words.
function wizKeys(r) {
  const arc = `<svg width="34" height="16" viewBox="0 0 34 16" aria-hidden="true"><path d="M2,14Q17,0 32,14" fill="none" stroke="${SYS}" stroke-width="1.5"/></svg>`;
  const lanes = `<svg width="34" height="26" viewBox="0 0 34 26" aria-hidden="true">${[0, 1, 2, 3, 4].map(i => `<rect x="0" y="${r2(i * 5.4)}" width="34" height="4" fill="none" stroke="${RULE}"/>`).join('')}</svg>`;
  const out = [];
  if (r && crossingCells(r)) out.push([arc, 'A curved line over the map: part of your record arrives by itself.']);
  out.push([lanes, `5 rows, one for each part of your record: ${PARTS.slice(0, -1).map(p => PANEL_NAME[p.k]).join(', ')}, and ${PANEL_NAME[PARTS.at(-1).k]}.`]);
  if (r) for (const { k, words } of keyItems(r)) out.push([keyMark(k, 34, 14), cap(words) + '.']);
  return out;
}
// wizardHtml(step, state): the markup for one step. state: { home, trip, route (derived, for step 3), options (home <option>s) }.
function wizardHtml(step, st, data) {
  const skip = '<button type="button" class="wz-skip" data-wz="skip">Skip</button>';
  const head = (n, t) => `<legend>STEP ${numH(`${n} OF 3`)}</legend><span class="wz-h" tabindex="-1" id="wz-h">${esc(t)}</span>`;
  if (step === 1) return `<fieldset>${head(1, 'Where do you live?')}<p class="wz-line">Your health record is kept in the country where you live.</p>
<label for="wz-home" class="vh">Home country</label><select id="wz-home">${st.options.replace(`value="${st.home}"`, `value="${st.home}" selected`)}</select>
<div class="wz-nav"><button type="button" class="st-primary" data-wz="next">Next</button>${skip}</div></fieldset>`;
  if (step === 2) return `<fieldset>${head(2, 'Visiting or moving?')}<p class="wz-line">Starting from ${esc(theName(data[st.home].name))}. Your record travels differently for each.</p>
<ul class="wz-opts">${WIZ_TRIPS.map((t, i) => `<li><label><input type="radio" name="wz-trip" value="${t.id}"${(st.trip || 'trip') === t.id ? ' checked' : ''}> ${esc(t.label)}${t.id === 'useu' && st.home !== 'USA' ? ' <span class="wz-sub">(this one starts in the US)</span>' : ''}</label></li>`).join('')}</ul>
<div class="wz-nav"><button type="button" data-wz="back">Back</button><button type="button" class="st-primary" data-wz="next">Next</button>${skip}</div></fieldset>`;
  const emptyLine = st.route ? wizardEmptyLine(st.route) : '';
  return `<fieldset>${head(3, 'How to read the map')}<ul class="wz-keys">${wizKeys(st.route).map(([m, t]) => `<li>${m}<span>${esc(t)}</span></li>`).join('')}</ul>
${st.why ? `<p class="wz-line">${esc(st.why)}</p>` : ''}<p class="wz-line">Press Play to watch what reaches a doctor at each stop.</p>
${emptyLine ? `<p class="wz-empty" id="wz-empty">${numH(emptyLine)}</p>` : ''}
<div class="wz-nav"><button type="button" data-wz="back">Back</button><button type="button" class="st-primary" data-wz="play">Play the trip</button>${skip}</div></fieldset>`;
}

const CORE_WORDS = { partsReach, copyLine };
const CORE = { WD, longDate, numWord, reachTxt, PARTS, PART_KEYS, EHDS_EARLY, MAP, G, LOC, MAX_STOPS, EVIDENCE, DO_NOT_USE, ATHLETE, USEU, VISITOR, PRESETS, contrastH2, relocateWith, relocConclusion, JOURNEY, TOPIC_WORDS,
  esc, numH, numS, r2, ehdsOf, sideState, borderState, relocate, channel, holdersFor, deriveRoute, countStop, carriedOf, otherLive, baseRate,
  evidenceNotes, cellMarks, markKey, keyItems, keyMark, renderBand, renderPhone, keyLine, stopTable, columnSources, routeSentence, ehdsLine, relocCount, countLine,
  sysText, unkText, relocText, journeyMarker, journeyCoverage, joinAnd, pct, splitName, eqEarth, greatCircle, locator, presetRoute, presetById,
  namedRoute, sameRoute, wizardEmptyLine, readRouteHash, readStopHash, partsReach, copyLine, WIZ_KEY, WIZ_TRIPS, WIZ_EMPTY, homeFromLocales, tripRoute, wizWhy, rightOf, rightsAt, rightSentence, homeRoute, wizardScene, crossingCells, wizardShouldShow, wizardHtml, validateRoute, encodeRoute, decodeRoute, GLOBE, BEATS, decodeGlobe, gcKm, flyMs, camFor, camFit, globeScene, beatPlan, stopPanelSurface, recordArcs, trailItems, routePicture, stopPanel, trailHtml, renderStage, decodeStop, encodeHash, stopSentence, stopFrom, PATH_INK, STAGE_PIC, routeH2, figCaption, renderDynamic };
if (typeof module !== 'undefined' && module.exports) module.exports = CORE;
else if (typeof window !== 'undefined') window.TravellerCore = CORE;
