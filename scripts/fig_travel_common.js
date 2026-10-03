// Shared data for the traveling-patient figures: the five parts in the paper's own words (Section 10.1), Article 14(1)
// points, MyHealth@EU live counts from analysis/crossborder/crossborder.json, EHDS dates from its ehds_dates facts (the
// same quotes scripts/paper_gen.js reads), checked against the paper's Table 10 (GEN:xbtable) and date spans.
const L = require('./fig_lib');
const { assert } = L;
const XB = L.read('analysis/crossborder/crossborder.json'), RJ = L.read('analysis/crossborder/relocation_and_copy.json');
const md = L.fs.readFileSync(L.path.join(L.ROOT, 'paper/paper.md'), 'utf8');
const gen = k => (md.split(`<!-- GEN:${k} -->`)[1] || '').split(`<!-- /GEN:${k} -->`)[0];
const gq = re => { const g = XB.global_facts.find(x => x.topic === 'ehds_dates' && re.test(x.quote)); assert(g, 'no ehds_dates fact for ' + re);
  const y = g.quote.match(/26 March (20\d\d)/)[1]; return { iso: `${y}-03-26`, label: `26 March ${y}`, url: g.url }; };
const D = { apply: gq(/shall apply from 26 March 2027/), d29: gq(/2029.*points \(a\), \(b\) and \(c\)/), d31: gq(/2031.*points \(d\), \(e\) and \(f\)/) };
for (const [k, g] of [['xbapply', D.apply], ['xbdate29', D.d29], ['xbdate31', D.d31]]) assert(gen(k) === g.label, `paper's GEN:${k} "${gen(k)}" differs from ${g.label}`);
const e29 = Object.values(RJ.countries).find(c => c.relocation && c.relocation.ehds_2029); assert(e29 && e29.relocation.ehds_2029.from === D.d29.iso, 'relocation ehds_2029 date differs');
const cnt = XB.meta.counts, live = t => (cnt[t] || {}).live || 0;
const PARTS = [
  { name: 'Health summary', legal: 'patient summaries, point (a)', send: live('ps_send'), recv: live('ps_recv'), date: D.d29 },
  { name: 'Medicines (prescriptions)', legal: 'ePrescriptions and eDispensations, (b) and (c)', send: live('ep_send'), recv: live('ep_recv'), date: D.d29 },
  { name: 'Lab results', legal: 'test results, point (e)', send: null, recv: null, date: D.d31 },
  { name: 'Scans and X-rays', legal: 'medical images, point (d)', send: null, recv: null, date: D.d31 },
  { name: 'Hospital notes', legal: 'discharge reports, point (f)', send: null, recv: null, date: D.d31 },
];
// Table 10 in the paper must say the same
const t10 = gen('xbtable').split('\n').filter(l => /^\| [A-Z]/.test(l) && !/^\| Part/.test(l)).map(l => l.split('|').map(c => c.trim()));
assert(t10.length === 5, 'Table 10 not found in paper.md');
PARTS.forEach((p, i) => { assert(t10[i][1] === p.name, `Table 10 row ${i + 1} is "${t10[i][1]}", figure has "${p.name}"`);
  if (p.send == null) assert(t10[i][2] === 'not carried', `${p.name} should be not carried`);
  else assert(+t10[i][2] === p.send && +t10[i][3] === p.recv, `${p.name} counts differ from Table 10`); });
const eea = +gen('xbeea'); assert(eea > 0, 'GEN:xbeea');
const N = Object.keys(RJ.countries).length, copyYes = Object.values(RJ.countries).filter(c => c.copyRight === 'yes').length,
  copyEl = Object.values(RJ.countries).filter(c => c.electronic === 'yes').length;
assert(gen('xbcopy') === `${copyYes} of ${N}` && gen('xbcopyel') === String(copyEl), 'copy counts differ from the paper');
module.exports = { D, PARTS, eea, N, copyYes, copyEl, asOf: XB.meta.as_of, gen };
