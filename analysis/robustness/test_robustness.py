"""Adversarial test for robustness.py. Plants known effects and checks the analysis finds them; plants
known bugs and checks the reconciliation gate catches them. Synthetic countries below are SYNTHETIC test
fixtures (iso codes starting with X), never written anywhere and never mixed with data/.

Run:  uv run --project ~/Projects/ds-lab python analysis/robustness/test_robustness.py
Exit code 0 only if every check holds.
"""
import json
import os
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import robustness as R  # noqa: E402

results = []


def check(label, ok, note=""):
    results.append((label, bool(ok), note))


def raises(fn):
    try:
        fn()
        return False
    except ValueError:
        return True


iso, names, S, meta = R.load()
facts = json.load(open(os.path.join(R.ROOT, "out", "facts.json")))
real = R.run(S, iso, n=2000)

# 1. Rounding: the incident that motivated the gate (DEU 62.5 published as 63).
check("half-up rounding 62.5 -> 63, 61.5 -> 62", R.round_half_up(62.5) == 63 and R.round_half_up(61.5) == 62)
check("clean data reconciles with out/facts.json", not raises(lambda: R.reconcile(iso, real, facts)))

# 2. Planted bugs the gate must catch.
orig = R.round_half_up
R.round_half_up = np.round  # banker's rounding, as Python round()
check("PLANT banker's rounding is caught (DEU 62 vs 63)", raises(lambda: R.reconcile(iso, R.run(S, iso, n=50), facts)))
R.round_half_up = orig
w_orig = R.W_PUB.copy()
R.W_PUB = w_orig[[2, 1, 0, 3, 4, 5, 6, 7]]  # swap access and privacy weights
check("PLANT swapped weights are caught", raises(lambda: R.reconcile(iso, R.run(S, iso, n=50), facts)))
R.W_PUB = w_orig
bad = json.loads(json.dumps(real))
bad["reference"]["overall"]["FIN"] += 1
check("PLANT one score off by 1 is caught", raises(lambda: R.reconcile(iso, bad, facts)))

# 3. Negative control: no perturbation means every draw equals the reference.
ref = R.round_half_up(R.overall(S, R.W_PUB))
rng = np.random.default_rng(1)
zero = R.round_half_up(R.noisy(rng, S, 200, half=0.0) @ R.W_PUB / 100)
c, s, _ = R.summarise(iso, ref, R.comp_rank(ref), zero)
check("zero noise: every interval collapses to the published rank",
      all(v["rank90"] == [real["reference"]["rank"][k]] * 2 and v["bandShare"] == 1.0 for k, v in c.items()))
check("zero noise: average rank shift is 0", s["rankShiftRS"]["median"] == 0)

# 4. Planted effect on real data: +25 on Mexico's access must lift Mexico; without the plant it must not.
mx = iso.index("MEX")
S2 = S.copy()
S2[mx, 0] += 25
planted = R.run(S2, iso, n=2000)
med = lambda r: r["monteCarlo"]["noise5"]["countries"]["MEX"]["medianRank"]
check("PLANT Mexico access +25 lifts its median rank by >= 3", med(real) - med(planted) >= 3, f"{med(real)} -> {med(planted)}")
unplanted = R.run(S.copy(), iso, n=2000)
check("unplanted copy does not show that lift (the check can fail)", not (med(real) - med(unplanted) >= 3))
r0, r1 = real["reference"]["overall"]["MEX"], planted["reference"]["overall"]["MEX"]
check(f"PLANT moves Mexico's reference score by exactly +5 (25 x 20%): {r0} -> {r1}", r1 == r0 + 5)

