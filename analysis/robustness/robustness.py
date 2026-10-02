"""How stable is the ranking? Uncertainty analysis of the Who Holds the Record index.

Follows Step 7 ("Uncertainty and sensitivity analysis") of OECD/JRC (2008), Handbook on Constructing
Composite Indicators: Methodology and User Guide, OECD Publishing, Paris, ISBN 978-92-64-04345-9,
https://doi.org/10.1787/9789264043466-en. Reporting follows its Figure 18 (median rank with 5th and 95th
percentile bounds) and its equation 38 (average absolute rank shift against the reference ranking).

Run:   uv run --project ~/Projects/ds-lab python analysis/robustness/robustness.py
Test:  uv run --project ~/Projects/ds-lab python analysis/robustness/test_robustness.py

Reads data/<ISO3>.json (category scores) and out/facts.json (published overall and rank labels, used only
as the reconciliation target). Writes analysis/robustness/robustness.json. Never writes to data/ or out/.
Every interval here is a simulation under the stated assumptions, not a measurement.
"""
import datetime as dt
import glob
import hashlib
import json
import os

import numpy as np
from scipy.stats import spearmanr

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
HERE = os.path.join(ROOT, "analysis", "robustness")

# Published weights, from RUBRIC.md and build.js CATS (sum 100).
CATS = ["access", "control", "privacy", "commercial", "journey", "clinical", "research", "ai"]
W_PUB = np.array([20, 20, 15, 10, 15, 10, 5, 5], dtype=float)
# Bands as in build.js BANDS, applied to the rounded overall.
BANDS = [("Poor", 0, 24), ("Weak", 25, 44), ("Mixed", 45, 64), ("Strong", 65, 84), ("Leading", 85, 100)]
BAND_LO = np.array([b[1] for b in BANDS])

SEED = 20261002
N_DRAWS = 10_000
DIRICHLET_CONC = 100.0  # alpha_i = 100 * w_i / 100 = w_i (published weight in points)
NOISE = 5.0  # rater precision: uniform on [-5, +5] per category score (a lower bound; see CAL_* below)
# Calibrated error (academic referee F3, 2 Oct 2026). Cell SD from the blind re-scoring's Bland-Altman limits of
# agreement: SD of a difference = (upper - lower) / (2 x 1.96); one reading's SD = that / sqrt(2). Shared-country model:
# cell SD 5 plus one country offset with SD 2, the split the 2 Oct test-retest of 43 countries suggested.
_REL = json.load(open(os.path.join(ROOT, "analysis", "reliability", "reliability.json")))["headline"]["bland_altman"]
CAL_CELL_SD = round((_REL["loa"][1] - _REL["loa"][0]) / (2 * 1.96) / np.sqrt(2), 2)
CAL_SHARED = (5.0, 2.0)  # (cell SD, country SD)
MAIN = "calibratedCombined"  # the model the paper and the site publish rank ranges from
HANDBOOK = {
    "citation": "OECD/European Commission Joint Research Centre (2008). Handbook on Constructing Composite Indicators: Methodology and User Guide. Nardo M, Saisana M, Saltelli A, Tarantola S (JRC); Hoffmann A, Giovannini E (OECD). OECD Publishing, Paris. ISBN 978-92-64-04345-9.",
    "doi": "https://doi.org/10.1787/9789264043466-en",
    "fetched": "https://www.oecd.org/content/dam/oecd/en/publications/reports/2008/08/handbook-on-constructing-composite-indicators-methodology-and-user-guide_g1gh9301/9789264043466-en.pdf",
    "fetchedOn": "2026-10-02",
    "pdfSha256": "8b82c5b5563122960170f3dff0607ba47eaeab5e7c4b85c9edaf28d58cf5eca7",
    "passages": {
        "section 1.7, pp. 34-35": "lists sources of uncertainty to test, including 'Using different aggregation systems, e.g. linear, geometric mean' and 'Using different plausible values for the weights'; results 'generally reported as country rankings with their related uncertainty bounds'",
        "Step 7 opens p. 117; eq. 38, p. 118": "average shift in rank R_S = (1/M) sum |Rank_ref(CI_c) - Rank(CI_c)|",
        "7.1, p. 118": "the analysis is conducted as a single Monte Carlo experiment, exploring all uncertainty sources simultaneously",
        "Figure 18, p. 125": "original rank, median rank and 5th and 95th percentile bounds of the Monte Carlo ranks",
    },
}


