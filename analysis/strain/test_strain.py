"""Adversarial test for the strain layer. Plants bad values in a copy of strain.json and checks that
validate() rejects every one; also checks the clean file passes (including the South Africa case that a
wrong rule once failed), the GHED preliminary-year parser, and the coverage floors in coverage_baseline.json.

Run:  uv run --project ~/Projects/ds-lab python analysis/strain/test_strain.py
Exit code 0 only if every plant is caught and the clean file passes.
"""
import copy
import glob
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build_strain as B  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
clean = json.load(open(os.path.join(HERE, "strain.json")))
countries = {os.path.basename(f)[:3]: json.load(open(f)) for f in sorted(glob.glob(os.path.join(B.ROOT, "data", "[A-Z][A-Z][A-Z].json")))}
results = []


def caught(label, mutate):
    r = copy.deepcopy(clean)
    mutate(r)
    try:
        B.validate(r, countries)
        results.append((label, False, "validate() passed a planted error"))
    except ValueError as e:
        results.append((label, True, str(e).splitlines()[1].strip()))


def passes(label, r):
    try:
        B.validate(r, countries)
        results.append((label, True, "clean"))
    except ValueError as e:
        results.append((label, False, str(e)[:300]))


C = lambda r, iso: r["countries"][iso]["indicators"]  # noqa: E731


def setv(r, iso, name, value, year=None):
    x = C(r, iso)[name]
    x["value"] = value
    if year is not None:
        x["year"] = year


# 0b. wrongly-fails guard: a later year on the separate OOP indicator (one series published first) is legal
r_lag = copy.deepcopy(clean)
C(r_lag, "CAN")["vhiPlusOopShareCHE"].update(year=2022, vhiYear=2022, oopYear=2022)  # sum in an earlier common year
assert C(r_lag, "CAN")["oopShareCHE"]["year"] == 2023                                     # separate OOP already in 2023
passes("sum in an earlier common year than the separate series (legal)", r_lag)

# 0. the clean file passes, including ZAF where VHI+OOP (52) exceeds domestic private spending (36) by design
passes("clean strain.json passes", clean)
assert C(clean, "ZAF")["vhiPlusOopShareCHE"]["value"] > C(clean, "ZAF")["privateDomesticShareCHE"]["value"], "ZAF regression case changed"

# 1. record-split quote altered by one word
caught("altered record-split quote", lambda r: r["countries"]["MLT"]["recordSplit"].update(quote="Private hospitals, private GPs and all private prescriptions are outside it."))
# 2. quote pointed at the wrong field
caught("quote in wrong field", lambda r: r["countries"]["ZAF"]["recordSplit"].update(field="categories.access.summary"))
# 3. a class with no quote (invented classification)
caught("class without quote", lambda r: r["countries"]["CAN"]["recordSplit"].update({"class": "split", "quote": None, "field": None}))
# 4. GHED preliminary year used
caught("GHED 2024 preliminary year", lambda r: setv(r, "CAN", "oopShareCHE", 15.3, 2024))
# 5. a share over 100
caught("share over 100", lambda r: setv(r, "IND", "oopShareCHE", 143.9))
# 6. head count leaking into a population percentage (the OECD flow mixes PT_POP and PS)
caught("persons count as percent", lambda r: setv(r, "FRA", "vhiPopulationPct", 39990.0))
# 7. VHI + OOP over 100
caught("VHI+OOP over 100", lambda r: (setv(r, "NGA", "vhiShareCHE", 40.0), setv(r, "NGA", "vhiPlusOopShareCHE", 111.9)))
# 8. VHI and OOP from different years summed
caught("VHI and OOP from different years", lambda r: C(r, "ARG")["vhiPlusOopShareCHE"].update(vhiYear=2021))
caught("sum part disagrees with its indicator", lambda r: setv(r, "ARG", "vhiShareCHE", 11.0))
# 9. sum that does not equal its parts
caught("sum not equal to parts", lambda r: setv(r, "CAN", "vhiPlusOopShareCHE", 37.9))
# 10. doctors per 10,000 implausible (per 100,000 by mistake)
caught("doctors per 100k not per 10k", lambda r: setv(r, "DEU", "doctorsPer10k", 459.3))
# 11. negative value
caught("negative share", lambda r: setv(r, "SAU", "vhiShareCHE", -1.0))
# 12. value with no source / no year
caught("value without source", lambda r: C(r, "AUS")["doctorsPer10k"].update(source=None))
caught("value without year", lambda r: C(r, "AUS")["doctorsPer10k"].update(year=None))
# 13. a year claimed for a missing value (unknown dressed as measured)
caught("year on a missing value", lambda r: C(r, "TWN")["doctorsPer10k"].update(year=2023))
# 14. a year after retrieval (claims a period the source cannot cover)
caught("future year", lambda r: setv(r, "CAN", "waitMedianDays_knee", 146.0, 2027))
# 15. estimating an unpublished indicator
caught("specialist wait estimated", lambda r: C(r, "CAN")["specialistWaitOver4Weeks"].update(value=62.0, year=2023))
# 16. nulls counted as flags
caught("null counted as a flag", lambda r: r["countries"]["MEX"]["flagCount"].update(true=4))
# 17. unknown flag turned into false (silence read as 'no problem')
caught("unknown read as false", lambda r: r["countries"]["BEL"]["flags"].update(recordSplit=False))  # BEL stays unknown after research
# 18. flag that does not follow its values
caught("workforce flag flipped", lambda r: r["countries"]["CAN"]["flags"].update(workforceLow=not r["countries"]["CAN"]["flags"]["workforceLow"]))
caught("wait flag flipped", lambda r: r["countries"]["ITA"]["flags"].update(longWaits=True))
caught("private-spend flag flipped", lambda r: r["countries"]["NGA"]["flags"].update(privateSpendHigh=False))
# 18b. the same flips with flagCount recomputed, so only the flag-follows-values check can catch them
def flip(iso, k, v):
    def m(r):
        o = r["countries"][iso]
        o["flags"][k] = (not o["flags"][k]) if v == "flip" else v
        f = [o["flags"][x] for x in B.FLAG_KEYS]
        o["flagCount"] = {"true": sum(x is True for x in f), "false": sum(x is False for x in f), "unknown": sum(x is None for x in f)}
    return m


