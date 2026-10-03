// The traveling patient (docs/TRAVELLER_DESIGN.md; build notes in docs/TRAVELLER_BUILD.md).
// Build side: loads the data, writes the compact data asset, the land shape and the browser bundle, and renders
// out/traveler/index.html with the visitor in Figure 1, the athlete in Figure 2 (the still for readers without script and for crawlers).
// The derivation and every route-dependent string come from traveller-core.js, the same file the browser runs.
// Run: node build.js (which calls buildTraveller), or node traveller.js after it.
const fs = require('fs');
const path = require('path');
const CORE = require('./traveller-core.js');
const NAVM = require('./nav.js');
const { PARTS, PART_KEYS, EHDS_EARLY, ATHLETE, USEU, VISITOR, PRESETS, MAX_STOPS, LOC, esc, numH, r2, ehdsOf, baseRate, journeyCoverage, joinAnd, TOPIC_WORDS,
  INK, SYS, CARRIED, GUIDE, RULE, UNK } = { ...CORE, INK: '#111827', SYS: '#0F766E', CARRIED: '#AADDD4', GUIDE: '#E5E7EB', RULE: '#D1D5DB', UNK: '#6B7280' };

const ROOT = __dirname;
const SITE_DEFAULT = 'https://healthrecordrights.com/';
const NAME = 'Health Record Rights Index';
const TEMPLATE_CHANGED = '2026-10-02'; // bump only when this page's own prose changes (sitemap lastmod)
const PUBLISHED = '2026-10-02';
const ASSET_LIMIT = 1.9 * 1024 * 1024;

