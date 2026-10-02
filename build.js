// Builds out/: a self-contained page (no third-party request on load). Everything a reader or a crawler needs
// (lede, ranked table, category matrix, method) is written into the HTML here; the globe and the country
// panel are enhancements on top. Spec: docs/TUFTE_SPEC.md. Story rules: docs/STORIES_RULES.md.
const fs=require('fs');const tc=require('topojson-client');const iso=require('i18n-iso-countries');
const t=require('world-atlas/countries-110m.json');

const NAME='Health Record Rights Index'; // renamed 2 Oct 2026 (JAS); "Who holds the record?" stays as the question
const NOINDEX=!!process.env.PREVIEW_NOINDEX;
const HOME_TEMPLATE_CHANGED='2026-10-02'; // bump only when the home page's own prose changes (sitemap lastmod)
let DESCRIPTOR='Health record rights'; // completed with the country count once data is loaded
const SITE='https://whoholds.supertruth.ai/';
const VERSION='1.0';
const RESEARCH_WINDOW='30 Sep to 2 Oct 2026'; // first research day to the latest country re-research (deepen round, 2 Oct)
const STORIES_CONTACT='privacy@supertruth.ai'; // shown as text, never a mailto (house rule). Mailbox must be monitored before launch.

const CATS=[
 {k:'access',n:'Patient access to the full record',s:'Access',w:20},
 {k:'control',n:'Patient control and consent',s:'Control',w:20},
 {k:'privacy',n:'Privacy and security',s:'Privacy',w:15},
 {k:'journey',n:'Connected care journey',s:'Journey',w:15},
 {k:'commercial',n:'Protection from commercial use',s:'Commercial',w:10},
 {k:'clinical',n:'Clinician access at the point of care',s:'Clinical',w:10},
 {k:'research',n:'Research and trial consent',s:'Research',w:5},
 {k:'ai',n:'Clinical AI governance',s:'AI',w:5}];
const BANDS=[{n:'Poor',lo:0,hi:24,c:'#AADDD4'},{n:'Weak',lo:25,hi:44,c:'#80C7BB'},{n:'Mixed',lo:45,hi:64,c:'#50AEA0'},{n:'Strong',lo:65,hi:84,c:'#0D9488'},{n:'Leading',lo:85,hi:100,c:'#0F766E'}];
const bandOf=s=>BANDS.find(b=>s>=b.lo&&s<=b.hi)||BANDS[0];
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

// ---- geography (unchanged from v1) ----
const g=tc.feature(t,t.objects.countries);
const r=n=>Math.round(n*100)/100;
function ringArea(ring){let a=0;for(let i=0;i<ring.length-1;i++){a+=ring[i][0]*ring[i+1][1]-ring[i+1][0]*ring[i][1]}return a/2}
// Rings that cross the 180th meridian (Fiji, Kiribati, Russia's far east) are unwrapped before averaging, then folded back.
const unwrap=ring=>{const lons=ring.map(p=>p[0]);return Math.max(...lons)-Math.min(...lons)>180?ring.map(([x,y])=>[x<0?x+360:x,y]):ring};
const fold=x=>x>180?x-360:x;
function centroid(geom){let polys=geom.type==='Polygon'?[geom.coordinates]:geom.coordinates;let best=null,ba=-1;for(const p of polys){const ring=unwrap(p[0]);const a=Math.abs(ringArea(ring));if(a>ba){ba=a;best=ring}}
 let cx=0,cy=0,A=0;for(let i=0;i<best.length-1;i++){const f=best[i][0]*best[i+1][1]-best[i+1][0]*best[i][1];cx+=(best[i][0]+best[i+1][0])*f;cy+=(best[i][1]+best[i+1][1])*f;A+=f}A/=2;return [r(cy/(6*A)),r(fold(cx/(6*A)))]}
const fix={'USA':[39.5,-98.5],'FRA':[46.6,2.4],'NOR':[61.5,9.5],'CAN':[56,-100],'RUS':[60,90]};
// Kosovo has no ISO numeric code in Natural Earth; match its shape by name to the user-assigned code XKX.
const feats=g.features.map(f=>{const a3=f.id?iso.numericToAlpha3(f.id):(f.properties.name==='Kosovo'?'XKX':null);const q=c=>Array.isArray(c[0])?c.map(q):[r(c[0]),r(c[1])];
 const c=fix[a3]||centroid(f.geometry);return {type:'Feature',properties:{iso3:a3||'',name:f.properties.name,lat:c[0],lng:c[1]},geometry:{type:f.geometry.type,coordinates:q(f.geometry.coordinates)}}});

// ---- data ----
const data={};for(const f of fs.readdirSync('data')){if(!f.endsWith('.json'))continue;const d=JSON.parse(fs.readFileSync('data/'+f));data[d.iso3]=d}
for(const f of (fs.existsSync('stories')?fs.readdirSync('stories'):[])){if(!f.endsWith('.json'))continue;const s=JSON.parse(fs.readFileSync('stories/'+f));if(data[s.iso3])data[s.iso3].stories=(s.stories||[]).filter(x=>!x.removed&&String(x.date)>='2024-10')} // two-year window (JAS 1 Oct); verifier also enforces
// DTI evidence grade (scripts/dti_evidence.py; docs/DTI_EVIDENCE.md): grades the evidence behind each score, never the score.
const DTI=fs.existsSync('analysis/dti/dti_evidence.json')?JSON.parse(fs.readFileSync('analysis/dti/dti_evidence.json','utf8')).countries:{};
for(const iso of Object.keys(data)){data[iso].dti=DTI[iso]||null;
 // Display label: a tier held below its number by the primary-source cap says so (docs/DTI_EVIDENCE.md).
 if(data[iso].dti)data[iso].dti.tierLabel=data[iso].dti.tier+(data[iso].dti.tierCapped?' (capped: few primary sources)':'');}
// rated countries with no polygon at 110m are drawn as points
const POINTS={SGP:[1.35,103.82],MLT:[35.9,14.4],LIE:[47.16,9.55],LUX:[49.8,6.1],CYP:[35.1,33.4]};
const hasPoly=new Set(feats.map(f=>f.properties.iso3));
for(const[iso,[la,ln]]of Object.entries(POINTS))if(data[iso]){data[iso].lat=la;data[iso].lng=ln}
// Any other rated country too small for the 110m shapes gets a point at its centroid in the 10m Natural Earth shapes
// (world-atlas, same source as the map), so new waves never need hand-typed coordinates.
{const t10=require('world-atlas/countries-10m.json'),tc10=require('topojson-client'),d3g=require('d3-geo');
 const need=Object.keys(data).filter(i=>!feats.some(f=>f.properties.iso3===i)&&data[i].lat==null);
 if(need.length){const f10=tc10.feature(t10,t10.objects.countries).features;
  for(const i of need){const f=f10.find(x=>x.id&&iso.numericToAlpha3(x.id)===i);if(f){const[ln,la]=d3g.geoCentroid(f);data[i].lat=+la.toFixed(2);data[i].lng=+ln.toFixed(2)}}}}
for(const iso of Object.keys(data))data[iso].point=!hasPoly.has(iso);
const noPos=Object.keys(data).filter(i=>data[i].point&&data[i].lat==null);if(noPos.length)throw new Error('no map position for '+noPos);
// check: every rated country's globe position lies on or near its own shape (catches centroids averaged to the wrong side of the world)
{const d3c=require('d3-geo');const bad=[];for(const f of feats){const i=f.properties.iso3;if(!data[i])continue;const p=[f.properties.lng,f.properties.lat];
 if(!d3c.geoContains(f,p)&&d3c.geoDistance(p,d3c.geoCentroid(f))*6371>1500)bad.push(`${i} (${p[1]}, ${p[0]})`)}
 if(bad.length)throw new Error('globe position far from its own shape: '+bad.join(', '))}
