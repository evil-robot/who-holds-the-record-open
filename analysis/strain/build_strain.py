"""Strain and split: a CONTEXT layer for Who Holds the Record. It changes no score.

Run:  uv run --project ~/Projects/ds-lab python analysis/strain/build_strain.py [--refresh]

Without --refresh it rebuilds from the extracts in analysis/strain/raw/ (committed, with SHA-256 and
retrieval date per source in raw/manifest.json). With --refresh it re-downloads every source first.
Reads data/<ISO3>.json only to get the country list and the record-split quotes; never writes to data/.
Definitions, thresholds and the record-split rule are in METHOD.md. validate() is the verifier;
test_strain.py plants bad values and checks that validate() catches every one.
"""
import datetime as dt
import glob
import hashlib
import io
import json
import os
import re
import sys
import urllib.request

import numpy as np
import pandas as pd

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
HERE = os.path.join(ROOT, "analysis", "strain")
RAW = os.path.join(HERE, "raw")

SRC = {
    "gho_doctors": {"url": "https://ghoapi.azureedge.net/api/HWF_0001", "name": "WHO Global Health Observatory (NHWA), indicator HWF_0001 Medical doctors (per 10,000)"},
    "gho_nurses": {"url": "https://ghoapi.azureedge.net/api/HWF_0006", "name": "WHO Global Health Observatory (NHWA), indicator HWF_0006 Nursing and midwifery personnel (per 10,000)"},
    "ghed": {"url": "https://apps.who.int/nha/database/Home/IndicatorsDownload/en", "name": "WHO Global Health Expenditure Database (GHED)"},
    "oecd_wait": {"url": "https://sdmx.oecd.org/public/rest/data/OECD.ELS.HD,DSD_HEALTH_PROC@DF_WAITING,/all?dimensionAtObservation=AllDimensions&format=csvfilewithlabels", "name": "OECD Health Statistics, Waiting times (DSD_HEALTH_PROC@DF_WAITING)"},
    "oecd_prot": {"url": "https://sdmx.oecd.org/public/rest/data/OECD.ELS.HD,DSD_HEALTH_PROT@DF_HEALTH_PROT,/all?dimensionAtObservation=AllDimensions&format=csvfilewithlabels", "name": "OECD Health Statistics, Healthcare coverage (DSD_HEALTH_PROT@DF_HEALTH_PROT)"},
    "wdi_oop": {"url": "https://api.worldbank.org/v2/country/all/indicator/SH.XPD.OOPC.CH.ZS?format=json&per_page=20000&date=2010:2024", "name": "World Bank WDI SH.XPD.OOPC.CH.ZS (republishes GHED; used only as a parse cross-check)"},
    "wb_oecd": {"url": "https://api.worldbank.org/v2/region/OED/country?format=json&per_page=100", "name": "World Bank region OED (OECD members), used only to name the OECD peer set"},
}

WAIT_THRESHOLD_DAYS = 90       # median days, specialist assessment to treatment; 90 = OECD's own 3-month line
WAIT_PROCS = {"hip": "Hip replacement", "knee": "Knee replacement", "cataract": "Cataract surgery"}
WAIT_FLAG_PROCS = ("hip", "knee")
SPLIT_CLASSES = ("connected", "partial", "split", "unknown")
FLAG_KEYS = ("workforceLow", "privateSpendHigh", "longWaits", "recordSplit")  # the four counted flags
RESEARCH_FILE = "record_split_research.json"
STALE_YEARS = 5                # a value older than this many years before retrieval is marked stale
EDGE_BAND = 1.0                # sensitivity report: values within this of a cut-off

