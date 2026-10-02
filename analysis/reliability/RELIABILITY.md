# Blind inter-rater reliability check

Run 2 Oct 2026, 10:02 to 10:10 UTC. Plan pre-registered in `PLAN.md` (written 10:02:47 UTC, before any in-sample
cell was scored; SHA-256 b2e68d07...15e2, also in `plan_stamp.txt` and `reliability.json`).

Services behind every figure: published scores from `data/<ISO3>.json` (`asOf` 2026-10-01, read only); blind
ratings from Anthropic agent sessions run through the claude CLI (model reported in every transcript:
claude-opus-5-5), which opened the cited pages with the built-in WebFetch tool and curl on the run date; URL status
at draw time from `analysis/url_check.csv` (1 Oct 2026); statistics in the ds-lab Python environment (numpy,
scipy, scikit-learn). No synthetic data enters any result. The only synthetic inputs are the planted verifier
cases in `adversary/` (each stamped `"planted": true`) and the self-test vectors in `scripts/stats.py`.

## Headline

On the 58 of 64 sampled cells a blind rater could score, the rater landed on average 5.8 points from the
published score, within 10 points 88% of the time, with no overall bias.

| Measure (rater vs published, n = 58) | Value | 95% CI |
|---|---|---|
| Mean absolute difference | 5.8 points | 4.3 to 7.6 |
| Within 5 points | 57% | 45 to 69 |
| Within 10 points | 88% | 79 to 95 |
| Same band (five rubric bands) | 62% | 50 to 74 |
| Weighted kappa on bands (quadratic) | 0.63 | 0.42 to 0.78 |
| ICC(2,1), absolute agreement | 0.82 | 0.72 to 0.89 |
| Bland-Altman bias (rater minus published) | -0.4 points | -2.7 to 2.0 |
| Limits of agreement | -17.7 to +16.9 points | |

Verdict under the pre-registered rules: ICC 0.82 is "good" on Koo and Li (2016), with the CI lower bound (0.72) in
"moderate". Kappa 0.63 is "substantial" on Landis and Koch. The three conditions for the paper to say the
re-scoring "agreed closely" (ICC at least 0.75, within-10 at least 70%, absolute bias under 5) are all met. No
proportional bias (slope of difference on mean 0.04, p = 0.66). Spread is the same for both (SD 14.4 published,
14.9 rater), so the rater is not compressing scores toward the middle.

How to read it: the index's ordering and its overall level replicate. A single category score does not replicate
to the point: about 4 cells in 10 move more than 5 points, 22 of 58 change band (20 by one band, 2 by two;
5 of the 22 are within 5 points of the published score), and the limits of agreement say a second rater could put any one cell about 17 points either way.
Kappa is lower than ICC because bands discard the size of a move: a small move across an edge counts as a
full band change.

## By category and region (descriptive, n of 2 to 34 per group)

| Category | n | MAD | Within 10 | Bias |
|---|---|---|---|---|
| access | 8 | 9.4 (3.0 to 16.8) | 75% | -3.9 |
| control | 8 | 4.5 (2.6 to 7.1) | 88% | 0.0 |
| privacy | 8 | 4.6 (2.0 to 7.2) | 100% | +3.9 (0.6 to 7.2) |
| commercial | 5 | 2.8 (0.2 to 5.8) | 100% | -2.4 |
| journey | 7 | 5.6 (1.3 to 12.7) | 86% | -4.4 |
| clinical | 7 | 7.1 (4.0 to 10.9) | 86% | +1.7 |
| research | 7 | 4.1 (2.1 to 6.0) | 100% | +0.7 |
| ai | 8 | 7.4 (2.8 to 12.6) | 75% | +0.6 |

No category crosses the pre-registered MAD 15 flag. Access is the loosest (its two largest misses are both
Portugal). Privacy shows a small upward rater bias whose bootstrap CI just excludes 0; at n = 8 this is a hint,
not a finding. By region, Europe (n = 34) MAD 4.9 and 94% within 10; Middle East (n = 4, all four drawn cells are UAE:
access, control, journey, ai) MAD 12.2 with the rater 12 points lower on average, so this is one country, not a region; the other regions have 2 to 7 cells each and say little.

Within-rater repeat: 5 cells rated twice by separate sessions differed by 1.2 points on average (the sixth repeat,
CRI.commercial, was unratable both times). Rater noise is small next to rater-vs-published differences.

Sensitivity: averaging in the repeat ratings, or dropping ISL.ai (the one sampled cell whose score the unredacted
anchors file would have revealed), moves no headline figure by more than 0.1 point or 0.01 in ICC or kappa.

## Coverage (the finding that most limits the result)

