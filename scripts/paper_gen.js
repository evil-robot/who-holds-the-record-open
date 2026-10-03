// Splices computed numbers into paper/paper.md between <!-- GEN:key --> and <!-- /GEN:key --> markers.
// Every figure in the paper comes from out/facts.json (written by build.js) or stories/*.json. Run: node build.js && node scripts/paper_gen.js
const fs=require('fs');
// Hash gate (DECISION_RULES.md): every analysis output records the SHA-256 of the data/ files it was computed on.
// A number is spliced only from an output computed on the current data/. PAPER_GEN_DRYRUN=1 runs the gates and writes nothing.
const {dataSha256}=require('./datahash.js');const DATA_SHA=dataSha256(process.cwd());const DRY=!!process.env.PAPER_GEN_DRYRUN;
const gate=(name,h)=>{if(h!==DATA_SHA)throw new Error(`STALE: ${name} was computed on data ${String(h||'(no hash)').slice(0,12)}, current data/ is ${DATA_SHA.slice(0,12)}; rerun its script (DECISION_RULES.md)`)};
const F=JSON.parse(fs.readFileSync('out/facts.json','utf8'));gate('out/facts.json (node build.js)',F.dataSha256);
const CATS=[['access','Patient access to the full record',20],['control','Patient control and consent',20],['privacy','Privacy and security',15],['journey','Connected care journey',15],['commercial','Protection from commercial use',10],['clinical','Clinician access at the point of care',10],['research','Research and trial consent',5],['ai','Clinical AI governance',5]];
const THEMES={access_refused:'Access refused',access_delay_or_cost:'Access delayed or charged',record_wrong:'Record wrong',breach:'Breach',sold_or_shared:'Sold or shared without consent',lost_between_providers:'Lost between providers',other:'Other'};
const TYPES={regulator_decision:'Regulator or ombudsman decision',court_judgment:'Court or tribunal judgment',parliament_testimony:'Parliamentary record',journalism:'News report',advocacy_case:'Advocacy organisation case',own_blog:'Personal blog, written consent'};
const stories=[];const searched={};
for(const f of fs.readdirSync('stories').filter(f=>f.endsWith('.json'))){const s=JSON.parse(fs.readFileSync('stories/'+f));searched[s.iso3]=s.searched||{};(s.stories||[]).filter(x=>!x.removed).forEach(x=>stories.push(x))}
const count=(xs,k)=>xs.reduce((m,x)=>(m[x[k]]=(m[x[k]]||0)+1,m),{});
const regions={};F.ranked.forEach(d=>{});
const data={};for(const f of fs.readdirSync('data').filter(f=>f.endsWith('.json'))){const d=JSON.parse(fs.readFileSync('data/'+f));data[d.iso3]=d}
F.ranked.forEach(d=>d.region=data[d.iso3].region);

const G={};
G.n=String(F.N);
G.categories=['| Category | Weight | Min | Q1 | Median | Q3 | Max |','|---|---:|---:|---:|---:|---:|---:|',
 ...CATS.map(([k,n,w])=>{const d=F.dist[k];return `| ${n} | ${w}% | ${d.min} | ${d.q1} | ${d.med} | ${d.q3} | ${d.max} |`})].join('\n');
const reg={};F.ranked.forEach(d=>{(reg[d.region]=reg[d.region]||[]).push(d.overall)});
G.regions=['| Region | Countries | Mean overall | Range |','|---|---:|---:|---|',...Object.entries(reg).sort((a,b)=>b[1].reduce((s,x)=>s+x,0)/b[1].length-a[1].reduce((s,x)=>s+x,0)/a[1].length).map(([r,xs])=>`| ${r} | ${xs.length} | ${Math.round(xs.reduce((s,x)=>s+x,0)/xs.length)} | ${Math.min(...xs)} to ${Math.max(...xs)} |`)].join('\n');
G.bands=`${F.bandCount.Strong} Strong, ${F.bandCount.Mixed} Mixed and ${F.bandCount.Weak} Weak; ${F.bandCount.Leading} Leading and ${F.bandCount.Poor} Poor`;
G.models=`${F.modelCount.Shared} Shared, ${F.modelCount.Institutional} Institutional and ${F.modelCount.State} State; ${F.modelCount.Individual} Individual`;
G.top=`${F.top.name} (${F.top.score})`;G.median=String(F.median);
{const lo=F.ranked.at(-1).overall,xs=F.ranked.filter(d=>d.overall===lo).map(d=>d.name).sort();G.bottom=xs.length>1?`${xs.slice(0,-1).join(', ')} and ${xs.at(-1)} (${lo}) share last place`:`${xs[0]} (${lo}) is last`;}
{const hi=F.ranked[0].overall,xs=F.ranked.filter(d=>d.overall===hi).map(d=>d.name).sort();if(xs.length>1)G.top=`${xs.slice(0,-1).join(', ')} and ${xs.at(-1)} (${hi}, tied)`;}
G.sources=`${F.sources} cited sources (${F.undated} undated)`;
G.lowconf=F.lowConf.map(i=>data[i].name).sort().join(', ');
G.storytotal=String(stories.length);
const withStories=new Set(stories.map(s=>s.iso3)).size;G.storycountries=String(withStories);
const tc=count(stories,'theme');// STORIES_RULES: no cell under 5. Hiding one small cell is not enough when the total is printed (it can be subtracted
// back), so small cells are merged: into "Other" when they add up to 5 or more, else into the smallest row shown.
const noSmall=(entries,label)=>{const big=entries.filter(([,v])=>v>=5).map(([k,v])=>[label(k),v]),small=entries.filter(([,v])=>v<5);
 if(small.length){const sum=small.reduce((a,[,v])=>a+v,0),names=small.map(([k])=>label(k).toLowerCase());
  if(sum>=5)big.push([small.length>1?'Other ('+names.join(', ')+')':label(small[0][0]),sum]);
  else{big.sort((a,b)=>a[1]-b[1]);big[0]=[big[0][0]+' or '+names.join(' or '),big[0][1]+sum];}}
 return big.sort((a,b)=>b[1]-a[1]).map(([k,v])=>`| ${k} | ${v} |`);};
G.themes=['| Theme | Stories |','|---|---:|',...noSmall(Object.entries(tc),k=>THEMES[k]||k)].join('\n');
const ty=count(stories,'sourceType');G.types=['| Source type | Stories |','|---|---:|',...noSmall(Object.entries(ty),k=>TYPES[k]||k)].join('\n');
const rc={};stories.forEach(s=>{const r=data[s.iso3].region;rc[r]=(rc[r]||0)+1});
G.storyregions=['| Region | Stories |','|---|---:|',...noSmall(Object.entries(rc),k=>k)].join('\n');
const st=count(stories,'status');G.status=`${st.finding||0} rest on a regulator, court or ombudsman finding, ${st.admitted||0} on the organisation's own admission, and ${(st.alleged||0)+(st.self_reported||0)} on an account not yet tested`;
const langs=new Set(Object.values(searched).flatMap(s=>s.languages||[]));G.languages=String(langs.size);
const dates=stories.map(s=>s.date).sort();G.storywindow=dates.length?`${dates[0]} to ${dates.at(-1)}`:'n/a';
G.asof=F.asOf;G.version=F.version;

