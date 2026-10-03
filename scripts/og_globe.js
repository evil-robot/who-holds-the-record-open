// Writes out/og_globe.svg: the share-image globe, countries filled by band (same colours as og.py).
const fs=require('fs'),tc=require('topojson-client'),d3=require('d3-geo'),iso=require('i18n-iso-countries');
const F=JSON.parse(fs.readFileSync('out/facts.json','utf8'));
const band={Poor:'#AADDD4',Weak:'#80C7BB',Mixed:'#50AEA0',Strong:'#0D9488',Leading:'#0F766E'};
const by=Object.fromEntries(F.ranked.map(d=>[d.iso3,d.band]));
const t=require('world-atlas/countries-50m.json'),feats=tc.feature(t,t.objects.countries).features;
const S=600,p=d3.geoOrthographic().rotate([-20,-22]).scale(290).translate([S/2,S/2]).clipAngle(90),path=d3.geoPath(p);
const body=feats.map(f=>{const a3=f.id?iso.numericToAlpha3(f.id):(f.properties.name==='Kosovo'?'XKX':null);const b=by[a3];const d=path(f);
  return d?`<path d="${d}" fill="${b?band[b]:'#F3F4F6'}" stroke="#fff" stroke-width=".6"/>`:'';}).join('');
fs.writeFileSync('out/og_globe.svg',`<svg width="${S}" height="${S}" viewBox="0 0 ${S} ${S}"><circle cx="${S/2}" cy="${S/2}" r="290" fill="#F9FAFB" stroke="#E5E7EB"/>${body}</svg>`);
console.log('globe',feats.length);