const C=Object.values(data);
C.forEach(d=>{d.stories=d.stories||[];d.overall=Math.round(CATS.reduce((s,c)=>s+d.categories[c.k].score*c.w,0)/100)});
const N=C.length;
DESCRIPTOR=`Health record rights in ${N} countries`;
// competition ranking: ties share a rank, shown as "4="
function ranks(list,val){const sorted=[...list].sort((a,b)=>val(b)-val(a));const out=new Map();sorted.forEach((d,i)=>{const first=sorted.findIndex(x=>val(x)===val(d));const tied=sorted.filter(x=>val(x)===val(d)).length>1;out.set(d.iso3,{n:first+1,tied})});return out}
const rankLabel=x=>x.n+(x.tied?'=':'');
const overallRank=ranks(C,d=>d.overall);
C.forEach(d=>{d.rank=overallRank.get(d.iso3);d.catRank={};CATS.forEach(c=>{d.catRank[c.k]=ranks(C,x=>x.categories[c.k].score).get(d.iso3)})});
const ranked=[...C].sort((a,b)=>b.overall-a.overall||a.name.localeCompare(b.name));
const quant=(xs,p)=>{const s=[...xs].sort((a,b)=>a-b);const i=(s.length-1)*p,lo=Math.floor(i),hi=Math.ceil(i);return Math.round(s[lo]+(s[hi]-s[lo])*(i-lo))};
const DIST={};CATS.forEach(c=>{const xs=C.map(d=>d.categories[c.k].score);DIST[c.k]={min:Math.min(...xs),q1:quant(xs,.25),med:quant(xs,.5),q3:quant(xs,.75),max:Math.max(...xs),all:xs}});
const bandCount=Object.fromEntries(BANDS.map(b=>[b.n,C.filter(d=>bandOf(d.overall).n===b.n).length]));
const models=['Individual','Shared','Institutional','State'];
const modelCount=Object.fromEntries(models.map(m=>[m,C.filter(d=>d.controlModel===m).length]));
const lowConf=C.filter(d=>d.confidence==='low').sort((a,b)=>a.name.localeCompare(b.name));
const allSources=C.flatMap(d=>CATS.flatMap(c=>d.categories[c.k].sources||[]));
const undated=allSources.filter(s=>!s.date||/n\.?d|not verified/i.test(s.date)).length;
const unratedNames=feats.filter(f=>!data[f.properties.iso3]).map(f=>f.properties.name).sort();const unrated=unratedNames.length;
// coverage sentence, computed: the UN members rated and every rated place outside the UN list
const UN193=require('./scripts/un193.js'),unIn=UN193.filter(i=>data[i]).length,unExtra=Object.keys(data).filter(i=>!UN193.includes(i)).map(i=>data[i].name).sort();
const andList=xs=>xs.length<2?xs.join(''):xs.slice(0,-1).join(', ')+' and '+xs.at(-1);
const unCoverage=(unIn===193?'All 193 UN member states are rated':`${unIn} of the 193 UN member states are rated`)+(unExtra.length?`, plus ${andList(unExtra)}`:'');
const YEAR=Math.max(...C.map(d=>+String(d.asOf).slice(0,4)));
const asOf=C.map(d=>d.asOf).sort().at(-1);
const top=ranked[0],median=quant(C.map(d=>d.overall),.5);
const storyTotal=C.reduce((n,d)=>n+d.stories.length,0);
const storyDates=C.flatMap(d=>d.stories.map(s=>s.date)).sort();
const themeCount={};C.forEach(d=>d.stories.forEach(s=>themeCount[s.theme]=(themeCount[s.theme]||0)+1));


// ---- Europe inset (TUFTE ruling 1 Oct): flat, same bands, 50m shapes so small states have a shape ----
const d3=require('d3-geo');const t50=require('world-atlas/countries-50m.json');
const eu=tc.feature(t50,t50.objects.countries).features.map(f=>({...f,iso3:f.id?iso.numericToAlpha3(f.id):null}));
const EW=460,EH=340,frame={type:'Feature',geometry:{type:'Polygon',coordinates:[[[-25,34],[45,34],[45,71],[-25,71],[-25,34]]]}};
const proj=d3.geoConicConformal().rotate([-10,0]).parallels([43,62]).fitExtent([[0,0],[EW,EH]],frame).clipExtent([[0,0],[EW,EH]]);
const gpath=d3.geoPath(proj).digits(1);
const inBox=f=>{const [[x0,y0],[x1,y1]]=d3.geoBounds(f);const lonHit=x0<=x1?(x1>=-25&&x0<=45):(x0<=45||x1>=-25);return lonHit&&y1>=34&&y0<=71};
const euFeats=eu.filter(f=>inBox(f));
const euRatedSet=new Set();
const euPaths=euFeats.map(f=>{const d=data[f.iso3];const p=gpath(f);if(!p)return'';if(d)euRatedSet.add(f.iso3);
 return d?`<path d="${p}" fill="${bandOf(d.overall).c}" stroke="#FFFFFF" stroke-width="0.75" data-iso="${f.iso3}"${d.stories.length?' data-has-stories="1"':''} tabindex="0" role="button" aria-label="${esc(d.name)}, ${d.overall}"><title>${esc(d.name)} · ${d.overall} · ${bandOf(d.overall).n}</title></path>`
  :`<path d="${p}" fill="#F3F4F6" stroke="#D1D5DB" stroke-width="0.5"/>`}).join('');
const euDots=euFeats.filter(f=>data[f.iso3]&&data[f.iso3].stories.length).map(f=>{const c=gpath.centroid(f);if(!isFinite(c[0]))return'';
 return `<circle cx="${c[0].toFixed(1)}" cy="${c[1].toFixed(1)}" r="3" fill="#A16207" stroke="#FFFFFF" stroke-width="1.5" class="eu-dot" pointer-events="none"/>`}).join('');
const EU_INSET=`<figure class="eu-inset"><svg viewBox="0 0 ${EW} ${EH}" role="img" aria-label="Map of Europe coloured by overall score"><clipPath id="euc"><rect width="${EW}" height="${EH}"/></clipPath><g clip-path="url(#euc)">${euPaths}</g></svg><figcaption class="cap">Europe, same bands. ${euRatedSet.size} of ${N} rated countries.</figcaption></figure>`;


// ---- context layer: strain and split. Display only; never feeds a score (analysis/strain/METHOD.md 9, rule 1) ----
const scoreSnap=()=>JSON.stringify(C.map(d=>[d.iso3,d.overall,CATS.map(c=>d.categories[c.k].score)]));
const SCORES_BEFORE=scoreSnap();
const STRAIN=JSON.parse(fs.readFileSync('analysis/strain/strain.json','utf8'));
// The private-money total is voluntary insurance + out-of-pocket; show it as the sum of the two parts as displayed
// (one decimal each) so the total and its parts always add up on every view (QA 2 Oct: ALB 49.0 vs 0.8 + 48.3).
for(const S of Object.values(STRAIN.countries)){const I=S.indicators||{},v=I.vhiShareCHE,o=I.oopShareCHE,t=I.vhiPlusOopShareCHE;
 if(t&&v&&o&&v.value!=null&&o.value!=null)t.value=Math.round((+(+v.value).toFixed(1)+ +(+o.value).toFixed(1))*10)/10;}
if(STRAIN.meta.changesScores!==false)throw new Error('strain.json must declare changesScores:false');
if(Object.keys(STRAIN.countries).sort().join()!==C.map(d=>d.iso3).sort().join())throw new Error('strain countries differ from data/');
const SI=k=>(d)=>STRAIN.countries[d.iso3].indicators[k]||{};
const waitOf=d=>{const I=STRAIN.countries[d.iso3].indicators;const xs=['hip','knee'].map(j=>I['waitMedianDays_'+j]).filter(x=>x&&x.value!=null);if(!xs.length)return {};const m=xs.reduce((a,b)=>b.value>a.value?b:a);return {...m,which:xs.map(x=>x).length};};
const COLS=[{k:'doc',n:'Doctors per 10,000',get:SI('doctorsPer10k'),flag:f=>f.doctorsLow},{k:'nur',n:'Nurses and midwives per 10,000',get:SI('nursesMidwivesPer10k'),flag:f=>f.nursesLow},{k:'prv',n:'Private insurance + out-of-pocket, % of health spending',get:SI('vhiPlusOopShareCHE'),flag:f=>f.privateSpendHigh},{k:'wt',n:'Longest median wait, hip or knee (days)',get:waitOf,flag:f=>f.longWaits}];
const fmtV=v=>Math.abs(v)>=100?Math.round(v):(+v).toFixed(1);
const strainCell=(d,c)=>{const x=c.get(d),f=STRAIN.countries[d.iso3].flags;if(x.value==null)return `<td data-v=""><span class="unk">unknown</span></td>`;
 const fl=c.flag(f)===true;const rank=x.oecdPeerRank?String(x.oecdPeerRank).split(' (')[0].replace(' of ','/'):'';
 return `<td data-v="${x.value}"><span class="v${fl?' f':''}">${fmtV(x.value)}</span><span class="y">${x.year||''}${x.stale?' old':''}</span>${rank?`<span class="r" title="OECD rank">OECD ${rank}</span>`:''}</td>`};
