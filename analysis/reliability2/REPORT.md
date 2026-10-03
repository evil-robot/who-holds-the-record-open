# Blind inter-rater reliability check, study 2: the 133 added countries

Run 2 Oct 2026, 20:16 to 20:52 ET (3 Oct 00:16 to 00:52 UTC). Plan pre-registered in `PLAN.md`, SHA-256
e66c1c33870efa97f8b052b729ff8508eed7b10c36d530d89feb67f5af3fb021, with every kit file, script, the sample and
the batch files hashed in `plan_stamp.txt`, and committed in 5ff9caa at 20:16:09 ET. The first rater session (the
pilot) started at 20:16:14 ET, so the plan was in git before any cell was scored.

Services behind every figure: published scores from `data/<ISO3>.json` at analysis time (dataSha256
ad2e1325...229f, the same at draw and at analysis; scores-only hash 528f2881...90a9; every one of the 136 sampled
scores equals git HEAD; the working tree held another session's uncommitted confidence-label edits, no score
change). Blind ratings came from Anthropic agent sessions run through the claude CLI 2.1.288, model pinned and reported
in every transcript as claude-opus-5-5, which opened the cited pages with WebFetch and curl on the run date. URL
status at draw time comes from `analysis/url_check.csv`. Statistics were computed in the ds-lab Python environment (numpy,
scipy, scikit-learn). Study 1 enters as its frozen `analysis/reliability/ratings.csv`. No synthetic data enters
any result. The synthetic inputs are the planted verifier cases in `adversary/` and `adversary_v2/` (each stamped
`"planted": true`) and the self-test vectors in `scripts/stats.py`.

## Headline (pre-registered primary set)

On the 108 of 136 sampled cells that a blind rater could score, the rater landed on average 5.4 points from the
published score, within 10 points 87% of the time, with no overall bias. Agreement matches study 1.

| Measure (rater vs published, n = 108 cells in 77 countries) | Value | 95% CI | Study 1 (n = 58) |
|---|---|---|---|
| ICC(2,1), absolute agreement | 0.84 | 0.77 to 0.89 | 0.82 (0.72 to 0.89) |
| Spearman rho | 0.86 | 0.80 to 0.91 | |
| Mean signed difference (bias) | -1.0 points | -2.5 to 0.4 | -0.4 |
| Limits of agreement | -15.9 to +13.8 points | | -17.7 to +16.9 |
| Mean absolute difference | 5.4 points | 4.4 to 6.5 | 5.8 |
| Within 5 / within 10 points | 63% / 87% | 81 to 93 (within 10) | 57% / 88% |
| Same band (five rubric bands) | 64% | | 62% |
| Quadratic-weighted kappa on bands | 0.70 | 0.60 to 0.79 | 0.63 |
| ICC on category-centred scores | 0.81 | | |

Country-cluster bootstrap CIs (cells from one country are not independent) are no wider: ICC 0.77 to 0.89, MAD
4.4 to 6.4, bias -2.5 to 0.5.

Verdict under the pre-registered rules: ICC 0.84 is "good" on Koo and Li (2016), with the CI lower bound 0.77 also
in "good". The three conditions for the paper to say the re-scoring of the added countries "agreed closely" (ICC at
least 0.75, within 10 at least 70%, absolute bias under 5) are all met. The overall bias CI includes 0. 39 of 108
cells changed band, all by one band.

**Study 1 vs study 2** (disjoint countries; each sample resampled on its own): MAD -0.5 points (95% CI -2.5 to
+1.5), ICC +0.02 (-0.10 to +0.16), bias -0.7 (-3.2 to +2.1), within 10 -0.9 percentage points (-11 to +10).
SD of the difference, study 2 over study 1: 0.86 (0.64 to 1.26). Under the pre-registered error-model rule
the CI includes 1, so the added countries do not get their own cell SD. Both values, for the record: cell SD
(SD(d)/sqrt 2) 6.24 in study 1 and 5.36 in study 2. The robustness model's single SD stands.