# ---------------------------------------------------------------- record split (hand-coded, quote-checked)
# Rule (METHOD.md): connected = the file says private providers feed or are bound to the shared record by a
# rule in force, with no stated gap. partial = a stated gap, a future-dated mandate, or a link limited to some
# private providers or to a patient-shared summary. split = the file says public and private records are not
# linked, or almost no private providers connect. unknown = the file is silent on private providers, or says
# their connection was not verified. Insurer/claims links and private software vendors are NOT private providers.
# Each entry: (class, field, verbatim quote). build checks the quote is a substring of that field.
RECORD_SPLIT = {
    "BGR": ("connected", "categories.journey.summary", "Every provider, public or private, must send a signed electronic record of each activity to the national system."),
    "FIN": ("connected", "journeyNote", "Kanta joins public and private providers, pharmacies and prescriptions nationally, with consent governing cross-provider views."),
    "FRA": ("connected", "categories.journey.summary", "About 150,000 private practitioners and 3,800 institutions feed the shared record"),
    "GRC": ("connected", "categories.journey.summary", "National e-prescription and e-referral, run by IDIKA since 2010, feed one record for public and private care."),
    "HUN": ("connected", "journeyNote", "EESZT has linked GPs, hospitals, outpatient clinics and all pharmacies since 2017, with private providers since 2020."),
    "POL": ("connected", "categories.journey.detail[0]", "Every doctor, dentist and hospital must report medical events to the national system, whether care is public or private."),
    "TUR": ("connected", "journeyNote", "SGK will not pay for services missing from e-Nabız, so public and private providers feed one ministry record"),
    "ARG": ("partial", "categories.journey.detail[0]", "creates a federal program to progressively set up a single electronic record system and an interoperability framework across public, private and social security sectors."),
    "AUT": ("partial", "categories.journey.summary", "Hospitals, pharmacies, labs and radiology now feed ELGA, and private doctors must connect from 2026."),
    "BRA": ("partial", "categories.journey.summary", "Private sector integration and small hospitals still lag."),
    "CHL": ("partial", "journeyNote", "Public network tools exist; private links are uneven."),
    "CRI": ("partial", "categories.journey.summary", "Private hospitals and clinics are not connected beyond the patient's share code."),
    "CYP": ("partial", "categories.clinical.summary", "The Commission found public and private hospitals supplying data to the national access service, but a full national record is not yet built."),
    "HRV": ("partial", "journeyNote", "private clinics join only in 2027."),
    "ISL": ("partial", "categories.journey.summary", "Some private providers still keep non-digital records until a December 2026 deadline."),
    "ITA": ("partial", "categories.journey.detail[2]", "Emilia-Romagna now shows reports from out-of-region care and is adding private provider documents"),
    "PRT": ("partial", "categories.clinical.summary", "Data held only by private providers is often missing."),
    "SGP": ("partial", "categories.clinical.detail[2]", "Coverage gaps remain until mandatory contribution starts in early 2027, mainly in private primary care."),
    "SWE": ("partial", "categories.access.detail[0]", "All Swedish regions take part, along with some municipalities and private providers."),
    "THA": ("partial", "categories.journey.detail[0]", "passed 400 public and private facilities by August 2024."),
    "MEX": ("split", "journeyNote", "Each institution (IMSS, ISSSTE, IMSS-Bienestar, private) keeps its own record today."),
    "MLT": ("split", "journeyNote", "Private hospitals, private GPs and most private prescriptions are outside it."),
    "RUS": ("split", "categories.journey.detail[3]", "Only about 2% of private clinics sent data in 2025"),
    "ZAF": ("split", "journeyNote", "Public and private care run separate systems."),
}
# Unknown with a reason worth recording (file speaks to the question but does not answer it).
UNKNOWN_NOTES = {
    "CAN": ("journeyNote", "only 35% of physicians share data outside their practice", "The file documents fragmentation across provinces and practices, not a public/private split."),
    "GHA": ("categories.clinical.summary", "private facilities were not shown to be connected", "Not shown is not the same as not connected."),
    "IND": ("categories.journey.detail[1]", "450+ public and private solutions integrated.", "These are software integrations, not private care providers; the file does not say whether private providers connect."),
    "RWA": ("categories.clinical.detail[1]", "We did not verify whether private clinics or pharmacies are connected", "Not verified."),
}


def field(d, path):
    cur = d
    for part in path.split("."):
        m = re.fullmatch(r"(\w+)\[(\d+)\]", part)
        cur = cur[m.group(1)][int(m.group(2))] if m else cur[part]
    return cur


