# Strain and split: method

A context layer for Who Holds the Record. **It changes no score.** It sits beside the eight rated categories and asks a different question: is the public health system short of staff and slow, are people paying privately for care, and when they do, does their record follow them?

The hypothesis, using Canada as a worked example: a national system short of doctors, nurses and specialists for the demand produces long waits. People turn to private care. Public and private providers run different record systems, so the person's record breaks apart. This layer measures each link in that chain from public data, country by country, and says where the data is silent.

Built 1 Oct 2026 by `analysis/strain/build_strain.py`. Output: `analysis/strain/strain.json`. Verifier: `analysis/strain/test_strain.py` (75 checks: 39 planted errors, 8 research-merge cases, 6 wait-note checks, the clean file, one legal edge case that must pass, 2 parser checks, 12 coverage floors, 6 frozen spot values; all passing).

## 1. Definitions

Every value carries its own year, source name, URL and retrieval date in `strain.json`. "Latest year" means the latest year the source publishes for that country, so years differ between countries. Read the year before comparing two countries.

| Indicator | Definition | Source (all opened and downloaded 1 Oct 2026) | Year rule |
|---|---|---|---|
| `doctorsPer10k` | Medical doctors per 10,000 people | WHO Global Health Observatory, HWF_0001 (National Health Workforce Accounts, December 2025 update). https://ghoapi.azureedge.net/api/HWF_0001 | Latest year per country |
| `nursesMidwivesPer10k` | Nursing and midwifery personnel per 10,000 | WHO GHO, HWF_0006. https://ghoapi.azureedge.net/api/HWF_0006 | Latest year per country |
| `vhiShareCHE` | Voluntary health insurance schemes (SHA 2011 code HF.2.1) as % of current health expenditure | WHO Global Health Expenditure Database, variable `hf21_che`. https://apps.who.int/nha/database/Home/IndicatorsDownload/en (release dated 12 Dec 2025) | Latest **final** year. The GHED release says 2024 is preliminary, so 2023 is the ceiling. The build reads that sentence from the file and refuses to run if it disappears. |
| `oopShareCHE` | Household out-of-pocket payments (HF.3) as % of current health expenditure | GHED `hf3_che` | Same |
| `vhiPlusOopShareCHE` | VHI share plus OOP share, both from the **same** year. The parts and their years are stored with the sum. | GHED | Latest final year in which both exist. This can be earlier than the year on the separate VHI or OOP value when one series is published first. |
| `privateDomesticShareCHE` | Domestic private health expenditure as % of CHE | GHED `pvtd_che` | Same. Context only, see note below |
| `compulsoryPrivateInsuranceShareCHE` | Compulsory private insurance (HF.1.2.2) as % of CHE | GHED `hf122_che` | Same. Context only, see section 6 |
| `vhiPopulationPct` | Share of the population with any voluntary health insurance | OECD Health Statistics, Healthcare coverage (`DSD_HEALTH_PROT@DF_HEALTH_PROT`), "Total voluntary health insurance", unit "Percentage of population" only | Latest year |
| `duplicateVhiPopulationPct` | Share with **duplicate** VHI: private cover for care the public system already covers, usually bought for faster access or choice | Same flow, "Duplicate voluntary health insurance" | Latest year |
| `supplementaryVhiPopulationPct` | Share with **supplementary** VHI: cover for services the public system leaves out (often drugs, dental, vision) | Same flow | Latest year |
| `waitMedianDays_hip`, `_knee`, `_cataract` | Median days from specialist assessment to treatment | OECD Health Statistics, Waiting times (`DSD_HEALTH_PROC@DF_WAITING`) | Latest year |
| `waitPctOver3Months_*` | Share of patients waiting more than 3 months, same interval | Same | Latest year |
| `specialistWaitOver4Weeks` | Share waiting more than 4 weeks to see a specialist | **Not published** by WHO, OECD Health Statistics or WDI. It comes from the Commonwealth Fund survey. Left unknown for all 64. | none |

Notes on definitions:

- **The private-spending share, `privateDomesticShareCHE`, does not contain the VHI and OOP shares.** GHED classes it by who supplies the money (revenue source, FS codes). VHI and OOP are classed by financing scheme (HF codes). The two can disagree. In South Africa, VHI plus OOP is 52.0% while domestic private spending is 36.3% (both 2023), because public money subsidises the medical schemes. An early version of the verifier treated this as an error. It was wrong. The rule was removed, and the test now keeps South Africa as a standing case the verifier must pass.
- The OECD coverage flow mixes percentages with head counts in the same series (France "Total voluntary health insurance" 2023 appears as 39,990, which is thousands of persons). The build keeps percentage rows only. The test plants the head count and checks it is rejected.
- OECD observation status codes are kept with each value: D = definition differs, E = estimated, P = provisional, B = break in series. Canada's waits are flagged D. Canada's VHI coverage (2025) is P.
- The WHO workforce series does not say, country by country, whether a figure counts practising or licensed doctors. Some countries' counts are known to run high on that account. We do not adjust, and the uncertainty is not measured.
- A value more than 5 years older than the retrieval year is marked `stale: true` and kept. Stale values: Luxembourg doctors (2017), Vietnam nurses (2017), Estonia waits (2020), Denmark cataract waits (2018), Russia VHI coverage (2020), Czechia and India compulsory private insurance (2020, 2019).

## 2. Record split: does the public record reach private providers?

Taken only from each country's `data/<ISO3>.json`: the journeyNote and the category texts. The seven-node journey map has no private-provider node, so it cannot answer this on its own. Every class rests on one sentence or clause, quoted exactly. The build checks each quote word for word against the named field and stops if it is not there.

Rule, written before classifying:

- **connected**: the file says private providers feed the shared record, or a rule in force requires them to, and it names no gap.
- **partial**: the file names a gap, gives a future deadline, or says only some private providers connect, or that they see only a summary the patient shares.
- **split**: the file says public and private records are not linked, or that almost no private providers connect.
- **unknown**: the file says nothing about private providers, or says their connection was not verified. Silence is unknown, never "connected".
- Two things that look like private links but are not: an insurer or claims link (Japan, Korea, Saudi Arabia, Slovakia) and a private software vendor (Ukraine's medical information systems, New Zealand's patient portals). Neither is a private care provider.

Result: 4 split, 13 partial, 7 connected, 40 unknown.

| Country | Class | Field | Sentence it rests on |
|---|---|---|---|
| Mexico | split | journeyNote | "Each institution (IMSS, ISSSTE, IMSS-Bienestar, private) keeps its own record today." |
| Malta | split | journeyNote | "Private hospitals, private GPs and most private prescriptions are outside it." |
| Russia | split | categories.journey.detail[3] | "Only about 2% of private clinics sent data in 2025" |
| South Africa | split | journeyNote | "Public and private care run separate systems." |
| Argentina | partial | categories.journey.detail[0] | "creates a federal program to progressively set up a single electronic record system and an interoperability framework across public, private and social security sectors." |
| Austria | partial | categories.journey.summary | "Hospitals, pharmacies, labs and radiology now feed ELGA, and private doctors must connect from 2026." |
| Brazil | partial | categories.journey.summary | "Private sector integration and small hospitals still lag." |
| Chile | partial | journeyNote | "Public network tools exist; private links are uneven." |
| Costa Rica | partial | categories.journey.summary | "Private hospitals and clinics are not connected beyond the patient's share code." |
| Cyprus | partial | categories.clinical.summary | "The Commission found public and private hospitals supplying data to the national access service, but a full national record is not yet built." |
| Croatia | partial | journeyNote | "private clinics join only in 2027." |
| Iceland | partial | categories.journey.summary | "Some private providers still keep non-digital records until a December 2026 deadline." |
| Italy | partial | categories.journey.detail[2] | "Emilia-Romagna now shows reports from out-of-region care and is adding private provider documents" |
| Portugal | partial | categories.clinical.summary | "Data held only by private providers is often missing." |
| Singapore | partial | categories.clinical.detail[2] | "Coverage gaps remain until mandatory contribution starts in early 2027, mainly in private primary care." |
| Sweden | partial | categories.access.detail[0] | "All Swedish regions take part, along with some municipalities and private providers." |
| Thailand | partial | categories.journey.detail[0] | "passed 400 public and private facilities by August 2024." |
| Bulgaria | connected | categories.journey.summary | "Every provider, public or private, must send a signed electronic record of each activity to the national system." |
| Finland | connected | journeyNote | "Kanta joins public and private providers, pharmacies and prescriptions nationally, with consent governing cross-provider views." |
| France | connected | categories.journey.summary | "About 150,000 private practitioners and 3,800 institutions feed the shared record" |
| Greece | connected | categories.journey.summary | "National e-prescription and e-referral, run by IDIKA since 2010, feed one record for public and private care." |
| Hungary | connected | journeyNote | "EESZT has linked GPs, hospitals, outpatient clinics and all pharmacies since 2017, with private providers since 2020." |
| Poland | connected | categories.journey.detail[0] | "Every doctor, dentist and hospital must report medical events to the national system, whether care is public or private." |
| Turkey | connected | journeyNote | "SGK will not pay for services missing from e-Nabız, so public and private providers feed one ministry record" |
| Canada | unknown | journeyNote | "only 35% of physicians share data outside their practice". The file shows the record breaking across provinces and practices. It does not say anything about public versus private providers. |
| Ghana | unknown | categories.clinical.summary | "private facilities were not shown to be connected". Not shown is not the same as not connected. |
| India | unknown | categories.journey.detail[1] | "450+ public and private solutions integrated." These are software integrations, not private care providers. Classed partial in the first build and corrected on review. |
| Rwanda | unknown | categories.clinical.detail[1] | "We did not verify whether private clinics or pharmacies are connected" |