// ---- added 2 Oct 2026: every figure below is computed from repository files, never typed ----
const LD2=iso=>{const [y,m,d]=iso.split('-').map(Number);return `${d} ${['January','February','March','April','May','June','July','August','September','October','November','December'][m-1]} ${y}`};
const jAnd=xs=>xs.length<2?xs.join(''):xs.slice(0,-1).join(', ')+' and '+xs.at(-1);
const NAME=i=>data[i].name;
// country waves: the 21 wave-1 codes are the scope line of analysis/wave1_check.md; Albania was added 2 Oct 2026; the rest are the original set
// country waves: analysis/waves.json (derived from git); every country in data/ is in exactly one wave
const WV=JSON.parse(fs.readFileSync('analysis/waves.json','utf8'));const WALL=['original','wave1','albania','wave2','wave3','observers','greenland_kosovo'].flatMap(k=>WV[k].countries);
if(WALL.length!==Object.keys(data).length||new Set(WALL).size!==WALL.length||WALL.some(i=>!data[i]))throw new Error('analysis/waves.json does not match data/');
const ORIG=WV.original.countries,WAVE1=WV.wave1.countries,LATE=WV.albania.countries;
G.norig=String(ORIG.length);G.nwave1=String(WAVE1.length);G.nlate=String(LATE.length);G.latenames=jAnd(LATE.map(NAME));
G.nwave2=String(WV.wave2.countries.length);G.nwave3=String(WV.wave3.countries.length);G.observernames=jAnd(WV.observers.countries.map(NAME).sort());G.grlxkxnames=jAnd(WV.greenland_kosovo.countries.map(NAME).sort());
// coverage against the 193 UN member states (list typed once in scripts/un193.js; checked against data/)
const UN193=require('./un193.js');
if(UN193.length!==193)throw new Error('UN list must have 193 members');
const unIn=UN193.filter(i=>data[i]).length,extra=Object.keys(data).filter(i=>!UN193.includes(i)).map(NAME).sort();
G.uncoverage=unIn===193?`all 193 UN member states, plus ${jAnd(extra)}`:`${unIn} of the 193 UN member states, plus ${jAnd(extra)}`;
const EU27='AUT BEL BGR HRV CYP CZE DNK EST FIN FRA DEU GRC HUN IRL ITA LVA LTU LUX MLT NLD POL PRT ROU SVK SVN ESP SWE'.split(' ');
if(EU27.length!==27||EU27.some(i=>!data[i]))throw new Error('not all 27 EU member states are in data/');
const regN={};Object.values(data).forEach(d=>regN[d.region]=(regN[d.region]||0)+1);G.nregions=String(Object.keys(regN).length);
const asofs=Object.values(data).map(d=>d.asOf).sort();G.asofrange=`${asofs[0]} to ${asofs.at(-1)}`;
G.lowconfn=String(F.lowConf.length);
const cells=F.ranked.flatMap(d=>Object.values(d.cats));G.fivepct=`${cells.filter(x=>x%5===0).length} of ${cells.length} category scores (${Math.round(100*cells.filter(x=>x%5===0).length/cells.length)}%)`;
// Section 4.3, from Table 1
const CN=Object.fromEntries(CATS.map(([k,n])=>[k,n.charAt(0).toLowerCase()+n.slice(1)]));
const by=f=>{const v=CATS.map(([k])=>[k,f(F.dist[k])]);const hi=Math.max(...v.map(x=>x[1])),lo=Math.min(...v.map(x=>x[1]));return {hi,lo,top:v.filter(x=>x[1]===hi).map(x=>CN[x[0]]),bot:v.filter(x=>x[1]===lo).map(x=>CN[x[0]])}};
const med=by(d=>d.med),iqr=by(d=>d.q3-d.q1);
G.catmedians=`The highest median is ${jAnd(med.top)} (${med.hi}); the lowest is ${jAnd(med.bot)} (${med.lo})`;
G.catspread=`The widest spread between the first and third quartiles is in ${jAnd(iqr.top)} (${iqr.hi} points); the narrowest is in ${jAnd(iqr.bot)} (${iqr.lo})`;
const pear=(a,b)=>{const n=a.length,ma=a.reduce((s,x)=>s+x,0)/n,mb=b.reduce((s,x)=>s+x,0)/n;let sab=0,saa=0,sbb=0;for(let i=0;i<n;i++){sab+=(a[i]-ma)*(b[i]-mb);saa+=(a[i]-ma)**2;sbb+=(b[i]-mb)**2}return sab/Math.sqrt(saa*sbb)};
G.journeyclinical=`r = ${pear(F.ranked.map(d=>d.cats.journey),F.ranked.map(d=>d.cats.clinical)).toFixed(2)} across ${F.N} countries`;
// links, from the last HTTP check of every cited URL
gate('analysis/url_check.csv (url_check.py, url_recheck.py)',JSON.parse(fs.readFileSync('analysis/url_check.meta.json','utf8')).dataSha256);
const csv=fs.readFileSync('analysis/url_check.csv','utf8').trim().split(/\r?\n/);const hdr=csv[0].split(',');const fo=hdr.indexOf('final_outcome');
if(fo!==hdr.length-1)throw new Error('final_outcome must be the last url_check.csv column');
const oc=count(csv.slice(1).map(l=>({o:l.split(',').at(-1).trim()})),'o');
{const KNOWN=['ok','dead','blocked_unverified','error','server_error','redirect_to_homepage'];const bad=Object.keys(oc).filter(k=>!KNOWN.includes(k)&&!k.startsWith('other_'));
 if(bad.length)throw new Error('url_check.csv has outcomes paper_gen.js does not name: '+bad.join(', '));
 const opened=oc.ok||0,dead=oc.dead||0,blocked=oc.blocked_unverified||0,unreach=Object.entries(oc).filter(([k])=>!['ok','dead','blocked_unverified'].includes(k)).reduce((a,[,v])=>a+v,0);
 if(opened+dead+blocked+unreach!==csv.length-1)throw new Error('link outcome parts do not sum to the rows checked');  // REVIEW2_methods m3: 2 server_error rows were dropped
 G.links=`${csv.length-1} cited links checked: ${opened} opened, ${dead} dead (HTTP 404 or 410), ${blocked} blocked by bot protection and ${unreach} unreachable, unresolved or answering with a server error`;
 G.linksnoconn=String(oc.error||0);}
// the link check must cover exactly the links cited in data/ (DECISION_RULES.md rule 1): a check cannot be restamped onto changed links
{const pq=l=>{const o=[];let c='',q=false;for(const ch of l){if(ch==='"')q=!q;else if(ch===','&&!q){o.push(c);c=''}else c+=ch}o.push(c);return o};
 const ui=hdr.indexOf('url'),fi=hdr.indexOf('field'),ii=hdr.indexOf('iso3');const have=new Set(csv.slice(1).map(l=>{const c=pq(l);return `${c[ii]} ${c[fi]} ${c[ui]}`}));
 const want=new Set();Object.values(data).forEach(d=>{Object.entries(d.categories).forEach(([k,c])=>(c.sources||[]).forEach((x,i)=>want.add(`${d.iso3} categories.${k}.sources[${i}] ${x.url}`)));(d.laws||[]).forEach((x,i)=>want.add(`${d.iso3} laws[${i}] ${x.url}`));(d.news||[]).forEach((x,i)=>want.add(`${d.iso3} news[${i}] ${x.url}`))});
 const miss=[...want].filter(x=>!have.has(x)),extra=[...have].filter(x=>!want.has(x));
 if(miss.length||extra.length)throw new Error(`STALE: analysis/url_check.csv does not match the links in data/ (${miss.length} missing, ${extra.length} extra); rerun analysis/url_check.py`);}
// score changes of 1 Oct 2026, parsed from docs/SCORE_CHANGES.md (generated there from a before/after diff of data/)
const SCD=fs.readFileSync('docs/SCORE_CHANGES.md','utf8');
const sect=h=>SCD.split('\n## ').find(x=>x.startsWith(h)).split('\n').filter(l=>/^\| [A-Z]/.test(l)&&!/^\| Country \|/.test(l));
const chg=sect('Every score change').map(l=>{const c=l.split('|').map(x=>x.trim());const [o,n]=c[3].split('->').map(Number);return {who:c[1].replace(/ \([A-Z]{3}\)/,''),iso:c[1].match(/\(([A-Z]{3})\)/)[1],cat:c[2].split('.')[1],o,n,d:n-o}});
const cfc=sect('Confidence changes');
G.changes=`${chg.length} category scores changed in ${new Set(chg.map(c=>c.iso)).size} countries, and ${cfc.length} confidence labels changed`;
const CATN=Object.fromEntries(CATS.map(([k,n])=>[k,n.charAt(0).toLowerCase()+n.slice(1)]));
const bigC=[...chg].sort((a,b)=>Math.abs(b.d)-Math.abs(a.d)||a.who.localeCompare(b.who)).filter((c,i,xs)=>Math.abs(c.d)>=Math.abs(xs[Math.min(4,xs.length-1)].d));
G.bigchanges=jAnd(bigC.map(c=>`${c.who} ${c.cat==='ai'?'clinical AI':c.cat} ${c.o} to ${c.n}`));
G.changesup=String(chg.filter(c=>c.d>0).length);G.changesdown=String(chg.filter(c=>c.d<0).length);
// DTI evidence grade (analysis/dti/dti_evidence.json)
const DTI=JSON.parse(fs.readFileSync('analysis/dti/dti_evidence.json','utf8'));gate('analysis/dti/dti_evidence.json (scripts/dti_evidence.py)',DTI.meta.dataSha256);const DC=DTI.countries;
const pub=Object.entries(DC).filter(([,v])=>!v.provisional);const prov=Object.entries(DC).filter(([,v])=>v.provisional).map(([k])=>NAME(k));
const tc2=count(pub.map(([,v])=>v),'tier');const TORD=['Platinum','Gold','Silver','Bronze','Below Bronze'];
G.dtitiers=TORD.filter(t=>tc2[t]).map(t=>`${tc2[t]} ${t}`).join(', ')+` (${pub.length} countries with a published grade)`;
G.dtirange=`${Math.min(...pub.map(([,v])=>v.dti))} to ${Math.max(...pub.map(([,v])=>v.dti))}`;
G.dtiprov=prov.length?`${jAnd(prov)} ${prov.length>1?'are':'is'} provisional and ${prov.length>1?'have':'has'} no published grade`:'No country is provisional';
const dcell=Object.values(DC).flatMap(v=>Object.values(v.cells));const ct=count(dcell,'tier');
G.dticells=`${dcell.length} cells: `+TORD.filter(t=>ct[t]).map(t=>`${ct[t]} ${t}`).join(', ');
G.dticapped=`${dcell.filter(c=>c.tierCapped).length} cells and ${Object.values(DC).filter(v=>v.tierCapped).length} countries`;
G.dtilinks=`${DTI.meta.uncheckedLinks}`;
// Strain and split (analysis/strain/strain.json)
const ST=JSON.parse(fs.readFileSync('analysis/strain/strain.json','utf8'));gate('analysis/strain/strain.json (build_strain.py)',ST.meta.dataSha256);const SC=ST.countries;const SV=Object.values(SC);
if(ST.meta.changesScores!==false)throw new Error('strain.json must declare changesScores:false');
const have=k=>SV.filter(s=>(s.indicators[k]||{}).value!=null).length;
G.strainn=String(SV.length);
G.strainwait=`${SV.filter(s=>['hip','knee'].some(j=>(s.indicators['waitMedianDays_'+j]||{}).value!=null)).length} of ${SV.length}`;
const rs=count(SV.map(s=>({c:(s.recordSplit||{}).class||'unknown'})),'c');const known=SV.length-(rs.unknown||0);
G.strainsplitknown=`${known} of ${SV.length}`;
G.strainnotfull=`${(rs.split||0)+(rs.partial||0)} of the ${known}`;
G.strainclasses=`${rs.connected||0} connected, ${rs.partial||0} partial, ${rs.split||0} split and ${rs.unknown||0} unknown`;
const bs=count(SV.map(s=>({b:(s.recordSplit||{}).basis||'none'})),'b');
G.strainbasis=`${bs.file||0} from our country files alone, ${bs.research||0} from the outside research alone and ${bs.both||0} from both, in agreement`;
G.straincover=`doctors ${have('doctorsPer10k')}, nurses and midwives ${have('nursesMidwivesPer10k')}, private insurance plus out-of-pocket spending ${have('vhiPlusOopShareCHE')}, duplicate private insurance ${have('duplicateVhiPopulationPct')}, median hip and knee waits ${have('waitMedianDays_hip')}`;
const cu=ST.meta.cutoffs;G.straincutoffs=`${cu.doctorsPer10k_Q1} doctors or ${cu.nursesMidwivesPer10k_Q1} nurses and midwives per 10,000 (lower quartiles of the ${cu.n.doctorsPer10k} and ${cu.n.nursesMidwivesPer10k} ${cu.reference||'countries'} with a value), and ${cu.vhiPlusOopShareCHE_Q3}% of current health spending (upper quartile of ${cu.n.vhiPlusOopShareCHE})`;
const fl=(k,w='measured')=>{const v=SV.map(s=>s.flags[k]);return `${v.filter(x=>x!=null).length} ${w}, ${v.filter(x=>x===true).length} true`};
G.strainflags=`staffing ${fl('workforceLow')}; private spending ${fl('privateSpendHigh')}; waits ${fl('longWaits')}; record split ${fl('recordSplit','known')}`;
const three=Object.entries(SC).filter(([,s])=>(s.flagCount||{}).true>=3).map(([k])=>NAME(k)).sort();G.strainthree=three.length?jAnd(three):'No country';
{const th=Object.entries(SC).filter(([,s])=>(s.flagCount||{}).true>=3);G.strainthreeverb=th.length===1?'carries':'carry';
 const noWait=th.filter(([,s])=>s.flags.longWaits==null).length;
 G.strainthreefourth=th.length===0?'no country carries three':noWait===th.length?`in ${th.length===1?'it':th.length===2?'both':'all of them'}, the flag not counted is waits, which are not reported`:`waits are not reported for ${noWait} of the ${th.length}`;
 const cf=SC.CAN.flags,cu2=ST.meta.cutoffs,ci=SC.CAN.indicators,parts=[];
 if(cf.doctorsLow)parts.push(`its doctor count (${ci.doctorsPer10k.value} per 10,000) is below the OECD lower quartile (${cu2.doctorsPer10k_Q1})`);
 if(cf.nursesLow)parts.push(`its nurse and midwife count (${ci.nursesMidwivesPer10k.value} per 10,000) is below the OECD lower quartile (${cu2.nursesMidwivesPer10k_Q1})`);
 if(cf.longWaits)parts.push('its median hip and knee waits exceed 90 days');
 if(cf.privateSpendHigh)parts.push('private spending is above the OECD upper quartile');
 G.straincanadaflags=`Canada carries ${(SC.CAN.flagCount||{}).true} of the four flags: ${jAnd(parts)}.`;}
