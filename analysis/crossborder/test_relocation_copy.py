#!/usr/bin/env python3
"""Validator for analysis/crossborder/relocation_and_copy.json.

Usage
  python3 analysis/crossborder/test_relocation_copy.py            # validate, then selftest
  python3 analysis/crossborder/test_relocation_copy.py validate
  python3 analysis/crossborder/test_relocation_copy.py selftest   # plant 3 errors in a copy, prove each is caught
  python3 -m pytest analysis/crossborder/test_relocation_copy.py

Checks
  1. One entry per data/*.json file, and no extra entries.
  2. Shape the traveller build reads: relocation.summary / relocation.prescriptions with conclusion
     in {visitor_only, serves_residents, not_stated}, copyRight and electronic in {yes, no, not stated},
     copyParts a subset of the five parts, copySource {title, url, date}, copyQuote.
  3. Every value other than "not stated" / "not_stated" carries a url and a quote.
  4. Quotes taken from a country file are found word for word in the named field of data/ISO3.json.
  5. Quotes taken from a web page are found word for word (whitespace collapsed) in the cached page text,
     when the cache exists ($XB2_CACHE, default /tmp/xb2/src). Without the cache this check is skipped
     and the run says so.
  6. No em dash anywhere in the JSON or in this file.
This script never writes under data/.
"""
import copy
import json
import os
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
DATA = ROOT / "data"
OUT = HERE / "relocation_and_copy.json"
CACHE = Path(os.environ.get("XB2_CACHE", "/tmp/xb2/src"))
PARTS = ["summary", "prescriptions", "labs", "images", "notes"]
CONCL = {"visitor_only", "serves_residents", "not_stated"}
TRI = {"yes", "no", "not stated"}
DASH = chr(0x2014)  # em dash


def norm(s):
    return re.sub(r"\s+", " ", s or "").strip()


def field_text(iso, field):
    """Text of categories.access.<summary|detail[i]> in data/ISO3.json."""
    a = json.loads((DATA / f"{iso}.json").read_text())["categories"]["access"]
    f = field.split("categories.access.", 1)[-1]
    m = re.fullmatch(r"detail\[(\d+)\]", f)
    if m:
        d = a["detail"]
        return d[int(m.group(1))] if int(m.group(1)) < len(d) else None
    return a.get(f)


_cache = {}


def cached(name):
    if name not in _cache:
        p = CACHE / name
        _cache[name] = norm(p.read_text(errors="ignore")) if p.exists() else None
    return _cache[name]


def page_quote_ok(errs, where, cache_name, quote):
    txt = cached(cache_name) if cache_name else None
    if txt is None:
        return False
    if norm(quote) not in txt:
        errs.append(f"{where}: quote not found in cached page {cache_name}: {quote[:80]!r}")
    return True


def has_src(s):
    return isinstance(s, dict) and all(isinstance(s.get(k), str) and s.get(k) for k in ("title", "url", "date"))