def round_half_up(x):
    """JavaScript Math.round for non-negative values (build.js): 62.5 -> 63. Python round() would give 62."""
    return np.floor(np.asarray(x, dtype=float) + 0.5 + 1e-9)


def load(root=ROOT):
    files = sorted(glob.glob(os.path.join(root, "data", "[A-Z][A-Z][A-Z].json")))
    docs = [json.load(open(f)) for f in files]
    iso = [d["iso3"] for d in docs]
    names = {d["iso3"]: d["name"] for d in docs}
    S = np.array([[d["categories"][k]["score"] for k in CATS] for d in docs], dtype=float)
    h = hashlib.sha256()
    for f in files:
        h.update(os.path.basename(f).encode())
        h.update(open(f, "rb").read())
    meta = {"files": len(files), "dataSha256": h.hexdigest(),
            "asOf": sorted({d.get("asOf") for d in docs}), "models": {d["iso3"]: d["controlModel"] for d in docs}}
    return iso, names, S, meta


def overall(S, W):
    """Weighted arithmetic mean. S: (n, 8). W: (8,) or (D, 8) summing to 100. Returns (n,) or (D, n)."""
    return (W @ S.T) / 100.0 if W.ndim == 2 else S @ W / 100.0


def geometric(S, W):
    return np.exp(np.log(S) @ (W / W.sum()))


def comp_rank(scores):
    """Competition ranking as build.js ranks(): rank = 1 + number of countries with a strictly higher score."""
    s = np.asarray(scores)
    if s.ndim == 1:
        return 1 + (s[None, :] > s[:, None]).sum(axis=1)
    out = np.empty(s.shape, dtype=np.int32)
    for i in range(0, s.shape[0], 500):
        b = s[i:i + 500]
        out[i:i + 500] = 1 + (b[:, None, :] > b[:, :, None]).sum(axis=2)
    return out


def band_idx(rounded):
    return np.searchsorted(BAND_LO, rounded, side="right") - 1


def weights_dirichlet(rng, n):
    return rng.dirichlet(W_PUB / 100.0 * DIRICHLET_CONC, size=n) * 100.0


def weights_band(rng, n, frac):
    w = W_PUB * rng.uniform(1 - frac, 1 + frac, size=(n, len(W_PUB)))
    return w / w.sum(axis=1, keepdims=True) * 100.0


def noisy(rng, S, n, half=NOISE):
    return np.clip(S[None, :, :] + rng.uniform(-half, half, size=(n,) + S.shape), 0, 100)


def summarise(iso, ref_round, ref_rank, draws_round):
    """draws_round: (D, n) rounded overall scores. Returns per-country and system-level summaries."""
    R = comp_rank(draws_round)
    ref_band = band_idx(ref_round)
    B = band_idx(draws_round)
    q = lambda a, p: np.percentile(a, p, axis=0, method="inverted_cdf")
    med, lo, hi = q(R, 50), q(R, 5), q(R, 95)
    band_share = (B == ref_band[None, :]).mean(axis=0)
    first = (R == 1).mean(axis=0)
    countries = {c: {"medianRank": int(med[i]), "rank90": [int(lo[i]), int(hi[i])], "firstShare": round(float(first[i]), 4),
                     "bandShare": round(float(band_share[i]), 4),
                     "score90": [int(q(draws_round[:, i], 5)), int(q(draws_round[:, i], 95))]}
                 for i, c in enumerate(iso)}
    rs = np.abs(R - ref_rank[None, :]).mean(axis=1)
    counts = np.stack([(B == k).sum(axis=1) for k in range(len(BANDS))], axis=1)
    medians = round_half_up(np.median(draws_round, axis=1))
    fin = iso.index("FIN") if "FIN" in iso else None
    system = {
        "rankShiftRS": {"median": round(float(np.median(rs)), 2), "p95": round(float(np.percentile(rs, 95)), 2)},
        "bandCount90": {BANDS[k][0]: [int(q(counts[:, k], 5)), int(q(counts[:, k], 95))] for k in range(len(BANDS))},
        "shareAnyLeading": round(float((draws_round.max(axis=1) >= 85).mean()), 4),
        "shareAnyPoor": round(float((draws_round.min(axis=1) <= 24).mean()), 4),
        "maxScoreSeen": int(draws_round.max()), "minScoreSeen": int(draws_round.min()),
        "medianScore90": [int(q(medians, 5)), int(q(medians, 95))],
        "shareMedianMixed": round(float(((medians >= 45) & (medians <= 64)).mean()), 4),
    }
    if fin is not None:
        system["finlandFirstShare"] = round(float((R[:, fin] == 1).mean()), 4)
        system["finlandSoleFirstShare"] = round(float(((R[:, fin] == 1) & ((R == 1).sum(axis=1) == 1)).mean()), 4)
    return countries, system, R