function loadCtx(opts = {}) {
  const data = {};
  for (const f of fs.readdirSync(path.join(ROOT, 'data'))) if (f.endsWith('.json')) { const d = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', f), 'utf8')); data[d.iso3] = d; }
  const xb = JSON.parse(fs.readFileSync(path.join(ROOT, 'analysis/crossborder/crossborder.json'), 'utf8'));
  // Optional research layer: relocation conclusions and the person's own copy, per country (shape in docs/TRAVELLER_BUILD.md).
  const rp = path.join(ROOT, 'analysis/crossborder/relocation_and_copy.json');
  if (opts.rc !== false && fs.existsSync(rp)) xb.rc = readRc(JSON.parse(fs.readFileSync(rp, 'utf8')));
  const fp = path.join(ROOT, 'out/facts.json');
  const facts = fs.existsSync(fp) ? JSON.parse(fs.readFileSync(fp, 'utf8')) : {};
  return { data, xb, facts };
}

// The research file is read as given; only the fields the core uses are kept, and a malformed entry stops the build.
function readRc(j) {
  const countries = j.countries || j;
  const out = {};
  for (const [iso, c] of Object.entries(countries)) {
    if (!/^[A-Z]{3}$/.test(iso) || !c || typeof c !== 'object') continue;
    const e = {};
    if (c.relocation) { e.relocation = {}; for (const [k, v] of Object.entries(c.relocation)) e.relocation[k] = typeof v === 'string' ? { conclusion: v } : { ...pickF(v, ['conclusion', 'quote', 'from', 'parts', 'article', 'recital_quote']), source: v.source ? pickF(v.source, ['title', 'url', 'date']) : null }; }
    for (const k of ['copyRight', 'electronic', 'copyParts']) if (c[k] !== undefined) e[k] = c[k];
    const cs = c.copySource || c.source; if (cs) e.copySource = pickF(cs, ['title', 'url', 'date']);
    out[iso] = e;
  }
  return { meta: pickF(j.meta || {}, ['as_of', 'asOf', 'method']), countries: out };
}

// ---- the compact data asset: only the fields the core reads (tested: same derivation as the full file) ----
const pickF = (f, keep) => { if (!f) return f; const o = {}; for (const k of keep) if (f[k] !== undefined) o[k] = f[k]; return o; };
const FACT_KEYS = ['status', 'publisher', 'title', 'url', 'date', 'search', 'searched_on'];
function dated(f) { return f && f.date && /^\d{4}/.test(f.date) ? f.date : ''; }
function pickFact(block) { // the same choice sideState makes (traveller-core.js pickFact), done once here
  const MAP = CORE.MAP, facts = block.facts || [];
  const same = facts.filter(f => MAP[f.status] === MAP[block.status]);
  const pool = same.length ? same : facts;
  return [...pool].sort((a, b) => (dated(b) > dated(a) ? 1 : dated(b) < dated(a) ? -1 : 0))[0] || null;
}
function compactXb(xb) {
  const G = xb.global_facts.filter(g => ['myhealtheu_overview', 'ehds_dates', 'ehds_third_countries'].includes(g.topic)).map(g => pickF(g, ['topic', 'status', 'publisher', 'url', 'date', 'detail', 'quote']));
  const countries = {};
  for (const [iso, c] of Object.entries(xb.countries)) {
    const mh = {};
    for (const [t, b] of Object.entries(c.myhealtheu)) { const f = pickFact(b); mh[t] = { status: b.status, conflict: b.conflict || undefined, evidence_as_of: b.evidence_as_of || undefined, facts: f ? [pickF(f, FACT_KEYS)] : [] }; }
    countries[iso] = { name: c.name, group: c.group, myhealtheu: mh,
      no_exchange: (c.no_exchange || []).slice(0, 1).map(n => pickF(n, ['searched_on'])),
      other_arrangements: (c.other_arrangements || []).filter(o => o.status === 'live').map(o => pickF(o, ['status', 'partners', 'parts'])),
      us_note: (c.us_note || []).filter(x => x.status === 'live' && /electronic copy/.test(x.quote || '')).slice(0, 1).map(x => pickF(x, ['status', 'quote', 'publisher', 'url', 'date'])),
      fallback: { ehds: c.fallback.ehds } };
  }
  return { meta: { as_of: xb.meta.as_of, kpi_window: xb.meta.kpi_window }, global_facts: G, countries, ...(xb.rc ? { rc: xb.rc } : {}) };
}

// ---- geography at build time: positions, neighbours, the land shape (d3-geo + world-atlas, never in the browser) ----
const POS_FIX = { USA: [-98.5, 39.5], FRA: [2.4, 46.6], NOR: [9.5, 61.5], CAN: [-100, 56], RUS: [90, 60], PRT: [-8.2, 39.6] };
function dedupePath(d) {
  return d.split('M').filter(Boolean).map(ring => {
    const closed = ring.endsWith('Z');
    const pts = ring.replace(/Z$/, '').split('L');
    const out = pts.filter((p, i) => i === 0 || p !== pts[i - 1]);
    return new Set(out).size >= 3 ? 'M' + out.join('L') + (closed ? 'Z' : '') : '';
  }).join('');
}
function geography(isos) {
  const d3 = require('d3-geo'), tc = require('topojson-client'), iso = require('i18n-iso-countries');
  const t50 = require('world-atlas/countries-50m.json'), t10 = require('world-atlas/countries-10m.json');
  const f50 = tc.feature(t50, t50.objects.countries).features, f10 = tc.feature(t10, t10.objects.countries).features;
  // Kosovo has no ISO numeric code in Natural Earth; match its shape by name to the user-assigned code XKX (as build.js does).
  const a3 = f => f.id ? iso.numericToAlpha3(f.id) : (f.properties && f.properties.name === 'Kosovo' ? 'XKX' : null);
  const pos = {}, bb = {};
  for (const i of isos) {
    const f = f50.find(x => a3(x) === i) || f10.find(x => a3(x) === i);
    const c = POS_FIX[i] || (f ? d3.geoCentroid(f) : null);
    if (!c) throw new Error('no position for ' + i);
    pos[i] = [Math.round(c[0] * 100) / 100, Math.round(c[1] * 100) / 100];
    // The bounds of the country's largest landmass (France without its overseas parts), so the stage map can frame it whole.
    if (f) {
      const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
      const main = polys.map(p => ({ type: 'Polygon', coordinates: p })).sort((x, y) => d3.geoArea(y) - d3.geoArea(x))[0];
      const [[w, so], [e, n]] = d3.geoBounds(main);
      bb[i] = [w, so, e, n].map(v => Math.round(v * 10) / 10);
    }
  }
  // neighbours: rated countries sharing a land border (50m), nearest first; otherwise the nearest by distance
  const geoms = t50.objects.countries.geometries, nbIdx = tc.neighbors(geoms), set = new Set(isos);
  const dist = (a, b) => d3.geoDistance(pos[a], pos[b]);
  const nb = {}, nbl = {}; // nbl: how many of nb's entries share a land border (the wizard says why it picked a neighbour)
  for (const i of isos) {
    const gi = geoms.findIndex(g => a3(g) === i);
    const land = gi >= 0 ? [...new Set(nbIdx[gi].map(k => a3(geoms[k])).filter(x => x && set.has(x) && x !== i))] : [];
    const near = isos.filter(x => x !== i && !land.includes(x)).sort((a, b) => dist(i, a) - dist(i, b));
    nb[i] = [...land.sort((a, b) => dist(i, a) - dist(i, b)), ...near].slice(0, 4); nbl[i] = Math.min(land.length, 4);
  }
  const l50 = require('world-atlas/land-50m.json');
  const proj = d3.geoEqualEarth().scale(LOC.K).translate([0, 0]);
  const land = dedupePath(d3.geoPath(proj).digits(1)(tc.feature(l50, l50.objects.land)) || '');
  // The globe's land (stage B): countries-110m, properties cut to iso3, coordinates to 2 decimals. Fetched only with globe.gl.
  const t110 = require('world-atlas/countries-110m.json');
  const pt = c => [Math.round(c[0] * 100) / 100, Math.round(c[1] * 100) / 100];
  const ring = r => r.map(pt).filter((p, i, a) => i === 0 || p[0] !== a[i - 1][0] || p[1] !== a[i - 1][1]);
  const round = c => typeof c[0][0] === 'number' ? ring(c) : c.map(round);
  // Compact form: [iso3, rings] per country, each ring a flat list of integer hundredths (lng, lat, lng, lat...); decoded by CORE.decodeGlobe.
  const flat = rg => rg.flatMap(p => [Math.round(p[0] * 100), Math.round(p[1] * 100)]);
  const globe = { v: 1, f: tc.feature(t110, t110.objects.countries).features.filter(f => a3(f) !== 'ATA').map(f => {
    const polys = f.geometry.type === 'Polygon' ? [round(f.geometry.coordinates)] : round(f.geometry.coordinates);
    return [a3(f) || '', polys.map(poly => poly.map(flat))];
  }) };
  return { pos, bb, nb, nbl, land, proj, globe };
}

function buildTraveller(ctx = {}) {
  const base = loadCtx({ rc: ctx.rc });
  const data0 = ctx.data || base.data, xbFull = ctx.xb || base.xb, facts = ctx.facts || base.facts;
  const SITE = ctx.SITE || SITE_DEFAULT, NOINDEX = ctx.NOINDEX ?? !!process.env.PREVIEW_NOINDEX;
  const VERSION = ctx.VERSION || facts.version || '1.0';
  const outDir = ctx.outDir || path.join(ROOT, 'out/traveler');
  // Only countries with a cross-border entry take part: a country file added before its cross-border research (for example
  // a new wave) stays off this page until analysis/crossborder covers it, instead of breaking the build.
  const isos = Object.keys(data0).filter(i => xbFull.countries[i]).sort();
  const skipped = Object.keys(data0).filter(i => !xbFull.countries[i]);
  if (skipped.length) console.log('traveller: no cross-border entry yet, left out:', skipped.join(' '));
  const GEO = geography(isos);
  const xb = compactXb(xbFull);
  const A2 = require('i18n-iso-countries');
  const data = Object.fromEntries(isos.map(i => [i, { name: data0[i].name, journey: data0[i].journey || {}, pos: GEO.pos[i], ...(GEO.bb[i] ? { bb: GEO.bb[i] } : {}), a2: A2.alpha3ToAlpha2(i) || '' }]));
  const asset = { xb, data, nb: GEO.nb, nbl: GEO.nbl };
  const assetJson = JSON.stringify(asset);
  const landSvg = `<svg xmlns="http://www.w3.org/2000/svg"><path id="land" d="${GEO.land}"/></svg>`;
  const app = `// The traveling patient, browser bundle: traveller-core.js (verbatim) + traveller-client.js. Built by traveller.js.\n(function () {\n${fs.readFileSync(path.join(ROOT, 'traveller-core.js'), 'utf8')}\n})();\n${fs.readFileSync(path.join(ROOT, 'traveller-client.js'), 'utf8')}`;
  const globeJson = JSON.stringify(GEO.globe);
  for (const [n, s] of [['data.json', assetJson], ['land.svg', landSvg], ['app.js', app]]) if (Buffer.byteLength(s) > ASSET_LIMIT) throw new Error(`traveller asset ${n} is over 1.9 MB`);
  // Every traveller asset, and the self-hosted globe.gl it loads, stays under the per-file limit Googlebot reads (1.9 MB here).
  const gl = path.join(outDir, '..', 'assets', 'globe.gl.min.js');
  if (fs.existsSync(gl) && fs.statSync(gl).size > ASSET_LIMIT) throw new Error('assets/globe.gl.min.js is over 1.9 MB');
  if (Buffer.byteLength(globeJson) > 150 * 1024) throw new Error('traveller globe.json is over its 150 KB budget');

  const A = { xb, data, base: baseRate(xb) };
  const BR = A.base, JC = journeyCoverage(data0);
  const asOf = xb.meta.as_of, year = String(asOf).slice(0, 4);
  const url = `${SITE}traveler/`;
  const D = CORE.renderDynamic(A, VISITOR, GEO.nb);
  const [RV, R1, R2] = D.routes;
  const EH = ehdsOf(xb.countries[ATHLETE.home]), EY1 = EH.early, EY2 = EH.late;
  const conflictText = joinAnd(Object.entries(xbFull.countries).filter(([, c]) => Object.values(c.myhealtheu || {}).some(b => b.conflict)).sort((a, b) => a[1].name.localeCompare(b[1].name))
    .map(([, c]) => { const t = Object.entries(c.myhealtheu).filter(([, b]) => b.conflict).map(([k]) => k), kinds = [...new Set(t.map(k => k.slice(0, 2)))];
      const what = kinds.map(k => { const both = t.includes(k + '_send') && t.includes(k + '_recv'), noun = k === 'ps' ? 'health summaries' : 'medicines'; return both ? `${noun}, both ways` : `${noun}, ${t.includes(k + '_send') ? 'sending' : 'receiving'}`; });
      return `${c.name} (${what.join('; ')})`; }));
  const last = R1.derived.at(-1), lastName = data[last.iso3].name;
  const cellsA = R1.derived.flatMap(s => PART_KEYS.flatMap(p => s.cells[p]));
  const unkShare = Math.round(100 * cellsA.filter(c => c.border.state === 'unknown').length / cellsA.length);
  const uOut = R2.derived[0];
  const v1 = RV.derived[0], v2 = RV.derived[1];
  // The lede in plain words (JAS, 2 Oct): every number from the derivation.
  const { WD, numWord, reachTxt, partsReach, longDate } = CORE;
  const usCopy = uOut.counts.copyUnknown ? '' : uOut.counts.copy === 5 ? ' You can bring a copy of all 5 parts.' : uOut.counts.copy ? ` You can bring a copy of ${uOut.counts.copy} of the 5.` : '';
  const athNo = reachTxt(last.counts.bySystem, last.counts.unknownCells, 'there');
  // The US sentence counts every visit, not only the first (editorial seat, 2 Oct).
  const usVisits = R2.derived.filter(s => s.kind === 'visiting'), usBest = Math.max(...usVisits.map(s => s.counts.bySystem));
  const usNo = usBest > 0 ? `at most ${partsReach(usBest, 'there')}` : reachTxt(0, usVisits.reduce((a, s) => a + s.counts.unknownCells, 0), 'there');
  const usStops = joinAnd(usVisits.map(s => data[s.iso3].name));
  const athReloc = R1.derived.reduce((a, s) => a + CORE.relocCount(s), 0);
  const movers = athReloc ? ' The EU describes this service as one for people who are traveling. We found no source that says it also works for people who move.' : '';
  const lede = `In ${year}, a part of your record goes to a doctor in another country by itself only when both countries use the same link, such as MyHealth@EU, the European Union's service for sending a health summary or a prescription to another EU country. Count every one-way route between 2 EU countries and you get ${BR.pairs}. Today a health summary travels by itself on ${BR.live} of them.${movers} Now follow a made-up athlete who moves through ${numWord(R1.derived.length)} clubs. At the last club, in ${lastName}, ${athNo}. Along the way we check ${cellsA.length} pieces: one part of the record, from one country, at one stop. For ${unkShare}% of them, ${WD.noSource}. Fly from the United States to ${usStops}, and ${usNo}.${usCopy}`;

  // Controls (design 4.1): hidden until the script runs, so a reader without script never meets a dead control.
  const opts = isos.slice().sort((a, b) => data[a].name.localeCompare(data[b].name)).map(i => `<option value="${i}">${esc(data[i].name)}</option>`).join('');
  // The trip and home pickers live in the editor under the stage (UX seat, 2 Oct: the settled stage offers only "Change trip").
  const PICKERS = `<div id="stage-pick" class="st-pick"><div class="crow"><label for="tr-preset">Trip</label><select id="tr-preset">${PRESETS.map(p => `<option value="${p.id}"${p.id === 'visitor' ? ' selected' : ''}>${esc(p.title)}</option>`).join('')}<option value="custom">Your own trip</option></select>
<label for="tr-home">Home</label><select id="tr-home">${opts.replace(`value="${VISITOR.home}"`, `value="${VISITOR.home}" selected`)}</select></div><p class="cmodes"><span id="tr-modes"></span></p></div>`;
  // The journey stage (docs/TRAVELLER_JOURNEY_UX.md): server-rendered settled at the last stop; the script adds the transport.
  const ST = D.stage;
  const STAGE = `<section class="stage" id="stage" aria-labelledby="route-h2" tabindex="-1">
<div class="st-left">
<h2 id="route-h2">${D.h2html}</h2>
<p id="st-note" class="st-note" role="status" hidden></p>
<div id="st-panel" class="st-panel">${ST.panel}</div>
<div id="st-wizard" class="st-wizard" hidden></div>
<p class="st-act"><button type="button" id="st-change" hidden>Change trip</button> <button type="button" id="st-play-main" class="st-primary" hidden>Play the trip</button> <a href="#fig1" id="st-read">Details for every stop</a></p>
</div>
<div class="st-map" id="st-map" aria-hidden="true"><div id="st-pic">${ST.picture}</div></div>
<div class="st-trail">
<div class="st-transport" id="st-transport" hidden><button type="button" id="st-back">Previous stop</button><button type="button" id="st-play" aria-pressed="false">Play</button><button type="button" id="st-next">Next stop</button><button type="button" id="st-end">Last stop</button>
<label for="st-range" class="vh">Stop on the trip</label><input type="range" id="st-range" min="0" max="${ST.N}" step="1" value="${ST.idx}" aria-valuetext="${esc(ST.valuetext)}"></div>
<p class="st-trail-h">At each stop: how much of your record arrives by itself.</p>
<div id="st-trail-list">${ST.trail}</div>
</div>
</section>
<p id="route-live" class="vh" aria-live="polite"></p>`;
  const CONTROLS = `<form id="traveller-app" class="controls" hidden aria-label="Change the trip">
${PICKERS}
<fieldset><legend>Stops, in order (up to ${MAX_STOPS})</legend><ol id="tr-stops"></ol>
<div class="crow"><label for="tr-add">Add a stop</label><select id="tr-add">${opts}</select><button type="button" id="tr-add-btn">Add stop</button><span class="chint">or click a country on any map on this page</span></div></fieldset>
<p id="tr-msg" class="cmsg" role="status" aria-live="polite"></p>
<template id="tr-country-options">${opts}</template>
</form>`;
  const CONTROLS_CSS = `
.controls{margin:28px 0 0;padding:14px 0 6px;border-top:.5px solid ${RULE};border-bottom:.5px solid ${RULE};font-size:13px;max-width:1000px}
[hidden]{display:none!important}.controls[hidden]{display:none}.st-note{font-size:13px;color:${INK};border-left:2px solid ${UNK};padding-left:8px;margin:6px 0;max-width:500px}.routepic{cursor:crosshair}.controls label,.controls legend{color:#374151;font-size:12px}.controls fieldset{border:0;padding:0;margin:10px 0 0}
.controls .crow{display:flex;flex-wrap:wrap;align-items:center;gap:6px 10px}.controls select,.controls button{font:inherit;font-size:13px;color:${INK};background:#fff;border:.5px solid #9CA3AF;border-radius:4px;padding:4px 6px}
.controls button{cursor:pointer}.controls button:disabled{color:${UNK};cursor:default}.controls :focus-visible{outline:2px solid ${SYS};outline-offset:1px}
#tr-stops{margin:6px 0 8px;padding-left:22px}#tr-stops li{margin:3px 0}#tr-stops li .crow{gap:4px 8px}.cmodes,.chint,.cmsg{font-size:12px;color:${UNK};margin:6px 0 0}.cmsg:empty{display:none}
.figs{display:block}.loc.pick{cursor:crosshair}
.stage{position:relative;min-height:clamp(620px,70vh,700px);margin:12px 0 28px;border-bottom:.5px solid ${RULE};outline:none}
.st-left{position:relative;z-index:2;width:520px;padding-top:4px}.st-left h2{font-size:22px;line-height:1.3;margin:6px 0 10px;max-width:520px}
.st-map{position:absolute;left:440px;right:0;top:0;bottom:92px;overflow:hidden}#st-pic,#st-pic svg{display:block;width:100%;height:100%}
.st-globe{position:absolute;inset:0;opacity:0;transition:opacity .2s}.st-map.globe-on .st-globe{opacity:1}.st-map.globe-on #st-pic{visibility:hidden}
.gl-lab{width:0;height:0;position:relative;pointer-events:none}
.gl-in{position:absolute;top:-8px;left:-8px;height:16px;font:400 13px Inter,system-ui,sans-serif;color:${INK};white-space:nowrap;display:flex;align-items:center;gap:6px}
.gl-in .t{background:rgba(255,255,255,.85);padding:0 2px}.gl-in .d{flex:none;width:16px;height:16px;box-sizing:border-box;border:1px solid ${INK};border-radius:50%;background:#fff;font:500 10px "JetBrains Mono",monospace;display:flex;align-items:center;justify-content:center}
.gl-in.solid .d{background:${INK};color:#fff}.gl-in.home{left:auto;right:-4px}.gl-in.home .d{width:8px;height:8px;background:${INK};border:0}.gl-in.home .t{color:${UNK};font-size:11px;background:none}.gl-in.home.dotless{right:11px}.gl-in.left{left:auto;right:-8px;flex-direction:row-reverse}.gl-in.home.dotless .d{display:none}
.gl-msg{position:absolute;left:120px;bottom:16px;font-size:12px;color:${UNK};background:#fff}
#st-panel{position:relative}
@media (prefers-reduced-motion:reduce){.st-globe{transition:none}}
.st-map::before{content:"";position:absolute;left:0;top:0;bottom:0;width:240px;background:linear-gradient(to right,#fff 0,#fff 33%,rgba(255,255,255,0) 100%);z-index:1;pointer-events:none}
.routepic text{font-family:Inter,system-ui,sans-serif;fill:${INK}}.routepic .pn{font:500 10px "JetBrains Mono",monospace}.routepic .pn.inv{fill:#FFFFFF}.routepic .ph{font-size:11px;fill:${UNK}}.routepic .pl{font-size:13px}.routepic .pl .n{font-family:"JetBrains Mono",monospace}
.st-pick .crow{display:flex;flex-wrap:wrap;gap:6px 8px;align-items:center;font-size:12px;color:#374151}.st-pick select{font:inherit;font-size:13px;max-width:250px;border:.5px solid #9CA3AF;border-radius:4px;padding:3px 5px;background:#fff;color:${INK}}
.st-pick .cmodes{font-size:12px;color:${UNK};margin:4px 0 0}
.panel{border-top:.5px solid ${RULE};margin-top:10px;padding-top:8px}.pl-head{font:400 12px "JetBrains Mono",monospace;color:${UNK};margin:0}.pl-pair{font-size:20px;font-weight:500;margin:2px 0 6px}
.pl-rows{width:auto;border-collapse:collapse}.pl-rows th,.pl-rows td{border:0;padding:2px 10px 2px 0;font-size:13px;vertical-align:middle}.pl-rows th{font-weight:400;width:110px;white-space:nowrap;font-size:12.5px}.pl-rows td:last-child{color:#374151;font-size:12.5px}
.pl-lane{display:block}.pl-cnt{font-size:13px;margin:6px 0 2px;display:flex;flex-wrap:wrap;gap:2px 16px}.pl-right{font-size:12px;color:${UNK};margin:2px 0}.kright i{font-style:normal;color:${UNK}}.pl-sent{font-size:12.5px;color:#374151;margin:2px 0}.pl-src{font-size:11px;color:${UNK};margin:2px 0}.pl-src a{color:${UNK}}.pl-dig{font-size:12.5px;margin:2px 0}
.pl-jm{font-size:11.5px;color:#374151}.pl-jm span{white-space:nowrap;margin-right:8px}.pl-jm svg{vertical-align:-1px}
.st-act{margin:8px 0 0;font-size:13px;display:flex;gap:12px;align-items:center}.st-act button,.st-transport button{font:inherit;font-size:13px;border:.5px solid #9CA3AF;border-radius:4px;background:#fff;color:${INK};padding:5px 10px;cursor:pointer}.st-act .st-primary{border-color:${SYS};color:${SYS}}
.stage :focus-visible{outline:2px solid ${SYS};outline-offset:1px}
.st-trail{position:relative;z-index:2;margin-top:12px;min-height:80px;background:#fff}.stage{display:flex;flex-direction:column;justify-content:space-between}
.st-transport{display:flex;gap:6px;align-items:center;margin:6px 0 4px}.st-transport input{flex:1;accent-color:${SYS}}
.trail-list{list-style:none;padding:0;margin:4px 0 0;display:flex;flex-wrap:wrap;gap:2px 4px;font-size:12.5px}.trail-list li+li::before{content:"";display:inline-block;width:18px;height:0;border-top:.5px solid ${RULE};vertical-align:middle;margin:0 4px}
.trail-list .tick{font:inherit;border:0;background:none;padding:2px 4px;color:#374151}.trail-list button.tick{cursor:pointer}.wz-sub{color:#6B7280;font-size:12.5px}.trail-list .cur .tick{color:${INK};box-shadow:inset 0 -1.5px 0 ${INK}}
.colmark{position:absolute;top:0;height:1.5px;background:${INK};pointer-events:none}.bandwrap{position:relative}
.st-wizard fieldset{border:0;padding:0;margin:8px 0 0;min-width:0}.st-wizard legend{padding:0;font-size:12px;color:${UNK};font-family:"JetBrains Mono",monospace}
.wz-h{display:block;font:500 20px Inter,system-ui,sans-serif;color:${INK};margin:2px 0 6px;outline:none}.stage .wz-h:focus,.stage .wz-h:focus-visible{outline:none}.wz-line{font-size:13.5px;color:#374151;margin:4px 0 10px;max-width:480px}
.wz-opts{list-style:none;padding:0;margin:4px 0 10px}.wz-opts li{margin:4px 0}.wz-opts label{display:flex;gap:8px;align-items:center;font-size:14px;cursor:pointer;min-height:32px}
.wz-keys{list-style:none;padding:0;margin:4px 0 10px}.wz-keys li{display:flex;gap:10px;align-items:center;font-size:13.5px;margin:6px 0}.wz-keys svg{flex:none}
.wz-empty{font-size:13.5px;color:${INK};border-left:2px solid ${SYS};padding-left:8px;margin:6px 0 10px}
.wz-nav{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-top:8px}.wz-nav button,.st-wizard select{font:inherit;font-size:13.5px;border:.5px solid #9CA3AF;border-radius:4px;background:#fff;color:${INK};padding:5px 10px;cursor:pointer;min-height:32px}
.wz-nav .st-primary{border-color:${SYS};color:${SYS}}.wz-skip{font-size:13px;color:${SYS};background:none!important;border:0!important;text-decoration:underline;padding:5px 0!important}
.stage.wz-open #st-panel,.stage.wz-open .st-act,.stage.wz-open .st-transport,.stage.wz-open .st-trail{display:none}
.st-trail-h{font-size:11.5px;color:${UNK};margin:0 0 2px}
@media (max-width:700px){.st-act button,.st-transport button{white-space:nowrap;padding:5px 7px}.st-transport{flex-wrap:wrap}.st-transport input{flex:1 1 100%}.st-act{flex-wrap:wrap;gap:8px}.st-wizard{order:2}.wz-nav button,.st-wizard select{min-height:44px}.st-wizard select{width:100%}.stage{height:auto;display:flex;flex-direction:column}.st-left{display:contents}.st-left h2{order:1}.st-pick{order:2}.st-map{order:3}.st-panel{order:4}.st-act{order:5}.st-trail{order:6}.pl-lane{width:120px;height:auto}.pl-rows th{width:auto}.st-map{position:relative;left:auto;height:auto;bottom:auto;margin:8px 0}.st-map svg{height:auto}.st-map::before{display:none}.st-trail{position:static;height:auto;background:none}.st-transport button{min-height:44px;min-width:44px}.st-pick select{max-width:none;width:100%}}
@media print{.stops tr{break-inside:avoid}.stage{min-height:0!important;margin:0}.st-globe{display:none}.controls{display:none!important}.stops td.src{width:42%;max-width:none}.stops td,.stops th{padding:1px 6px 1px 0}.via{font-size:10px}.stage{height:auto;border:0}.stage>*:not(.st-left),.st-left>*:not(h2){display:none!important}}
@media (max-width:700px){.controls .crow{flex-direction:column;align-items:stretch}.controls select,.controls button{width:100%}#tr-stops .crow{flex-direction:row;flex-wrap:wrap;align-items:center}#tr-stops select{flex:1 1 45%;width:auto}#tr-stops button{flex:1 1 28%;width:auto;font-size:12px;padding:3px 4px}}`;
  const title = 'The traveling patient: does your health record cross the border?';
  const description = lede.length > 300 ? lede.slice(0, lede.lastIndexOf(' ', 297)) + '...' : lede;
  const AUTHORS = require('./brief.js').AUTHORS;
  const ld = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'Article', '@id': url + '#article', headline: 'The traveling patient', description: lede, url, mainEntityOfPage: url,
      image: { '@type': 'ImageObject', url: `${SITE}assets/og.png`, width: 1200, height: 630 },
      datePublished: PUBLISHED, dateModified: asOf > TEMPLATE_CHANGED ? asOf : TEMPLATE_CHANGED, inLanguage: 'en', author: AUTHORS,
      publisher: { '@type': 'Organization', name: 'SuperTruth', url: 'https://supertruth.ai', sameAs: ['https://www.wikidata.org/wiki/Q141434273'] },
      isPartOf: { '@type': 'Dataset', name: NAME, url: SITE }, license: 'https://creativecommons.org/licenses/by/4.0/', isAccessibleForFree: true,
      about: [...new Set([ATHLETE.home, ...ATHLETE.stops.map(s => s.iso3), USEU.home, ...USEU.stops.map(s => s.iso3)])].map(i => ({ '@type': 'Country', name: data[i].name })) },
    { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: NAME, item: SITE }, { '@type': 'ListItem', position: 2, name: 'The traveling patient', item: url }] }] };

  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>${NOINDEX ? '<meta name="robots" content="noindex,nofollow">' : ''}
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${url}"><link rel="icon" href="../assets/supertruth-icon.svg" type="image/svg+xml">
<meta property="og:type" content="article"><meta property="og:site_name" content="SuperTruth"><meta property="og:title" content="The traveling patient: does your health record cross the border?"><meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${url}"><meta property="og:image" content="${SITE}assets/og.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="Health Record Rights Index by SuperTruth"><meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>
<style>
@font-face{font-family:Inter;font-weight:100 900;src:url(../assets/fonts/inter-latin.woff2) format("woff2")}
@font-face{font-family:"JetBrains Mono";font-weight:100 800;src:url(../assets/fonts/jetbrains-mono-latin.woff2) format("woff2")}
*{box-sizing:border-box}
body{margin:0;font:400 15px/1.55 Inter,system-ui,sans-serif;color:${INK};background:#fff}
.page{max-width:1420px;margin:0 auto;padding:28px 40px 64px}
.top{display:flex;justify-content:space-between;align-items:center;border-bottom:.5px solid ${RULE};padding-bottom:10px}
.top img{height:20px}.top .t{font-size:12px;color:${UNK}}
.crumbs{font-size:12px;color:${UNK};margin:10px 0 0}.crumbs a{color:${SYS};text-decoration:none}
h1{font-size:30px;font-weight:600;letter-spacing:-.015em;margin:22px 0 6px;text-wrap:balance}
h2{font-size:18px;font-weight:400;margin:34px 0 6px;text-wrap:balance}
h3{font-size:14px;font-weight:400;margin:18px 0 4px}
p{max-width:720px}
.lede{font-size:17px;color:#374151}.dek{font-size:17px;color:#111827;margin:4px 0 14px;max-width:720px}
.n{font-family:"JetBrains Mono",ui-monospace,monospace;font-variant-numeric:tabular-nums;font-size:.92em}
.small,.d{font-size:12px;color:${UNK}}
a{color:${SYS}}
.fig{margin:36px 0 48px;padding:0}
.cap{font-size:14px;color:#374151;max-width:1000px;margin:0 0 14px}.cap em{font-style:normal;font-weight:600;color:${INK}}
.figbody{display:flex;gap:28px;align-items:flex-start}
.main{flex:0 1 auto;min-width:0;max-width:100%}.scroll{overflow-x:auto}
.band{display:block}
.band text{font-family:Inter,system-ui,sans-serif;fill:${INK}}
.band .n,.band tspan.n{font-family:"JetBrains Mono",ui-monospace,monospace;font-variant-numeric:tabular-nums}
.band .lane{font-size:12.5px;fill:#374151}.band .yr{font-size:11px;fill:${SYS}}.band .sys{fill:${SYS}}.band .ehds,.band .nf{font-size:11px;fill:${UNK}}.band .jl{font-size:11px;fill:#374151}.band .jh{font-size:11px;fill:${UNK}}.band .jk{font-size:10px;fill:${UNK}}
.band .lab{font-size:11px;fill:${UNK}}
.band .head{font-size:15px}
.band .mode{font-size:11px;fill:${UNK}}
.band .cnt{font-size:13px}
.band .sub{font-size:11px;fill:#374151}
.band .sn{font-size:10px;fill:${INK}}
.colsrc{display:grid;font-size:10.5px;line-height:1.35;color:${UNK};margin-top:6px}.colsrc>div{padding:0 6px 0 6px;overflow-wrap:normal;word-break:normal;overflow:hidden}.colsrc>div>a,.colsrc>div>span{display:inline-block;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;vertical-align:bottom}.colsrc>div:first-child{text-align:right;padding-right:16px}
.colsrc a{color:${UNK}}
.margin{flex:0 0 200px;font-size:11.5px;line-height:1.45;color:#374151}
.margin .loc{display:block}
.loc .mn{font:400 7.5px "JetBrains Mono",monospace;fill:${INK}}.loc .ml{font:400 8px Inter,sans-serif;fill:${UNK}}
.sidenote{margin:0 0 10px}.sidenote>.n:first-child{color:${INK};margin-right:2px}
.sc{font-variant:small-caps;letter-spacing:.04em}
.key{font-size:12px;color:#374151;margin:8px 0 0;max-width:none;display:flex;flex-wrap:wrap;gap:2px 14px}.key span{white-space:nowrap}.key .kright{white-space:normal;flex-basis:100%;max-width:72ch}@media (max-width:700px){.key span{white-space:normal;display:block;padding-left:35px;text-indent:-35px}}.key svg{vertical-align:-2px;margin-right:5px}
.mnotes{font-size:13.5px;max-width:760px;padding-left:22px}.mnotes li{margin:0 0 6px}
.phonewrap{display:none}.phone text{font-family:Inter,system-ui,sans-serif;fill:${INK}}.phone .n,.phone tspan.n{font-family:"JetBrains Mono",ui-monospace,monospace}.phone .ph{font-size:10px;font-variant:small-caps;fill:#374151}.phone .py{font-size:10px;fill:${SYS}}.phone .pn{font-size:11px}.phone .pm{font-size:10px;fill:${UNK}}.phone .pc{font-size:10px;fill:#374151}.phone .pc .n{fill:#374151}
.route{font-size:15px;margin:24px 0 0}.key svg+svg{margin-left:0}
.stops{list-style:none;padding:0;margin:18px 0 0;columns:1}
.stops>li{border-top:.5px solid ${RULE};padding:4px 0 10px}
.stops h3{margin:8px 0 2px}.stops p{font-size:13px;margin:2px 0 6px}
.stops details{font-size:12px}
table{border-collapse:collapse;width:100%;font-size:12px}
th,td{text-align:left;vertical-align:top;padding:3px 10px 3px 0;border-bottom:.5px solid ${GUIDE}}
thead th{font-weight:400;color:${UNK}}th[scope=row]{font-weight:400}
td.src{font-size:11px;max-width:360px;overflow-wrap:anywhere}.via{font-size:11px;color:${UNK}}
.method p,.method li{font-size:14px;max-width:760px}
.contact{margin-top:36px;padding-top:12px;border-top:.5px solid ${RULE};font-size:12.5px;color:#374151;display:flex;gap:10px;align-items:flex-start}
.foot{margin-top:12px;font-size:11.5px;color:${UNK}}
.vh{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
@media (max-width:1180px){.figbody{flex-direction:column}.margin{flex:none;max-width:720px;columns:2;column-gap:24px}.margin .loc{break-inside:avoid}}
@media (max-width:700px){.page{padding:18px 16px 48px}h1{font-size:24px}.scroll{display:none}.phonewrap{display:block;margin:4px 0}.phone{max-width:100%;height:auto}.margin{columns:1}.sidenote{margin-top:8px!important}
 .top{flex-wrap:wrap;gap:6px}.top .t{overflow-wrap:anywhere}.stops table{font-size:11px}.stops thead{display:none}.stops td,.stops th{display:block;border:0;padding:1px 0}.stops tr{display:block;border-bottom:.5px solid ${GUIDE};padding:4px 0}
 .stops td[data-l]::before{content:attr(data-l) ": ";color:${UNK}}}
@page{size:landscape;margin:12mm}
@media print{#stops{break-before:page}.page{max-width:none;padding:0}.main{width:auto!important}.crumbs{display:none}.scroll{overflow:visible}.bandwrap,.fig .key{zoom:var(--pz)}.bandwrap{width:auto!important}.cap{break-after:avoid}.figbody{display:block;break-inside:avoid}.margin{columns:2;column-gap:20px;max-width:none}
 .fig{break-inside:avoid;margin:0 0 12px}.stops>li{break-inside:avoid}a{color:inherit;text-decoration:none}body{font-size:11px}.cap{font-size:12px}h1{font-size:22px}}
${CONTROLS_CSS}${NAVM.NAV_CSS}</style><script src="../assets/analytics.js" defer></script><script src="app.js" defer></script></head><body>${NAVM.navHTML({ base: '../', active: 'traveller' })}<div class="page">
<div class="top"><span class="t">${esc(NAME)} · border status checked on ${numH(longDate(asOf))}</span></div>
<nav class="crumbs" aria-label="Breadcrumb"><a href="../">${esc(NAME)}</a> › <span aria-current="page">The traveling patient</span></nav>
<h1>The traveling patient</h1>
<p class="dek">${numH(WD.record)}</p>
${STAGE}
<p class="lede">${numH(lede)}</p>
<p>At each stop, the figure asks how many of the 5 parts of your record reach the doctor there. It also asks how they get there: by themselves, or only if you bring a copy. The first column shows what you have at home. The year beside each part is when EU law says it must cross between EU countries. When you visit, your record comes from home at every stop. It does not hop from one stop to the next. ${WD.split} Each row of the figure splits into one piece for each country that holds part of your record. A filled piece reaches your new doctor by itself.</p>
${CONTROLS}
<div id="figs">${D.figs}</div>
<h2 id="stops">Stop by stop</h2>
<div id="stops-dyn">${D.stops}</div>
<h2>How the figure is made</h2>
<div class="method">
<p>Each of the 5 parts gets a row of the same width. A missing scan does not matter the same as a missing summary, but the count treats every part the same. We do not give any country one score for how well records travel.</p>
<p>We check each border from both sides. The country that holds the part must send it, and the country you are in must receive it. If both do, the part "${WD.arrives}". If either side has nothing, we write "${WD.none}": we looked and found none. A known "${WD.none}" wins over "${WD.unknown}". If either side is not known, the result is "${WD.unknown}". If either side only has a date in law, the result is "not yet; EU law from" that date, using the later of the two years. Inside the EU, a part that does not cross today gets its EU law year: ${numH(String(EY1))} for summaries and medicines, ${numH(String(EY2))} for the rest.</p>
<p>Sometimes a country's own sources and the European Commission's figures on records sent disagree. This happens for ${esc(conflictText)}. We do not pick a side. We draw it as "${WD.unknown}".</p>
<p>Sample trips, all made up: ${PRESETS.map(p => `${esc(p.title)} (${esc(p.modes)})`).join('; ')}. When a trip needs a neighbour, we use the nearest country we cover that shares a land border with home. If there is none, we use the nearest country. You can build your own trip with up to ${numH(String(MAX_STOPS))} stops. A country can come back only if it is your home or a place you lived.</p>
<p>The year beside each part is the date EU law sets for it (the European Health Data Space law, Article 105). It is a promise in law, not something that happens today. It only counts when both countries are in the EU. Under a stop where it does not count, the figure prints "Not under EU law". Norway, Iceland and Liechtenstein are not in the EU but follow many EU rules. We did not check whether these dates bind them, so under Norway the figure prints "EU law: not checked". Under a stop where you moved, the "${WD.unknown}" and "would arrive on a visit" counts are counts of pieces.</p>
<p>The small map shows the trip, with stops numbered in order. The order matters; the distance does not. In the home column, seven dots show how joined-up care is inside your home country. That is a different question from crossing a border. A filled dot means connected, a half-filled dot means partly connected, an open dot means not shared, and a dashed dot means not known. Across all ${numH(String(Object.keys(data).length))} countries, ${numH(`${JC.u.toLocaleString('en-US')} of ${JC.n.toLocaleString('en-US')}`)} of these dots (${numH(`${JC.pct}%`)}) are not known.</p>
<ol class="mnotes" id="method-notes">${D.methodNotes}</ol>
<p>We picked the sample trips to show different results, so they are not typical. Note 2 gives the count for the whole EU. When you change the trip above the chart, your browser redraws the chart, its notes and the stop tables with the same rules. Border status checked on ${numH(longDate(asOf))}. SuperTruth research. Version ${numH(VERSION)}.</p>
</div>
<p class="small">Design based on Strings, a work by Artists &amp; Robots.</p>
<div class="contact"><img src="../assets/supertruth-icon.svg" alt="" width="22" height="22"><div>SuperTruth Inc. · 24 S. 24th St., Philadelphia, PA 19103, USA · <a href="tel:+12159184140" style="color:inherit;text-decoration:none">+1 215 918 4140</a> · supertruth.ai<br>Questions, corrections or a briefing: supertruth.ai/on-the-record#contact · Full index: <a href="../">healthrecordrights.com</a></div></div>
<div class="foot">EHDS: the European Health Data Space law, Regulation (EU) ${numH('2025/327')}. It sets the year each part must cross between EU countries. MyHealth@EU: the EU's service for sending a health summary or prescription to another EU country. Everything here comes from public pages; each stop's table names them. SuperTruth built this index and sells tools that check health data; no one paid to be included. This is a research tool, not legal or medical advice. Text and data CC BY 4.0.</div>
</div></body></html>`;


  if (Buffer.byteLength(html) > ASSET_LIMIT) throw new Error('traveller index.html is over 1.9 MB');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'index.html'), html);
  fs.writeFileSync(path.join(outDir, 'data.json'), assetJson);
  fs.writeFileSync(path.join(outDir, 'land.svg'), landSvg);
  fs.writeFileSync(path.join(outDir, 'app.js'), app);
  fs.writeFileSync(path.join(outDir, 'globe.json'), globeJson);
  return { html, D, routes: D.routes, baseRate: BR, journey: JC, lastmod: asOf > TEMPLATE_CHANGED ? asOf : TEMPLATE_CHANGED, url, asset, app, geo: GEO, sizes: { globe: Buffer.byteLength(globeJson), data: Buffer.byteLength(assetJson), land: Buffer.byteLength(landSvg), app: Buffer.byteLength(app) } };
}

// Stage 2 API kept for tests: renderBand etc. come straight from the core.
module.exports = { ...CORE, buildTraveller, compactXb, geography, readRc };

if (require.main === module) {
  const r = buildTraveller();
  console.log('traveller: out/traveler/index.html', r.routes.map(x => `${x.id} ${x.derived.flatMap(s => PART_KEYS.flatMap(p => s.cells[p])).filter(c => c.ch.state === 'unknown').length} unknown`).join(', '), `base rate ${r.baseRate.live}/${r.baseRate.pairs}, unknown ${r.baseRate.unknownPct}%`, `assets globe ${r.sizes.globe} B, data ${r.sizes.data} B, land ${r.sizes.land} B, app ${r.sizes.app} B`);
}