const yrs=SV.flatMap(s=>Object.values(s.indicators)).filter(x=>x&&x.value!=null&&x.year).map(x=>x.year);
G.strainyears=`${Math.min(...yrs)} to ${Math.max(...yrs)}`;G.strainretrieved=ST.meta.built;G.ghedyear=String(ST.meta.ghedLastFinalYear);
const CA=SC.CAN,CI=CA.indicators,rk=x=>String(x.oecdPeerRank||'').split(' (')[0];
G.straincanada=`Canada has ${CI.doctorsPer10k.value} doctors per 10,000 (WHO, ${CI.doctorsPer10k.year}), ${rk(CI.doctorsPer10k)} OECD members (1 = most), and ${CI.nursesMidwivesPer10k.value} nurses and midwives (${rk(CI.nursesMidwivesPer10k)}). Its median waits from specialist assessment to treatment are ${CI.waitMedianDays_hip.value} days for a hip and ${CI.waitMedianDays_knee.value} for a knee (OECD, ${CI.waitMedianDays_knee.year}), ${rk(CI.waitMedianDays_hip)} and ${rk(CI.waitMedianDays_knee)} reporting members (1 = longest). Voluntary insurance pays ${CI.vhiShareCHE.value}% of health spending (${CI.vhiShareCHE.year}), ${rk(CI.vhiShareCHE)} OECD members with a value, and ${CI.vhiPopulationPct.value}% of people hold it (${CI.vhiPopulationPct.year}${CI.vhiPopulationPct.obsStatus==='P'?', provisional':''}); OECD reports ${CI.duplicateVhiPopulationPct.value==null?'no figure':CI.duplicateVhiPopulationPct.value+'%'} for duplicate cover. The record-split class is ${CA.recordSplit.class}: ${CA.recordSplit.research?CA.recordSplit.research.source:'our country file'} states "${CA.recordSplit.quote}" Canada carries ${CA.flagCount.true} of 4 flags${CA.flagCount.unknown?`, with ${CA.flagCount.unknown} unknown`:", and all four were measured"}`;
// X (Twitter) counts (analysis/x_counts/x_counts.json)
const X=JSON.parse(fs.readFileSync('analysis/x_counts/x_counts.json','utf8'));const XC=Object.entries(X.countries);
const xu=XC.filter(([,v])=>v.usable).map(([k])=>NAME(k)).sort();
G.xgate=`${xu.length} of ${XC.length}`;G.xusable=jAnd(xu);G.xnotcovered=String(F.N-XC.length);G.xwindow=`${X.window.start} to ${X.window.end}`;
// external indices (analysis/external/external_corr.json, written by analysis/external_corr.py)
const EX=JSON.parse(fs.readFileSync('analysis/external/external_corr.json','utf8'));gate('analysis/external/external_corr.json (analysis/external_corr.py)',EX.dataSha256);
const exr=n=>{const r=EX.rows.find(r=>r.name===n);if(!r)throw new Error('no external row '+n);return r};
const sg=x=>(x>=0?'+':'')+x.toFixed(2);
const EXT=[['EC eHealth composite 2024','European Commission Digital Decade eHealth indicator (2024) [1]','Access'],['OECD tech/operational readiness 2021','OECD EHR technical and operational readiness (2021) [2]','Journey'],['OECD eHR governance for analytics 2021','OECD EHR governance for analytics (2021) [2]','Research'],['Bertelsmann DHI composite 2018','Bertelsmann #SmartHealthSystems (2018) [3]','Overall'],['GDHM 2023 overall phase, full responders','WHO Global Digital Health Monitor, overall (2023) [4]','Overall'],['GDHM 2023 Q15 HIE/architecture phase, full responders','WHO Global Digital Health Monitor, exchange architecture (2023) [4]','Journey'],['GDHM 2023 Q09a AI protocol phase, full responders','WHO Global Digital Health Monitor, AI protocol (2023) [4]','AI'],['GDHM 2023 Q08 privacy law phase, full responders','WHO Global Digital Health Monitor, privacy laws (2023) [4]','Privacy']];
G.external=['| External measure (data year) | Our category | n | rho | 95% interval |','|---|---|---:|---:|---|',...EXT.map(([k,l,c])=>{const r=exr(k);return `| ${l} | ${c} | ${r.n} | ${sg(r.rho)} | ${sg(r.lo)} to ${sg(r.hi)} |`}),`| Eurostat, people who accessed personal health records online (${EX.eurostat.year}) [30] | Access | ${EX.eurostat.n} | ${sg(EX.eurostat.rhoAccess)} | ${sg(EX.eurostat.lo)} to ${sg(EX.eurostat.hi)} |`,`| GDP per head, PPP (World Bank, ${EX.income.overallVsGdp.years}) [31] | Overall | ${EX.income.overallVsGdp.n} | ${sg(EX.income.overallVsGdp.rho)} | ${sg(EX.income.overallVsGdp.lo)} to ${sg(EX.income.overallVsGdp.hi)} |`].join('\n');
const ecm=exr('EC eHealth composite 2024, minus BEL ESP IRL (cite it)');G.extnocite=`${sg(ecm.rho)} (n ${ecm.n})`;
G.extgdhmn=String(exr('GDHM 2023 overall phase, full responders').n);G.extcomputed=EX.computed;
G.extpos=EXT.every(([k])=>exr(k).rho>0)?'Every correlation is positive':'Not every correlation is positive';
G.extclear=(xs=>xs.length<2?xs.join(''):xs.slice(0,-1).join('; ')+'; and '+xs.at(-1))([...EXT.filter(([k])=>exr(k).lo>0||exr(k).hi<0).map(([,l])=>l.replace(/ \[\d\]$/,'')),...(EX.eurostat.lo>0?[`Eurostat online record use (${EX.eurostat.year})`]:[]),...(EX.income.overallVsGdp.lo>0?['GDP per head']:[])])||'none';
{const all=EXT.length+2,cl=EXT.filter(([k])=>exr(k).lo>0||exr(k).hi<0).length+(EX.eurostat.lo>0)+(EX.income.overallVsGdp.lo>0);G.extclearn=`${cl} of the ${all}`;}
{const r=exr('GDHM 2023 Q08 privacy law phase, all with a value');G.extgdhmall=`${sg(r.rho)} (95% interval ${sg(r.lo)} to ${sg(r.hi)}, n ${r.n})`;}
G.storyreviewers=String(new Set(stories.map(s=>s.reviewedBy)).size);
// every category cell, for prose that cites one: <!-- GEN:cell_USA_access -->
F.ranked.forEach(d=>Object.entries(d.cats).forEach(([k,v])=>G[`cell_${d.iso3}_${k}`]=String(v)));
// rank and band moves of 1 Oct 2026 (docs/SCORE_CHANGES.md, "Ranking after the changes")
const rkm=sect('Ranking after the changes').map(l=>{const c=l.split('|').map(x=>x.trim());return {who:c[1].replace(/ \([A-Z]{3}\)/,''),move:Number(c[5]),band:c[6]}});
const bandm=rkm.filter(r=>r.band.includes('->'));
G.bandmoves=jAnd(bandm.map(r=>{const now=F.ranked.find(d=>d.name===r.who),to=r.band.split('->')[1].trim();if(!now)throw new Error('band move country not in data: '+r.who);const from=r.band.split('->')[0].trim();return `${r.who} (${r.band.replace('->',' to ')}${now.band!==to?`; ${now.band===from?`${now.band} again`:`now ${now.band}`} after the 2 October re-research`:''})`}));
const worst=Math.min(...rkm.map(r=>r.move));const best=Math.max(...rkm.map(r=>r.move));
G.rankmoves=`The largest fall was ${jAnd(rkm.filter(r=>r.move===worst).map(r=>r.who))} (${-worst} places); the largest rise was ${best} places (${jAnd(rkm.filter(r=>r.move===best).map(r=>r.who))})`;
const son=Object.values(searched).map(s=>s.on).filter(Boolean).sort();G.storysearched=son[0]===son.at(-1)?son[0]:`${son[0]} to ${son.at(-1)}`;
G.briefs=String(fs.readdirSync('out/brief').filter(f=>/^[A-Z]{3}$/.test(f)).length);
// ---- added 2 Oct 2026 (final revision): robustness, reliability, peer-review round, story languages, distinct URLs ----
// story languages actually found (the search list is G.languages)
G.storylangs=String(new Set(stories.map(s=>s.lang).filter(Boolean)).size);
// distinct cited URLs (quote-aware CSV read of the url column)
{const parse=l=>{const o=[];let c='',q=false;for(const ch of l){if(ch==='"')q=!q;else if(ch===','&&!q){o.push(c);c=''}else c+=ch}o.push(c);return o};const ui=hdr.indexOf('url');G.distincturls=String(new Set(csv.slice(1).map(l=>parse(l)[ui])).size);G.citations=String(csv.length-1);}
// 2 Oct peer-review round (docs/SCORE_CHANGES.md, "# 2 Oct: peer review round")
{const P=SCD.split('\n# 2 Oct: peer review round')[1];if(!P)throw new Error('no 2 Oct round in SCORE_CHANGES.md');
 const ps=h=>P.split('\n## ').find(x=>x.startsWith(h)).split('\n').filter(l=>/^\| [A-Z]/.test(l)&&!/^\| Country \|/.test(l));
 const sc=ps('Score changes'),cm=ps('controlModel'),cf=ps('Confidence (all 65');
 G.round2=`${sc.length} category scores changed in ${new Set(sc.map(l=>l.match(/\(([A-Z]{3})\)/)[1])).size} countries, ${cm.length} keys classes changed and ${cf.length} confidence labels changed`;
 G.round2keys=jAnd(cm.map(l=>{const c=l.split('|').map(x=>x.trim());return `${c[1].replace(/ \([A-Z]{3}\)/,'')} (${c[2].replace('->','to')})`}));}
