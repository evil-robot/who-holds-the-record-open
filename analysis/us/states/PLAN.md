# US state layer: pre-registered plan (v1)

Written 3 Oct 2026, before any state was researched. The SHA-256 of this file, of `RUBRIC_STATES.md` and of every script named here is in `plan_stamp.txt`. All are committed to git before the pilot or any research session runs, so the commit time is the record. Nothing in this plan changes after that commit; any deviation is listed in the report under "Deviations", with the reason.

**What this layer is.** A state-by-state profile of what each jurisdiction's own law adds to the federal floor for a person's health record: the 50 states and the District of Columbia, 51 jurisdictions. Beside it sits a separate **SDOH context** strand (section 10): public statistics on whether people are placed to use those rights. Neither strand is a score. Neither changes the national US score, which stays as published in `data/USA.json` (asOf 2026-10-01).

**What it is not.** Not legal advice. Statutes change. Every cell carries the date its law was read (section 13).

**Services behind every figure.** Legal cells: primary pages on state government hosts, opened by Anthropic agent sessions (claude CLI, model pinned) with built-in web search and fetch; no other search vendor is added (the house SerpAPI is not needed for statute lookup). SDOH figures: DataSpine (`spine.artistsandrobots.com/api/v1`), the house service the data-science seat reaches for on US geography; its ACS figures were reconciled against the Census Bureau API (house, keyed) on 3 Oct 2026. Census regions for stratification: the Census Bureau's four-region definition. Costs: the CLI's own per-session report (`total_cost_usd`). Statistics: the ds-lab Python environment, reusing `analysis/reliability2/scripts/stats.py`.

## 1. Definitions

- **Jurisdiction**: one of the 50 states or DC, keyed by USPS code (`AL` ... `WY`, `DC`). Puerto Rico and the other territories are out of v1.
- **Federal floor**: RUBRIC_STATES.md section 1 (HIPAA Privacy Rule via the eCFR, and the 45 CFR 160.203 preemption rule), frozen at the eCFR text on the first research date. `data/USA.json` notes a proposed OCR rule on access deadlines planned for November 2026; if any federal change lands during the run it is logged and applied only at the next refresh.
- **Cell**: one jurisdiction x one dimension, or for D4 one jurisdiction x one category. Frame: 51 x (6 + 4) = 510 cells, plus one unscored context fact per jurisdiction (`data_broker_registry`).
- **Status**: one of six values (RUBRIC_STATES.md section 2). `not_checked` is the default; `no_law_found` is a finding with a search log. They are never merged, counted together or shown alike. `not_checked` carries a null level or value; `no_law_found` and the other not-in-force statuses carry the lowest level or the "none" value (RUBRIC_STATES.md section 2).
- **Level**: the ordinal anchor (D1, D2, D5, D6, D7) or nominal value (D3, D4) a cell earns. Only an `in_force` provision earns a level above the lowest.
- **checkedAt**: the date the provision was read. **Research window**: the dates of the main run; the layer's `asOf` is the last date in it.
- **Researcher**: the first agent session for a jurisdiction. **Cross-checker**: a second, fresh session that re-reads the first's evidence. **Rater**: a blind session in the re-score (section 7).
- **Census region**: Northeast (9 jurisdictions), Midwest (12), South (17, DC included), West (13).

## 2. Which dimensions, and why

A candidate is kept only if all three hold: (a) it gives the person something above the federal floor that survives preemption; (b) it varies across the 51 in a way a primary text settles; (c) it is not already what the national US cells score. Every kept dimension is ordinal or nominal; none is 0 to 100, because each asks whether a provision exists and what it requires, and a 100-point number would claim precision the evidence lacks.