- 6 of 64 cells (9%) were unratable and are excluded, never redrawn: CRI.commercial, JPN.commercial,
  ITA.commercial, TWN.journey, TWN.clinical, NGA.research. Every one failed on the rater's side: PDFs that came
  back as compressed binary (CRI, JPN, ITA), a PDF over the fetch size limit (NGA), and Springer chapters behind a
  login challenge (TWN). Every cited URL of these six cells was "ok" in `analysis/url_check.csv` on 1 Oct, so the pages answer; the
rater could not read what came back. Commercial lost 3 of its 8 cells.
- Across all 64 cells the raters read 125 of the 168 cited URLs and could not read 43 (26%), mostly PDFs.
- Exploratory, not pre-registered: cells where the rater read every cited source agree more closely (n = 30,
  MAD 4.4, 93% within 10, 1 cell off by 15 or more) than cells where at least one source was unreadable (n = 28,
  MAD 7.4, 82% within 10, 4 cells off by 15 or more). So part of the measured disagreement is the rater missing
  evidence, not the rater judging differently; the headline is, if anything, a conservative reading.

## For the editors: every cell 15 or more points apart (pre-registered rule)

Both reasons are given verbatim. The rater's reason is its one line; the published reason is the cell summary.
No score in `data/` was changed.

1. **PRT.access, published 70, rater 40 (-30).** Rater: "Lei 12/2005 grants access to the whole clinical record and
   ERS says consultation is free, but no fixed deadline (-5) and copies may cost money; national portal not verified
   (PDFs unreadable), so no-portal formula: base 45 minus 5." Published: "Portugal scored 88.1 on the EU 2025
   record-access indicator against an EU average of 82.7, and SNS 24 shows prescriptions, lab results, vaccines and
   five years of care history. Lei 12/2005 gives a right to the whole record, but the portal is not the full chart."
   Note: the rater could not open the Council and OECD PDFs that carry the portal evidence. Likely a rater coverage
   miss; editors should confirm the 88.1 figure and the SNS 24 contents are on the cited pages.
2. **PRT.journey, published 68, rater 42 (-26).** Rater: "Only Law 95/2019 was readable: Base 15 requires SNS system
   interoperability, but no infrastructure, coverage or usage evidence was verified, so it stays below the mixed
   band." Published: "A central agency, SPMS, gives every public provider and most private ones a common data
   centre, network and software, and the RSE timeline lists episodes from all SNS institutions. Private providers
   have no legal duty to share records." Note: same cause, 2 of 3 PDFs unreadable (OECD profile, RSE manual).
3. **ARE.access, published 54, rater 32 (-22).** Rater: "PDPL Art. 2 excludes health data and no health-sector
   access right could be verified, so band 15-35; upper end because Abu Dhabi's Sahatna app shows Malaffi records,
   screenings and vaccines (60% of Abu Dhabi facilities connected), but it covers one emirate and part of the
   record." Published: "Abu Dhabi residents can see visits, diagnoses, lab results, prescriptions and vaccinations
   from Malaffi in the free Sahatna app. No verified legal right to a full chart copy, and the general privacy law
   excludes health data." Note: a rubric question, not a reading gap. Both agree there is no verified legal right;
   the v1.1 access anchor puts "no enforceable right" at 15 to 35, and 54 sits above it. Editors should decide
   whether a one-emirate portal lifts a cell out of that band, and write the answer into the anchors.
4. **IND.clinical, published 35, rater 52 (+17).** Rater: "Mixed band: PIB (22 May 2026) reports over 100 crore
   records linked to ABHA and 450+ integrated solutions, with consent-based HIE-CM sharing to providers. Clinician
   access depends on patient-initiated linking and sharing, and emergency rules and real clinician use were not
   verified." Published: "A treating doctor can pull ABHA-linked records only when the patient consents through the
   exchange. With records scattered across providers, most clinicians still work from what the patient brings."
   Note: same facts, different weight on scale (linked records) against practice (what clinicians actually see).
   The rater could not open the PIB PDF.
5. **MEX.ai, published 20, rater 42 (+22).** Rater: "COFEPRIS 2025 guidelines for AI in imaging and decision support
   plus one authorised software product, but the Health Law has no AI definitions and the Jan 2026 reform left AI
   out; change control not verified, so lower half of the guidance band 35-50." Published: "The General Health Law
   does not define AI or clinical decision algorithms, and the January 2026 digital health reform did not create
   an AI category. Yet the 2027 health service plans to add AI tools." Note: the rater read both cited sources. After scoring I opened the
   cited recmedia.mx article (2 Oct 2026, curl): it says COFEPRIS issued 2025 guidelines for AI in diagnostic imaging
   and clinical decision support and in May 2025 authorised a first high-technology software product. The published
   summary does not mention this. The source is a news report, not the COFEPRIS text. Editors decide whether that
   counts as verified guidance; if it does, the non-EU anchor "guidance only: 35 to 50" applies to this cell.

