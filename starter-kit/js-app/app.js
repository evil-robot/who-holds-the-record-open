// Health Record Rights Index starter app: every country from /api/v1/countries in a table you can filter and sort.
// Plain JavaScript, no libraries. Point API at a local preview (for example http://localhost:8799/api/v1/) if you run one.
const API = 'https://healthrecordrights.com/api/v1/';

const BAND_ORDER = ['Poor', 'Weak', 'Mixed', 'Strong', 'Leading'];
let countries = [];
let sort = { key: 'overall', dir: -1 };

const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const ord = n => n + (n % 100 >= 11 && n % 100 <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] || 'th'));

// The lead group is a group, never one winner: show it as such, and every rank with its likely range.
function standing(c) {
  if (c.leadGroup) return `In the lead group (could rank ${c.likelyRankText})`;
  return `${c.rankTied ? 'Tied for ' : ''}${ord(c.rank)} (could rank ${c.likelyRankText})`;
}

function compare(a, b) {
  const k = sort.key;
  if (k === 'band') return (BAND_ORDER.indexOf(a.band) - BAND_ORDER.indexOf(b.band)) * sort.dir || a.name.localeCompare(b.name);
  if (k === 'name') return a.name.localeCompare(b.name) * sort.dir;
  return (a[k] - b[k]) * sort.dir || a.name.localeCompare(b.name);
}

function render() {
  const q = $('filter').value.trim().toLowerCase();
  const shown = countries
    .filter(c => !q || [c.name, c.iso3, c.region, c.band].some(v => String(v).toLowerCase().includes(q)))
    .sort(compare);
  $('rows').innerHTML = shown.map(c => `<tr>
    <td><a href="${esc(c.pageUrl)}">${esc(c.name)}</a></td>
    <td class="num">${c.overall}/100</td>
    <td>${esc(c.band)}</td>
    <td>${esc(standing(c))}</td>
  </tr>`).join('');
  $('caption').textContent = `${shown.length} of ${countries.length} countries and territories, scored out of 100`;
  document.querySelectorAll('th[aria-sort]').forEach(th => {
    const key = th.querySelector('button').dataset.key;
    th.setAttribute('aria-sort', key === sort.key ? (sort.dir < 0 ? 'descending' : 'ascending') : 'none');
  });
}

async function main() {
  try {
    const res = await fetch(`${API}countries`);
    if (!res.ok) throw new Error(`the API answered ${res.status}`);
    const body = await res.json();
    countries = body.data.countries;
    const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const [y, m, d] = String(body.asOf).split('-').map(Number);
    $('status').textContent = `Data as of ${MONTHS[m - 1]} ${d}, ${y}. Version ${body.version}.`;
    $('credit').innerHTML = `Data: <a href="https://healthrecordrights.com/">${esc(body.license.credit)}</a>, licensed under <a href="${esc(body.license.url)}">CC BY 4.0</a>.`;
    render();
  } catch (e) {
    $('status').textContent = `Could not load the data: ${e.message}.`;
  }
}

$('filter').addEventListener('input', render);
document.querySelectorAll('th button').forEach(b => b.addEventListener('click', () => {
  const key = b.dataset.key;
  sort = { key, dir: sort.key === key ? -sort.dir : (key === 'name' ? 1 : -1) };
  render();
}));
main();
