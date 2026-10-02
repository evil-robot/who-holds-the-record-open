// One-page country brief (out/brief/<ISO3>/index.html), printable to A4 or Letter. Built from the same data as the page.
// Context only: no claim beyond the index, its published rubric anchors and the strain layer.
const fs = require('fs');

const EU27 = new Set('AUT BEL BGR HRV CYP CZE DNK EST FIN FRA DEU GRC HUN IRL ITA LVA LTU LUX MLT NLD POL PRT ROU SVK SVN ESP SWE'.split(' '));
// Named peer sets where a region-nearest default would miss the obvious comparison.
const PEERS = { ALB: ['GRC', 'HRV', 'BGR'], CAN: ['USA', 'AUS', 'GBR'], USA: ['CAN', 'GBR', 'DEU'], GBR: ['IRL', 'FRA', 'DEU'] };
// What the next band asks for, from RUBRIC.md bands and docs/RUBRIC_V1_1_ANCHORS.md (published method).
const NEXT = {
  access: 'A national portal showing at least part of the record (summary, prescriptions, labs) to most residents puts access at 60 to 75; a near-full record with export, long history and majority use, 76 to 90.',
  control: 'An opt-out or opt-in, a patient-visible access log and granular choices together put control at 60 to 80.',
  privacy: 'Health-sector enforcement on the record: an independent regulator deciding health-data cases, breach notification and penalties applied.',
  journey: 'Primary care, hospitals, labs, pharmacy, claims and public health linked to one record and used at national scale.',
  commercial: 'Clear limits on selling health data or using it for marketing, covering apps and data brokers as well as providers.',
  clinical: 'Treating clinicians able to see the full record across providers, under consent and emergency rules.',
  research: 'A general opt-out that is honoured, or dynamic or opt-in consent, with a public register of research uses: 55 to 85.',
  ai: 'Device regulation of clinical AI with change control and human oversight in force, plus national rules where EU law leaves gaps.',
};