// robustness (analysis/robustness/robustness.json); refuse to splice if it was run on other scores
const RB=JSON.parse(fs.readFileSync('analysis/robustness/robustness.json','utf8'));gate('analysis/robustness/robustness.json (robustness.py)',RB.meta.data.dataSha256);
F.ranked.forEach(d=>{if(RB.reference.overall[d.iso3]!==d.overall||String(RB.reference.rank[d.iso3])!==String(d.rank).replace('=',''))throw new Error(`robustness.json is stale for ${d.iso3}: rerun analysis/robustness/robustness.py`)});
const MAINK=RB.meta.main||'combined';const RC=RB.monteCarlo[MAINK],RS=RC.system,RP=RB.monteCarlo.noise5Shared.system,RU=RB.monteCarlo.noise5;
const r90=i=>{const [a,b]=RC.countries[i].rank90;return a===b?String(a):`${a} to ${b}`};
G.ranking=['| Rank | Rank range (90%) | Country | Region | Keys | Overall | Band | Confidence |','|---|---|---|---|---|---:|---|---|',
 ...F.ranked.map(d=>`| ${d.rank} | ${r90(d.iso3)} | ${d.name} | ${d.region} | ${d.model} | ${d.overall} | ${d.band} | ${d.confidence} |`)].join('\n');
const bc=RS.bandCount90,rg=([a,b])=>a===b?String(a):`${a} to ${b}`;
G.bandranges=`${F.bandCount.Strong} Strong (${rg(bc.Strong)} across draws), ${F.bandCount.Mixed} Mixed (${rg(bc.Mixed)}), ${F.bandCount.Weak} Weak (${rg(bc.Weak)})${F.bandCount.Poor?` and ${F.bandCount.Poor} Poor (${rg(bc.Poor)})`:''}`;
const pct=x=>(Math.floor(x*1000)/10).toFixed(1)+'%';
G.rbfinland=pct(RS.finlandFirstShare);G.rbfinlandpess=pct(RP.finlandFirstShare);
// lead group (DECISION_RULES.md rule 2): sole leader only if first in >=95% of main-model draws
{const lead=F.ranked.filter(d=>RC.countries[d.iso3].rank90[0]===1);const sole=lead.length===1&&RC.countries[lead[0].iso3].firstShare>=0.95;
 G.lead=sole?`${lead[0].name} (${lead[0].overall}) leads`:`${jAnd(lead.map(d=>`${d.name} (${d.overall})`))} have the highest scores; allowing for scoring error, each of them is first, alone or tied, in at least 5% of draws`;
 G.leadshares=jAnd(lead.map(d=>`${d.name} (${(RC.countries[d.iso3].firstShare*100).toFixed(2)}%)`));  // two decimals: a floored 5.0% read as under the 5% cut (Sweden, 5.09%)
G.leadn=String(lead.length);
 const mw=e=>{const w=Object.values(e.countries).map(c=>c.rank90[1]-c.rank90[0]).sort((a,b)=>a-b);return w[Math.floor(w.length/2)]};
 G.rbmainwidth=String(mw(RC));G.rblowerwidth=String(mw(RU));G.rbcellwidth=String(mw(RB.monteCarlo.calibratedCell));
 G.rbcellsd=String(RB.meta.calCellSd);G.rbshared=`${RB.meta.calShared[0]} points per category plus ${RB.meta.calShared[1]} points shared across a country`;
 const hold=Object.values(RC.countries).filter(c=>c.bandShare>=0.95).length;G.rbhold=`${hold} of ${F.N}`;}
G.rbmax=String(RS.maxScoreSeen>RP.maxScoreSeen?RS.maxScoreSeen:RP.maxScoreSeen);G.rbmin=String(Math.min(RS.minScoreSeen,RP.minScoreSeen));
G.rbmedian=rg(RS.medianScore90);
{const bn=x=>x>=85?'Leading':x>=65?'Strong':x>=45?'Mixed':x>=25?'Weak':'Poor';const [a,b]=RS.medianScore90;G.rbmedianline=bn(a)===bn(b)?`The median country stays ${bn(a)} (${rg(RS.medianScore90)})`:`The median country moves between ${bn(a)} and ${bn(b)} (${rg(RS.medianScore90)})`;}
const widths=Object.values(RC.countries).map(c=>c.rank90[1]-c.rank90[0]).sort((a,b)=>a-b);G.rbwidth=String(widths[Math.floor(widths.length/2)]);
const ALT=Object.values(RB.alternatives);G.rbrho=(Math.floor(Math.min(...ALT.map(a=>a.spearman))*100)/100).toFixed(2);
G.rbfirstall=ALT.every(a=>a.first.length===1&&a.first[0]===F.ranked[0].iso3)?`${F.ranked[0].name} is first in every rebuilt index`:'The first place changes in at least one rebuilt index';
const edge=F.ranked.filter(d=>RC.countries[d.iso3].bandShare<0.9);G.rbedgen=String(edge.length);
{const LINES=[24.5,44.5,64.5,84.5],dist=u=>Math.min(...LINES.map(L=>Math.abs(u-L))),ds=edge.map(d=>dist(RB.reference.unrounded[d.iso3]));const w2=ds.filter(x=>x<=2).length;
 G.rbedgewhy=`${w2} of them sit within two points of a band line on the unrounded score (a line falls at 24.5, 44.5, 64.5 and 84.5, where rounding changes the band), and the other ${edge.length-w2} between 2 and ${(Math.floor(Math.max(...ds)*10)/10).toFixed(1)} points from one`;}G.rbedge=edge.length<=15?'They are '+jAnd(edge.map(d=>`${d.name} (${(Math.round(RB.reference.unrounded[d.iso3]*10)/10).toFixed(1)})`)):`The full list, with unrounded scores, is in analysis/robustness/ROBUSTNESS.md`;
const fl2=x=>(Math.floor(x*100)/100).toFixed(2);G.rbgeo=fl2(RB.alternatives.geometric.spearman);G.rbequal=fl2(RB.alternatives.equal.spearman);G.rbequalmax=`${RB.alternatives.equal.maxRankShift} places (${jAnd(RB.alternatives.equal.maxShiftCountries.map(NAME))})`;
G.rbdropj=RB.alternatives.drop_journey.rankShiftRS.toFixed(1);G.rbdropc=RB.alternatives.drop_clinical.rankShiftRS.toFixed(1);G.rbdropctl=RB.alternatives.drop_control.rankShiftRS.toFixed(1);
G.rbseed=String(RB.meta.seed);G.rbdraws=RB.meta.draws.toLocaleString('en-GB');
// seed sensitivity of the lead group (analysis/robustness/seed_sweep.py); the published seed decides, this only reports the spread
{const SW=JSON.parse(fs.readFileSync('analysis/robustness/seed_sweep.json','utf8'));gate('analysis/robustness/seed_sweep.json (seed_sweep.py)',SW.meta.dataSha256);
 if(SW.meta.publishedSeed!==RB.meta.seed||SW.meta.draws!==RB.meta.draws)throw new Error('seed_sweep.json was not run against the published robustness settings');
 const p2=x=>(x*100).toFixed(2)+'%',sm=SW.summary,ins=Object.keys(sm).filter(k=>sm[k].inPublishedLead),outs=Object.keys(sm).filter(k=>!sm[k].inPublishedLead);
 ins.forEach(k=>{if(sm[k].published!==RC.countries[k].firstShare)throw new Error(`seed_sweep.json disagrees with robustness.json for ${k}`)});
 const close=ins.reduce((a,k)=>sm[k].published<sm[a].published?k:a),c=sm[close],o=c.otherSeeds,steady=ins.filter(k=>k!==close&&sm[k].otherSeeds.inLead===o.of),entered=outs.filter(k=>sm[k].otherSeeds.inLead>0);
 const top=outs.reduce((a,k)=>a===null||sm[k].otherSeeds.max>sm[a].otherSeeds.max?k:a,null);
 G.rbseeds=`${NAME(close)} is the closest call: it is first in ${Math.round(c.published*SW.meta.draws).toLocaleString('en-GB')} of ${SW.meta.draws.toLocaleString('en-GB')} draws (${p2(c.published)}), just over the 5% that puts first place inside its 90% rank range. Rerun with ${o.of} other seeds fixed in advance, its share runs from ${p2(o.min)} to ${p2(o.max)} (mean ${p2(o.mean)})`
  +(o.inLead===o.of?' and it stays in the group under every seed. ':`, and it would fall out of the group under ${o.of-o.inLead} of them. `)
  +`${jAnd(steady.map(NAME))} stay in under every seed, and `+(entered.length?`${jAnd(entered.map(NAME))} would join under at least one`:`no other country joins under any (the nearest, ${NAME(top)}, reaches ${p2(sm[top].otherSeeds.max)} at most)`)
  +`. The rule was set before these results and the published seed decides, so the group stands as published. With ${SW.meta.draws.toLocaleString('en-GB')} draws the simulation's own standard error near 5% is ${(SW.meta.mcStandardErrorAt5pct*100).toFixed(2)} percentage points, so ${NAME(close)}'s place in the group is within simulation noise and is reported as such`;}
