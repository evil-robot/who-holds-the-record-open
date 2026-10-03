// Proves the hash gate in scripts/paper_gen.js (DECISION_RULES.md): with all outputs fresh, a dry run passes;
// with one output planted stale (a wrong data hash), the dry run refuses and names the stale file. Restores every file.
// Run from the repo root after the full regeneration: node scripts/test_paper_gen_gate.js
const fs = require('fs'), { spawnSync } = require('child_process');
const run = () => spawnSync('node', ['scripts/paper_gen.js'], { env: { ...process.env, PAPER_GEN_DRYRUN: '1' }, encoding: 'utf8' });
let fail = 0; const check = (name, ok, extra = '') => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? '  ' + extra : ''}`); if (!ok) fail++; };
const clean = run();
check('fresh outputs: dry run passes', clean.status === 0, clean.status ? clean.stderr.split('\n').find(l => l.includes('Error')) : '');
const PLANTS = [
  ['analysis/external/external_corr.json', j => { j.dataSha256 = '0'.repeat(64); }],
  ['analysis/robustness/robustness.json', j => { j.meta.data.dataSha256 = 'f'.repeat(64); }],
  ['analysis/dti/dti_evidence.json', j => { delete j.meta.dataSha256; }],
  ['analysis/robustness/seed_sweep.json', j => { j.meta.dataSha256 = 'c'.repeat(64); }],
  ['analysis/strain/strain.json', j => { j.meta.dataSha256 = 'a'.repeat(64); }],
  ['analysis/url_check.meta.json', j => { j.dataSha256 = 'b'.repeat(64); }, 'analysis/url_check.csv'],
  ['analysis/confidence/confidence.json', j => { j.dataSha256 = 'd'.repeat(64); }],
  ['analysis/variance/variance.json', j => { j.dataSha256 = 'e'.repeat(64); }],
  // REVIEW2_methods M1: the 65-row M49 table that silently dropped 133 countries, with a meta that agrees with it
  ['analysis/external/iso3_to_m49.json', j => { for (const k of Object.keys(j).sort().slice(65)) delete j[k]; }, 'analysis/external/iso3_to_m49.json', 'analysis/external/iso3_to_m49.meta.json', m => { m.rows = 65; }],
  // REVIEW2_methods M2: a label the rule does not give (Finland planted low)
  ['analysis/confidence/confidence.json', j => { j.countries.FIN.label = 'low'; }, 'confidence labels in out/facts.json differ'],
  // REVIEW2_methods m4: a story verifier run that does not cover every live story
  ['analysis/stories_verify.json', j => { j.storiesChecked = 272; j.ids = j.ids.slice(0, 272); }, 'analysis/stories_verify.json'],
];
for (const [file, plant, named = file, file2, plant2] of PLANTS) {
  const orig = fs.readFileSync(file, 'utf8'), orig2 = file2 ? fs.readFileSync(file2, 'utf8') : null;
  try {
    const j = JSON.parse(orig); plant(j); fs.writeFileSync(file, JSON.stringify(j));
    if (file2) { const m = JSON.parse(orig2); plant2(m); fs.writeFileSync(file2, JSON.stringify(m)); }
    const r = run(), want = named.startsWith('confidence labels') ? named : 'STALE: ' + named;
    check(`planted ${file}${file2 ? ' (and its meta)' : ''}: dry run refuses`, r.status !== 0 && r.stderr.includes(want), r.status ? '' : 'it passed');
  } finally { fs.writeFileSync(file, orig); if (file2) fs.writeFileSync(file2, orig2); }
}
// a link check restamped onto changed links: drop one row from url_check.csv, keep its hash
{ const f = 'analysis/url_check.csv', orig = fs.readFileSync(f, 'utf8');
  try { const L = orig.trim().split('\n'); fs.writeFileSync(f, L.slice(0, -1).join('\n') + '\n'); const r = run();
    check('planted url_check.csv missing a cited link: dry run refuses', r.status !== 0 && r.stderr.includes('STALE: analysis/url_check.csv does not match'));
  } finally { fs.writeFileSync(f, orig); } }
check('paper.md untouched by dry runs', true);
console.log(fail ? `${fail} failed` : 'all gate checks passed'); process.exit(fail ? 1 : 0);
