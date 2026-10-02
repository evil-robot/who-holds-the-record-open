"""Classify every cited URL by publisher type (domain rules, hand-curated lists below).
Classes: official (government, legislature, regulator, national health agency, EU institution),
legal_text (official text on a non-government legal database), intergov (WHO, OECD, IDB, FAO),
academic (journals, universities, think tanks), law_firm (law firms, legal guides),
news (news and trade press), blog_vendor (blogs, vendors, advocacy, wiki, consultancies, and health providers
or insurers that are not a ministry, regulator or national health agency, even when state-owned, following
brusselshealthnetwork.be, aok.de and cm.be in v1).
Wave 1 (1 Oct 2026) added the 21 new countries' domains below each list, classed from the publisher's identity
(homepage checked where unclear), and an explicit NEWS list so a listed news domain counts as audited.
web.archive.org snapshots are classed by the archived URL's domain.
'primary' in the rubric's sense = official + legal_text + intergov."""
import json, glob, re, collections, csv, os
from urllib.parse import urlparse
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OFFICIAL_RE = re.compile(r"(\.gov(\.[a-z]{2})?$|\.gob(\.[a-z]{2})?$|\.gouv\.fr$|\.go\.[a-z]{2}$|\.gv\.at$|\.admin\.ch$|europa\.eu$"
    r"|\.gc\.ca$|^canada\.ca$|^alberta\.ca$|gov\.bc\.ca$|\.leg\.br$|parliament\.uk$|\.nhs\.uk$|nih\.gov$|\.gov\.[a-z]{2}$|^gov\.[a-z]{2}$)")