| Candidate | Decision | Reason |
|---|---|---|
| Consumer health data laws outside HIPAA (dedicated laws such as Washington's My Health My Data Act and Nevada SB 370; Connecticut's consumer health data provisions; comprehensive privacy acts with sensitive-data clauses; California's CCPA/CPRA and CMIA) | **Kept: D1, ordinal 0 to 3** | HIPAA does not reach apps, wearables or brokers, so state law is the only consent rule; the national commercial cell can only say "states fill gaps unevenly". The ladder separates opt-out, opt-in and a dedicated law with a sale authorization. A private right of action is scored in D5, not here, so it is not counted twice. |
| Patient access and copy fees stricter than HIPAA | **Kept: D2, ordinal 0 to 2** | A shorter deadline or a statutory free copy survives preemption and varies. Per-page fee caps are recorded but never counted: where they exceed HIPAA's cost-based fee they do not apply to the person's own request, and comparing a cap with "actual cost" cannot be settled from a text. Shown as a table only (section 9). |
| Statewide HIE and its consent model | **Kept: D3, nominal** | It varies and decides whether a person can say no to exchange. Opt-in and opt-out trade control against a connected record, so the values are not ranked. |
| Minors' records | **Rejected for v1** | Which way is "more" for the person is contested (a parent's access against a minor's confidentiality), and the rules split by service and age. Scoring would take a side; describing it at the depth needed is a separate study. |
| Sensitive categories: reproductive, mental health, HIV, genetic | **Kept narrowly: D4, nominal, four sub-cells** | Only the fact that a category-specific confidentiality or disclosure rule exists, quoted. The 2024 federal reproductive health privacy rule was vacated in June 2025 (Purl v. HHS, `hipaa_brief.md`), so state law is the live layer. Binding neutral wording, never mapped, never counted. Expected to vary little for mental health and HIV; stated now so a low kappa is not a surprise. |
| Private right of action for health data | **Kept: D5, ordinal 0 to 2** | Whether a person can enforce a right without waiting for the attorney general varies sharply and is settled by the text. Kept separate from D1 so enforcement and substance are not mixed. |
| Breach notification covering health data | **Kept: D6, ordinal 0 to 2** | Every jurisdiction has a breach law, so presence is not the question. Whether medical and health insurance information are in the definition varies. Deadlines and regulator notice are recorded as facts, not levels. |
| AI in health care (for example California AB 3030; Colorado's AI act, replaced in 2026 with an effective date of January 2027 per `hipaa_brief.md`; Utah; Texas SB 1188) | **Kept: D7, ordinal 0 to 3** | Disclosure, clinician review and human recourse are separable, countable elements. Effective dates decide: an act not yet effective on `checkedAt` earns nothing and is shown with its date. |
| Data broker registries | **Rejected as a dimension; kept as an unscored context fact** | Not health-specific; a registry lists businesses and is not a right of the person (one exception, a deletion mechanism, is recorded). Few jurisdictions have one, so a map would be nearly all one class. |

## 3. Provenance and evidence

The evidence rules are RUBRIC_STATES.md section 4, binding on every session. In short: primary sources only (legislature or revisor code, the AG or regulator, the designated HIE's own policy for D3, court orders); leads (Justia, FindLaw, Casetext, Cornell LII state pages, NCSL, IAPP, FPF, law firms, press, Wikipedia) recorded but never evidence; each evidenced cell carries citation, official URL, effective date, a quote of 50 words or fewer, and `checkedAt`; `no_law_found` carries a search log; nothing from memory.

Every quote is also checked against the page itself, not only against the session's reading of it: the harness fetches every evidence URL with curl, stores the raw bytes under `raw/<USPS>/` with their SHA-256 and retrieval time, extracts text (pdftotext for PDFs), and requires the quote to appear after normalising whitespace, quote marks, dashes, soft hyphens and the section sign. A page that cannot be fetched raw (script-built pages) is marked `quoteVerified: "session"` and its quote is re-read by the cross-checker; the count of such cells is reported.

### Leakage and contamination risks, and the guard for each

| Risk | Guard |
|---|---|
| The state run writes into the country data or moves a national score | State files live only in `data/us-states/`. `build.js` reads `data/*.json` at the top level only, and `scripts/datahash.py` hashes only `data/[A-Z][A-Z][A-Z].json`. Tested on a copy of `data/` on 3 Oct 2026: the hash was `ad2e1325...229f` before, with `data/us-states/CA.json` added, and with a stray `data/CA.json` added; a `build.js`-style read of the copy took the stray file in as a 199th "country". So the hash gate is blind to this failure, and the verifier must check the folder listing itself: it fails on any file at `data/` top level that is not a three-letter country file, and on any change to the hash or to any score in `data/USA.json` across the run. Planted cases prove both (section 8). |
| Researchers inherit secondary URLs from our own files | Sessions run in an empty scratch directory with no repo access. `hipaa_brief.md` cites Justia and law firms; the lead-host list makes those URLs fail as evidence. |
| Answers from model memory (training data predates 2026 sessions) | No level without an opened primary page; the research transcript audit fails any evidence URL that was not fetched in that session before the file was written. |
| The cross-checker anchors on the researcher's answer | Measured, not assumed: planted wrong cells (section 5.4). |
| Blind raters reach our answers | Nothing from this layer is pushed to the open repository (`who-holds-the-record-open`), deployed to the site, or placed in any Sage room or house index before both re-score arms finish. Forbidden hosts in every rater audit: the site, its domains, both repository names, supertruth, railway.app, localhost. |
| The rubric leaks results | RUBRIC_STATES.md names no jurisdiction's result; a grep over 51 state names finds only "District of Columbia", in the scope sentence. Candidate laws are named only in this plan, which raters never see. |
| Same model family for researcher, cross-checker and rater | Not removable; stated as a limit. Shared priors can inflate agreement. |

## 4. Output schema

One file per jurisdiction, `data/us-states/<USPS>.json` (never at `data/` top level):

```json
{
  "usps": "XX", "fips": "00", "name": "", "censusRegion": "South",
  "asOf": "YYYY-MM-DD",
  "dimensions": {
    "consumer_health_data": {
      "status": "in_force", "level": 2, "pending": false,
      "provisions": [{
        "title": "", "citation": "", "officialUrl": "", "linkedFrom": null,
        "effectiveDate": "YYYY-MM-DD", "statusOfProvision": "in_force",
        "quote": "", "quoteVerified": "raw", "rawSha256": "", "appliesTo": "", "checkedAt": "YYYY-MM-DD"
      }],
      "searchLog": null,
      "leads": [{"url": "", "host": "", "usedFor": ""}],
      "note": "",
      "crossCheck": {"verdict": "confirm", "session": "", "note": ""}
    },
    "copy_rights":      {"status": "not_checked", "level": null, "pending": false, "facts": {"deadlineDays": null, "freeCopyCases": [], "feeRules": []}, "provisions": [], "searchLog": null, "leads": [], "note": "", "crossCheck": {}},
    "hie_consent":      {"status": "not_checked", "value": null, "basis": "statute", "designatedHie": "", "stricterForSensitive": null, "provisions": [], "searchLog": null, "leads": [], "note": "", "crossCheck": {}},
    "sensitive_records": {
      "reproductive":  {"status": "not_checked", "value": null, "provisions": [], "searchLog": null, "leads": [], "note": "", "crossCheck": {}},
      "mental_health": {}, "hiv": {}, "genetic": {}
    },
    "private_right":    {"status": "not_checked", "level": null, "facts": {"statutoryDamages": ""}, "provisions": [], "searchLog": null, "leads": [], "note": "", "crossCheck": {}},
    "breach_health":    {"status": "not_checked", "level": null, "facts": {"noticeDeadline": "", "regulatorNotice": null, "hipaaDeemedCompliant": null}, "provisions": [], "searchLog": null, "leads": [], "note": "", "crossCheck": {}},
    "ai_care":          {"status": "not_checked", "level": null, "facts": {"elements": {"disclosure": false, "clinicianDecides": false, "humanRecourse": false}, "prohibitions": []}, "provisions": [], "searchLog": null, "leads": [], "note": "", "crossCheck": {}}
  },
  "context": {"data_broker_registry": {"status": "", "deletionMechanism": null, "provisions": []}},
  "sdohContext": "see analysis/us/states/sdoh_context.json (kept out of this file on purpose)"
}
```

`searchLog` (required for `no_law_found`): `{"codeSearchUrl": "", "terms": [], "regulatorPagesChecked": [], "leadsChecked": [], "searchedAt": ""}`.

Session transcripts: `analysis/us/states/transcripts/`. Raw pages: `analysis/us/states/raw/`. Both stay out of every public export (vendor-hosted statute pages carry their own terms), as with the reliability transcripts. Cross-check outputs: `analysis/us/states/crosscheck/<USPS>.json`. The SDOH strand writes only `analysis/us/states/sdoh_context.json`, never into a state file, so the two strands cannot mix.

## 5. Protocol

### 5.1 Before any research
1. This plan, the rubric, `scripts/size_sim.py`, `scripts/cost_estimate.py` and their outputs are hashed and committed (this commit).
2. The verifier (`scripts/verify_states.py`), the research transcript audit (`scripts/audit_research.py`), the harness (`scripts/run_session.sh`) and the prompts are written next, attacked with every planted case in section 8, and must pass their self-tests. Their hashes are then appended to `plan_stamp.txt` in a second commit, still before any research. The checks they implement are fixed here; only the code is written later.

### 5.2 Pilot (harness only)
DC (its official code host and non-state structure test the evidence rules) and one state drawn with seed 20261005 run research and cross-check once. Pilot files go to `pilot/`, are excluded from every result, and the two jurisdictions are researched again in fresh sessions in the main run. Nothing in this plan or the rubric changes after the pilot; a harness bug fix is listed as a deviation.

### 5.3 Research (one session per jurisdiction)
A fresh headless session per jurisdiction, from an empty scratch directory, model pinned, tools limited to WebSearch, WebFetch, curl, and writing one output file in its scratch directory; no MCP servers; user settings and hooks not loaded. It gets RUBRIC_STATES.md, the jurisdiction name and USPS code, and the JSON schema. Full stream-json transcript kept. A session that fails the transcript audit is excluded whole and re-run once in a fresh session; a second failure leaves that jurisdiction's cells `not_checked`, reported as such. Every transcript is kept.

### 5.4 Cross-check (second session), and the test of the cross-checker
A fresh session per jurisdiction gets the researcher's file and the rubric. It re-opens every evidence URL, confirms the quote, the effective date and the level against the anchors, and runs its own search on every `no_law_found` cell. It writes a verdict per cell (`confirm` or `dispute`, with its own evidence) to `crosscheck/<USPS>.json`. It cannot edit the researcher's file.

**Planted wrong cells.** Before the cross-check starts, a script draws 24 jurisdictions (seed 20261006) and plants one wrong cell in each researcher file the cross-checker will see, four of each type: (1) an `in_force` provision relabelled `no_law_found`, with an invented search log; (2) a level raised by one, quote unchanged; (3) an `enacted_not_yet_effective` provision relabelled `in_force` with its date moved back (or, where none exists, an `in_force` date moved past `checkedAt` with status kept); (4) one material word changed in a quote ("shall" to "may", or a number); (5) the evidence URL swapped to a lead host for the same citation; (6) the citation replaced by a section of another jurisdiction's code. The plant ledger (`plants.json`, every entry `"planted": true`) is hashed into `plan_stamp.txt` and committed before the first cross-check session, and is not visible to any session. After the cross-check, every planted cell is restored from the ledger, its verdict is set aside, and the verifier confirms no planted value survives in `data/us-states/`.

Order of operations: plant, then cross-check, then restore every planted cell from the ledger, then run `verify_states.py`. The verifier never runs on planted files, because types 5 and 6 are exactly what its case 9 rejects. Those two types are therefore a baseline (a deterministic check would catch them anyway); the cross-checker is graded mainly on types 1 to 4, and detection is reported by type.

Decision rule: the cross-check is trusted only if it disputes at least 22 of the 24 planted cells (detection at least 90%; the exact Clopper-Pearson interval is reported). If it catches fewer, its verdicts on real cells are not used; the prompt is revised in writing, all 51 cross-checks re-run, and a fresh set of 24 plants (new seed, recorded) is drawn. Detection by plant type is reported whatever the result.

### 5.5 Disputes
A cell the cross-checker disputes goes to the editors with both readings and both sources. Until they decide, the cell is shown as "under review", is left off every map, and is counted separately. The editors' ruling is journalled in the file (`crossCheck.resolution`, who and when). No agent resolves a dispute alone.

### 5.6 Blind re-score
Section 7. It runs after cross-check and dispute resolution, on the files as they will be published.

## 6. Aggregation: no composite

There is no state total, overall score, rank or index, and no file or page may compute one. The dimensions are on different scales (four ordinal ladders of different lengths and two nominal sets), they ask different questions, and some are deliberately unranked (D3, D4). Any weighting would be a choice the data cannot defend, and any sum would quietly treat `not_checked` and `no_law_found` as zero. The same reasoning governs `analysis/strain/METHOD.md` section 3.

The only aggregates allowed are, per dimension: the count of jurisdictions at each status, the count at each level or value among `in_force` cells, and the count `not_checked` and "under review". The verifier fails on any key named `total`, `overall`, `composite`, `rank` or `score` in a state file or in `analysis/us/states/aggregate.json`.

## 7. Blind re-score (pre-registered)

Two arms. Both use fresh rater sessions under the study 2 conditions (model pinned, empty scratch directory, no MCP, no repo, transcript kept and audited).

### Arm A: scoring reliability on the cited evidence (as in reliability studies 1 and 2)
- Frame: cells whose status is not `no_law_found` or `not_checked` (those have no provision to re-read; they go to arm B). This removes many level-0 cells, which narrows the range of levels in the sample and can depress ICC; level prevalence is reported beside every agreement figure.
- Sample: 24 cells from each ordinal dimension (D1, D2, D5, D6, D7), 16 from D3, and 16 from D4 (4 per category): 152 cells. Within each dimension, Census regions get cells in proportion to their jurisdiction counts by largest remainder, then jurisdictions are drawn at random without replacement. Seed 20261007. A stratum with fewer eligible cells than its quota gives all it has, and the shortfall is reported, never refilled from another stratum. The draw reads USPS code, region, dimension and status only, never a level.
- Within-rater repeat: 8 cells rated again by a different session. 160 tasks in 16 batches of 10, no jurisdiction twice in a batch.
- The rater gets RUBRIC_STATES.md, the jurisdiction, the dimension and the cell's evidence URLs (with `linkedFrom` pages), nothing else: no level, quote, note, title or status. It returns status and level (or value), each with the source it opened, or null.
- Audit: `analysis/reliability2/scripts/audit_transcripts_v2.py` (the corrected verifier: fragment handling, quoted pipes, newer refusal wording, chained commands), copied with its 23 planted cases and extended with the new cases in section 8; `--selftest` must pass before the run.

**Statistics.** Primary: ICC(2,1), absolute agreement, on the level codes of the five ordinal dimensions pooled, each rescaled to 0 to 1 (level divided by the top level), with the F-based 95% CI (`reliability2/scripts/stats.py`, self-tested against Shrout and Fleiss 1979). Secondary: exact level agreement; quadratic-weighted kappa per ordinal dimension with the published level prevalence beside it; ICC on dimension-centred codes (removes between-dimension level differences, the inflation review M6 found); country-cluster (here jurisdiction-cluster) bootstrap CIs; status agreement across all arm A cells; for D3 and D4, exact agreement and Cohen's kappa with prevalence. Within-rater repeat MAD in levels. No other tests, no per-dimension hypothesis test, so no multiple-comparison correction.

**Why this size** (`scripts/size_sim.py`, synthetic data only, output in `size_sim.txt`): at 17 rated cells a per-dimension weighted kappa has a 95% CI 0.5 to 0.85 wide, so per-dimension kappas are descriptive. The pooled ICC over about 105 rated ordinal cells is the decision statistic; at 85 rated cells its CI is about 0.24 wide when the latent agreement is 0.8. Coarse ordinal codes pull ICC down against the latent agreement (latent 0.8 gave a median ICC of about 0.66 in the simulation), so the threshold below is demanding for an ordinal scale; the simulation is stated, the threshold is not lowered for it.

**Decision rules (fixed now).**
- The site and any paper may say the blind re-score "agreed closely" only if all hold: pooled ICC(2,1) at least 0.75 (the house threshold from studies 1 and 2, with the CI lower bound stated beside it), exact level agreement at least 70% on ordinal cells, status agreement at least 90%, and exact agreement at least 85% on D3 and D4. Otherwise the measured figures are reported as the judgement uncertainty of a single cell.
- A dimension with exact agreement below 70% is not mapped (table only) until its anchors are revised in writing and re-tested in a new pre-registered sample.
- Every cell where the rater's status differs, or its level differs by 2 or more, goes to the editors with both readings. No cell is changed by the re-score itself; editors decide.
- Results are reported whatever they are.

### Arm B: evidence-gathering (can a rater who searches on its own find the same law?)
- The main error a state law layer makes is a law missed. Arm A cannot see one. Arm B can.
- Sample: 4 cells per dimension (D1 to D7; D4 one per category), 28 cells, seed 20261008. In each dimension, 2 are drawn from cells the researcher marked `no_law_found` (fewer if fewer exist, reported) and 2 from the rest.
- The rater gets the rubric, the jurisdiction and the dimension only, with web search allowed. It must cite primary sources under the rubric's rules. 7 sessions of 4 cells. Audit: the forbidden-host, local-path and tool checks of the verifier; the cited-set rule is off for this arm.
- Measures: status agreement; level agreement where both found a provision; **misses**: an in-force primary provision the rater found, opened and quoted where the researcher had `no_law_found`.
- Decision rule: every miss goes to the editors. If misses reach 3, every `no_law_found` cell in each dimension with a miss gets a second, independent search session before publication, and the method note says so.

## 8. The verifiers and how they are attacked

Three checks, each attacked with planted inputs before use (house gate 11). Planted files carry `"planted": true` and live in `adversary/`.

**`verify_states.py` (runs on every build; must fail on each red case):**
1. a file at `data/` top level with a two-letter name (`data/CA.json`), and a state file with a three-letter name;
2. a change in `scripts/datahash.py` output across the run, and any changed score in `data/USA.json`;
3. a jurisdiction missing, a 52nd code (`PR`), a duplicate;
4. a status outside the six values, a level outside the dimension's range, a nominal value outside its set; a `not_checked` cell with a non-null level or value; a found cell (any other status) with a null level or value; an aggregate that counts a null as 0 or as "none";
5. a level above the lowest with a status other than `in_force`;
6. `in_force` with an effective date after `checkedAt`;
7. `enacted_not_yet_effective` whose effective date is on or before the build date (forces a re-check before display);
8. an evidenced cell with no quote, a quote over 50 words, no citation or no official URL;
9. an evidence URL on a lead host; a non-.gov, non-.us evidence host without a `linkedFrom` on a .gov or .us host;
10. `no_law_found` without a complete search log;
11. a quote not found in the stored raw page after normalisation, and a `rawSha256` that does not match the stored bytes;
12. a D4 cell, note or caption containing a word on the valence list;
13. a key named `total`, `overall`, `composite`, `rank` or `score`;
14. a planted value from `plants.json` still present after restore;
15. `checkedAt` in the future or before the research window;
16. an SDOH key inside a state file, or a legal key inside `sdoh_context.json`;
17. in `sdoh_context.json`: a figure without slug, source name and vintage; a ratio whose parts have different vintages; a fraction-scaled slug shown as a percent without the x100 step (or a whole-percent slug multiplied); a suppression sentinel (`-666666666`, `-9999`) passed through as a value; a slug from the excluded list in section 10; an ACS figure labelled with a single year instead of its 5-year period; a county-weighted aggregate whose county FIPS set differs from the population rows.
Good cases that must pass: the clean pilot file; a vendor-hosted code page with a `.gov` `linkedFrom`; a D3 HIE policy on a `.org` host with a `.gov` designation page; a future-dated `enacted_not_yet_effective` cell; a quote whose page uses curly quotes and a section sign.

**`audit_research.py` (each research and cross-check transcript):** tools limited to the allowed set; no forbidden host; no local path outside the scratch directory; every evidence URL in the output was fetched (WebFetch or curl) in that session before the output was written. Red cases: an evidence URL never fetched; a fetch of the published site; a `cat` of a repo file; an MCP server present; a session that writes outside its scratch directory.

**Blind-arm audit:** `audit_transcripts_v2.py` as above, plus new red cases: a rater fetch of `who-holds-the-record-open`; a rater WebSearch in arm A; and the chain and quoted-pipe cases study 2 found.

**The cross-checker itself** is attacked by the 24 planted cells (section 5.4). A schema check cannot catch a wrong reading of a statute; the planted cells measure whether the second session can.

The planted cases stay in the repository as standing regressions. A verifier change re-runs them all.

## 9. Display rules for the site

The layer is shown beside the national US brief, never inside it. The national score, band and rank stay as published, with one sentence: "State laws add to the federal floor. The national score rates federal law and national infrastructure and does not change with these state profiles."

| Dimension | May be mapped? | Why |
|---|---|---|
| D1 consumer health data | Yes | Ordinal, four classes plus unknown. |
| D2 copy rights | **No, table only** | The meaning is in the facts (deadline days, free-copy cases, fees), which a colour hides. |
| D3 HIE consent | Yes, as unordered categories | Four nominal classes plus unknown; distinct hues, no ramp, no "better" end. |
| D4 sensitive records | **No, table only** | Neutrality: a map of these rules would be read as a political map, and the layer does not rate them. |
| D5 private right | Yes | Ordinal, three classes plus unknown. |
| D6 breach coverage | Yes | Ordinal, three classes plus unknown. |
| D7 AI in care | Yes, with dates beside it | Ordinal. |

Rules for any map: a law signed but not yet in force would otherwise sit under the same tile as no law at all, so every mapped dimension (D1, D3, D5, D6, D7) lists its `pending` provisions with their dates under the map, and each such tile carries a word label ("law signed, in force <date>"), never a hatch or pattern; equal-size tiles (one per jurisdiction, so DC is visible and large states do not dominate by land area), never a land-area choropleth; at most five classes; `not_checked` and "under review" drawn differently from `no_law_found` and labelled in words; the `asOf` date and "not legal advice" printed on the map; each tile links to the jurisdiction's table with its citations. One map per dimension, never a combined map. A dimension that fails the arm A agreement rule (section 7) is table only. Palette, layout and type go to the tufte agent before anything is shown.

## 10. SDOH context strand

**Name and frame.** "SDOH context". Organised under the five Healthy People 2030 social determinants of health domains (ODPHP, https://odphp.health.gov/healthypeople/priority-areas/social-determinants-health, opened 3 Oct 2026; the page shows no updated date): economic stability; education access and quality; health care access and quality; neighborhood and built environment; social and community context. That page defines SDOH as "the conditions in the environments where people are born, live, learn, work, play, worship, and age that affect a wide range of health, functioning, and quality-of-life outcomes and risks." It does not place broadband in a domain; following the owner's brief, digital access is shown under health care access and quality, because using a patient portal or exercising an electronic copy right depends on it, and the page says where we put it and why.

**Rules.**
1. Never scored, never weighted, never mixed into a legal dimension, never used to explain one. It sits beside the legal profile. No causal wording ("because", "explains", "leads to", "drives") links the two strands anywhere; the verifier's valence check is extended with these words for SDOH captions.
2. Only DataSpine sources with an attestation row (`source_attestation`, checked by a read-only query at build time; the public API's `/sources` lists 114 sources, 108 active and 6 stale, but does not expose attestation, so the query is the check). A figure whose source has no attestation row is not shown.
3. Every figure shows source, provider and vintage; a figure may not claim a period its data does not cover. Latest vintage per slug (DataSpine returns vintages unordered: take the maximum). A ratio is computed only when numerator and denominator share a vintage.
4. State level from the state row where DataSpine has one. County-only metrics are aggregated to the state only by the stated method below; county percentiles are never averaged. Before any county weighting, the set of county FIPS in the metric rows must equal the set in the ACS county population rows for that state, or the state gets no aggregate and the mismatch is reported (Connecticut's county-equivalents changed to planning regions in 2022 Census geography, so SVI and ACS rows may not share codes). DC is one county-equivalent, so a "share of population in top-quartile counties" is 0 or 100; DC shows its county value, and says so.
5. Periods are shown as the data's real coverage, not the slug's vintage string: DataSpine's ACS `vintage` "2022" is the 2018 to 2022 5-year estimate and is labelled "ACS 5-year, 2018 to 2022"; the queued refresh would be "2020 to 2024".
6. Unit traps handled in code, not by eye: SVI percentiles and several CMS and CHR shares are fractions, SAHIE and ACS-derived shares are whole percents; suppression sentinels become null; DataSpine stores values as 32-bit floats, so counts above 16,777,216 can differ by 1 or 2 from Census (seen: California English-only speakers 20,809,672 in DataSpine, 20,809,671 at Census). Comparisons use a relative tolerance of 1e-6.
7. Every ACS slug used is reconciled against the Census API for the same table and vintage before use (the check below); a slug that fails is excluded until DataSpine fixes it.

**What DataSpine holds, queried 3 Oct 2026** (`GET /api/v1/geo/{fips}/attributes` for 06, 53 and 11, and counties 06037 and 53033; catalog `GET /api/v1/attributes/catalog`, 858 attributes):

| HP2030 domain | Metric | DataSpine slug(s), source, vintage | Level | Status |
|---|---|---|---|---|
| Health care access and quality | Uninsured, under 65, % | `sahie_pct_uninsured_under65`, Census SAHIE, 2024 | state row | **Use** (whole percent; CA 6.9, WA 7.8, DC 4.8) |
| Health care access and quality | Households with a computer, % | `has_computer` / `total_households`, ACS 5-year 2018 to 2022 (vintage string "2022") | state row | **Use**. Reconciled exactly with Census B28003_002E and B28001_001E for CA, WA, DC |
| Health care access and quality | Households with a broadband subscription, % | `broadband_subscription` / `total_households`, ACS 5-year 2018 to 2022 (vintage string "2022") | state row | **Use**. Reconciled exactly with B28002_004E |
| Health care access and quality | Medicare beneficiaries; dual-eligible share | `medicare_beneficiaries_total`, `medicare_dual_eligible`, CMS Medicare Geographic Variation, 2024 | county | **Use**: sum counties to the state; dual share = sum of dual / sum of beneficiaries. No population share (no 2024 population in the same source) |
| Health care access and quality | Medicaid enrollment | none at state level (`pct_medicaid_only` is a county ACS share, 2022) | none | **Not available**; queued (CMS enrollment by state, `docs/DATASPINE_QUEUE.md`) |
| Health care access and quality | Primary care supply | `hrsa_hpsa_primary_care` (HRSA, 2025, county score 0 to 25); `physicians_active_total` (HRSA AHRF, 2023, county) | county | **Not shown in v1.** A county HPSA score has no defensible state aggregate, and what a missing county row means is not documented; physicians per person needs a same-year population. HRSA's state designation counts are a field of an existing DataSpine source, noted in the queue |
| Health care access and quality | Annual checkup, % adults | `brfss_annual_checkup_pct` (CDC BRFSS county, 2023), `health_annual_checkup` (CDC PLACES, 2023) | county | **Not shown**: model-based county estimates; a population-weighted state figure would be a new estimate we did not validate |
| Economic stability | Median household income | `median_household_income`, ACS 5-year 2018 to 2022 (vintage string "2022") | state row | **Use**. Reconciled with B19013_001E |
| Economic stability | Unemployment rate | `bls_unemployment_rate`, BLS LAUS, 2025 | state row | **Use** |
| Economic stability | Poverty rate | `poverty_population` (reconciled with B17001_002E), 2022 | state row | **Count only**: the poverty universe (B17001_001E) is not in DataSpine, and total population is the wrong denominator |
| Economic stability | SVI socioeconomic theme | `svi_socioeconomic_percentile`, CDC/ATSDR SVI, 2022 | county | **Use, aggregated**: share of the state's population living in counties at or above the national 75th percentile, population from ACS 5-year 2018 to 2022 county `total_population` |
| Education access and quality | Bachelor's degree attainment | `edu_bachelors`, ACS 5-year 2018 to 2022 | state row | **Excluded: fails reconciliation** (DataSpine 2,136,258 for CA; Census B15003_022E 5,935,292). No reconciled education metric remains, so this domain shows "not available" in v1 |
| Neighborhood and built environment | Households with no vehicle, % | `owner_no_vehicle` + `renter_no_vehicle` / `total_households`, ACS 5-year 2018 to 2022 | state row | **Use**. Reconciled with B25044_003E and B25044_010E |
| Neighborhood and built environment | Population in nonmetro counties, % | `rural_urban_continuum_code` (USDA ERS, 2023), codes 4 to 9, weighted by ACS 5-year 2018 to 2022 county population | county | **Use, aggregated**, method stated |
| Neighborhood and built environment | SVI housing type and transportation theme | `svi_housing_transport_percentile`, 2022 | county | **Use, aggregated** as for the socioeconomic theme |
| Social and community context | Speaks a language other than English at home, % | 1 - `language_english_only` / `language_total_pop`, ACS 5-year 2018 to 2022 | state row | **Use**. Reconciled with C16001_002E and C16001_001E (within float rounding) |
| Social and community context | SVI household characteristics; racial and ethnic minority status themes | `svi_household_percentile`, `svi_minority_percentile`, 2022 | county | **Use, aggregated** as above |
| Social and community context | People 65 and over living alone | `elderly_living_alone`, ACS 5-year 2018 to 2022 | state row | **Excluded: fails reconciliation** (CA 3,176,156; Census B11007_003E 1,290,207) |
| (cross-domain) | SVI overall | `svi_overall_percentile`, 2022 | county | **Use, aggregated**, shown apart from the domains because it spans them |
| (not SDOH) | Portal or patient-record use | none in DataSpine (no attribute matches "portal"; `serp-trend-telehealth` is search interest, not use) | none | **Not available.** No state-level official source was verified in this pass, so nothing is queued |

Also excluded on reconciliation: `smartphone_only` (CA 12,093,418; Census B28001_006E 992,913), `no_health_insurance` (CA 312,643; Census S2701 uninsured 2,752,067), `uninsured_male_under_6` (CA 1,357,220, about every boy under 6 in the state). These are reported to DataSpine's owners; they are not ours to fix. HIPAA breach counts by state (`hipaa_breaches_500plus`) are attested but are not an SDOH measure and count where the entity is, not where the people live; not shown in this strand.

**Freshness.** DataSpine's ACS rows are the 2018 to 2022 5-year estimates. The 2020 to 2024 5-year release answers at the Census API (checked 3 Oct 2026), so a refresh is queued under the existing slug. Until it lands, every ACS figure is labelled "ACS 5-year, 2018 to 2022".

**Output.** `analysis/us/states/sdoh_context.json`: per jurisdiction, per domain, per metric: value, unit, slug, source name, provider, vintage, method (state row or the aggregation), attestation id, and retrieval time; plus a `meta` block with the DataSpine query date and the reconciliation results. Display: a small table per state beside the legal profile, each figure with its year; a national dot plot per metric is allowed; never a combined index.

## 11. Run size and cost

Measured unit costs (`scripts/cost_estimate.py`, output `cost_estimate.json`), from the 20 study 2 rater sessions as the CLI reported them: a mean of $1.32 per 9-cell rater session; $0.026 per WebFetch (the page-reading model); main-model list rates recovered exactly from the transcripts (cache read $0.20, cache write $5, output $20 per million tokens). No research session in this project has a recorded cost, so research and cross-check sessions are an extrapolation with stated assumptions. The growth model, applied to the measured rater shape, gives $0.64 of main-model cost against $0.50 measured, so the estimates below lean high.

| Session type | Count (with re-run allowance) | Assumed shape (low / mid / high) | Cost each (low / mid / high) |
|---|---|---|---|
| Research (51 + 2 pilot) | 53 + 15% | 40 / 70 / 110 fetches, 15 / 30 / 45 searches | $3.07 / $5.53 / $9.29 |
| Cross-check (51 + 2 pilot) | 53 + 10% (a failed plant test would double this line) | 25 / 45 / 70 fetches | $1.79 / $3.04 / $4.81 |
| Arm A raters | 16 + 25% (study 2 re-ran 4 of 16) | measured | $1.04 / $1.32 / $1.68 |
| Arm B open-search raters | 7 + 25% | 24 / 36 / 50 fetches | $1.43 / $2.16 / $3.13 |

**Total: about 148 sessions; about $325 low, $560 mid, $910 high.** Not included: web search request fees (no recorded transcript used web search, so the per-search price is unknown here and must be read from the pilot's cost report), the harness and verifier build, and editor time. Wall time: sessions run in parallel as in study 2 (16 sessions took 36 minutes); about 2 to 4 hours of agent time for the main run. The pilot's measured cost per research session replaces the assumed shape before the main run starts; if the pilot's per-session cost exceeds the high case, the main run waits for the owner's go with the new total.

## 12. Decision rules (house gate 16)

Each rule goes into `DECISION_RULES.md` when its check exists. Until then it is labelled "no check yet".

| Rule | Why | Check |
|---|---|---|
| The layer never moves a national score or the data hash. | Owner's brief: a context layer. | verify_states.py cases 1 and 2; planted `data/CA.json`. |
| Unknown is not no: `not_checked` (null level) and `no_law_found` (a finding) are never merged, counted together or drawn alike. | The strain layer's rule. | verify_states.py cases 4, 10; display review. |
| Only an in-force provision earns a level. | Study 2's PRY.access disagreement (a law not yet in force). | Cases 5, 6, 7. |
| No level without a primary page opened in the session and a quote found in the raw page. | Gate 2, no fabrication. | audit_research.py; case 11. |
| No composite, no rank. | Section 6. | Case 13. |
| D4 carries no valence word and is never mapped. | Neutrality. | Case 12; display rule. |
| The cross-checker is trusted only if it catches at least 22 of 24 planted cells. | Gate 11. | Plant ledger and section 5.4. |
| A dimension below 70% exact agreement in arm A is table only. | Section 7. | analyze script; display rule. |
| SDOH figures carry source and real period, share-vintage ratios only, reconciled ACS slugs only, county weights only on matching county sets. | Gate 3 and the DataSpine traps. | Case 17. |
| Coverage floors (cells not `not_checked`, per dimension) only ratchet up. | Gate 16. | `coverage_baseline.json`, created with the first verified run. |

## 13. Limits, stated in advance

- **Not legal advice.** This records what a primary text said on the date it was read. Statutes, rules and court orders change, sometimes within days. Every cell shows `checkedAt`; the site shows the layer's `asOf` and "not legal advice" on every view.
- **Refresh.** A full re-check every six months. Every `enacted_not_yet_effective` cell is re-checked within 14 days after its effective date; the verifier refuses to build while one is overdue (case 7).
- A level says what a provision requires, not whether it is enforced or obeyed.
- Only 51 jurisdictions; territories and tribal law are out.
- The four ordinal ladders are coarse on purpose. Two jurisdictions at the same level can differ in ways the level does not show; the quoted provisions and facts carry those differences.
- Researcher, cross-checker and raters are the same model family.
- WebFetch returns a model-condensed reading; the raw-page quote check mitigates this, but not for pages that need a browser.
- The SDOH strand is descriptive. It does not measure whether anyone used a record right, and no figure in it is a cause of any legal cell.

## 14. Live or Die Here

Live or Die Here (`~/Projects/live-or-die-here`) has a page for every state, DC and the territories. Each state page could later link to this layer's view of the same jurisdiction, a distribution and search channel for the index. Nothing in LODH changes now. LODH is co-owned with John Kheit and kept at arm's length from SuperTruth and DataSpine work, so any link is JAS's and John's decision, made when the state view is live.

## 15. Files in this commit

`PLAN.md`, `RUBRIC_STATES.md`, `plan_stamp.txt`, `scripts/size_sim.py` and `size_sim.txt`, `scripts/cost_estimate.py` and `cost_estimate.json`. No research has run; no file exists under `data/us-states/`.
