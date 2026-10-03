"""Rank correlations between this index and external indices. Sanity check, not validation.
External values transcribed from the opened sources (see EXT dict comments); GDHM pulled live from WHO xmart
(analysis/external/who_gdhm_relay_2026-10-01.csv)."""
import json, glob, numpy as np, pandas as pd
from scipy.stats import spearmanr, kendalltau
ROOT = __import__("os").path.dirname(__import__("os").path.dirname(__import__("os").path.abspath(__file__)))
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
# Coverage check (DECISION_RULES.md rule 1): the UN M49 table must hold every country in data/ except the named exceptions.
# A 65-row table frozen from the 65-country index silently dropped 133 countries from the GDHM rows (REVIEW2_methods M1).
M49_META = json.load(open(f"{ROOT}/analysis/external/iso3_to_m49.meta.json"))
if M49_META["rows"] != len(m49): raise SystemExit(f"iso3_to_m49.json has {len(m49)} rows, its meta says {M49_META['rows']}")
_miss = sorted(set(D) - set(m49) - set(M49_META["exceptions"]))
if _miss: raise SystemExit(f"iso3_to_m49.json is missing {len(_miss)} countries in data/: {' '.join(_miss[:20])}")
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

# ---- 2 Oct 2026 (academic referee, F2): national income and a person-side measure of practice ----
# World Bank WDI NY.GDP.PCAP.PP.CD (GDP per head, PPP, current international $), latest year per country (2022 to 2024 in the data),
# raw API response cached at analysis/external/wdi_gdp_pcap_ppp.json (keyless API, pulled 2 Oct 2026).
wdi = json.load(open(f"{ROOT}/analysis/external/wdi_gdp_pcap_ppp.json"))[1]
GDP, GDPY = {}, {}
for r in wdi:
    k, v, y = r["countryiso3code"], r["value"], int(r["date"])
    if k in ours.index and v is not None and y > GDPY.get(k, 0): GDP[k], GDPY[k] = float(v), y
TWN_NOTE = "TWN is not in WDI" if "TWN" in ours.index and "TWN" not in GDP else ""
def boot_ci(f, n, reps=4000):
    bs = []
    for _ in range(reps):
        i = rng.integers(0, n, n)
        try:
            v = f(i)
            if np.isfinite(v): bs.append(v)
        except Exception: pass
    return [round(float(x), 2) for x in np.percentile(bs, [2.5, 97.5])]
def spear_ci(x, y):
    x, y = np.asarray(x, float), np.asarray(y, float)
    r = spearmanr(x, y)[0]
    return round(float(r), 2), boot_ci(lambda i: spearmanr(x[i], y[i])[0] if len(set(x[i])) > 1 and len(set(y[i])) > 1 else np.nan, len(x))
def partial_spear(x, y, z):
    from scipy.stats import rankdata
    rx, ry, rz = rankdata(x), rankdata(y), rankdata(z)
    res = lambda a: a - np.polyval(np.polyfit(rz, a, 1), rz)
    return float(np.corrcoef(res(rx), res(ry))[0, 1])
inc = {}
ks = sorted(k for k in GDP)
rho, ci = spear_ci([GDP[k] for k in ks], ours.loc[ks, "overall"])
inc["overallVsGdp"] = dict(n=len(ks), rho=rho, lo=ci[0], hi=ci[1], years=f"{min(GDPY.values())} to {max(GDPY.values())}", note=TWN_NOTE)
eu = [k for k in ks if D[k]["region"] == "Europe"]
rho, ci = spear_ci([GDP[k] for k in eu], ours.loc[eu, "overall"])
inc["withinEurope"] = dict(n=len(eu), rho=rho, lo=ci[0], hi=ci[1])
lg = np.log([GDP[k] for k in ks]); ov = ours.loc[ks, "overall"].astype(float).values
b1, b0 = np.polyfit(lg, ov, 1); pred = b0 + b1 * lg; resid = ov - pred
inc["fit"] = dict(slopePerLogUnit=round(float(b1), 1), r2=round(float(1 - ((ov - pred) ** 2).sum() / ((ov - ov.mean()) ** 2).sum()), 2))
order = np.argsort(resid)
inc["below"] = [dict(iso3=ks[i], resid=round(float(resid[i]), 1)) for i in order[:6]]
inc["above"] = [dict(iso3=ks[i], resid=round(float(resid[i]), 1)) for i in order[::-1][:6]]
gk = [k for k in full if k in GO and k in GDP and k in ours.index]
x, y, z = np.array([GO[k] for k in gk], float), ours.loc[gk, "overall"].astype(float).values, np.log([GDP[k] for k in gk])
inc["gdhmOverall"] = dict(n=len(gk), rhoOurs=spear_ci(x, y)[0], rhoGdhmGdp=spear_ci(x, z)[0], rhoOursGdp=spear_ci(y, z)[0],
                          partial=round(partial_spear(x, y, z), 2), partialCi=boot_ci(lambda i: partial_spear(x[i], y[i], z[i]), len(gk)))
