// Shared pieces for the paper's figures (scripts/fig_*.js). Every figure is 664 units wide = 166 mm in the PDF
// (1 unit = 0.25 mm, so 1 pt = 1.411 units), the paper's full content width, so type sizes match across figures.
// Writes paper/figures/<name>.svg, an .html wrapper with the site's fonts, and a 3x .png from headless Chrome.
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const ROOT = path.join(__dirname, '..');
const read = f => JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf8'));
const W = 664, PT = 1.411;
const C = { ink: '#111827', body: '#374151', muted: '#6B7280', faint: '#9CA3AF', grid: '#E5E7EB', tint: '#F3F4F6',
  teal: '#0F766E', teal2: '#0D9488', white: '#fff' };
// one ordered teal ramp, light to dark (fig1's band colours); checked by scripts/fig_palette_check.py
const RAMP = ['#E6F4F1', '#AADDD4', '#80C7BB', '#50AEA0', '#0D9488', '#0F766E'];
const BANDS = [['Poor', 0, 24], ['Weak', 25, 44], ['Mixed', 45, 64], ['Strong', 65, 84], ['Leading', 85, 100]];
// bands as quiet zones: two tints alternate and every band is labelled directly (order is carried by the labels and position)
const BANDFILL = { Poor: '#FFFFFF', Weak: '#DCEDE9', Mixed: '#FFFFFF', Strong: '#DCEDE9', Leading: '#FFFFFF' };
// every colour a figure uses to mean something, by meaning; scripts/fig_palette_check.py reads this (node scripts/fig_lib.js --json)
const PAL = {
  page: '#FFFFFF', text: C.ink, textMuted: C.muted, textBody: C.body,
  lead: C.teal, other: C.ink, otherInterval: C.faint,                       // fig_ranked, fig_seeds
  zoneA: BANDFILL.Mixed, zoneB: BANDFILL.Strong,                            // fig_ranked band zones (alternate)
  bar: '#80C7BB', barRegion: '#50AEA0', barAll: C.teal, track: C.tint,      // fig_categories, fig_keys_region
  tier: { Platinum: '#0F766E', Gold: '#50AEA0', Silver: '#AADDD4', Bronze: '#E6F4F1', 'Below Bronze': '#F9FAFB' },  // fig_dti
  trip: { arrive: '#0F766E', unknown: '#9CA3AF', copy: '#BFE3DC' },        // fig_trips
  key: C.teal,                                                              // fig_keys_models
};
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const F = { src: 8.6, xs: 9.9, s: 10.2, m: 10.8, l: 12 };  // 6.1 pt for source lines only; 7, 7.2, 7.7 and 8.5 pt for everything else
const txt = (x, y, s, o = {}) => `<text x="${(+x).toFixed(1)}" y="${(+y).toFixed(1)}" font-size="${o.size || F.s}" fill="${o.fill || C.body}"`
  + (o.weight ? ` font-weight="${o.weight}"` : '') + (o.anchor ? ` text-anchor="${o.anchor}"` : '')
  + (o.mono ? ` font-family="JetBrains Mono, monospace"` : '') + (o.italic ? ` font-style="italic"` : '')
  + (o.base ? ` dominant-baseline="${o.base}"` : '') + (o.halo ? ` paint-order="stroke" stroke="#fff" stroke-width="1.2" stroke-linejoin="round"` : '') + `>${esc(s)}</text>`;
const line = (x1, y1, x2, y2, o = {}) => `<line x1="${(+x1).toFixed(1)}" y1="${(+y1).toFixed(1)}" x2="${(+x2).toFixed(1)}" y2="${(+y2).toFixed(1)}" stroke="${o.stroke || C.ink}" stroke-width="${o.w || 0.6}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}${o.cap ? ` stroke-linecap="${o.cap}"` : ''}/>`;
const rect = (x, y, w, h, o = {}) => `<rect x="${(+x).toFixed(1)}" y="${(+y).toFixed(1)}" width="${Math.max(0, w).toFixed(1)}" height="${Math.max(0, h).toFixed(1)}" fill="${o.fill || C.tint}"${o.stroke ? ` stroke="${o.stroke}" stroke-width="${o.w || 0.6}"` : ''}${o.rx ? ` rx="${o.rx}"` : ''}${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}/>`;
const circle = (x, y, r, o = {}) => `<circle cx="${(+x).toFixed(1)}" cy="${(+y).toFixed(1)}" r="${r}" fill="${o.fill || C.ink}"${o.stroke ? ` stroke="${o.stroke}" stroke-width="${o.w || 0.6}"` : ''}/>`;
const lin = (d0, d1, r0, r1) => v => r0 + (v - d0) / (d1 - d0) * (r1 - r0);
// rough Inter advance width, for label placement only
const textW = (s, size = F.s, mono = false) => String(s).length * size * (mono ? 0.6 : 0.54);
const wrap = (s, max) => { const out = []; let l = ''; for (const w of String(s).split(' ')) { if ((l + ' ' + w).trim().length > max) { out.push(l); l = w; } else l = (l + ' ' + w).trim(); } if (l) out.push(l); return out; };
const assert = (ok, msg) => { if (!ok) { console.error('FIGURE CHECK FAILED: ' + msg); process.exit(1); } };
const source = (y, s) => txt(0, y, s, { size: F.src, fill: C.muted });
// a wrapped source block: returns [svg, height]
const srcBlock = (y, text, max = 156) => { const ls = wrap(text, max); return [ls.map((l, i) => source(y + i * 11, l)).join(''), ls.length * 11]; };
const fmt = n => n.toLocaleString('en-US');

function write(name, body, H) {
  H = Math.ceil(H);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="Inter, system-ui, sans-serif"><rect width="${W}" height="${H}" fill="#fff"/>${body}</svg>`;
  const dir = path.join(ROOT, 'paper', 'figures'); fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, name + '.svg'), svg);
  const fonts = ['inter-latin', 'inter-latin-ext'].map(f => `@font-face{font-family:Inter;font-weight:100 900;src:url(../../out/assets/fonts/${f}.woff2)}`).join('')
    + ['jetbrains-mono-latin', 'jetbrains-mono-latin-ext'].map(f => `@font-face{font-family:"JetBrains Mono";font-weight:100 800;src:url(../../out/assets/fonts/${f}.woff2)}`).join('');
  const html = path.join(dir, name + '.html');
  fs.writeFileSync(html, `<!doctype html><html><head><meta charset="utf-8"><style>${fonts}html,body{margin:0;background:#fff}svg{display:block}</style></head><body>${svg}</body></html>`);
  execFileSync('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', '--disable-gpu', '--hide-scrollbars',
    '--force-device-scale-factor=3', `--window-size=${W},${H}`, '--virtual-time-budget=3000', `--screenshot=${path.join(dir, name + '.png')}`, 'file://' + html], { stdio: 'ignore' });
  console.log(`${name}: ${W}x${H} -> paper/figures/${name}.svg, .png`);
}
module.exports = { ROOT, read, W, PT, C, PAL, RAMP, BANDS, BANDFILL, F, esc, txt, line, rect, circle, lin, textW, wrap, assert, source, srcBlock, fmt, write, fs, path };

if (require.main === module && process.argv.includes('--json')) console.log(JSON.stringify({ PAL, F }));