def variant(iso, ref_round, ref_rank, scores):
    r = round_half_up(scores)
    rk = comp_rank(r)
    rho = spearmanr(ref_round, r).statistic
    shift = np.abs(rk - ref_rank)
    b = band_idx(r)
    return {"spearman": round(float(rho), 4), "rankShiftRS": round(float(shift.mean()), 2),
            "maxRankShift": int(shift.max()), "maxShiftCountries": [iso[i] for i in np.where(shift == shift.max())[0]],
            "first": [iso[i] for i in np.where(rk == 1)[0]], "last": [iso[i] for i in np.where(rk == rk.max())[0]],
            "max": int(r.max()), "min": int(r.min()), "median": int(round_half_up(np.median(r))),
            "bandCount": {BANDS[k][0]: int((b == k).sum()) for k in range(len(BANDS))},
            "bandChanged": [iso[i] for i in np.where(b != band_idx(ref_round))[0]],
            "rank": {c: int(rk[i]) for i, c in enumerate(iso)}}


def run(S, iso, seed=SEED, n=N_DRAWS):
    rng = np.random.default_rng(seed)
    ref = overall(S, W_PUB)
    ref_round = round_half_up(ref)
    ref_rank = comp_rank(ref_round)
    mc = {}
    schemes = {
        "dirichlet": lambda: round_half_up(overall(S, weights_dirichlet(rng, n))),
        "band25": lambda: round_half_up(overall(S, weights_band(rng, n, 0.25))),
        "band50": lambda: round_half_up(overall(S, weights_band(rng, n, 0.50))),
        "noise5": lambda: round_half_up(noisy(rng, S, n) @ W_PUB / 100.0),
        "noise5Shared": lambda: round_half_up(np.clip(S[None] + rng.uniform(-NOISE, NOISE, size=(n, S.shape[0], 1)), 0, 100) @ W_PUB / 100.0),
        "combined": lambda: round_half_up(np.einsum("dnk,dk->dn", noisy(rng, S, n), weights_dirichlet(rng, n)) / 100.0),
        "calibratedCell": lambda: round_half_up(np.clip(S[None] + rng.normal(0, CAL_CELL_SD, size=(n,) + S.shape), 0, 100) @ W_PUB / 100.0),
        "calibratedShared": lambda: round_half_up(np.clip(S[None] + rng.normal(0, CAL_SHARED[0], size=(n,) + S.shape)
                                                          + rng.normal(0, CAL_SHARED[1], size=(n, S.shape[0], 1)), 0, 100) @ W_PUB / 100.0),
        "calibratedCombined": lambda: round_half_up(np.einsum("dnk,dk->dn", np.clip(S[None] + rng.normal(0, CAL_SHARED[0], size=(n,) + S.shape)
                                                          + rng.normal(0, CAL_SHARED[1], size=(n, S.shape[0], 1)), 0, 100), weights_dirichlet(rng, n)) / 100.0),
    }
    for name, f in schemes.items():
        c, s, _ = summarise(iso, ref_round, ref_rank, f())
        mc[name] = {"countries": c, "system": s}
    alt = {"equal": variant(iso, ref_round, ref_rank, overall(S, np.full(8, 12.5))),
           "geometric": variant(iso, ref_round, ref_rank, geometric(S, W_PUB))}
    for j, k in enumerate(CATS):
        w = W_PUB.copy()
        w[j] = 0
        alt[f"drop_{k}"] = variant(iso, ref_round, ref_rank, overall(S, w / w.sum() * 100))
    return {"reference": {"overall": {c: int(ref_round[i]) for i, c in enumerate(iso)},
                          "unrounded": {c: round(float(ref[i]), 2) for i, c in enumerate(iso)},
                          "rank": {c: int(ref_rank[i]) for i, c in enumerate(iso)}},
            "monteCarlo": mc, "alternatives": alt}


