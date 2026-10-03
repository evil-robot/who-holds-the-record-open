// The site's shared top bar (JAS, 2 Oct): one header on every page (home, traveling patient, briefs, press kit).
// navHTML({ base, active }) gives the markup; NAV_CSS the styles; writeNavScript(outDir) writes the small self-hosted
// script (out/assets/whr-nav.js) behind the country search. No third-party request; without script the search stays
// hidden and the links remain.
const fs = require('fs');
const path = require('path');

const LINKS = [
  ['ranking', 'Ranking', '#ranking'],
  ['stories', 'Stories', '#stories'],
  ['categories', 'Categories', '#categories'],
  ['strain', 'Strain', '#strain'],
  ['method', 'Method', '#method'],
  ['traveller', 'Traveling patient', 'traveler/'],
  ['press', 'Press kit', 'press-kit/'],
];

// base: the relative path from the page to the site root ('' on home, '../' one level down, '../../' two).
// active: the key of the current page, marked aria-current.
function navHTML({ base = '', active = '' } = {}) {
  const href = h => (h.startsWith('#') && base === '' ? h : base + h);
  return `<header class="whr-bar"><div class="whr-wrap">
<a class="whr-logo" href="${base || './'}"><img src="${base}assets/supertruth-logo-dark.svg" alt="Health Record Rights Index by SuperTruth: home" width="131" height="24"></a>
<nav class="whr-nav" aria-label="Site">${LINKS.map(([k, t, h]) => `<a href="${href(h)}"${k === active ? ' aria-current="page"' : ''}>${t}</a>`).join('')}</nav>
<form class="whr-find" id="whrFind" role="search" hidden data-base="${base}" action="${base || './'}" method="get"><label for="whrFindIn" class="whr-vh">Find a country</label><input id="whrFindIn" name="q" type="search" list="whrFindList" autocomplete="off" placeholder="Find a country" aria-describedby="whrFindMsg"><button type="submit">Go</button><datalist id="whrFindList"></datalist><p id="whrFindMsg" class="whr-find-msg" aria-live="polite"></p></form>
</div></header>
<script src="${base}assets/whr-nav.js" defer></script>`;
}

const NAV_CSS = `
html{scroll-padding-top:72px}
.whr-bar{position:sticky;top:0;z-index:30;border-bottom:.5px solid #E5E7EB;background:#fff;font-family:Inter,system-ui,sans-serif}
.whr-wrap{box-sizing:border-box;max-width:1420px;margin:0 auto;padding:10px 40px;display:flex;align-items:center;flex-wrap:wrap;gap:8px 24px;min-height:56px}
.whr-logo{display:inline-flex;align-items:center}.whr-logo img{height:22px;width:auto;display:block}
.whr-nav{display:flex;flex-wrap:wrap;gap:4px 18px;font-size:14px;font-weight:500}
.whr-nav a{color:#4B5563;text-decoration:none;display:inline-flex;align-items:center;min-height:32px}.whr-nav a:hover{color:#0F766E}
.whr-nav a[aria-current="page"]{color:#111827;box-shadow:inset 0 -1.5px 0 #111827}
.whr-find{display:flex;align-items:center;gap:6px;margin-left:auto;position:relative}.whr-find[hidden]{display:none}
.whr-find input{font:400 14px Inter,system-ui,sans-serif;width:200px;padding:6px 9px;border:1px solid #D1D5DB;border-radius:6px;color:#111827;background:#fff}
.whr-find input:focus,.whr-find button:focus-visible,.whr-nav a:focus-visible{outline:2px solid #0F766E;outline-offset:1px}
.whr-find button{font:500 13px Inter,system-ui,sans-serif;padding:6px 10px;border:1px solid #0F766E;color:#0F766E;background:#fff;border-radius:6px;cursor:pointer}
.whr-find-msg{position:absolute;right:0;top:100%;margin:4px 0 0;font-size:12px;color:#374151;background:#fff;white-space:nowrap}.whr-find-msg:empty{display:none}
.whr-vh{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
@media(max-width:700px){.whr-wrap{padding:6px 12px;gap:2px 12px;min-height:0}.whr-logo{order:1}.whr-logo img{height:18px}
 .whr-nav{order:3;width:100%;flex-wrap:nowrap;overflow-x:auto;gap:0 16px;scrollbar-width:none}.whr-nav::-webkit-scrollbar{display:none}.whr-nav::after{content:"";flex:0 0 12px}.whr-nav a{min-height:40px;white-space:nowrap}
 .whr-find{order:2;flex:1;min-width:0;margin-left:0}.whr-find input{flex:1;width:auto;min-width:0;min-height:44px;font-size:16px}.whr-find button{flex-shrink:0;min-height:44px;min-width:56px}.whr-find-msg{position:static;white-space:normal}}
@media print{.whr-nav,.whr-find{display:none!important}.whr-bar{border:0;position:static}}`;

