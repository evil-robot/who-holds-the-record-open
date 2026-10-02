"""DTI evidence grade: the eight published Data Trust Index dimensions (DTI paper, doi 10.5281/zenodo.19601616)
applied to the EVIDENCE behind each score. DTI was built for health data records; this is an adaptation, stated as such.
It grades the evidence, not the country's rights, and it changes no score.

Unit: one cell = one country x one category (its summary, detail and 1-4 sources). Country grade = cells weighted by the
index's category weights. Inputs: data/*.json, analysis/source_classes.csv (audit's publisher classes),
analysis/url_check.csv (link check). Output: analysis/dti/dti_evidence.json. Definitions: docs/DTI_EVIDENCE.md.
Run: /usr/bin/python3 scripts/dti_evidence.py      Tests: /usr/bin/python3 scripts/test_dti_evidence.py
"""
import csv, glob, importlib.util, json, os, re
from datetime import date

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# The audit's domain lists. classify() there labels any unlisted domain "news" (a catch-all), so a CSV row alone
# cannot say whether a class was listed or defaulted; listed() can. Since wave 1, news domains can be listed (S.NEWS).
_spec = importlib.util.spec_from_file_location("audit_sources", f"{ROOT}/analysis/sources.py")
S = importlib.util.module_from_spec(_spec); _spec.loader.exec_module(S)


def listed(url):
    dom = S.norm(url)
    return any(dom in x for x in (S.LEGAL_TEXT, S.INTERGOV, S.ACADEMIC, S.LAW_FIRM, S.BLOG_VENDOR, S.NEWS, S.OFFICIAL)) or bool(S.OFFICIAL_RE.search(dom))
DIMS = [("provenance", 25), ("consent", 20), ("recency", 15), ("quality", 10),
        ("concordance", 10), ("validation", 10), ("breadth", 5), ("stability", 5)]
CAT_W = {"access": 20, "control": 20, "privacy": 15, "journey": 15, "commercial": 10, "clinical": 10, "research": 5, "ai": 5}
TIERS = [(90, "Platinum"), (80, "Gold"), (70, "Silver"), (55, "Bronze"), (0, "Below Bronze")]  # DTI paper section 3.3

# Provenance: how close the publisher is to the fact (classes from analysis/source_classes.csv, written by the audit;
# a source with no audit row falls back to the author's own "publisherClass" field, then to the weakest class).
CLASS_W = {"legal_text": 1.0, "official": 1.0, "intergov": 1.0, "academic": 0.8, "news": 0.6, "law_firm": 0.5, "blog_vendor": 0.3}
PRIMARY = {"legal_text", "official", "intergov"}
# Consent, adapted for public evidence = open availability: anyone can open the source today (analysis/url_check.csv).
# Anything not proven to open (blocked, unresolved redirect, not yet checked) is "not verified" = 0.5, never 1 and never 0.
LINK_W = {"ok": 1.0, "blocked_unverified": 0.5, "other_302": 0.5, "other_307": 0.5, "unchecked": 0.5, "error": 0.0, "dead": 0.0}

# Validation: the author says a fact in the cell was not verified (same phrase family the consistency audit counted).
UNVERIFIED = re.compile(r"\bnot (?:independently |been )?verified\b|\bunverified\b|\bcould not (?:be )?(?:verif(?:y|ied)|confirm(?:ed)?|check(?:ed)?)\b"
                        r"|\bnot (?:been )?confirmed\b|\bnot checked\b", re.I)

# Stability = test-retest: cells the consistency audit found scored differently from the same regime elsewhere
# (analysis/consistency_audit.md findings 1 to 4). Keyed by finding: when a finding is ruled on, delete that key.
# Findings 1 to 4 cleared 1 Oct 2026 (JAS ruling, applied to the v1.1 anchors; every change and every kept cell is in
# docs/SCORE_CHANGES.md). The mechanism stays for the next finding: add {n: {(iso, category), ...}}.
RETEST = {}
# Under review but NOT a reliability failure: shown as metadata, scored elsewhere. Finding 5 (KOR privacy, now scored on
# the general law under the anchor) and finding 6 (BEL, confidence now computed) cleared 1 Oct 2026.
OTHER_REVIEW = {}

SLD = {"gov", "go", "gob", "gouv", "govt", "gv", "gc", "nic", "co", "com", "ac", "edu", "org", "or", "net", "ne", "nhs", "mil", "lg"}