OFFICIAL = set("""admin.ch idp.al privacy.org.nz kanta.fi findata.fi ipc.on.ca gematik.de cnil.fr bundesgesundheitsministerium.de regeringen.se
elga.gv.at irishstatutebook.ie retsinformation.dk riigiteataja.ee boe.es gazzettaufficiale.it lovdata.no sundhedsdatastyrelsen.dk
english.sundhedsdatastyrelsen.dk helsedirektoratet.no ppc.go.jp imy.se rte.ie bag.admin.ch healthinfo.gov.sg president.gov.tw
doh.gov.ae mohap.gov.ae uaelegislation.gov.ae gesundheit.gv.at oesterreich.gv.at hrcdc.ie mitz-toestemming.nl helsedata.no moh.gov.sa
priv.gc.ca parl.ca sernac.cl camara.cl gesund.bund.de stpk.dk dataetiskraad.dk luvn.fi ameli.fr isd.gov.gh fdaghana.gov.gh
citizensinformation.ie garanteprivacy.it myhealthway.go.kr medmij.nl datavoorgezondheid.nl nkom.no cez.gov.pl uodo.gov.pl ezdrowie.gov.pl
synapxe.sg nhi.gov.tw health.belgium.be ensaiosclinicos.gov.br e-health-suisse.ch edoeb.admin.ch swissmedic.ch minsal.cl
tervisekassa.ee ico.org.uk dataprotection.org.gh nmc.org.in korea.kr m.korea.kr helsenorge.no nhn.no datatilsynet.no rwandafda.gov.rw
nhic.gov.sa isomer-user-content.by.gov.sg nhs.uk england.nhs.uk digital.nhs.uk forschungsdatenzentrum-gesundheit.de malaffi.ae
rechnungshof.gv.at cofen.gov.br ethics.gc.ca spp.gov.cn en.spp.gov.cn ncsti.gov.cn ehc.gov.eg espanadigital.gob.es terviseportaal.ee
about.hse.ie psifas.org.il faq.myna.go.jp digitalhealth.gov.ng pgo.nl tweedekamer.nl zorginstituutnederland.nl riksrevisjonen.no
minict.gov.rw support.healthhub.sg inera.se 1177.se ehalsomyndigheten.se mohw.gov.tw healthit.gov fda.gov sanews.gov.za cms.gov ftc.gov
wjw.ankang.gov.cn langzhong.gov.cn policy.mofcom.gov.cn sis.gov.eg vision2030.gov.sa thailand.go.th cyber.gov.rw odpc.go.ke
regionsyddanmark.dk skane.se socialstyrelsen.se planalto.gov.br pacjent.gov.pl kmu.admin.ch edi.admin.ch lordslibrary.parliament.uk
medregs.blog.gov.uk 4years.scto.ch www8.cao.go.jp temanararaunga.maori.nz innovationisrael.org.il bdi.or.th portale.fnomceo.it
salute.regione.emilia-romagna.it diputados.gob.mx sidof.segob.gob.mx www2.camara.leg.br camara.leg.br app.xinhuanet.com
acss.min-saude.pt ancom.ro anm.ro asp.government.bg azop.hr chd.lu cner.gouvernement.lu cnpd.public.lu cpdp.bg
dataprotection.ro datenschutzstelle.li dpa.gr ers.pt esante.lu esveikata.lt pacientas.esveikata.lt ezdrav.si podpora.ezdrav.si
ezdravotnictvo.sk nczisk.sk gesy.org.cy guichet.public.lu heilsuvera.is his.bg hzjz.hr hzzo.hr idpc.org.mt island.is landtag.li
ldvc.lv lnds.lu lvportals.lv m3s.gouvernement.lu mh.government.bg mobilne.portal.zdravlje.hr naih.hu ncez.mzcr.cz neha.org.cy
nijz.si nzip.cz regierung.li secu.lu stjornarradid.is usoud.cz uzis.cz pgdlisboa.pt swissethics.ch rg.ru
althingi.is dv.parliament.bg e-seimas.lrs.lt data.legilux.public.lu likumi.lv slov-lex.sk uradni-list.si narodne-novine.nn.hr
gesetze.li legislation.mt files.diariodarepublica.pt legislatie.just.ro""".split())
LEGAL_TEXT = set("""servicios.infoleg.gob.ar saflii.org ghalii.org lawphil.net faolex.fao.org lagen.nu iura.cl english.luatvietnam.vn
popia.co.za law.justia.com portalnormativo.es billc27.ca lovnorge.no ecfr.gov federalregister.gov
cylaw.org net.jogtar.hu consultant.ru sudact.ru zakonyprolidi.cz lege5.ro zakonodaja.com hlk.hr""".split())
INTERGOV = set("""eurohealthobservatory.who.int applications.emro.who.int oecd.ai publications.iadb.org faolex.fao.org
efta.int oecd.org norden.diva-portal.org integratedcare4people.org""".split())
ACADEMIC = set("""link.springer.com academic.oup.com doi.org arxiv.org jstage.jst.go.jp karger.com thieme-connect.com frontiersin.org
scielo.org.za hhrjournal.org cmaj.ca globalhealthmedicine.com journals.unizik.edu.ng digichina.stanford.edu nbr.org fpf.org
ncbi.nlm.nih.gov genomics.ut.ee research.lawlab.africa healthsystemsfacts.org medialaws.eu ehtel.eu casrai.org asiapacific.ca cens.cl
bm.itu.edu.tr archivos.juridicas.unam.mx pmc.ncbi.nlm.nih.gov""".split())
LAW_FIRM = set("""cuatrecasas.com dlapiperdataprotection.com dlapiper.com hlc.com practiceguides.chambers.com legal500.com lexology.com
bakermckenzie.com tilleke.com uria.com eg.andersen.com pauseperin.adv.br prieto.cl cms.law clydeco.com shinkim.com cooley.com
allenandgledhill.com tamimi.com dharab.com vandoorne.com fasken.com blg.com hbtlaw.com wilmerhale.com dwt.com hklaw.com morganlewis.com
ropesgray.com nelsonmullins.com hallrender.com pearlcohen.com rajahtannasia.com mmsadvocates.co.ke aln.africa daniel.com.br
businesslawchamber.com ibanet.org
acarergonen.av.tr dmp.hu jadek-pensa.si leitnerlaw.cz nahradaskody.sk""".split())
BLOG_VENDOR = set("""recordinglaw.com cyberlawwatch.com healthcareworld.com mariohealthbits.dev felixhappich.com hashtagpraxis.com
techhiveadvisory.africa halaprivacy.com toppingafrica.com moonstone.co.za en.wikipedia.org vision2030.ai regdesk.co emergobyul.com
pureglobal.com docs.modulos.ai zavis.ai digioneer.pro nilexdigitalsystems.com softwaremedilink.com globalhealthconnector.com
medqair.com explain.co.za airtabat.com uaeexperthub.com leffertech.com meddeviceguide.com regulations.ai deepidv.com qualtechs.com
hipaasimple.com policyvault.africa piratenpartei.ch facua.org verbraucherzentrale.de patientenfederatie.nl hamoked.org
privatehealthcareawards.ie healthcaredenmark.dk investindk.com brusselshealthnetwork.be cm.be aok.de surescripts.com aha.org
na.eventscloud.com gdpr.pl consultorsalud.com.mx adherent.com zhuanlan.zhihu.com icthealth.org healthmanagement.org
apps.apple.com bmo.org.tr gdpr-info.eu gdpr.blog.hu tisztessegesadatkezeles.org meditex.ru medrate.ru observatorioia.org
pentagrid.ch digital-liechtenstein.li ochranaudaju.cz consultorsalud.com spitalnegrestioas.ro spitalleordeni.ro
kholmskcrb.gosuslugi.ru h-och.ch clsanagustin.com""".split())
# Explicit news list (wave 1). Unlisted domains still default to "news", but only listed ones count as audited.
NEWS = set("""15min.lt rtsh.al faktoje.al 24ur.com 7eminar.ua agerpres.ro ameliarueda.com avocatnet.ro bnn.lv bta.bg cbn.com.cy comnews.ru crhoy.com
debati.bg dialogos.com.cy digitalhealth.cz eco.sapo.pt economedia.ro ekonomim.com eltiempo.com eng.lsm.lv ethnos.gr evz.ro
faktograf.hr feedit.cz financije.hr forbes.ua gazarul.ro glas-slavonije.hr gxpnews.net healthnews.pt hurriyet.com.tr iatronet.gr
iatropedia.gr infobae.com ink.com jogkoveto.hu jornaldenegocios.pt juridice.ro klerk.ru lateja.cr lawspot.gr lb.ua lequotidien.lu
lessentiel.lu lie-zeit.li medvestnik.ru memurlar.net monumental.co.cr n1info.si nacion.com novini247.com openiazoch.zoznam.sk
politis.com.cy pplware.sapo.pt rbc.ua reporter.lu safe.cnews.ru securityweek.com topontiki.gr tv3.lt utroruse.com vademec.ru
vedomosti.ru vg.hu visir.is ygeia-press.com zdrave.net zdrave.to zdravotnickydenik.cz anti-malware.ru""".split())
ARCHIVE = re.compile(r"^https?://web\.archive\.org/web/[^/]+/(https?://.+)$")
def norm(u):
    m = ARCHIVE.match(u or "")
    return urlparse(m.group(1) if m else u).netloc.lower().removeprefix("www.")