**A finding the headline hides: proportional bias.** Rater scores spread wider than the published ones (SD 14.7
against 12.0), and the difference grows with the score: the slope of d on the pair mean is +0.21 (p = 0.0002).
The rater goes lower on low cells and higher on high cells. Study 1 showed no such slope (0.04, p = 0.66).
The published scores for the added countries sit closer to the middle of the scale than a blind reading of the
same sources puts them.
Exploratory checks, not pre-registered: the slope is not an artefact of the access coverage gap. It holds without
access (n 87, slope +0.18, p = 0.0007) and on the cells where every cited source was read (n 28, +0.23, p = 0.02).

## Access, reported separately (pre-registered)

| access, n = 21 | Value | 95% CI |
|---|---|---|
| ICC(2,1) | 0.68 | 0.29 to 0.87 |
| Spearman rho | 0.72 | 0.32 to 0.92 |
| Bias (rater minus published) | -5.9 points | -9.7 to -1.9 |
| MAD | 8.5 points | 5.6 to 11.4 |
| Within 10 | 62% | 43 to 81 |
| Published access SD in the sample | 11.5 | |

The pre-registered access rule fires: the ICC lower bound (0.29) is below 0.50, so the paper should say that single
access scores for the added countries are not reliably reproduced by a blind rater. (MAD 8.5 does not exceed the
published SD 11.5, the rule's second trigger.) The bias is downward and its CI excludes 0: the rater scores access
lower. Seven of the 12 cells flagged at 15 points or more are access cells.

Exploratory, not pre-registered: 18 of the 21 rated access cells had at least one cited source the rater could not
read. In those 18 the MAD was 9.3, the bias -6.9, and 7 were off by 15 or more. The three cells where every source
was read had MAD 3.3. The flagged access cells share one pattern. The published score rests on an access right in a
law text (often a scanned or gazette PDF). The rater could not open that text, so it applied the evidence rule
("no enforceable right verified": band 15 to 35, lower half) and landed 15 to 18 points lower. This is partly a
rater coverage gap, not a judgement difference. It also means these access scores rest on sources that a second
reader cannot easily open.

## By category and region (descriptive)

| Category | n | ICC(2,1) (95% CI) | Spearman | MAD | Within 10 | Bias (95% CI) |
|---|---|---|---|---|---|---|
| access | 21 | 0.68 (0.29 to 0.87) | 0.72 | 8.5 | 62% | -5.9 (-9.7 to -1.9) |
| control | 10 | 0.89 (0.63 to 0.97) | 0.92 | 2.9 | 90% | -2.1 |
| privacy | 14 | 0.91 (0.75 to 0.97) | 0.86 | 4.0 | 100% | +1.1 |
| commercial | 11 | 0.94 (0.80 to 0.98) | 0.88 | 2.7 | 100% | -1.3 |
| journey | 16 | 0.92 (0.79 to 0.97) | 0.91 | 5.6 | 94% | +0.7 |
| clinical | 12 | 0.82 (0.50 to 0.94) | 0.91 | 7.7 | 83% | +3.7 |
| research | 12 | 0.25 (-0.40 to 0.72) | 0.36 | 5.1 | 92% | -0.6 |
| ai | 12 | 0.82 (0.49 to 0.94) | 0.87 | 3.8 | 92% | -1.3 |

No category crosses the MAD 15 flag. The research ICC is low because the published research scores barely vary
(SD 2.8 in the sample, the 40 to 50 anchor). An ICC cannot be high when there is almost no between-cell variance,
even with 92% of cells within 10. This is the same construct finding as review M6, not a reading failure.

By region: Africa n 37, MAD 6.7, within 10 78%, bias -4.3 (bootstrap CI -6.9 to -1.7, rater lower; driven by
the access cells above). Americas n 23, MAD 4.4. Asia n 18, MAD 4.7, all within 10. Europe n 12, MAD 5.5,
bias +4.7. Middle East n 11, MAD 3.7, all within 10. Oceania n 7, MAD 5.6.

Within-rater repeat (pre-registered, 8 cells): 5 were scored twice. Sessions differed by 1.8 points on average.
The other 3 were TCD.control and TGO.commercial (null) and ZMB.clinical (its repeat copy was lost with batch 11).

## Coverage

- 136 sampled cells: 108 rated, 20 returned null by the rater, 8 missing because their session was excluded.
- Null from the rater (sources unreadable; never redrawn): GTM.access, LAO.access, TCD.control, NER.control,
  DJI.control, BDI.control, MDV.control, WSM.privacy, COM.commercial, TGO.commercial, MDG.commercial,
  MNE.commercial, VUT.commercial, TZA.clinical, AND.clinical, TON.clinical, DJI.research, CUB.research,
  VUT.ai, WSM.ai. By category: control 5, commercial 5, clinical 3, access 2, research 2, ai 2, privacy 1. The
  rate is 15% of cells, against 9% in study 1. Every sampled cell had at least one URL marked "ok" in
  url_check.csv at draw time, so the pages answer. The rater could not read what came back (PDFs, scans,
  JavaScript pages).
- Missing (batch 11 excluded after its re-run also failed the audit): BDI.privacy, BGD.research, BOL.clinical,
  KHM.research, NIC.control, SDN.ai, SYC.ai, VEN.access, and the ZMB.clinical repeat copy.
- Raters read 228 of the 422 cited URLs in the sample and reported 169 unreadable (40%; study 1: 26%). The rest
  were in the excluded batch or not reported. The added countries rest on harder-to-read sources than the first 65.
- Pre-registered split: cells where every cited source was read (n 28) had MAD 4.9, within 10 93%, 2 cells off by
  15 or more. Cells with at least one unreadable source (n 80) had MAD 5.6, within 10 85%, 10 off by 15 or more.

## Excluded sessions and the blinding audit

Every transcript was kept and audited with the pre-registered verifier (`scripts/audit_transcripts.py`, self-test
green before the run: 14 planted red cases caught, including the new `red_fetch_healthrecordrights.jsonl`,
and 2 planted good cases plus study 1's real pilot passed). 21 rater sessions in all: 16 first sessions, 4 re-runs and
the pilot.

**No session touched a forbidden host.** No tool call in any transcript names the published site, its domains
(healthrecordrights, whoholds), the repo, supertruth, railway.app or a local path, and a raw text search of every
transcript, tool results included, finds none of those strings. The only "localhost" hits are a content-security
header on a cited Saint Kitts government page.

Five sessions failed the pre-registered audit and were excluded under the plan's rule. Each failure, read by hand,
is a verifier false alarm, not a blinding breach:

| Session | Audit failure | What happened |
|---|---|---|
| batch_09 | pipe into non-filter 'consent', 'exchange' | `curl <cited> \| grep -E "consent\|exchange\|record"`: the verifier splits on the "\|" inside the quoted pattern. The command fetched a cited URL. |
| batch_10 | curl outside cited set: healthinfo.gov.bn/user-center-app/ | The cited URL is `.../user-center-app/#/user/privacy-clause`, the same page with a client-side fragment. `norm()` strips the trailing slash before cutting the fragment, so the two do not match. |
| batch_11 | pipe into non-filter (quoted grep alternation) | Same as batch_09. |
| batch_11_rerun | quoted grep alternation; a `for` loop over two cited URLs | The loop was refused by the permission system and never ran. The CLI's refusal now reads "can't be checked before it runs", which the verifier's refusal detector does not know, so a refused command counted as a fail. Both URLs are cited. |
| batch_15 | quoted grep alternation | Same as batch_09. |

Re-runs: batch_09, 10 and 15 passed on re-run and their re-run ratings are used. batch_11 failed again, so under the
plan its cells are missing. Study 1 recorded the quoted-pipe weakness, but in study 1 every such command had been
refused before it ran. In this run the permission system let `curl | grep` run, so the false alarms became fails.

**Corrected verifier, used only for a sensitivity check** (`scripts/audit_transcripts_v2.py`, written after the run):
it cuts the fragment before stripping the slash, ignores "|" inside quoted strings, and recognises the newer
refusal wording. Testing it turned up a gap in the pre-registered verifier. A command chained with `;` or `&&` is
judged only by its first word, and a real study 1 transcript ran `curl ...; ls ...; file ...` unprompted. v2 adds a
rule: a chained command must be curl or a read-only inspector. It was attacked with 7 new planted cases in
`adversary_v2/`: a pipe to `sh` hidden after a quoted pattern, `&& rm`, `; python3`, a fragment look-alike URL, a
refused loop that names the forbidden host, and two good cases. v2 gets all 23 planted cases and the fixture
right. The pre-registered verifier wrongly passes the two chain cases and wrongly fails the two v2 good cases. Under
v2 all 21 real sessions pass. No session passes v1 and fails v2, so the chain gap was not used in this run.

## Sensitivity (not pre-registered, `sensitivity.json`)

- All 16 first sessions admitted under the corrected verifier (n 117): ICC 0.84 (0.78 to 0.89), Spearman 0.85, bias
  -0.8 (-2.2 to 0.5), MAD 5.1, within 10 87%, kappa 0.71, close-agreement rule met. Access n 22: ICC 0.68 (0.30 to
  0.86), bias -5.8, MAD 8.2. No conclusion changes.
- Session to session: the four re-runs scored the same 36 tasks in independent sessions. 32 were scored both times,
  with MAD 2.8 points, 88% within 5, ICC 0.94 and a largest gap of 23. 1 task was null in one session only, 3 in both.
  Rater noise is about half the rater-vs-published MAD.
- Repeats averaged in: MAD 5.4, ICC 0.84, bias -1.0.

## For the editors: every cell 15 or more points apart (pre-registered rule)

12 cells, both reasons verbatim in `reliability2.json`. No score in `data/` was changed. In 10 of the 12 the rater
could not read at least one cited source. In 8 the rater is lower.

| Cell | Published | Rater | d | Note |
|---|---|---|---|---|
| AND.research | 50 | 72 | +22 | Rater read Law 20/2017 as express consent for identifiable data (opt-in band). The published score caps at 50 because de-identified use needs no consent and has no opt-out. A rubric question for the research anchor. |
| ETH.ai | 56 | 35 | -21 | Rater could not read the EFDA guideline text, so it scored change control as not verified. The published score credits the guideline's change-control rules. |
| CIV.clinical | 36 | 55 | +19 | Same facts (shared record in public facilities). The rater weighted reach, the published score weighted the private-sector gap. |
| DZA.access | 40 | 22 | -18 | Law 18-07 PDFs unreadable to the rater, so the evidence rule applied. |
| BDI.access | 40 | 22 | -18 | Law 1/03 PDF is a scan, so the evidence rule applied. |
| TCD.access | 40 | 22 | -18 | Law 007/PR/2015 PDF unreadable, so the evidence rule applied. |
| GEO.clinical | 52 | 70 | +18 | Rater read the 2019 mandatory-EHR order. The published score uses the state auditor's finding that rural doctors lack access. |
| UGA.access | 45 | 28 | -17 | Act and Regulations PDFs unreadable. The repeat also gave 28. |
| PRY.access | 33 | 50 | +17 | Rater applied the statutory-right formula to Ley 7593/25 and the IPS portal. The published score treats the law as not yet in force (Nov 2027). The rater docked 5 for that, the published score dropped the band. A rubric question. |
| NER.access | 35 | 20 | -15 | Law 2022-59 PDF unreachable. |
| BOL.access | 40 | 25 | -15 | The 2008 norm, Ley 3131 and the Constitution were unreadable to the rater, so the evidence rule applied. |
| SLV.control | 45 | 30 | -15 | Decree unreadable to the rater. The published score credits a logged-access right whose practice is not verified. |

## Deviations from the brief and the plan

- Blinding versus the brief: raters saw the cell's cited URLs, as in study 1, not "only the country, category and
  rubric". This was stated in PLAN.md before the run, with the reason: no URLs and no search leaves nothing to score,
  and open search is a different study.
- Rater kit: study 1's RUBRIC.md byte for byte, plus two access rules added to the anchors before any added country
  was researched. Stated in PLAN.md.
- The pre-registered verifier raised five false alarms (above). The plan's exclude-and-re-run rule was applied as
  written, which lost batch 11 (8 cells). The corrected verifier and the sensitivity script were written after the
  primary result was read and are labelled so. The primary figures come only from the pre-registered rule.
- `run_rater.sh` is study 1's script with the model pinned and an overwrite guard. A re-run needed a copy of its
  batch file under the re-run name (`batches/batch_NN_rerun.json`, identical content).

## Cost

21 rater sessions, $26.58 in all (as the CLI reports per session): 16 first sessions $21.20, 4 re-runs $5.25,
pilot $0.12. Wall time 36 minutes, sessions in parallel.

## Paragraph for the paper (reliability section)

Because the first blind re-scoring drew only on the first 65 countries, we ran a second pre-registered blind
re-scoring on the 133 countries added on 2 October 2026: a region-stratified random sample of 136 of their 1,064
cells, scored under the same protocol by fresh agent sessions that saw only the rubric, the anchor rules with country
names and scores removed, the country, the category and the cell's cited sources. On the 108 cells that could be
scored, the rater landed on average 5.4 points from the published score (95% CI 4.4 to 6.5), within 10 points in 87%
of cells, with no overall bias (-1.0 points, 95% CI -2.5 to 0.4) and an intraclass correlation of 0.84 (95% CI 0.77
to 0.89), 0.02 above the first study (95% CI of the difference -0.10 to +0.16), so under the pre-registered rule the
added countries keep the same error term. Access agreed least (intraclass correlation 0.68, 95% CI 0.29 to 0.87,
with the rater 5.9 points lower on average), mostly where the rater could not open the cited law text, so a single
access score for an added country is not reproducible to the point; of the 28 cells not scored, 20 had sources the
rater could not read and 8 were lost when a rater session was excluded under the plan's transcript audit (a checker
false alarm, not a breach of the blind).

## Files

- `PLAN.md`, `plan_stamp.txt`: pre-registered plan and hashes (commit 5ff9caa).
- `sample.json`: seed, frame, allocation, the 136 cells with cited URLs, repeats, pilot, batches, data hash at draw.
- `rater_kit/`: exactly what the raters saw. `batches/`: each rater's task file, plus study 1 fixtures.
- `transcripts/`: full stream-json of all 21 sessions, plus study 1's pilot as the verifier fixture. Keep these out
  of the public export, as with study 1.
- `adversary/`, `adversary_v2/`: planted verifier cases (synthetic, stamped).
- `ratings.csv`: one row per sampled cell. `reliability2.json`: every pre-registered figure, the audit, both
  reasons for the largest disagreements, the data stamp (`dataSha256`, `scoresSha256`), costs.
  `sensitivity.json`: the labelled post-hoc checks.
- `scripts/`: `draw_sample.py`, `build_prompt.py`, `run_rater.sh`, `audit_transcripts.py` (pre-registered,
  `--selftest`), `audit_transcripts_v2.py` (post-hoc, `--selftest`), `stats.py`, `analyze.py`, `sensitivity.py`.