def publisher(url):
    """Registrable domain, a structural stand-in for 'same publisher' (m.korea.kr and korea.kr are one publisher)."""
    m = re.match(r"https?://([^/:]+)", url or "")
    if not m: return None
    parts = m.group(1).lower().split(".")
    keep = 3 if len(parts) >= 3 and len(parts[-1]) == 2 and parts[-2] in SLD else 2
    return ".".join(parts[-keep:])


def pub_date(src, as_of):
    """(year, month) of publication, or None. A date equal to asOf is the v1 access date, not a publication date."""
    raw = str(src.get("date") or "")
    if raw == as_of.isoformat(): return None
    m = re.match(r"(\d{4})(?:-(\d{2}))?", raw)
    return (int(m.group(1)), int(m.group(2) or 6)) if m else None


# A statute in force is current wherever it is published (ruling 1 Oct 2026): legal_text class, an author class of
# legal_text, or an official source whose title names a law (English and the index's main languages).
STATUTE = re.compile(r"\b(act|law|regulation|decree|code|cfr|statute|ordinance|directive|gesetz|verordnung|loi|ley|lei|legge|decreto|wet|lag|lov|laki|seadus|zakon|ustawa|t\u00f6rv\u00e9ny|z\u00e1kon|zakon|kanun|nomos)\b", re.I)


def recency_w(src, cls, as_of):
    if cls == "legal_text" or src.get("publisherClass") == "legal_text" or (cls == "official" and STATUTE.search(src.get("title") or "")):
        return 1.0  # a law in force is current however old its date (paper: genomic variant, infinite half-life)
    pd = pub_date(src, as_of)
    if pd is None:
        return 0.3  # undated: unknown history recorded as unknown, never assumed fresh
    months = (as_of.year - pd[0]) * 12 + (as_of.month - pd[1])
    return 1.0 if months <= 24 else 0.6 if months <= 60 else 0.3


def grade(score):
    return next(name for cut, name in TIERS if score >= cut)


# SuperTruth extension, not in the DTI paper (JAS ruling 1 Oct 2026, from the DTI review): the tier LABEL is capped at
# Silver when the evidence has no primary source (cell) or fewer than 4 of 8 categories cite one (country). The number is not changed.
TIER_ORDER = [name for _, name in TIERS][::-1]
def capped(tier, cap="Silver"):
    return tier if TIER_ORDER.index(tier) <= TIER_ORDER.index(cap) else cap


def score_cell(cell, iso, k, as_of, classes, links, retest=RETEST, other_review=OTHER_REVIEW):
    srcs = cell.get("sources") or []
    n = len(srcs) or 1
    cls, cls_from, link, link_from = [], [], [], []
    for s in srcs:
        # precedence: audit's listed domain > author's publisherClass > audit's catch-all "news" > weakest class
        r = classes.get((iso, k, s["url"]))
        if r and listed(s["url"]): cls.append(r["publisher_class"]); cls_from.append("audit")
        elif s.get("publisherClass"): cls.append(s["publisherClass"]); cls_from.append("author")
        elif r: cls.append(r["publisher_class"]); cls_from.append("auditDefault")
        else: cls.append("blog_vendor"); cls_from.append("none")  # unclassified counts as weakest, never strongest
        r = links.get(s["url"])
        link.append(LINK_W.get(r["final_outcome"] if r else "unchecked", 0.0)); link_from.append("checked" if r else "unchecked")
    text = " ".join([cell.get("summary", "")] + list(cell.get("detail") or []))
    pubs = {p for p in (publisher(s["url"]) for s in srcs) if p}
    # Quality = field-level completeness of the evidence record: summary, detail, at least one source, and for every
    # source a title, an http URL and a publication date.
    fields = [bool(cell.get("summary")), bool(cell.get("detail")), bool(srcs)]
    for s in srcs:
        fields += [bool(s.get("title")), bool(re.match(r"https?://", s.get("url") or "")), pub_date(s, as_of) is not None]
    in_retest = sorted(f for f, cs in retest.items() if (iso, k) in cs)
    in_other = sorted(f for f, cs in other_review.items() if (iso, k) in cs)
    dims = {
        "provenance": 100 * sum(CLASS_W.get(x, 0.3) for x in cls) / n if srcs else 0,
        "consent": 100 * sum(link) / n if srcs else 0,
        "recency": 100 * sum(recency_w(s, x, as_of) for s, x in zip(srcs, cls)) / n if srcs else 0,
        "quality": 100 * sum(fields) / len(fields),
        # paper 4.3 / Table 1: one source = neutral 50; corroborated by 2+ independent publishers = 80 (anchor floor,
        # because agreement between the sources is not machine-checked)
        "concordance": 0 if not pubs else 50 if len(pubs) == 1 else 80,
        "validation": 30 if UNVERIFIED.search(text) else 100,
        "breadth": {0: 0, 1: 40, 2: 70, 3: 90}.get(len(set(cls)), 100),  # distinct kinds of evidence (publisher classes)
        "stability": 40 if in_retest else 100,
    }
    dti = sum(dims[name] * w for name, w in DIMS) / 100
    prim = sum(x in PRIMARY for x in cls) / n
    return {"dti": round(dti), "dtiExact": round(dti, 2), "tier": grade(dti) if prim > 0 else capped(grade(dti)),
            "tierCapped": prim == 0 and grade(dti) != capped(grade(dti)), "dims": {a: round(b) for a, b in dims.items()},
            "primaryShare": round(sum(x in PRIMARY for x in cls) / n, 2),
            "classFrom": {x: cls_from.count(x) for x in sorted(set(cls_from))},
            "uncheckedLinks": link_from.count("unchecked"), "unverifiedText": bool(UNVERIFIED.search(text)),
            "findings": in_retest + in_other, "underReview": bool(in_retest or in_other)}


