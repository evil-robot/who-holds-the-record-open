"""Draw the stratified random sample of country x category cells. Uses only iso3, name, region and
category; never reads a score. Seed and allocation are pre-registered in PLAN.md."""
import json, glob, random, collections, pathlib, csv
ROOT = pathlib.Path(__file__).resolve().parents[3]
OUT = pathlib.Path(__file__).resolve().parents[1]
SEED = 20261002
CATS = ["access", "control", "privacy", "commercial", "journey", "clinical", "research", "ai"]
PER_CAT = 8
N_REPEAT = 6          # within-rater repeat cells, rated twice in different batches
BATCH = 10

countries = []
for f in sorted(glob.glob(str(ROOT / "data" / "[A-Z][A-Z][A-Z].json"))):
    d = json.load(open(f))
    countries.append({"iso3": d["iso3"], "name": d["name"], "region": d["region"]})
by_region = collections.defaultdict(list)
for c in countries:
    by_region[c["region"]].append(c)
regions = sorted(by_region)
N = len(countries)
rng = random.Random(SEED)

# Region totals across the 64 cells: largest-remainder proportional to country count.
total = PER_CAT * len(CATS)
quota = {r: total * len(by_region[r]) / N for r in regions}
alloc = {r: int(quota[r]) for r in regions}
for r in sorted(regions, key=lambda r: -(quota[r] - alloc[r]))[: total - sum(alloc.values())]:
    alloc[r] += 1

# Spread each region's total over categories so every category gets PER_CAT (seeded, balanced).
for attempt in range(100000):
    grid = {c: collections.Counter() for c in CATS}
    for r in regions:
        base, extra = divmod(alloc[r], len(CATS))
        for c in CATS:
            grid[c][r] = base
        for c in rng.sample(CATS, extra):
            grid[c][r] += 1
    if all(sum(grid[c].values()) == PER_CAT for c in CATS):
        break
else:
    raise SystemExit("no balanced allocation")

sample = []
for c in CATS:
    for r in regions:
        k = grid[c][r]
        for ctry in rng.sample(by_region[r], k):
            sample.append({"cell_id": f"{ctry['iso3']}.{c}", "iso3": ctry["iso3"], "name": ctry["name"],
                           "region": r, "category": c})

# Cited URLs for each sampled cell (urls only, never titles, summary, detail or score).
for s in sample:
    d = json.load(open(ROOT / "data" / f"{s['iso3']}.json"))
    s["urls"] = [src["url"] for src in d["categories"][s["category"]].get("sources", [])]

# url_check.csv outcome per cited URL (coverage, recorded before rating).
chk = {}
for row in csv.DictReader(open(ROOT / "analysis" / "url_check.csv")):
    chk[(row["iso3"], row["url"])] = (row["final_outcome"], row["final_url"])
for s in sample:
    s["url_check"] = [chk.get((s["iso3"], u), ("not_checked", ""))[0] for u in s["urls"]]
    s["allowed_redirects"] = sorted({chk[(s["iso3"], u)][1] for u in s["urls"] if (s["iso3"], u) in chk and chk[(s["iso3"], u)][1]} - set(s["urls"]))

# Repeat cells: seeded, one per category for 6 categories.
repeat_ids = set(rng.sample([s["cell_id"] for s in sample], N_REPEAT))

# Pilot cell: drawn from cells NOT in the sample, excluded from analysis.
in_sample = {s["cell_id"] for s in sample}
pool = [(c["iso3"], cat) for c in countries for cat in CATS if f"{c['iso3']}.{cat}" not in in_sample]
pi, pc = rng.choice(pool)
pd = json.load(open(ROOT / "data" / f"{pi}.json"))
pilot = {"cell_id": f"{pi}.{pc}", "iso3": pi, "name": pd["name"], "region": pd["region"], "category": pc,
         "urls": [x["url"] for x in pd["categories"][pc]["sources"]], "allowed_redirects": []}

# Batches: 70 rating tasks, 7 batches of 10, avoid same country twice in a batch, repeat copies in different batches.
tasks = [dict(s, task_id=s["cell_id"]) for s in sample] + \
        [dict(s, task_id=s["cell_id"] + "#r") for s in sample if s["cell_id"] in repeat_ids]
for attempt in range(100000):
    rng.shuffle(tasks)
    batches = [tasks[i:i + BATCH] for i in range(0, len(tasks), BATCH)]
    if all(len({t["iso3"] for t in b}) == len(b) for b in batches):
        break
else:
    raise SystemExit("no batch split")

out = {"seed": SEED, "frame": {"countries": N, "cells": N * len(CATS), "regions": {r: len(by_region[r]) for r in regions}},
       "region_alloc": alloc, "grid": {c: dict(grid[c]) for c in CATS}, "cells": sample,
       "repeat_cells": sorted(repeat_ids), "pilot": pilot,
       "batches": [[t["task_id"] for t in b] for b in batches]}
json.dump(out, open(OUT / "sample.json", "w"), indent=1)
for i, b in enumerate(batches, 1):
    json.dump([{k: t[k] for k in ("task_id", "name", "category", "urls")} for t in b],
              open(OUT / "batches" / f"batch_{i}.json", "w"), indent=1)
json.dump([{"task_id": pilot["cell_id"], "name": pilot["name"], "category": pc, "urls": pilot["urls"]}],
          open(OUT / "batches" / "pilot.json", "w"), indent=1)
print("alloc", alloc); print("cells", len(sample), "tasks", len(tasks), "batches", len(batches))
print("pilot", pilot["cell_id"]); print("repeats", sorted(repeat_ids))
print(collections.Counter(o for s in sample for o in s["url_check"]))
print("cells with no ok url:", [s["cell_id"] for s in sample if "ok" not in s["url_check"]])