caught("workforce flag flipped, counts consistent", flip("CAN", "workforceLow", "flip"))
caught("wait flag flipped, counts consistent", flip("ITA", "longWaits", True))
caught("private-spend flag flipped, counts consistent", flip("NGA", "privateSpendHigh", False))
caught("unknown wait read as false, counts consistent", flip("DEU", "longWaits", False))
caught("specialist wait estimated with a source", lambda r: C(r, "CAN")["specialistWaitOver4Weeks"].update(value=62.0, year=2023, source="x", url="y", retrieved="2026-10-01"))
# 18c. a cut-off moved to manufacture or remove flags
caught("tampered quartile cut-off", lambda r: r["meta"]["cutoffs"].update(doctorsPer10k_Q1=30.0))
# 18d. the workforce parts (doctorsLow, nursesLow) must follow the values and must not be counted
caught("doctorsLow flipped", lambda r: r["countries"]["CAN"]["flags"].update(doctorsLow=not r["countries"]["CAN"]["flags"]["doctorsLow"]))
caught("nursesLow missing value read as false", lambda r: r["countries"]["TWN"]["flags"].update(nursesLow=False))
caught("parts counted as flags", lambda r: r["countries"]["ZAF"]["flagCount"].update(true=4, unknown=1))
caught("stray flag key", lambda r: r["countries"]["CAN"]["flags"].update(specialistsLow=None))

# 18e. research merge: a research class must carry its url and quote, and disagreement must be marked
def research(iso, cls, conflict=None, basis=None, url="https://example.org/x", quote="q"):
    def m(r):
        rs = r["countries"][iso]["recordSplit"]
        rs["research"] = {"class": cls, "quote": quote, "url": url}
        if basis == "research":
            rs.update({"class": cls, "quote": quote, "url": url, "field": None, "basis": "research"})
            r["countries"][iso]["flags"]["recordSplit"] = {"split": True, "connected": False, "partial": False, "unknown": None}[cls]
        if conflict is not None:
            rs["conflict"] = conflict
    return m


caught("research class without url", research("CAN", "partial", basis="research", url=""))
caught("research disagrees with file, conflict not marked", research("ZAF", "partial", conflict=False))
caught("research agrees with file, marked conflict", research("MLT", "split", conflict=True))
# 19. partial counted as split in the flag
caught("partial counted as split", lambda r: r["countries"]["PRT"]["flags"].update(recordSplit=True))
# 20. country set drift
caught("country dropped", lambda r: r["countries"].pop("LIE"))
caught("stray ISO added", lambda r: r["countries"].__setitem__("ESH", copy.deepcopy(r["countries"]["LIE"])))
# 21. invalid class
caught("invalid record class", lambda r: r["countries"]["FIN"]["recordSplit"].update({"class": "linked"}))

# 21b. merge_research() on synthetic files: refuses bad shapes, applies the three rules
import tempfile  # noqa: E402


def merge_case(label, entries, check=None, refuse=False):
    out = copy.deepcopy(clean["countries"])
    with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False) as fh:
        json.dump(entries, fh)
    try:
        B.merge_research(out, fh.name)
        ok = (not refuse) and (check(out) if check else True)
        results.append((label, ok, "merged"))
    except ValueError as e:
        results.append((label, refuse, str(e)[:120]))
    finally:
        os.unlink(fh.name)


U = "https://example.org/src"
merge_case("research beats unknown", {"BEL": {"class": "partial", "quote": "q", "url": U}},
           lambda o: o["BEL"]["recordSplit"]["class"] == "partial" and o["BEL"]["recordSplit"]["basis"] == "research")