// reliability (analysis/reliability/reliability.json); pre-registered, compared with the scores published on its run date
const RL=JSON.parse(fs.readFileSync('analysis/reliability/reliability.json','utf8'));const H=RL.headline,BA=H.bland_altman;
const f1=x=>x.toFixed(1),f2=x=>x.toFixed(2),pc=x=>String(Math.round(100*x));
G.relsample=String(RL.sample.cells);G.reln=String(H.n);G.relnull=String(RL.sample.cells-RL.sample.rated);
G.relmad=`${f1(H.mad)} points (95% CI ${f1(H.mad_ci[0])} to ${f1(H.mad_ci[1])})`;G.relmadshort=f1(H.mad);
G.relwithin10=pc(H.within10)+'%';G.relwithin5=pc(H.within5)+'%';G.relband=pc(1-H.band_exact)+'%';
G.relicc=`${f2(H.icc2_1)} (95% CI ${f2(H.icc2_1_ci[0])} to ${f2(H.icc2_1_ci[1])})`;G.reliccshort=f2(H.icc2_1);
G.relkappa=f2(H.qwk_bands);G.relbias=(BA.bias>=0?'+':'')+f1(BA.bias);G.relloa=`${f1(BA.loa[0])} to +${f1(BA.loa[1])}`;G.relloahalf=String(Math.round((BA.loa[1]-BA.loa[0])/2));
const SA=RL.exploratory_source_access;G.relunread=`${SA.urls_unreadable} of ${SA.urls_cited} (${Math.round(100*SA.urls_unreadable/SA.urls_cited)}%)`;G.relunreadpct=Math.round(100*SA.urls_unreadable/SA.urls_cited)+'%';
// blind re-score of the added countries (analysis/reliability2/reliability2.json); pre-registered (analysis/reliability2/PLAN.md),
// run once against the scores in data/ on its run date, so not hash-gated (DECISION_RULES rule 1 exception); its frame is checked against waves.json
{const R2=JSON.parse(fs.readFileSync('analysis/reliability2/reliability2.json','utf8')),S2=JSON.parse(fs.readFileSync('analysis/reliability2/sample.json','utf8'));
 const H2=R2.headline,B2=H2.bland_altman,A2=R2.by_category.access,C2=R2.study1_vs_study2,SN=JSON.parse(fs.readFileSync('analysis/reliability2/sensitivity.json','utf8')).c_missing_vs_null;
 const added=WALL.filter(i=>!ORIG.includes(i)&&!WAVE1.includes(i)&&!LATE.includes(i));
 if(S2.frame.countries!==added.length||S2.cells.length===0)throw new Error('reliability2 frame does not match the added countries in analysis/waves.json');
 if(R2.sample.cells!==S2.cells.length||R2.sample.rated!==H2.n||SN.cells_null_from_rater.length+SN.cells_missing_session_excluded.length+H2.n!==R2.sample.cells)throw new Error('reliability2 cell counts do not add up');
 const sg1=x=>(x>=0?'+':'')+f1(x),sg2=x=>(x>=0?'+':'')+f2(x),ci1=c=>`95% CI ${f1(c[0])} to ${f1(c[1])}`,ci2=c=>`95% CI ${f2(c[0])} to ${f2(c[1])}`;
 G.rel2framecells=S2.frame.cells.toLocaleString('en-GB');G.rel2sample=String(R2.sample.cells);G.rel2n=String(H2.n);
 G.rel2icc=`${f2(H2.icc2_1)} (${ci2(H2.icc2_1_ci)})`;G.rel2iccshort=f2(H2.icc2_1);
 G.rel2mad=`${f1(H2.mad)} points (${ci1(H2.mad_ci)})`;G.rel2within10=pc(H2.within10)+'%';
 G.rel2bias=`${sg1(B2.bias)} points, ${ci1(B2.bias_ci)}`;G.rel2loa=`${f1(B2.loa[0])} to +${f1(B2.loa[1])}`;
 G.rel2iccdiff=`${sg2(C2.diff_study2_minus_study1.icc2_1)} (95% CI of the difference ${sg2(C2.bootstrap_95ci.icc2_1[0])} to ${sg2(C2.bootstrap_95ci.icc2_1[1])})`;
 G.rel2cellsd=`${f1(C2.study2_cell_sd)} points against ${f1(C2.study1_cell_sd)} in the first study`;
 G.rel2errorrule=R2.decisions.added_countries_need_own_cell_sd?'so the added countries need their own, larger error term':'so under the pre-registered rule the added countries keep the same error term';
 G.rel2access=`${f2(A2.icc2_1)} (${ci2(A2.icc2_1_ci)}, n ${A2.n})`;G.rel2accessshort=f2(A2.icc2_1);G.rel2accessbias=`${f1(Math.abs(A2.bias))} points ${A2.bias<0?'lower':'higher'} on average (${ci1(A2.bias_ci)})`;
 G.rel2slope=`${H2.rater_sd.toFixed(1)} against ${H2.published_sd.toFixed(1)}; the slope of the difference on the pair mean is ${sg2(B2.proportional_bias_slope)}, p ${B2.proportional_bias_p<0.001?'< 0.001':'= '+B2.proportional_bias_p.toFixed(3)}`;
 G.rel2null=String(SN.cells_null_from_rater.length);G.rel2missing=String(SN.cells_missing_session_excluded.length);G.rel2unscored=String(R2.sample.cells-H2.n);
 G.rel2excluded=String(R2.excluded_sessions.length);G.rel2flag=String(R2.flagged_for_editors_abs_diff_ge_15.length);
 const SA2=R2.source_access;G.rel2unread=`${SA2.urls_unreadable} of ${SA2.urls_cited} (${Math.round(100*SA2.urls_unreadable/SA2.urls_cited)}%)`;}
{const dup=SV.map((s,i)=>[Object.keys(SC)[i],(s.indicators.duplicateVhiPopulationPct||{}).value]).filter(([,v])=>v!=null&&v>=40).sort((a,b)=>b[1]-a[1]);G.straindup=jAnd(dup.map(([k,v])=>`${NAME(k)} (${v}% of people; record class ${SC[k].recordSplit.class})`))||'no country';}
{const st=F.ranked.filter(d=>d.band==='Strong'),sh=st.filter(d=>d.model==='Shared');G.strongshared=sh.length===st.length?`All ${st.length} countries in the Strong band are Shared`:`${sh.length} of the ${st.length} countries in the Strong band are Shared`;}
G.extrows=String(EX.rows.length);G.extshown=String(G.external.split('\n').length-2);
{const I=EX.income,E=EX.eurostat;
 G.incrho=`${sg(I.overallVsGdp.rho)} (95% interval ${sg(I.overallVsGdp.lo)} to ${sg(I.overallVsGdp.hi)}, n ${I.overallVsGdp.n})`;G.incr2=`${Math.round(100*I.fit.r2)}%`;G.incslope=String(I.fit.slopePerLogUnit);
 G.inceu=`${sg(I.withinEurope.rho)} (${sg(I.withinEurope.lo)} to ${sg(I.withinEurope.hi)}, n ${I.withinEurope.n})`;G.incyears=I.overallVsGdp.years;
 G.incabove=jAnd(I.above.map(x=>`${NAME(x.iso3)} (+${x.resid.toFixed(1)})`));G.incbelow=jAnd(I.below.map(x=>`${NAME(x.iso3)} (${x.resid.toFixed(1)})`));
 const g=I.gdhmOverall;G.incgdhmconcl=g.partialCi[0]>0?'so the agreement survives with income held constant: it is not only shared income':g.partialCi[1]<0?'so with income held constant the two disagree':'so the agreement could be mostly shared income';
 G.incgdhm=`On the ${g.n} countries with a full 2023 Monitor response, the Monitor's overall phase correlates with income at ${sg(g.rhoGdhmGdp)} and our overall score at ${sg(g.rhoOursGdp)}; with income held constant, the Monitor and our score correlate at ${sg(g.partial)} (95% interval ${sg(g.partialCi[0])} to ${sg(g.partialCi[1])})`;
 G.eurostat=`${sg(E.rhoAccess)} (95% interval ${sg(E.lo)} to ${sg(E.hi)}, n ${E.n})`;G.eurostatde=`Germany ${E.values.DEU.toFixed(1)}% against an access score of ${E.accessScores.DEU}`;
 G.eurostatalb=`${E.values.ALB.toFixed(1)}%`;}
{const noL=[RS,RP].every(x=>x.shareAnyLeading===0),noP=[RS,RP].every(x=>x.shareAnyPoor===0),pubPoor=F.bandCount.Poor>0;
 G.rbextremes=pubPoor&&noL?`No country reaches the top band in any draw; ${F.bandCount.Poor} countries are Poor as published (${rg(bc.Poor)} across draws)`:noL&&noP?'No country reaches the top band and none falls to the bottom one in any draw':noL?'No country reaches the top band in any draw, but some draws put a country in the bottom one':noP?'No country falls to the bottom band in any draw, but some draws put a country in the top one':'Some draws put a country in the top band or the bottom one';
 G.rbextremes2=noL&&noP?'No country reaches Leading and none falls to Poor in any draw':G.rbextremes;}
