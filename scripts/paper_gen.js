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
const tc=count(stories,'theme');G.themes=['| Theme | Stories |','|---|---:|',...Object.entries(tc).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`| ${THEMES[k]||k} | ${v<5?'fewer than 5':v} |`)].join('\n');
const ty=count(stories,'sourceType');G.types=['| Source type | Stories |','|---|---:|',...Object.entries(ty).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`| ${TYPES[k]||k} | ${v<5?'fewer than 5':v} |`)].join('\n');
const rc={};stories.forEach(s=>{const r=data[s.iso3].region;rc[r]=(rc[r]||0)+1});
G.storyregions=['| Region | Stories |','|---|---:|',...Object.entries(rc).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`| ${k} | ${v<5?'fewer than 5':v} |`)].join('\n');
const st=count(stories,'status');G.status=`${st.finding||0} rest on a regulator, court or ombudsman finding, ${st.admitted||0} on the organisation's own admission, and ${(st.alleged||0)+(st.self_reported||0)} on an account not yet tested`;
const langs=new Set(Object.values(searched).flatMap(s=>s.languages||[]));G.languages=String(langs.size);
const dates=stories.map(s=>s.date).sort();G.storywindow=dates.length?`${dates[0]} to ${dates.at(-1)}`:'n/a';
G.asof=F.asOf;G.version=F.version;

// ---- added 2 Oct 2026: every figure below is computed from repository files, never typed ----
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
G.links=`${csv.length-1} cited links checked: ${oc.ok||0} opened, ${oc.dead||0} dead, ${oc.blocked_unverified||0} blocked by bot protection and ${(oc.error||0)+Object.entries(oc).filter(([k])=>k.startsWith('other_')).reduce((s,[,v])=>s+v,0)} unreachable or unresolved`;
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
G.extclear=jAnd(EXT.filter(([k])=>exr(k).lo>0).map(([,l])=>l.replace(/ \[\d\]$/,'')))||'none';
G.storyreviewers=String(new Set(stories.map(s=>s.reviewedBy)).size);
// every category cell, for prose that cites one: <!-- GEN:cell_USA_access -->
F.ranked.forEach(d=>Object.entries(d.cats).forEach(([k,v])=>G[`cell_${d.iso3}_${k}`]=String(v)));
// rank and band moves of 1 Oct 2026 (docs/SCORE_CHANGES.md, "Ranking after the changes")
const rkm=sect('Ranking after the changes').map(l=>{const c=l.split('|').map(x=>x.trim());return {who:c[1].replace(/ \([A-Z]{3}\)/,''),move:Number(c[5]),band:c[6]}});
const bandm=rkm.filter(r=>r.band.includes('->'));
G.bandmoves=jAnd(bandm.map(r=>`${r.who} (${r.band.replace('->',' to ')})`));
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
 G.lead=sole?`${lead[0].name} (${lead[0].overall}) leads`:`${jAnd(lead.map(d=>`${d.name} (${d.overall})`))} have the highest scores; allowing for scoring error, any of them could rank first`;
 G.leadshares=jAnd(lead.map(d=>`${d.name} (${pct(RC.countries[d.iso3].firstShare)})`));G.leadn=String(lead.length);
 const mw=e=>{const w=Object.values(e.countries).map(c=>c.rank90[1]-c.rank90[0]).sort((a,b)=>a-b);return w[Math.floor(w.length/2)]};
 G.rbmainwidth=String(mw(RC));G.rblowerwidth=String(mw(RU));G.rbcellwidth=String(mw(RB.monteCarlo.calibratedCell));
 G.rbcellsd=String(RB.meta.calCellSd);G.rbshared=`${RB.meta.calShared[0]} points per category plus ${RB.meta.calShared[1]} points shared across a country`;
 const hold=Object.values(RC.countries).filter(c=>c.bandShare>=0.95).length;G.rbhold=`${hold} of ${F.N}`;}
