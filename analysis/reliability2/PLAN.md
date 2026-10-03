# Blind inter-rater reliability check, study 2 (the 133 added countries): pre-registered plan

Written 2 Oct 2026, before any cell in this study was scored. The SHA-256 of this file and of every kit file and
script is in `plan_stamp.txt`. Both are committed to git before the pilot or any batch runs, so the commit time is
the record. Study 1 (`analysis/reliability/`) drew only from the first 65 countries. This study answers review item
M4 (`analysis/review/REVIEW2_methods.md`): neither reliability study covers the 133 countries added on 2 Oct 2026
(1,064 of 1,584 cells).

## Question
Would an independent rater, given only the rubric, the anchors, the country, the category and the cell's cited
sources, give the same score as the published index, for the countries added after the first 65? This is the same
question as study 1, scoring reliability given the same evidence. It does not measure evidence-gathering reliability.

## Deviation from the brief, stated before the run
The brief says raters see "only the country name, the category and the rubric, never our score, our sources or our
site", and also says to use the same protocol and rater instructions as study 1 so the studies are comparable.
These conflict. Study 1 gives raters the cell's cited URLs (no titles, summaries, details, scores or confidence),
disables search, and its audit fails any fetch outside the cited set. A rater with no URLs and no search has nothing
to open, and the study 1 prompt forbids scoring from memory. A rater with web search would answer a different
question (would a rater who found its own evidence agree), and the result could not be set beside study 1. This study
therefore follows study 1: cited URLs only, no search. Raters never see our score, summary, detail, confidence,
site or any source title. An open-search study is a separate design and is not run here.

## Definitions
- Frame: the 133 countries in `data/` that are not in `analysis/waves.json` groups original (43), wave1 (21) or
  albania (1), that is waves wave2 (48), wave3 (81), observers (2) and greenland_kosovo (2). 133 x 8 = 1,064 cells.
- Cell: one country x one category, `categories.<key>.score` (integer 0 to 100).
- Published score: the value in `data/` when `scripts/analyze.py` runs. Its data hash (`scripts/datahash.py`) is
  recorded at draw time and at analysis time. At draw time the working tree holds another session's uncommitted
  confidence-label changes to 103 files, with no score change against HEAD; the analysis also records a hash of the
  scores alone, so a label-only change is distinguishable from a score change.
- Rater score: the integer 0 to 100 a blind rater returns, or null (unratable).
- d = rater minus published. Bands: the five RUBRIC.md anchor bands 0-24, 25-44, 45-64, 65-84, 85-100.

## Sample and its size
- 136 cells: access 24, each other category 16. Regions get cells in proportion to their country count by largest
  remainder (Africa 49, Americas 28, Asia 22, Europe 14, Oceania 12, Middle East 11 of 133 countries: 48, 27, 21,
  14, 12, 11), spread over categories in proportion to category size by seeded randomised rounding, then countries
  drawn at random without replacement within each category x region cell. A country can appear in several
  categories. Seed 20261003 (study 1 used 20261002). Script `scripts/draw_sample.py`; output `sample.json`.
- The draw reads iso3, name, region, category and cited URLs. It never reads a score, summary or detail.
- Size, justified by simulation with this study's own `icc2_1` (800 simulated samples of normal scores per point, median
  F-based 95% CI): at a true ICC of 0.80, 58 rated cells (study 1) give a CI about 0.19 wide; 122 give about 0.13
  (half-width 0.065); at a true ICC of 0.70, 122 give about 0.18. Allowing for study 1's 9% unratable rate, 136
  cells should yield about 124 rated. Access, the category the review found weakest (study 1 ICC 0.25 at n 8), gets
  24 cells so its own interval is stated rather than useless: at about 22 rated cells the CI is about 0.79 wide if the
  true value is 0.25, 0.67 if 0.5, 0.35 if 0.8. The other categories get 16 (about 14 rated: CI about 0.43 wide at
  0.8, 0.82 at 0.5). Per-category ICCs are therefore reported with their intervals and read as descriptive.
  Cost is small: study 1 cost about $1 per session of 10 tasks.
- Within-rater repeat: 8 seeded cells, one per category, rated a second time by a different session.
- Batches: 144 tasks in 16 batches of 9, shuffled, no country twice in a batch (study 1: 70 tasks, 7 batches of 10).
- Cells whose sources are dead or blocked stay in. The rater returns null; nulls are reported as coverage, never
  redrawn. At draw time 413 of 422 cited URLs were "ok" in `analysis/url_check.csv` (6 error, 3 blocked_unverified)
  and every sampled cell had at least one "ok" URL.
- Pilot: one out-of-sample cell from the frame (MDV.journey), run once to prove the harness after the commit; it is
  excluded from every analysis.

## Blinding (what the rater gets)
- `rater_kit/RUBRIC.md`: study 1's kit file, byte for byte (same hash). It differs from the current RUBRIC.md only in
  the confidence-label section, which plays no part in a cell score.