def classify(dom):
    for s, name in ((LEGAL_TEXT, "legal_text"), (INTERGOV, "intergov"), (ACADEMIC, "academic"), (LAW_FIRM, "law_firm"), (BLOG_VENDOR, "blog_vendor"), (NEWS, "news")):
        if dom in s: return name
    if dom in OFFICIAL or OFFICIAL_RE.search(dom): return "official"
    return "news"
PRIMARY = {"official", "legal_text", "intergov"}
if __name__ == "__main__":
    rows = []
    for f in sorted(glob.glob(f"{ROOT}/data/*.json")):
        d = json.load(open(f))
        for k, c in d["categories"].items():
            for s in c["sources"]: rows.append((d["iso3"], d["confidence"], "source", k, s["url"], classify(norm(s["url"]))))
        for l in d["laws"]: rows.append((d["iso3"], d["confidence"], "law", "laws", l["url"], classify(norm(l["url"]))))
    with open(f"{ROOT}/analysis/source_classes.csv", "w", newline="") as fh:
        w = csv.writer(fh); w.writerow(["iso3", "confidence", "section", "category", "url", "publisher_class"]); w.writerows(rows)
    src = [r for r in rows if r[2] == "source"]
    print("category sources by class", collections.Counter(r[5] for r in src))
    print("law urls by class", collections.Counter(r[5] for r in rows if r[2] == "law"))
    print("news-classified domains (check):", sorted({norm(r[4]) for r in rows if r[5] == "news"}))
    # per country: categories with >=1 primary source; primary share
    per = collections.defaultdict(lambda: collections.defaultdict(list))
    for iso, conf, sec, k, u, cl in src: per[iso][k].append(cl in PRIMARY)
    out = []
    for iso, cats in per.items():
        conf = next(r[1] for r in src if r[0] == iso)
        cats_with = sum(any(v) for v in cats.values()); share = sum(sum(v) for v in cats.values()) / sum(len(v) for v in cats.values())
        out.append((iso, conf, cats_with, round(share, 2)))
    for x in sorted(out, key=lambda x: x[3]): print(*x)
    # by category: primary share
    bc = collections.defaultdict(list)
    for r in src: bc[r[3]].append(r[5] in PRIMARY)
    print({k: (len(v), round(sum(v) / len(v), 2)) for k, v in bc.items()})
    # categories with zero primary source
    zero = [(iso, k) for iso, cats in per.items() for k, v in cats.items() if not any(v)]
    print("categories with no primary source:", len(zero), "of", sum(len(c) for c in per.values())); print(sorted(zero))
