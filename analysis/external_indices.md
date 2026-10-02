# External cross-check: published indices that overlap Who Holds the Record

**Purpose:** see whether our country orderings broadly agree with published, citable indices that measure related things. **This is a sanity check, not validation.** None of these indices measures what ours measures, which is patient rights in law and in practice. Most measure infrastructure maturity as reported by governments. Agreement would not prove our scores right, and disagreement does not prove them wrong. Disagreement does tell us where to look.

Computed 1 Oct 2026 by `analysis/external_corr.py` (ds-lab, scipy). External values were transcribed from the opened documents named below. GDHM was pulled live from WHO's public API and saved to `analysis/external/who_gdhm_relay_2026-10-01.csv`. Our scores are from `data/*.json` as imported 1 Oct 2026.

## Definitions and method

- **Statistic:** Spearman rank correlation (rho), with Kendall's tau as a tie-robust check, and a 95% bootstrap interval (4,000 resamples of countries, seed 20261001). n is the number of countries in both sources.
- **Matching:** each external measure is paired with the one category of ours it is closest to. The pairing is my judgement and is stated for every row.
- **Multiple comparisons:** 15 correlations are reported. No p-value here should drive a decision; read the intervals. With n between 11 and 18, an interval running from about -0.3 to +0.8 is normal and means "cannot tell".
- **Period mismatch:** ours describe October 2026. The externals describe 2018 to 2024. Countries moved in between (Ireland's patient app, Germany's ePA rollout in 2025).
- **Leakage:** our own data cites the EC eHealth indicator in the Belgium, Spain and Ireland access summaries, and DLA Piper's ratings site 14 times. A correlation with a source we used is partly circular, so the EC rows are also shown without those three countries, and DLA Piper is not used as a check.

## Indices found and opened

| Index | Publisher | What it measures | Data year | Coverage (ours in it) | License | URL |
|---|---|---|---|---|---|---|
| Digital Decade eHealth indicator, 2025 study | European Commission (DG CNECT), by Capgemini Invent | Composite 0-100% of citizens' online access to their electronic health records: 12 sub-indicators covering the access service, data types, provider coverage and access technology. Government self-report. | Data to 31 Dec 2024; published May 2025 | EU27 + Norway + Iceland (14 of ours) | CC BY 4.0 (stated in the report) | https://digital-strategy.ec.europa.eu/en/library/digital-decade-2025-ehealth-indicator-study (report doi 10.2759/2737039; country table Appendix A p.72) |
| OECD Health Working Paper 160: Progress on implementing and using EHR systems | OECD | (a) Technical and operational readiness of EHRs, 0-9; (b) EHR governance enabling data analytics, -1 to 3. Government survey responses. | 2021 survey; published Sep 2023 | 27 countries (18 of ours) | Copyright OECD 2023. Excerpts may be reused with acknowledgement; commercial use needs permission (rights@oecd.org). | https://doi.org/10.1787/4f4ce846-en (Tables D.1 and D.12) |
| Global Digital Health Monitor (GDHM) | HealthEnabled; now hosted by WHO | Digital-health maturity phase 1-5 on 23 indicators in 7 components (governance, strategy, legislation, workforce, standards, infrastructure, services). Government self-report. | 2019 and 2023 (a "2024" slice exists but is a copy of 2019, see below) | About 180 geographies in the WHO table; 41 of ours have some 2023 value, but only 17 have a full 2023 response | CC BY 4.0 (stated on the WHO data page) | https://data.who.int/dashboards/gdhm/data ; API https://xmart-api-public.who.int/DATA_/RELAY_GDHM |
| #SmartHealthSystems Digital Health Index | Bertelsmann Stiftung | Digital health index 0-100: policy activity, digital health readiness, actual use of data | Research 2018; published Nov 2018 | 17 countries (16 of ours) | No license stated in the summary PDF; treat as all rights reserved, cite only | https://www.bertelsmann-stiftung.de/fileadmin/files/Projekte/Der_digitale_Patient/VV_SHS_Europe_eng.pdf |
| Global Index on Responsible AI (GIRAI), 2nd edition | Global Center on AI Governance | Responsible-AI commitments and action in 5 dimensions, 38 indicators. **No health pillar.** | 2026 report | 135 countries | CC BY 4.0 (stated on site); the data download sits behind a form | https://www.global-index.ai/ |
| Digital health in the WHO European Region (2022 survey) | WHO Regional Office for Europe | 74 categorical (yes/no-type) indicators on digital-health governance, EHRs, telehealth, analytics | 2022 | 53 European Region states (about 18 of ours) | WHO data-sharing licence linked on the gateway page (not reviewed in detail) | https://gateway.euro.who.int/en/indicators/dh_30-electronic-prescription-of-medications/ ; report https://cdn.who.int/media/docs/librariesprovider2/data-and-evidence/english-ddh-260823_7amcet.pdf |

Considered and not used for correlation:
- **GIRAI:** general AI governance, not clinical AI. A correlation with our AI category would compare different things, and the data is gated.
- **WHO Europe 2022:** answers are categorical and close to ceiling for our European countries, so a rank correlation would mostly measure ties. Still useful as a citable fact source per country.
- **DLA Piper Data Protection Laws of the World heat map:** a law firm's proprietary rating, already cited 14 times in our data (circular).
- **CMS GDPR Enforcement Tracker:** a law-firm database of fines, not an index (see the DataSpine recommendation).

## Results