G.rbmax=String(RS.maxScoreSeen>RP.maxScoreSeen?RS.maxScoreSeen:RP.maxScoreSeen);G.rbmin=String(Math.min(RS.minScoreSeen,RP.minScoreSeen));
G.rbmedian=rg(RS.medianScore90);
const widths=Object.values(RC.countries).map(c=>c.rank90[1]-c.rank90[0]).sort((a,b)=>a-b);G.rbwidth=String(widths[Math.floor(widths.length/2)]);
const ALT=Object.values(RB.alternatives);G.rbrho=(Math.floor(Math.min(...ALT.map(a=>a.spearman))*100)/100).toFixed(2);
G.rbfirstall=ALT.every(a=>a.first.length===1&&a.first[0]===F.ranked[0].iso3)?`${F.ranked[0].name} is first in every rebuilt index`:'The first place changes in at least one rebuilt index';
const edge=F.ranked.filter(d=>RC.countries[d.iso3].bandShare<0.9);G.rbedgen=String(edge.length);G.rbedge=edge.length<=15?jAnd(edge.map(d=>`${d.name} (${(Math.round(RB.reference.unrounded[d.iso3]*10)/10).toFixed(1)})`)):`the full list, with unrounded scores, is in analysis/robustness/ROBUSTNESS.md`;
const fl2=x=>(Math.floor(x*100)/100).toFixed(2);G.rbgeo=fl2(RB.alternatives.geometric.spearman);G.rbequal=fl2(RB.alternatives.equal.spearman);G.rbequalmax=`${RB.alternatives.equal.maxRankShift} places (${jAnd(RB.alternatives.equal.maxShiftCountries.map(NAME))})`;
G.rbdropj=RB.alternatives.drop_journey.rankShiftRS.toFixed(1);G.rbdropc=RB.alternatives.drop_clinical.rankShiftRS.toFixed(1);G.rbdropctl=RB.alternatives.drop_control.rankShiftRS.toFixed(1);
G.rbseed=String(RB.meta.seed);G.rbdraws=RB.meta.draws.toLocaleString('en-GB');
// reliability (analysis/reliability/reliability.json); pre-registered, compared with the scores published on its run date
const RL=JSON.parse(fs.readFileSync('analysis/reliability/reliability.json','utf8'));const H=RL.headline,BA=H.bland_altman;
const f1=x=>x.toFixed(1),f2=x=>x.toFixed(2),pc=x=>String(Math.round(100*x));
G.relsample=String(RL.sample.cells);G.reln=String(H.n);G.relnull=String(RL.sample.cells-RL.sample.rated);
G.relmad=`${f1(H.mad)} points (95% CI ${f1(H.mad_ci[0])} to ${f1(H.mad_ci[1])})`;G.relmadshort=f1(H.mad);
G.relwithin10=pc(H.within10)+'%';G.relwithin5=pc(H.within5)+'%';G.relband=pc(1-H.band_exact)+'%';
G.relicc=`${f2(H.icc2_1)} (95% CI ${f2(H.icc2_1_ci[0])} to ${f2(H.icc2_1_ci[1])})`;G.reliccshort=f2(H.icc2_1);
G.relkappa=f2(H.qwk_bands);G.relbias=(BA.bias>=0?'+':'')+f1(BA.bias);G.relloa=`${f1(BA.loa[0])} to +${f1(BA.loa[1])}`;G.relloahalf=String(Math.round((BA.loa[1]-BA.loa[0])/2));
const SA=RL.exploratory_source_access;G.relunread=`${SA.urls_unreadable} of ${SA.urls_cited} (${Math.round(100*SA.urls_unreadable/SA.urls_cited)}%)`;G.relunreadpct=Math.round(100*SA.urls_unreadable/SA.urls_cited)+'%';
{const dup=SV.map((s,i)=>[Object.keys(SC)[i],(s.indicators.duplicateVhiPopulationPct||{}).value]).filter(([,v])=>v!=null&&v>=40).sort((a,b)=>b[1]-a[1]);G.straindup=jAnd(dup.map(([k,v])=>`${NAME(k)} (${v}% of people; record class ${SC[k].recordSplit.class})`))||'no country';}
{const st=F.ranked.filter(d=>d.band==='Strong'),sh=st.filter(d=>d.model==='Shared');G.strongshared=sh.length===st.length?`All ${st.length} countries in the Strong band are Shared`:`${sh.length} of the ${st.length} countries in the Strong band are Shared`;}
G.extrows=String(EX.rows.length);G.extshown=String(EXT.length);
{const I=EX.income,E=EX.eurostat;
 G.incrho=`${sg(I.overallVsGdp.rho)} (95% interval ${sg(I.overallVsGdp.lo)} to ${sg(I.overallVsGdp.hi)}, n ${I.overallVsGdp.n})`;G.incr2=`${Math.round(100*I.fit.r2)}%`;G.incslope=String(I.fit.slopePerLogUnit);
 G.inceu=`${sg(I.withinEurope.rho)} (${sg(I.withinEurope.lo)} to ${sg(I.withinEurope.hi)}, n ${I.withinEurope.n})`;G.incyears=I.overallVsGdp.years;
 G.incabove=jAnd(I.above.map(x=>`${NAME(x.iso3)} (+${x.resid.toFixed(1)})`));G.incbelow=jAnd(I.below.map(x=>`${NAME(x.iso3)} (${x.resid.toFixed(1)})`));
 const g=I.gdhmOverall;G.incgdhm=`On the ${g.n} countries with a full 2023 Monitor response, the Monitor's overall phase correlates with income at ${sg(g.rhoGdhmGdp)} and our overall score at ${sg(g.rhoOursGdp)}; with income held constant, the Monitor and our score correlate at ${sg(g.partial)} (95% interval ${sg(g.partialCi[0])} to ${sg(g.partialCi[1])})`;
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

let md=fs.readFileSync('paper/paper.md','utf8');
md=md.replace(/<!-- GEN:(\w+) -->[\s\S]*?<!-- \/GEN:\1 -->/g,(m,k)=>{if(!(k in G))throw new Error('no GEN value '+k);return G[k].includes('\n')?`<!-- GEN:${k} -->\n\n${G[k]}\n\n<!-- /GEN:${k} -->`:`<!-- GEN:${k} -->${G[k]}<!-- /GEN:${k} -->`});
if(!DRY)fs.writeFileSync('paper/paper.md',md);
console.log('spliced',Object.keys(G).length,'values;',stories.length,'stories');
// Zenodo description and notes, from the same values as the paper (paper/zenodo.json)
{const Z=JSON.parse(fs.readFileSync('paper/zenodo.json','utf8'));const m=Z.metadata;const mc=F.modelCount;
 m.title=`The Health Record Rights Index: Who Holds the Record in ${F.N} Countries?`;
 m.description=`We scored ${F.N} countries and territories (${G.uncoverage}), from 0 to 100 on one question: does a person get to see, control and share their own health record? Eight weighted categories cover access to the full record, control and consent, privacy and security, protection from commercial use, a connected care journey, clinician access, research consent and clinical AI governance. Every score cites the public pages it rests on. ${G.lead}. The median is ${G.median}. By band: ${G.bandranges}; no country reaches the Leading band in any draw. A blind re-scoring of ${G.reln} sampled cells by a separate session of the same model family, run before the 2 October re-research, agreed with the scores at that time at an intraclass correlation of ${G.reliccshort}; no human rater has scored the index. By who holds the keys by default: ${mc.Shared} systems give the person real controls inside a shared system, ${mc.State} leave it to the state and ${mc.Institutional} to providers and insurers; none gives the person the default say. ${G.storytotal} published accounts of real record problems, from regulators, courts and the news, sit beside the scores without changing them. An audit of our own scores, and every change it led to, is reported in full. Research, scoring, cross-checking, re-scoring and drafting used research agents built on Anthropic's Claude models (Claude Opus 5.5 via Claude Code), 30 September to 2 October 2026; the authors directed the work and ruled on every finding and change. Everything is drawn from public information. Paper and data CC BY 4.0; scoring and analysis code MIT. Interactive index: https://whoholds.supertruth.ai`;
 m.notes=`SuperTruth Inc. sells health data verification products, funded this work and controlled its design and the decision to publish. The evidence grade in the paper adapts SuperTruth's own Data Trust Index. This index is a research tool, not legal advice. The code and data are in a public repository, a clean export linked from this record, without internal working files. Individual accounts are linked from the interactive index and are not deposited, so that removal requests can be honoured.`;
 if(!DRY)fs.writeFileSync('paper/zenodo.json',JSON.stringify(Z,null,2)+'\n');}