- `rater_kit/RUBRIC_V1_1_ANCHORS_REDACTED.md`: study 1's redacted anchors plus the two access rules added to
  `docs/RUBRIC_V1_1_ANCHORS.md` at 06:24 on 2 Oct 2026, worded without country names or paths: the one-region
  portal rule (a portal for one region lifts an access cell within 15 to 35, to 35 at most) and the EU/EEA free first
  copy rule. Every one of the 133 was researched after that commit (wave2 07:01, wave3 09:07, Greenland and Kosovo
  14:49 on 2 Oct), so its published score was set under these rules; giving raters study 1's kit would measure a
  rubric-version gap, not rater agreement. This is the one intentional difference in what raters see. The
  controlModel section is left out (no cell is scored on it). Checked: neither kit file names any of the 133 countries
  (the only token hit is the word "AND", which matches Andorra's ISO3 code but is not used as a country name).
- The prompt is study 1's `build_prompt.py`, unchanged: country name, category key, the cell's cited URLs.
- Raters are fresh headless agent sessions (`claude -p`), one per batch, run from an empty scratch directory outside
  the repo, with the model pinned (`--model claude-opus-5-5`, the model study 1's transcripts report), only WebFetch
  and Bash (curl only by permission rule), no MCP servers, no web search, user settings and hooks not loaded.
  `run_rater.sh` is study 1's script with the folder changed, the model pinned, and a guard that refuses to overwrite
  an existing transcript.
- Blinding is verified, not assumed: `scripts/audit_transcripts.py` is the current study 1 verifier (with
  `healthrecordrights` in FORBIDDEN_HOSTS, commit d0668c8), copied unchanged except for the self-test fixture paths.
  It checks every transcript: tools present, every fetched or curled URL within the batch's cited set or its recorded
  redirects, no local paths, no forbidden host (the published site, its domains, the repo name, localhost) in any
  tool call, no score without an opened source, the task set complete. `--selftest` must pass before the run: study
  1's 13 planted red cases plus one new one (`red_fetch_healthrecordrights.jsonl`, a fetch of healthrecordrights.com),
  all stamped `"planted": true`, must fail, and the two planted good cases and study 1's real pilot transcript (kept
  as a fixture) must pass. It was green when this plan was written.
- Exclusion rule: a session that fails the audit is excluded whole. Its transcript is kept and reported, and the batch
  is re-run once in a fresh session (`batch_NN_rerun`); the re-run is audited the same way and counted in the cost.
  If the re-run also fails, that batch's cells are missing and reported as such. Every transcript is kept and audited.

## Analysis (scripts/analyze.py and scripts/stats.py, both hashed below)
Primary set: the first rating of each of the 136 cells, excluding nulls. All figures are rater vs published.
1. Agreement: ICC(2,1), two-way random effects, absolute agreement, single rater (Shrout and Fleiss), F-based 95% CI
   (McGraw and Wong 1996); `stats.py` self-tests against Shrout and Fleiss 1979 Table 2.
2. Order: Spearman's rho, percentile bootstrap 95% CI (4,000 resamples of cells, seed 20261003).
3. Level: mean signed difference (Bland-Altman bias, rater minus published) with t-based 95% CI; limits of agreement
   bias +/- 1.96 SD; proportional bias by regressing d on the pair mean (secondary).
4. For comparability with study 1: MAD, share within 5 and within 10, exact band agreement (bootstrap CIs),
   quadratic-weighted kappa on bands, count of band changes.
5. By category (all eight, access reported in its own section as well): n, ICC(2,1) with CI, Spearman with CI, bias
   with bootstrap CI, MAD, within 10, the published SD in the sample. Descriptive: no per-category hypothesis test.
6. Secondary: ICC on category-centred scores (removes between-category level differences, which the review showed
   inflate the pooled ICC); country-cluster bootstrap CIs for MAD, bias, within 10, ICC and Spearman (cells from one
   country are not independent); by region (descriptive); within-rater repeat MAD; the headline with repeats averaged
   in; agreement split by whether the rater read every cited source (exploratory in study 1, pre-registered here).
7. Study 1 vs study 2 (disjoint countries, so independent samples): differences in MAD, ICC, bias and within 10, and
   the ratio of the SD of d, each with a bootstrap 95% CI resampling each study on its own. Study 1 enters as its
   frozen `ratings.csv` (scores as published at its run). The cell SD for the robustness Monte Carlo is SD(d)/sqrt 2.
No other tests. No multiple-comparison correction, because no per-category hypothesis is tested.

## Decision rules (fixed now)
- ICC on Koo and Li (2016): below 0.50 poor, 0.50 to 0.75 moderate, 0.75 to 0.90 good, above 0.90 excellent; the
  verdict uses the point estimate and states the CI lower bound beside it.
- The paper may say the blind re-scoring of the added countries "agreed closely" only if all hold: ICC(2,1) >= 0.75,
  within 10 >= 70%, |bias| < 5 points (study 1's rule). Otherwise it reports the measured figures and the limits of
  agreement as the judgement uncertainty of a single cell.
- A bias whose 95% CI excludes 0 is reported with its direction.
- Error model: if the bootstrap 95% CI of SD(d) study 2 / SD(d) study 1 lies wholly above 1, the added countries get
  their own cell SD (study 2 SD(d)/sqrt 2) in the robustness Monte Carlo, and the paper says so. Otherwise one cell SD
  stays, and both values are reported.
- Access: its ICC, CI, MAD and the published SD in the sample are reported whatever they are. If the access CI lower
  bound is below 0.50, or its MAD exceeds the published access SD in the sample, the paper says the access category's
  single-cell scores are not reliably reproduced for the added countries.
- A category with MAD above 15 is flagged for anchor tightening.
- Every cell with |d| >= 15 goes to the editors with both reasons, whatever the headline. No score in `data/` is
  changed by this study; the editors decide.
- Results are reported whatever they are. Nothing in this plan changes after the commit; any deviation is listed in
  REPORT.md under "Deviations".

## Known limits, stated in advance
- Rater and original researchers are the same model family; shared priors can inflate agreement. Not a human study.
- Raters see only the sources the original researchers chose, which supported the published score.
- WebFetch returns a model-condensed reading of a page, not the raw page.
- The "key fact" evidence rule refers to the published summary and detail text, which raters do not see or write.
- Pages may have changed since the original research (1 to 2 Oct 2026).
- Many added countries rest on one to four sources (43 of 1,064 frame cells cite one); a rater reading few pages
  can agree for the wrong reason or fail to score.