def validate(doc, check_pages=True):
    errs, notes = [], []
    isos = sorted(p.stem for p in DATA.glob("*.json"))
    C = doc.get("countries", {})
    missing = sorted(set(isos) - set(C))
    extra = sorted(set(C) - set(isos))
    if missing:
        errs.append(f"countries missing an entry: {missing}")
    if extra:
        errs.append(f"entries with no country file: {extra}")
    if doc.get("meta", {}).get("as_of") != "2026-10-02":
        errs.append("meta.as_of must be 2026-10-02")

    # caches named by sources in the document, keyed by url
    cache_by_url = {}
    for f in doc.get("relocation_findings", []):
        cache_by_url[f["url"]] = f.get("cache")
    checked_pages = 0

    for iso, e in sorted(C.items()):
        w = iso
        grp = e.get("group")
        # relocation
        rel = e.get("relocation")
        if grp in ("EU", "EEA") and not isinstance(rel, dict):
            errs.append(f"{w}: EU/EEA country needs a relocation block")
        if isinstance(rel, dict):
            for ch in ("summary", "prescriptions"):
                b = rel.get(ch)
                if not isinstance(b, dict):
                    errs.append(f"{w}: relocation.{ch} missing")
                    continue
                if b.get("conclusion") not in CONCL:
                    errs.append(f"{w}: relocation.{ch}.conclusion {b.get('conclusion')!r} not allowed")
                if b.get("conclusion") != "not_stated" and not (has_src(b.get("source")) and b.get("quote")):
                    errs.append(f"{w}: relocation.{ch} is {b.get('conclusion')} without source url and quote")
                if grp in ("EU", "EEA") and not (has_src(b.get("source")) and b.get("quote")):
                    errs.append(f"{w}: relocation.{ch} needs source and quote")
            eh = rel.get("ehds_2029")
            if isinstance(eh, dict):
                if eh.get("conclusion") not in CONCL:
                    errs.append(f"{w}: relocation.ehds_2029.conclusion not allowed")
                if eh.get("conclusion") != "not_stated" and not (has_src(eh.get("source")) and eh.get("quote")):
                    errs.append(f"{w}: relocation.ehds_2029 lacks source url and quote")
        # copy right
        cr, el = e.get("copyRight"), e.get("electronic")
        if cr not in TRI:
            errs.append(f"{w}: copyRight {cr!r} not allowed")
        if el not in TRI:
            errs.append(f"{w}: electronic {el!r} not allowed")
        if cr != "not stated" or el != "not stated":
            if not (has_src(e.get("copySource")) and e.get("copyQuote")):
                errs.append(f"{w}: copyRight={cr} electronic={el} without copySource url and copyQuote")
        if el == "yes" and not (e.get("electronicQuote") or e.get("copyQuote")):
            errs.append(f"{w}: electronic yes without a quote")
        if "copyParts" in e:
            cp = e["copyParts"]
            if cr != "yes":
                errs.append(f"{w}: copyParts given but copyRight is {cr}")
            if not isinstance(cp, list) or not cp or any(p not in PARTS for p in cp) or len(set(cp)) != len(cp):
                errs.append(f"{w}: copyParts {cp!r} must be a non-empty subset of {PARTS}")
        # file-derived quotes
        for r in e.get("refs", []):
            if r.get("path") != f"data/{iso}.json":
                errs.append(f"{w}: ref path {r.get('path')} is not this country's file")
                continue
            t = field_text(iso, r.get("field", ""))
            if t is None or r.get("quote", "") not in t:
                errs.append(f"{w}: quote not in {r.get('path')} {r.get('field')}: {r.get('quote', '')[:80]!r}")
        if e.get("refs") and e.get("copyQuote") not in [r["quote"] for r in e["refs"]]:
            errs.append(f"{w}: copyQuote is not one of the file refs")
        if e.get("electronicQuote") and e.get("refs") and e["electronicQuote"] not in [r["quote"] for r in e["refs"]]:
            errs.append(f"{w}: electronicQuote is not one of the file refs")
        if grp == "other" and iso != "USA":
            if not e.get("refs"):
                errs.append(f"{w}: non-EU entry needs refs into the country file")
            else:
                a = json.loads((DATA / f"{iso}.json").read_text())["categories"]["access"]
                if e["copySource"]["url"] not in [s["url"] for s in a["sources"]]:
                    errs.append(f"{w}: copySource url is not one of the file's access sources")
        n = e.get("national")
        if n:
            t = field_text(iso, n.get("field", ""))
            if t is None or n.get("quote", "") not in t:
                errs.append(f"{w}: national quote not in {n.get('path')} {n.get('field')}")
            a = json.loads((DATA / f"{iso}.json").read_text())["categories"]["access"]
            cv = n.get("caveat")
            if cv and cv.get("quote", "") not in (field_text(iso, cv.get("field", "")) or ""):
                errs.append(f"{w}: national caveat quote not in data/{iso}.json {cv.get('field')}")
            if not has_src(n.get("source")) or n["source"]["url"] not in [s["url"] for s in a["sources"]]:
                errs.append(f"{w}: national source is not one of the file's access sources")
        # page-derived quotes
        if check_pages:
            if grp in ("EU", "EEA"):
                for q in (e.get("copyQuote"), e.get("electronicQuote"), e["portability"]["quote"], e["portability"]["quote2"]):
                    checked_pages += page_quote_ok(errs, f"{w} GDPR", "32016R0679.txt", q)
                if grp == "EEA":
                    checked_pages += page_quote_ok(errs, f"{w} EEA", "eea_154_2018.txt", e.get("eeaQuote"))
                for ch in ("summary", "prescriptions"):
                    b = rel[ch]
                    checked_pages += page_quote_ok(errs, f"{w} relocation.{ch}", cache_by_url.get(b["source"]["url"]), b["quote"])
                eh = rel.get("ehds_2029", {})
                if eh.get("quote"):
                    checked_pages += page_quote_ok(errs, f"{w} ehds_2029", "32025R0327.txt", eh["quote"])
                    checked_pages += page_quote_ok(errs, f"{w} ehds_2029 recital", "32025R0327.txt", eh["recital_quote"])
            if iso == "USA":
                for q in (e.get("copyQuote"), e.get("electronicQuote")):
                    checked_pages += page_quote_ok(errs, f"{w} HIPAA", e.get("cache"), q)

    # relocation findings
    ids = set()
    for f in doc.get("relocation_findings", []):
        ids.add(f.get("id"))
        for k in ("url", "publisher", "date", "quote", "title"):
            if not f.get(k):
                errs.append(f"finding {f.get('id')}: missing {k}")
        if check_pages:
            checked_pages += page_quote_ok(errs, f"finding {f.get('id')}", f.get("cache"), f.get("quote", ""))
    rc = doc.get("relocation_conclusion", {})
    for k, v in rc.items():
        if isinstance(v, dict) and "finding_ids" in v:
            for i in v["finding_ids"]:
                if i not in ids:
                    errs.append(f"relocation_conclusion.{k}: unknown finding id {i}")
    for ch in ("summary", "prescriptions"):
        c = rc.get("conclusion", {}).get(ch, {})
        if c.get("today") not in CONCL or c.get("ehds_2029") not in CONCL:
            errs.append(f"relocation_conclusion.conclusion.{ch} has a value outside {sorted(CONCL)}")

    # em dashes
    if DASH in json.dumps(doc, ensure_ascii=False):
        errs.append("em dash found in the JSON")
    if DASH in Path(__file__).read_text():
        errs.append("em dash found in the validator")

    if check_pages and checked_pages == 0:
        notes.append(f"page quote check skipped: no cache at {CACHE}")
    return errs, notes