// The names the search knows: every country's English name and ISO code, with its two-letter code so the browser can
// add the country's name in the main European languages (Intl.DisplayNames), as the home page's own search does.
function countryNames(root = __dirname) {
  const iso = require('i18n-iso-countries');
  const out = [];
  for (const f of fs.readdirSync(path.join(root, 'data'))) {
    if (!f.endsWith('.json')) continue;
    const d = JSON.parse(fs.readFileSync(path.join(root, 'data', f), 'utf8'));
    out.push([d.name, d.iso3, iso.alpha3ToAlpha2(d.iso3) || (d.iso3 === 'XKX' ? 'XK' : '')]);
  }
  return out.sort((a, b) => a[0].localeCompare(b[0]));
}

// The client: build the list, match a typed name (English, a local-language name or the ISO code), then on the home
// page open that country's panel (select()), and anywhere else go to its brief. Pure matching is exported for tests.
const CLIENT = `(function(){'use strict';
var C=__NAMES__;
var norm=function(x){return String(x||'').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase().trim()};
function names(){var xs=C.map(function(c){return [c[0],c[1]]});try{['es','fr','de','pt','it','nl','sv','pl'].forEach(function(l){var dn=new Intl.DisplayNames([l],{type:'region'});C.forEach(function(c){if(!c[2])return;var n=dn.of(c[2]);if(n&&n!==c[2]&&!xs.some(function(x){return x[0]===n}))xs.push([n,c[1]])})})}catch(e){}return xs}
function match(q,xs){q=norm(q);if(!q)return null;var codes=C.map(function(c){return c[1]});
 var hit=xs.find(function(x){return norm(x[0])===q});if(hit)return hit[1];
 if(q.length===3&&codes.indexOf(q.toUpperCase())>=0)return q.toUpperCase();
 hit=xs.find(function(x){return norm(x[0]).indexOf(q)===0})||xs.find(function(x){return norm(x[0]).indexOf(q)>=0});return hit?hit[1]:null}
if(typeof module!=='undefined'){module.exports={match:match,names:names,C:C};return}
var B=document.querySelector?document.querySelector('.whr-bar'):null;function pad(){if(!B)return;document.documentElement.style.scrollPaddingTop=(B.offsetHeight+8)+'px'}if(B){pad();window.addEventListener('resize',pad)}  // anchors land below the sticky bar
var F=document.getElementById('whrFind');if(!F)return;
var I=document.getElementById('whrFindIn'),L=document.getElementById('whrFindList'),M=document.getElementById('whrFindMsg'),XS=names(),seen={};
XS.forEach(function(x){if(seen[x[0]])return;seen[x[0]]=1;var o=document.createElement('option');o.value=x[0];L.appendChild(o)});
F.hidden=false;pad();
var N=document.querySelector&&document.querySelector('.whr-nav'),A=N&&N.querySelector('[aria-current]');if(A&&N.scrollWidth>N.clientWidth)N.scrollLeft=Math.max(0,A.offsetLeft-N.offsetLeft-16);
F.addEventListener('submit',function(e){e.preventDefault();var iso=match(I.value,XS);
 if(!iso){M.textContent='No country by that name. Try its English name, for example Germany.';window.whrTrack&&whrTrack('country_search',{found:false,from:'nav'});return}
 M.textContent='';window.whrTrack&&whrTrack('country_search',{found:true,from:'nav'});
 if(F.getAttribute('data-base')===''&&typeof window.select==='function'&&document.getElementById('ranking')){window.select(iso,true);I.value='';return}
 location.href=F.getAttribute('data-base')+'brief/'+iso+'/'});
})();`;
const navScript = (root) => CLIENT.replace('__NAMES__', JSON.stringify(countryNames(root)));
function writeNavScript(outDir, root = __dirname) {
  fs.mkdirSync(path.join(outDir, 'assets'), { recursive: true });
  fs.writeFileSync(path.join(outDir, 'assets', 'whr-nav.js'), navScript(root));
}

module.exports = { navHTML, NAV_CSS, LINKS, countryNames, navScript, writeNavScript };
