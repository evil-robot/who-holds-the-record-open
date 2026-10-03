#!/usr/bin/env python3
"""Build and validate the cross-border data layer for Who Holds the Record.

Usage
  python3 analysis/crossborder/build_crossborder.py build      # fetch EC sources, merge curated facts, write crossborder.json
  python3 analysis/crossborder/build_crossborder.py validate   # check crossborder.json against data/*.json
  python3 analysis/crossborder/build_crossborder.py selftest   # plant 3 errors in a copy and prove the validator catches them

Environment
  XB_CACHE  directory for fetched page text (default /tmp/xb/src). Quotes are checked against it when present.
  XB_FACTS  directory of curated fact files (default /tmp/xb/facts). If absent, curated facts are reused
            from the existing crossborder.json (every fact whose origin is "curated").

See METHOD.md for definitions and decision rules. This script never writes under data/.
"""
import copy
import datetime as dt
import glob
import html
import json
import os
import re
import subprocess
import sys
import urllib.parse
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
DATA = ROOT / "data"
OUT = HERE / "crossborder.json"
CACHE = Path(os.environ.get("XB_CACHE", "/tmp/xb/src"))
FACTS = Path(os.environ.get("XB_FACTS", "/tmp/xb/facts"))
AS_OF = "2026-10-02"
UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/128.0 Safari/537.36")

EU27 = {"AT": "AUT", "BE": "BEL", "BG": "BGR", "HR": "HRV", "CY": "CYP", "CZ": "CZE", "DK": "DNK",
        "EE": "EST", "FI": "FIN", "FR": "FRA", "DE": "DEU", "EL": "GRC", "HU": "HUN", "IE": "IRL",
        "IT": "ITA", "LV": "LVA", "LT": "LTU", "LU": "LUX", "MT": "MLT", "NL": "NLD", "PL": "POL",
        "PT": "PRT", "RO": "ROU", "SK": "SVK", "SI": "SVN", "ES": "ESP", "SE": "SWE"}
EEA3 = {"NO": "NOR", "IS": "ISL", "LI": "LIE"}
ISO2_TO_3 = {**EU27, **EEA3, "GR": "GRC"}   # other codes (one stray "VA" row) are dropped
PIN_SLUG = {"AUT": "austria", "BEL": "belgium", "BGR": "bulgaria", "HRV": "croatia", "CYP": "cyprus",
            "CZE": "czechia", "DNK": "denmark", "EST": "estonia", "FIN": "finland", "FRA": "france",
            "DEU": "germany", "GRC": "greece", "HUN": "hungary", "IRL": "ireland", "ITA": "italy",
            "LVA": "latvia", "LTU": "lithuania", "LUX": "luxembourg", "MLT": "malta", "NLD": "netherlands",
            "POL": "poland", "PRT": "portugal", "ROU": "romania", "SVK": "slovakia", "SVN": "slovenia",
            "ESP": "spain", "SWE": "sweden", "NOR": "norway", "ISL": "iceland", "LIE": "liechtenstein"}

EC_PAGE = ("https://health.ec.europa.eu/ehealth-digital-health-and-care/digital-health-and-care/"
           "electronic-cross-border-health-services_en")
PIN_BASE = EC_PAGE.replace("_en", "/patient-information-notices-")
KPI_DASH = "https://experience.arcgis.com/experience/77f459be23e545b48f46a79cfaf19423/page/1_1/"
ARC = "https://services.arcgis.com/6OgStIrB9hO8HNK5/arcgis/rest/services/{}/FeatureServer/0/query?"
KPI_WINDOW = ("2024-01-01", "2025-06-30")   # last six quarters present in the EC KPI layers
KPI_STRONG = 20                            # decision rule D3, see METHOD.md
KPI_MIN = 5                                # decision rule D4 (needs a matching EC notice)
TOPICS = ("ps_send", "ps_recv", "ep_send", "ep_recv")
STATUSES = {"live", "planned", "not_live", "unknown", "none found", "not_applicable"}


# ---------------------------------------------------------------- fetching