merge_case("conflict keeps file class and both quotes", {"ZAF": {"class": "partial", "quote": "q", "url": U}},
           lambda o: o["ZAF"]["recordSplit"]["class"] == "split" and o["ZAF"]["recordSplit"]["conflict"] is True
           and o["ZAF"]["recordSplit"]["research"]["quote"] == "q")
merge_case("agreement recorded as both", {"MLT": {"class": "split", "quote": "q", "url": U}},
           lambda o: o["MLT"]["recordSplit"]["basis"] == "both" and o["MLT"]["recordSplit"]["conflict"] is False)
merge_case("research unknown changes nothing", {"BEL": {"class": "unknown"}}, lambda o: o["BEL"]["recordSplit"]["class"] == "unknown")
merge_case("refuses class without url", {"GBR": {"class": "split", "quote": "q"}}, refuse=True)
merge_case("refuses invented class", {"GBR": {"class": "mostly", "quote": "q", "url": U}}, refuse=True)
merge_case("refuses unknown ISO", {"ESH": {"class": "split", "quote": "q", "url": U}}, refuse=True)
merge_case("refuses a list", [{"iso3": "GBR"}], refuse=True)

# 21c. wait notes say what the country reports instead of a bare 'not reported'
for iso, word in (("COL", "mean"), ("LTU", "mean"), ("HRV", "waiting list"), ("IRL", "waiting list"), ("ISL", "waiting list"), ("SVN", "waiting list")):
    n = C(clean, iso)["waitMedianDays_hip"]["note"]
    results.append((f"wait note {iso} names the {word}", word in n, n[:60]))

# 22. GHED version parser refuses text that no longer names the preliminary year
try:
    B.last_final_ghed_year("Last updated: December 2026. Year 2024 added.")
    results.append(("GHED version text without preliminary year", False, "parser guessed a year"))
except ValueError:
    results.append(("GHED version text without preliminary year", True, "refused"))
results.append(("GHED parser reads 2024 preliminary as final 2023", B.last_final_ghed_year("Data for 2024 are preliminary and subject to revision.") == 2023, ""))

# 23. coverage floors (ratchet): rebaseline deliberately, never to turn red green
base = json.load(open(os.path.join(HERE, "coverage_baseline.json")))
for name, floor in base["floors"].items():
    have = sum(o["indicators"][name]["value"] is not None for o in clean["countries"].values())
    results.append((f"coverage {name} >= {floor}", have >= floor, f"have {have}"))
for cls, floor in base["recordSplitKnownFloor"].items():
    have = sum(o["recordSplit"]["class"] != "unknown" for o in clean["countries"].values())
    results.append((f"record split known >= {floor}", have >= floor, f"have {have}"))

# 24. spot-truths frozen from the opened sources on 1 Oct 2026
spots = [("CAN", "doctorsPer10k", 28.54, 2024), ("CAN", "oopShareCHE", 15.2, 2023), ("CAN", "vhiShareCHE", 12.66, 2023),
         ("CAN", "waitMedianDays_knee", 146.0, 2025), ("CAN", "vhiPopulationPct", 67.0, 2025), ("ZAF", "vhiShareCHE", 45.32, 2023)]
for iso, name, v, y in spots:
    x = C(clean, iso)[name]
    results.append((f"spot {iso} {name} = {v} ({y})", x["value"] == v and x["year"] == y, f"got {x['value']} ({x['year']})"))

# 18f. stale combined share but recent out-of-pocket alone above the cut-off: the flag is true (Iraq's case), and must not read false
cutQ3 = clean["meta"]["cutoffs"]["vhiPlusOopShareCHE_Q3"]
_I = {"vhiPlusOopShareCHE": {"value": cutQ3 - 3, "year": 2010, "retrieved": "2026-10-02"}, "oopShareCHE": {"value": cutQ3 + 20, "year": 2023, "retrieved": "2026-10-02"}}
_f, _b = B.private_spend_flag(_I, cutQ3)
results.append(("stale sum, recent OOP above the cut-off -> flag true on the OOP basis", _f is True and bool(_b), f"got {_f}, {_b}"))
_I2 = {"vhiPlusOopShareCHE": {"value": cutQ3 - 3, "year": 2023, "retrieved": "2026-10-02"}, "oopShareCHE": {"value": cutQ3 + 20, "year": 2023, "retrieved": "2026-10-02"}}
results.append(("recent sum below the cut-off is not overridden by OOP", B.private_spend_flag(_I2, cutQ3)[0] is False, ""))
caught("OOP-basis flag read as false, counts consistent", flip("IRQ", "privateSpendHigh", "flip"))

bad = [r for r in results if not r[1]]
for label, ok, why in results:
    print(("PASS " if ok else "FAIL ") + label + (f"  [{why}]" if why else ""))
print(f"\n{len(results) - len(bad)} of {len(results)} passed")
sys.exit(1 if bad else 0)
