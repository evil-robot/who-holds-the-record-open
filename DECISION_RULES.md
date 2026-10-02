# Decision rules (house gate 16)

Rules the build and the paper must obey, each with the check that enforces it and the test that proves the check can fail.

## 1. No number from stale analysis (the hash gate)

**Rule.** A figure may not be spliced into the paper from an analysis output computed on different country data than the current `data/`.

**Why.** On 2 Oct 2026 the paper's Table 7 (outside-index correlations) was regenerated from an `external_corr.json` computed before the re-research of 43 countries; the caption said "computed on our current scores" and the conclusion had changed. House gate 3: a figure may not claim data it does not cover.

**Check.** `scripts/datahash.py` and `scripts/datahash.js` compute one SHA-256 over the country files in `data/` (sorted, file name then bytes; the same hash `robustness.py` has always recorded). Every output the paper reads records it:

| Output | Written by | Hash field |
|---|---|---|
| `out/facts.json` | `node build.js` | `dataSha256` |
| `analysis/url_check.csv` | `analysis/url_check.py`, `analysis/url_recheck.py` | `analysis/url_check.meta.json` |
| `analysis/source_classes.csv` | `analysis/sources.py` | `analysis/source_classes.meta.json` (read through the DTI grade) |
| `analysis/dti/dti_evidence.json` | `scripts/dti_evidence.py` | `meta.dataSha256` |
| `analysis/external/external_corr.json` | `analysis/external_corr.py` | `dataSha256` |
| `analysis/robustness/robustness.json` | `analysis/robustness/robustness.py` | `meta.data.dataSha256` |
| `analysis/robustness/seed_sweep.json` | `analysis/robustness/seed_sweep.py` | `meta.dataSha256` |
| `analysis/strain/strain.json` | `analysis/strain/build_strain.py` | `meta.dataSha256` |

`scripts/paper_gen.js` computes the current hash and stops with `STALE: <file> ...` before writing anything if any output differs.

**Exception.** `analysis/reliability/reliability.json` is a pre-registered study run once against the scores published on its run date. The paper reports it as such, and reports a separate comparison against current scores; it is not regenerated and not gated.

**Test.** `node scripts/test_paper_gen_gate.js`: a dry run must pass with fresh outputs, and must refuse when any one of six outputs is planted with a wrong or missing hash. Kept as a standing regression.

**Order to regenerate everything** (`scripts/regen_all.sh`): `node build.js` → `analysis/url_check.py` → `analysis/url_recheck.py` → `analysis/sources.py` → `scripts/dti_evidence.py` → `analysis/external_corr.py` → `analysis/strain/build_strain.py` → `analysis/robustness/robustness.py` → `analysis/robustness/seed_sweep.py` → `node build.js` → `node scripts/paper_gen.js` → `paper/build.sh`.

## 2. No sole first place unless the data holds it

**Rule.** The site, the briefs, the press kit, `llms.txt` and the paper may call a country first (or say it "leads") alone only if it is first in at least 95% of draws under the calibrated error model in `analysis/robustness/robustness.py`. Otherwise they name every country whose 90% rank range includes 1.

**Check.** `build.js` reads `robustness.json` and computes the lead group; `test_robustness.py` checks the rule's inputs.

**Seed sensitivity (2 Oct 2026 ruling).** The lead-group cut (first place inside the 90% rank range, which with the inverted-CDF 5th percentile means first in at least 5% of draws) is applied to the published run only: seed 20261002, 10,000 draws, which reproduces exactly. Sweden was first in 509 of 10,000 draws (5.09%); `seed_sweep.py` reruns the main model under 15 other seeds fixed before any result was seen, and the paper reports the spread (Section 4.2). The threshold is not moved and the group is not re-picked by seed. If a data change ever makes the published run put a country on the other side of the cut, the group changes with it.

## 3. Pages stay under Googlebot's 2 MB per-file limit; downloads are exempt

**Rule.** Every HTML page and every script a page loads stays under 1.9 MB uncompressed (Googlebot reads only the first 2 MB of a file). The open-data downloads under `/data/` (the full JSON is about 2.75 MB) are files a reader chooses to fetch, not pages: they are exempt, and they are not listed in the sitemap.

**Check.** `build.js` throws if the home HTML or any data script is over 1.9 MB; the sitemap writer lists pages only (home, press kit, briefs, traveller).