def page_text(raw: str) -> str:
    s = re.sub(r"<script.*?</script>|<style.*?</style>|<noscript.*?</noscript>", "", raw, flags=re.S | re.I)
    s = re.sub(r"<(br|/p|/li|/h\d|/tr|/div|/td|/th|/section|/article)[^>]*>", "\n", s, flags=re.I)
    s = re.sub(r"<[^>]+>", " ", s)
    s = html.unescape(s)
    s = re.sub(r"[ \t\xa0]+", " ", s)
    return re.sub(r"\n\s*\n+", "\n", s)


def fetch(url: str, name: str, keep_raw=False):
    """Fetch url into CACHE/name.txt (text) and return (http_code, raw, text). Reuses cache if present."""
    CACHE.mkdir(parents=True, exist_ok=True)
    txt, rawp = CACHE / f"{name}.txt", CACHE / f"{name}.raw"
    if txt.exists() and (not keep_raw or rawp.exists()):
        raw = rawp.read_text(errors="ignore") if rawp.exists() else ""
        return 200, raw, txt.read_text(errors="ignore")
    r = subprocess.run(["curl", "-sL", "--max-time", "60", "-A", UA, "-o", str(rawp), "-w", "%{http_code}", url],
                       capture_output=True, text=True)
    code = int(r.stdout or 0)
    raw = rawp.read_text(errors="ignore") if rawp.exists() else ""
    text = page_text(raw) if code == 200 else ""
    if code == 200:
        txt.write_text(text)
        (CACHE / f"{name}.url").write_text(url)
    return code, raw, text


def arcgis_raw(name: str, layer: str, params: dict) -> str:
    """Raw JSON text of an ArcGIS query. Cached verbatim so quotes can be checked."""
    p = CACHE / f"{name}.txt"
    url = ARC.format(layer) + urllib.parse.urlencode(params)
    if not p.exists():
        r = subprocess.run(["curl", "-s", "--max-time", "120", url], capture_output=True, text=True)
        p.write_text(r.stdout)
        (CACHE / f"{name}.url").write_text(url)
    return p.read_text()


def page_date(raw: str) -> str:
    m = re.search(r'"dateModified":\s*"(\d{4}-\d{2}-\d{2})', raw or "")
    return m.group(1) if m else "undated"


# ---------------------------------------------------------------- sources

def kpi_directions():
    """Per country, per topic: {partner_iso3: n} from EC KPI transaction layers, window KPI_WINDOW."""
    stats = json.dumps([{"statisticType": "count", "onStatisticField": "FID", "outStatisticFieldName": "n"}])
    out, facts_src = {}, {}
    for layer, svc, types in (("KPI_1_5", "ps", "Patient Summary"), ("KPI_1_3b", "ep", "ePrescription")):
        name = f"arcgis_{layer}_2024on"
        params = {"where": "YEAR>=2024",
                  "groupByFieldsForStatistics": "FROM__initiator_,TO__response_,YEAR,Is_a_test__,Result,Transaction_Type",
                  "outStatistics": stats, "f": "json"}
        raw = arcgis_raw(name, layer, params)
        url = (CACHE / f"{name}.url").read_text() if (CACHE / f"{name}.url").exists() else ARC.format(layer) + urllib.parse.urlencode(params)
        facts_src[svc] = (url, raw)
        for f in json.loads(raw)["features"]:
            a = f["attributes"]
            test = (a.get("Is_a_test__") or "").strip().lower()
            res = (a.get("Result") or "").strip().upper()
            frm = ISO2_TO_3.get((a.get("FROM__initiator_") or "").strip())
            to = ISO2_TO_3.get((a.get("TO__response_") or "").strip())
            if test == "yes" or res in ("FAILURE", "FAIL") or not frm or not to or frm == to:
                continue
            if types not in (a.get("Transaction_Type") or ""):
                continue
            # responder (TO) holds the record and sends it (country A); initiator (FROM) is the country of care (B)
            for iso, topic, partner in ((to, f"{svc}_send", frm), (frm, f"{svc}_recv", to)):
                d = out.setdefault(iso, {}).setdefault(topic, {})
                d[partner] = d.get(partner, 0) + a["n"]
    return out, facts_src


