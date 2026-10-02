# DTI evidence grade: definitions, limits and decision rules

Script: `scripts/dti_evidence.py`. Output: `analysis/dti/dti_evidence.json`. Tests: `scripts/test_dti_evidence.py`.
Run both with `/usr/bin/python3`. Method source: SuperTruth's Data Trust Index paper (doi 10.5281/zenodo.19601616), sections 3 and 4.

## What this is

The Data Trust Index (DTI) was built to grade health data records before an AI system uses them. Here we apply its eight published dimensions and weights to a different object: the **evidence** behind each score in the Health Data Rights Index. One cell is one country and one category (its summary, its detail paragraphs and its 1 to 4 cited sources). Each cell gets a 0 to 100 grade. A country's grade is its cells weighted by the index's category weights (access 20, control 20, privacy 15, journey 15, commercial 10, clinical 10, research 5, AI 5), computed from unrounded cell grades.

This is an adaptation. Several dimensions have no direct counterpart in published evidence, and each adaptation is stated below.

## What it is not

- **It does not grade the country.** A Gold evidence grade means the evidence behind the scores is well sourced. It says nothing about whether the country protects patients well. Mexico can have strong evidence for a weak score.
- **It does not change any score.** No category score, overall score or rank in `data/` is touched or reweighted by this grade.
- **It does not read the sources.** The script checks who published a source, whether the link opens, when the source was published and whether the author admitted a gap. It does not check that the cited page says what the summary says, or that the evidence is about the thing the category measures (see Limits).
- **The tier names are borrowed, not their meanings.** In the DTI paper, Gold means "suitable for clinical decision support" and Platinum "suitable for regulatory submission". Those sentences describe health data records and do not carry over to an evidence cell. On a public page, show the number and the primary-source share beside any tier name.

## Inputs and provenance

| Input | What it is | Made by | Date | Coverage |
|---|---|---|---|---|
| `data/*.json` | the index: 43 countries x 8 categories = 344 cells, 907 source citations | Dustin (data author) | imported 1 Oct 2026 | all 43 countries |
| `analysis/source_classes.csv` | publisher class of every cited URL, by domain list in `analysis/sources.py` | consistency audit | 1 Oct 2026 | 907 of 907 citations |
| `analysis/url_check.csv` | HTTP status of every cited URL, two passes, `final_outcome` column | `analysis/url_check.py` + `url_recheck.py`, from a US network | 1 Oct 2026, 13:03 to 13:24 UTC | 1,297 of 1,297 references |

No house data service supplies any input. The only inputs are the repository files and the earlier live HTTP check of the cited URLs. **Where a source's class comes from, in order:** (1) the audit's class when the domain is on one of `sources.py`'s lists (stamped `audit`); (2) the author's own `publisherClass`, which v1.1 countries carry (stamped `author`); (3) the audit's catch-all, because `sources.py` labels every unlisted domain "news" (stamped `auditDefault`; 183 of the 907 v1 citations, 106 domains, mostly real news and trade press, a few vendors or journals); (4) otherwise the weakest class, blog or vendor (stamped `none`). Each cell's `classFrom` counts these. Author-declared classes are set by the people whose evidence is being graded and have not been checked against `sources.py`.

## The eight dimensions as adapted

Each dimension is scored 0 to 100. The cell grade is the weighted sum. Where a dimension averages over sources, every source counts equally.