Unknown with nothing on private providers in the file: United Arab Emirates, Australia, Belgium, Switzerland, China, Colombia, Czechia, Germany, Denmark, Egypt, Spain, Estonia, United Kingdom, Indonesia, Ireland, Israel, Japan, Kenya, South Korea, Liechtenstein, Lithuania, Luxembourg, Latvia, Nigeria, Netherlands, Norway, New Zealand, Philippines, Romania, Saudi Arabia, Slovakia, Slovenia, Taiwan, Ukraine, United States, Vietnam. Several of these have large private sectors. Filling this gap means new research, not inference here.

**Merging outside research.** When `analysis/strain/record_split_research.json` exists, the build merges it. Its shape must be an object keyed by ISO3 (or the same under `countries`). Each entry needs a `class` (one of the four), and a `quote` and an http(s) `url` unless the class is unknown. Otherwise the build stops. Rules:
- If the country file is unknown and the research gives a class, the research class is used: `basis: "research"`, with the research quote and URL. The file's own note and quote are kept as `fileField` and `fileQuote`.
- If both give the same class, `basis: "both"`.
- If they disagree, the country-file class stays, both quotes are kept and `conflict: true` is set. An editor resolves it. The flag follows the country-file class until then, so a disagreement never moves a flag silently.
- A research answer of unknown changes nothing.
- The country-file quotes are checked word for word against `data/`. Research quotes can only be checked against their URL, which is a review step, not an automated check.

No research file existed when this was written (1 Oct 2026), so the classes and counts above come from the country files alone.

**Leakage note.** These classes come from the same files that produce the journey score. Do not correlate the record-split class with the journey or clinical score and present the result as evidence. They share a source, so they would agree by construction.

## 3. Flags, and why there is no composite score

There is no weighted composite. The four links in the chain are measured in different units and cover different countries: waits exist for 18 of 64. Any weighting would be a choice we cannot defend from the data, and it would quietly treat a missing value as zero or as average. Instead each country gets four flags. Each flag is true, false or unknown (null).

| Flag | True when | False when | Unknown when |
|---|---|---|---|
| `workforceLow` | doctors **or** nurses per 10,000 is below the lower quartile of the countries with a value (doctors: 26.56, n = 62; nurses and midwives: 41.59, n = 62) | both measured and at or above their cut-offs | neither is below and at least one is missing |
| `privateSpendHigh` | VHI + OOP share (same year) is above the upper quartile (37.67%, n = 60) | measured and at or below it | VHI or OOP missing for a common year |
| `longWaits` | the longer of the hip and knee median waits (specialist assessment to treatment) is over 90 days. 90 days matches OECD's own 3-month line. | at least one is reported and neither is over 90 | neither reported |
| `recordSplit` | class is **split** | class is connected or partial | class is unknown |

