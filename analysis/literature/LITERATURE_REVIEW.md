# Literature review: scholarly sources for rating more countries

**Purpose:** find peer-reviewed papers, reviews, multi-country surveys and datasets (2018 to 2026) that give country-level evidence on the eight categories of Who Holds the Record, for the roughly 150 countries the index does not yet rate. Also find prior art: any existing index or scoring of patient record rights that the paper should cite and position against.

**Bottom line.** Of the 151 UN member states outside the v1 index, **66 have at least one opened, peer-reviewed source with country-level facts** on at least one of our categories. That coverage is regional, not global: 37 are in Africa, 16 in Latin America and the Caribbean, 8 in Central and Eastern Europe, 3 in the Gulf (Bahrain, Iran, Oman), plus Türkiye and Mongolia. **No opened scholarly source gives country-level facts for any of the 151 on commercial protection; only 8 countries have one for clinical access and 7 for clinical AI.** Most category coverage rests on a single paper per country (Munung 2024 in Africa, Alegre 2024 in Latin America). Asia outside the Gulf, the Pacific, most of the Caribbean, Central Asia and the non-EU Balkans have essentially no scholarly country-level evidence in what we found. Adding the WHO Global Digital Health Monitor 2023 (a government self-report dataset, not a paper) raises "something citable" to 129 of 151; 22 countries have neither.

The scholarly literature can seed privacy and law-on-paper scores for Africa and Latin America. It cannot, on its own, support the access, control and journey judgements the rubric asks for ("the right exists in law AND works in practice"). Those will still need primary sources country by country, as in v1.

Compiled 1 October 2026. Every item cited below was opened (abstract at minimum; full text where marked), except Greenleaf 2023 and 2025, for which only title and metadata were retrievable (no abstract in Crossref, OpenAlex or Semantic Scholar; SSRN blocked); the 2021 Greenleaf Tables abstract was opened. Country lists were read from the paper's own tables or methods, not inferred.

## Definitions and method

- **Country-level source.** An opened paper (or its table) that states at least one fact specific to a named country and relevant to one of the eight categories. A paper that only mentions a country, or reports by region, does not count.
- **Denominator.** The 193 UN member states minus the 42 UN members in v1 (the 43 include Taiwan, which is not a UN member) = **151**. The v1 list is the 43 ISO3 codes in `data/` as briefed. **Note:** during this review, 19 more files appeared in `data/` (see caveat 7), so against the live folder at 11:01 EDT the denominator is 132. The coverage script prints both.
- **Search.** Europe PMC (covers PubMed, PMC and preprints) with field-restricted queries; OpenAlex title search and citation graph (`cites:`) for the two closest prior-art papers; Crossref for metadata and BibTeX; Unpaywall and Semantic Scholar for open-access copies and missing abstracts. Full texts were pulled as JATS XML from Europe PMC and parsed for tables. Queries and dates are in the provenance section.
- **Scoring of usefulness.** Ranked by how many uncovered countries an item adds, whether its country data can be extracted, and how close its measure is to our rubric.
- **Use codes.** (a) evidence for rating new countries; (b) cross-check of existing scores; (c) related-work citation.
- **What is not counted.** Search hit counts (shown as an indicative column only), papers whose country list I could not open (Greenleaf 2025, Kharko et al. 2024), attitude surveys (they measure what people think, not what the law or system does), and the GDHM dataset (reported as a separate layer).

Reproduce the counts: `python3 analysis/literature/coverage.py` (stdlib only). It writes `coverage_by_country.json`.

## Ranked sources for extending coverage

