// Press kit page (out/press-kit/index.html): key findings, assets, method in brief, boilerplate, contact.
// Every figure is computed from the same data as the page. Boilerplate is SuperTruth's locked text (supertruth.ai boilerplate.ts).
const fs = require('fs');
const NAVM = require('./nav.js');

const BOILERPLATE = [
  'SuperTruth is a data truth company. Before an AI model acts on a record, a place, or another agent, we prove it.',
  'It works in three parts. DTI™ is our patented trust score: 0 to 100, across eight dimensions, on any record. DataSpine is our sourced map of every place in the U.S.: tens of millions of data points, each with its source and vintage. VIGIL scores the AI agents that use that data and locks the result in a hash-chained ledger nobody can quietly edit.',
  'We started in health because a wrong record there costs the most. The same proof works in finance, media, and anywhere you trust a machine to act.',
  'SuperTruth: Data truth is AI truth.',
];

function buildPressKit({ C, N, ranked, bandOf, rankLabel, BANDS, bandCount, modelCount, median, top, storyTotal, asOf, SITE, esc, notFull, nSplit, VERSION, YEAR, leadGroup = [], soleLead = false, likely = () => '' }) {
  const lowest = ranked[ranked.length - 1].overall;
  const last = ranked.filter(d => d.overall === lowest).map(d => d.name).sort();
  const lastTxt = last.length > 1 ? `${last.slice(0, -1).join(', ')} and ${last.at(-1)} share last place at ${lowest}` : `${last[0]} is last at ${lowest}`;
  const jn = xs => xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs.at(-1)}`;
  // DECISION_RULES.md rule 2: name a sole leader only if it is first in 95% of main-model draws.
  const leadTxt = soleLead ? `${top.name} leads at ${top.overall} of 100.` : leadGroup.length > 1 ? `The highest scores are ${jn(leadGroup.map(d => `${d.name} (${d.overall})`))}; allowing for scoring error, any of them could rank first.` : `${top.name} scores highest at ${top.overall} of 100.`;
  const facts = [
    `In none of the ${N} countries we rated does the person hold the keys to their own health record. Control sits with the state or providers: ${modelCount.Shared} Shared, ${modelCount.Institutional} Institutional, ${modelCount.State} State.`,
    `${leadTxt} The median is ${median}. No country reaches the Leading band (85 and up).`,
    `By band: ${bandCount.Strong} Strong, ${bandCount.Mixed} Mixed, ${bandCount.Weak} Weak${bandCount.Poor ? `, ${bandCount.Poor} Poor` : ''}. ${lastTxt}.`,
    `In ${notFull} of the ${nSplit} countries we could check, the public health record does not fully reach private care.`,
    `${storyTotal} published accounts of real record problems, from regulators, courts and the news, sit beside the scores without changing them.`,
    `Every score cites the public pages it rests on. Data and scores are open under CC BY 4.0.`,
  ];
  const lede = `In none of the ${N} countries scored in ${String(asOf).slice(0, 4)} does the person hold the keys to their own health record; ${soleLead ? `${top.name} leads at ${top.overall} of 100` : leadGroup.length > 1 ? `${jn(leadGroup.map(d => d.name))} have the highest scores` : `${top.name} scores highest at ${top.overall} of 100`}.`;
  const top10 = ranked.slice(0, 10).map(d => `<tr><td class="n">${rankLabel(d.rank)}</td><td class="n">${likely(d.iso3)}</td><td>${esc(d.name)}</td><td class="n">${d.overall}</td><td>${bandOf(d.overall).n}</td></tr>`).join('');
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Press kit: the Health Record Rights Index | SuperTruth</title>
<meta name="description" content="Press kit for the Health Record Rights Index, SuperTruth's open index of health record rights in ${N} countries: key findings, images, data, method and contact.">
<link rel="canonical" href="${SITE}press-kit/"><link rel="icon" href="../assets/supertruth-icon.svg">
<meta property="og:title" content="Press kit: the Health Record Rights Index"><meta property="og:site_name" content="SuperTruth"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="Health Record Rights Index by SuperTruth: health record rights in ${N} countries"><meta property="og:description" content="${esc(lede)}"><meta property="og:type" content="website">
<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'WebPage', name: 'Press kit: the Health Record Rights Index', url: `${SITE}press-kit/`, description: lede, dateModified: asOf, isPartOf: { '@type': 'WebSite', name: 'Health Record Rights Index', url: SITE }, datePublished: '2026-10-02', author: require('./brief.js').AUTHORS, publisher: { '@type': 'Organization', name: 'SuperTruth', url: 'https://supertruth.ai', telephone: '+1-215-918-4140' } }).replace(/</g, '\\u003c')}</script><meta property="og:image" content="${SITE}assets/og.png"><meta property="og:url" content="${SITE}press-kit/"><meta name="twitter:card" content="summary_large_image">
<style>
@font-face{font-family:Inter;font-weight:100 900;src:url(../assets/fonts/inter-latin.woff2) format("woff2")}
@font-face{font-family:"JetBrains Mono";font-weight:100 800;src:url(../assets/fonts/jetbrains-mono-latin.woff2) format("woff2")}
body{margin:0;font:400 16px/1.6 Inter,system-ui,sans-serif;color:#111827}
.wrap{max-width:860px;margin:0 auto;padding:32px 24px 64px}
.top{display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #F3F4F6;padding-bottom:12px}
.top img{height:24px}.top a{color:#374151;font-size:14px;text-decoration:none}
.ov{font-size:12px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;color:#0F766E;margin:32px 0 8px}
h1{font-size:clamp(32px,4vw,44px);line-height:1.15;letter-spacing:-.02em;margin:0;text-wrap:balance}
h2{font-size:22px;margin:40px 0 10px;text-wrap:balance}
p,li{color:#374151}
ul.facts li{margin:8px 0}
table{border-collapse:collapse;width:100%;max-width:520px}td,th{text-align:left;padding:6px 10px 6px 0;border-bottom:1px solid #F3F4F6}td.n{font-family:"JetBrains Mono",monospace;font-weight:500}
.assets{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:16px;margin-top:12px}
.assets figure{margin:0;border:1px solid #E5E7EB;border-radius:12px;overflow:hidden}.assets img{width:100%;display:block}.assets figcaption{font-size:13px;padding:8px 10px;color:#374151}
a{color:#0F766E}
.box{background:#F0FDFA;border-radius:12px;padding:16px 18px;margin-top:12px}
.cite{font:400 13px "JetBrains Mono",monospace;background:#F9FAFB;border:1px solid #E5E7EB;border-radius:8px;padding:10px 12px;white-space:pre-wrap}
${NAVM.NAV_CSS}</style><script src="../assets/analytics.js" defer></script></head><body>${NAVM.navHTML({ base: '../', active: 'press' })}<div class="wrap">
<p class="ov">Press kit</p>
<h1>The Health Record Rights Index: who holds the record in ${N} countries?</h1>
<p><strong>${esc(lede)}</strong></p>
<p>An open index by SuperTruth that scores countries from 0 to 100 on one question: can a person see, control and share their own health record? Data as of ${asOf}, version ${VERSION}.</p>
<h2>Key findings</h2><ul class="facts">${facts.map(f => `<li>${esc(f)}</li>`).join('')}</ul>
<p>Scores move in steps of about 5 points, so read ranks as ranges. The full method, the audit of our own scores and every source are public.</p>
<h2>Top 10</h2><table><thead><tr><th>Rank</th><th>Likely range</th><th>Country</th><th>Score</th><th>Band</th></tr></thead><tbody>${top10}</tbody></table>
<p><a href="../#ranking">Full ranking</a> · <a href="../#strain">Strain and split</a> · <a href="../#stories">What people report</a></p>
<h2>Images</h2><p>Free to use with credit to SuperTruth. Every country has a share card at /assets/og/ISO3.png (for example <a href="../assets/og/FIN.png">/assets/og/FIN.png</a>).</p>
<div class="assets"><figure><a href="../assets/og.png" download><img src="../assets/og.png" alt="Health Record Rights Index share image: the globe and the headline finding"></a><figcaption>Share image, 1200 by 630</figcaption></figure>
${['CAN', 'USA', 'GBR', 'DEU', 'FRA', 'NLD'].filter(i => C.some(d => d.iso3 === i)).map(i => { const d = C.find(x => x.iso3 === i); return `<figure><a href="../assets/og/${i}.png" download><img src="../assets/og/${i}.png" alt="${esc(d.name)}: ${d.overall} of 100"></a><figcaption>${esc(d.name)}, ${d.overall}/100</figcaption></figure>`; }).join('')}</div>
<h2>Data</h2><p><a href="../data/who-holds-the-record-scores.csv" download>Scores (CSV)</a> · <a href="../data/who-holds-the-record-sources.csv" download>Sources (CSV)</a> · <a href="../data/who-holds-the-record.json" download>Everything (JSON)</a> · one-page brief for every country at <a href="../brief/CAN/">/brief/ISO3/</a></p>
<h2>Method in brief</h2>
<p>Each country gets a score from 0 to 100 in eight weighted categories: access to the full record (20%), control and consent (20%), privacy and security (15%), connected care (15%), protection from commercial use (10%), clinician access (10%), research consent (5%) and clinical AI governance (5%). Research agents built on Anthropic's Claude did the research in each country's language, opening every cited source; a second agent cross-checked each country; the authors reviewed the results. We audited our own scores, published every change, tested how stable the ranking is, and ran a blind re-scoring.</p>
<h2>Cite this</h2><div class="cite">Snyder, J. A., Hill, B., &amp; Raney, D. (${YEAR}). The Health Record Rights Index (version ${VERSION}). SuperTruth Inc. ${SITE}</div>
<h2>About SuperTruth</h2>${BOILERPLATE.map(p => `<p>${esc(p)}</p>`).join('')}
<p>SuperTruth sells health data verification products. We built this index and chose its stories ourselves; no one paid to be included.</p>
<h2>Press contact</h2><div class="box">SuperTruth Inc. · 24 S. 24th St., Philadelphia, PA 19103, USA · <a href="tel:+12159184140">+1 215 918 4140</a><br>Interviews, data questions and briefings: supertruth.ai/on-the-record#contact</div>
</div></body></html>`;
  fs.mkdirSync('out/press-kit', { recursive: true });
  fs.writeFileSync('out/press-kit/index.html', html);
}
module.exports = { buildPressKit };