Next largest, under the flag (published, then rater): ARE.control published 55, rater 42; AUS.ai published 55,
rater 44; NOR.privacy published 64, rater 74 (repeat 72); USA.clinical published 55, rater 65; VNM.ai published 50,
rater 60; ARE.ai published 68, rater 58. Full list with both reasons in `reliability.json`.

## How the blind was kept and checked

- Raters got RUBRIC.md, a redacted copy of the v1.1 anchors (the original names published scores for about 15
  cells, including ISL.ai in this sample; country names and scores removed, every general rule kept), the country
  name, the category and the cited URLs. No titles, summaries, details, scores or confidence.
- Seven fresh agent sessions, one per batch of 10, from empty scratch directories outside the repo; tools limited
  to WebFetch and curl, no web search, no MCP servers, user settings and hooks not loaded.
- `scripts/audit_transcripts.py` checks every transcript. Before use it was attacked with 13 planted red cases
  (fetching the live index site, curling its digest, `file://` and `cat` of `data/`, an uncited URL, a pipe to a
  shell, a loop over an uncited URL, an extra tool, an MCP server, a score with no source opened, an opened URL not
  cited, a missing result block, an out-of-range score); all are caught. On the real run it raised one false alarm
  (batch 5: a cited URL whose path ends in "data/" tripped the local-path rule). The rule was changed to ignore text
  inside URLs, the false alarm and a matching red case (a real `data/` path beside a cited URL) were added as
  standing regression files, and all 7 batches then passed. Known weakness, safe direction: the pipe check splits
  on "|" even inside a quoted grep pattern, so it can fail a harmless command; every such command in this run had
  already been refused by the permission system and was not executed (32 refused attempts, logged as warnings).

## Deviations from the brief and the plan

- The brief asked for Agent tool subagents. That tool was not available to this seat; raters were separate
  headless agent sessions (`claude -p`) with a restricted tool list, which also gave an auditable transcript.
- The blinding verifier's local-path rule was corrected after the run, as described above. No statistic changed.
- The source-access split is exploratory and labelled so.
- `scripts/analyze.py` is not in `plan_stamp.txt`: it was written while the raters ran, before any transcript was
  read, and implements the plan's analysis section; the exploratory block was added after the results were seen.
- An EU or EEA ai cell with no national additions can be scored 50 from the redacted rule alone, without the sources.
  Four of the eight ai cells are European, so ai agreement is partly rule-driven (ISL.ai: 50, 50 and 50).
- The pilot (UKR.journey, out of sample, rater 72 vs published 62) ran with user hooks loaded; the 7 scored batches
  did not. The pilot is excluded from every figure.

## Paragraph for the paper (methods and limitations)

To test whether the scores depend on who does the scoring, we drew a stratified random sample of 64 of the 520
country-category cells (8 per category, regions in proportion to country count, fixed seed) and had each re-scored
blind by a fresh agent session that saw only the rubric, the anchor rules with every country-specific score
removed, the country, the category and the cell's cited sources. The analysis plan was fixed before scoring. On the
58 cells the rater could score, it landed on average 5.8 points from the published score (95% CI 4.3 to 7.6), within
10 points in 88% of cells, with no overall bias (-0.4 points); intraclass correlation was 0.82 (95% CI 0.72 to 0.89)
and weighted kappa on the five bands 0.63. The ranking and level of the index replicate; a single category score
carries roughly plus or minus 17 points of judgement uncertainty (Bland-Altman limits of agreement), and 38% of cells
changed band. Six cells could not be scored because the rater could not read their sources, and a quarter of all
cited URLs were unreadable to it, mostly PDFs; agreement was closer where every source was read. The rater shares a
model family with the original research agents, so this is agreement between independent agent readings of the same
evidence under the same rubric, not a human inter-rater study, and it does not test whether a rater who gathered
its own evidence would agree. Five cells differed by 15 points or more and were returned to the editors.

## Files

- `PLAN.md`, `plan_stamp.txt`: pre-registered plan and hashes.
- `sample.json`: seed, allocation, the 64 cells with cited URLs, repeat cells, pilot, batch assignment.
- `rater_kit/`: exactly what the raters were given (RUBRIC.md and the redacted anchors).
- `batches/`: the task file each rater saw. `transcripts/`: full stream-json of every rater session.
- `adversary/`: planted verifier cases (synthetic, stamped). `ratings.csv`: one row per cell.
- `reliability.json`: every figure above plus audit results and both reasons for the 10 largest disagreements.
- `scripts/draw_sample.py`, `build_prompt.py`, `run_rater.sh`, `audit_transcripts.py` (`--selftest`),
  `stats.py` (self-tests against Shrout and Fleiss 1979), `analyze.py`.