def kpi_row_quote(raw: str, iso3: str, topic: str):
    """Verbatim JSON fragment of the largest qualifying row for this country and direction."""
    iso2 = [k for k, v in ISO2_TO_3.items() if v == iso3]
    field = "TO__response_" if topic.endswith("send") else "FROM__initiator_"
    best = None
    for m in re.finditer(r'\{"attributes":(\{[^{}]*\})\}', raw):
        a = json.loads(m.group(1))
        if (a.get(field) or "").strip() not in iso2:
            continue
        if (a.get("Is_a_test__") or "").strip().lower() == "yes" or (a.get("Result") or "").strip().upper() in ("FAILURE", "FAIL"):
            continue
        if (a.get("FROM__initiator_") or "").strip() == (a.get("TO__response_") or "").strip():
            continue
        want = "Patient Summary" if topic.startswith("ps") else "ePrescription"
        if want not in (a.get("Transaction_Type") or ""):
            continue
        if best is None or a["n"] > best[0]:
            best = (a["n"], m.group(1))
    return best[1] if best else None


def ncpeh_live():
    params = {"where": "1=1", "outFields": "Member_State,NAME,Year,Quarter,Is_Live__", "returnGeometry": "false",
              "resultRecordCount": 2000, "f": "json"}
    raw = arcgis_raw("arcgis_KPI_1_1b", "Join_KPI_1_1b_to_nuts0", params)
    url = (CACHE / "arcgis_KPI_1_1b.url").read_text().strip()
    by = {}
    for chunk in raw.split("\n"):
        if not chunk.strip():
            continue
        for m in re.finditer(r'\{"attributes":(\{[^{}]*\})\}', chunk):
            a = json.loads(m.group(1))
            iso = ISO2_TO_3.get(a["Member_State"].strip())
            if iso and a.get("Is_Live__") == "Yes":
                by.setdefault(iso, []).append((a["Quarter"], m.group(1)))
    return by, url


def pin_evidence():
    """EC Patient Information Notices: A notice = home-country side (sends), B notice = country of travel (receives)."""
    out = {}
    for iso, slug in PIN_SLUG.items():
        urls = [f"{PIN_BASE}{slug}_en", f"https://health.ec.europa.eu/patient-information-notices-{slug}_en"]
        for url in urls:
            code, raw, text = fetch(url, f"pin_{slug}", keep_raw=True)
            if code == 200 and "Patient Information Notices" in text and raw:
                break
        else:
            continue
        date = page_date(raw)
        main = re.search(r"<main.*?</main>", raw, re.S)
        links = re.findall(r'href="([^"]+\.pdf)"', main.group(0) if main else raw)
        res = {}
        for key, topic, label in (("epa", "ep_send", "ePrescription A"), ("psa", "ps_send", "Patient summary A"),
                                  ("epb", "ep_recv", "ePrescription B"), ("psb", "ps_recv", "Patient summary B")):
            pdfs = [l for l in links if f"_{key}_" in l.lower() or f"_{key}." in l.lower()]
            if not pdfs:
                continue
            line = next((ln.strip() for ln in text.split("\n") if label in ln), None)
            if not line:
                continue
            res[topic] = {"url": url, "date": date, "quote": line, "pdf": pdfs[0],
                          "cache": str(CACHE / f"pin_{slug}.txt")}
        out[iso] = res
    return out


def load_curated():
    facts = []
    if FACTS.is_dir() and list(FACTS.glob("*.json")):
        for p in sorted(FACTS.glob("*.json")):
            for f in json.loads(p.read_text()):
                f.setdefault("origin", "curated")
                f["origin_file"] = p.name
                facts.append(f)
        return facts
    if OUT.exists():
        doc = json.loads(OUT.read_text())
        seen = list(doc.get("global_facts", []))
        for e in doc["countries"].values():
            for t in TOPICS:
                seen += [f for f in e["myhealtheu"][t]["facts"] if f.get("origin") == "curated"]
            for key in ("other_arrangements", "no_exchange", "us_note"):
                seen += e[key]
        return seen
    return facts


# ---------------------------------------------------------------- person-carried fallback

ACCESS_KW = re.compile(r"\b(cop(y|ies)|download\w*|export\w*|PDF|FHIR|print\w*|machine-readable|portal|app|apps)\b", re.I)