# ---------------------------------------------------------------- fetch
def _get(url, timeout=300):
    req = urllib.request.Request(url, headers={"User-Agent": "supertruth-strain/1.0"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()


def fetch(isos):
    os.makedirs(RAW, exist_ok=True)
    today = dt.date.today().isoformat()
    man = {}
    for key, s in SRC.items():
        body = _get(s["url"])
        man[key] = {"url": s["url"], "name": s["name"], "retrieved": today, "sha256": hashlib.sha256(body).hexdigest(), "bytes": len(body)}
        if key.startswith("gho_"):
            v = json.loads(body)["value"]
            keep = [{k: x[k] for k in ("SpatialDim", "SpatialDimType", "TimeDim", "NumericValue", "Comments", "Date")} for x in v
                    if x["SpatialDimType"] == "COUNTRY" and x["SpatialDim"] in isos]
            json.dump(keep, open(os.path.join(RAW, f"{key}.json"), "w"), indent=0)
        elif key == "ghed":
            xl = pd.ExcelFile(io.BytesIO(body))
            ver = " ".join(xl.parse("Version").astype(str).fillna("").values.ravel().tolist() + list(xl.parse("Version").columns))
            man[key]["version_text"] = ver
            d = xl.parse("Data", usecols=["code", "location", "year", "hf21_che", "hf3_che", "pvtd_che", "hf122_che"])
            d[d.code.isin(isos)].to_csv(os.path.join(RAW, "ghed_extract.csv"), index=False)
            m = xl.parse("Metadata")
            m = m[m.code.isin(isos) & m["variable code"].isin(["hf21", "hf3", "hf2"])][["code", "variable code", "Sources"]]
            m.to_csv(os.path.join(RAW, "ghed_sources.csv"), index=False)
        elif key.startswith("oecd_"):
            df = pd.read_csv(io.BytesIO(body), low_memory=False)
            df[df.REF_AREA.isin(isos)].to_csv(os.path.join(RAW, f"{key}.csv"), index=False)
        else:
            open(os.path.join(RAW, f"{key}.json"), "wb").write(body)
    json.dump(man, open(os.path.join(RAW, "manifest.json"), "w"), indent=1)


# ---------------------------------------------------------------- load
def merge_research(out, path=None):
    """Merge the record-split research file, if present. Expected shape (refused loudly otherwise):
    {ISO3: {"class": connected|partial|split|unknown, "quote": str, "url": str, ...}} or the same under "countries".
    Rules: research with class+quote+url beats a file 'unknown'; where both are known and differ, the country-file
    class stays, both are kept and conflict=true (an editor resolves it); agreement is recorded as basis 'both'."""
    path = path or os.path.join(HERE, RESEARCH_FILE)
    if not os.path.exists(path):
        return 0
    raw = json.load(open(path))
    entries = raw.get("countries", raw) if isinstance(raw, dict) else None
    if not isinstance(entries, dict):
        raise ValueError(f"{RESEARCH_FILE}: expected an object keyed by ISO3; got {type(raw).__name__}")
    n = 0
    for iso, e in entries.items():
        if iso in ("meta", "_meta"):
            continue
        if iso not in out:
            raise ValueError(f"{RESEARCH_FILE}: {iso} is not one of the 64 countries")
        if not isinstance(e, dict) or e.get("class") not in SPLIT_CLASSES:
            raise ValueError(f"{RESEARCH_FILE}: {iso} has no valid class (one of {SPLIT_CLASSES})")
        if e["class"] != "unknown" and not (e.get("quote") and str(e.get("url", "")).startswith("http")):
            raise ValueError(f"{RESEARCH_FILE}: {iso} class {e['class']} needs a quote and an http(s) url")
        rs = out[iso]["recordSplit"]
        rs["research"] = e
        n += 1
        if e["class"] == "unknown":
            continue
        if rs["class"] == "unknown":
            rs.update({"fileClass": "unknown", "fileField": rs.get("field"), "fileQuote": rs.get("quote")})
            rs.update({"class": e["class"], "quote": e["quote"], "field": None, "url": e["url"], "basis": "research", "conflict": False})
        elif rs["class"] == e["class"]:
            rs.update({"basis": "both", "conflict": False})
        elif e.get("editorRuling") == "research":
            rs.update({"fileClass": rs["class"], "fileField": rs.get("field"), "fileQuote": rs.get("quote")})
            rs.update({"class": e["class"], "quote": e["quote"], "field": None, "url": e["url"], "basis": "research", "conflict": False,
                       "note": e.get("editorNote", "Editor ruling: research overrides the country file.")})
        else:
            rs.update({"basis": "file", "conflict": True})
    return n


def last_final_ghed_year(version_text):
    m = re.search(r"Data for (\d{4}) are preliminary", version_text)
    if not m:
        raise ValueError("GHED version text no longer states which year is preliminary; re-read the Version sheet")
    return int(m.group(1)) - 1


def wait_gap_note(wait_all, iso, label, kind):
    """Why a wait value is missing: say what the country does report to OECD, if anything."""
    w = wait_all[(wait_all.REF_AREA == iso) & (wait_all["Medical procedure"].str.startswith(label))]
    if not len(w):
        return "not reported to OECD"
    a2t = w["Waiting time"].str.contains("specialist assessment to treatment")
    if kind == "median" and (a2t & (w.Measure == "Mean waiting times")).any():
        return "OECD has only the mean wait from specialist assessment to treatment for this country, not the median; left unknown rather than mixed"
    if kind == "pct" and a2t.any() and not (a2t & (w.Measure == "Waiting times")).any():
        return "OECD has no share waiting over 3 months from specialist assessment to treatment for this country; left unknown"
    if w["Waiting time"].str.contains("on the list").any() and not a2t.any():
        return "this country reports time on the waiting list to OECD, not the wait from specialist assessment to treatment; left unknown rather than mixed"
    return "not reported to OECD for this measure"


def latest(rows, iso):
    """rows: list of (iso, year, value, extra). Latest year with a numeric value."""
    r = [x for x in rows if x[0] == iso and x[2] is not None and not (isinstance(x[2], float) and np.isnan(x[2]))]
    return max(r, key=lambda x: x[1]) if r else None


def ind(value, year, src_key, man, note=None, **extra):
    o = {"value": None if value is None else round(float(value), 2), "year": None if year is None else int(year),
         "source": man[src_key]["name"], "url": man[src_key]["url"], "retrieved": man[src_key]["retrieved"]}
    if note:
        o["note"] = note
    o.update(extra)
    return o


def build():
    files = sorted(glob.glob(os.path.join(ROOT, "data", "[A-Z][A-Z][A-Z].json")))
    countries = {os.path.basename(f)[:3]: json.load(open(f)) for f in files}
    isos = sorted(countries)
    if "--refresh" in sys.argv or not os.path.exists(os.path.join(RAW, "manifest.json")):
        fetch(isos)
    man = json.load(open(os.path.join(RAW, "manifest.json")))
    final_year = last_final_ghed_year(man["ghed"]["version_text"])

    gho = {}
    for k in ("gho_doctors", "gho_nurses"):
        gho[k] = [(x["SpatialDim"], x["TimeDim"], x["NumericValue"], x["Comments"]) for x in json.load(open(os.path.join(RAW, f"{k}.json")))]
    ghed = pd.read_csv(os.path.join(RAW, "ghed_extract.csv"))
    ghed = ghed[ghed.year <= final_year]
    gsrc = pd.read_csv(os.path.join(RAW, "ghed_sources.csv"))
    wait = pd.read_csv(os.path.join(RAW, "oecd_wait.csv"), low_memory=False)
    wait = wait[(wait.MEASURE.astype(str).str.upper().str.contains("MEDIAN")) & (wait["Waiting time"].str.contains("specialist assessment to treatment"))
                & (wait.UNIT_MEASURE == "D")] if "MEASURE" in wait else wait
    wait_all = pd.read_csv(os.path.join(RAW, "oecd_wait.csv"), low_memory=False).dropna(subset=["OBS_VALUE"])
    wait_pct = wait_all.copy()
    wait_pct = wait_pct[(wait_pct.Measure == "Waiting times") & (wait_pct["Waiting time"].str.contains("specialist assessment to treatment"))]
    prot = pd.read_csv(os.path.join(RAW, "oecd_prot.csv"), low_memory=False)
    prot = prot[prot.UNIT_MEASURE == "PT_POP"]          # the flow mixes percentages with head counts (PS)
    oecd_members = sorted(x["id"] for x in json.load(open(os.path.join(RAW, "wb_oecd.json")))[1])

    out = {}
    for iso in isos:
        I = {}
        for key, name in (("gho_doctors", "doctorsPer10k"), ("gho_nurses", "nursesMidwivesPer10k")):
            r = latest(gho[key], iso)
            I[name] = ind(r[2] if r else None, r[1] if r else None, key, man, note=(r[3] if r else "not published for this country"))
        g = ghed[ghed.code == iso]
        src = "; ".join(sorted(set(gsrc[gsrc.code == iso].Sources.dropna().astype(str))))[:400] or None
        for col, name in (("hf21_che", "vhiShareCHE"), ("hf3_che", "oopShareCHE"), ("pvtd_che", "privateDomesticShareCHE"),
                          ("hf122_che", "compulsoryPrivateInsuranceShareCHE")):
            gg = g.dropna(subset=[col])
            r = gg.loc[gg.year.idxmax()] if len(gg) else None
            I[name] = ind(r[col] if r is not None else None, r["year"] if r is not None else None, "ghed", man,
                          note=(f"GHED country source: {src}" if src else "not published for this country") if r is not None else "not published for this country")
        # VHI + OOP only when both exist for the SAME year (latest such year)
        both = g.dropna(subset=["hf21_che", "hf3_che"])
        if len(both):
            r = both.loc[both.year.idxmax()]
            I["vhiPlusOopShareCHE"] = ind(r.hf21_che + r.hf3_che, r.year, "ghed", man, note="sum of VHI and OOP shares, same year",
                                          vhiPart=round(float(r.hf21_che), 2), oopPart=round(float(r.hf3_che), 2), vhiYear=int(r.year), oopYear=int(r.year))
        else:
            I["vhiPlusOopShareCHE"] = ind(None, None, "ghed", man, note="VHI or OOP not published for a common year")
        for itype, name in (("Total voluntary health insurance", "vhiPopulationPct"), ("Duplicate voluntary health insurance", "duplicateVhiPopulationPct"),
                            ("Supplementary voluntary health insurance", "supplementaryVhiPopulationPct")):
            p = prot[(prot.REF_AREA == iso) & (prot["Insurance type"] == itype)].dropna(subset=["OBS_VALUE"])
            r = p.loc[p.TIME_PERIOD.idxmax()] if len(p) else None
            I[name] = ind(r.OBS_VALUE if r is not None else None, r.TIME_PERIOD if r is not None else None, "oecd_prot", man,
                          note=None if r is not None else "not reported to OECD (unknown, not zero)",
                          obsStatus=(None if r is None or pd.isna(r.OBS_STATUS) else r.OBS_STATUS))
        for k, label in WAIT_PROCS.items():
            w = wait[(wait.REF_AREA == iso) & (wait["Medical procedure"].str.startswith(label))].dropna(subset=["OBS_VALUE"])
            r = w.loc[w.TIME_PERIOD.idxmax()] if len(w) else None
            I[f"waitMedianDays_{k}"] = ind(r.OBS_VALUE if r is not None else None, r.TIME_PERIOD if r is not None else None, "oecd_wait", man,
                                           note=None if r is not None else wait_gap_note(wait_all, iso, label, "median"),
                                           obsStatus=(None if r is None or pd.isna(r.OBS_STATUS) else r.OBS_STATUS))
            w = wait_pct[(wait_pct.REF_AREA == iso) & (wait_pct["Medical procedure"].str.startswith(label))].dropna(subset=["OBS_VALUE"])
            r = w.loc[w.TIME_PERIOD.idxmax()] if len(w) else None
            I[f"waitPctOver3Months_{k}"] = ind(r.OBS_VALUE if r is not None else None, r.TIME_PERIOD if r is not None else None, "oecd_wait", man,
                                               note=None if r is not None else wait_gap_note(wait_all, iso, label, "pct"))
        I["specialistWaitOver4Weeks"] = {"value": None, "year": None, "source": None, "url": None,
                                         "note": "not published by WHO, OECD Health Statistics or WDI (it is a Commonwealth Fund survey item); unknown"}
        # record split
        d = countries[iso]
        if iso in RECORD_SPLIT:
            cls, path, quote = RECORD_SPLIT[iso]
            rs = {"class": cls, "field": path, "quote": quote}
        else:
            rs = {"class": "unknown", "field": None, "quote": None}
            if iso in UNKNOWN_NOTES:
                path, quote, why = UNKNOWN_NOTES[iso]
                rs.update(field=path, quote=quote, note=why)
            else:
                rs["note"] = "the country file does not say whether private providers connect to the shared record"
        rs["fileAsOf"] = d.get("asOf")
        rs["basis"] = "file" if rs["class"] != "unknown" else "none"
        out[iso] = {"name": d["name"], "oecdMember": iso in oecd_members, "indicators": I, "recordSplit": rs}

    merge_research(out)

    # ------------------------------------------------ cut-offs over the 64, then flags
    def vals(name):
        return np.array([o["indicators"][name]["value"] for o in out.values() if o["indicators"][name]["value"] is not None], dtype=float)

    cut = {"doctorsPer10k_Q1": float(np.percentile(vals("doctorsPer10k"), 25)),
           "nursesMidwivesPer10k_Q1": float(np.percentile(vals("nursesMidwivesPer10k"), 25)),
           "vhiPlusOopShareCHE_Q3": float(np.percentile(vals("vhiPlusOopShareCHE"), 75)),
           "n": {k: int(len(vals(k))) for k in ("doctorsPer10k", "nursesMidwivesPer10k", "vhiPlusOopShareCHE")}}
    for iso, o in out.items():
        I = o["indicators"]
        doc, nur = I["doctorsPer10k"]["value"], I["nursesMidwivesPer10k"]["value"]
        lows = [doc is not None and doc < cut["doctorsPer10k_Q1"], nur is not None and nur < cut["nursesMidwivesPer10k_Q1"]]
        wf = True if any(lows) else (False if doc is not None and nur is not None else None)
        s = I["vhiPlusOopShareCHE"]["value"]
        ps = None if s is None else s > cut["vhiPlusOopShareCHE_Q3"]
        waits = [I[f"waitMedianDays_{k}"]["value"] for k in WAIT_FLAG_PROCS if I[f"waitMedianDays_{k}"]["value"] is not None]
        lw = None if not waits else max(waits) > WAIT_THRESHOLD_DAYS
        cls = o["recordSplit"]["class"]
        sp = {"split": True, "connected": False, "partial": False, "unknown": None}[cls]
        dl = None if doc is None else doc < cut["doctorsPer10k_Q1"]
        nl = None if nur is None else nur < cut["nursesMidwivesPer10k_Q1"]
        flags = {"workforceLow": wf, "privateSpendHigh": ps, "longWaits": lw, "recordSplit": sp,
                 "doctorsLow": dl, "nursesLow": nl}   # doctorsLow/nursesLow are the parts of workforceLow, not counted
        o["flags"] = flags
        four = [flags[k] for k in FLAG_KEYS]
        o["flagCount"] = {"true": sum(v is True for v in four), "false": sum(v is False for v in four),
                          "unknown": sum(v is None for v in four)}
        o["reading"] = reading(o, cut)
    # OECD peer ranks (context only; 1 = highest value)
    for name in ("doctorsPer10k", "nursesMidwivesPer10k", "vhiShareCHE", "oopShareCHE", "vhiPlusOopShareCHE", "waitMedianDays_hip", "waitMedianDays_knee"):
        peers = sorted([(o["indicators"][name]["value"], iso) for iso, o in out.items() if o["oecdMember"] and o["indicators"][name]["value"] is not None], reverse=True)
        for rank, (_, iso) in enumerate(peers, 1):
            out[iso]["indicators"][name]["oecdPeerRank"] = f"{rank} of {len(peers)} (1 = highest)"
    # staleness: mark any value more than STALE_YEARS older than the retrieval year (kept, not dropped)
    for iso, o in out.items():
        for name, x in o["indicators"].items():
            if x["value"] is not None and x.get("retrieved") and int(x["retrieved"][:4]) - x["year"] > STALE_YEARS:
                x["stale"] = True
    # sensitivity: flags within a hair of a cut-off, and the 3+ list if "partial" counted as split
    edge = []
    for iso, o in out.items():
        for name, ck in (("doctorsPer10k", "doctorsPer10k_Q1"), ("nursesMidwivesPer10k", "nursesMidwivesPer10k_Q1"), ("vhiPlusOopShareCHE", "vhiPlusOopShareCHE_Q3")):
            v = o["indicators"][name]["value"]
            if v is not None and abs(v - cut[ck]) <= EDGE_BAND:
                edge.append({"iso3": iso, "indicator": name, "value": v, "cutoff": round(cut[ck], 2)})
    partial3 = sorted(iso for iso, o in out.items()
                      if o["flagCount"]["true"] + (o["recordSplit"]["class"] == "partial") >= 3)
    sens = {"withinOneUnitOfCutoff": edge, "threePlusIfPartialCountsAsSplit": partial3,
            "threePlus": sorted(iso for iso, o in out.items() if o["flagCount"]["true"] >= 3)}
    result = {"meta": {"built": dt.date.today().isoformat(), "changesScores": False, "countries": len(out),
                       "ghedLastFinalYear": final_year, "cutoffs": {k: (round(v, 2) if isinstance(v, float) else v) for k, v in cut.items()},
                       "waitThresholdDays": WAIT_THRESHOLD_DAYS, "staleYears": STALE_YEARS, "sensitivity": sens, "sources": man, "method": "analysis/strain/METHOD.md"},
              "countries": out}
    validate(result, countries)
    return result


PHRASE = {"workforceLow": "doctors or nurses per person in the bottom quarter of the 64 countries",
          "privateSpendHigh": "private insurance plus out-of-pocket spending in the top quarter of the 64",
          "longWaits": "a median wait over 90 days for hip or knee replacement",
          "recordSplit": "a public record that does not reach private providers"}
UNK = {"workforceLow": "workforce", "privateSpendHigh": "private spending", "longWaits": "waits", "recordSplit": "whether the record reaches private providers"}


def reading(o, cut):
    f = o["flags"]
    on = [PHRASE[k] for k in FLAG_KEYS if f[k] is True]
    unk = [UNK[k] for k in FLAG_KEYS if f[k] is None]
    head = (f"{o['name']} carries {len(on)} of 4 flags" + (f" ({'; '.join(on)})" if on else "")) if on else f"{o['name']} carries no flags"
    tail = f"; not measured: {', '.join(unk)}." if unk else "; all four were measured."
    if o["recordSplit"]["class"] == "partial":
        tail = tail[:-1] + "; the record reaches only some private providers."
    return head + tail


# ---------------------------------------------------------------- verifier
def validate(result, countries):
    errs = []
    C = result["countries"]
    final_year = result["meta"]["ghedLastFinalYear"]
    if set(C) != set(countries):
        errs.append(f"country set mismatch: {sorted(set(C) ^ set(countries))}")
    for iso, o in C.items():
        I = o["indicators"]
        for name, x in I.items():
            if x["value"] is not None and (x["year"] is None or x["url"] is None or x["source"] is None):
                errs.append(f"{iso}.{name}: value without year/source/url")
            if x["value"] is None and x.get("year") is not None:
                errs.append(f"{iso}.{name}: year claimed for a missing value")
            if x["year"] is not None and x.get("retrieved") and x["year"] > int(x["retrieved"][:4]):
                errs.append(f"{iso}.{name}: year {x['year']} after retrieval")
        for name in ("doctorsPer10k", "nursesMidwivesPer10k"):
            v = I[name]["value"]
            if v is not None and not (0 <= v <= (100 if name == "doctorsPer10k" else 250)):
                errs.append(f"{iso}.{name}: {v} outside plausible range")
        for name in ("vhiShareCHE", "oopShareCHE", "privateDomesticShareCHE", "compulsoryPrivateInsuranceShareCHE", "vhiPlusOopShareCHE", "vhiPopulationPct", "duplicateVhiPopulationPct", "supplementaryVhiPopulationPct"):
            v = I[name]["value"]
            if v is not None and not (0 <= v <= 100):
                errs.append(f"{iso}.{name}: share {v} outside 0-100")
        for name in ("vhiShareCHE", "oopShareCHE", "privateDomesticShareCHE", "compulsoryPrivateInsuranceShareCHE", "vhiPlusOopShareCHE"):
            y = I[name]["year"]
            if y is not None and y > final_year:
                errs.append(f"{iso}.{name}: GHED year {y} is preliminary (last final {final_year})")
        s = I["vhiPlusOopShareCHE"]
        if s["value"] is not None:
            # The sum carries its own parts and their years, so it is checked on its own terms; the separate VHI and
            # OOP indicators may legitimately sit in a later year if one series is published before the other.
            if not (s.get("vhiYear") == s.get("oopYear") == s["year"]):
                errs.append(f"{iso}: VHI+OOP year {s['year']} built from VHI {s.get('vhiYear')} / OOP {s.get('oopYear')}; sum must use one year")
            if s.get("vhiPart") is None or s.get("oopPart") is None or abs(s["value"] - (s["vhiPart"] + s["oopPart"])) > 0.02:
                errs.append(f"{iso}: VHI+OOP {s['value']} != {s.get('vhiPart')}+{s.get('oopPart')}")
            for nm in ("vhiShareCHE", "oopShareCHE"):
                x, part = I[nm], s.get("vhiPart" if nm == "vhiShareCHE" else "oopPart")
                if x["year"] == s["year"] and x["value"] is not None and part is not None and abs(x["value"] - part) > 0.02:
                    errs.append(f"{iso}: {nm} {x['value']} disagrees with the part used in the sum {part} for the same year")
            # No check against privateDomesticShareCHE: PVT-D is classified by revenue source (FS), VHI and OOP by
            # financing scheme (HF), so VHI+OOP can exceed PVT-D (South Africa: tax-subsidised medical schemes).
        if I["specialistWaitOver4Weeks"]["value"] is not None:
            errs.append(f"{iso}: specialistWaitOver4Weeks has a value but no source publishes it")
        rs = o["recordSplit"]
        if rs["class"] not in SPLIT_CLASSES:
            errs.append(f"{iso}: record split class {rs['class']}")
        if rs["class"] != "unknown" and not rs.get("quote"):
            errs.append(f"{iso}: record split {rs['class']} without a quote")
        basis = rs.get("basis")
        if basis == "research":
            e = rs.get("research") or {}
            if not (str(rs.get("url", "")).startswith("http") and rs.get("quote") == e.get("quote") and rs["class"] == e.get("class")):
                errs.append(f"{iso}: research-based class must carry the research quote, class and url")
        if rs.get("research") and rs["research"].get("class") not in (None, "unknown") and basis in ("file", "both"):
            agree = rs["research"]["class"] == rs["class"]
            if rs.get("conflict") is not (not agree):
                errs.append(f"{iso}: research class {rs['research']['class']} vs file {rs['class']} must be marked conflict={not agree}")
        if rs.get("quote") and basis != "research":
            try:
                txt = field(countries[iso], rs["field"])
            except (KeyError, IndexError, TypeError):
                txt = ""
            if rs["quote"] not in txt:
                errs.append(f"{iso}: record split quote not found verbatim in data/{iso}.json {rs['field']}")
        f = o["flags"]
        expect = {"split": True, "connected": False, "partial": False, "unknown": None}.get(rs["class"], "invalid")
        if expect != "invalid" and f["recordSplit"] is not expect:
            errs.append(f"{iso}: recordSplit flag {f['recordSplit']} does not follow class {rs['class']}")
        for k, v in f.items():
            if v not in (True, False, None):
                errs.append(f"{iso}.{k}: flag must be true/false/null, got {v!r}")
        if set(f) != set(FLAG_KEYS) | {"doctorsLow", "nursesLow"}:
            errs.append(f"{iso}: unexpected flag keys {sorted(f)}")
        cnt = o["flagCount"]
        four = [f.get(k) for k in FLAG_KEYS]
        if cnt["true"] != sum(v is True for v in four) or cnt["unknown"] != sum(v is None for v in four):
            errs.append(f"{iso}: flagCount does not match flags (nulls must not count as flags)")
        # flags recomputed from values and cut-offs
        cut = result["meta"]["cutoffs"]
        doc, nur = I["doctorsPer10k"]["value"], I["nursesMidwivesPer10k"]["value"]
        lows = [doc is not None and doc < cut["doctorsPer10k_Q1"], nur is not None and nur < cut["nursesMidwivesPer10k_Q1"]]
        wf = True if any(lows) else (False if doc is not None and nur is not None else None)
        if f["workforceLow"] is not wf:
            errs.append(f"{iso}: workforceLow {f['workforceLow']} does not follow the values ({wf})")
        dl = None if doc is None else doc < cut["doctorsPer10k_Q1"]
        nl = None if nur is None else nur < cut["nursesMidwivesPer10k_Q1"]
        if f.get("doctorsLow") is not dl or f.get("nursesLow") is not nl:
            errs.append(f"{iso}: doctorsLow/nursesLow {f.get('doctorsLow')}/{f.get('nursesLow')} do not follow the values ({dl}/{nl})")
        sv = I["vhiPlusOopShareCHE"]["value"]
        ps = None if sv is None else sv > cut["vhiPlusOopShareCHE_Q3"]
        if f["privateSpendHigh"] is not ps:
            errs.append(f"{iso}: privateSpendHigh {f['privateSpendHigh']} does not follow the values ({ps})")
        waits = [I[f"waitMedianDays_{k}"]["value"] for k in WAIT_FLAG_PROCS if I[f"waitMedianDays_{k}"]["value"] is not None]
        lw = None if not waits else max(waits) > result["meta"]["waitThresholdDays"]
        if f["longWaits"] is not lw:
            errs.append(f"{iso}: longWaits {f['longWaits']} does not follow the values ({lw})")
    cut = result["meta"]["cutoffs"]
    for name, ck, q in (("doctorsPer10k", "doctorsPer10k_Q1", 25), ("nursesMidwivesPer10k", "nursesMidwivesPer10k_Q1", 25), ("vhiPlusOopShareCHE", "vhiPlusOopShareCHE_Q3", 75)):
        v = [o["indicators"][name]["value"] for o in C.values() if o["indicators"][name]["value"] is not None]
        if v and abs(float(np.percentile(v, q)) - cut[ck]) > 0.01:
            errs.append(f"cut-off {ck} {cut[ck]} is not the {q}th percentile of the values ({float(np.percentile(v, q)):.2f})")
    if errs:
        raise ValueError("strain validation failed:\n  " + "\n  ".join(errs))
    return True


def cross_check(result):
    """Parse check: GHED OOP vs WDI OOP for the same country-year (WDI republishes GHED, so this is not independent)."""
    wdi = json.load(open(os.path.join(RAW, "wdi_oop.json")))[1]
    w = {(x["countryiso3code"], int(x["date"])): x["value"] for x in wdi if x["value"] is not None}
    bad, n = [], 0
    for iso, o in result["countries"].items():
        x = o["indicators"]["oopShareCHE"]
        if x["value"] is None or (iso, x["year"]) not in w:
            continue
        n += 1
        if abs(x["value"] - w[(iso, x["year"])]) > 1.0:
            bad.append((iso, x["year"], x["value"], round(w[(iso, x["year"])], 2)))
    return n, bad


if __name__ == "__main__":
    res = build()
    n, bad = cross_check(res)
    res["meta"]["wdiParseCheck"] = {"pairs": n, "disagreeOver1pt": bad}
    json.dump(res, open(os.path.join(HERE, "strain.json"), "w"), indent=1, ensure_ascii=False)
    C = res["countries"]
    print("cutoffs", res["meta"]["cutoffs"], "| GHED last final year", res["meta"]["ghedLastFinalYear"])
    print("WDI parse check:", n, "pairs; disagreements >1pt:", bad)
    names = [k for k in next(iter(C.values()))["indicators"]]
    print("coverage (of %d):" % len(C))
    for k in names:
        have = [i for i, o in C.items() if o["indicators"][k]["value"] is not None]
        print(f"  {k:28s} {len(have):2d}  missing: {' '.join(sorted(set(C) - set(have))) if len(have) > 40 else '(%d missing)' % (len(C) - len(have))}")
    print("recordSplit:", {c: sum(o["recordSplit"]["class"] == c for o in C.values()) for c in SPLIT_CLASSES})
    for k in ("workforceLow", "privateSpendHigh", "longWaits", "recordSplit"):
        print(f"  flag {k}: true {sum(o['flags'][k] is True for o in C.values())}, false {sum(o['flags'][k] is False for o in C.values())}, unknown {sum(o['flags'][k] is None for o in C.values())}")
    print("3+ flags:", [(i, o["flagCount"]) for i, o in C.items() if o["flagCount"]["true"] >= 3])
    print(json.dumps(C["CAN"], indent=1, ensure_ascii=False))
