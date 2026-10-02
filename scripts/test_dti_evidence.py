"""Adversarial tests for scripts/dti_evidence.py (ds-rigor gate 11: a verifier is guilty until attacked).

Each test plants a bad cell next to a clean control cell and checks the grade moves the right way. The last two run on
the real data: degrading any input never raises a grade, and every cell admitting an unverified fact loses Validation.
Run: /usr/bin/python3 scripts/test_dti_evidence.py   (exit 1 on any failure). Reads data/ and analysis/, writes nothing.
DTI_MODULE_DIR=<dir> runs the same tests against another copy of the module (used to prove they fail on the old one).
"""
import copy, glob, json, os, sys
from datetime import date

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.environ.get("DTI_MODULE_DIR", HERE))
import dti_evidence as D

AS_OF = date(2026, 10, 1)
ISO, CAT = "ZZZ", "access"   # planted country code: not in any finding list, not in data/
U = ["https://www.health.gov.zz/record-rights", "https://laws.example-legal.org/act-12", "https://news.example-times.com/story"]
# the third URL is not on the audit's lists, so its "news" row is the catch-all default; test 10d relies on that
CTRL_CLASSES = {(ISO, CAT, U[0]): {"publisher_class": "official"}, (ISO, CAT, U[1]): {"publisher_class": "legal_text"},
                (ISO, CAT, U[2]): {"publisher_class": "news"}}
CTRL_LINKS = {u: {"final_outcome": "ok"} for u in U}


def control():
    return {"score": 50, "summary": "Patients get a copy within 30 days under the Records Act 2020.",
            "detail": ["The Act sets a 30 day deadline.", "A national portal lists labs.", "Uptake was 40% in 2025."],
            "sources": [{"title": "Ministry page", "url": U[0], "date": "2026-03"},
                        {"title": "Records Act 2020", "url": U[1], "date": "2020-05-01"},
                        {"title": "Portal uptake story", "url": U[2], "date": "2026-02-10"}]}


def score(cell, classes=CTRL_CLASSES, links=CTRL_LINKS, iso=ISO, cat=CAT, **kw):
    return D.score_cell(cell, iso, cat, AS_OF, classes, links, **kw)


BASE = score(control())
FAILS = []


def check(name, ok, detail=""):
    print(("PASS " if ok else "FAIL ") + name + (f"  [{detail}]" if detail else ""))
    if not ok: FAILS.append(name)


def lower(name, s, dim=None):
    """planted cell must grade strictly below the control, and on the named dimension too"""
    d = f"dti {s['dtiExact'] if 'dtiExact' in s else s['dti']} vs control {BASE.get('dtiExact', BASE['dti'])}"
    ok = s.get("dtiExact", s["dti"]) < BASE.get("dtiExact", BASE["dti"])
    if dim: ok = ok and s["dims"][dim] < BASE["dims"][dim]; d += f"; {dim} {s['dims'][dim]} vs {BASE['dims'][dim]}"
    check(name, ok, d)


# 0. the control itself is clean and strong
check("control cell is clean (no flags, all dims >= 80 except breadth)", BASE["tier"] in ("Platinum", "Gold")
      and all(v >= 80 for k, v in BASE["dims"].items() if k != "breadth"), str(BASE["dims"]))

# 1. all blog/vendor sources
blog = {k: {"publisher_class": "blog_vendor"} for k in CTRL_CLASSES}
lower("1 all-blog sources lower Provenance and grade", score(control(), classes=blog), "provenance")

# 2. all dead links; unchecked links sit strictly between dead and ok
dead = {u: {"final_outcome": "dead"} for u in U}
s_dead, s_unch = score(control(), links=dead), score(control(), links={})
lower("2a all-dead links lower Consent and grade", s_dead, "consent")
check("2b unchecked links grade above all-dead (not measured is not dead)", s_unch["dims"]["consent"] > s_dead["dims"]["consent"],
      f"unchecked {s_unch['dims']['consent']} vs dead {s_dead['dims']['consent']}")
lower("2c unchecked links grade below all-ok (not measured is not proven)", s_unch, "consent")

# 3. unresolved redirect is not proven open
lower("3 unresolved 302 redirect is not verified", score(control(), links={**CTRL_LINKS, U[2]: {"final_outcome": "other_302"}}), "consent")