def run_validate():
    doc = json.loads(OUT.read_text())
    errs, notes = validate(doc)
    for n in notes:
        print("note:", n)
    for e in errs:
        print("ERROR:", e)
    print(f"validate: {len(doc['countries'])} countries, {len(errs)} errors")
    return not errs


def run_selftest():
    base = json.loads(OUT.read_text())
    ok = True
    plants = []
    d1 = copy.deepcopy(base); d1["countries"].pop("BRA")
    plants.append(("drop the Brazil entry", d1, "countries missing an entry"))
    d2 = copy.deepcopy(base); d2["countries"]["KEN"]["copySource"]["url"] = ""
    plants.append(("Kenya copyRight yes with no url", d2, "KEN: copyRight=yes"))
    d3 = copy.deepcopy(base); d3["countries"]["PER"]["refs"][0]["quote"] = d3["countries"]["PER"]["refs"][0]["quote"].replace("five", "ten")
    plants.append(("Peru quote altered (five to ten working days)", d3, "PER: quote not in data/PER.json"))
    for label, doc, expect in plants:
        errs, _ = validate(doc, check_pages=False)
        hit = any(expect in e for e in errs)
        ok &= hit
        print(f"selftest: {label}: {'caught' if hit else 'MISSED'}")
    return ok


def test_validate():
    assert run_validate()


def test_selftest():
    assert run_selftest()


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "all"
    good = True
    if cmd in ("validate", "all"):
        good &= run_validate()
    if cmd in ("selftest", "all"):
        good &= run_selftest()
    sys.exit(0 if good else 1)