def load_csv(p, key):
    out = {}
    with open(p, newline="") as f:
        for r in csv.DictReader(f):
            out.setdefault(key(r), r)
    return out


def main():
    classes = load_csv(f"{ROOT}/analysis/source_classes.csv", lambda r: (r["iso3"], r["category"], r["url"]))
    links = load_csv(f"{ROOT}/analysis/url_check.csv", lambda r: r["url"])
    out = {}
    for f in sorted(glob.glob(f"{ROOT}/data/*.json")):
        d = json.load(open(f)); iso = d["iso3"]; as_of = date.fromisoformat(d["asOf"])
        cells = {k: score_cell(c, iso, k, as_of, classes, links) for k, c in d["categories"].items()}
        country = sum(cells[k]["dtiExact"] * w for k, w in CAT_W.items()) / 100
        unchecked = sum(c["uncheckedLinks"] for c in cells.values())
        not_audited = sum(c["classFrom"].get("author", 0) + c["classFrom"].get("none", 0) for c in cells.values())
        prim_cats = sum(cells[k]["primaryShare"] > 0 for k in CAT_W)
        out[iso] = {"dti": round(country), "dtiExact": round(country, 2),
                    "tier": grade(country) if prim_cats >= 4 else capped(grade(country)),
                    "tierCapped": prim_cats < 4 and grade(country) != capped(grade(country)), "primaryCategories": prim_cats, "cells": cells,
                    "underReview": sorted(k for k in CAT_W if cells[k]["underReview"]),
                    "uncheckedLinks": unchecked, "classesNotAudited": not_audited,
                    "classesAuditDefault": sum(c["classFrom"].get("auditDefault", 0) for c in cells.values()),
                    # provisional = some input was not measured independently of the author; not published
                    "provisional": bool(unchecked or not_audited)}
    os.makedirs(f"{ROOT}/analysis/dti", exist_ok=True)
    meta = {"method": "DTI dimensions (Provenance 25, Consent 20, Recency 15, Quality 10, Concordance 10, Validation 10, Breadth 5, Stability 5) applied to the evidence behind each score; see docs/DTI_EVIDENCE.md",
            "tiers": {name: cut for cut, name in TIERS}, "asOfRun": date.today().isoformat(),
            "inputs": ["data/*.json", "analysis/source_classes.csv", "analysis/url_check.csv"],
            "stabilityFindingsOpen": sorted(RETEST), "otherFindingsOpen": sorted(OTHER_REVIEW),
            "uncheckedLinks": sum(v["uncheckedLinks"] for v in out.values()),
            "classesNotAudited": sum(v["classesNotAudited"] for v in out.values()),
            "classesAuditDefault": sum(v["classesAuditDefault"] for v in out.values()),
            "provisionalCountries": sorted(i for i, v in out.items() if v["provisional"])}
    json.dump({"meta": meta, "countries": out}, open(f"{ROOT}/analysis/dti/dti_evidence.json", "w"), indent=1)
    xs = sorted(out.items(), key=lambda kv: -kv[1]["dtiExact"])
    print(f"{len(out)} countries; unchecked links {meta['uncheckedLinks']}; classes not audited {meta['classesNotAudited']}; "
          f"provisional {len(meta['provisionalCountries'])}")
    for iso, v in xs:
        print(iso, v["dti"], v["tier"], "PROVISIONAL" if v["provisional"] else "",
              "review:" + ",".join(v["underReview"]) if v["underReview"] else "")


if __name__ == "__main__":
    main()