def fallback(iso: str, d: dict):
    a = d["categories"]["access"]
    refs = []
    if ACCESS_KW.search(a["summary"]):
        refs.append({"path": f"data/{iso}.json", "field": "categories.access.summary", "text": a["summary"]})
    for i, x in enumerate(a["detail"]):
        if ACCESS_KW.search(x):
            refs.append({"path": f"data/{iso}.json", "field": f"categories.access.detail[{i}]", "text": x})
    alltext = " ".join([a["summary"]] + a["detail"])
    flags = {
        "copy_right_mentioned": bool(re.search(r"\bcop(y|ies)\b", alltext, re.I)),
        "machine_readable_or_fhir_mentioned": bool(re.search(r"machine-readable|FHIR", alltext, re.I)),
        "export_not_verified": bool(re.search(r"(export|download)[^.]{0,80}not (been )?verified|not verified[^.]{0,40}(export|download)", alltext, re.I)),
        "no_portal_stated": bool(re.search(r"\bno (national )?(patient )?portal\b|There is no national patient portal", alltext, re.I)),
    }
    return {"access_score": a["score"], "refs": refs, "keyword_flags": flags,
            "note": "Read from the country file, not re-researched. Flags are keyword matches; read the cited text."}


# ---------------------------------------------------------------- build

def fact_kpi(iso, topic, partners, url, raw, item_date):
    q = kpi_row_quote(raw, iso, topic)
    svc = "Patient Summary" if topic.startswith("ps") else "ePrescription"
    role = "as the country holding the record (responder)" if topic.endswith("send") else "as the country of care (initiator)"
    total = sum(partners.values())
    return {"country": iso, "topic": topic, "origin": "ec_kpi",
            "status": "unknown",   # the derived status lives on the topic block; see decide()
            "partners": sorted(partners),
            "detail": (f"EC MyHealth@EU KPI data record {total} non-test, non-failed cross-border {svc} transactions "
                       f"with this country {role} between {KPI_WINDOW[0]} and {KPI_WINDOW[1]}. The layer has no rows after "
                       f"{KPI_WINDOW[1]}, so it cannot show status in 2026."),
            "n_transactions": total,
            "url": url, "also": KPI_DASH, "publisher": "European Commission, DG SANTE (eHDSI Monitoring Framework, ArcGIS)",
            "date": item_date, "quote": q, "cache": str(CACHE / ("arcgis_KPI_1_5_2024on.txt" if topic.startswith("ps") else "arcgis_KPI_1_3b_2024on.txt"))}


def decide(nat, kpi, pin):
    """Decision rules D1 to D5 (METHOD.md). Returns (status, basis, confidence, as_of, conflict)."""
    nat_dated = [f for f in nat if f.get("status") in ("live", "planned", "not_live")]
    nat_dated.sort(key=lambda f: "" if f.get("date") in (None, "", "undated") else f["date"], reverse=True)
    total = sum(kpi.values()) if kpi else 0
    if nat_dated:
        f = nat_dated[0]
        conflict = (f["status"] != "live" and total >= KPI_STRONG)
        conf = "high" if (f.get("date") or "undated") not in ("undated",) and f["date"] >= "2025-01" else "medium"
        return f["status"], "national or official source", conf, f.get("date") or "undated", conflict
    if total >= KPI_STRONG:
        return "live", f"EC KPI transactions ({total})", "medium", KPI_WINDOW[1], False
    if total >= KPI_MIN and pin:
        return "live", f"EC KPI transactions ({total}) plus EC Patient Information Notice", "medium", KPI_WINDOW[1], False
    if total:
        return "unknown", f"only {total} EC KPI transactions and no matching EC notice", "low", KPI_WINDOW[1], False
    if pin:
        return "unknown", "EC Patient Information Notice only", "low", pin.get("date", "undated"), False
    return "unknown", "no evidence found", "low", None, False