// Bump only when the brief template's prose changes (sitemap lastmod is the later of this and the country's data date).
const TEMPLATE_CHANGED = '2026-10-02';
const LONGDATE = x => new Date(x + 'T12:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
const PUBLISHED = '2026-10-02'; // first public (indexable) date of the briefs; never moves
// Authors, equal billing. Profile links verified 2 Oct 2026 (own profile titles name SuperTruth); Wikidata only where an item exists.
const ST_ORG = { "@type": "Organization", name: "SuperTruth", url: "https://supertruth.ai" };
const AUTHORS = [
  { "@type": "Person", name: "Jason Alan Snyder", jobTitle: "Co-Founder and Chief AI Officer", worksFor: ST_ORG, url: "https://jasonalansnyder.com",
    sameAs: ["https://www.wikidata.org/wiki/Q141434358", "https://orcid.org/0009-0001-6157-8100", "https://www.linkedin.com/in/jasonalansnyder", "https://www.forbes.com/sites/jasonsnyder/"] },
  { "@type": "Person", name: "Bobby Hill", jobTitle: "Co-Founder and CEO", worksFor: ST_ORG, url: "https://www.linkedin.com/in/hillbobby",
    sameAs: ["https://www.linkedin.com/in/hillbobby", "https://www.crunchbase.com/person/bobby-hill-1975"] },
  { "@type": "Person", name: "Dustin Raney", jobTitle: "Chief Strategy Officer", worksFor: ST_ORG, url: "https://www.dustinraney.com/",
    sameAs: ["https://www.linkedin.com/in/dustinraney", "https://ipwatchdog.com/people/dustin-raney/"] },
];
const later = (a, b) => (String(a) > String(b) ? String(a) : String(b));

function buildBriefs({ C, CATS, BANDS, bandOf, rankLabel, N, DIST, STRAIN, SPOTS, esc, asOf, SITE, theN, MODEL_DESC, NOINDEX, NAME, likely = () => '' }) {
  const med = xs => { const s = [...xs].sort((a, b) => a - b), m = (s.length - 1) / 2; return Math.round((s[Math.floor(m)] + s[Math.ceil(m)]) / 2); };
  const eu = C.filter(d => EU27.has(d.iso3));
  const euMed = Object.fromEntries(CATS.map(c => [c.k, med(eu.map(d => d.categories[c.k].score))]));
  const euOverall = med(eu.map(d => d.overall));
  const by = Object.fromEntries(C.map(d => [d.iso3, d]));
  const ordered = [...C].sort((a, b) => b.overall - a.overall || a.name.localeCompare(b.name));
  const Cap = x => x.charAt(0).toUpperCase() + x.slice(1);
  const lcn = c => c.n.toLowerCase().replace(/\bai\b/, 'AI');
  const lastmod = {};
  fs.mkdirSync('out/brief', { recursive: true });
  for (const d of C) {
    const peers = (PEERS[d.iso3] || C.filter(x => x.iso3 !== d.iso3 && x.region === d.region).sort((a, b) => Math.abs(a.overall - d.overall) - Math.abs(b.overall - d.overall)).slice(0, 3).map(x => x.iso3)).filter(i => by[i]).map(i => by[i]);
    const W = 300, X = v => (W * v / 100).toFixed(1);
    const rows = CATS.map(c => {
      const v = d.categories[c.k].score, gm = DIST[c.k].med, em = euMed[c.k];
      const marks = peers.map((p, i) => `<circle cx="${X(p.categories[c.k].score)}" cy="11" r="3.5" fill="#fff" stroke="#6B7280" stroke-width="1.2"><title>${esc(p.name)} ${p.categories[c.k].score}</title></circle>`).join('');
      return `<tr><th scope="row">${esc(c.n)}<span class="w">${c.w}%</span></th><td class="n">${v}</td><td><svg width="${W}" height="22" viewBox="0 0 ${W} 22" aria-hidden="true"><line x1="0" x2="${W}" y1="11" y2="11" stroke="#E5E7EB"/><line x1="${X(gm)}" x2="${X(gm)}" y1="3" y2="19" stroke="#9CA3AF" stroke-width="1.5"/><line x1="${X(em)}" x2="${X(em)}" y1="3" y2="19" stroke="#0F766E" stroke-width="1.5" stroke-dasharray="2 2"/>${marks}<circle cx="${X(v)}" cy="11" r="4.5" fill="#111827"/></svg></td><td class="pv">${peers.map(p => p.categories[c.k].score).join(' · ')}</td></tr>`;
    }).join('');
    const S = STRAIN.countries[d.iso3] || {}, I = S.indicators || {};
    const val = (x, suf = '') => x && x.value != null ? `${(+x.value).toFixed(x.value >= 100 ? 0 : 1)}${suf} <span class="y">${x.year}${x.oecdPeerRank ? ` · OECD ${String(x.oecdPeerRank).split(' (')[0]}` : ''}</span>` : '<span class="unk">unknown</span>';
    const rs = S.recordSplit || { class: 'unknown' };
    const weakest = [...CATS].sort((a, b) => (d.categories[a.k].score - DIST[a.k].med) * a.w - (d.categories[b.k].score - DIST[b.k].med) * b.w).slice(0, 2);
    const b = bandOf(d.overall), nextBand = BANDS.find(x => x.lo > d.overall);
    const laws = (d.laws || []).slice(0, 3).map(l => `<li>${esc(l.name)}${l.year ? ` (${esc(String(l.year))})` : ''}: ${esc(l.what || '')}</li>`).join('');
    const stories = (d.stories || []).slice(0, 2).map(s => `<li><span class="y">${esc(s.date)} · ${esc(s.source)}</span> ${esc(s.headline)}</li>`).join('');
    const dti = d.dti && !d.dti.provisional ? `${d.dti.dti} · ${d.dti.tierLabel}` : 'pending';
    // Computed lede: every figure comes from the country file and the index, with the data year.
    const yr = String(d.asOf || asOf).slice(0, 4), tn = theN(d), url = `${SITE}brief/${d.iso3}/`;
    const gaps = CATS.map(c => ({ c, v: d.categories[c.k].score, m: DIST[c.k].med, g: d.categories[c.k].score - DIST[c.k].med }));
    const best = [...gaps].sort((a, b) => b.g - a.g)[0], worst = [...gaps].sort((a, b) => a.g - b.g)[0];
    const gapTxt = (x, long) => `${lcn(x.c)} (${x.v}, ${long ? `against a median of ${x.m} across ${N} countries` : `median ${x.m}`})`;
    // Answer passage: self-contained and quotable (about 50 words); the detail passage carries strongest and weakest rights.
    const lede = `In ${yr}, ${tn} scores ${d.overall} of 100 on a person's right to see, control and share their own health record: rank ${rankLabel(d.rank)} of ${N} countries${likely(d.iso3) ? ` (likely range ${likely(d.iso3)})` : ''}, in the ${b.n} band (${b.lo} to ${b.hi}). Who holds the keys: ${d.controlModel}. Source: ${NAME}, SuperTruth, this country's data as of ${d.asOf || asOf}.`;
    const detail = `${MODEL_DESC[d.controlModel] || ''} ` +
      `${best.g > 0 ? `Its strongest right against the other countries is ${gapTxt(best, true)}` : `No right sits above the ${N}-country median; the closest is ${gapTxt(best, true)}`}; ${worst.g < 0 ? `its weakest is ${gapTxt(worst)}.` : `no right falls below the median, and the closest to it is ${gapTxt(worst)}.`}`;
    const srcs = []; const seen = new Set();
    for (const c of CATS) for (const x of (d.categories[c.k].sources || [])) if (x.url && !seen.has(x.url)) { seen.add(x.url); srcs.push({ ...x, cat: c.n }); }
    const quote = `In ${yr}, ${tn} scored ${d.overall} of 100 on a person's right to see, control and share their own health record, rank ${rankLabel(d.rank)} of ${N} countries${likely(d.iso3) ? ` (likely range ${likely(d.iso3)})` : ''} (${b.n}; who holds the keys: ${d.controlModel}). Source: ${NAME}, SuperTruth, this country's data as of ${d.asOf || asOf}, ${url}`;
    d._quote = quote; d._lede = lede; d._detail = detail;
    const i = ordered.findIndex(x => x.iso3 === d.iso3);
    const nbrs = [ordered[i - 1], ordered[i + 1]].filter(Boolean).filter(x => !peers.some(p => p.iso3 === x.iso3));
    const link = x => `<a href="../${x.iso3}/">${esc(x.name)}</a> <span class="y">${x.overall}, ${bandOf(x.overall).n}</span>`;
    const title = `Who holds the health record in ${tn}? ${d.overall}/100`; // the brand suffix only where it fits in about 60 characters
    lastmod[d.iso3] = later(d.asOf || asOf, TEMPLATE_CHANGED);
    const ld = { "@context": "https://schema.org", "@graph": [
      { "@type": "Article", "@id": url + "#article", headline: `Who holds the health record in ${tn}?`, description: lede, url, mainEntityOfPage: url,
        image: { "@type": "ImageObject", url: `${SITE}assets/og/${d.iso3}.png`, width: 1200, height: 630 },
        about: { "@type": "Country", name: d.name }, citation: quote, isBasedOn: srcs.slice(0, 5).map(x => x.url), datePublished: PUBLISHED, dateModified: later(lastmod[d.iso3], PUBLISHED), inLanguage: "en",
        author: AUTHORS,
        publisher: { "@type": "Organization", name: "SuperTruth", url: "https://supertruth.ai", sameAs: ["https://www.wikidata.org/wiki/Q141434273"], logo: { "@type": "ImageObject", url: `${SITE}assets/supertruth-icon.svg` } },
        isPartOf: { "@type": "Dataset", name: NAME, url: SITE }, license: "https://creativecommons.org/licenses/by/4.0/", isAccessibleForFree: true },
      { "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: NAME, item: SITE },
        { "@type": "ListItem", position: 2, name: d.name, item: url }] }] };
    const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc((title + ' | SuperTruth').length > 60 ? title : title + ' | SuperTruth')}</title>${NOINDEX ? '<meta name="robots" content="noindex,nofollow">' : ''}
<meta name="description" content="${esc(Cap(tn))} scores ${d.overall} of 100 on health record rights (${yr}; rank ${rankLabel(d.rank)} of ${N}, ${b.n}). Who holds the keys: ${d.controlModel}. Every source cited.">
<meta property="og:type" content="article"><meta property="og:site_name" content="SuperTruth"><meta property="og:title" content="Who holds the health record in ${esc(tn)}? ${d.overall}/100"><meta property="og:description" content="${esc(d.headline)}">
<meta property="og:url" content="${url}"><meta property="og:image" content="${SITE}assets/og/${d.iso3}.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="${esc(d.name)}: ${d.overall} of 100, rank ${rankLabel(d.rank)} of ${N}, ${b.n}. Who Holds the Record by SuperTruth."><meta name="twitter:card" content="summary_large_image">
<meta property="article:published_time" content="${PUBLISHED}"><meta property="article:modified_time" content="${later(lastmod[d.iso3], PUBLISHED)}">
<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, "\\u003c")}</script>
<link rel="canonical" href="${url}"><link rel="icon" href="../../assets/supertruth-icon.svg" type="image/svg+xml">
<style>
@font-face{font-family:Inter;font-weight:100 900;src:url(../../assets/fonts/inter-latin.woff2) format("woff2")}
@font-face{font-family:"JetBrains Mono";font-weight:100 800;src:url(../../assets/fonts/jetbrains-mono-latin.woff2) format("woff2")}
@page{margin:8mm}
*{box-sizing:border-box}body{margin:0;font:400 11.5px/1.4 Inter,system-ui,sans-serif;color:#111827;background:#fff}
.page{max-width:780px;margin:0 auto;padding:24px}
.top{display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #E5E7EB;padding-bottom:10px}
.top img{height:20px}.top .t{font-size:11px;color:#6B7280}
h1{font-size:24px;letter-spacing:-.02em;margin:14px 0 2px;text-wrap:balance}
.lead{font-size:14px;color:#374151;margin:4px 0 12px;max-width:640px}
.facts{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin:10px 0 14px}
.f{border:1px solid #F3F4F6;border-radius:10px;padding:8px 10px}.f b{display:block;font:500 17px "JetBrains Mono",monospace}.f span{font-size:11px;color:#6B7280}
h2{font-size:13px;margin:12px 0 4px}
table{border-collapse:collapse;width:100%}th,td{text-align:left;padding:2px 6px 2px 0;vertical-align:middle;border-bottom:1px solid #F3F4F6}
th{font-weight:500;font-size:12px;white-space:nowrap}th .w{font:400 10px "JetBrains Mono",monospace;color:#6B7280;margin-left:6px}
td.n{font:600 13px "JetBrains Mono",monospace;width:34px}td.pv{font:400 11px "JetBrains Mono",monospace;color:#6B7280;white-space:nowrap}
.key{font-size:11px;color:#6B7280;margin-top:4px}
.two{display:grid;grid-template-columns:1fr 1fr;gap:18px}
ul{margin:4px 0;padding-left:16px}li{margin:2px 0}
.y{font:400 10.5px "JetBrains Mono",monospace;color:#6B7280}.unk{font-style:italic;color:#6B7280}
dl{display:grid;grid-template-columns:200px 1fr;gap:3px 10px;margin:4px 0}dt{color:#374151}dd{margin:0;font-family:"JetBrains Mono",monospace;font-size:12px}
blockquote{margin:4px 0;padding-left:8px;border-left:2px solid #E5E7EB;color:#374151;font-size:11.5px}
.contact{display:flex;gap:10px;align-items:center;margin-top:14px;padding:10px 12px;background:#F0FDFA;border-radius:10px;font-size:11.5px;color:#374151}.contact b{color:#0F766E}
.foot{border-top:1px solid #E5E7EB;margin-top:14px;padding-top:8px;font-size:10px;color:#6B7280}
.print{position:fixed;right:16px;top:16px;border:0;background:#0F766E;color:#fff;font:600 13px Inter;border-radius:999px;padding:10px 16px;cursor:pointer}
.crumbs{font-size:12px;color:#6B7280;margin:10px 0 0}.crumbs a{color:#0F766E;text-decoration:none}.crumbs a:hover{text-decoration:underline}
.answer{font-size:14px;color:#111827;margin:6px 0 4px;max-width:680px}
.quote{border:1px solid #E5E7EB;border-radius:10px;padding:10px 12px;font-size:12.5px;color:#374151;margin:6px 0}
.srcs{font-size:12px;columns:2;column-gap:24px}.srcs li{break-inside:avoid}.srcs a{color:#0F766E;word-break:break-word}
.cmp{display:flex;flex-wrap:wrap;gap:6px 18px;list-style:none;padding:0}.cmp a,.foot a,.contact a{color:#0F766E}
@media screen{body{font-size:13px}.top .t,.key,.foot,.contact,th .w,.y,td.pv{font-size:12px}.f span{font-size:12px}}
@media print{.print,.noprint{display:none}.page{padding:0;zoom:.74}h2{margin:6px 0 2px}p{margin:3px 0}.answer,.lead{margin:3px 0}.facts{margin:6px 0 8px}.contact{margin-top:8px;padding:6px 10px}.foot{margin-top:8px;padding-top:4px}}
.tw{max-width:100%}
@media(max-width:640px){.print{position:static;display:block;margin:12px 16px 0 auto}.tw{overflow-x:auto;-webkit-overflow-scrolling:touch}th{white-space:normal}.facts{grid-template-columns:repeat(2,1fr)}.two{grid-template-columns:1fr}dl{grid-template-columns:1fr}}
</style><script src="../../assets/analytics.js" defer></script></head><body><button class="print" onclick="window.print()">Print or save as PDF</button><div class="page">
<div class="top"><a href="../../"><img src="../../assets/supertruth-logo-dark.svg" alt="Who Holds the Record by SuperTruth: back to the index" width="109" height="20"></a><span class="t">${esc(NAME)} · country brief · this country's data as of ${d.asOf || asOf}</span></div>
<nav class="crumbs noprint" aria-label="Breadcrumb"><a href="../../">${esc(NAME)}</a> › <a href="../../#ranking">Ranking</a> › <span aria-current="page">${esc(d.name)}</span></nav>
<h1>Who holds the health record in ${esc(tn)}?</h1>
<p class="answer">${esc(lede)}</p>
<p class="lead noprint">${esc(detail)}</p>
<p class="lead">${esc(d.headline)}</p>
<p class="y">Published <time datetime="${PUBLISHED}">${LONGDATE(PUBLISHED)}</time> · updated <time datetime="${later(lastmod[d.iso3], PUBLISHED)}">${LONGDATE(later(lastmod[d.iso3], PUBLISHED))}</time> · this country's data as of ${d.asOf || asOf}${/^low$/i.test(d.confidence || '') ? ' · confidence in this score is low: the public evidence is thin' : ''} · research tool, not legal advice</p>
<div class="facts">
<div class="f"><b>${d.overall}</b><span>overall, of 100 · ${b.n}</span></div>
<div class="f"><b>${rankLabel(d.rank)}</b><span>rank of ${N}</span></div>
<div class="f"><b>${esc(d.controlModel)}</b><span>who holds the keys</span></div>
<div class="f"><b>${esc(d.confidence)}</b><span>confidence</span></div>
<div class="f"><b>${dti}</b><span>evidence grade (DTI)</span></div>
</div>
<div class="two"><div>
<h2>Can I get my health records in ${esc(tn)}?</h2>
<p>Access to the full record scores ${d.categories.access.score} of 100 in ${esc(tn)}, against a median of ${DIST.access.med} across ${N} countries. ${esc(d.categories.access.summary)}</p>
</div><div>
<h2>Can I control who sees my health record in ${esc(tn)}?</h2>
<p>Control and consent scores ${d.categories.control.score} of 100 in ${esc(tn)}, against a median of ${DIST.control.med} across ${N} countries. ${esc(d.categories.control.summary)}</p>
</div></div>
<h2>Eight rights, against ${peers.map(p => esc(p.name)).join(', ')} and the EU</h2>
<div class="tw"><table><tbody>${rows}</tbody></table></div>
<p class="key">Black dot: ${esc(d.name)}. Hollow dots: ${peers.map(p => esc(p.name)).join(', ')} (scores on the right, same order). Grey line: median of all ${N} countries. Dashed teal line: EU median. Overall: ${esc(d.name)} ${d.overall}, EU median ${euOverall}. Scores move in steps of about 5; read the rank with its likely range.</p>
<div class="two"><div>
<h2>What would ${esc(tn)} need to change to score higher?</h2>
<p>${nextBand ? `${esc(Cap(tn))} sits in ${b.n} (${b.lo} to ${b.hi}); ${nextBand.n} starts at ${nextBand.lo}.` : ''} The two rights furthest below the ${N}-country median, weighted, are ${weakest.map(c => `${lcn(c)} (${d.categories[c.k].score}, median ${DIST[c.k].med})`).join(' and ')}. The published rubric reads:</p>
<ul>${weakest.map(c => `<li><b>${esc(c.n)}:</b> ${esc(NEXT[c.k])}</li>`).join('')}</ul>
<h2>Which laws give health record rights in ${esc(tn)}?</h2><ul>${laws || '<li class="unk">none listed</li>'}</ul>
</div><div>
<h2>Strain and split <span class="y">context, not scored</span></h2>
<dl><dt>Doctors per 10,000</dt><dd>${val(I.doctorsPer10k)}</dd><dt>Nurses and midwives per 10,000</dt><dd>${val(I.nursesMidwivesPer10k)}</dd><dt>Private insurance + out-of-pocket</dt><dd>${val(I.vhiPlusOopShareCHE, '%')}</dd><dt>Record reaches private care?</dt><dd>${rs.class === 'unknown' ? '<span class="unk">unknown</span>' : esc(rs.class)}</dd></dl>
${I.compulsoryPrivateInsuranceShareCHE && I.compulsoryPrivateInsuranceShareCHE.value >= 1 ? `<p class="key">Compulsory private insurance, counted separately: ${(+I.compulsoryPrivateInsuranceShareCHE.value).toFixed(1)}% of health spending (${I.compulsoryPrivateInsuranceShareCHE.year}).</p>` : ''}
${rs.quote ? `<blockquote>"${esc(rs.quote)}"</blockquote>` : ''}
<h2>Published stories</h2><ul>${stories || '<li class="unk">none published in the last two years</li>'}</ul>
</div></div>
<div class="noprint">
<h2>Compare ${esc(tn)}</h2>
<ul class="cmp">${peers.map(p => `<li>${link(p)}</li>`).join('')}${nbrs.map(x => `<li>${link(x)}</li>`).join('')}<li><a href="#sources">Every source for ${esc(d.name)}</a></li><li><a href="../../#ranking">All ${N} countries</a></li></ul>
<h2>Cite this brief</h2>
<p class="quote">${esc(quote)}</p>
<h2 id="sources">Sources for ${esc(tn)} (${srcs.length})</h2>
<ul class="srcs">${srcs.map(x => `<li><a href="${esc(x.url)}" rel="noopener">${esc(x.title || x.url)}</a> <span class="y">${esc(x.cat)}${x.date && !/n\.?d|not verified/i.test(x.date) ? ` · ${esc(x.date)}` : ''}</span></li>`).join('')}</ul>
</div>
<div class="contact"><img src="../../assets/supertruth-icon.svg" alt="" width="22" height="22"><div><b>SuperTruth Inc.</b> · 24 S. 24th St., Philadelphia, PA 19103, USA · <a href="tel:+12159184140" style="color:inherit;text-decoration:none">+1 215 918 4140</a> · supertruth.ai<br>Questions, corrections or a briefing: supertruth.ai/on-the-record#contact · Full index: <a href="../../">whoholds.supertruth.ai</a></div></div>
<div class="foot">OECD: Organisation for Economic Co-operation and Development (38 mostly high-income countries). DTI: SuperTruth&#39;s Data Trust Index, grading the evidence behind each score. Everything here comes from public information: laws, government and regulator pages, court decisions, published news, WHO, OECD and World Bank data. Full sources: <a href="#sources">${url}#sources</a>. SuperTruth built this index and sells health data verification products; no one paid to be included. Research tool, not legal advice. Text and scores CC BY 4.0.</div>
</div></body></html>`;
    fs.mkdirSync(`out/brief/${d.iso3}`, { recursive: true });
    fs.writeFileSync(`out/brief/${d.iso3}/index.html`, html);
  }
  return { n: C.length, lastmod };
}
module.exports = { buildBriefs, AUTHORS };