G.relflag=String(RL.flagged_for_editors_abs_diff_ge_15.length);
// the same rater against current scores (analysis/reliability/current_compare.py; gated)
{const RCC=JSON.parse(fs.readFileSync('analysis/reliability/current_compare.json','utf8'));gate('analysis/reliability/current_compare.json (current_compare.py)',RCC.dataSha256);
 G.relcurrent=`${f2(RCC.iccCurrent)} (95% CI ${f2(RCC.iccCurrentCi[0])} to ${f2(RCC.iccCurrentCi[1])}; ${RCC.changedSinceRun} of the ${RCC.n} cells were re-researched after the run, and the rater read the earlier sources)`;}
// the 2 Oct re-research as a test-retest (analysis/testretest/testretest.json, computed from git; fixed history, not gated)
{const T=JSON.parse(fs.readFileSync('analysis/testretest/testretest.json','utf8'));
 G.trcells=`${T.cellsChanged} of ${T.cells} category scores in ${T.countries} countries`;G.trcellicc=`${f2(T.cellIcc)} (95% CI ${f2(T.cellIccCi[0])} to ${f2(T.cellIccCi[1])})`;
 G.troverall=`${f2(T.overallIcc)} (95% CI ${f2(T.overallIccCi[0])} to ${f2(T.overallIccCi[1])}), Spearman ${f2(T.overallSpearman)}`;G.trmove=`${T.overallMaxMove} points`;
 G.trbands=`${T.overallBandChanges} of ${T.countries} countries`;G.trcellbands=`${T.cellBandChanges} of ${T.cells}`;G.trloa=`${f1(T.cellLoa[0])} to +${f1(T.cellLoa[1])}`;
 const pc2=Object.entries(T.perCategoryIcc).sort((a,b)=>a[1]-b[1]);G.trweak=jAnd(pc2.filter(([,v])=>v<0.75).map(([k,v])=>`${k==='ai'?'clinical AI':k==='research'?'research consent':k} (${f2(v)})`))||'none';
 G.trstrong=`${f2(Math.min(...pc2.filter(([,v])=>v>=0.75).map(([,v])=>v)))} or higher`;}G.reldate=RL.generated_utc.slice(0,10);G.relmodel=RL.rater_models.join(', ');

// ---- Section 10, the traveling patient: computed with the live page's own derivation (traveller.js, traveller-core.js) ----
// crossborder.json and relocation_and_copy.json record no data/ hash (they rest on outside pages, not on scores), so they are
// not gated above. Instead: both must cover exactly the countries in data/, their counts must match their own meta, and every
// country-file quote behind a copy right must still be in data/ word for word (the check test_relocation_copy.py makes).
{const T=require('../traveller.js');
 const XF=JSON.parse(fs.readFileSync('analysis/crossborder/crossborder.json','utf8')),RJ=JSON.parse(fs.readFileSync('analysis/crossborder/relocation_and_copy.json','utf8'));
 const DK=Object.keys(data).sort().join(' ');
 if(Object.keys(XF.countries).sort().join(' ')!==DK)throw new Error('crossborder.json does not cover exactly the countries in data/; rebuild it (analysis/crossborder/METHOD.md)');
 if(Object.keys(RJ.countries).sort().join(' ')!==DK)throw new Error('relocation_and_copy.json does not cover exactly the countries in data/');
 if(XF.meta.as_of!==RJ.meta.as_of)throw new Error('crossborder.json and relocation_and_copy.json have different as_of dates');
 const nrm=s=>String(s||'').replace(/\s+/g,' ').trim();
 for(const [iso,c] of Object.entries(RJ.countries))for(const r of [...(c.refs||[]),...(c.national?[c.national]:[])]){
  const a=data[iso].categories.access,f=r.field.split('categories.access.')[1],m=/^detail\[(\d+)\]$/.exec(f),txt=m?(a.detail||[])[+m[1]]:a[f];
  if(!nrm(txt).includes(nrm(r.quote)))throw new Error(`STALE: relocation_and_copy.json quote for ${iso} (${r.field}) is no longer in data/${iso}.json; rerun analysis/crossborder/test_relocation_copy.py`)}
 const C=XF.countries,TOP=['ps_send','ps_recv','ep_send','ep_recv'],live=t=>Object.keys(C).filter(i=>(C[i].myhealtheu||{})[t]&&C[i].myhealtheu[t].status==='live');
 TOP.forEach(t=>{if(live(t).length!==(XF.meta.counts[t].live||0))throw new Error(`crossborder.json meta.counts.${t} disagrees with its countries`)});
 ['yes','no','not stated'].forEach(v=>{if(Object.values(RJ.countries).filter(c=>c.copyRight===v).length!==(RJ.meta.counts.copyRight[v]||0))throw new Error('relocation_and_copy.json meta.counts.copyRight disagrees with its countries')});
 XF.rc=T.readRc(RJ);const xb=T.compactXb(XF);  // the page's own data asset (traveller.js buildTraveller)
 const NM=i=>data[i].name,the=i=>/^(United |Netherlands)/.test(NM(i))?'the '+NM(i):NM(i),LD=T.longDate,PK=T.PART_KEYS;
 const eea=Object.keys(C).filter(i=>C[i].group!=='other'),EUn=Object.keys(C).filter(i=>C[i].group==='EU');
 G.xbasof=LD(XF.meta.as_of);G.xbkpiend=LD(XF.meta.kpi_window[1]);G.xbeea=String(eea.length);G.xbeun=String(EUn.length);
 const L=Object.fromEntries(TOP.map(t=>[t,live(t)]));
 G.xbtable=['| Part of the record | Countries that send it | Countries that receive it |','|---|---:|---:|',
  `| Health summary | ${L.ps_send.length} | ${L.ps_recv.length} |`,`| Medicines (prescriptions) | ${L.ep_send.length} | ${L.ep_recv.length} |`,
  ...['Lab results','Scans and X-rays','Hospital notes'].map(n=>`| ${n} | not carried | not carried |`)].join('\n');
 const all4=Object.keys(C).filter(i=>TOP.every(t=>L[t].includes(i))).sort((a,b)=>NM(a).localeCompare(NM(b))),any=Object.keys(C).filter(i=>TOP.some(t=>L[t].includes(i)));
 const anyEU=any.filter(i=>C[i].group==='EU'),anyX=any.filter(i=>C[i].group!=='EU').map(NM).sort();
 G.xbany=`${any.length} countries (${anyEU.length} EU members${anyX.length?` plus ${jAnd(anyX)}`:''})`;
 G.xball4=`${all4.length} (${jAnd(all4.map(NM))})`;
 const oth=Object.keys(C).filter(i=>C[i].group==='other'),othLive=oth.filter(i=>(C[i].other_arrangements||[]).some(o=>o.status==='live'));
 G.xbother=`${othLive.length} of the ${oth.length}`;G.xbothernames=jAnd(othLive.map(NM).sort());
 const cf=Object.keys(C).filter(i=>Object.values(C[i].myhealtheu||{}).some(b=>b&&b.conflict)).map(NM).sort();G.xbconflict=`${cf.length} (${jAnd(cf)})`;
 const BR=T.baseRate(xb);G.xbneu=String(BR.nEU);G.xbpairs=BR.pairs.toLocaleString('en-US');G.xbsummarylive=String(BR.live);
 G.xbunknown=`${BR.unknown.toLocaleString('en-US')} of the ${BR.states.toLocaleString('en-US')} checks (${BR.unknownPct}%)`;
 // visitors and people who move
 const RC=RJ.countries,stated=eea.filter(i=>['summary','prescriptions'].some(k=>((RC[i].relocation||{})[k]||{}).conclusion!=='not_stated'));
 G.xbreloc=stated.length?`${eea.length-stated.length} of the ${eea.length}`:`all ${eea.length}`;
 const e29=Object.keys(RC).filter(i=>((RC[i].relocation||{}).ehds_2029||{}).conclusion==='serves_residents');
 if(e29.some(i=>C[i].group!=='EU')||e29.length!==EUn.length)throw new Error('relocation_and_copy.json ehds_2029 must cover exactly the EU members');
 G.xbright29=LD(RC[e29[0]].relocation.ehds_2029.from);
 const gq=re=>{const g=XF.global_facts.find(x=>x.topic==='ehds_dates'&&re.test(x.quote));if(!g)throw new Error('no ehds_dates fact for '+re);return LD(g.quote.match(/26 March 20\d\d/)[0].replace('26 March ','')+'-03-26')};
 G.xbapply=gq(/shall apply from 26 March 2027/);G.xbdate29=gq(/2029.*points \(a\), \(b\) and \(c\)/);G.xbdate31=gq(/2031.*points \(d\), \(e\) and \(f\)/);
 if(G.xbdate29!==G.xbright29)throw new Error('the Article 7(2) date in relocation_and_copy.json disagrees with Article 105 in crossborder.json');
 // the person's own copy
 const cc=v=>Object.values(RC).filter(c=>c.copyRight===v).length,ce=v=>Object.values(RC).filter(c=>c.electronic===v).length,N=Object.keys(RC).length;
 G.xbcopy=`${cc('yes')} of ${N}`;G.xbcopyrest=`${cc('no')} say there is none and ${cc('not stated')} do not say`;G.xbcopyel=String(ce('yes'));
 G.xbcopyeea=eea.every(i=>RC[i].copyRight==='yes'&&RC[i].electronic==='yes')?`all ${eea.length}`:`${eea.filter(i=>RC[i].copyRight==='yes'&&RC[i].electronic==='yes').length} of the ${eea.length}`;
 // the three worked examples: the page's three figures (traveller-core.js VISITOR, ATHLETE, USEU)
 // the page's reachTxt and partsReach (traveller-core.js), said of the person rather than to the reader
 const parts=(n,u)=>n>0?`${n} of the 5 parts ${n===1?'reaches':'reach'} a doctor by ${n===1?'itself':'themselves'}`:u>0?'no source shows any part reaching a doctor by itself':'we found no part that reaches a doctor by itself';
 const cellsOf=d=>d.flatMap(s=>PK.flatMap(p=>s.cells[p])),unk=cs=>cs.filter(c=>c.border.state==='unknown').length;
 const copyN=cs=>cs.filter(c=>c.ch.state==='carried'||c.ch.state==='carried_partial').length;
 {const d=T.deriveRoute(xb,T.VISITOR),v=d.filter(s=>s.kind==='visiting'),back=d.at(-1),all=cellsOf(d);
  if(back.kind!=='return')throw new Error('the visitor route must end at home');
  G.xbvisit=v.map((s,k)=>`${k?'in':'In'} ${the(s.iso3)}, ${parts(s.counts.bySystem,s.counts.unknownParts)}`).join('; ');
  G.xbvisitback=back.counts.unknownCells===back.counts.cells?`no source says whether the care given abroad reaches the home record (${back.counts.unknownCells} of ${back.counts.cells} pieces not known)`:`${back.counts.bySystem} of the 5 parts of the care given abroad reach the home record by themselves`;
  G.xbvisitroute=T.routeSentence(data,T.VISITOR);G.xbvisitunk=`${unk(all)} of the ${all.length}`;
  const nArr=all.filter(c=>!['live','partial'].includes(c.ch.state)).length;G.xbvisitcopy=copyN(all)===nArr?'Wherever a part does not arrive by itself, the person can bring a copy':`The person can bring a copy for ${copyN(all)} of the ${all.length} pieces`;}
 {const d=T.deriveRoute(xb,T.ATHLETE),all=cellsOf(d),last=d.at(-1),eu=d.filter(s=>s.kind==='moved'&&C[s.iso3].group==='EU'),ec=cellsOf(eu);
  const reached=d.filter(s=>s.counts.bySystem>0).length,rel=d.filter(s=>s.kind==='moved').reduce((a,s)=>a+T.relocCount(s),0);
  G.xbathroute=T.routeSentence(data,T.ATHLETE);G.xbathmoves=T.numWord(d.length);G.xbathpieces=String(all.length);
  G.xbathunk=`${unk(all)} of the ${all.length} pieces (${Math.round(100*unk(all)/all.length)}%)`;
  G.xbathreach=reached?`at ${reached} of the ${T.numWord(d.length)} clubs some part arrives by itself`:`at none of the ${T.numWord(d.length)} clubs does any part arrive by itself`;
  G.xbathlast=`${the(last.iso3)}, ${parts(last.counts.bySystem,last.counts.unknownCells)}`;
  const sch=ec.filter(c=>c.border.state==='scheduled'),yrs=[...new Set(sch.map(c=>c.ch.year||c.border.year).filter(Boolean))].sort();
  G.xbatheu=`At the ${T.numWord(eu.length)} EU clubs (${jAnd(eu.map(s=>the(s.iso3)))}) there are ${ec.length} pieces. For ${unk(ec)}, no source says either way; ${sch.length} are not working yet, though a law says they must by ${yrs.join(' or ')}`;
  G.xbathreloc=String(rel);G.xbathcopy=`${copyN(all)} of the ${all.length}`;
  const rs=T.rightsAt(eu[0]);G.xbathright=rs.map(r=>`${r.year} for ${r.parts.length===2?'the health summary and medicines':'labs, scans and X-rays, and hospital notes'}`).join(', and from ');}
 {const d=T.deriveRoute(xb,T.USEU),v=d.filter(s=>s.kind==='visiting'),back=d.at(-1),best=Math.max(...v.map(s=>s.counts.bySystem));
  G.xbusroute=T.routeSentence(data,T.USEU).replace(/^./,c=>c.toUpperCase());G.xbusvisit=`In ${jAnd(v.map(s=>the(s.iso3)))}, ${best>0?`at most ${parts(best,0)}`:parts(0,v.reduce((a,s)=>a+s.counts.unknownCells,0))}`;
  G.xbusback=back.counts.bySystem?`${back.counts.bySystem} of the 5 parts reach the home record by themselves`:back.counts.unknownCells?'no source shows any part of the care given abroad reaching the home record by itself':'we found no part of the care given abroad that reaches the home record by itself';
  const h=v[0].holders[0],car=T.carriedOf(xb,h);G.xbuscopy=car.state==='yes'?`all ${car.parts.length} parts`:car.state==='partial'?`${car.parts.length} of the 5 parts`:'no part we could confirm';
  const bc=copyN(PK.flatMap(p=>back.cells[p]));G.xbusbackcopy=bc===back.counts.cells?`a copy of every part of the care given in ${jAnd(back.holders.map(the))}`:`a copy of ${bc} of the ${back.counts.cells} pieces of the care given abroad`;}
}

