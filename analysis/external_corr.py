"""Rank correlations between this index and external indices. Sanity check, not validation.
External values transcribed from the opened sources (see EXT dict comments); GDHM pulled live from WHO xmart
(analysis/external/who_gdhm_relay_2026-10-01.csv)."""
import json, glob, os, numpy as np, pandas as pd
from scipy.stats import spearmanr, kendalltau
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
W = dict(access=20, control=20, privacy=15, commercial=10, journey=15, clinical=10, research=5, ai=5)
D = {json.load(open(f))["iso3"]: json.load(open(f)) for f in glob.glob(f"{ROOT}/data/*.json")}
ours = pd.DataFrame({i: {**{k: d["categories"][k]["score"] for k in W}, "overall": sum(d["categories"][k]["score"] * w for k, w in W.items()) / 100} for i, d in D.items()}).T
# EC 2025 Digital Decade eHealth indicator study, Appendix A p.72, composite score, data cut-off 31 Dec 2024
EC = dict(AUT=87, BEL=100, DNK=98, EST=100, FIN=85, FRA=84, DEU=87, IRL=25, ITA=84, NLD=65, NOR=91, POL=92, ESP=88, SWE=78)
# OECD Health Working Paper 160 (2023), Table D.1 technical/operational readiness (max 9), 2021 survey
OT = dict(AUS=6, BEL=6.5, CAN=5, DNK=7, EST=7, FIN=8.5, DEU=2.5, IRL=3.5, ISR=6, ITA=7.5, JPN=7.5, KOR=7, MEX=3, NLD=7.5, NOR=5.5, SWE=5.5, CHE=3.5, USA=6)
# same, Table D.12 eHR governance enabling data analytics (-1..3)
OG = dict(AUS=1, BEL=2, CAN=0, DNK=3, EST=3, FIN=2, DEU=0, IRL=0, ISR=3, ITA=0, JPN=2, KOR=-1, MEX=-1, NLD=2, NOR=2, SWE=2, CHE=-1, USA=2)
# Bertelsmann #SmartHealthSystems 2018 summary, Figure 2: policy, readiness, actual use; composite = mean
BS = dict(EST=(88.1, 86.1, 71.7), CAN=(87.3, 71.6, 65.3), DNK=(80.8, 66.0, 70.6), ISR=(78.5, 69.5, 69.4), ESP=(73.8, 76.9, 63.3),
          GBR=(78.1, 72.5, 59.3), SWE=(79.9, 67.4, 57.5), NLD=(85.2, 51.8, 61.2), AUT=(78.8, 60.7, 39.9), AUS=(60.3, 64.4, 47.2),
          ITA=(73.6, 56.6, 37.3), BEL=(73.8, 53.7, 36.6), CHE=(63.9, 44.0, 14.0), FRA=(39.9, 33.2, 21.7), DEU=(42.2, 30.1, 15.8), POL=(48.0, 25.9, 11.8))
m49 = json.load(open(f"{ROOT}/analysis/external/iso3_to_m49.json")); inv = {v: k for k, v in m49.items()}
g = pd.read_csv(f"{ROOT}/analysis/external/who_gdhm_relay_2026-10-01.csv", dtype={"DIM_GEO_CODE_M49": str})
g["iso3"] = g.DIM_GEO_CODE_M49.map(inv); g = g[(g.DIM_TIME == 2023) & g.iso3.notna()]
resp = g[g.IND_CODE == "GDHM_SURVEY_COUNTRYRESPONSE_SCORE"]
na = resp.assign(na=resp.VALUE_LABEL.eq("Not Available")).groupby("iso3").na.sum()
full = sorted(na[na <= 1].index)  # countries with a full 2023 response (<=1 of 24 items unavailable)
def q(code):
    x = resp[(resp.DIM_MEMBER_2_CODE == code) & resp.VALUE_LABEL.str.startswith("Phase")]
    return dict(zip(x.iso3, x.VALUE_NUMERIC))
G8, G15, G9a = q("GDHM_Q08"), q("GDHM_Q15"), q("GDHM_Q09a")
GO = dict(zip(g[g.IND_CODE == "GDHM_SURVEY_OVERALL_AVG"].iso3, g[g.IND_CODE == "GDHM_SURVEY_OVERALL_AVG"].VALUE_NUMERIC))
rng = np.random.default_rng(20261001)
OUT = []  # written to analysis/external/external_corr.json for scripts/paper_gen.js
def corr(name, ext, cat, keep=None, drop=()):
    ks = [k for k in ext if k in ours.index and (keep is None or k in keep) and k not in drop]
    x = np.array([ext[k] for k in ks], float); y = ours.loc[ks, cat].astype(float).values
    rho, p = spearmanr(x, y); tau, _ = kendalltau(x, y)
    bs = []
    for _ in range(4000):
        i = rng.integers(0, len(ks), len(ks))
        if len(set(x[i])) > 1 and len(set(y[i])) > 1: bs.append(spearmanr(x[i], y[i])[0])
    lo, hi = np.percentile(bs, [2.5, 97.5])
    OUT.append(dict(name=name, cat=cat, n=len(ks), rho=round(float(rho), 2), lo=round(float(lo), 2), hi=round(float(hi), 2), countries=sorted(ks)))
    print(f"{name:60s} vs {cat:9s} n={len(ks):2d} rho={rho:+.2f} [{lo:+.2f},{hi:+.2f}] tau={tau:+.2f} p={p:.3f}  ({' '.join(sorted(ks)) if len(ks)<20 else ''})")
corr("EC eHealth composite 2024", EC, "access")
corr("EC eHealth composite 2024, minus BEL ESP IRL (cite it)", EC, "access", drop=("BEL", "ESP", "IRL"))
corr("EC eHealth composite 2024, minus IRL", EC, "access", drop=("IRL",))
corr("OECD tech/operational readiness 2021", OT, "journey")
corr("OECD tech/operational readiness 2021", OT, "clinical")
corr("OECD tech/operational readiness 2021", OT, "overall")
corr("OECD eHR governance for analytics 2021", OG, "research")
corr("Bertelsmann DHI composite 2018", {k: sum(v) / 3 for k, v in BS.items()}, "overall")
corr("Bertelsmann actual-use sub-index 2018", {k: v[2] for k, v in BS.items()}, "journey")
corr("Bertelsmann actual-use sub-index 2018", {k: v[2] for k, v in BS.items()}, "access")
corr("GDHM 2023 Q08 privacy law phase, full responders", G8, "privacy", keep=full)
corr("GDHM 2023 Q08 privacy law phase, all with a value", G8, "privacy")
corr("GDHM 2023 Q15 HIE/architecture phase, full responders", G15, "journey", keep=full)
corr("GDHM 2023 Q09a AI protocol phase, full responders", G9a, "ai", keep=full)
corr("GDHM 2023 overall phase, full responders", GO, "overall", keep=full)
print("GDHM full responders:", full)
import datetime
json.dump(dict(computed=datetime.date.today().isoformat(), ourCountries=len(ours), gdhmFullResponders=[k for k in full if k in ours.index], rows=OUT),
          open(f"{ROOT}/analysis/external/external_corr.json", "w"), indent=1)