| # | Source | Countries (outside v1) | What it measures | Data year | Country table? | OA, licence | Use |
|---|---|---|---|---|---|---|---|
| 1 | Munung et al. 2024, *Health Res Policy Syst* 22:145. doi:10.1186/s12961-024-01230-7 | 37 African laws by country; **31 new**: Algeria, Angola, Benin, Botswana, Burkina Faso, Cabo Verde, Chad, Congo, Côte d'Ivoire, DR Congo, Equatorial Guinea, Eswatini, Gabon, Guinea, Lesotho, Madagascar, Malawi, Mali, Mauritania, Mauritius, Morocco, Niger, Senegal, Seychelles, São Tomé and Príncipe, Tanzania, The Gambia, Tunisia, Uganda, Zambia, Zimbabwe | Data protection laws: health and genetic data as sensitive data, research provisions, data-subject rights (access, rectification, erasure, portability), cross-border transfer grounds | Laws in force at analysis (paper does not date the cut-off) | Yes. Table 1 lists each law by country; Table 3 gives country research provisions with article numbers; Table 5 lists countries per data-subject right | Full text, CC BY-NC-ND | (a) privacy, control, research; access as a legal right to one's personal data only (not the clinical record in practice) |
| 2 | Alegre et al. 2024, *Rev Panam Salud Publica* 48:e40. doi:10.26633/rpsp.2024.40 | 20 Latin American UN members; **16 new**: Bolivia, Colombia, Costa Rica, Cuba, Dominican Republic, Ecuador, El Salvador, Guatemala, Haiti, Honduras, Nicaragua, Panama, Paraguay, Peru, Uruguay, Venezuela | Whether an electronic medical record (EMR) law and a telehealth law exist, and their year; how confidentiality and professional secrecy are written into each | Regulations in force March to September 2022, from official sources | Yes. Table 1: year of EMR and telehealth law per country (16 have an EMR law); Table 2: confidentiality and secrecy instruments per country | Full text (Spanish), CC BY-NC-ND | (a) journey (EMR law), privacy; not evidence on patient access; (b) Argentina, Brazil, Chile, Mexico |
| 3 | Greenleaf 2025, *Global Data Privacy Laws 2025: 172 Countries, Twelve New in 2023/24*. SSRN working paper, doi:10.2139/ssrn.5275559 (with the 2023 edition, doi:10.2139/ssrn.4426146, and the 2021 Global Tables, doi:10.2139/ssrn.3836261) | 172 countries with a data privacy law (title) | Which countries have a general data privacy law, and since when | Laws to 2024 (title) | Yes, per the 2021 Tables abstract (a Global Table of countries with laws and of official bills). **Country list not opened**: SSRN blocked automated access on 1 Oct 2026 | SSRN, no licence stated; not peer reviewed | (a) privacy floor for nearly every missing country, once the table is downloaded by hand; (c) |
| 4 | Staunton et al. 2025, *J Law Biosci* 12:lsaf002. doi:10.1093/jlb/lsaf002 | 12 African; **7 new**: Botswana, Cameroon, Malawi, Tanzania, The Gambia, Uganda, Zimbabwe | Data protection and research ethics requirements for cross-border sharing of health and genomic data; whether a data protection law exists (Cameroon and The Gambia had none at study time; Cameroon's Law No. 2024/017 is now in force, per the paper) | Pre-2024 analysis, updated note for Cameroon | Yes. Country guides | Full text, CC BY | (a) privacy, research |
| 5 | Townsend et al. 2023, *Front Pharmacol* 14:1214422. doi:10.3389/fphar.2023.1214422 | Same 12 African; 7 new | Regulation of AI in healthcare, plus data protection, digital health, consumer protection and IP law that bear on it. Finds no AI-specific law in any of the 12 | 2023 | Yes, by country in the text | Full text, CC BY | (a) **the only by-country clinical-AI source we found for countries outside v1**; (b) Ghana, Kenya, Nigeria, Rwanda, South Africa |
| 6 | Kharko et al. 2024, *Stud Health Technol Inform* 310:114-118 (MEDINFO 2023). doi:10.3233/shti230938 | 29 countries (list not opened) | Expert survey on whether patients have online record access (ORA) and which record parts: 23 of 29 have ORA, 6 paper-only; clinical notes available in 12 | 2023 | Unknown. Abstract opened; IOS Press PDF not retrievable by script | Hybrid OA, CC BY-NC | (a) access, if the country list includes missing countries; **closest prior art on access worldwide** (see below). Ask the authors for the country table |
| 7 | Ahmed et al. 2026, *J Healthc Leadersh* 18:1-19. doi:10.2147/jhl.s618447 | 32 of 47 WHO African Region states | Re-analysis of GDHM maturity phases (7 domains) for the 2023, 2024 and 2025 cycles | 2023 to 2025, extracted April 2026 | In supplements S2 and S3 (not opened) | Full text, CC BY-NC | (a) journey and governance context; (c). **Caveat:** our own audit found the GDHM rows labelled 2024 in WHO's API are a copy of 2019 (`analysis/external_indices.md`). This paper's 17 reassessed countries lean on the 2024 cycle; check which source it used before citing its change figures |
| 8 | Mamuye et al. 2022, *PLOS Digit Health* 1:e0000118. doi:10.1371/journal.pdig.0000118 | 13 African in its document table; **9 new**: Cameroon, Eswatini, Ethiopia, Liberia, Malawi, Sierra Leone, Tanzania, Uganda, Zambia | Systematic review of health information exchange (HIE) policy and interoperability standards (21 strategy documents, 11 papers) | Literature to about 2021 | Partly. Country appears per document in tables | Full text, CC BY | (a) journey. List read from the table column 'Title, Country' |
| 9 | Sylla et al. 2025, *npj Digit Med* 8:748. doi:10.1038/s41746-025-02121-z; and Holly et al. 2022, *Front Digit Health* 4:817810. doi:10.3389/fdgth.2022.817810 | Sylla: 11 strategies, 10 new (Botswana, Burundi, Cameroon, DR Congo, Ethiopia, Guinea, Malawi, Namibia, Tunisia, Zambia). Holly: 10 countries, 9 new (Cameroon, DR Congo, Ethiopia, Liberia, Malawi, Mali, Niger, Tanzania, Uganda) | Content of national digital health strategies against WHO and ITU guidance (Sylla finds recurring gaps on legal frameworks and interoperability; 7% of 148 planned interventions target clients). Holly: whether strategies address children and youth | Sylla: recent plans listed in GDHM; Holly: 2021 | Yes, per country | Sylla CC BY-NC-ND; Holly CC BY | (a) journey (plans, not practice); (c) |
| 10 | Tornero Costa et al. 2025, *Int J Med Inform* 194:105687. doi:10.1016/j.ijmedinf.2024.105687 | 53 WHO European Region states, reported by **subregion only** | WHO Europe 2022 survey: EHR systems, legal requirement to use national standards (29 states), privacy law (all 53), EHR legislation (all but five) | 2022 | No. The country-level answers sit in the WHO Europe gateway already noted in `analysis/external_indices.md` | Full text, CC BY-NC-ND | (c); points to the dataset for (a) on the Balkans, Caucasus and Central Asia |
| 11 | Moghaddasi et al. 2018, *Electron Physician* 10:6829. doi:10.19082/6829 | Persian Gulf: Bahrain, Iran, Oman new (plus UAE, Saudi Arabia) | Hospital information systems and national EHR status; Oman, Bahrain and UAE described as leading | 2018 | Yes, Table 1 | Full text, CC BY-NC-ND | (a) journey, clinical; dated |
| 12 | Birinci 2023, *Balkan Med J* 40:215. doi:10.4274/balkanmedj.galenos.2023.2023-2-77 | Türkiye | e-Nabız national personal health record: 30 services, 28,608 integrated facilities, adoption by 82% of the population (author is from the Ministry of Health) | 2023 | Single country | Full text, CC BY-NC-ND | (a) access, journey, clinical. Self-report by the system's owner; pair with an independent source |
| 13 | Mugauri et al. 2025, *Glob Health Action* 18:2492913. doi:10.1080/16549716.2025.2492913 | 8 in table; new: Burundi, Ethiopia, Gabon | Scoping review of 30 EHR implementation studies in sub-Saharan Africa, 2014 to 2024 | 2014 to 2024 | Yes, Table 1 by study | Full text, CC BY | (a) journey, clinical (facility-level, not national) |
| 14 | Ćwiklicki et al. 2020, *BMC Health Serv Res* 20:171. doi:10.1186/s12913-020-5034-9 | 10 CEE; new: Bulgaria, Croatia, Czechia, Hungary, Latvia, Lithuania, Romania, Slovenia | Conditions linked to national e-health use, using WHO Global Observatory for eHealth 2015 data | **2015** | Yes | Full text, CC BY | (a) journey, historical only. Several of these countries are now being added to `data/` |
| 15 | Dapkutė et al. 2026, *JMIR Form Res* 10:e91911. doi:10.2196/91911 | Lithuania | Centralised national digital health platform, nationwide since 2015: governance, architecture, interoperability, adoption | Documents 2000 to 2025 | Single country | Full text, CC BY | (a) journey, clinical |
| 16 | Joseph et al. 2021, *BMJ Open* 11:e046965. doi:10.1136/bmjopen-2020-046965 | 4 LMICs; new: Lesotho, Mongolia, Zambia | Systematic review of patient-held (paper) records: six studies; one found 41% of records complete | Studies to 2019 | Yes | Full text, CC BY-NC | (a) access in low-resource settings (patient holds a paper copy) |
| 17 | Nienaber McKay et al. 2024, *J Law Biosci* 11:lsad035. doi:10.1093/jlb/lsad035 | Ghana, Kenya, Nigeria, South Africa, Uganda (Uganda new) | Comparative law on health data sharing: data protection, consent, ownership, sharing agreements | 2023 | Yes, by country | Full text, CC BY | (a) Uganda; (b) four v1 countries |
| 18 | Del-Carpio-Toia et al. 2023, *Rev Cuerpo Med Hosp Nac Almanzor Aguinaga Asenjo* 16(2):e1886. No DOI; PMID 39192880 | Latin America, regional | Ethical and legal safeguards for health data; argues for harmonised law | 2023 | No | Abstract only (Europe PMC full text returned an error), CC BY | (c) |

## Prior art: is there an existing index of patient record rights?

None of the opened literature scores countries on a person's rights over their own health record. The nearest work is comparative and descriptive, which is the gap the paper's Section 1 already claims. Cite these to position the index:

- **Essén et al. 2018**, *Health Policy Technol* 7:44-56. doi:10.1016/j.hlpt.2017.11.003 (corrigendum doi:10.1016/j.hlpt.2018.04.001). Compares patient-accessible EHR policy (hard and soft regulation) and services in Australia, Denmark, Estonia, Finland, France, the Netherlands, New Zealand, Norway, Sweden and the United States. All ten "ensured some patient rights to access medical records" but varied on login security, access to own and others' records, and timing. Abstract from Semantic Scholar; accepted manuscript green OA, CC BY-NC-ND. All ten are in v1: use (b) and (c). It describes approaches, it does not score.
- **Kharko et al. 2024** (row 6). The only attempt we found to map online record access worldwide. Preliminary, expert-reported, 29 countries, no scores. OpenAlex lists 7 citing works on 1 Oct 2026; none is a fuller publication of the survey.
- **NORDeHEALTH**: Hägglund et al. 2023, *JMIR* 25:e47573, doi:10.2196/47573 (29,334 portal users in Norway, Sweden, Finland, Estonia); Hägglund et al. 2024, *JMIR* 26:e49084, doi:10.2196/49084 (five principles for record access under the EHDS: right to access, proxy access, patient-entered data, rectification, access control); Moll et al. 2024, *JMIR* 26:e55752, doi:10.2196/55752 (a 13-dimension sociotechnical framework for cross-country comparison). All CC BY. The five EHDS principles map closely onto our access and control categories and are worth citing as an outside framing of the same rights.
- **Greenleaf** (row 3) counts laws; it does not rate health rights.
- The digital-maturity indices already in the paper (EC eHealth indicator, OECD WP160, Bertelsmann, GDHM) remain the main quantitative comparators. Nothing found here replaces them.

## Cross-checks for the existing 43 (use b)

| Source | Countries | What to compare |
|---|---|---|
| Essén et al. 2018 (above) | 10, all v1 | Access policy details, though pre-2018 |
| Hägglund et al. 2023; Moll et al. 2024 | EST FIN NOR SWE | Portal content and national rules; Norway's access score is already flagged by the EC comparison |
| Payne et al. 2019, *J Glob Health* 9:020427, doi:10.7189/jogh.09.020427, CC BY | China, England, India, Scotland, Switzerland, USA | HIE status in two care scenarios (journey, clinical) |
| Palm et al. 2025, *BMC Health Serv Res* 25:269, doi:10.1186/s12913-025-12411-7, CC BY | Australia, Denmark, Estonia, Finland, Norway, Sweden, NHS England, Catalonia, US VA | National eHealth strategy detail (journey) |
| Essén et al. 2022, *npj Digit Med* 5:31, doi:10.1038/s41746-022-00573-1, CC BY | 9 (Belgium, Denmark, Germany, Netherlands, Norway, Singapore, Sweden, UK, USA in the text) | Health app approval and privacy requirements: **the only cross-country source found that touches our commercial category** |
| Aldughayfiq and Sampalli 2021, *OMICS* 25:102, doi:10.1089/omi.2020.0085, CC BY | Canada, USA, UK, Australia, Spain, Japan, Sweden, Denmark | e-prescription architecture and security (journey: pharmacy) |
| Scheibner et al. 2020, *J Law Biosci* 7:lsaa010, doi:10.1093/jlb/lsaa010, CC BY-NC-ND | Switzerland, Italy, Spain, UK, USA, Canada, Australia | Consent and anonymisation rules for research (research) |
| Griesser et al. 2024, *BMC Health Serv Res* 24:439, doi:10.1186/s12913-024-10929-w, CC BY | Austria (opt-out), France (opt-in) | Consent default for the national EHR (control) |
| Martani et al. 2026, *Health Policy* 174:105764, doi:10.1016/j.healthpol.2026.105764, closed | Selected European countries | How national opt-out rules for data reuse diverged in practice (research, control) |
| Palaniappan et al. 2024, *Healthcare* 12:562, doi:10.3390/healthcare12050562, CC BY | Developed nations (Singapore, UK, USA most discussed) | AI-in-care regulation (ai) |
| Guerrazzi 2020, *Med Care Res Rev* 77:299, doi:10.1177/1077558719858245, closed | OECD countries by health-system type | HIE adoption drivers (journey) |

## Related work only (use c)

- Ammenwerth et al. 2021, Cochrane CD012707, doi:10.1002/14651858.cd012707.pub2: effects of patient EHR access, 10 trials.
- de Man et al. 2023, *JMIR* 25:e42131, doi:10.2196/42131, CC BY: opt-in gave 84% average consent and more consent bias than opt-out (one opt-out study, 96.8%).
- Middleton et al. 2020, *Am J Hum Genet* 107:743, doi:10.1016/j.ajhg.2020.08.023, CC BY: 36,268 people in 22 countries; willingness to donate DNA and health data is low and lowest for for-profit users. Attitudes, not law.
- Biasiotto et al. 2023, *JMIR* 25:e47066, doi:10.2196/47066, CC BY: discrete choice experiment in 12 European countries (Iceland is outside v1); information and consent matter most.
- Tiffin et al. 2019, *BMJ Glob Health* 4:e001395, doi:10.1136/bmjgh-2019-001395, CC BY: data governance framework for LMICs.
- Scheibner et al. 2021, *JAMIA* 28:2039, doi:10.1093/jamia/ocab096: 86-article scoping review of national eHealth system success factors.
- Cervera de la Cruz et al. 2025, *Health Policy* 161:105428, doi:10.1016/j.healthpol.2025.105428: EHDS expectations of experts from 23 countries.
- Shrivastava et al. 2021, *Int J Med Inform* 148:104401, doi:10.1016/j.ijmedinf.2021.104401: EC hospital survey, 773 hospitals in over 30 countries; no country table.
- El-Jardali et al. 2023, *PLOS One* 18:e0285226, doi:10.1371/journal.pone.0285226, CC BY: 93 studies on digital health in fragile MENA states (Lebanon 32%, Afghanistan 13%, Palestine 12%); interventions, not rights.
- Liaw et al. 2021, *JAMIA* 28:494, doi:10.1093/jamia/ocaa255, closed: digital health profiles for 13 Pacific Island countries; country list not opened.

## Coverage of the 151 missing countries

| Layer | Countries with at least one | Notes |
|---|---:|---|
| Any opened scholarly country-level source | **66** | Africa 37, Latin America and Caribbean 16, CEE 8, Gulf 3, Türkiye, Mongolia |
| by category: access | 33 | 29 rest only on Munung 2024, which shows a legal right of access to personal data, not access to the record in practice; the other 4 are Lesotho and Zambia (Munung plus Joseph 2021), Mongolia (Joseph 2021) and Türkiye (Birinci 2023) |
| control | 31 | Data-subject rights in African law; 30 rest on Munung 2024 alone |
| privacy | 48 | 25 rest on Munung 2024 alone, 16 on Alegre 2024 alone |
| commercial | **0** | |
| journey | 46 | Mostly strategies and laws, few usage figures; 16 rest on Alegre 2024 alone, 7 on Ćwiklicki 2020 (2015 data) alone |
| clinical | 8 | |
| research | 32 | 25 rest on Munung 2024 alone |
| ai | 7 | All rest on Townsend 2023 alone |
| Countries with 3 or more scholarly sources | 10 | Botswana, Cameroon, DR Congo, Ethiopia, Malawi, Tanzania, The Gambia, Uganda, Zambia, Zimbabwe |
| WHO GDHM 2023, any item (dataset, self-report) | 124 | Full response including the HIE item (Q15): 47 |
| Scholarly or GDHM 2023 | 129 | |
| Neither | 22 | Andorra, Antigua and Barbuda, Djibouti, Dominica, Eritrea, Greece, Grenada, Kiribati, Liechtenstein, Marshall Islands, Micronesia, Monaco, Nauru, North Korea, North Macedonia, Palau, Saint Kitts and Nevis, San Marino, Somalia, Syria, Turkmenistan, Tuvalu |

Countries with only GDHM and no scholarly source include several large systems where single-country papers plainly exist but were not opened in this review: Pakistan, Bangladesh, Malaysia, Qatar, Jordan, Lebanon, Kazakhstan, Russia, Ukraine, Portugal, Iceland. The indicative Europe PMC hit counts in `coverage_by_country.json` (field `epmc_hits_indicative`) rank where a single-country search will pay off first: Iran 166, Qatar 144, Ethiopia 104, Türkiye 104, Portugal 86, Pakistan 83, Uganda 80, Jordan 71, Colombia 70, Malaysia 68, Oman 64. Thirty-six missing countries return zero hits. These counts are unopened search results, include false positives (for example "Jordan" as a surname), and are never counted as coverage.

## Caveats found (adversarial read)

1. **GDHM 2024 slice.** Our audit showed WHO's API rows labelled 2024 duplicate 2019 row for row. Ahmed et al. 2026 report 17 African countries assessed in 2024 and use them for change analysis. If they used the same API, their "change" findings are partly 2019 data. Check before citing.
2. **Munung 2024 "right of access"** is the data-protection right to one's personal data. It is evidence for the legal floor under our access category, not for a working record-access service. Scoring access from it alone would repeat audit finding 1 (same legal situation, different scores) in reverse.
3. **Two key country lists were not opened** (Greenleaf 2025; Kharko 2024). They are excluded from every count above. Downloading Greenleaf's tables by hand would likely push privacy coverage close to all 151.
4. **Dated sources.** Ćwiklicki 2020 rests on 2015 data; Moghaddasi 2018 on pre-2018 documents. Use for history, not current scores.
5. **Self-report.** Birinci 2023 is written from inside Türkiye's ministry; GDHM and the WHO Europe survey are government self-report.
6. **Bias toward Africa and Latin America.** The coverage reflects where comparative legal scholarship has been funded (Africa genomics and data-science programmes; PAHO), not where patient rights are most or least developed.
7. **`data/` changed during the review.** Files were being added while this ran (55, then 57, then 62 by 11:01 EDT: BGR COL CYP CZE GRC HRV HUN ISL LTU LUX LVA MLT PRT ROU RUS SVK SVN TUR UKR). Counts use the 43 as briefed; the script prints the live figure (132 missing at 11:01 EDT).

## How to use this for v1.1 and beyond

- For Africa and Latin America, use rows 1, 2, 4, 5 and 8 to pre-fill the privacy, research and AI categories and the `laws` array, then verify each law against official text as the rubric requires.
- For access, control and journey, none of these sources replaces a country-by-country primary search. Ask Kharko and Hägglund for the 29-country ORA table; it is the only multi-country access data outside Europe we found.
- Commercial protection has no comparative literature for any missing country. Expect to rate it from primary law only, or mark it low confidence.
- Cite Essén 2018, Kharko 2024 and the NORDeHEALTH principles in Section 1 or 6 as the closest prior work, and state that none scores rights.

## Provenance

Searches run 1 October 2026. Europe PMC REST `search` endpoint, `resultType=core`, sorted by `CITED desc` unless stated; every query had `PUB_YEAR:[2018 TO 2026]`. Main queries (field-restricted, abbreviated):

1. `TITLE:"patient online access" OR TITLE:"patients online access" OR TITLE:"patient accessible electronic health records"` (27 hits)
2. `TITLE_ABS:"NORDeHEALTH" OR (TITLE_ABS:"patient portal" AND TITLE_ABS:"six countries")` (11)
3. `TITLE_ABS:"online record access" AND (worldwide OR "international survey" OR global)` (6)
4. data protection OR privacy law, AND health, AND ("african countries" OR "sub-saharan") (33)
5. data protection OR privacy law, AND health, AND (Latin America OR Asia-Pacific OR Asian countries OR Middle East) (11)
6. (secondary use OR data sharing OR health data) in title AND (countries OR comparative OR jurisdictions) in title (58)
7. (opt-out OR opt-in OR consent model) in title AND (EHR OR health data OR HIE) (32)
8. AI AND regulation AND (medical device OR healthcare) AND (countries OR global OR comparative OR jurisdictions in title) (69)
9. Global Observatory for eHealth OR Global Digital Health Monitor OR Global Digital Health Index (11)
10. digital health OR eHealth OR EHR in title AND a world region in title (36)
11. national digital health strategy titles (30); WHO European Region titles (4)
12. personal health record OR patient-held record AND LMIC (18)
13. interoperability OR HIE in title AND countries/international/comparative (48); e-prescription OR patient summary (18)
14. secondary use AND member states AND legal/governance (25); right of access to medical records AND law AND countries (11)
15. GCC / Arab / Middle East EHR (21); Latin America EHR legislation (10); several Asia queries returned 0.

OpenAlex: `title.search` for "global data privacy laws", "patient access to electronic health records countries", "patients online record access", "electronic health records low middle income countries review"; citation graph `cites:W2768247694` (Essén 2018, 175 citing works) and `cites:W4391229480` (Kharko 2024, 7 citing works). Crossref title query resolved Essén 2018's DOI. Unpaywall (`email=jas@evilrobot.com`) for OA status. Semantic Scholar for the Essén 2018 abstract.

Full texts parsed from Europe PMC `fullTextXML` (all returned HTTP 200 except PMC11349313, HTTP 500): PMC13361429, PMC11635092, PMC11479556, PMC11921095, PMC10800019, PMC9931258, PMC10484713, PMC12042231, PMC12680716, PMC11069326, PMC7536612, PMC10930608, PMC8933556, PMC8413937, PMC6815656, PMC6033126, PMC8967994, PMC10146476, PMC7057573. Country lists were taken from tables or methods text; automated name matching was used only to find candidates, then checked against the paper's stated list and count.

Per-country indicative hits: Europe PMC, one query per missing country: country name(s) in title or abstract AND any of "electronic health record(s)", "electronic medical record(s)", "patient portal", "health information exchange", "personal health record", "health data protection", "data protection law", "health data governance", 2018 to 2026. Saved in `epmc_hits_2026-10-01.json`.

GDHM layer: `gdhm2023_items_by_country.json`, derived from `analysis/external/who_gdhm_relay_2026-10-01.csv` (2023 rows, labels other than "Not Available"), M49 codes mapped to ISO3 with i18n-iso-countries.

BibTeX: `references.bib`, from Crossref content negotiation; every DOI resolved on 1 Oct 2026. Discovery used the agent harness's scholarly APIs listed above, not the house SerpAPI service.