print("income:", json.dumps(inc)[:600])
# Eurostat isoc_ci_ac_i, indic_is I_IUAPR (individuals who accessed personal health records online, % of individuals), 2024,
# raw response cached at analysis/external/eurostat_isoc_ci_ac_i_I_IUAPR_2024.json (keyless API, pulled 2 Oct 2026).
es = json.load(open(f"{ROOT}/analysis/external/eurostat_isoc_ci_ac_i_I_IUAPR_2024.json"))
geo = es["dimension"]["geo"]["category"]["index"]; inv_geo = {v: k for k, v in geo.items()}
E2I = dict(BE="BEL", BG="BGR", CZ="CZE", DK="DNK", DE="DEU", EE="EST", IE="IRL", EL="GRC", ES="ESP", FR="FRA", HR="HRV", IT="ITA", CY="CYP", LV="LVA",
           LT="LTU", LU="LUX", HU="HUN", MT="MLT", NL="NLD", AT="AUT", PL="POL", PT="PRT", RO="ROU", SI="SVN", SK="SVK", FI="FIN", SE="SWE", IS="ISL",
           NO="NOR", CH="CHE", UK="GBR", BA="BIH", ME="MNE", MK="MKD", AL="ALB", RS="SRB", TR="TUR", XK="XKX")
EU_USE = {E2I[inv_geo[int(i)]]: float(v) for i, v in es["value"].items() if inv_geo[int(i)] in E2I and E2I[inv_geo[int(i)]] in ours.index}
ek = sorted(EU_USE)
rho, ci = spear_ci([EU_USE[k] for k in ek], ours.loc[ek, "access"])
eurostat = dict(year=2024, indicator="I_IUAPR", n=len(ek), rhoAccess=rho, lo=ci[0], hi=ci[1], values={k: EU_USE[k] for k in ek},
                accessScores={k: int(ours.loc[k, "access"]) for k in ek})
for cat in ("journey", "clinical", "overall"):
    r2, c2 = spear_ci([EU_USE[k] for k in ek], ours.loc[ek, cat]); eurostat["rho_" + cat] = dict(rho=r2, lo=c2[0], hi=c2[1])
print("eurostat:", json.dumps({k: v for k, v in eurostat.items() if k not in ("values", "accessScores")}))
# ---- 2 Oct 2026 (REVIEW2_policy M1): rights and delivery sub-scores, paper only, not on the site ----
# rights = access, control, privacy, commercial, research; delivery = journey, clinical, AI; published weights renormalised within each group.
SUB = dict(rights=dict(access=20, control=20, privacy=15, commercial=10, research=5), delivery=dict(journey=15, clinical=10, ai=5))
sub = {}
for nm, ws in SUB.items():
    col = sum(ours[k].astype(float) * w for k, w in ws.items()) / sum(ws.values())
    q1, med, q3 = np.percentile(col.values, [25, 50, 75])
    rho, ci = spear_ci([GDP[k] for k in ks], col.loc[ks])
    sub[nm] = dict(weights=ws, n=len(col), min=round(float(col.min()), 1), q1=round(float(q1), 1), median=round(float(med), 1), q3=round(float(q3), 1), max=round(float(col.max()), 1),
                   gdpN=len(ks), gdpRho=rho, gdpLo=ci[0], gdpHi=ci[1])
    ours["sub_" + nm] = col
_r = spearmanr(ours["sub_rights"].astype(float), ours["sub_delivery"].astype(float))[0]
sub["rightsVsDelivery"] = round(float(_r), 2)
print("subscores:", json.dumps(sub))
import datetime
import sys as _s; _s.path.insert(0, f"{ROOT}/scripts"); from datahash import data_sha256
json.dump(dict(computed=datetime.date.today().isoformat(), dataSha256=data_sha256(ROOT), ourCountries=len(ours), gdhmFullResponders=[k for k in full if k in ours.index], rows=OUT, income=inc, subscores=sub, eurostat=eurostat, m49Rows=len(m49), m49Exceptions=sorted(M49_META["exceptions"])),
          open(f"{ROOT}/analysis/external/external_corr.json", "w"), indent=1)
