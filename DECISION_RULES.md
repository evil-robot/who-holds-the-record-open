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
| `analysis/confidence/confidence.json` | `scripts/confidence.py --write` | `dataSha256` (and every label must match `out/facts.json`, rule 4) |
| `analysis/variance/variance.json` | `analysis/variance/variance.py` | `dataSha256` |
| `analysis/reliability/current_compare.json` | `analysis/reliability/current_compare.py` | `dataSha256` |

`scripts/paper_gen.js` computes the current hash and stops with `STALE: <file> ...` before writing anything if any output differs.

**Auxiliary inputs (2 Oct 2026, REVIEW2_methods M1).** A lookup table an analysis joins through is an input the data hash does not cover. `analysis/external/iso3_to_m49.json` (UN M49 codes, all 248 rows of the UNSD table, source and retrieval date in `iso3_to_m49.meta.json`) had been frozen at 65 rows when the index had 65 countries, so 133 countries fell out of the WHO Monitor rows without a message while the hash gate passed. Now `external_corr.py` and `paper_gen.js` both refuse to run unless the table holds every country in `data/` except its named exceptions (Taiwan and Kosovo, which have no M49 row and no WHO Monitor code) and its row count matches its meta. `paper_gen.js` also refuses if the set of URLs in `url_check.csv` differs from the set cited in `data/`, so a link check cannot be restamped onto changed links.

**Exception.** `analysis/stories_verify.json` (written by `scripts/verify_stories.py` on a networked run) rests on the accounts in `stories/`, not on `data/`, and records no data hash. `paper_gen.js` refuses it unless it covers exactly the live accounts, by id (REVIEW2_methods m4: the paper printed a run that covered 272 of 446).

**Exception.** `analysis/reliability/reliability.json` is a pre-registered study run once against the scores published on its run date. The paper reports it as such, and reports a separate comparison against current scores; it is not regenerated and not gated.

**Exception.** `analysis/reliability2/reliability2.json` (blind study 2, the 133 countries added after the first 65) is the same kind of pre-registered study, run once against the scores in `data/` on its run date. It records `dataSha256` (whole files, at draw and at analysis) and `scoresSha256` (scores alone) so a reader can see which data it ran on; it is not regenerated and not gated.

**Exception.** `analysis/crossborder/crossborder.json` and `analysis/crossborder/relocation_and_copy.json` (paper Section 10) rest on outside pages and record no data hash. `paper_gen.js` checks them instead: both must cover exactly the countries in `data/`, their counts must match their own `meta.counts`, and every country-file quote behind a copy right must still appear word for word in `data/`. Each check stops the run if it fails; each was shown to refuse with a planted error on 2 Oct 2026.

**Test.** `node scripts/test_paper_gen_gate.js`: a dry run must pass with fresh outputs, and must refuse when any one of the gated outputs is planted with a wrong or missing hash, when the M49 table is cut back to its old 65 rows, and when a confidence label is planted that the rule does not give. Kept as a standing regression.

**Order to regenerate everything** (`scripts/regen_all.sh`): `scripts/confidence.py --write` → `scripts/test_confidence.py` → `node build.js` → `analysis/url_check.py` → `analysis/url_recheck.py` → `analysis/sources.py` → `scripts/dti_evidence.py` → `analysis/external_corr.py` → `analysis/variance/variance.py` → `analysis/strain/build_strain.py` → `analysis/robustness/robustness.py` → `analysis/robustness/seed_sweep.py` → `node build.js` → `node scripts/paper_gen.js` → `paper/build.sh`.

## 2. No single leader: the lead group, never "first" or "best"

**Rule.** The site, the briefs, the press kit, the share cards, `llms.txt`, `llms-full.txt` and the paper never call one country first, best, the leader or rank 1. The countries whose 90% rank range under the calibrated error model in `analysis/robustness/robustness.py` includes rank 1 are the lead group, and they are always named together: "Denmark, Estonia, Finland, Hungary and Sweden lead; allowing for scoring error, any of them could rank first", or, for one of them, "one of the five countries that could rank first". The group is listed in alphabetical order, never ranked within itself: rank cells and brief tiles read "Lead" or "Lead group", never "1". Every other country is given with its rank and its noun ("tied for 55th of 198 countries and territories") and its likely range. The same holds at the bottom: no single "last" unless the data holds it. (JAS, 3 and 4 Oct 2026: before this the rule allowed a sole first at 95% of draws; no country comes near that, and the copy rule is now absolute. A data change that ever put one country first in 95% or more of draws would go to the authors, not change the wording by itself.)

**Check.** `build.js` reads `robustness.json` and computes the lead group (only when its data hash is current, rule 1); every surface takes the group from there. `test_copy_audit.js` (R1, and the rank-cell and tile check) and `test_copy_rules.js` (one country beside first, best, top, leads or highest) read every built page, `llms.txt` and the share cards, and each fails on a planted sole leader. `test_robustness.py` checks the rule's inputs.

**Seed sensitivity (2 Oct 2026 ruling).** The lead-group cut (first place inside the 90% rank range, which with the inverted-CDF 5th percentile means first in at least 5% of draws) is applied to the published run only: seed 20261002, 10,000 draws, which reproduces exactly. Sweden was first in 509 of 10,000 draws (5.09%); `seed_sweep.py` reruns the main model under 15 other seeds fixed before any result was seen, and the paper reports the spread (Section 4.2). The threshold is not moved and the group is not re-picked by seed. If a data change ever makes the published run put a country on the other side of the cut, the group changes with it.

## 3. Pages stay under Googlebot's 2 MB per-file limit; downloads are exempt

**Rule.** Every HTML page and every script a page loads stays under 1.9 MB uncompressed (Googlebot reads only the first 2 MB of a file). The open-data downloads under `/data/` (the full JSON is about 2.75 MB) are files a reader chooses to fetch, not pages: they are exempt, and they are not listed in the sitemap.

**Check.** `build.js` throws if the home HTML or any data script is over 1.9 MB; the sitemap writer lists pages only (home, press kit, briefs, traveller).

## 4. Confidence is computed, never typed

**Rule.** Every country's `confidence` label is set by `scripts/confidence.py` from the data, under the definition in RUBRIC.md (fixed 2 Oct 2026 before any label was recomputed): high = 7 or 8 categories cite a primary source and no category admits an unverified fact; low = 4 or more of the 8 categories are weak (no primary source, or an admission that a fact was not verified); medium = every other country.

**Why.** REVIEW2_methods M2 (2 Oct 2026): the paper printed a mechanical rule, but the labels were stored fields written by agents. 43 of the 70 "high" countries carried the exact wording the rule says caps a label at medium, no script set or checked the label, and no code held the "widened" wording set the paper described. The primary-source count had saturated (189 of 198 countries cite one in all 8 categories), so the printed low tier could not fire.

**Check.** `uv run --project ~/Projects/ds-lab python scripts/confidence.py --check` exits non-zero if any data/ label differs from the computed one. `scripts/confidence.py --write` sets the labels and writes `analysis/confidence/confidence.json` (per-country counts and label, with the data hash); `scripts/paper_gen.js` gates that file and refuses to run if any label in `out/facts.json` differs from it.

**Test.** `uv run --project ~/Projects/ds-lab python scripts/test_confidence.py` plants a "high" file whose text says "not verified" and a file with four weak categories, and requires `--check` to fail on each (and to pass on the real data).
