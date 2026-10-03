"""The pre-registered blind re-scoring (reliability.json) compared with the CURRENT published scores, as a separate,
clearly labelled comparison. The study itself is not rerun: its rater read the sources cited on its run date, and some of
those cells were re-researched on 2 Oct 2026, so this comparison is partly circular for the changed cells (reported).
Records the data hash (DECISION_RULES.md). Run: uv run --project ~/Projects/ds-lab python analysis/reliability/current_compare.py"""
import csv, json, os, sys, numpy as np
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.join(ROOT, "scripts")); from datahash import data_sha256
rows = [r for r in csv.DictReader(open(os.path.join(ROOT, "analysis", "reliability", "ratings.csv"))) if r["rater"] not in ("", "null", "None")]
cur = {}
for r in rows:
    d = json.load(open(os.path.join(ROOT, "data", r["iso3"] + ".json"))); cur[r["cell_id"]] = d["categories"][r["category"]]["score"]
x = np.array([float(r["rater"]) for r in rows]); p = np.array([float(r["published"]) for r in rows]); c = np.array([float(cur[r["cell_id"]]) for r in rows])
def icc21(a, b):
    M = np.column_stack([a, b]); n, k = M.shape; gm = M.mean()
    msr = k * ((M.mean(1) - gm) ** 2).sum() / (n - 1); msc = n * ((M.mean(0) - gm) ** 2).sum() / (k - 1)
    mse = ((M - M.mean(1, keepdims=True) - M.mean(0, keepdims=True) + gm) ** 2).sum() / ((n - 1) * (k - 1))
    return (msr - mse) / (msr + (k - 1) * mse + k * (msc - mse) / n)
rng = np.random.default_rng(20261002)
bs = [icc21(x[i], c[i]) for i in (rng.integers(0, len(x), len(x)) for _ in range(4000))]
d = x - c
out = {"dataSha256": data_sha256(ROOT), "n": len(rows), "changedSinceRun": int((p != c).sum()),
       "iccCurrent": round(float(icc21(x, c)), 2), "iccCurrentCi": [round(float(v), 2) for v in np.percentile(bs, [2.5, 97.5])],
       "madCurrent": round(float(np.abs(d).mean()), 2), "loaCurrent": [round(float(d.mean() - 1.96 * d.std(ddof=1)), 1), round(float(d.mean() + 1.96 * d.std(ddof=1)), 1)],
       "within10Current": round(float((np.abs(d) <= 10).mean()), 3),
       "note": "Rater scores against current published scores; the rater read the sources cited on its run date."}
# Exploratory, not in the pre-registered plan (REVIEW2_methods M4): ICC(2,1) per category, rater against the scores published on
# the run date, and where the rated cells sit. Point estimates only; each category has 5 to 8 cells.
cats = sorted({r["category"] for r in rows})
out["perCategoryIccAtRun"] = {k: dict(n=int(sum(r["category"] == k for r in rows)),
                                      icc=round(float(icc21(x[[r["category"] == k for r in rows]], p[[r["category"] == k for r in rows]])), 2)) for k in cats}
out["ratedByRegion"] = {g: int(sum(r["region"] == g for r in rows)) for g in sorted({r["region"] for r in rows})}
out["sampleFrame"] = "520 cells of the 65 countries then in the index (analysis/reliability/sample.json)"
json.dump(out, open(os.path.join(ROOT, "analysis", "reliability", "current_compare.json"), "w"), indent=1)
print(out)