// ---- REVIEW2 round (2 Oct 2026): every figure below is read from a file, never typed ----
// WHO Monitor join table: must hold every country in data/ except its named exceptions (DECISION_RULES.md rule 1, auxiliary inputs)
{const M=JSON.parse(fs.readFileSync('analysis/external/iso3_to_m49.json','utf8')),MM=JSON.parse(fs.readFileSync('analysis/external/iso3_to_m49.meta.json','utf8'));
 if(Object.keys(M).length!==MM.rows)throw new Error(`STALE: analysis/external/iso3_to_m49.json has ${Object.keys(M).length} rows, its meta says ${MM.rows}`);
 const miss=Object.keys(data).filter(i=>!(i in M)&&!(i in MM.exceptions));
 if(miss.length)throw new Error(`STALE: analysis/external/iso3_to_m49.json is missing ${miss.length} countries in data/ (${miss.slice(0,8).join(' ')}); rebuild it from the UN M49 table`);
 if(EX.m49Rows!==MM.rows)throw new Error('external_corr.json was computed with a different M49 table; rerun analysis/external_corr.py');
 G.m49exceptions=jAnd(Object.keys(MM.exceptions).map(NAME).sort());}
// confidence (DECISION_RULES.md rule 4): computed by scripts/confidence.py, gated, and every label in facts.json must match it
{const CF=JSON.parse(fs.readFileSync('analysis/confidence/confidence.json','utf8'));gate('analysis/confidence/confidence.json (scripts/confidence.py --write)',CF.dataSha256);
 const off=F.ranked.filter(d=>(CF.countries[d.iso3]||{}).label!==d.confidence).map(d=>d.iso3);
 if(off.length)throw new Error(`confidence labels in out/facts.json differ from scripts/confidence.py for ${off.join(' ')}; run scripts/confidence.py --write and node build.js`);
 const c=CF.counts,b=CF.before;G.confsplit=`${c.high} high, ${c.medium} medium and ${c.low} low`;G.confbefore=`${b.high} high, ${b.medium} medium and ${b.low} low`;
 const V=Object.values(CF.countries);G.confadmit=String(V.filter(v=>v.admits.length).length);G.confallprim=String(V.filter(v=>v.primary===8).length);
 const hiNow=Object.entries(CF.countries).filter(([,v])=>v.was==='high');G.confhighkept=`${hiNow.filter(([,v])=>v.label==='high').length} of the ${hiNow.length}`;
 G.confhighlow=jAnd(hiNow.filter(([,v])=>v.label==='low').map(([k])=>NAME(k)).sort())||'none';G.confhighlown=String(hiNow.filter(([,v])=>v.label==='low').length);
 G.conflowweak=String(Object.values(CF.countries).filter(v=>v.label==='low'&&v.primary<=4).length);}
// sole first place, and the lead group under the error model calibrated on the blind re-scoring alone (REVIEW2_methods M3)
{const lead=F.ranked.filter(d=>RC.countries[d.iso3].rank90[0]===1),p2=x=>(x*100).toFixed(2)+'%',CC=RB.monteCarlo.calibratedCell.countries;
 if(lead.some(d=>RC.countries[d.iso3].soleFirstShare==null))throw new Error('robustness.json has no soleFirstShare: rerun robustness.py');
 G.leadsum=String(Math.round(lead.reduce((a,d)=>a+RC.countries[d.iso3].firstShare,0)*100));
 G.leadsole=jAnd(lead.map(d=>`${d.name} ${p2(RC.countries[d.iso3].soleFirstShare)}`));
 const frag=lead.reduce((a,d)=>RC.countries[d.iso3].soleFirstShare<RC.countries[a.iso3].soleFirstShare?d:a);G.leadfragile=frag.name;
 G.leadfragilesole=p2(RC.countries[frag.iso3].soleFirstShare);G.leadfragilecell=p2(CC[frag.iso3].firstShare);
 const cellLead=F.ranked.filter(d=>CC[d.iso3].rank90[0]===1).map(d=>d.name);G.leadcell=jAnd(cellLead);
 G.leadfragilecellin=CC[frag.iso3].rank90[0]===1?'which keeps it in the group':'below the 5% cut, so under that model it would leave the group';}
