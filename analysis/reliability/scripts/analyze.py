"""Join blind rater scores to published scores and compute the pre-registered statistics. Writes reliability.json
and ratings.csv. Reads data/ read-only."""
import json, re, csv, pathlib, sys, hashlib, collections
import numpy as np
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from stats import icc2_1, qwk, bland_altman, describe, boot_ci, band
from audit_transcripts import audit, parse_final
R = pathlib.Path(__file__).resolve().parents[1]; ROOT = R.parents[1]
S = json.load(open(R / "sample.json"))
cells = {c["cell_id"]: c for c in S["cells"]}

audits, ratings, models = [], {}, set()
for i in range(1, len(S["batches"]) + 1):
    p = R / "transcripts" / f"batch_{i}.jsonl"
    a = audit(p); audits.append(a); models.add(a["model"])
    if not a["pass"]:
        continue
    res = [json.loads(l) for l in open(p) if l.strip() and json.loads(l).get("type") == "result"][-1]
    for o in parse_final(res["result"]):
        ratings[o["task_id"]] = dict(o, batch=i)

rows = []
for cid, c in cells.items():
    pub = json.load(open(ROOT / "data" / f"{c['iso3']}.json"))["categories"][c["category"]]["score"]
    r1 = ratings.get(cid); r2 = ratings.get(cid + "#r")
    rows.append({"cell_id": cid, "iso3": c["iso3"], "region": c["region"], "category": c["category"], "published": pub,
                 "rater": None if not r1 else r1["score"], "rater_repeat": None if not r2 else r2["score"],
                 "batch": r1 and r1["batch"], "n_urls": len(c["urls"]),
                 "n_opened": len(r1["sources_opened"]) if r1 else 0, "n_failed": len(r1.get("sources_failed", [])) if r1 else 0, "reason": r1["reason"] if r1 else "",
                 "reason_repeat": r2["reason"] if r2 else ""})
rated = [r for r in rows if r["rater"] is not None]
rng = np.random.default_rng(S["seed"])

def block(rs):
    a = [r["rater"] for r in rs]; p = [r["published"] for r in rs]
    out = describe(a, p, rng)
    out["bias"] = float(np.mean(np.subtract(a, p)))
    out["bias_ci"] = boot_ci(lambda x, y: float(np.mean(x - y)), a, p, rng)
    return out

a = [r["rater"] for r in rated]; p = [r["published"] for r in rated]
icc, lo, hi = icc2_1(np.c_[p, a])
head = describe(a, p, rng)
head.update({"qwk_bands": qwk(a, p), "qwk_ci": boot_ci(qwk, a, p, rng),
             "icc2_1": icc, "icc2_1_ci": [lo, hi], "bland_altman": bland_altman(a, p),
             "pearson_r": float(np.corrcoef(a, p)[0, 1]),
             "published_sd": float(np.std(p, ddof=1)), "rater_sd": float(np.std(a, ddof=1))})
by_cat = {k: block([r for r in rated if r["category"] == k]) for k in ["access", "control", "privacy", "commercial", "journey", "clinical", "research", "ai"]}
reg_groups = collections.defaultdict(list)
for r in rated:
    reg_groups[r["region"]].append(r)
by_region = {k: block(v) for k, v in sorted(reg_groups.items())}

rep = [r for r in rows if r["rater"] is not None and r["rater_repeat"] is not None]
repeat = {"n": len(rep), "mad_between_sessions": float(np.mean([abs(r["rater"] - r["rater_repeat"]) for r in rep])) if rep else None,
          "pairs": [[r["cell_id"], r["rater"], r["rater_repeat"], r["published"]] for r in rep]}

def headline_only(rs):
    a = [r["rater"] for r in rs]; p = [r["published"] for r in rs]
    d = np.abs(np.subtract(a, p))
    return {"n": len(rs), "mad": float(d.mean()), "within10": float((d <= 10).mean()), "icc2_1": icc2_1(np.c_[p, a])[0],
            "qwk_bands": qwk(a, p), "bias": float(np.mean(np.subtract(a, p)))}
avg = [dict(r, rater=(r["rater"] + r["rater_repeat"]) / 2 if r["rater_repeat"] is not None else r["rater"]) for r in rated]
sens = {"repeat_averaged": headline_only([dict(r, rater=round(r["rater"])) for r in avg]) if avg else None,
        "without_ISL.ai": headline_only([r for r in rated if r["cell_id"] != "ISL.ai"])}