| External measure | Our category | n | rho | 95% bootstrap | Countries |
|---|---|---|---|---|---|
| EC eHealth composite (2024 data) | access | 14 | +0.24 | -0.34 to +0.76 | AUT BEL DEU DNK ESP EST FIN FRA IRL ITA NLD NOR POL SWE |
| same, without BEL ESP IRL (we cite it for them) | access | 11 | +0.16 | -0.51 to +0.75 | |
| same, without IRL only | access | 13 | +0.05 | -0.55 to +0.62 | |
| OECD technical/operational readiness (2021) | journey | 18 | +0.45 | -0.09 to +0.82 | AUS BEL CAN CHE DEU DNK EST FIN IRL ISR ITA JPN KOR MEX NLD NOR SWE USA |
| same | clinical | 18 | +0.35 | -0.21 to +0.77 | |
| same | overall | 18 | +0.46 | -0.03 to +0.82 | |
| OECD EHR governance for analytics (2021) | research | 18 | +0.24 | -0.34 to +0.72 | weak construct match: it measures research usability, not patient choice |
| Bertelsmann composite (2018) | overall | 16 | +0.32 | -0.30 to +0.80 | AUS AUT BEL CAN CHE DEU DNK ESP EST FRA GBR ISR ITA NLD POL SWE |
| Bertelsmann "actual use of data" (2018) | journey | 16 | +0.23 | -0.52 to +0.75 | |
| same | access | 16 | +0.45 | -0.18 to +0.84 | |
| GDHM Q08 privacy, consent and access laws (2023), full responders | privacy | 17 | +0.22 | -0.26 to +0.63 | ARE ARG BRA CHL EGY GHA IDN JPN KEN NGA NZL PHL RWA SAU THA VNM ZAF |
| same, every country with a value | privacy | 41 | +0.35 | +0.04 to +0.61 | 22 of these have only the two legal items filled, and AUT and IRL are partial (see caveat) |
| GDHM Q15 national architecture / HIE (2023), full responders | journey | 17 | +0.54 | -0.01 to +0.94 | |
| GDHM Q09a AI protocol (2023), full responders | ai | 17 | +0.49 | -0.09 to +0.88 | |
| GDHM overall phase (2023), full responders | overall | 17 | +0.65 | +0.22 to +0.89 | |

## What the numbers say

1. **Every correlation is positive and most are weak to moderate.** The only intervals that clear zero are GDHM overall (rho 0.65, n 17, mostly middle- and lower-income countries) and GDHM privacy across all 41 (rho 0.35, partly desk-filled data). That fits a picture in which our index tracks digital maturity broadly but measures something different, which is the intent.
2. **The EC access indicator barely tracks our access category** (rho 0.24, n 14; 0.05 without Ireland). Both put Ireland last. Beyond that they disagree: the EC puts Norway at 91% (5th of 14) where we give 62 (tied 11th of 14), Germany at 87% where we give 60, and Belgium and Estonia at 100% where we give 70 and 82. Part of this is design: the EC counts which data types are technically available, while ours weighs the whole record, usage and legal rights. Part is ceiling (eight of the 14 score 87% or more). Still, Norway and Germany are worth a second look from Dustin under finding 2 of the consistency audit.
3. **OECD readiness and our journey score agree moderately** (rho 0.45, n 18) despite the five-year gap. The largest disagreements are Germany (OECD 2.5 of 9 in 2021, before the 2025 ePA rollout; ours 68) and Japan (OECD 7.5; ours 45). The Germany gap is plausibly real change since 2021.
4. **Bertelsmann (2018) is too old to say much.** It is included because it is the best-known cross-country digital-health index in Europe and readers may cite it.

## Caveats found in the external data (adversarial read)

- **GDHM's 2024 slice is a copy of 2019.** All 1,717 rows tagged 2024 are identical, row for row, to the 2019 rows (checked by sorted comparison). They are not used here and should not be cited as 2024 data.
- **GDHM 2023 is two datasets in one.** 17 of our countries have a full response. For 22 others (mostly high-income, plus China, India and Mexico), only Q07 and Q08 (the two legal items) are filled, and the published "overall" phase for them is computed from those two items alone. That is why the USA, Germany and France show "Phase 5 overall". Do not cite GDHM overall phases for those countries.
- **GDHM codes "Not Available" as 0** in the numeric field (2,801 rows). Anyone averaging the numeric column would turn missing answers into Phase 0. Here they were excluded by label.
- **The EC score is self-reported** by member states through a questionnaire and audited only by the contractor. The study itself warns the Commission "does not guarantee the accuracy of the data".
- **The OECD survey is self-reported** too, and "nr" (no response) counts as 0 in its totals (for example Ireland and Switzerland), which depresses those countries' totals.

## Ruling

Use these indices in the whitepaper as context, with years on the surface: "for comparison, the EC's 2024 indicator ranks ...". Do not describe them as validating the index. The useful output is the list of disagreements (Norway and Germany access; Germany and Japan journey), which feeds Dustin's v1.1 review.

---
Provenance: EC values from the 2025 study Appendix A, page 72, read from the PDF (data to 31 Dec 2024; 29 countries, 14 overlapping). OECD values from WP160 Tables D.1 and D.12 (2021 survey; 27 countries, 18 overlapping). Bertelsmann values from Figure 2 of the 2018 summary (composite = mean of the three sub-indices as printed, rounded to one decimal; 16 overlapping). GDHM from the WHO xmart API table RELAY_GDHM, pulled 1 Oct 2026 (10,299 rows; 2023 slice; 17 full responders overlapping). All URLs opened 1 Oct 2026. Discovery used the agent harness's web search and direct HTTP requests, not the house SerpAPI or NewsAPI services; every figure was then read from the publisher's own document or API.