Quartiles use numpy's default linear interpolation over the 64 countries that have a value. The verifier recomputes them, so a cut-off cannot be moved by hand.

The **reading** is one sentence built from the flags. It names the flags that are true and the links not measured, and adds that the record reaches only some private providers when the class is partial. Nothing else goes into it.

**Counting.** "3+ flags" counts only flags that are true. A country with three unknowns has not been shown to be under no strain. It has not been measured. Every country's `flagCount` gives true, false and unknown side by side. Read all three.

`flags` also carries `doctorsLow` and `nursesLow`, the two parts of `workforceLow`. Each is true below its cut-off, false at or above it, and null when the value is missing. They let the page mark the exact cell. They are never counted: `flagCount` and the reading use only the four flags above.

## 4. Coverage (countries with a value, of 64)

| Indicator | Have | Missing |
|---|---|---|
| Doctors per 10,000 | 62 | Liechtenstein, Taiwan |
| Nurses and midwives per 10,000 | 62 | Liechtenstein, Taiwan |
| VHI share of CHE | 60 | Iceland, Norway, Slovakia, Taiwan |
| OOP share of CHE | 63 | Taiwan |
| VHI + OOP, same year | 60 | Iceland, Norway, Slovakia, Taiwan |
| Domestic private share of CHE | 63 | Taiwan |
| Compulsory private insurance share of CHE (context) | 60 | Israel, New Zealand, Singapore, Taiwan |
| Population with any VHI (OECD) | 36 | 28 |
| Population with duplicate VHI (OECD) | 18 | 46, Canada included |
| Population with supplementary VHI (OECD) | 14 | 50 |
| Median wait, hip / knee / cataract (OECD) | 18 each | 46 |
| Specialist wait over 4 weeks | 0 | all 64 (no source among those allowed) |
| Record split class known | 24 | 40 |

WHO, GHED, OECD and the World Bank do not publish Taiwan, so Taiwan is unknown on every indicator. Liechtenstein has spending data but no WHO workforce figure. Six countries report a waiting-time measure to OECD that is not the median from specialist assessment to treatment. Colombia and Lithuania report only the mean. Croatia, Ireland, Iceland and Slovenia report only time on the list. They are left unknown rather than mixed in, and each missing wait's `note` in strain.json says so. Colombia has no knee figure of any kind, so its knee note reads "not reported to OECD". The other 40 countries report nothing to this OECD flow.

Flag coverage: workforceLow 62 measured (21 true); privateSpendHigh 60 measured (15 true); longWaits 18 measured (14 true); recordSplit 24 known (4 true).

## 5. Results

**Countries with 3 or more true flags: Mexico and South Africa.** Each has 3 true flags and 1 unknown, and the unknown is waits in both.

- Mexico: doctors 27.52 per 10,000 (2023), above the cut-off, but nurses and midwives 30.48 (2023), below it. VHI 7.86% + OOP 41.24% = 49.09% of CHE (2023). Record split: "Each institution (IMSS, ISSSTE, IMSS-Bienestar, private) keeps its own record today."
- South Africa: doctors 7.66 per 10,000 (2024). VHI 45.32% + OOP 6.69% = 52.02% (2023). Here the private share is private insurance, not out-of-pocket. That is the closest match among the 64 to the mechanism in the hypothesis. Record split: "Public and private care run separate systems."

**Sensitivity.** Neither result rests on a hair. Twelve values sit within one unit of a cut-off; they are listed in `meta.sensitivity`. The United States (26.54 doctors against 26.56) and Japan (26.49) are flagged workforce-low by less than 0.1. Greece is flagged on nurses (41.28 against 41.59). If **partial** counted as split, the 3+ list would grow to five: Brazil, Chile and Costa Rica join Mexico and South Africa. That alternative is reported, not adopted.

