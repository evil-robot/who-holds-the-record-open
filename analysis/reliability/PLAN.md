# Blind inter-rater reliability check: pre-registered plan

Written 2 Oct 2026, before any in-sample cell was scored. Stamp and SHA-256 of this file are recorded in
`plan_stamp.txt` and copied into `reliability.json`. The repo is not under git, so the hash is the record.
A pilot on one out-of-sample cell (UKR.journey) was run before this file was written, only to test the harness;
it is excluded from every analysis.

## Question
Would an independent rater, given only the rubric, the anchors, the country, the category and the cell's cited
sources, give the same score as the published index? This measures scoring reliability given the same evidence.
It does not measure whether a rater who searched for its own evidence would agree (evidence-gathering reliability).

## Definitions
- Cell: one country x one category in `data/<ISO3>.json`, `categories.<key>.score` (integer 0 to 100).
- Published score: the value in `data/` when the analysis script runs (data `asOf` 2026-10-01; files not edited).
- Rater score: the integer 0 to 100 returned by a blind rater for that cell, or null (unratable).
- Difference d = rater minus published.
- Band: the five RUBRIC.md anchor bands, 0-24, 25-44, 45-64, 65-84, 85-100.

## Frame and sample
- Frame: 65 countries x 8 categories = 520 cells.
- Sample: 64 cells, 8 per category (stratum 1). Within the whole sample, regions get cells in proportion to their
  country count by largest remainder (Europe 35, Asia 10, Americas 8, Africa 5, Middle East 4, Oceania 2), spread
  over categories as evenly as possible (stratum 2), then countries drawn at random without replacement within each
  category x region cell. Seed 20261002. Script `scripts/draw_sample.py`; output `sample.json`.
- The draw reads only iso3, name, region and category. It never reads a score.
- Cells whose sources are dead or blocked stay in the sample. The rater returns null; nulls are reported as a
  coverage finding, never redrawn. At draw time 163 of 168 cited URLs were "ok" in `analysis/url_check.csv`
  (3 error, 2 blocked_unverified), and every sampled cell had at least one "ok" URL.
- Within-rater repeat: 6 seeded cells are rated a second time in a different batch by a different rater session.
- Batches: 70 tasks in 7 batches of 10, shuffled, no country twice in one batch.

## Blinding (what the rater gets)
- RUBRIC.md verbatim, and a redacted copy of docs/RUBRIC_V1_1_ANCHORS.md
  (`rater_kit/RUBRIC_V1_1_ANCHORS_REDACTED.md`). The original anchors file names published scores for about 15
  cells (for example ISL ai 50, RUS control 30, KOR privacy 66), which would break the blind; ISL.ai is in this sample.
  The redaction removes file paths and every country name and score, and keeps every general rule.
  SHA-256 of both kit files is in `plan_stamp.txt`.
- Country name, category key, and the cell's cited URLs only (no titles, summary, detail, score or confidence).
- Raters are fresh headless agent sessions (`claude -p`, one per batch) run from an empty scratch directory outside
  the repo, with only WebFetch and Bash (curl only by permission rule), no MCP servers, no web search, user
  settings and hooks not loaded. Deviation from the brief: the Agent tool was not available to this seat, and a
  separate process with a restricted tool list and a full transcript is the stronger blind.
- Blinding is verified, not assumed: `scripts/audit_transcripts.py` checks every transcript (tools present, every
  fetched or curled URL within the batch's cited set or its recorded redirects, no local paths, no published-site
  host, no score without an opened source). It was attacked before use with 13 planted red transcripts and one
  planted green case in `adversary/` (all stamped `"planted": true`); `--selftest` must pass.
  A batch that fails the audit is excluded and re-run in a fresh session; the failure is reported.

## Analysis (scripts/analyze.py, scripts/stats.py)
Primary set: the first rating of each of the 64 cells, excluding nulls. All figures are rater vs published.
1. Mean absolute difference (MAD), share with |d| <= 5, share with |d| <= 10, exact band agreement; percentile
   bootstrap 95% CIs (4000 resamples of cells, seed 20261002).
2. Band agreement: Cohen's kappa with quadratic weights on the five bands (sklearn), bootstrap 95% CI.
3. ICC(2,1): two-way random effects, absolute agreement, single rater (Shrout and Fleiss), F-based 95% CI
   (McGraw and Wong 1996). Code checked against Shrout and Fleiss 1979 Table 2 (0.29; CI 0.02 to 0.76).
4. Bland-Altman: bias (mean d) with t-based 95% CI, limits of agreement bias +/- 1.96 SD; proportional bias
   checked by regressing d on the pair mean (secondary).
5. By category (n = 8 each) and by region: MAD, within-10 and bias with bootstrap CIs. Descriptive only;
   kappa and ICC are not reported per category at n = 8.
6. Within-rater repeat (6 cells): MAD between the two rater sessions, as a floor on rater noise. Descriptive.
7. Sensitivity: the same headline figures with the repeat ratings averaged in, and with the ISL.ai leak-risk cell removed.
No other tests. No multiple-comparison correction is applied because no per-category hypothesis is tested.

## Decision rules (fixed now)
- ICC is read on Koo and Li (2016): below 0.50 poor, 0.50 to 0.75 moderate, 0.75 to 0.90 good, above 0.90
  excellent. The verdict uses the point estimate and states the CI lower bound beside it.
- Kappa is read on Landis and Koch (1977) labels, descriptive only.
- The paper may say "an independent blind re-scoring agreed closely with the published scores" only if all hold:
  ICC(2,1) >= 0.75, within-10 >= 70%, and |bias| < 5 points. Otherwise the paper reports the measured figures and
  states that a single category score carries judgement uncertainty of about the limits of agreement.
- A bias whose 95% CI excludes 0 is reported with its direction.
- Every cell with |d| >= 15 goes to the editors with both reasons, whatever the headline. No score in `data/` is
  changed by this check; the editors decide.
- A category with MAD above 15 is flagged for anchor tightening.
- Results are reported whatever they are. Nothing in this plan is changed after scoring starts; any deviation is
  listed in RELIABILITY.md under "Deviations".

## Known limits, stated in advance
- Rater and original researchers are the same model family; agreement can be inflated by shared priors. This is
  not a human inter-rater study.
- Raters see only the sources the original researchers chose, which supported the published score.
- WebFetch returns a model-condensed reading of a page, not the raw page.
- The "key fact" evidence rule refers to the published summary and detail text, which raters do not see or write.
- Pages may have changed since the original research (1 Oct 2026).