const RS={split:3,partial:2,connected:1};
const strainRow=d=>{const S=STRAIN.countries[d.iso3],r=S.recordSplit||{class:'unknown'};
 return `<tr data-iso="${d.iso3}" data-oecd="${S.oecdMember?'1':''}"><th scope="row"><a href="#${d.iso3}">${esc(d.name)}</a></th>${COLS.map(c=>strainCell(d,c)).join('')}<td data-v="${RS[r.class]||''}">${r.class==='unknown'?'<span class="unk">unknown</span>':`<span class="v${r.class==='split'?' f':''}">${r.class}</span>`}</td></tr>`};
const SC=Object.values(STRAIN.countries);
const nWait=SC.filter(s=>['hip','knee'].some(j=>(s.indicators['waitMedianDays_'+j]||{}).value!=null)).length;
const nSplit=SC.filter(s=>s.recordSplit&&s.recordSplit.class!=='unknown').length;
const flagsTrue=d=>((STRAIN.countries[d.iso3].flagCount||{}).true||0);
const four=C.filter(d=>flagsTrue(d)===4).sort((a,b)=>a.name.localeCompare(b.name));
const three=C.filter(d=>flagsTrue(d)===3).sort((a,b)=>a.name.localeCompare(b.name));
const jAnd=xs=>xs.length<2?xs.join(""):xs.slice(0,-1).join(", ")+" and "+xs.at(-1);
const rsc=SC.reduce((m,s)=>{const c=(s.recordSplit||{}).class||'unknown';m[c]=(m[c]||0)+1;return m},{});
const notFull=(rsc.split||0)+(rsc.partial||0);
const STRAIN_HEAD=notFull?`In ${notFull} of the ${nSplit} countries we could check, the public health record does not fully reach private care.`:`In all ${nSplit} countries we could check, the public health record reaches private care with no gap we found.`;
const FLAGP={workforceLow:'staffing',privateSpendHigh:'private spending',longWaits:'wait',recordSplit:'the record link'};
// Countries with every sign of strain, then those with three: the unknown clause only when every three-sign country has the same single unmeasured sign.
const pron=n=>n===1?'it':n===2?'either':'any of them';
const STRAIN_THREE=(()=>{const out=[];
 if(four.length)out.push(`${jAnd(four.map(d=>d.name))} ${four.length>1?'show':'shows'} all four signs of strain.`);
 if(three.length){const unk=three.map(d=>Object.entries(STRAIN.countries[d.iso3].flags).filter(([k,v])=>k in FLAGP&&v==null).map(([k])=>FLAGP[k]));
  const one=unk.every(u=>u.length===1)&&new Set(unk.flat()).size===1;
  out.push(`${jAnd(three.map(d=>d.name))} ${three.length>1?'show':'shows'} three of the four${one?`; no ${unk[0][0]} figure is published for ${pron(three.length)}, so the fourth is unknown`:''}.`)}
 return out.join(' ')})();
// check: the sentence names exactly the countries strain.json gives four and three true flags
for(const d of C){const t=flagsTrue(d),named=STRAIN_THREE.includes(d.name);if((t>=3)!==named&&!(t<3&&C.some(x=>x!==d&&x.name.includes(d.name)&&flagsTrue(x)>=3)))throw new Error(`strain sentence disagrees with strain.json for ${d.iso3} (${t} flags)`)}
const STRAIN_COVER=`Waits are reported for only ${nWait} of ${N} countries. OECD ranks compare a country with the 38 members of the OECD (the Organisation for Economic Co-operation and Development), mostly high-income countries.`;
const cut=STRAIN.meta.cutoffs||{};
const STRAIN_HEADERS='<th scope="col">Country</th>'+COLS.map((c,i)=>{const have=C.filter(d=>c.get(d).value!=null).length;return `<th scope="col" data-i="${i+1}"><button type="button">${c.n}</button><span class="num">${have} of ${N} report</span></th>`}).join('')+`<th scope="col" data-i="${COLS.length+1}"><button type="button">Record reaches private care?</button><span class="num">${nSplit} of ${N} known</span></th>`;
const STRAIN_ROWS=[...C].sort((a,b)=>a.name.localeCompare(b.name)).map(strainRow).join('\n');
const STRAIN_KEY=`Bold with a square: a sign of strain. Doctors or nurses per 10,000 below the bottom quarter of OECD members (${STRAIN.meta.cutoffs.doctorsPer10k_Q1} doctors, ${STRAIN.meta.cutoffs.nursesMidwivesPer10k_Q1} nurses and midwives); private insurance plus out-of-pocket above the top quarter of OECD members (${STRAIN.meta.cutoffs.vhiPlusOopShareCHE_Q3}% of health spending); a median wait over ${STRAIN.meta.waitThresholdDays||90} days; a record that stops at the private door.`;
const yrs=SC.flatMap(s=>Object.values(s.indicators).map(x=>x&&x.year).filter(Boolean));
const WF=(()=>{const xs=Object.values(STRAIN.countries),f=ys=>[ys.filter(o=>o.flags.workforceLow===true).length,ys.filter(o=>o.flags.workforceLow!=null).length];return{non:f(xs.filter(o=>!o.oecdMember)),oecd:f(xs.filter(o=>o.oecdMember))}})();
const STRAIN_NOTES=[`Cut-offs are set by the OECD members, a fixed reference group, so they do not move as countries are added. ${WF.non[0]} of ${WF.non[1]} countries outside the OECD fall below the workforce cut-off, against ${WF.oecd[0]} of ${WF.oecd[1]} members, so the flag says more within the OECD than outside it.`,'WHO counts voluntary insurance only. Compulsory private insurance (large in the United States, the Netherlands and Switzerland) is shown separately in each country panel.',`Waits are reported by ${nWait} countries, mostly those that run waiting lists. Unknown means not reported, not short.`,'Unknown is not no. Where our file is silent about private providers, the record column says unknown.'].map(x=>`<li>${esc(x)}</li>`).join('');
const STRAIN_SOURCE=`Context, not scored. Sources: WHO Global Health Observatory (health workforce), WHO Global Health Expenditure Database (final years to ${STRAIN.meta.ghedLastFinalYear||''}), OECD Health Statistics; values ${Math.min(...yrs)} to ${Math.max(...yrs)}, retrieved ${STRAIN.meta.built}. Record classes quote our own country files.`;
const OECD_N=SC.filter(s=>s.oecdMember).length;
// Spotlight: one country's chain, computed from strain.json (the Canada worked example). Context, not scored.
const ordRank=x=>{const m=String(x).match(/^(\d+) of (\d+)/);if(!m)return '';const n=+m[1],suf=(n%100>=11&&n%100<=13)?'th':({1:'st',2:'nd',3:'rd'}[n%10]||'th');return `${n}${suf} of ${m[2]} OECD countries`};
const THE=new Set(['USA','GBR','NLD','PHL','ARE']);const theN=d=>(THE.has(d.iso3)?'the ':'')+d.name;const poss=n=>n.endsWith('s')?n+"'":n+"'s";
function spotlight(iso){const d=data[iso],S=STRAIN.countries[iso],I=S.indicators,r=S.recordSplit||{},F=S.flags||{};
 // Every country gets all four links; a missing link prints as not measured, never as absent strain (TUFTE_SPEC 5.7).
 const sign=on=>on===true?' <span class="sig">a sign of strain</span>':'';
 const unk=t=>`<span class="unk">Not measured: ${t}</span>`;
 const doc=I.doctorsPer10k,nur=I.nursesMidwivesPer10k;
 const s1=doc&&doc.value!=null?`<b>Doctors.</b> ${(+doc.value).toFixed(doc.value>=100?0:1)} per 10,000 people (${doc.year})${doc.oecdPeerRank?`, ${ordRank(doc.oecdPeerRank)}`:''}${nur&&nur.value!=null?`; nurses and midwives ${(+nur.value).toFixed(nur.value>=100?0:1)} per 10,000`:''}.${sign(F.doctorsLow||F.nursesLow)}`:`<b>Doctors.</b> ${unk('no WHO workforce figure is published for '+esc(theN(d))+'.')}`;
 const h=I.waitMedianDays_hip,k=I.waitMedianDays_knee,hp=I.waitPctOver3Months_hip,kp=I.waitPctOver3Months_knee;
 const s2=h&&h.value!=null?`<b>Waits.</b> A median ${Math.round(h.value)} days from specialist to treatment for a hip replacement${k&&k.value!=null?` and ${Math.round(k.value)} for a knee`:''} (${h.year})${hp&&hp.value!=null?`; ${Math.round(hp.value)}%${kp&&kp.value!=null?` and ${Math.round(kp.value)}%`:''} waited more than 3 months`:''}.${sign(F.longWaits)}`:`<b>Waits.</b> ${unk(STRAIN.countries[d.iso3].oecdMember?esc(theN(d)).replace(/^./,c=>c.toUpperCase())+' does not report these waits to the OECD.':`Waits are published only for OECD members; ${esc(theN(d))} is not one.`)}`;
 const v=I.vhiShareCHE,vp=I.vhiPopulationPct,o=I.oopShareCHE,cp=I.compulsoryPrivateInsuranceShareCHE;
 const parts=[];if(v&&v.value!=null)parts.push(`voluntary insurance pays ${(+v.value).toFixed(1)}%${v.oecdPeerRank?` (${ordRank(v.oecdPeerRank)})`:''}`);if(cp&&cp.value!=null&&cp.value>=1)parts.push(`compulsory private insurance ${(+cp.value).toFixed(1)}%`);if(o&&o.value!=null)parts.push(`out-of-pocket ${(+o.value).toFixed(1)}%`);
 const yr=(v&&v.year)||(o&&o.year)||'';
 const s3=parts.length?`<b>Private money.</b> Of health spending, ${parts.join(', ')} (${yr})${vp&&vp.value!=null?`; ${Math.round(vp.value)}% of people hold voluntary insurance (${vp.year})`:''}.${sign(F.privateSpendHigh)}`:`<b>Private money.</b> ${unk('no WHO spending breakdown is published for '+esc(theN(d))+'.')}`;
 const s4=r.class&&r.class!=='unknown'&&r.quote?`<b>Record and private care: ${esc(r.class)}.</b> "${esc(r.quote)}"${r.url?` <a href="${esc(r.url)}" target="_blank" rel="noopener">${esc((r.research&&r.research.source)||'Source')}</a>`:''}.${sign(r.class==='split')}`:`<b>Record and private care.</b> ${unk('we found no source on whether private providers in '+esc(theN(d))+' write to the shared record. Unknown, not connected.')}`;
 return `<aside class="spot" aria-label="Example: ${esc(d.name)}"><p class="overline">Example: ${esc(d.name)}</p><ol>${[s1,s2,s3,s4].map(x=>`<li>${x}</li>`).join('')}</ol><p class="cap">Context, not scored. ${esc(poss(theN(d))).replace(/^./,c=>c.toUpperCase())} overall score stays ${d.overall}. <a href="#${iso}" class="spot-open">Open ${esc(d.name)}</a></p></aside>`}