## 6. Canada against the hypothesis

The hypothesis breaks into four claims. Each is checked below against named figures.

1. **Too few doctors and nurses.** Partly supported among rich countries, not among the 64. Canada has 28.54 doctors per 10,000 (WHO, 2024). That is above the 64-country cut-off of 26.56, but it ranks 31st of the 38 OECD members (8th lowest). Nurses and midwives: 116.18 per 10,000 (2024), 14th of 38. So the doctor count is low for a rich country. The nurse count is not. Specialists are not measured separately here.
2. **Long waits.** Supported. Median 120 days for hip replacement and 146 for knee, from specialist assessment to treatment (OECD, 2025, status D: definition differs). 58% and 63% waited more than 3 months. Both are over the 90-day line. Among the 18 OECD members that report, Canada ranks 9th longest for hip and 12th for knee. Only countries with waiting-list problems tend to report, so "middle of the pack" here still means slow.
3. **Pushed into private care.** Partly supported, and the kind of private cover matters. Voluntary insurance pays 12.66% of Canada's health spending (GHED, 2023), the 2nd highest share among 35 OECD members with a value. 67% of Canadians hold voluntary insurance (OECD, 2025, provisional), and OECD records all of it as supplementary: cover for things the public plan leaves out, such as drugs and dental care. OECD has no figure for duplicate insurance in Canada, the kind that buys a faster route to care the public plan already covers. That number is unknown, not zero. Out-of-pocket is 15.2% (2023), 21st of 38. VHI plus OOP is 27.87%, below the 64-country cut-off of 37.67%. The data shows a large private layer beside the public plan. It does not show waits driving people into a parallel private system for the same care. The public data cannot test that step.
4. **The record splits between public and private EHRs.** Not supported by our file, and not contradicted. The Canada file documents fragmentation across provinces and practices: "only 35% of physicians share data outside their practice". It says nothing about public versus private providers. The record-split flag is unknown.

**Verdict:** the data supports a strained Canada: a low doctor count for a rich country, long surgical waits, and a record that does not travel. It does not yet support the specific mechanism, private care splitting the record from the public one. That link is unmeasured in two places: duplicate private insurance (not reported to OECD) and private-provider connection (not in our file). Canada's reading is "1 of 4 flags" against a 64-country comparison set, and that set includes much poorer countries. Do not quote it without the OECD ranks above.

To close the gap: research for the Canada file on whether private clinics (for example private surgical, imaging and virtual-care clinics) write to provincial records, with a source opened. A citable figure for privately paid surgery or imaging in Canada would also help. Both are open questions, owner to be named by the editor.

## 7. Misread risks, ranked

1. **The 64-country quartiles mostly measure income.** The bottom quarter on doctors is set by Rwanda, Kenya, Ghana, Nigeria and others. The top quarter on VHI + OOP is set mostly by out-of-pocket cash in low-income systems (Nigeria 71.9%, India 43.9%). That is not people leaving a public queue for private care. A rich country with real strain, like Canada, may carry few flags. Show OECD ranks beside the flags for OECD members (`oecdPeerRank` in the JSON).
2. **VHI is a narrow category.** GHED counts compulsory private insurance separately (HF.1.2.2), so the United States shows VHI at 0.75% of CHE (2023) while compulsory private insurance is 31.6%. The Netherlands (50.5%) and Switzerland (41.6%) look the same way. They are not flagged on private spending, and the flag does not mean their systems are public. `compulsoryPrivateInsuranceShareCHE` is in the JSON for that reason.
3. **Waits exist only where countries chose to report them**, mostly countries with waiting lists. Countries without a figure are unknown, not short-wait.
4. **Unknown is not no.** 40 countries have an unknown record-split class, including Australia, Ireland, the UK and the US.
5. Years differ by country (2017 to 2025). Check the year on every value.

## 8. The verifier and how it was attacked

`validate()` runs at the end of every build and stops the build on any failure. `test_strain.py` plants 39 bad values in a copy of the output and checks that each one is caught. It also runs the clean file, frozen spot values and coverage floors. Plants include:

- a quote altered by one word, a quote pointed at the wrong field, and a class with no quote
- a preliminary GHED year, a share over 100, a head count passed off as a percentage, a negative share, and doctors per 100,000 passed off as per 10,000
- VHI and OOP from different years summed, a sum that does not equal its parts, and a part that disagrees with its own indicator in the same year
- a value with no source or year, a year on a missing value, and a year after the retrieval date
- an unpublished indicator filled in, with and without a made-up source
- unknowns counted as flags, unknown read as false, and partial counted as split
- flags flipped both with and without fixing the counts (so each check is proven on its own), and a quartile cut-off moved by hand
- a country dropped, a stray country code added, and an invalid class
- `doctorsLow` or `nursesLow` flipped, a missing value read as false, the parts counted as flags, and a stray flag key
- a research-based class without a URL, a research disagreement not marked as a conflict, and an agreement marked as one

The merge itself is tested on synthetic research files. It must apply the three rules and refuse a class without a URL, an invented class, an unknown country code and a file that is not keyed by ISO3. The wait notes for the six countries above must name what each one reports.

Wrongly-fails cases: the clean file must pass, including South Africa, which an earlier wrong rule failed (section 1). A VHI + OOP sum built in an earlier common year than the separate VHI and OOP values must also pass. That happens when one series is published before the other, and an earlier version of the check would have failed it. The GHED year parser must refuse a version note that no longer names the preliminary year.

A parse cross-check compares GHED out-of-pocket shares with the World Bank's WDI series SH.XPD.OOPC.CH.ZS for the same country and year: 63 pairs, none apart by more than 1 point. WDI republishes GHED, so this checks our parsing, not the data.

## 9. Decision rules

| Rule | Why | Check |
|---|---|---|
| This layer never feeds a score. `build.js` may read strain.json to display it. | Owner's brief. It is context, measured differently. | This build writes nothing in `data/`, `template.html`, `build.js` or `server.mjs`, and only reads `data/`. On the page side, `build.js` hard-fails if any score changes after strain.json loads (docs/TUFTE_SPEC.md section 5.6). |
| A value carries a year, source and URL, or it is null. | Provenance coverage | validate(), plants 12 to 14 |
| Unknown stays unknown: not zero, not false, not counted. | The house rule that silence is not a measurement | validate(), plants on unknown read as false and nulls counted |
| GHED preliminary years are never used. | The release says 2024 is preliminary | `last_final_ghed_year()`, plant 4 |
| A record-split class needs a verbatim quote. | Gate 2: no invented facts | validate(), plants 1 to 3 |
| Coverage floors only ratchet up. | Gate 16 | `coverage_baseline.json`, test 23 |
| Before any public page shows these flags, the page must show unknown as unknown and carry the OECD ranks for OECD members. | Misread risk 1 | No automated check. Editorial review, and the tufte agent for the section's design. |

## 10. Services and reproduction

SERVICES.md names DataSpine (US geographies), openFDA, PubMed, ClinicalTrials.gov and Census for the data-science seat. None publishes cross-country workforce, spending or waiting-time statistics. This layer uses open public data from WHO (GHO, GHED), OECD (SDMX API) and the World Bank (WDI, plus the OECD member list from the World Bank OED aggregate). None needs a key, and no vendor was added.

```
uv run --project ~/Projects/ds-lab python analysis/strain/build_strain.py            # rebuild from raw/
uv run --project ~/Projects/ds-lab python analysis/strain/build_strain.py --refresh  # re-download, then rebuild
uv run --project ~/Projects/ds-lab python analysis/strain/test_strain.py
```

`raw/` holds the extracts for our 64 countries (about 7.6 MB). The 39 MB GHED workbook is not kept. `raw/manifest.json` records each source's URL, retrieval date and SHA-256 of the full download. Rebaselines are logged in `coverage_baseline.json`. The only one so far: on 1 Oct 2026 the record-split floor went from 25 to 24 because India was reclassified from partial to unknown on review. That was a correction, not a loss of coverage. A refresh that changes any figure will break the frozen spot values in the test. That is deliberate: re-read the source, then update the spot values with a note here.