# 4. one undated news source
c = control(); c["sources"][2]["date"] = "n.d."
lower("4a one undated news source lowers Recency", score(c), "recency")
c = control(); c["sources"][2]["date"] = ""
lower("4b one blank-dated source lowers Quality (missing field)", score(c), "quality")

# 5. access date masquerading as publication date (v1 files used asOf as 'date')
c = control(); c["sources"][2]["date"] = AS_OF.isoformat()
lower("5 a source dated with the asOf access date is treated as undated", score(c), "recency")

# 6. "not verified" admission, in the summary and in other wordings, in the detail
for i, phrase in enumerate(["The 30 day deadline was not verified.", "Uptake could not be confirmed.",
                            "The fee rule is unverified.", "We could not verify the portal count."]):
    c = control(); (c["detail"].append if i else lambda t: c.__setitem__("summary", c["summary"] + " " + t))(phrase)
    lower(f"6.{i} admission '{phrase}' lowers Validation", score(c), "validation")
c = control(); c["detail"].append("No rule on fees was found in the Act.")  # statement of absence is a finding
check("6.x statement of absence is NOT an admission", score(c)["dims"]["validation"] == 100)

# 7. a cell under review for test-retest (finding 2) loses Stability; a finding-6 cell is flagged but not double-scored
lower("7a a cell in an open test-retest finding loses Stability", score(control(), retest={99: {(ISO, CAT)}}), "stability")
s_bel = D.score_cell(control(), "BEL", "control", AS_OF, {("BEL", "control", u): v for (_, _, u), v in CTRL_CLASSES.items()}, CTRL_LINKS,
                     other_review={6: {("BEL", "control")}})  # planted: real finding 6 cleared 1 Oct 2026
check("7b finding-6 cell (BEL control) is flagged underReview but keeps Stability 100",
      s_bel["dims"]["stability"] == 100 and s_bel.get("underReview") is True, str(s_bel["dims"]["stability"]))

# 8. same publisher on two hostnames is not corroboration
one = ["https://www.korea.kr/a", "https://m.korea.kr/b"]
s1 = score({**control(), "sources": [{"title": "a", "url": one[0], "date": "2026-01"}, {"title": "b", "url": one[1], "date": "2026-01"}]},
           classes={(ISO, CAT, u): {"publisher_class": "official"} for u in one}, links={u: {"final_outcome": "ok"} for u in one})
s0 = score({**control(), "sources": [{"title": "a", "url": one[0], "date": "2026-01"}]},
           classes={(ISO, CAT, one[0]): {"publisher_class": "official"}}, links={one[0]: {"final_outcome": "ok"}})
check("8 korea.kr + m.korea.kr add no Concordance or Breadth over korea.kr alone",
      s1["dims"]["concordance"] == s0["dims"]["concordance"] and s1["dims"]["breadth"] == s0["dims"]["breadth"],
      f"concordance {s1['dims']['concordance']} vs {s0['dims']['concordance']}; breadth {s1['dims']['breadth']} vs {s0['dims']['breadth']}")

# 9. three independent secondary publishers corroborate more than one (concordance is independence, not class)
sec = ["https://a-news.com/x", "https://b-law.com/y", "https://c-journal.org/z"]
def sec_cell(urls):
    return score({**control(), "sources": [{"title": "t", "url": u, "date": "2026-01"} for u in urls]},
                 classes={(ISO, CAT, u): {"publisher_class": "news"} for u in urls}, links={u: {"final_outcome": "ok"} for u in urls})
check("9 three independent secondary publishers beat one on Concordance",
      sec_cell(sec)["dims"]["concordance"] > sec_cell(sec[:1])["dims"]["concordance"])

# 10. author-declared class is used when the audit has no row, and stamped as not audited
c = control(); c["sources"][0]["publisherClass"] = "official"
s = score(c, classes={k: v for k, v in CTRL_CLASSES.items() if k[2] != U[0]})
check("10a author publisherClass used when audit has no row", s["dims"]["provenance"] == BASE["dims"]["provenance"])
check("10b and stamped as author-declared", s.get("classFrom", {}).get("author") == 1, str(s.get("classFrom")))
c = control(); c["sources"][2]["publisherClass"] = "academic"
s = score(c)
check("10d author class beats the audit's catch-all 'news' for an unlisted domain, stamped author",
      s.get("classFrom", {}).get("author") == 1 and s["dims"]["provenance"] > BASE["dims"]["provenance"], str(s.get("classFrom")))