const SPOTS=Object.fromEntries(C.map(d=>[d.iso3,spotlight(d.iso3)]).filter(x=>x[1]));
const spotOpts=[...C].filter(d=>SPOTS[d.iso3]).sort((a,b)=>a.name.localeCompare(b.name)).map(d=>`<option value="${d.iso3}"${d.iso3==='CAN'?' selected':''}>${esc(d.name)}</option>`).join('');
const STRAIN_SPOT=`<label class="pill" style="margin-top:20px">Example country <select id="spotPick" aria-label="Choose an example country">${spotOpts}</select></label><div id="spotBox">${SPOTS.CAN||''}</div>`;


// ---- computed prose ----
const nWord=n=>['none','one','two','three','four','five','six','seven','eight','nine','ten'][n]??String(n);
// Rank ranges and the lead group come from the stability analysis (analysis/robustness/robustness.py, main model),
// only if it was computed on the current data/ (DECISION_RULES.md rule 1). Rule 2: a country is called first alone only if
// it is first in 95% or more of main-model draws; otherwise every country whose 90% range includes rank 1 is named.
const ROBJ=fs.existsSync('analysis/robustness/robustness.json')?JSON.parse(fs.readFileSync('analysis/robustness/robustness.json','utf8')):null;
const ROB_FRESH=!!(ROBJ&&ROBJ.meta&&ROBJ.meta.data&&ROBJ.meta.data.dataSha256===require('./scripts/datahash.js').dataSha256(__dirname));
if(ROBJ&&!ROB_FRESH)console.warn('WARN robustness.json is stale: rank ranges and the lead group are left out until analysis/robustness/robustness.py is rerun');
const MAINK=(ROBJ&&ROBJ.meta&&ROBJ.meta.main)||'combined';
const ROB=ROB_FRESH?ROBJ.monteCarlo[MAINK].countries:{};
const leadGroup=ROB_FRESH?ranked.filter(d=>ROB[d.iso3]&&ROB[d.iso3].rank90[0]===1):[];
const soleLead=leadGroup.length===1&&ROB[leadGroup[0].iso3].firstShare>=0.95;
const joinNames=xs=>xs.length<2?xs.join(''):`${xs.slice(0,-1).join(', ')} and ${xs.at(-1)}`;
const lede=(modelCount.Individual===0&&bandCount.Leading===0
  ?`In ${YEAR}, none of the ${N} countries we rated puts a person fully in charge of their own health record.`
  :`In ${YEAR}, we rated ${N} countries on a person's right to see, control and share their own health record.`)
 +` ${soleLead?`${top.name} leads at ${top.overall} of 100, and the median is ${median}`:leadGroup.length>1?`The highest scores are ${joinNames(leadGroup.map(d=>`${d.name} (${d.overall})`))}; allowing for scoring error, any of them could rank first. The median is ${median}`:`${top.name} scores highest at ${top.overall} of 100, and the median is ${median}`}. `
 +(bandCount.Leading===0?'No country reaches the Leading band (85 and up). ':`${bandCount.Leading} reach the Leading band. `)
 +`By band, ${bandCount.Strong} rate Strong, ${bandCount.Mixed} Mixed${bandCount.Poor?`, ${bandCount.Weak} Weak and ${bandCount.Poor} Poor`:` and ${bandCount.Weak} Weak`}. `
 +(modelCount.Individual===0?`Everywhere, the state or providers run the system that holds the record`:`In ${modelCount.Individual} of ${N} the person holds their own record; elsewhere the state or providers run the system that holds it`)+` (${modelCount.Shared} Shared, ${modelCount.Institutional} Institutional, ${modelCount.State} State).`;
const n65=C.filter(d=>d.overall>=65).length,n45=C.filter(d=>d.overall<45).length;
const rankHead=`${soleLead?`${top.name} leads.`:leadGroup.length>1?`${joinNames(leadGroup.map(d=>d.name))} lead; allowing for scoring error, any of them could rank first.`:`${top.name} scores highest.`} Of ${N} countries, ${n65} score 65 or more (Strong or better), and ${n45} score under 45 (Weak or worse).`;
const meds=CATS.map(c=>({c,m:DIST[c.k].med}));const lowM=Math.min(...meds.map(x=>x.m)),highM=Math.max(...meds.map(x=>x.m));
const lc=w=>w==='AI'?w:w.toLowerCase();
const joinAnd=xs=>xs.length<2?xs.join(''):xs.slice(0,-1).join(', ')+' and '+xs.at(-1);
// Plain-English meaning of each right, for the section heading and its lede (JAS: "this needs more context").
const PLAIN={access:'getting a full copy of your own record',control:'having a say over who sees your record',privacy:'protection from leaks and misuse',journey:'your record following you between doctors, labs and pharmacies',commercial:'protection from your data being sold or used for marketing',clinical:'your doctor seeing your record when treating you',research:'being asked before your record is used for research',ai:'rules for AI used in your care'};
const lowCats=meds.filter(x=>x.m===lowM).map(x=>x.c),highCats=meds.filter(x=>x.m===highM).map(x=>x.c),maxMed=Math.max(...meds.map(x=>x.m));
const matrixHead=`The weakest rights worldwide: ${joinAnd(lowCats.map(c=>PLAIN[c.k]))}. The typical country scores ${lowM} of 100 on ${lowCats.length>1?'each':'it'}.`;
const MATRIX_LEDE=`We score eight rights, each from 0 to 100. Access to the record and control over it count most, 20% each. Across all ${N} countries, the typical country, the one in the middle, scores highest on ${joinAnd(highCats.map(c=>PLAIN[c.k]))} (${highM} of 100)${maxMed<50?`; on every one of the eight, the typical score is under 50`:''}.`;
const cap=s=>s.charAt(0).toUpperCase()+s.slice(1);
const sourceLine=`Source: SuperTruth review of national laws, regulator and ministry pages and recent reporting, ${RESEARCH_WINDOW}. ${allSources.length} sources cited (${undated} undated). Rubric v1, weights below. ${lowConf.length?`${lowConf.length} ${lowConf.length===1?'country is':'countries are'} low confidence, marked with a hollow dot.`:'No country is rated low confidence.'}`;