| Dimension (weight) | DTI paper meaning | As adapted for evidence | Scoring |
|---|---|---|---|
| **Provenance (25)** | source pedigree and chain of custody; unknown source scores 0 to 40 | how close the publisher is to the fact | per source: law text, government or regulator, intergovernmental body 1.0; academic 0.8; news 0.6; law firm 0.5; blog or vendor 0.3; unclassified 0.3. Mean over sources. |
| **Consent (20)** | explicit, scoped, revocable consent for the use, with a tested revocation path | **open availability**: anyone can open the source today. This is the furthest stretch; published evidence has no data subject. | per source: opened (HTTP 200 on the check) 1.0; not verified (blocked by bot protection, redirect that never resolved, or not yet checked) 0.5; dead or unreachable 0.0. Mean. |
| **Recency (15)** | time since collection, decayed by a modality half-life; decay runs from collection, not receipt | time since publication | law text 1.0 at any age (the paper's infinite half-life for stable facts). Otherwise: published within 24 months 1.0, within 60 months 0.6, older or undated 0.3. A `date` equal to the file's `asOf` is an access date, not a publication date, so it counts as undated. Mean. |
| **Quality (10)** | field-level completeness and missingness | completeness of the evidence record | share of required fields present: summary, detail, at least one source, and for each source a title, an http URL and a publication date. |
| **Concordance (10)** | corroboration by independent sources; independence is structural; no independent source = neutral 50 (Algorithm 1 and section 4.3; Table 1 instead puts "single source" at 0 to 40, and we follow the algorithm because it is the scoring rule) | number of independent publishers | no source 0; one publisher 50 (neutral, as in the paper); two or more 80. A publisher is a registrable domain, so `korea.kr` and `m.korea.kr` are one publisher. The top is held at 80 because the script does not check that the sources agree. |
| **Validation (10)** | evidence that the measure is linked to the outcome | whether the author verified the facts the cell rests on | 30 if the summary or detail admits a gap ("not verified", "unverified", "could not verify/confirm/check", "not confirmed", "not checked"); otherwise 100. Statements of absence ("no rule was found") are findings, not admissions. |
| **Breadth (5)** | number of distinct modalities; penalizes reliance on one | number of distinct kinds of evidence | distinct publisher classes in the cell: 1 = 40, 2 = 70, 3 = 90, 4 or more = 100. |
| **Stability (5)** | test-retest reliability | would a second reader give the same regime the same score? | 40 if the cell is in an open test-retest finding of the consistency audit (findings 1 to 4: the same regime scored far apart in different countries); otherwise 100. |

## Tiers

As published in the DTI paper, section 3.3: **Platinum** 90 and above, **Gold** 80 to 89, **Silver** 70 to 79, **Bronze** 55 to 69. Below 55 is labeled Below Bronze here; the paper names no tier for it. The tier is read from the grade as displayed, rounded to a whole number, so the number and the tier name never disagree on the page.

A country is **provisional** when any of its links is unchecked, or any source class is author-declared or missing. A provisional tier is not published. The audit's catch-all "news" does not make a country provisional (it was set independently of the author), but it is counted in `classesAuditDefault`.

## What changed after the adversarial review (1 Oct 2026), and why

Weights, class values, tier cut-offs and the recency steps were not changed. These eight fixes correct definitions that did not measure what the DTI dimension names, or verifiers that failed when attacked:

1. **Concordance measured class mix, not corroboration.** It required one primary and one secondary source, so three independent secondary publishers scored 30 and a single primary 60. That counted Provenance twice. Now: independent publishers, with the paper's neutral 50 for one source.
2. **Breadth and Concordance both counted hostnames**, and counted `m.korea.kr` and `korea.kr` as two. Breadth now counts kinds of evidence (the paper's "modalities"). Concordance counts publishers by registrable domain (the paper's "structural" independence). This affected 18 cells.
3. **Validation's phrase match missed 8 admissions** ("unverified", "could not confirm", "could not be verified", "not confirmed") in ARG clinical, EST research, FRA privacy, GHA privacy, IRL journey, RWA access, RWA clinical and SAU privacy. The phrase list now covers the wordings the audit counted by hand (the audit never put them in code).
4. **Quality measured the writing template** (word and paragraph counts the audit had already enforced), so 97% of cells scored 100. It now measures missing fields in the evidence record, which the paper names, including the 85 sources with no publication date.
5. **Access dates were read as publication dates.** 22 sources (13 in Canada, 9 eCFR pages in the USA) carry the research date. Recency now treats them as undated, the same as the 64 official sources left undated ("n.d." or blank). Before, the same evidence scored 1.0 or 0.3 depending on how the author filled in the field. The eCFR pages are law text and stay at 1.0.
6. **Unresolved redirects (302, 307) scored as open.** The audit could not reach a page behind them, so they now count as not verified (0.5).
7. **Unchecked links scored 0, the same as dead.** Every new country would have lost about 20 points because its links had not been checked yet. Unchecked is now "not verified" (0.5), counted per cell and country, and makes the country provisional.
8. **Stability took in findings 5 and 6.** Finding 6 (Belgium's thin sourcing) is already scored by Provenance. Finding 5 (Korea's privacy evidence is off the construct) is not a reliability failure, and no dimension can see it. Both stay as `findings` metadata on the cell and are no longer scored as Stability.

## Result (run 1 Oct 2026, the 43 v1 countries, 344 cells)

The first v1.1 countries (BGR, CYP, CZE, HRV, HUN, LUX, LVA, MLT, ROU, SVK, SVN) landed during the run. All are provisional: none of their 259 source links has been checked and all their classes are author-declared. Their provisional grades (75 to 83) are about 10 points low from unchecked links alone and must not be compared with the v1 countries until rule 1 has run.


- **Countries:** 75 (UAE) to 92 (South Africa). Platinum 3 (GBR, ITA, ZAF), Gold 36, Silver 4 (ARE, NLD, SAU, THA). Before the fixes: 75 to 93, with Platinum 11, Gold 28 and Silver 4. Rank correlation with the first version: Spearman 0.89.
- **Cells:** 67 to 96. Platinum 79, Gold 198, Silver 59, Bronze 8.
- **Largest moves:** Canada 91 to 81 (fix 5: its sources carried the research date, not a publication date). Belgium 75 to 81 (fixes 1 and 8: its secondary sources come from several independent publishers, and its thin sourcing is no longer counted twice). Belgium's cells average a 3% primary-source share. **A Gold grade can sit on almost no primary evidence.**
- **Korea privacy:** 77, Silver (70 before). Validation is 30 because the detail admits that the data-localization claim was not verified. All three sources are secondary. That the evidence is about an e-commerce case, not health, is invisible to the measure (finding 5).

### Is the compression real or lenient design?

Both, and it can be measured.

- **Real:** 1,220 of 1,297 links open, the records are mostly complete, and most cells are not in a test-retest finding. Consent, Quality and Stability together carry 35 of the 100 points, and cells average 33.6 of those 35. That is earned, but nearly every cell earns it, so those 35 points barely separate one country from another.
- **Design:** on the published weights, a cell with **one dated news article that opens and makes no admission grades 82, Gold**. A cell with one undated blog post that admits a gap still grades 55, Bronze. The other 65 points (Provenance, Recency, Concordance, Validation, Breadth) do the separating, and Provenance carries only 25 of them. 36 of the 277 Gold-or-better cells cite no primary source at all.
- **Averaging:** each country averages 8 cells that each average 1 to 4 sources, which compresses the country spread further (cell SD 6.3, country SD 3.9).

The DTI weights were set for health records, where Provenance failures are rare and costly and Consent is a real gate. In this setting they produce a measure that ranks evidence sensibly but is generous in its tiers. Changing that is a choice about the method, not a fix, and it is JAS's to make. Two options that do not tune weights: (a) publish the grade with the primary share beside it and drop the tier names; (b) a documented cap, for example no cell above Silver without a primary source, justified by the paper's statement that Provenance failures are "the least recoverable class". The paper defines no such cap, so (b) would be our extension and must be labeled as one.

## Limits

- The measure does not check that a source supports the sentence that cites it. A live government page about something else scores the same as one that proves the claim.
- It cannot see whether the evidence measures the category's construct (finding 5). The v1.1 privacy anchor ("score health-sector evidence first, else the general law at 45 to 66, and say so") is the fix for that, in the data, not here.
- Publisher classes come from a hand-made domain list. Unlisted domains default to "news" (0.6), which is generous for the few vendors and journals among them. New countries' classes are self-declared until their domains are added to `sources.py`.
- Link status is a single day's check from one US network. Nine URLs were unreachable (likely geo or TLS blocking), and 42 references were blocked by bot protection.
- An HTTP 200 means the page loads, not that the cited text is still on it.
- Recency uses steps (24 and 60 months), not the paper's exponential decay. Undated sources are held at 0.3, where the paper decays toward 0. Any half-life would be a free choice for policy evidence, so the steps were left as built and are stated here as a departure.
- A missing publication date counts in both Recency (age unknown) and Quality (field missing). This mirrors the paper, where a missing collection timestamp affects both.
- Validation is all or nothing: one admission about a side fact costs the same as one about the fact the score rests on.
- Stability uses the findings of one reader (the audit). The audit itself asked for a second reader before publication.

## Decision rules

1. **Run order before any grade is published:** `analysis/url_check.py`, then `analysis/url_recheck.py`, then `analysis/sources.py`, then `scripts/dti_evidence.py`, then `scripts/test_dti_evidence.py`. A provisional country (`provisional: true`) or a failing test means no grade goes on the page. *Check:* the `provisional` field, and the test script's exit code.
2. **Updating Stability when Dustin rules on a finding.** A finding clears when, for every cell it lists, Dustin either rescores the cell in line with the same-regime peers (the v1.1 sub-anchors in `docs/RUBRIC_V1_1_ANCHORS.md`) or writes a reason in that file for keeping the score. Then delete the finding's key from `RETEST` in the script, rerun, and record the date and the ruling in the commit message. Do not remove individual cells from a finding that is still partly open; split the finding instead, with a written reason. Test 7a uses a planted finding number, so clearing real findings never breaks the suite. *Check:* `meta.stabilityFindingsOpen` in the output.
Findings 1 to 4 cleared on 1 Oct 2026 (JAS ruling; docs/SCORE_CHANGES.md), and `RETEST` is empty.
3. **Findings 5 and 6** clear the same way but change no score here. Both cleared on 1 Oct 2026 and `OTHER_REVIEW` is empty. Remove their keys from `OTHER_REVIEW` when Korea's privacy cell cites health-sector or general-law evidence under the v1.1 anchor, and when Belgium's confidence label is computed.
4. **No retuning to move the spread.** Weights, class values, tier cut-offs and recency steps change only by a written decision that names its reason in the DTI paper, with the before and after distribution in the commit. *Check:* none in code; this rule depends on review.
5. **Ratchet:** the test suite has 29 checks (26 at first; 10f to 10h added in wave 1). The old definitions fail 15 of them: 2b, 3, 4b, 5, 6.1 to 6.3, 7b, 8, 9, 10b, 10d, 10e, the real-data check 13, and 7a (7a only because the old code took no finding list, which is a harness artifact, not a defect). Tests are added, never removed, and are never weakened to turn red to green.

## How the verifier was tested

`scripts/test_dti_evidence.py` plants cells next to a clean control cell (one official page, one law text, one news story, all dated, all open; grade 94):

- all sources from blogs
- all links dead
- links unchecked, which must score between dead and open
- an unresolved redirect
- one undated source, and one with a blank date
- a source dated with the access date
- four wordings of "not verified", plus a statement of absence that must not count
- a finding-2 cell, and a finding-6 cell that must be flagged but not scored
- two hostnames of one publisher
- three independent secondary publishers against one
- an author-declared class; an author class against the audit's catch-all (the author wins); an author class against a listed domain (the audit wins); an unclassified source
- a cell with everything wrong at once, which must fall below Bronze (it scores 34)

On the real data, it checks that making every link dead or every source a blog never raises any of the 344 grades, and that every cell admitting an unverified fact loses Validation. To prove the tests can fail, the same suite was run against the pre-review definitions (`DTI_MODULE_DIR` pointing at a copy). It failed 15 checks: 14 match a defect listed above, and 7a fails only because the old code takes no finding list. The arrival of 11 v1.1 countries mid-run was an end-to-end test of the provisional gate, and all 11 were held back.

## SuperTruth extension: tier cap (JAS ruling, 1 Oct 2026)

Not part of the DTI paper. The tier LABEL is capped at Silver when a cell's evidence has no primary source (law text,
government, regulator, intergovernmental body), and a country's label is capped at Silver when fewer than 4 of its 8
categories cite a primary source. The DTI number is never changed; `tierCapped` marks where the cap applied.


## Update 1 Oct 2026 (wave 1)
The grade now covers 64 countries. A statute in force counts as current wherever it is published (legal_text class, an author class of legal_text, or an official source whose title names a law). Liechtenstein stays provisional until its control source is re-cited from the publisher (liechtenstein-institut.li) instead of a shared S3 link. Canada's drop to Silver on 1 Oct reflects a flaky canada.ca link check; recheck before launch.

## 2 Oct 2026: publisher classes for 196 countries

The hand-listed domains in `analysis/sources.py` cover the first 65 countries. For the other sources the audit now rules on every class and records how in `analysis/source_classes.csv` (`basis` column): `listed` (hand list), `rule` (a domain rule decided it: government suffixes, law firms and legal-guide vendors are law_firm whatever was claimed, social media, app stores and file hosts are never primary, and on commercial domains a primary claim stands only for named legal-text hosts or named government bodies), or `claim` (the class recorded by the research agent, accepted on a country-code or non-commercial domain after the country file's cross-check by a second agent session). The grade treats all three as audited and labels the cell inputs `audit`, `audit_rule` or `audit_claim`; a grade is provisional only if a cited link was not checked or a source has no audited class. Accepted claims are the weakest of the three bases and are counted so a reader can see their share.
