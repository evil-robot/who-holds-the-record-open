"""Agreement statistics (pre-registered in PLAN.md). Pure functions plus self-tests on stamped synthetic inputs."""
import numpy as np
from scipy import stats
from sklearn.metrics import cohen_kappa_score

BANDS = [(0, 24), (25, 44), (45, 64), (65, 84), (85, 100)]

def band(x):
    for i, (lo, hi) in enumerate(BANDS):
        if lo <= x <= hi:
            return i
    raise ValueError(x)

def icc2_1(Y, alpha=0.05):
    """ICC(2,1), two-way random effects, absolute agreement, single rater (Shrout and Fleiss 1979; McGraw and Wong 1996
    F-based CI). Y is n subjects x k raters."""
    Y = np.asarray(Y, float)
    n, k = Y.shape
    gm = Y.mean()
    ssr = k * ((Y.mean(1) - gm) ** 2).sum()
    ssc = n * ((Y.mean(0) - gm) ** 2).sum()
    sst = ((Y - gm) ** 2).sum()
    sse = sst - ssr - ssc
    msr, msc, mse = ssr / (n - 1), ssc / (k - 1), sse / ((n - 1) * (k - 1))
    icc = (msr - mse) / (msr + (k - 1) * mse + k * (msc - mse) / n)
    a = k * icc / (n * (1 - icc))
    b = 1 + k * icc * (n - 1) / (n * (1 - icc))
    v = (a * msc + b * mse) ** 2 / ((a * msc) ** 2 / (k - 1) + (b * mse) ** 2 / ((n - 1) * (k - 1)))
    fl = stats.f.ppf(1 - alpha / 2, n - 1, v)
    fu = stats.f.ppf(1 - alpha / 2, v, n - 1)
    lo = n * (msr - fl * mse) / (fl * (k * msc + (k * n - k - n) * mse) + n * msr)
    hi = n * (fu * msr - mse) / (k * msc + (k * n - k - n) * mse + n * fu * msr)
    return float(icc), float(lo), float(hi)

def qwk(a, b):
    return float(cohen_kappa_score([band(x) for x in a], [band(x) for x in b], labels=list(range(5)), weights="quadratic"))

def bland_altman(rater, pub):
    d = np.asarray(rater, float) - np.asarray(pub, float)
    n = len(d); bias = d.mean(); sd = d.std(ddof=1)
    t = stats.t.ppf(0.975, n - 1)
    m = (np.asarray(rater, float) + np.asarray(pub, float)) / 2
    slope = stats.linregress(m, d)
    return {"bias": float(bias), "bias_ci": [float(bias - t * sd / np.sqrt(n)), float(bias + t * sd / np.sqrt(n))],
            "sd_diff": float(sd), "loa": [float(bias - 1.96 * sd), float(bias + 1.96 * sd)],
            "proportional_bias_slope": float(slope.slope), "proportional_bias_p": float(slope.pvalue)}

def describe(rater, pub, rng, B=4000):
    r = np.asarray(rater, float); p = np.asarray(pub, float)
    ad = np.abs(r - p); n = len(r)
    f = {"mad": lambda i: ad[i].mean(), "within5": lambda i: (ad[i] <= 5).mean(), "within10": lambda i: (ad[i] <= 10).mean(),
         "band_exact": lambda i: np.mean([band(a) == band(b) for a, b in zip(r[i], p[i])])}
    out = {"n": n}
    idx = rng.integers(0, n, (B, n))
    for k, fn in f.items():
        allv = fn(np.arange(n)); boot = np.array([fn(i) for i in idx])
        out[k] = float(allv); out[k + "_ci"] = [float(np.percentile(boot, 2.5)), float(np.percentile(boot, 97.5))]
    return out

def boot_ci(fn, r, p, rng, B=4000):
    r = np.asarray(r); p = np.asarray(p); n = len(r); vals = []
    for _ in range(B):
        i = rng.integers(0, n, n)
        try:
            v = fn(r[i], p[i])
            if np.isfinite(v): vals.append(v)
        except Exception:
            pass
    return [float(np.percentile(vals, 2.5)), float(np.percentile(vals, 97.5))]

if __name__ == "__main__":
    # Self-tests. SYNTHETIC inputs, used only to test the code, never reported as results.
    sf = [[9, 2, 5, 8], [6, 1, 3, 2], [8, 4, 6, 8], [7, 1, 2, 6], [10, 5, 6, 9], [6, 2, 4, 7]]  # Shrout and Fleiss 1979 Table 2
    icc, lo, hi = icc2_1(sf)
    print("Shrout-Fleiss ICC(2,1) published 0.29:", round(icc, 3), round(lo, 3), round(hi, 3))
    assert abs(icc - 0.29) < 0.005
    rng = np.random.default_rng(1)
    x = rng.integers(10, 95, 64)
    i1 = icc2_1(np.c_[x, x + 0.0001 * rng.standard_normal(64)])[0]; k1 = qwk(x, x)
    print("identical: ICC", round(i1, 4), "kappa", k1); assert i1 > 0.999 and k1 == 1.0
    y = rng.permutation(x)
    print("shuffled: ICC", round(icc2_1(np.c_[x, y])[0], 3), "kappa", round(qwk(x, y), 3))
    assert abs(icc2_1(np.c_[x, y])[0]) < 0.3
    z = x + 10
    print("constant +10: ICC", round(icc2_1(np.c_[x, z])[0], 3), "bias", bland_altman(z, x)["bias"])
    assert abs(bland_altman(z, x)["bias"] - 10) < 1e-9 and icc2_1(np.c_[x, z])[0] < 0.999
    print("band edges", [band(v) for v in (0, 24, 25, 44, 45, 64, 65, 84, 85, 100)])
    print("selftest ok")