// Likely rank: 90% range under weight and scoring-noise perturbation (analysis/robustness, combined run)
const likely=iso=>{const r=ROB[iso];return r&&r.rank90?(r.rank90[0]===r.rank90[1]?String(r.rank90[0]):`${r.rank90[0]} to ${r.rank90[1]}`):''};
// ---- static figures ----
const TW=200; // dot strip width; table must fit the 1104 px column with the likely-rank column (QA 2 Oct)
function rankRow(d){const b=bandOf(d.overall),x=(TW*d.overall/100).toFixed(1),low=d.confidence==='low';
 const ticks=[25,45,65,85].map(v=>`<line x1="${TW*v/100}" x2="${TW*v/100}" y1="0" y2="28" class="tk"/>`).join('');
 return `<tr data-iso="${d.iso3}" data-overall="${d.overall}" data-name="${esc(d.name)}" data-region="${esc(d.region)}" data-stories="${d.stories.length}" data-dti="${d.dti&&!d.dti.provisional?d.dti.dti:0}">
<td class="num rk">${rankLabel(d.rank)}</td><th scope="row" class="nm"><a href="brief/${d.iso3}/">${esc(d.name)}</a>${low?'<sup class="lc" title="Low confidence">*</sup>':''}</th>
<td class="num sc">${d.overall}</td><td class="num lr">${likely(d.iso3)}</td><td class="meta">${esc(d.region)} · ${esc(d.controlModel)}</td>
<td class="trk"><svg width="${TW}" height="28" viewBox="0 0 ${TW} 28" aria-hidden="true"><line x1="0" x2="${TW}" y1="14" y2="14" class="tl"/>${ticks}<circle cx="${x}" cy="14" r="4.5" fill="${low?'#FFFFFF':b.c}" stroke="#111827" stroke-width="${low?1.5:1}"/></svg></td>
<td class="num dt">${d.dti&&!d.dti.provisional?`${d.dti.dti} <span class="tier">${d.dti.tierLabel}</span>`:'<span class="tier">pending</span>'}</td><td class="num st">${d.stories.length}</td></tr>`}
const CW=96;
function matrixRow(d){const low=d.confidence==='low';return `<tr data-iso="${d.iso3}"><th scope="row" class="nm"><a href="#${d.iso3}">${esc(d.name)}</a>${low?'<sup class="lc" title="Low confidence">*</sup>':''}</th>${CATS.map(c=>{const v=d.categories[c.k].score,m=DIST[c.k].med;
 return `<td data-v="${v}" title="${esc(d.name)} · ${c.s} ${v}"><span class="vh">${c.s} ${v}</span><svg width="${CW}" height="24" viewBox="0 0 ${CW} 24" aria-hidden="true"><line x1="0" x2="${CW}" y1="12" y2="12" class="tl"/><line x1="${(CW*m/100).toFixed(1)}" x2="${(CW*m/100).toFixed(1)}" y1="0" y2="24" class="md"/><circle cx="${(CW*v/100).toFixed(1)}" cy="12" r="2.5" fill="${low?'#FFFFFF':'#111827'}" stroke="#111827" stroke-width="${low?1:0}"/></svg></td>`}).join('')}</tr>`}
const BTIP={"Poor": "0 to 24: no meaningful right or infrastructure, or active misuse.", "Weak": "25 to 44: rights mostly on paper, or a fragmented record. The patient depends on institutions.", "Mixed": "45 to 64: partial rights or partial infrastructure. Works for some people in some settings.", "Strong": "65 to 84: the right exists and mostly works, with notable gaps.", "Leading": "85 to 100: the right is in law and works at national scale, with controls the patient can see."};
const legend=`<ul class="legend" aria-label="Score bands">${BANDS.map(b=>`<li tabindex="0" data-tip="${BTIP[b.n]}"><i style="background:${b.c}"></i>${b.n} <span class="num">${b.lo}-${b.hi} · ${bandCount[b.n]}</span></li>`).join('')}<li tabindex="0" data-tip="Territories and disputed areas the index does not rate: ${esc(unratedNames.join(', '))}. ${esc(unCoverage)}."><i class="nr"></i>Not rated <span class="num">${unrated}</span></li></ul>`;
const weights=`<table class="wt"><thead><tr><th scope="col">Category</th><th scope="col" class="num">Weight</th><th scope="col" class="num">Median</th></tr></thead><tbody>${CATS.map(c=>`<tr><td>${c.n}</td><td class="num">${c.w}%</td><td class="num">${DIST[c.k].med}</td></tr>`).join('')}</tbody></table>`;
const bandsTable=`<table class="wt"><tbody>${[['Leading','85-100','the right exists in law and works in practice at national scale, with controls the patient can see'],['Strong','65-84','the right exists and mostly works; notable gaps in coverage, use or exceptions'],['Mixed','45-64','partial rights or partial infrastructure; works for some people in some settings'],['Weak','25-44','rights mostly on paper or fragmented; the patient depends on institutions'],['Poor','0-24','no meaningful right or infrastructure, or active misuse']].map(([n,rg,tx])=>`<tr><td><i class="sw" style="background:${BANDS.find(b=>b.n===n).c}"></i>${n}</td><td class="num">${rg}</td><td>${tx}</td></tr>`).join('')}</tbody></table>`;
const MODEL_DESC={Individual:'The person holds the keys.',Shared:'The person has real controls inside a state or provider system.',Institutional:'Providers and insurers decide.',State:'The government decides, with limited individual say.'};
const modelsList=`<ul class="plain">${Object.entries(MODEL_DESC).map(([m,tx])=>`<li><b>${m}</b> <span class="num">${modelCount[m]}</span>. ${tx}</li>`).join('')}</ul>`;

const jsonld={"@context":"https://schema.org","@type":"Dataset",name:NAME,datePublished:"2026-10-02",isPartOf:{"@type":"WebSite",name:NAME,url:SITE,publisher:{"@type":"Organization",name:"SuperTruth",url:"https://supertruth.ai"}},description:`${DESCRIPTOR}: a SuperTruth index scoring ${N} countries 0 to 100 on eight weighted categories of a person's right to see, control and share their own health record.`,
 url:SITE,temporalCoverage:String(YEAR),dateModified:asOf,version:VERSION,license:"https://creativecommons.org/licenses/by/4.0/",
 author:require('./brief.js').AUTHORS,creator:{"@type":"Organization",name:"SuperTruth",url:"https://supertruth.ai",sameAs:["https://www.wikidata.org/wiki/Q141434273"]},publisher:{"@type":"Organization",name:"SuperTruth",url:"https://supertruth.ai",sameAs:["https://www.wikidata.org/wiki/Q141434273"]},isAccessibleForFree:true,inLanguage:"en",
 keywords:["health record rights","patient access to health records","health data privacy","electronic health records","health data governance"],
 citation:`Snyder, J. A., Hill, B., & Raney, D. (${YEAR}). ${NAME} (version ${VERSION}). SuperTruth Inc. ${SITE}`,
 distribution:[['who-holds-the-record-scores.csv','text/csv','Scores'],['who-holds-the-record-sources.csv','text/csv','Sources'],['who-holds-the-record.json','application/json','Everything']].map(([f,t,n])=>({"@type":"DataDownload",name:`${NAME}: ${n}`,encodingFormat:t,contentUrl:`${SITE}data/${f}`})),
 variableMeasured:CATS.map(c=>c.n),spatialCoverage:ranked.map(d=>({"@type":"Country",name:d.name})),
 hasPart:ranked.map(d=>({"@type":"Article",name:`Who holds the health record in ${theN(d)}?`,url:`${SITE}brief/${d.iso3}/`}))};

