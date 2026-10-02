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
NOISE = 5.0  # rater precision: uniform on [-5, +5] per category score
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
    countries = {c: {"medianRank": int(med[i]), "rank90": [int(lo[i]), int(hi[i])],
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
                "combined": "Weights (Dirichlet) and scores (+/-5 per category) together"}
ALT_LABEL = {"equal": "Equal weights (12.5 each)", "geometric": "Weighted geometric mean",
             **{f"drop_{k}": f"Leave out {'AI' if k == 'ai' else k}" for k in CATS}}


def render_md(r):
    m, ref, mc, alt, N = r["meta"], r["reference"], r["monteCarlo"], r["alternatives"], r["meta"]["names"]
    nm = lambda cs: " and ".join(N[c] for c in cs)
    order = sorted(ref["rank"], key=lambda c: (ref["rank"][c], N[c]))
    tied = lambda c: list(ref["rank"].values()).count(ref["rank"][c]) > 1
    lab = lambda c: f"{ref['rank'][c]}{'=' if tied(c) else ''}"
    C, P = mc["combined"], mc["noise5Shared"]
    main = [k for k in mc if k != "noise5Shared"]
    rho_min = min(a["spearman"] for a in alt.values())
    smax = max(mc[k]["system"]["maxScoreSeen"] for k in mc)
    smin = min(mc[k]["system"]["minScoreSeen"] for k in mc)
    med_lo = min(mc[k]["system"]["medianScore90"][0] for k in main); med_hi = max(mc[k]["system"]["medianScore90"][1] for k in main)
    sc = C["system"]["bandCount90"]
    widths = sorted(v["rank90"][1] - v["rank90"][0] for v in C["countries"].values())
    mid_w = widths[len(widths) // 2]
    firm = sum(v["bandShare"] >= 0.95 for v in C["countries"].values())
    firmP = sum(v["bandShare"] >= 0.95 for v in P["countries"].values())
    edge = [c for c in order if any(mc[k]["countries"][c]["bandShare"] < 0.9 for k in main)]
    lastsole = {c: sum(1 for a in alt.values() if a["last"] == [c]) for c in ["EGY", "MEX"]}
    lasttie = sum(1 for a in alt.values() if len(a["last"]) > 1)
    u = ref["unrounded"]
    fin_all_alt = all(a["first"] == ["FIN"] for a in alt.values())
    fin_mc = min(mc[k]["system"]["finlandFirstShare"] for k in main)
    fin_floor = f"{np.floor(fin_mc * 1000) / 10:.1f}%"  # never round a share up to 100%
    est2 = all(a["rank"]["EST"] == 2 for a in alt.values())
    dnk_out = [ALT_LABEL[k].lower() for k, a in alt.items() if a["rank"]["DNK"] != 3]
    rjc = r["meta"]["journeyClinicalR"]
    L = []
    w = L.append
    w("# How stable the ranking is: uncertainty and sensitivity analysis\n")
    w(f"Generated by `analysis/robustness/robustness.py` from `robustness.json`; do not edit by hand. Run {m['generated']}, seed {m['seed']}, {m['draws']:,} draws per experiment. Data: {m['data']['countries']} country files in `data/` (asOf {', '.join(m['data']['asOf'])}), SHA-256 `{m['data']['dataSha256'][:16]}...`; reconciled against `out/facts.json` (asOf {m['data']['factsAsOf']}): every published overall score and rank label is reproduced exactly before any draw is made.\n")
    w("Every interval in this file is a simulation under stated assumptions about the weights and about rater precision. It is not a measurement of rater error; no inter-rater study exists for this index.\n")
    w("## Findings, ranked\n")
    w("Ranked as house practice: a figure that could be wrong or misread, then coverage, then presentation.\n")
    w(f"1. **\"Mexico (31) is last\" misreads a tie.** Egypt and Mexico both score 31 and share rank {lab('MEX')}. The paper's generated sentence (`scripts/paper_gen.js`, `G.bottom = F.ranked.at(-1)`) names the alphabetically later of the tied pair. Unrounded, Egypt is lower ({u['EGY']} against {u['MEX']}). Across the 10 alternative builds, Mexico is alone at the bottom in {lastsole['MEX']}, Egypt in {lastsole['EGY']}, and they tie in {lasttie}. Suggested wording: \"Egypt and Mexico (31) share last place.\" Not edited here (paper/ and scripts are out of scope).")
    w(f"2. **The band counts are softer than the ranking.** Ten Strong rests on Belgium ({u['BEL']}) and Sweden ({u['SWE']}, rounded up to 65); the Netherlands ({u['NLD']}), Norway ({u['NOR']}) and Portugal ({u['PRT']}) sit one point under the line. With weights and scores varied together, the count of Strong countries has a 90% range of {sc['Strong'][0]} to {sc['Strong'][1]}, Mixed {sc['Mixed'][0]} to {sc['Mixed'][1]}, Weak {sc['Weak'][0]} to {sc['Weak'][1]}. On the Weak/Mixed line, Russia ({u['RUS']}) rounds up into Mixed, and Chile, New Zealand, South Africa and Colombia sit 1 to 2 points under it. Countries whose band holds in under 90% of draws in at least one experiment: {', '.join(N[c] for c in edge)}.")
    w(f"3. **Two published ranks sit on a rounding edge.** Germany ({u['DEU']}) and Latvia ({u['LVA']}) are exactly half a point from the next integer and round up (JavaScript `Math.round`, half up). Their median ranks across draws ({C['countries']['DEU']['medianRank']} and {C['countries']['LVA']['medianRank']}) are worse than their published ranks ({lab('DEU')} and {lab('LVA')}). Python's `round()` would publish Germany at 62; the test plants that bug and the reconciliation gate catches it.")
    w(f"4. **If rater error is shared across a whole country, the ranking loosens a lot.** The pessimistic run (one +/-5 offset per country, applied to all eight categories) keeps Finland first in {P['system']['finlandFirstShare']:.1%} of draws (alone in {P['system']['finlandSoleFirstShare']:.0%}), and only {firmP} of 65 countries hold their band in 95% of draws, against {firm} of 65 when errors are independent by category. Which model is right is unknown: it needs a second rater on a sample of countries.")
    w("5. **Coverage: what this does not test.** The choice of the eight categories, the rubric anchors, the band edges, the keys model (`controlModel` is a coded judgement and no weight or score change can move it, so \"none Individual\" is neither confirmed nor threatened here), source selection, and errors larger than five points (the audit found 10 to 36 point inconsistencies before rescoring, paper section 7.1). Perturbations are centred on the published weights, so they test precision around our choice, not a different philosophy of weighting.")
    w("6. **House gate gap.** The repository has no `DECISION_RULES.md`. The rules proposed below are written here, not enacted.\n")
    w("## Definitions\n")
    w("- **Overall score**: weighted arithmetic mean of the eight category scores with the published weights (access 20, control 20, privacy 15, commercial 10, journey 15, clinical 10, research 5, AI 5), rounded half up to an integer, exactly as `build.js`.")
    w("- **Rank**: competition ranking on the rounded overall (ties share the best rank, shown \"4=\"), as `build.js`.")
    w("- **Band**: Poor 0-24, Weak 25-44, Mixed 45-64, Strong 65-84, Leading 85-100, applied to the rounded overall.")
    w("- **Median rank and 90% interval**: median and 5th and 95th percentiles of a country's rank across draws (inverted CDF, so every bound is a rank that occurred). This is the Handbook's Figure 18 convention.")
    w("- **Band share**: share of draws in which the country's band equals its published band.")
    w("- **Average rank shift (R_S)**: mean over the 65 countries of the absolute difference between published rank and variant rank (Handbook, Step 7, equation 38).")
    w("- **Spearman rho**: rank correlation between the published rounded overall and the variant's rounded overall (ties averaged).\n")
    w("## Method\n")
    w(f"Source of method: {m['handbook']['citation']} {m['handbook']['doi']}. Opened {m['handbook']['fetchedOn']} at oecd.org (PDF SHA-256 `{m['handbook']['pdfSha256'][:16]}...`). The passages used:\n")
    for k, v in m["handbook"]["passages"].items():
        w(f"- {k}: {v}.")
    w("\nExperiments (each 10,000 draws, fixed seed, numpy `default_rng`):\n")
    for k, v in SCHEME_LABEL.items():
        w(f"- **{v}** (`{k}`): {m['rules'].get(k, '')}".rstrip(": "))
    w(f"- Dirichlet: alpha equal to the published weight in points (concentration {m['dirichletConcentration']:.0f}). +/-25% and +/-50%: each weight multiplied by an independent uniform factor, then all eight rescaled to sum to 100 (so a weight can land slightly outside its nominal band).")
    w("- Alternatives, each computed once: equal weights; weighted geometric mean of the unscaled scores (no score is zero; the lowest is 20); leave one category out, eight times, with the other weights rescaled to 100.\n")
    w("**Calibration of the weight draws** (5th to 95th percentile of each weight, in points). The Dirichlet is not a uniform band: it moves a 20-point weight by about a fifth and a 5-point weight by about half.\n")
    w("| Category | Published | Dirichlet | +/-25% | +/-50% |")
    w("|---|---:|---:|---:|---:|")
    for k in CATS:
        iw = m["impliedWeight90"]
        w(f"| {k} | {m['weights'][k]:.0f} | {iw['dirichlet'][k][0]}-{iw['dirichlet'][k][1]} | {iw['band25'][k][0]}-{iw['band25'][k][1]} | {iw['band50'][k][0]}-{iw['band50'][k][1]} |")
    w("\n**Leakage and circularity.** Nothing is fitted, so there is no train/test leakage. The one risk is choosing perturbation widths after seeing results: the +/-25%, +/-50% and +/-5 widths were fixed by the brief and the Dirichlet concentration before the first run, and none was changed afterwards. The reference ranking is the published one, reproduced from the data, not re-tuned.\n")
    w("## Results\n")
    w("### Monte Carlo experiments\n")
    w("| Experiment | Median R_S (95th pct) | Finland first | Strong count, 90% | Mixed | Weak | Max score seen | Min seen | Median score, 90% | Countries holding band in 95%+ of draws |")
    w("|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|")
    for k, v in mc.items():
        s_ = v["system"]; b = s_["bandCount90"]
        hold = sum(x["bandShare"] >= 0.95 for x in v["countries"].values())
        w(f"| {SCHEME_LABEL[k]} | {s_['rankShiftRS']['median']} ({s_['rankShiftRS']['p95']}) | {s_['finlandFirstShare']:.2%} | {b['Strong'][0]}-{b['Strong'][1]} | {b['Mixed'][0]}-{b['Mixed'][1]} | {b['Weak'][0]}-{b['Weak'][1]} | {s_['maxScoreSeen']} | {s_['minScoreSeen']} | {s_['medianScore90'][0]}-{s_['medianScore90'][1]} | {hold} of 65 |")
    w("\nPublished: Strong 10, Mixed 40, Weak 15, median 57, top score 77, bottom 31.\n")
    w("### Alternative aggregation\n")
    w("| Variant | Spearman rho | R_S | Largest move | First | Last | Strong / Mixed / Weak | Band changes |")
    w("|---|---:|---:|---|---|---|---|---:|")
    for k, a in alt.items():
        bc = a["bandCount"]
        w(f"| {ALT_LABEL[k]} | {a['spearman']:.3f} | {a['rankShiftRS']} | {a['maxRankShift']} ({nm(a['maxShiftCountries'])}) | {nm(a['first'])} | {nm(a['last'])} | {bc['Strong']} / {bc['Mixed']} / {bc['Weak']} | {len(a['bandChanged'])} |")
    w(f"\nThe geometric mean is lower than the arithmetic mean by construction, so its band counts are not comparable with the published ones; only its ranks are. Leaving out control moves the ranking most (R_S {alt['drop_control']['rankShiftRS']}). Leaving out journey ({alt['drop_journey']['rankShiftRS']}) or clinical ({alt['drop_clinical']['rankShiftRS']}) moves it less, as expected when the two overlap (Pearson r = {rjc:.2f} across the 65 countries, computed here; paper 7.4). Norway moves most under equal weights and leave-out-control because its profile is one high score (control 82) among middling ones; Singapore moves most elsewhere because its strengths are in the lighter categories (clinical 78, AI 72) and its weak ones in the heavy ones (access 50, control 45).\n")
    w("### Headline claims\n")
    claims = [
        ("No country reaches Leading (85+)", all(v["system"]["shareAnyLeading"] == 0 for v in mc.values()) and all(a["max"] < 85 for a in alt.values()),
         f"Survives every experiment and variant. Highest score in any draw {smax}; highest in any variant {max(a['max'] for a in alt.values())}."),
        ("None falls to Poor (under 25)", all(v["system"]["shareAnyPoor"] == 0 for v in mc.values()) and all(a["min"] >= 25 for a in alt.values()),
         f"Survives. Lowest score in any draw {smin} (pessimistic run); lowest in any variant {min(a['min'] for a in alt.values())}."),
        ("Finland is first", fin_all_alt and fin_mc >= 0.95,
         f"Survives all 10 variants and at least {fin_floor} of draws in every experiment except the pessimistic one ({P['system']['finlandFirstShare']:.1%})."),
        ("The median country is Mixed (median 57)", all(v["system"]["shareMedianMixed"] == 1 for v in mc.values()),
         f"Mixed survives everywhere. The value 57 does not: median score {med_lo} to {med_hi} across experiments, {min(a['median'] for a in alt.values())} to {max(a['median'] for a in alt.values())} across variants."),
        ("10 Strong, 40 Mixed, 15 Weak", False, f"Does not survive as exact counts: Strong {sc['Strong'][0]}-{sc['Strong'][1]}, Mixed {sc['Mixed'][0]}-{sc['Mixed'][1]}, Weak {sc['Weak'][0]}-{sc['Weak'][1]} (90%, combined). Say \"about ten\" or give the range."),
        ("Mexico is last", False, f"Does not survive, and is not true as published: a tie with Egypt. Sole last in {lastsole['MEX']} of 10 variants."),
        ("Estonia second, Denmark third", None, f"Estonia: median rank {C['countries']['EST']['medianRank']}, 90% {C['countries']['EST']['rank90'][0]}-{C['countries']['EST']['rank90'][1]}; {'second or tied second in every variant' if est2 else 'not second in every variant'}. Denmark: 90% {C['countries']['DNK']['rank90'][0]}-{C['countries']['DNK']['rank90'][1]}; ranked below third under {len(dnk_out)} of 10 variants ({', '.join(dnk_out)}). Say \"Finland, then Estonia, then a close group\"."),
        ("No country gives the person the keys (none Individual)", None, "Not tested and not testable here: a coded judgement, independent of scores and weights."),
    ]
    w("| Claim | Survives? | Evidence |")
    w("|---|---|---|")
    for i, (cl, ok, ev) in enumerate(claims):
        verdict = "yes" if ok else ("no" if ok is False else ("not tested" if i == len(claims) - 1 else "partly"))
        w(f"| {cl} | {verdict} | {ev} |")
    w("\n### Every country (small-multiples ready)\n")
    w("Combined experiment (weights and scores varied together, the Handbook's single Monte Carlo design). The last column is the pessimistic bound. Sorted by published rank.\n")
    w("| Country | Published rank | Score | Median rank | 90% interval | Band share | Pessimistic 90% interval |")
    w("|---|---:|---:|---:|---:|---:|---:|")
    for c in order:
        x, y = C["countries"][c], P["countries"][c]
        w(f"| {N[c]} | {lab(c)} | {ref['overall'][c]} | {x['medianRank']} | {x['rank90'][0]}-{x['rank90'][1]} | {x['bandShare']:.0%} | {y['rank90'][0]}-{y['rank90'][1]} |")
    w(f"\nPer-experiment intervals for every country are in `robustness.json` under `monteCarlo.<experiment>.countries`. Median width of the 90% interval: {mid_w} places (combined).\n")
    w("## Figure spec for the Tufte seat\n")
    w("- **Comparison it exists to make**: where each country's published rank sits inside the range of ranks it could plausibly hold.")
    w("- **Form**: dot-and-whisker, one row per country (65 rows), sorted by published rank, rank 1 at top. x axis rank 1 to 65 (1 at left). Whisker from 5th to 95th percentile rank (combined). Filled dot at the median rank. Short vertical tick at the published rank (the Handbook's Figure 18 layout: grey published mark, black median, bounds).")
    w("- **Optional second layer**: a thin, lighter whisker for the pessimistic interval behind the main one. If it crowds, drop it and say so in the note.")
    w("- **Band context**: faint horizontal rules between published bands (Strong / Mixed / Weak), labelled at the right margin, no fills.")
    w("- **Labels**: country names left, published score right of each row. Low-confidence countries keep the hollow-dot convention of the index.")
    w(f"- **Source line**: \"Source: SuperTruth, Who Holds the Record v1, scores as of {', '.join(m['data']['asOf'])}. Rank intervals from {m['draws']:,} draws varying the weights (Dirichlet around the published weights) and each category score (+/-5) together; method after OECD/JRC (2008). Simulation, not measurement.\"")
    w("- **Data**: `robustness.json`: `reference.rank`, `monteCarlo.combined.countries[*].medianRank`, `.rank90`; `monteCarlo.noise5Shared.countries[*].rank90`. Colour is the Tufte seat's call; one hue is enough.\n")
    w("## Decision rules these numbers feed (proposed)\n")
    w("No `DECISION_RULES.md` exists yet; these are proposals with the incident that motivates each.\n")
    w("1. A sentence that names a sole holder of a rank (\"X leads\", \"X is last\") ships only if X holds that rank alone in 95% or more of combined draws and in every alternative. Incident: \"Mexico (31) is last\" (a tie). Check: none yet.")
    w("2. A band count in prose carries its 90% range or the word \"about\" when the combined range is wider than plus or minus one. Incident: Strong 10, range above. Check: none yet.")
    w("3. Two countries are called different in rank only when their combined 90% intervals do not overlap. Check: none yet.")
    w("4. The analysis refuses to run unless it reproduces every published score and rank label. Incident: banker's rounding would publish Germany at 62. Check: `reconcile()` plus the planted rounding bug in the test.\n")
    w("## The verifier and how it was attacked\n")
    w("`test_robustness.py` (24 checks, exit 0 only if all pass). It plants three bugs that the reconciliation gate must catch (banker's rounding, swapped access and privacy weights, one score off by one); a negative control (zero noise collapses every interval to the published rank and R_S to 0); a known effect on real data (+25 on Mexico's access must move its score by exactly 5 and lift its median rank, and an unplanted copy must not); SYNTHETIC fixtures with known answers (a dominant country first in every draw of every experiment; a one-point gap that noise must blur; a balanced and an unbalanced profile with the same weighted mean that the geometric mean must separate; a country strong only in AI that leaving out AI must drop); weight calibration (draws centre on the published weights, every draw sums to 100); and that `robustness.json` equals a fresh run with the same seed and data hash. Two of the first-draft checks failed because the test's own expectations were wrong (a +25 plant on a 20% weight is +5 overall, not enough to leave Weak; an \"unbalanced\" fixture was not at the same weighted mean); both were corrected to exact known values.\n")
    w("## Paste-ready subsection for the paper\n")
    w("### How stable the ranking is\n")
    w(f"We tested how much the ranking depends on our own choices, following the uncertainty and sensitivity analysis set out in the OECD and European Commission Joint Research Centre Handbook on Constructing Composite Indicators [new reference]. We redrew the eight weights {m['draws']:,} times around the published ones, in three ways (a Dirichlet draw, and each weight moved by up to 25% or up to 50% and then rescaled). We added up to five points of random error to every category score, which matches the rating's resolution. We also did both at once. Separately, we rebuilt the index with equal weights, with a geometric mean, and eight times with one category left out. Finland is first in every rebuilt index and in at least {fin_floor} of draws. No country reaches Leading and none falls to Poor in any draw: the highest score seen is {smax} and the lowest {smin}. The median country stays Mixed ({med_lo} to {med_hi}). The rebuilt rankings correlate with ours at {rho_min:.2f} or above (Spearman). With weights and score error varied together, half the countries have a 90% rank interval of {mid_w} places or fewer. The band counts are softer than the ranking. Belgium ({u['BEL']:.1f}) and Sweden ({u['SWE']:.1f}) sit on the Strong line, and the Netherlands, Norway and Portugal sit one point under it, so the number of Strong countries ranges from {sc['Strong'][0]} to {sc['Strong'][1]} across draws. Egypt and Mexico share last place at 31. If a rater were generous or harsh by up to five points across a whole country, rather than category by category, Finland would stay first in {P['system']['finlandFirstShare']:.1%} of draws and ranks would loosen further. Read bands before ranks, and ranks as a range. Table N gives each country's median rank and 90% interval. The code, the seed and every setting are published with the index.\n")
    w(f"Reference to add: {m['handbook']['citation']} {m['handbook']['doi']}\n")
    w("## Provenance and services\n")
    w(f"- Inputs: the project's own frozen country files (`data/*.json`, SuperTruth research, asOf {', '.join(m['data']['asOf'])}, 65 countries, 520 category scores, none missing) and `out/facts.json` as the reconciliation target. No outside data service is used; none of the data-scientist seat's house services (client warehouses, Databricks, DataSpine, openFDA, PubMed, ClinicalTrials.gov, Census) holds these scores.")
    w(f"- Method source: the Handbook PDF from oecd.org, opened {m['handbook']['fetchedOn']}, pages cited above.")
    w("- Environment: house ds-lab (`uv run --project ~/Projects/ds-lab`), numpy and scipy.")
    w("- Reproduce: `uv run --project ~/Projects/ds-lab python analysis/robustness/robustness.py`, then `.../test_robustness.py`.")
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
                  "combined": "Dirichlet weights and noise together in one draw (Handbook 7.1)"},
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
