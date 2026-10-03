"""Variance structure of the eight category scores across all countries (REVIEW2_methods M6).
- PC1 share: first eigenvalue of the 8 x 8 correlation matrix over the sum of eigenvalues (8).
- Effective weight of category k: w_k * cov(x_k, overall) / var(overall), with overall = sum_k w_k x_k / 100 on the published
  weights (unrounded). The eight effective weights sum to 100%: each is the category's share of the variance of the overall score.
- Spread of each category: SD (ddof 1) and interquartile range (linear interpolation).
Records the data hash (DECISION_RULES.md rule 1). Run: uv run --project ~/Projects/ds-lab python analysis/variance/variance.py"""
import glob, json, os, sys, numpy as np
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.join(ROOT, "scripts")); from datahash import data_sha256
W = dict(access=20, control=20, privacy=15, journey=15, commercial=10, clinical=10, research=5, ai=5)
K = list(W); w = np.array([W[k] for k in K], float)
D = [json.load(open(f)) for f in sorted(glob.glob(os.path.join(ROOT, "data", "[A-Z][A-Z][A-Z].json")))]
X = np.array([[d["categories"][k]["score"] for k in K] for d in D], float)
ov = X @ w / 100
cov = np.array([np.cov(X[:, j], ov)[0, 1] for j in range(len(K))])
eff = w / 100 * cov / ov.var(ddof=1)
ev = np.sort(np.linalg.eigvalsh(np.corrcoef(X.T)))[::-1]
q1, q3 = np.percentile(X, [25, 75], axis=0)
out = dict(dataSha256=data_sha256(ROOT), n=len(D), pc1Share=round(float(ev[0] / ev.sum()), 4), eigenvalues=[round(float(v), 2) for v in ev],
           effectiveWeight={k: round(float(eff[j]), 4) for j, k in enumerate(K)}, nominalWeight=W,
           sd={k: round(float(X[:, j].std(ddof=1)), 1) for j, k in enumerate(K)}, iqr={k: round(float(q3[j] - q1[j]), 1) for j, k in enumerate(K)},
           check=round(float(eff.sum()), 6))
if abs(out["check"] - 1) > 1e-9: raise SystemExit("effective weights do not sum to 1")
os.makedirs(os.path.join(ROOT, "analysis", "variance"), exist_ok=True)
json.dump(out, open(os.path.join(ROOT, "analysis", "variance", "variance.json"), "w"), indent=1)
print(json.dumps({k: v for k, v in out.items() if k != "dataSha256"}))