// ---- assemble ----
const clientData={};C.forEach(d=>{const S=STRAIN.countries[d.iso3];clientData[d.iso3]={...d,likely:likely(d.iso3),strain:{reading:S.reading,recordSplit:S.recordSplit,flags:S.flags,oecd:S.oecdMember,ind:Object.fromEntries(['doctorsPer10k','nursesMidwivesPer10k','vhiPlusOopShareCHE','vhiShareCHE','oopShareCHE','compulsoryPrivateInsuranceShareCHE','vhiPopulationPct','waitMedianDays_hip','waitMedianDays_knee','waitPctOver3Months_hip','waitPctOver3Months_knee'].map(k=>{const x=S.indicators[k]||{};return [k,x.value==null?null:{v:x.value,y:x.year,r:x.oecdPeerRank||null,stale:!!x.stale,src:x.source||'',url:x.url||''}]}))},iso2:iso.alpha3ToAlpha2(d.iso3)||null,catRank:Object.fromEntries(CATS.map(c=>[c.k,rankLabel(d.catRank[c.k])])),rankLabel:rankLabel(d.rank)}});
const ledeLead=lede.split('. ')[0]+'.';
const monthYear=s=>{const[y,m]=String(s).split('-');return `${['January','February','March','April','May','June','July','August','September','October','November','December'][(+m||1)-1]} ${y}`};
const THEME_N={access_refused:'Access refused',access_delay_or_cost:'Delay or cost',record_wrong:'Record wrong',breach:'Breach',sold_or_shared:'Sold or shared',lost_between_providers:'Lost between providers',other:'Other'};
const themeSorted=Object.entries(themeCount).sort((a,b)=>b[1]-a[1]);
const storyCountries=C.filter(d=>d.stories.length).length;
const topTheme=themeSorted.length?THEME_N[themeSorted[0][0]].toLowerCase():'';
const NAV=require('./nav.js');
const vars={NAV:NAV.navHTML({base:''}),NAV_CSS:NAV.NAV_CSS,VERSION,STRAIN_THREE:esc(STRAIN_THREE),STRAIN_SPOT,STRAIN_HEAD:esc(STRAIN_HEAD),STRAIN_COVER:esc(STRAIN_COVER),STRAIN_KEY:esc(STRAIN_KEY),STRAIN_HEADERS,STRAIN_ROWS,STRAIN_NOTES,STRAIN_SOURCE:esc(STRAIN_SOURCE),OECD_N,STORIES_HEAD:esc(`${storyTotal} published accounts from ${storyCountries} countries. ${themeSorted.length?cap(topTheme)+' is the most common problem reported.':''}`),STORY_WINDOW:storyDates.length?`published ${monthYear(storyDates[0])} to ${monthYear(storyDates.at(-1))}`:'',THEME_BUTTONS:`<button type="button" data-theme="all" aria-pressed="true">All<span class="num">${storyTotal}</span></button>`+themeSorted.map(([k,v])=>`<button type="button" data-theme="${k}" aria-pressed="false">${THEME_N[k]}<span class="num">${v}</span></button>`).join(''),EU_INSET,LEDE_LEAD:esc(ledeLead),NAME:esc(NAME),DESCRIPTOR:esc(DESCRIPTOR),SITE,LEDE:esc(lede.slice(ledeLead.length).trim()),DATELINE:`Version ${VERSION} · published <time datetime="2026-10-02">2 October 2026</time> · data as of <time datetime="${asOf}">${asOf}</time> · research ${RESEARCH_WINDOW}`,LEGEND:legend,RANK_HEAD:esc(rankHead),MATRIX_LEDE:esc(MATRIX_LEDE),MATRIX_HEAD:esc(cap(matrixHead)),
 RANK_ROWS:ranked.map(rankRow).join('\n'),MATRIX_HEADERS:CATS.map(c=>`<th scope="col" data-k="${c.k}"><button type="button" data-tip="${{"access": "Can a person see and copy their whole record, and does it work in practice?", "control": "Can the person decide who sees their record and see who looked?", "privacy": "Strength and enforcement of health-data law; breaches; state access.", "journey": "Does the record follow the person across all of care?", "commercial": "Limits on selling or marketing health data; apps and brokers. Higher = more protection.", "clinical": "Can the treating clinician see the full record when needed?", "research": "Is research use consent-based or transparent, while research stays possible?", "ai": "Rules for AI used in care: oversight, transparency, change control."}[c.k]} Weight ${c.w}%. The grey line is the median.">${c.s}</button><span class="num">${c.w}% · med ${DIST[c.k].med}</span></th>`).join(''),MATRIX_ROWS:ranked.map(matrixRow).join('\n'),
 SOURCE_LINE:esc(sourceLine),SOURCE_LINE_MATRIX:esc(sourceLine.replace(/, marked with a hollow dot\./,', marked with an asterisk.')),MATRIX_SCALE:CATS.map(()=>'<th><span><i>0</i><i>50</i><i>100</i></span></th>').join(''),N:N,STORY_TOTAL:storyTotal,STORY_SINCE:storyDates.length?storyDates[0].slice(0,7):'',WEIGHTS:weights,BANDS_TABLE:bandsTable,MODELS:modelsList,
 LOWCONF_NOTE:lowConf.length?`* Low confidence: ${esc(joinAnd(lowConf.map(d=>d.name)))}. `:'',LOWCONF_LINE:lowConf.length?`${lowConf.length} ${lowConf.length===1?'country is':'countries are'} low confidence: ${esc(joinAnd(lowConf.map(d=>d.name)))}.`:'No country is rated low confidence.',UNRATED:unrated,CONTACT:STORIES_CONTACT,YEAR,ASOF:asOf,JSONLD:JSON.stringify(jsonld).replace(/</g,'\\u003c'),
 DESC:esc(`None of ${N} countries puts a person fully in charge of their own health record. ${top.name} scores highest at ${top.overall} of 100; every source cited.`)};
let html=fs.readFileSync('template.html','utf8').replace(/\{\{(\w+)\}\}/g,(m,k)=>{if(!(k in vars))throw new Error('unknown template var '+k);return vars[k]});
// The big data (map shapes, country files, spotlights) ships as hashed script files, not inline: Googlebot reads only
// the first 2 MB of each file, so every file, the page included, must stay under that (guard below).
const DATA_FILES=[]; // written after out/ is reset (below)
{const ser=o=>JSON.stringify(o).replace(/</g,'\\u003c'),keys=Object.keys(clientData),pick=ks=>Object.fromEntries(ks.map(k=>[k,clientData[k]]));
 const init='window.__WHR=window.__WHR||{DATA:{}};';
 // country data split into as many files as needed, each under about 1.2 MB, in key order
 const parts=[init+`__WHR.GEO=${JSON.stringify({type:'FeatureCollection',features:feats})};__WHR.SPOTS=${ser(SPOTS)};`];
 {let cur=[],size=0;for(const k of keys){const n=Buffer.byteLength(ser(clientData[k]));if(cur.length&&size+n>1200000){parts.push(init+`Object.assign(__WHR.DATA,${ser(pick(cur))});`);cur=[];size=0}cur.push(k);size+=n}if(cur.length)parts.push(init+`Object.assign(__WHR.DATA,${ser(pick(cur))});`)}
 const tags=parts.map((js,i)=>{const h=require('crypto').createHash('sha256').update(js).digest('hex').slice(0,10),f=`assets/data-${i+1}.${h}.js`;
   if(Buffer.byteLength(js)>1900000)throw new Error(`${f} is over 1.9 MB; split the data further`);DATA_FILES.push([f,js]);return `<script src="${f}"></script>`;}).join('');
 const at=html.indexOf('<script>\nconst SPOTS=');if(at<0)throw new Error('data script anchor missing');
 html=html.slice(0,at)+tags+'\n'+html.slice(at);}
html=html.replace('/*__GEO__*/null','__WHR.GEO').replace('/*__DATA__*/null','__WHR.DATA')
 .replace('/*__SPOTS__*/null','__WHR.SPOTS').replace('/*__CATS__*/null',JSON.stringify(CATS)).replace('/*__BANDS__*/null',JSON.stringify(BANDS)).replace('/*__DIST__*/null',JSON.stringify(DIST));
if(Buffer.byteLength(html)>1900000)throw new Error('home page HTML is over 1.9 MB (Googlebot reads 2 MB per file)');
if(/fonts\.googleapis|cdn\.jsdelivr|unpkg\.com/.test(html))throw new Error('template still loads a third-party asset');


