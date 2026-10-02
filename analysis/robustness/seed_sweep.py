"""Seed sensitivity of the main-model lead group (JAS ruling, 2 Oct 2026).

The published run (robustness.py, seed 20261002, 10,000 draws) decides the lead group under DECISION_RULES.md rule 2;
this file only measures how much the first-place shares move with the seed. It calls robustness.run() unchanged, so
each seed's figures are exactly what a full published run at that seed would give. The 15 other seeds were fixed
before any result was seen: the next 12 integers after the published seed, plus 1, 42 and 12345.

Run:  uv run --project ~/Projects/ds-lab python analysis/robustness/seed_sweep.py   (after robustness.py)
Writes analysis/robustness/seed_sweep.json with the data hash (DECISION_RULES.md rule 1). Simulation, not measurement.
"""
import json, os, sys
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import robustness as R  # noqa: E402

OTHER_SEEDS = [R.SEED + k for k in range(1, 13)] + [1, 42, 12345]


def main():
    iso, names, S, meta = R.load()
    pub = json.load(open(os.path.join(R.HERE, "robustness.json")))
    if pub["meta"]["data"]["dataSha256"] != meta["dataSha256"] or pub["meta"]["seed"] != R.SEED or pub["meta"]["draws"] != R.N_DRAWS:
        raise SystemExit("robustness.json is not the published run on current data/: rerun robustness.py first")
    per = {}
    for s in [R.SEED] + OTHER_SEEDS:
        c = R.run(S, iso, seed=s)["monteCarlo"][R.MAIN]["countries"]
        per[s] = {k: (v["firstShare"], v["rank90"][0]) for k, v in c.items()}
        if s == R.SEED and c != pub["monteCarlo"][R.MAIN]["countries"]:
            raise SystemExit("published seed does not reproduce robustness.json: the run is not deterministic")
    lead = lambda s: sorted(k for k, v in per[s].items() if v[1] == 1)
    watch = sorted({k for s in per for k in lead(s)} | {k for s in per for k, v in per[s].items() if v[0] >= 0.02},
                   key=lambda k: -per[R.SEED][k][0])
    summary = {}
    for k in watch:
        xs = np.array([per[s][k][0] for s in OTHER_SEEDS])
        summary[k] = {"published": per[R.SEED][k][0], "inPublishedLead": per[R.SEED][k][1] == 1,
                      "otherSeeds": {"mean": round(float(xs.mean()), 4), "min": float(xs.min()), "max": float(xs.max()),
                                     "inLead": int(sum(per[s][k][1] == 1 for s in OTHER_SEEDS)), "of": len(OTHER_SEEDS)}}
    out = {"meta": {"dataSha256": meta["dataSha256"], "model": R.MAIN, "draws": R.N_DRAWS, "publishedSeed": R.SEED,
                    "otherSeeds": OTHER_SEEDS, "rule": "lead group = rank90 lower bound 1 (5th percentile, inverted CDF), i.e. first in at least 5% of draws; the published seed decides",
                    "mcStandardErrorAt5pct": round(float(np.sqrt(0.05 * 0.95 / R.N_DRAWS)), 4), "names": {k: names[k] for k in watch}},
           "summary": summary,
           "perSeed": {str(s): {k: {"firstShare": per[s][k][0], "rank90lo": per[s][k][1]} for k in watch} for s in per},
           "leadGroups": {str(s): lead(s) for s in per}}
    json.dump(out, open(os.path.join(R.HERE, "seed_sweep.json"), "w"), indent=1)
    for k, v in summary.items():
        print(k, v)
    return out


if __name__ == "__main__":
    main()