def build():
    countries = {}
    for p in sorted(DATA.glob("*.json")):
        d = json.loads(p.read_text())
        countries[d["iso3"]] = d
    eu = set(EU27.values())
    eea = set(EEA3.values())

    curated = load_curated()
    kpi, kpi_src = kpi_directions()
    ncp, ncp_url = ncpeh_live()
    pins = pin_evidence()
    item_date = "2025-11-23"   # 'modified' of the KPI 1.1, 1.3 and 1.5 dashboard items (ArcGIS item metadata)

    by_cty = {}
    for f in curated:
        by_cty.setdefault(f.get("country"), []).append(f)

    out_c = {}
    for iso, d in countries.items():
        group = "EU" if iso in eu else ("EEA" if iso in eea else "other")
        cf = by_cty.get(iso, [])
        entry = {"name": d["name"], "region": d["region"], "group": group, "myhealtheu": {}, "ncpeh": None,
                 "other_arrangements": [f for f in cf if f.get("topic") == "other_arrangement"],
                 "no_exchange": [f for f in cf if f.get("topic") == "no_exchange"],
                 "us_note": [f for f in cf if f.get("topic") == "us_note"],
                 "fallback": fallback(iso, d)}
        entry["fallback"]["ehds"] = ({"applies": True, "download_right_from": "2029-03-26",
                                      "other_categories_from": "2031-03-26", "see": "global_facts topic ehds_download_right"}
                                     if group == "EU" else {"applies": "unknown (EEA incorporation not verified)" if group == "EEA" else False})
        for topic in TOPICS:
            nat = [f for f in cf if f.get("topic") == topic]
            k = kpi.get(iso, {}).get(topic, {})
            pin = pins.get(iso, {}).get(topic)
            facts = list(nat)
            if k:
                facts.append(fact_kpi(iso, topic, k, kpi_src[topic[:2]][0], kpi_src[topic[:2]][1], item_date))
            if pin:
                facts.append({"country": iso, "topic": topic, "origin": "ec_pin", "status": "unknown",
                              "detail": ("The European Commission publishes a Patient Information Notice for this service "
                                         "and direction. A notice shows the country prepared the service; it does not by itself prove it is live today."),
                              "url": pin["url"], "also": pin["pdf"], "publisher": "European Commission, DG SANTE",
                              "date": pin["date"], "quote": pin["quote"], "cache": pin["cache"]})
            if group == "other":
                status, basis, conf, as_of, conflict = "none found", "MyHealth@EU connects EU and EEA contact points; no third-country connection found", "medium", AS_OF, False
            else:
                status, basis, conf, as_of, conflict = decide(nat, k, pin)
            entry["myhealtheu"][topic] = {"status": status, "basis": basis, "confidence": conf, "evidence_as_of": as_of,
                                          "conflict": conflict, "kpi_partners": sorted(k), "facts": facts}
        if iso in ncp:
            qs = sorted(ncp[iso])
            entry["ncpeh"] = {"first_live_quarter": qs[0][0], "last_quarter_in_data": qs[-1][0],
                              "url": ncp_url, "also": KPI_DASH, "publisher": "European Commission, DG SANTE (KPI 1.1)",
                              "date": item_date, "quote": qs[0][1], "cache": str(CACHE / "arcgis_KPI_1_1b.txt")}
        out_c[iso] = entry

    # Pass 2: partner corroboration. A dated live fact for X naming partner Y in X.ps_send is
    # evidence for Y.ps_recv (and so on). It never changes a status; it adds dated support.
    mirror = {"ps_send": "ps_recv", "ps_recv": "ps_send", "ep_send": "ep_recv", "ep_recv": "ep_send"}
    for iso, entry in out_c.items():
        for topic in TOPICS:
            for f in entry["myhealtheu"][topic]["facts"]:
                if f.get("origin") != "curated" or f.get("status") != "live":
                    continue
                for partner in f.get("partners") or []:
                    if partner in out_c and partner != iso:
                        blk = out_c[partner]["myhealtheu"][mirror[topic]]
                        blk.setdefault("corroborated_by", []).append(
                            {"country": iso, "topic": topic, "url": f["url"], "date": f.get("date", "undated")})
    for entry in out_c.values():
        for topic in TOPICS:
            blk = entry["myhealtheu"][topic]
            dated = sorted(c["date"] for c in blk.get("corroborated_by", []) if c["date"] not in ("undated", None))
            blk["latest_partner_evidence"] = dated[-1] if dated else None

    global_facts = [f for f in curated if f.get("country") in ("EU", "WORLD", None)]
    doc = {
        "meta": {
            "as_of": AS_OF, "generated": dt.date.today().isoformat(),
            "scope": "Cross-border record exchange and person-carried fallback for every country file in data/.",
            "method": "analysis/crossborder/METHOD.md",
            "kpi_window": list(KPI_WINDOW), "kpi_strong": KPI_STRONG, "kpi_min_with_notice": KPI_MIN,
            "status_values": sorted(STATUSES),
            "topics": {"ps_send": "MyHealth@EU Patient Summary, this country holds the record and sends it (country A)",
                       "ps_recv": "MyHealth@EU Patient Summary, a doctor here can receive a visitor's summary (country B)",
                       "ep_send": "MyHealth@EU ePrescription, a prescription issued here can be dispensed abroad (country A)",
                       "ep_recv": "MyHealth@EU ePrescription, a pharmacy here can dispense a visitor's prescription (country B)"},
        },
        "global_facts": global_facts,
        "countries": out_c,
    }
    doc["meta"]["counts"] = counts(doc)
    OUT.write_text(json.dumps(doc, ensure_ascii=False, indent=1) + "\n")
    print(f"wrote {OUT} with {len(out_c)} countries")
    print(json.dumps(doc["meta"]["counts"], indent=1))
    errs = validate(doc)
    print(f"validator: {len(errs)} errors")
    for e in errs[:40]:
        print("  ", e)
    return doc