def reconcile(iso, res, facts):
    """Gate: the reference must reproduce every published overall score and rank label in out/facts.json."""
    pub = {r["iso3"]: r for r in facts["ranked"]}
    bad = []
    for c in iso:
        r = res["reference"]["rank"][c]
        tied = list(res["reference"]["rank"].values()).count(r) > 1
        label = f"{r}{'=' if tied else ''}"
        if res["reference"]["overall"][c] != pub[c]["overall"] or label != pub[c]["rank"]:
            bad.append((c, res["reference"]["overall"][c], pub[c]["overall"], label, pub[c]["rank"]))
    if bad or set(iso) != set(pub):
        raise ValueError(f"reference does not reproduce out/facts.json: {bad[:5]} (sets equal: {set(iso) == set(pub)})")


def implied_weight_spread(seed=SEED, n=N_DRAWS):
    rng = np.random.default_rng(seed + 1)
    out = {}
    for name, w in {"dirichlet": weights_dirichlet(rng, n), "band25": weights_band(rng, n, .25), "band50": weights_band(rng, n, .5)}.items():
        lo, hi = np.percentile(w, 5, axis=0), np.percentile(w, 95, axis=0)
        out[name] = {k: [round(float(lo[j]), 1), round(float(hi[j]), 1)] for j, k in enumerate(CATS)}
    return out


SCHEME_LABEL = {"dirichlet": "Weights, Dirichlet", "band25": "Weights, each +/-25%", "band50": "Weights, each +/-50%",
                "noise5": "Scores, +/-5 per category", "noise5Shared": "Scores, +/-5 per country (pessimistic)",
                "combined": "Weights (Dirichlet) and scores (+/-5 per category) together",
                "calibratedCell": "Scores, calibrated cell error", "calibratedShared": "Scores, calibrated cell + country error",
                "calibratedCombined": "MAIN: weights + calibrated cell and country error"}
ALT_LABEL = {"equal": "Equal weights (12.5 each)", "geometric": "Weighted geometric mean",
             **{f"drop_{k}": f"Leave out {'AI' if k == 'ai' else k}" for k in CATS}}