// how far a second reading agrees: coverage and per-category detail (current_compare.json is gated above; testretest.json is fixed history)
{const RCC=JSON.parse(fs.readFileSync('analysis/reliability/current_compare.json','utf8')),T=JSON.parse(fs.readFileSync('analysis/testretest/testretest.json','utf8'));
 const SF=JSON.parse(fs.readFileSync('analysis/reliability/sample.json','utf8')).frame;G.relframe=`${SF.countries} countries (${SF.cells} cells)`;G.relframen=String(SF.countries);
 const rr=RCC.ratedByRegion,tot=Object.values(rr).reduce((a,b)=>a+b,0);if(tot!==H.n)throw new Error('ratedByRegion does not sum to the rated cells');
 G.releurope=`${rr.Europe} of the ${tot} rated cells are European and ${rr.Africa||0} African`;
 const pc=RCC.perCategoryIccAtRun;G.relaccess=`${f2(pc.access.icc)} (n ${pc.access.n})`;
 G.relcats=jAnd(Object.entries(pc).sort((a,b)=>a[1].icc-b[1].icc).map(([k,v])=>`${k==='ai'?'clinical AI':k==='clinical'?'clinician access':k} ${f2(v.icc)}`));
 const sh=x=>(x>=0?'+':'')+x.toFixed(1);G.trshift=sh(T.cellMeanShift);
 G.trshiftcats=jAnd(Object.entries(T.perCategoryMeanShift).filter(([,v])=>Math.abs(v)>=2.5).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`${k==='ai'?'clinical AI':k} ${sh(v)}`));
 G.trkeysn=String(T.keysChanged.length);G.trkeys=jAnd(T.keysChanged.map(k=>`${NAME(k.iso3)} (${k.before} to ${k.after})`));
 G.n43=`${ORIG.length} of ${F.N}`;G.nadded=String(F.N-SF.countries);
 const pcr=T.perCategoryIcc,rsd=JSON.parse(fs.readFileSync('analysis/variance/variance.json','utf8'));
 G.researchrel=`its test-retest agreement is ${f2(pcr.research)} and its blind agreement ${f2(pc.research.icc)}`;}
// variance structure and the rights and delivery sub-scores (paper only; not on the site)
{const VR=JSON.parse(fs.readFileSync('analysis/variance/variance.json','utf8'));gate('analysis/variance/variance.json (analysis/variance/variance.py)',VR.dataSha256);
 const e=VR.effectiveWeight,pp=x=>(x*100).toFixed(1)+'%',nm=k=>k==='ai'?'clinical AI':k==='clinical'?'clinician access':k;
 G.pc1=`${Math.round(VR.pc1Share*100)}%`;G.effres=pp(e.research);G.effinfra=pp(e.journey+e.clinical);G.effaccess=pp(e.access+e.control);
 G.efftable=['| Category | Printed weight | Share of the variation in overall scores | SD | IQR |','|---|---:|---:|---:|---:|',...Object.keys(VR.nominalWeight).map(k=>`| ${CATS.find(c=>c[0]===k)[1]} | ${VR.nominalWeight[k]}% | ${pp(e[k])} | ${VR.sd[k].toFixed(1)} | ${F.dist[k].q3-F.dist[k].q1} |`)].join('\n');  // IQR from Table 1's own quartiles, so the two tables agree
 G.researchsd=`a standard deviation of ${VR.sd.research.toFixed(1)} points and an interquartile range of ${F.dist.research.q3-F.dist.research.q1}`;
 const S=EX.subscores;if(!S)throw new Error('external_corr.json has no subscores: rerun analysis/external_corr.py');
 const cg=x=>`${sg(x.gdpRho)} (95% interval ${sg(x.gdpLo)} to ${sg(x.gdpHi)}, n ${x.gdpN})`;
 G.subrights=cg(S.rights);G.subdelivery=cg(S.delivery);G.subrd=sg(S.rightsVsDelivery);
 G.subtable=['| Sub-score | Categories (printed weights, renormalised) | Min | Q1 | Median | Q3 | Max | Spearman with GDP per head |','|---|---|---:|---:|---:|---:|---:|---|',
  ...['rights','delivery'].map(k=>{const x=S[k];return `| ${k==='rights'?'Rights':'Delivery'} | ${Object.entries(x.weights).map(([c,w])=>`${nm(c)} ${w}`).join(', ')} | ${x.min.toFixed(1)} | ${x.q1.toFixed(1)} | ${x.median.toFixed(1)} | ${x.q3.toFixed(1)} | ${x.max.toFixed(1)} | ${cg(x)} |`})].join('\n');}
// story verifier: the run must cover every live story
{const SVJ=JSON.parse(fs.readFileSync('analysis/stories_verify.json','utf8'));const ids=stories.map(x=>x.id).sort();
 if(SVJ.storiesChecked!==stories.length||JSON.stringify(SVJ.ids)!==JSON.stringify(ids))throw new Error(`STALE: analysis/stories_verify.json covers ${SVJ.storiesChecked} stories, ${stories.length} are live; rerun scripts/verify_stories.py`);
 G.storyverify=`Its run of ${LD2(SVJ.run)} checked all ${SVJ.storiesChecked} accounts and found ${SVJ.linksNotAnswering} of their links not answering and ${SVJ.ruleFailures} rule failures`;}

// limits named for version 1.1, read from the files (Section 7.4)
{const W={};CATS.forEach(([k,,w])=>W[k]=w);
 const hc=data.HUN.categories.control,ht=[hc.summary,...(hc.detail||[])].join(' '),hm=ht.match(/[^.]*\b0\.6 percent[^.]*\./);
 if(!hm)throw new Error('HUN control text no longer states the 0.6 percent uptake; rewrite Section 7.4 item 11');G.hunuptake=hm[0].trim();
 const ns=data.NRU.categories.journey.sources,cls=ns.map(x=>/beyond essential/i.test(x.title)?'vendor':/act|law/i.test(x.title)?'law':'study');
 G.nrujsrc=`${ns.length} sources: ${jAnd(Object.entries(count(cls.map(c=>({c})),'c')).map(([k,v])=>k==='vendor'?`${v} page${v>1?'s':''} from the system's vendor`:k==='law'?`${v} law`:`${v} academic coverage stud${v>1?'ies':'y'}`))}`;
 const pat=/\bno\b[^.]{0,80}\b(rule|law|framework|consent|opt-out|provision)s?\b[^.]{0,60}\b(was|were)? ?found\b/i;
 const nr=Object.values(data).filter(d=>pat.test(d.categories.research.summary)),sc=nr.map(d=>d.categories.research.score);
 G.resnorule=`By a text match, ${nr.length} research summaries say that no rule was found, and they score ${Math.min(...sc)} to ${Math.max(...sc)}`;
 G.resnorulemax=String(W.research*Math.max(...sc)/100);
 const words=['No','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten'];G.bandmovesn=words[bandm.length]||String(bandm.length);
 G.naddedshare=`${Math.round(100*Number(G.nadded)/F.N)}%`;
 const RCC=JSON.parse(fs.readFileSync('analysis/reliability/current_compare.json','utf8')),ns2=Object.values(RCC.perCategoryIccAtRun).map(v=>v.n);G.relcatn=`${Math.min(...ns2)} to ${Math.max(...ns2)}`;
 const S=EX.subscores,ov=!(S.rights.gdpHi<S.delivery.gdpLo||S.delivery.gdpHi<S.rights.gdpLo);
 G.subcompare=`${S.delivery.gdpRho>S.rights.gdpRho?'Delivery':'Rights'} tracks income more closely${ov?', but the two intervals overlap':', and the intervals do not overlap'}.`;}

let md=fs.readFileSync('paper/paper.md','utf8');
md=md.replace(/<!-- GEN:(\w+) -->[\s\S]*?<!-- \/GEN:\1 -->/g,(m,k)=>{if(!(k in G))throw new Error('no GEN value '+k);return G[k].includes('\n')?`<!-- GEN:${k} -->\n\n${G[k]}\n\n<!-- /GEN:${k} -->`:`<!-- GEN:${k} -->${G[k]}<!-- /GEN:${k} -->`});
if(!DRY)fs.writeFileSync('paper/paper.md',md);
console.log('spliced',Object.keys(G).length,'values;',stories.length,'stories');
// Zenodo description and notes, from the same values as the paper (paper/zenodo.json)
{const Z=JSON.parse(fs.readFileSync('paper/zenodo.json','utf8'));const m=Z.metadata;const mc=F.modelCount;
 m.title=`The Health Record Rights Index: Who Holds the Record in ${F.N} Countries?`;
 m.description=`We scored ${F.N} countries and territories (${G.uncoverage}), from 0 to 100 on one question: does a person get to see, control and share their own health record? Eight weighted categories cover access to the full record, control and consent, privacy and security, protection from commercial use, a connected care journey, clinician access, research consent and clinical AI governance. Every score cites the public pages it rests on. ${G.lead}. The median is ${G.median}. By band: ${G.bandranges}; no country reaches the Leading band in any draw. A blind re-scoring of ${G.reln} sampled cells by a separate session of the same model family, run before the 2 October re-research, agreed with the scores at that time at an intraclass correlation of ${G.reliccshort}; a second, pre-registered blind re-scoring of ${G.rel2n} cells from the added countries agreed at ${G.rel2iccshort}, with access lowest (${G.rel2accessshort}); no human rater has scored the index. By who holds the keys by default: ${mc.Shared} systems give the person real controls inside a shared system, ${mc.State} leave it to the state and ${mc.Institutional} to providers and insurers; none gives the person the default say. ${G.storytotal} published accounts of real record problems, from regulators, courts and the news, sit beside the scores without changing them. An audit of our own scores, and every change it led to, is reported in full. Research, scoring, cross-checking, re-scoring and drafting used research agents built on Anthropic's Claude models (Claude Opus 5.5 via Claude Code), 30 September to 2 October 2026; the authors directed the work and ruled on every finding and change. Everything is drawn from public information. Paper and data CC BY 4.0; scoring and analysis code MIT. Interactive index: https://healthrecordrights.com`;
 m.notes=`SuperTruth Inc. sells health data verification products, funded this work and controlled its design and the decision to publish. The evidence grade in the paper adapts SuperTruth's own Data Trust Index. This index is a research tool, not legal advice. The code and data are in a public repository, a clean export linked from this record, without internal working files. Individual accounts are linked from the interactive index and are not deposited, so that an account can be taken down from the index on request; copies made while they were briefly public on 2 October 2026 cannot be recalled.`;
 if(!DRY)fs.writeFileSync('paper/zenodo.json',JSON.stringify(Z,null,2)+'\n');}