def counts(doc):
    c = {t: {} for t in TOPICS}
    for iso, e in doc["countries"].items():
        for t in TOPICS:
            s = e["myhealtheu"][t]["status"]
            if e["group"] != "other":
                c[t][s] = c[t].get(s, 0) + 1
    c["other_arrangement_countries"] = sorted(i for i, e in doc["countries"].items() if any(f.get("status") in ("live", "planned") for f in e["other_arrangements"]))
    c["other_arrangement_live_countries"] = sorted(i for i, e in doc["countries"].items() if any(f.get("status") == "live" for f in e["other_arrangements"]))
    c["none_found_no_live_exchange"] = sum(1 for e in doc["countries"].values()
                                           if e["group"] == "other" and not any(f.get("status") == "live" for f in e["other_arrangements"]))
    c["none_found_no_live_or_planned"] = sum(1 for e in doc["countries"].values()
                                             if e["group"] == "other" and not any(f.get("status") in ("live", "planned") for f in e["other_arrangements"]))
    c["ncpeh_operational_in_kpi"] = sorted(i for i, e in doc["countries"].items() if e["ncpeh"])
    return c


# ---------------------------------------------------------------- validate

EM_DASH = "\u2014"


def iter_facts(doc):
    for f in doc.get("global_facts", []):
        yield "global", f
    for iso, e in doc["countries"].items():
        for t in TOPICS:
            for f in e["myhealtheu"][t]["facts"]:
                yield iso, f
        for key in ("other_arrangements", "no_exchange", "us_note"):
            for f in e[key]:
                yield iso, f
        if e.get("ncpeh"):
            yield iso, dict(e["ncpeh"], status="live", detail="NCPeH operational quarter row")


def norm_ws(s):
    return re.sub(r"\s+", " ", s or "").strip()