s = score({**control(), "sources": [{"title": "t", "url": "https://eurohealthobservatory.who.int/x", "date": "2026-01", "publisherClass": "blog_vendor"}]},
          classes={(ISO, CAT, "https://eurohealthobservatory.who.int/x"): {"publisher_class": "intergov"}}, links={"https://eurohealthobservatory.who.int/x": {"final_outcome": "ok"}})
check("10e audit's listed class beats the author's for a listed domain", s["dims"]["provenance"] == 100 and s.get("classFrom") == {"audit": 1}, str(s.get("classFrom")))
s = score(control(), classes={})
check("10c unclassified sources count as weakest", s["dims"]["provenance"] == 30, str(s["dims"]["provenance"]))
# 10f-10h (wave 1): a listed news domain is audited; archive snapshots class by the archived domain and cannot launder
nu = "https://www.vg.hu/story"
s = score({**control(), "sources": [{"title": "t", "url": nu, "date": "2026-01", "publisherClass": "official"}]},
          classes={(ISO, CAT, nu): {"publisher_class": "news"}}, links={nu: {"final_outcome": "ok"}})
check("10f audit's NEWS list beats the author's class, stamped audit", s["dims"]["provenance"] == 60 and s.get("classFrom") == {"audit": 1}, str(s.get("classFrom")))
check("10g archived official page is listed and classed official",
      D.listed("https://web.archive.org/web/20260801073650/https://health.gov.mt/x") and D.S.classify(D.S.norm("https://web.archive.org/web/20260801073650/https://health.gov.mt/x")) == "official")
check("10h archived unlisted page stays unlisted (archive host does not launder a class)",
      not D.listed("https://web.archive.org/web/20260101000000/" + U[2]) and not D.listed("https://web.archive.org/"))

# 11. everything bad at once lands below Bronze
c = control(); c["summary"] += " Not verified."
for x in c["sources"]: x["date"] = "n.d."
worst = score(c, classes=blog, links=dead, iso="IRL", cat="access")
check("11 all-bad cell grades Below Bronze", worst["tier"] == "Below Bronze", f"{worst['dti']} {worst['tier']}")

# 12. real data: degrading an input never raises a grade (monotonicity), on every cell
root = os.path.dirname(HERE)
classes = D.load_csv(f"{root}/analysis/source_classes.csv", lambda r: (r["iso3"], r["category"], r["url"]))
links = D.load_csv(f"{root}/analysis/url_check.csv", lambda r: r["url"])
dead_all = {u: {"final_outcome": "dead"} for u in links}
blog_all = {k: {"publisher_class": "blog_vendor"} for k in classes}
bad, n, missed = 0, 0, []
for f in sorted(glob.glob(f"{root}/data/*.json")):
    d = json.load(open(f)); a = date.fromisoformat(d["asOf"])
    for k, cell in d["categories"].items():
        n += 1
        base = D.score_cell(cell, d["iso3"], k, a, classes, links)["dims"]
        for cl, li in ((classes, dead_all), (blog_all, links)):
            if sum(v * w for (dn, w), v in zip(D.DIMS, [D.score_cell(copy.deepcopy(cell), d["iso3"], k, a, cl, li)["dims"][x] for x, _ in D.DIMS])) \
               > sum(base[x] * w for x, w in D.DIMS): bad += 1
        txt = " ".join([cell.get("summary", "")] + list(cell.get("detail") or [])).lower()
        if any(p in txt for p in ("not verified", "could not confirm", "could not verify", "could not be verified",
                                  "not confirmed", "unverified")) and base["validation"] == 100:
            missed.append(f"{d['iso3']}.{k}")
check(f"12 monotone on {n} real cells (all-dead, all-blog never raise a grade)", bad == 0, f"{bad} raised")
check("13 every real cell admitting an unverified fact loses Validation", not missed, ", ".join(missed))

print(f"\n{len(FAILS)} failed" if FAILS else "\nall passed")
sys.exit(1 if FAILS else 0)