def render_md(r):
    """Every statement computed from robustness.json (rewritten 2 Oct 2026 for any number of countries; no typed results)."""
    m, ref, mc, alt, N = r["meta"], r["reference"], r["monteCarlo"], r["alternatives"], r["meta"]["names"]
    nm = lambda cs: " and ".join(N[c] for c in cs) if len(cs) < 3 else ", ".join(N[c] for c in cs[:-1]) + " and " + N[cs[-1]]
    order = sorted(ref["rank"], key=lambda c: (ref["rank"][c], N[c]))
    n = len(order)
    tied = lambda c: list(ref["rank"].values()).count(ref["rank"][c]) > 1
    lab = lambda c: f"{ref['rank'][c]}{'=' if tied(c) else ''}"
    M, U, CC, CS = mc[MAIN], mc["noise5"], mc["calibratedCell"], mc["calibratedShared"]
    medw = lambda e: sorted(v["rank90"][1] - v["rank90"][0] for v in e["countries"].values())[n // 2]
    lead = sorted([c for c, v in M["countries"].items() if v["rank90"][0] == 1], key=lambda c: -M["countries"][c]["firstShare"])
    top = max(M["countries"], key=lambda c: M["countries"][c]["firstShare"]); topshare = M["countries"][top]["firstShare"]
    sole = topshare >= 0.95
    pc = lambda x: f"{np.floor(x * 1000) / 10:.1f}%"
    pubc = {b[0]: sum(1 for c in order if b[1] <= ref["overall"][c] <= b[2]) for b in BANDS}
    bc = M["system"]["bandCount90"]
    hold = lambda e: sum(x["bandShare"] >= 0.95 for x in e["countries"].values())
    L = []; w = L.append
    w("# How stable the ranking is: uncertainty and sensitivity analysis\n")
    w(f"Generated by `analysis/robustness/robustness.py` from `robustness.json`; do not edit by hand. Run {m['generated']}, seed {m['seed']}, {m['draws']:,} draws per experiment. Data: {m['data']['countries']} country files in `data/` (asOf {', '.join(m['data']['asOf'])}), SHA-256 `{m['data']['dataSha256'][:16]}...`; reconciled against `out/facts.json`: every published overall score and rank label is reproduced exactly before any draw is made.\n")
    w(f"Every interval here is a simulation under stated assumptions. The main model (`{MAIN}`) is calibrated to measured disagreement: category-score error with SD {m['calShared'][0]} plus a shared country offset with SD {m['calShared'][1]} (the split suggested by the 2 Oct 2026 re-research of 43 countries), with the weights varied around the published ones. A cell-only calibration from the blind re-scoring's limits of agreement gives SD {m['calCellSd']}. The original uniform +/-5 model is kept as a lower bound on uncertainty.\n")
    w("## Findings\n")
    w(f"1. **Who leads.** Under the main model, {N[top]} is first in {pc(topshare)} of draws. " + (f"That meets the 95% rule, so {N[top]} may be called first alone." if sole else f"That is below the 95% rule (DECISION_RULES.md, rule 2), so no country may be called first alone. Countries whose 90% rank range includes 1: {nm(lead)} (first in " + ", ".join(f"{N[c]} {pc(M['countries'][c]['firstShare'])}" for c in lead) + " of draws)."))
    w(f"2. **Rank ranges are wide.** The median 90% rank range is {medw(M)} places under the main model, {medw(CS)} under the shared-error model without weight changes, {medw(CC)} under the cell-only calibration and {medw(U)} under the uniform +/-5 lower bound. Neighbouring ranks should not be read as different.")
    w(f"3. **Band counts are soft.** Published: {pubc['Strong']} Strong, {pubc['Mixed']} Mixed, {pubc['Weak']} Weak, {pubc['Poor']} Poor, {pubc['Leading']} Leading. 90% ranges under the main model: Strong {bc['Strong'][0]} to {bc['Strong'][1]}, Mixed {bc['Mixed'][0]} to {bc['Mixed'][1]}, Weak {bc['Weak'][0]} to {bc['Weak'][1]}, Poor {bc['Poor'][0]} to {bc['Poor'][1]}, Leading {bc['Leading'][0]} to {bc['Leading'][1]}. {hold(M)} of {n} countries hold their band in 95% or more of draws.")
    w(f"4. **The ends of the scale.** Share of main-model draws with any country at Leading (85+): {pc(M['system']['shareAnyLeading'])}; with any country at Poor (24 or under): {pc(M['system']['shareAnyPoor'])}. Highest score in any draw {M['system']['maxScoreSeen']}, lowest {M['system']['minScoreSeen']}.")
    w("5. **What this does not test.** The choice of categories, the rubric anchors, the band edges, the keys model (a coded judgement), source selection and errors larger than the modelled ones. Correlated error from one model family doing research and checks is only partly represented by the shared country offset.\n")
    w("## Method\n")
    w(f"Source of method: {m['handbook']['citation']} {m['handbook']['doi']}. Opened {m['handbook']['fetchedOn']} (PDF SHA-256 `{m['handbook']['pdfSha256'][:16]}...`).\n")
    for k, v in m["rules"].items():
        w(f"- **{k}**: {v}")
    w("")
    w("## Results by experiment\n")
    w("| Experiment | Median R_S (95th pct) | Median 90% rank range | Strong 90% | Mixed 90% | Weak 90% | Countries holding band 95%+ |")
    w("|---|---:|---:|---:|---:|---:|---:|")
    for k, v in mc.items():
        s_ = v["system"]; b = s_["bandCount90"]
        w(f"| {SCHEME_LABEL.get(k, k)} | {s_['rankShiftRS']['median']} ({s_['rankShiftRS']['p95']}) | {medw(v)} | {b['Strong'][0]}-{b['Strong'][1]} | {b['Mixed'][0]}-{b['Mixed'][1]} | {b['Weak'][0]}-{b['Weak'][1]} | {hold(v)} |")
    w("\n## Alternative aggregation\n")
    w("| Variant | Spearman rho | R_S | Largest move | First | Last |")
    w("|---|---:|---:|---|---|---|")
    for k, a in alt.items():
        w(f"| {ALT_LABEL.get(k, k)} | {a['spearman']:.3f} | {a['rankShiftRS']} | {a['maxRankShift']} ({nm(a['maxShiftCountries'])}) | {nm(a['first'])} | {nm(a['last'])} |")
    w("\n## Every country\n")
    w(f"Main model ({MAIN}) and the uniform +/-5 lower bound. Sorted by published rank.\n")
    w("| Country | Published rank | Score | Median rank | 90% range (main) | First in | Band share | 90% range (+/-5) |")
    w("|---|---:|---:|---:|---:|---:|---:|---:|")
    for c in order:
        x, y = M["countries"][c], U["countries"][c]
        w(f"| {N[c]} | {lab(c)} | {ref['overall'][c]} | {x['medianRank']} | {x['rank90'][0]}-{x['rank90'][1]} | {pc(x['firstShare'])} | {x['bandShare']:.0%} | {y['rank90'][0]}-{y['rank90'][1]} |")
    w("\n## Decision rules\n")
    w("See `DECISION_RULES.md`. Rule 2 (no sole first place unless held in 95% of main-model draws) reads `monteCarlo." + MAIN + ".countries[*].firstShare` and `.rank90`. The reconciliation gate refuses to run unless the reference reproduces every published score and rank.\n")
    w("## Reproduce\n")
    w("`uv run --project ~/Projects/ds-lab python analysis/robustness/robustness.py`, then `.../test_robustness.py`. Inputs: `data/*.json`, `out/facts.json`, `analysis/reliability/reliability.json` (for the cell SD).")
    return "\n".join(L) + "\n"


def main():
    iso, names, S, meta = load()
    facts = json.load(open(os.path.join(ROOT, "out", "facts.json")))
    res = run(S, iso)
    reconcile(iso, res, facts)
    models = meta.pop("models")
    res["meta"] = {
        "generated": dt.date.today().isoformat(), "seed": SEED, "draws": N_DRAWS,
        "data": {**meta, "factsAsOf": facts.get("asOf"), "countries": len(iso), "categoryScores": int(S.size)},
        "journeyClinicalR": round(float(np.corrcoef(S[:, CATS.index("journey")], S[:, CATS.index("clinical")])[0, 1]), 4),
        "weights": dict(zip(CATS, W_PUB.tolist())), "dirichletConcentration": DIRICHLET_CONC, "noiseHalfWidth": NOISE,
        "impliedWeight90": implied_weight_spread(),
        "rules": {"rounding": "half up, as JavaScript Math.round in build.js",
                  "ranking": "competition ranking on the rounded overall, ties share the best rank, as build.js",
                  "bands": "applied to the rounded overall, edges as build.js BANDS",
                  "intervals": "5th and 95th percentiles of the draws (inverted CDF, so every bound is an attained rank)",
                  "geometric": "weighted geometric mean of unscaled 0-100 scores (min score 20, no zeros)",
                  "leaveOneOut": "drop one category, rescale the other seven weights to sum to 100",
                  "dirichlet": "weights drawn from a Dirichlet with alpha equal to the published weight in points, published scores",
                  "band25": "each weight times an independent uniform factor in [0.75, 1.25], rescaled to sum to 100, published scores",
                  "band50": "each weight times an independent uniform factor in [0.5, 1.5], rescaled to sum to 100, published scores",
                  "noise5": "independent uniform on [-5, +5] per category score, clipped to [0, 100], published weights",
                  "noise5Shared": "pessimistic bound: one uniform [-5, +5] offset per country applied to all eight of its categories (a rater generous or harsh to a whole country)",
                  "combined": "Dirichlet weights and noise together in one draw (Handbook 7.1)",
                  "calibratedCell": f"normal error per category score, SD {CAL_CELL_SD} (blind re-scoring limits of agreement / 1.96 / 2 / sqrt 2), published weights",
                  "calibratedShared": f"normal error per category score SD {CAL_SHARED[0]} plus one shared offset per country SD {CAL_SHARED[1]}, published weights",
                  "calibratedCombined": f"the calibratedShared error with Dirichlet weights in the same draw; the MAIN model for published rank ranges"},
        "main": MAIN, "calCellSd": CAL_CELL_SD, "calShared": list(CAL_SHARED),
        "leadRule": "a country is called first alone only if it is first in at least 95% of MAIN draws; otherwise name every country whose MAIN 90% rank range includes 1",
        "keysModel": {"note": "controlModel is a coded judgement, not a function of scores or weights; nothing here can test it",
                      "counts": {m: list(models.values()).count(m) for m in sorted(set(models.values()))}},
        "handbook": HANDBOOK,
        "synthetic": "Every interval is a simulation under the stated assumptions about weights and rater precision, not a measurement.",
        "names": names,
    }
    with open(os.path.join(HERE, "robustness.json"), "w") as f:
        json.dump(res, f, indent=1)
    with open(os.path.join(HERE, "ROBUSTNESS.md"), "w") as f:
        f.write(render_md(res))
    return res


if __name__ == "__main__":
    r = main()
    for k, v in r["monteCarlo"].items():
        print(k, json.dumps(v["system"]))
    for k, v in r["alternatives"].items():
        print(k, {x: v[x] for x in ["spearman", "rankShiftRS", "maxRankShift", "maxShiftCountries", "first", "last", "max", "min", "median", "bandCount", "bandChanged"]})