def validate(doc, data_dir=DATA, check_cache=True):
    errs = []
    want = {json.loads(p.read_text())["iso3"] for p in Path(data_dir).glob("*.json")}
    have = set(doc.get("countries", {}))
    for iso in sorted(want - have):
        errs.append(f"missing country entry: {iso}")
    for iso in sorted(have - want):
        errs.append(f"entry with no country file: {iso}")
    for iso, e in doc.get("countries", {}).items():
        for t in TOPICS:
            if t not in e.get("myhealtheu", {}):
                errs.append(f"{iso}: missing topic {t}")
                continue
            blk = e["myhealtheu"][t]
            if blk["status"] not in STATUSES:
                errs.append(f"{iso}.{t}: bad status {blk['status']}")
            if blk["status"] in ("live", "planned", "not_live") and not any(
                    f.get("url") and f.get("quote") for f in blk["facts"]):
                errs.append(f"{iso}.{t}: status {blk['status']} with no sourced fact")
        if e.get("group") == "other" and not (e["other_arrangements"] or e["no_exchange"] or e["us_note"]):
            errs.append(f"{iso}: non-EU country has neither an arrangement nor a 'none found' record")
        for r in e.get("fallback", {}).get("refs", []):
            p = ROOT / r["path"]
            if p.exists():
                d = json.loads(p.read_text())
                m = re.match(r"categories\.access\.(summary|detail\[(\d+)\])", r["field"])
                val = d["categories"]["access"]["summary"] if m and m.group(1) == "summary" else (
                    d["categories"]["access"]["detail"][int(m.group(2))] if m else None)
                if val != r["text"]:
                    errs.append(f"{iso}: fallback ref {r['field']} text does not match {r['path']}")
    for iso, f in iter_facts(doc):
        st = f.get("status")
        tag = f"{iso}:{f.get('topic', 'ncpeh')}:{(f.get('url') or f.get('search') or '')[:60]}"
        if st not in STATUSES:
            errs.append(f"{tag}: bad status {st}")
        if st == "none found":
            if not f.get("search"):
                errs.append(f"{tag}: 'none found' without the search that was run")
            continue
        if st == "unknown" and not f.get("url"):
            if not f.get("search"):
                errs.append(f"{tag}: unknown without url or search")
            continue
        for k in ("url", "publisher", "date", "quote"):
            if not f.get(k):
                errs.append(f"{tag}: fact missing {k}")
        dte = f.get("date") or ""
        if dte and dte != "undated" and not re.match(r"^\d{4}(-\d{2}(-\d{2})?)?$", dte):
            errs.append(f"{tag}: bad date {dte}")
        if EM_DASH in (f.get("detail") or ""):
            errs.append(f"{tag}: em dash in detail")
        c = f.get("cache")
        if check_cache and f.get("quote") and c and c not in ("webfetch",) and Path(c).exists():
            if norm_ws(f["quote"]) not in norm_ws(Path(c).read_text(errors="ignore")):
                errs.append(f"{tag}: quote not found verbatim in cache {c}")
    for f in doc.get("global_facts", []):
        pass
    return errs


def selftest():
    doc = json.loads(OUT.read_text())
    base = validate(doc)
    bad = copy.deepcopy(doc)
    # plant 1: drop a country
    victim = sorted(bad["countries"])[0]
    del bad["countries"][victim]
    # plant 2: strip url from a sourced country fact whose status is not unknown
    iso2, t2, f2 = next((i, t, f) for i, e in bad["countries"].items() for t in TOPICS
                        for f in e["myhealtheu"][t]["facts"]
                        if f.get("url") and f.get("status") in ("live", "planned", "not_live"))
    f2["url"] = ""
    # plant 3: blank the quote of an arrangement or us_note fact (non-unknown)
    iso3, f3 = next((i, f) for i, e in bad["countries"].items() for f in e["us_note"] + e["other_arrangements"]
                    if f.get("quote") and f.get("status") != "none found")
    f3["quote"] = ""
    errs = [e for e in validate(bad) if e not in base]
    checks = {
        "missing country": any(e == f"missing country entry: {victim}" for e in errs),
        "fact without url": any(e.startswith(f"{iso2}:{t2}:") and "fact missing url" in e for e in errs),
        "fact without quote": any(e.startswith(f"{iso3}:") and "missing quote" in e for e in errs),
    }
    for k, v in checks.items():
        print(f"  planted {k}: {'caught' if v else 'MISSED'}")
    print(f"  baseline errors on the real file: {len(base)}")
    ok = all(checks.values())
    print("selftest", "PASS" if ok else "FAIL")
    return ok


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "validate"
    if cmd == "build":
        build()
    elif cmd == "validate":
        errs = validate(json.loads(OUT.read_text()))
        for e in errs:
            print(e)
        print(f"{len(errs)} errors")
        sys.exit(1 if errs else 0)
    elif cmd == "selftest":
        sys.exit(0 if selftest() else 1)
    else:
        print(__doc__)
        sys.exit(2)