dis = sorted(rated, key=lambda r: -abs(r["rater"] - r["published"]))
flag = [r for r in dis if abs(r["rater"] - r["published"]) >= 15]
# published reasons are the cell summaries; read only here, after scoring
for r in dis:
    r["published_summary"] = json.load(open(ROOT / "data" / f"{r['iso3']}.json"))["categories"][r["category"]]["summary"]

# Exploratory, NOT pre-registered: does agreement depend on whether the rater could read every cited source?
def split(rs):
    d = np.array([abs(r["rater"] - r["published"]) for r in rs])
    return {"n": len(rs), "mad": float(d.mean()), "within10": float((d <= 10).mean()), "n_abs_ge_15": int((d >= 15).sum())}
exploratory = {"label": "exploratory, not pre-registered",
               "all_cited_sources_opened": split([r for r in rated if r["n_failed"] == 0]),
               "some_cited_source_unreadable": split([r for r in rated if r["n_failed"] > 0]),
               "urls_cited": sum(r["n_urls"] for r in rows), "urls_opened": sum(r["n_opened"] for r in rows),
               "urls_unreadable": sum(r["n_failed"] for r in rows)}
ICCv = head["icc2_1"]
verdict = "poor" if ICCv < 0.5 else "moderate" if ICCv < 0.75 else "good" if ICCv < 0.9 else "excellent"
claim_ok = ICCv >= 0.75 and head["within10"] >= 0.70 and abs(head["bland_altman"]["bias"]) < 5
stamp = (R / "plan_stamp.txt").read_text()
out = {"generated_utc": __import__("datetime").datetime.now(__import__("datetime").timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
       "plan_sha256": hashlib.sha256((R / "PLAN.md").read_bytes()).hexdigest(), "plan_stamp": stamp,
       "rater_models": sorted(m for m in models if m), "services": {
           "raters": "Anthropic via the claude CLI (headless sessions), tools WebFetch and curl only",
           "sources": "the cell's cited URLs as published in data/, opened by the raters on the run date",
           "published_scores": "data/<ISO3>.json categories.*.score, asOf 2026-10-01",
           "statistics": "ds-lab Python (numpy, scipy, scikit-learn)"},
       "audit": audits, "sample": {"cells": len(rows), "rated": len(rated), "null": [r["cell_id"] for r in rows if r["rater"] is None]},
       "headline": head, "icc_verdict_koo_li": verdict, "decision_close_agreement_claim_allowed": claim_ok,
       "by_category": by_cat, "by_region": by_region, "repeat": repeat, "sensitivity": sens, "exploratory_source_access": exploratory,
       "flagged_for_editors_abs_diff_ge_15": [{k: r[k] for k in ("cell_id", "published", "rater", "rater_repeat", "reason", "published_summary")} for r in flag],
       "largest_disagreements": [{k: r[k] for k in ("cell_id", "published", "rater", "reason", "published_summary")} for r in dis[:10]]}
json.dump(out, open(R / "reliability.json", "w"), indent=1)
with open(R / "ratings.csv", "w", newline="") as f:
    w = csv.DictWriter(f, fieldnames=[k for k in rows[0] if k != "published_summary"], extrasaction="ignore")
    w.writeheader(); w.writerows(rows)
print(json.dumps({k: out[k] for k in ("sample", "headline", "icc_verdict_koo_li", "decision_close_agreement_claim_allowed", "repeat", "sensitivity")}, indent=1))
for k, v in by_cat.items():
    print(k, {x: (round(v[x], 2) if isinstance(v[x], float) else v[x]) for x in ("n", "mad", "within10", "bias")})
for k, v in by_region.items():
    print(k, {x: (round(v[x], 2) if isinstance(v[x], float) else v[x]) for x in ("n", "mad", "within10", "bias")})
print("flagged", len(flag)); print(exploratory)
for r in dis[:12]:
    print(r["cell_id"], r["published"], r["rater"], r["rater_repeat"], "|", r["reason"][:300], "|| PUB:", r["published_summary"][:300])
for a in audits:
    print(a["transcript"], a["pass"], a["fails"][:3], len(a["warns"]))