# 5. Synthetic fixtures with known answers (SYNTHETIC).
syn_iso = ["XDOM", "XT1", "XT2", "XBAL", "XUNB", "XAI", "XM1", "XM2"]
X = np.array([
    [90] * 8,                                   # XDOM dominates: must be first in every draw
    [60, 60, 60, 60, 60, 60, 61, 60],           # XT1 and XT2 differ by 1 point in research only
    [60] * 8,
    [55] * 8,                                   # XBAL balanced at 55
    [80, 30, 80, 80, 30, 30, 80, 30],           # XUNB same weighted mean (55) but unbalanced
    [40, 40, 40, 40, 40, 40, 40, 100],          # XAI strong only on the 5% AI category
    [43] * 8, [41] * 8,
], dtype=float)
syn = R.run(X, syn_iso, n=4000)
for sch in ["dirichlet", "band25", "band50", "noise5", "noise5Shared", "combined"]:
    check(f"SYN dominant country first in every draw ({sch})", syn["monteCarlo"][sch]["countries"]["XDOM"]["rank90"] == [1, 1])
check("SYN 1-point gap is not stable under noise (intervals overlap)",
      syn["monteCarlo"]["noise5"]["countries"]["XT2"]["rank90"][0] <= syn["monteCarlo"]["noise5"]["countries"]["XT1"]["rank90"][1])
g = syn["alternatives"]["geometric"]["rank"]
check("SYN geometric mean ranks the balanced profile above the unbalanced one", g["XBAL"] < g["XUNB"], str((g["XBAL"], g["XUNB"])))
check("SYN arithmetic mean ties them", syn["reference"]["overall"]["XBAL"] == syn["reference"]["overall"]["XUNB"])
check("SYN dropping AI drops the AI-only country", syn["alternatives"]["drop_ai"]["rank"]["XAI"] > syn["reference"]["rank"]["XAI"])
check("SYN dropping research breaks the XT1 lead (they tie)", syn["alternatives"]["drop_research"]["rank"]["XT1"] == syn["alternatives"]["drop_research"]["rank"]["XT2"])

# 6. Calibration of the weight draws.
w = R.weights_dirichlet(np.random.default_rng(3), 20000)
check("Dirichlet draws centre on the published weights (within 0.2 points)", np.abs(w.mean(0) - R.W_PUB).max() < 0.2)
check("every weight draw sums to 100", np.allclose(R.weights_band(np.random.default_rng(4), 1000, .5).sum(1), 100) and np.allclose(w.sum(1), 100))

# 7. The written results file matches a fresh run of the same seed (no hand edits).
path = os.path.join(R.HERE, "robustness.json")
if os.path.exists(path):
    disk = json.load(open(path))
    fresh = R.run(S, iso, seed=disk["meta"]["seed"], n=disk["meta"]["draws"])
    check("robustness.json equals a fresh run (seed, draws, data hash)",
          fresh["monteCarlo"] == disk["monteCarlo"] and fresh["alternatives"] == disk["alternatives"]
          and disk["meta"]["data"]["dataSha256"] == meta["dataSha256"])

# 8. Calibrated error (F3) and the lead rule (DECISION_RULES.md rule 2).
if os.path.exists(path):
    mcd = disk["monteCarlo"]; mw = lambda e: sorted(v["rank90"][1] - v["rank90"][0] for v in mcd[e]["countries"].values())[len(iso) // 2]
    check("calibrated main model gives wider rank ranges than the +/-5 lower bound", mw(R.MAIN) > mw("noise5"), f"{mw(R.MAIN)} vs {mw('noise5')}")
    shares = {c: v["firstShare"] for c, v in mcd[R.MAIN]["countries"].items()}
    check("lead rule inputs: first shares sum to at least 1 (ties count for each tied country)", sum(shares.values()) >= 0.999, f"{sum(shares.values()):.3f}")
    check("cell SD is derived from the blind re-scoring limits of agreement", abs(R.CAL_CELL_SD - (R._REL["loa"][1] - R._REL["loa"][0]) / (2 * 1.96) / np.sqrt(2)) < 0.01, str(R.CAL_CELL_SD))

w_ = max(len(r[0]) for r in results)
for label, ok, note in results:
    print(f"{'PASS' if ok else 'FAIL'}  {label.ljust(w_)}  {note}")
fails = [r for r in results if not r[1]]
print(f"\n{len(results) - len(fails)} of {len(results)} pass")
sys.exit(1 if fails else 0)
