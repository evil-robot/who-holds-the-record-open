"""Read-only consistency audit of data/*.json against RUBRIC.md (v1, 2026-10-01).
Prints machine findings; consistency_audit.md is written from these plus a manual read."""
import json, glob, re, collections, statistics, random
import os
ROOT = os.environ.get("WHTR_ROOT", os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
W = dict(access=20, control=20, privacy=15, commercial=10, journey=15, clinical=10, research=5, ai=5)
D = {}
for f in sorted(glob.glob(f"{ROOT}/data/*.json")):
    d = json.load(open(f)); D[d["iso3"]] = d
wc = lambda s: len(re.findall(r"\S+", s or ""))
sents = lambda s: len([x for x in re.split(r"(?<=[.!?])\s+(?=[A-Z0-9'\"(])", (s or "").strip()) if x])
HYPE = re.compile(r"\b(revolutionary|robust|seamless(ly)?|cutting-edge|landscape|leverag\w*|delve\w*)\b", re.I)
EMDASH = re.compile(r"[—–]")
F = collections.defaultdict(list)
def add(kind, iso, field, msg): F[kind].append((iso, field, msg))

def texts(d):
    yield "headline", d["headline"]; yield "journeyNote", d["journeyNote"]
    for k, c in d["categories"].items():
        yield f"categories.{k}.summary", c["summary"]
        for i, p in enumerate(c["detail"]): yield f"categories.{k}.detail[{i}]", p
    for i, n in enumerate(d["news"]): yield f"news[{i}].headline", n["headline"]; yield f"news[{i}].why", n["why"]
    for i, l in enumerate(d["laws"]): yield f"laws[{i}].what", l["what"]

for iso, d in D.items():
    if d["controlModel"] not in ("Individual", "Shared", "Institutional", "State"): add("enum", iso, "controlModel", d["controlModel"])
    if d["confidence"] not in ("high", "medium", "low"): add("enum", iso, "confidence", d["confidence"])
    if wc(d["headline"]) > 25: add("words", iso, "headline", f"{wc(d['headline'])} words > 25")
    if wc(d["journeyNote"]) > 40: add("words", iso, "journeyNote", f"{wc(d['journeyNote'])} words > 40")
    if set(d["categories"]) != set(W): add("schema", iso, "categories", str(set(d["categories"]) ^ set(W)))
    for k, c in d["categories"].items():
        s = c["score"]
        if not isinstance(s, int) or not 0 <= s <= 100: add("schema", iso, f"categories.{k}.score", repr(s))
        if wc(c["summary"]) > 50: add("words", iso, f"categories.{k}.summary", f"{wc(c['summary'])} words (> ~45; flagged above 50)")
        if sents(c["summary"]) > 2: add("words", iso, f"categories.{k}.summary", f"{sents(c['summary'])} sentences > 2")
        if not 3 <= len(c["detail"]) <= 5: add("schema", iso, f"categories.{k}.detail", f"{len(c['detail'])} paragraphs (3-5)")
        for i, p in enumerate(c["detail"]):
            if wc(p) > 60: add("words", iso, f"categories.{k}.detail[{i}]", f"{wc(p)} words > 60")
        if not 1 <= len(c["sources"]) <= 4: add("schema", iso, f"categories.{k}.sources", f"{len(c['sources'])} sources (1-4)")
        for i, so in enumerate(c["sources"]):
            if set(so) != {"title", "url", "date"}: add("schema", iso, f"categories.{k}.sources[{i}]", f"keys {sorted(so)}")
            if re.fullmatch(r"\d{4}(-\d{2}(-\d{2})?)?", so.get("date", "")) and so["date"] > "2026-10-01": add("dates", iso, f"categories.{k}.sources[{i}].date", f"future date {so['date']}")
            if not re.fullmatch(r"\d{4}(-\d{2}(-\d{2})?)?", so.get("date", "")): add("dates", iso, f"categories.{k}.sources[{i}].date", f"format {so.get('date')!r}")
    if not 3 <= len(d["news"]) <= 5: add("schema", iso, "news", f"{len(d['news'])} items (3-5)")
    for i, n in enumerate(d["news"]):
        dt = n.get("date", "")
        if not re.fullmatch(r"\d{4}-\d{2}(-\d{2})?", dt): add("dates", iso, f"news[{i}].date", f"format {dt!r}")
        elif not ("2025-10" <= dt[:7] <= "2026-09"): add("dates", iso, f"news[{i}].date", f"{dt} outside Oct 2025-Sep 2026: {n['headline']}")
        m = re.search(r"/(20[12]\d)[/-](\d{2})?", n["url"])
        if m and dt[:4].isdigit() and m.group(1) != dt[:4] and not (m.group(1) == str(int(dt[:4]) - 1) and dt[5:7] in ("01", "02")):
            add("dates", iso, f"news[{i}].url", f"URL path year {m.group(1)} vs news date {dt}: {n['url']}")
        if wc(n["headline"]) > 14: add("words", iso, f"news[{i}].headline", f"{wc(n['headline'])} words > 14")
    if not 3 <= len(d["laws"]) <= 7: add("schema", iso, "laws", f"{len(d['laws'])} laws (3-7)")
    for i, l in enumerate(d["laws"]):
        if l["level"] not in ("Supranational", "National", "State/Provincial", "Regional"): add("enum", iso, f"laws[{i}].level", l["level"])
        if wc(l["what"]) > 20: add("words", iso, f"laws[{i}].what", f"{wc(l['what'])} words > 20")
    for kj, v in d["journey"].items():
        if v not in ("connected", "partial", "siloed", "unknown"): add("enum", iso, f"journey.{kj}", v)
    if set(d["journey"]) != {"primaryCare", "hospital", "labs", "pharmacy", "claims", "publicHealth", "research"}:
        add("schema", iso, "journey", str(sorted(d["journey"])))
    for fld, t in texts(d):
        if EMDASH.search(t): add("style", iso, fld, "em/en dash")
        if HYPE.search(t): add("style", iso, fld, f"hype word '{HYPE.search(t).group(0)}'")

# overall + ranks (page rounds with Math.round; ties then keep file order in a stable sort)
ov = {i: sum(d["categories"][k]["score"] * w for k, w in W.items()) / 100 for i, d in D.items()}
rows = sorted(D, key=lambda i: -ov[i])
band = lambda s: "Leading" if s >= 85 else "Strong" if s >= 65 else "Mixed" if s >= 45 else "Weak" if s >= 25 else "Poor"
print("RANK TABLE"); 
for r, i in enumerate(rows, 1): print(r, i, f"{ov[i]:.2f}", round(ov[i] + 1e-9), band(round(ov[i])), D[i]["confidence"])
rd = collections.Counter(int(ov[i] + 0.5) for i in D); print("tied rounded scores:", {k: [i for i in D if int(ov[i] + .5) == k] for k, v in rd.items() if v > 1})

# journey map vs journey score
JV = dict(connected=1.0, partial=0.5, siloed=0.0)
pairs = []
for i, d in D.items():
    vals = [JV[v] for v in d["journey"].values() if v in JV]
    unk = sum(v == "unknown" for v in d["journey"].values())
    m = 100 * sum(vals) / len(vals) if vals else None
    pairs.append((i, d["categories"]["journey"]["score"], m, unk, dict(collections.Counter(d["journey"].values()))))
from scipy.stats import spearmanr, linregress
xs = [p[2] for p in pairs]; ys = [p[1] for p in pairs]
print("journey score vs map index spearman", spearmanr(xs, ys))
lr = linregress(xs, ys)
print("fit", lr.slope, lr.intercept)
res = sorted(((p[1] - (lr.intercept + lr.slope * p[2]), p) for p in pairs), key=lambda x: x[0])
print("largest residuals (score minus fitted from map):")
for r, p in res[:6] + res[-6:]: print(f"{r:+.1f}", p)

# confidence vs primary sourcing computed later in sources.py
for kind in F:
    print("\n==", kind, len(F[kind]))
    for x in F[kind]: print("  ", *x)
os.makedirs(f"{ROOT}/analysis", exist_ok=True); json.dump({"overall": ov, "journey_pairs": pairs}, open(f"{ROOT}/analysis/_audit_cache.json", "w"))