fs.rmSync('out',{recursive:true,force:true});
// ---- agent data: a compact digest (cached system context) + full per-country detail (tool) ----
fs.mkdirSync('out/agent',{recursive:true});
const dline=d=>{const dt=d.dti&&!d.dti.provisional?`DTI evidence ${d.dti.dti} ${d.dti.tierLabel}`:'DTI evidence pending';
 const cats=CATS.map(c=>`${c.s} ${d.categories[c.k].score}`).join(', ');
 const sums=CATS.map(c=>`  - ${c.n} (${d.categories[c.k].score}): ${d.categories[c.k].summary}`).join('\n');
 return `## ${d.name} [${d.iso3}] | overall ${d.overall}, rank ${rankLabel(d.rank)} of ${N}${likely(d.iso3)?` (likely range ${likely(d.iso3)})`:''}, ${bandOf(d.overall).n} | keys: ${d.controlModel} | confidence: ${d.confidence} | ${dt} | stories: ${d.stories.length}${d.dti&&d.dti.underReview&&d.dti.underReview.length?` | under review: ${d.dti.underReview.join(', ')}`:''}\nCategory scores: ${cats}\nHeadline: ${d.headline}\n${sums}${SPOTS[d.iso3]?`\n  - Strain and split (context, not scored): ${SPOTS[d.iso3].replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').replace('Example: '+d.name,'').replace(/Open [^.]*$/,'').trim()}`:''}`};
const digest=[`HEALTH RECORD RIGHTS INDEX: index digest. Data as of ${asOf}. ${N} countries. Weights: ${CATS.map(c=>`${c.s} ${c.w}%`).join(', ')}.`,
 `Bands: Poor 0-24, Weak 25-44, Mixed 45-64, Strong 65-84, Leading 85-100. Counts: ${BANDS.map(b=>`${b.n} ${bandCount[b.n]}`).join(', ')}. Median overall ${median}.`,
 `Keys models: ${models.map(m=>`${m} ${modelCount[m]}`).join(', ')}. Category medians: ${CATS.map(c=>`${c.s} ${DIST[c.k].med}`).join(', ')}.`,
 `Low confidence countries: ${lowConf.map(d=>d.name).join(', ')}. Stories: ${storyTotal} published accounts; themes: ${Object.entries(themeCount).map(([k,v])=>`${k} ${v}`).join(', ')}.`,
 `Ranking: ${ranked.map(d=>`${rankLabel(d.rank)} ${d.name} ${d.overall}`).join('; ')}.`,
 '',...ranked.map(dline)].join('\n');
fs.writeFileSync('out/agent/digest.txt',digest);
const detail={};C.forEach(d=>{detail[d.iso3]={iso3:d.iso3,name:d.name,overall:d.overall,rank:rankLabel(d.rank),band:bandOf(d.overall).n,controlModel:d.controlModel,confidence:d.confidence,headline:d.headline,
 dti:d.dti&&!d.dti.provisional?{dti:d.dti.dti,tier:d.dti.tier,underReview:d.dti.underReview}:'pending',
 categories:Object.fromEntries(CATS.map(c=>[c.k,{name:c.n,score:d.categories[c.k].score,summary:d.categories[c.k].summary,detail:d.categories[c.k].detail,sources:(d.categories[c.k].sources||[]).map(s=>({title:s.title,url:s.url,date:s.date}))}])),
 journey:d.journey,journeyNote:d.journeyNote,laws:d.laws,news:d.news,stories:d.stories.map(s=>({date:s.date,headline:s.headline,paraphrase:s.paraphrase,source:s.source,url:s.url,theme:s.theme,status:s.status}))}});
fs.writeFileSync('out/agent/countries.json',JSON.stringify(detail));

// ---- open data downloads (CC BY 4.0) ----
fs.mkdirSync('out/data',{recursive:true});
const csvq=v=>{const s=String(v??'');return /[",\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s};
const rowsC=[['iso3','country','region','overall','rank','likely_rank','band','keys_model','confidence','dti_evidence','dti_tier',...CATS.map(c=>c.k),'stories','as_of']];
ranked.forEach(d=>rowsC.push([d.iso3,d.name,d.region,d.overall,rankLabel(d.rank),likely(d.iso3),bandOf(d.overall).n,d.controlModel,d.confidence,d.dti&&!d.dti.provisional?d.dti.dti:'',d.dti&&!d.dti.provisional?d.dti.tier:'',...CATS.map(c=>d.categories[c.k].score),d.stories.length,d.asOf]));
fs.writeFileSync('out/data/who-holds-the-record-scores.csv',rowsC.map(r=>r.map(csvq).join(',')).join('\n')+'\n');
const rowsS=[['iso3','country','category','score','source_title','source_url','source_date']];
ranked.forEach(d=>CATS.forEach(c=>(d.categories[c.k].sources||[]).forEach(s=>rowsS.push([d.iso3,d.name,c.k,d.categories[c.k].score,s.title,s.url,s.date]))));
fs.writeFileSync('out/data/who-holds-the-record-sources.csv',rowsS.map(r=>r.map(csvq).join(',')).join('\n')+'\n');
fs.writeFileSync('out/data/who-holds-the-record.json',JSON.stringify({name:NAME,version:VERSION,asOf,license:'CC BY 4.0',creator:'SuperTruth Inc.',weights:Object.fromEntries(CATS.map(c=>[c.k,c.w])),countries:ranked.map(d=>({iso3:d.iso3,name:d.name,region:d.region,overall:d.overall,rank:rankLabel(d.rank),likelyRank:likely(d.iso3),band:bandOf(d.overall).n,keysModel:d.controlModel,confidence:d.confidence,headline:d.headline,categories:Object.fromEntries(CATS.map(c=>[c.k,{score:d.categories[c.k].score,summary:d.categories[c.k].summary,sources:d.categories[c.k].sources}])),laws:d.laws,dti:d.dti&&!d.dti.provisional?{grade:d.dti.dti,tier:d.dti.tier,tierCapped:!!d.dti.tierCapped}:'pending',asOf:d.asOf,stories:d.stories.map(s=>({date:s.date,headline:s.headline,paraphrase:s.paraphrase,source:s.source,url:s.url,theme:s.theme,status:s.status}))}))},null,1));
// Self-contained output: no third-party request on load (legal-privacy rule; works on venue wifi).
// The one exception is GA4 (assets/analytics.js), which loads only after the reader says yes.
fs.mkdirSync('out/assets/fonts',{recursive:true});
fs.copyFileSync('node_modules/globe.gl/dist/globe.gl.min.js','out/assets/globe.gl.min.js');
fs.cpSync('brand','out/assets',{recursive:true});
for(const[f,js]of DATA_FILES)fs.writeFileSync('out/'+f,js);
const fonts={'inter':'@fontsource-variable/inter/files/inter-','jetbrains-mono':'@fontsource-variable/jetbrains-mono/files/jetbrains-mono-'};
for(const[k,pre]of Object.entries(fonts))for(const sub of['latin','latin-ext'])fs.copyFileSync(`node_modules/${pre}${sub}-wght-normal.woff2`,`out/assets/fonts/${k}-${sub}.woff2`);
if(NOINDEX)html=html.replace('<meta charset="utf-8">','<meta charset="utf-8">\n<meta name="robots" content="noindex,nofollow">');
if(scoreSnap()!==SCORES_BEFORE)throw new Error('strain layer changed a score');
fs.writeFileSync('out/index.html',html);
fs.writeFileSync('out/facts.json',JSON.stringify({dataSha256:require('./scripts/datahash.js').dataSha256(__dirname),version:VERSION,asOf,N,top:{name:top.name,score:top.overall},median,bandCount,modelCount,lowConf:lowConf.map(d=>d.iso3),sources:allSources.length,undated,unrated,storyTotal,themeCount,dti:Object.fromEntries(C.map(d=>[d.iso3,d.dti?{dti:d.dti.dti,tier:d.dti.tier,underReview:d.dti.underReview}:null])),dist:Object.fromEntries(CATS.map(c=>[c.k,{...DIST[c.k],all:undefined}])),ranked:ranked.map(d=>({iso3:d.iso3,name:d.name,overall:d.overall,rank:rankLabel(d.rank),band:bandOf(d.overall).n,model:d.controlModel,confidence:d.confidence,stories:d.stories.length,cats:Object.fromEntries(CATS.map(c=>[c.k,d.categories[c.k].score]))}))},null,1));
// ---- briefs, then the crawler files (written last so they only list pages that exist) ----
for(const d of C)if(!fs.existsSync(`brand/og/${d.iso3}.png`))throw new Error('no OG image for '+d.iso3+' (run scripts/og.py)');
const BR=require('./brief.js').buildBriefs({C,CATS,BANDS,bandOf,rankLabel,N,DIST,STRAIN,SPOTS,esc,asOf,SITE,theN,MODEL_DESC,NOINDEX,NAME,likely});console.log('briefs',BR.n);
// IndexNow key: brand/<32 hex>.txt is served at /<key>.txt (the launch script reads the same file).
const INDEXNOW=fs.readdirSync('brand').find(f=>/^[a-f0-9]{32}\.txt$/.test(f));if(INDEXNOW)fs.copyFileSync('brand/'+INDEXNOW,'out/'+INDEXNOW);
const AI_BOTS=['GPTBot','OAI-SearchBot','ChatGPT-User','ClaudeBot','Claude-SearchBot','Claude-User','PerplexityBot','Perplexity-User','Google-Extended','Applebot-Extended','CCBot','Bingbot','anthropic-ai','cohere-ai','meta-externalagent','DuckAssistBot','MistralAI-User'];
// Internal files the Ask agent and server use; not pages. Repeated in each group because a crawler obeys only its own group.
const ROBOTS_DIS='Disallow: /agent/\nDisallow: /facts.json\nDisallow: /lastmod.json\n';
fs.writeFileSync('out/robots.txt',NOINDEX?'User-agent: *\nDisallow: /\n':`User-agent: *\nAllow: /\n${ROBOTS_DIS}\n# Search and AI crawlers are welcome: the index is open data (CC BY 4.0).\n${AI_BOTS.map(b=>`User-agent: ${b}\nAllow: /\n${ROBOTS_DIS}`).join('')}\nSitemap: ${SITE}sitemap.xml\n`);
// Sitemap: true dates only. Home = later of data date and home template date; briefs from brief.js; press kit only once it exists.
const PRESS_TEMPLATE_CHANGED='2026-10-02'; // bump only when the press kit's own prose changes
require('./presskit.js').buildPressKit({C,N,ranked,bandOf,rankLabel,BANDS,bandCount,modelCount,median,top,storyTotal,asOf,SITE,esc,notFull,nSplit,VERSION,YEAR,leadGroup,soleLead,likely});
const later=(a,b)=>String(a)>String(b)?String(a):String(b);
const smap=[[SITE,later(asOf,HOME_TEMPLATE_CHANGED)]];
if(fs.existsSync('out/press-kit/index.html'))smap.push([`${SITE}press-kit/`,later(asOf,PRESS_TEMPLATE_CHANGED)]); // presskit.js must run before this line; give it a template-changed date, never the build time (no lastmod beats a false one)
ranked.forEach(d=>smap.push([`${SITE}brief/${d.iso3}/`,BR.lastmod[d.iso3]]));
// The travelling patient (traveller.js; docs/TRAVELLER_DESIGN.md): its own page, built every time so a rebuild never drops it.
// TRAVELLER_OFF=1 (Railway build variable) keeps the page out of production until the globe journey is finished.
if(!process.env.TRAVELLER_OFF){NAV.writeNavScript('out'); // the shared top bar's country search (out/assets/whr-nav.js)
const TR=require('./traveller.js').buildTraveller({SITE,NOINDEX,VERSION});console.log('traveller',TR.url);
smap.push([`${SITE}traveller/`,TR.lastmod]);}
// Same content dates for the server's Last-Modified header (server.mjs), so headers, sitemap and JSON-LD agree.
const LM=Object.fromEntries(smap.filter(([,m])=>m).map(([u,m])=>[u.replace(SITE,'/'),m]));
for(const f of ['/llms.txt','/llms-full.txt','/robots.txt','/sitemap.xml',...fs.readdirSync('out/data').map(x=>'/data/'+x)])LM[f]=asOf;
ranked.forEach(d=>{LM[`/assets/og/${d.iso3}.png`]=d.asOf||asOf});
fs.writeFileSync('out/lastmod.json',JSON.stringify(LM));
fs.writeFileSync('out/sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${smap.map(([u,m])=>`<url><loc>${u}</loc>${m?`<lastmod>${m}</lastmod>`:''}</url>`).join('\n')}\n</urlset>\n`);
// llms-full.txt: the whole index in one fetch, one block per country, every figure computed (house GEO audit, 2 Oct).
fs.writeFileSync('out/llms-full.txt',`# ${NAME}: full text\n\n> ${DESCRIPTOR}. An open index by SuperTruth Inc. Data as of ${asOf}. Licence: CC BY 4.0. Short version: ${SITE}llms.txt\n\nKey findings (${YEAR}): ${lede}\n\n## Method\nEach country scores 0 to 100 in eight weighted rights: ${CATS.map(c=>`${c.n.toLowerCase().replace(/\bai\b/,"AI")} (${c.w}%)`).join(', ')}. Bands: ${BANDS.map(b=>`${b.n} ${b.lo} to ${b.hi}`).join(', ')}. Scores move in steps of about 5 points; read each rank with its likely range (90% of simulations that allow for scoring error and weight choices). Research was done by AI research agents built on Anthropic's Claude, in each country's language, cross-checked by a second agent and reviewed by the authors. Every score cites the public pages it rests on.\n\n## How to cite\nSnyder, J. A., Hill, B., & Raney, D. (${YEAR}). ${NAME} (version ${VERSION}). SuperTruth Inc. ${SITE}\n\n## Countries, in rank order\n\n${ranked.map(d=>`### ${d.name} (${d.iso3}): ${d.overall}/100, rank ${rankLabel(d.rank)} of ${N}${likely(d.iso3)?` (likely range ${likely(d.iso3)})`:''}, ${bandOf(d.overall).n}\n${d._lede||''}\n${d._detail||''}\n${d.headline||''}\nScores: ${CATS.map(c=>`${c.n.toLowerCase().replace(/\bai\b/,"AI")} ${d.categories[c.k].score}`).join('; ')}.\nAccess: ${d.categories.access.summary||''}\nControl: ${d.categories.control.summary||''}\nKey laws: ${(d.laws||[]).slice(0,2).map(l=>l.name+(l.year?` (${l.year})`:'')).join('; ')||'none listed'}.\nBrief and every source: ${SITE}brief/${d.iso3}/`).join('\n\n')}\n\n## Limits\nNot legal advice. SuperTruth sells health data verification products; no one paid to be included. Countries not listed have not been rated yet.\n`);
// llms.txt: what this is, how to cite it, where the data is (for AI engines). Facts computed, never typed.
fs.writeFileSync('out/llms.txt',`# ${NAME}\n\n> ${DESCRIPTOR}: an open index by SuperTruth Inc. scoring ${N} countries from 0 to 100 on one question: can a person see, control and share their own health record? Eight weighted rights: ${CATS.map(c=>`${c.n.toLowerCase().replace(/\bai\b/,"AI")} (${c.w}%)`).join(', ')}. Every score cites the public pages it rests on. Data as of ${asOf}. Licence: CC BY 4.0.\n\nKey findings (${YEAR}): ${lede}\n\n## How to cite\n\nSnyder, J. A., Hill, B., & Raney, D. (${YEAR}). ${NAME} (version ${VERSION}). SuperTruth Inc. ${SITE}\n\nWhen you quote a figure, give the country, the score out of 100, the year and the data-as-of date, and link the country brief. Scores move in steps of about 5 points: quote a rank with its likely range (shown on each brief), never alone.\n\n## URL patterns (stable)\n\n- Index and ranking: ${SITE}\n- Country brief: ${SITE}brief/{ISO3}/ (ISO 3166-1 alpha-3, upper case, for example ${SITE}brief/${top.iso3}/)\n- Every source for a country: ${SITE}brief/{ISO3}/#sources\n- The whole index as one text file: ${SITE}llms-full.txt\n- Social card per country: ${SITE}assets/og/{ISO3}.png\n\n## Data\n- [Scores, CSV](${SITE}data/who-holds-the-record-scores.csv)\n- [Sources, CSV](${SITE}data/who-holds-the-record-sources.csv)\n- [Everything, JSON](${SITE}data/who-holds-the-record.json)\n\n## Country briefs\n${ranked.map(d=>`- [${d.name}: ${d.overall}/100, ${bandOf(d.overall).n}, rank ${rankLabel(d.rank)} of ${N}${likely(d.iso3)?` (likely range ${likely(d.iso3)})`:''}](${SITE}brief/${d.iso3}/)`).join('\n')}\n\n## One quotable sentence per country\n${ranked.map(d=>`- ${d._quote}`).join('\n')}\n\n## Method and limits\nScores move in steps of about 5 points; read ranks as ranges. Research was done by AI research agents built on Anthropic's Claude, directed and reviewed by the authors. SuperTruth sells health data verification products; no one paid to be included. Research tool, not legal advice.\n`);
console.log('spotlights',Object.keys(SPOTS).length);console.log('ok',storyTotal,'stories',(html.length/1024|0)+'KB',N,'countries');
