# Cross-border layer: method

This layer supports the "travelling patient" feature. A reader follows one person across borders. At each stop it shows what that person's record can do there. The question for every country is simple. Can the record cross the border by itself, and if not, can the person carry it?

The data lives in `crossborder.json`. `build_crossborder.py` builds it and also checks it. Status is as of 2 October 2026. Every fact names the page we opened, its publisher, its date (or "undated") and a quote copied word for word from that page. The validator checks each quote against the cached copy of the page.

## What each field means

For every country in `data/` there is one entry under `countries`.

- `myhealtheu.ps_send`: a doctor in another country can pull this person's Patient Summary from this country. In EU terms this country acts as "country A", the country that holds the record.
- `myhealtheu.ps_recv`: a doctor here can pull a visitor's Patient Summary from the visitor's home country. This country acts as "country B", the country of care.
- `myhealtheu.ep_send`: a prescription written here can be filled at a pharmacy in another country.
- `myhealtheu.ep_recv`: a pharmacy here can fill a visitor's electronic prescription from their home country.
- `ncpeh`: the first quarter in which the Commission's KPI data shows this country's national contact point as operational.
- `other_arrangements`: live or pilot exchanges outside MyHealth@EU.
- `no_exchange`: for non-EU countries where we found nothing. Each one records the search we ran. It says "none found", never "no".
- `us_note`: what exists for the United States.
- `fallback`: the person-carried route. It links to the access facts in the country file and does not research them again.

Each topic block holds `status`, `basis`, `confidence`, `evidence_as_of`, `conflict`, `kpi_partners` and the `facts` behind it.

Status values: `live`, `planned`, `not_live`, `unknown`, `none found`. "Unknown is unknown": if we found no evidence the status is `unknown`, never `not_live`.

## Sources, in order of weight

1. **National contact point and ministry pages, and dated official press releases** (2025 to 2026). These are the only sources that can carry a 2026 date for "live". Examples are Kanta (Finland), IDIKA (Greece), pacjent.gov.pl (Poland), eSanté (Luxembourg) and the Latvian Digital Health Centre. Pages from partner countries count too: a Greek page listing Ireland as a place where doctors can pull Greek summaries is evidence that Ireland receives.
2. **The Commission's MyHealth@EU monitoring data** (eHDSI Monitoring Framework, ArcGIS, owner `sante_gis`). The transaction layers are `KPI_1_5` (Patient Summary) and `KPI_1_3b` (ePrescription). We grouped them by initiator, responder, year, test flag, result and transaction type. In a retrieval the responder holds the record and sends it (country A). The initiator is the country of care (country B). We dropped test rows, failed rows, same-country rows (for example CZ to CZ) and unmapped codes (one row coded "VA"). We merged GR into EL. **The layers end on 30 June 2025.** A KPI fact never claims a status after that date. The KPI site itself warns that its figures are being revised.
3. **The Commission's Patient Information Notices.** An "A" notice is for residents whose data leaves home, so the country sends. A "B" notice is for visitors, so the country receives. A notice shows that a country prepared a service. It does not prove the service is live today. A missing notice proves nothing: Czechia publishes no A notices, yet the KPI data shows Czech summaries sent to eight countries.
4. **The Commission's narrative pages.** The "My rights over my health data" page was last modified on 25 April 2025. Its list of live countries is a snapshot from that time, not current status.

## Decision rules (per country, per topic)

- **D1.** A national or official source with a status of live, planned or not live sets the status. If there are several, the most recent one wins. Confidence is high if the source is dated 2025 or later, medium otherwise.
- **D1 conflict.** If D1 says planned or not live but the KPI data shows 20 or more transactions, the block keeps the D1 status and sets `conflict: true`. These cases are listed below.
- **D2.** With no national source, 20 or more qualifying KPI transactions between 1 January 2024 and 30 June 2025 give `live`. Confidence is medium and `evidence_as_of` is 2025-06-30.
- **D3.** With no national source, 5 to 19 KPI transactions give `live` only if a matching Commission notice exists for that direction. Otherwise the status is `unknown`.
- **D4.** A Commission notice alone, with no transactions and no national source, gives `unknown`.
- **Partner corroboration.** Suppose a dated live fact for country X names partner Y. If it is under `X.ps_send`, it supports `Y.ps_recv`, and so on for each direction. The build lists these under `corroborated_by` and puts the most recent date in `latest_partner_evidence`. Corroboration never sets or changes a status. It shows whether a live block resting on an old or undated home page has newer support from a partner. Every live block whose own evidence is undated or older than 2025 has partner support dated June to August 2026: Croatia, Cyprus, Czechia, Estonia, Latvia and the Netherlands (receive).
- **D5.** For countries outside the EU and EEA, every MyHealth@EU topic is `none found`. Article 24(3) of the EHDS lets a third country join only through a Commission implementing act and a public list. We found no such act. Implementing Regulation (EU) 2026/2083 names no participants.

The thresholds of 20 and 5 are our choice. They keep a handful of stray rows from turning a country "live". For example, France shows 8 ePrescription rows as country of care, and France's notices cover only Patient Summary B.

## The person-carried fallback

For EU members, `fallback.ehds` gives the EHDS download date directly. For Norway, Iceland and Liechtenstein it says "unknown". `fallback.refs` cites the exact field in the country file, for example `data/EST.json` `categories.access.detail[2]`, and copies its text. The validator checks that the text still matches the file. `keyword_flags` are plain keyword matches (copy, download, export, PDF, FHIR, print, portal, app). They point to the text and are not findings of their own. Estonia's file, for instance, says a machine-readable download was not verified, and the flag `export_not_verified` repeats that.

For EU countries the regulation adds a future right. Article 3(2) of the EHDS gives a free download of the priority data in the European exchange format. Article 105 applies it to patient summaries, prescriptions and dispensations from 26 March 2029, and to images, test results and discharge reports from 26 March 2031. The regulation as a whole applies from 26 March 2027. Whether these dates bind Norway, Iceland and Liechtenstein depends on the regulation being taken into the EEA Agreement, which we did not verify.

## EHDS dates (Regulation (EU) 2025/327, OJ L 5.3.2025)

- General application: 26 March 2027 (Article 105).
- Patient summaries, ePrescriptions, eDispensations: rights and cross-border exchange from 26 March 2029 (Article 105, third paragraph, point (a), with Article 14(1)(a) to (c)).
- Medical images, test results, discharge reports: from 26 March 2031 (point (b), with Article 14(1)(d) to (f)).

EUR-Lex returns a bot challenge to scripted requests. We read the Official Journal text through the Publications Office Cellar (content negotiation on `publications.europa.eu/resource/celex/32025R0327`). The `url` field gives the EUR-Lex ELI link and `also` gives the Cellar link we opened.

## Searches

WebSearch was out of quota for this session. Searches ran through SerpAPI (Google engine). The key was read from the environment file at run time and never printed. Each "none found" record carries its exact query string and the date it was searched.

## How to rebuild and check

```
python3 analysis/crossborder/build_crossborder.py build      # needs network; caches pages in $XB_CACHE (default /tmp/xb/src)
python3 analysis/crossborder/build_crossborder.py validate
python3 analysis/crossborder/build_crossborder.py selftest   # plants 3 errors in a copy and shows each is caught
```

Curated facts (national pages, non-EU findings, EU-wide legal facts) are read from `$XB_FACTS` when present. Otherwise they come from `curated_facts` in the existing JSON, so a rebuild needs no scratch files. Quote checks run only where the cached page exists. Without the cache the validator still checks structure, sources and fallback text.

## Cross-check

The Spanish Ministry of Health's ePrescription tracker (`evol_Europa.pdf`, updated August 2026) lists 12 countries in operation, all running both roles: AT, CZ, CY, HR, ES, EE, FI, GR, LV, LT, PL and PT. Our rules, run without that tracker, mark the same 12 countries live for both `ep_send` and `ep_recv`. We then added the tracker as a source for France, Ireland, Italy and Malta (in testing) and for Bulgaria and Luxembourg (in development). Belgium and the Netherlands do not appear among its 27 participants.

## Result on 2 October 2026 (EU 27 plus NO, IS, LI; 30 countries)

| Topic | Live | Planned or not live | Unknown |
|---|---|---|---|
| Patient Summary, send (A) | 11 | 10 | 9 |
| Patient Summary, receive (B) | 15 | 10 | 5 |
| ePrescription, send (A) | 12 | 15 (14 planned, Germany not live) | 3 |
| ePrescription, receive (B) | 12 | 15 | 3 |

Counts come from `meta.counts` in the JSON. Outside the EU and EEA (168 countries): 4 take part in one live arrangement, the Hajj health card (Saudi Arabia verifies an International Patient Summary carried as a QR code by pilgrims from Indonesia, Malaysia and Oman). The other 164 are "none found" for any live exchange (`none_found_no_live_exchange`). 14 of them have planned or pilot work: Ukraine, the Gulf states, the LACPass countries, and Russia with Belarus. That leaves 150 with nothing live or planned (`none_found_no_live_or_planned`).

## Known limits

- **The Commission's monitoring data stops at 30 June 2025** and is under revision. Where it is the only evidence, the block says `evidence_as_of: 2025-06-30`.
- **Conflicts kept, not hidden.** These blocks have `conflict: true`:
  - Lithuania Patient Summary, both directions: national pages in 2026 say the service is being prepared, but the KPI data shows Lithuania and Latvia exchanging summaries in 2024.
  - Poland Patient Summary receive: Centrum e-Zdrowia reports tests, but the KPI data shows 69 rows with Latvia.
  - Hungary ePrescription, both directions: a national project page says planned, but the KPI data shows rows with Poland. Poland's August 2026 page does not list Hungary.
  The KPI rows may be pilot or test traffic that was not flagged.
- **Old or undated home pages.** Croatia (HZZO, October 2022), Czechia (Patient Summary list, September 2023), Estonia (TEHIK, undated), Cyprus (NCPeH portal, undated), Latvia and the Netherlands (undated) get medium confidence. Each is backed by partner pages dated 2026 (see `corroborated_by`). Spain's Patient Summary partners come from a map image, dated 19 June 2026, that does not separate sending from receiving, so Spain's corroboration is weaker for direction.
- **Second-hand evidence.** Some countries rest on what partner countries publish. Malta's own site refused our fetcher. For Ireland, the only page saying it receives summaries is a partner country's. Portugal rests on Spanish and Norwegian sources plus the KPI data.
- **Partial coverage inside a country.** "Live" means the service runs, not that every doctor or pharmacy can use it. Norway receives summaries only in a pilot at two out-of-hours clinics. Finnish providers switch on summary receipt one by one.
- **Hajj card, live or pilot.** WHO called the 2024 season a pilot. Oman's Ministry of Health (May 2026) says pilgrims used it in 2024 and 2025. It runs only in the Hajj season, and the person carries the record.
- **"None found" is a weak negative.** It comes from one generic search per country plus the Commission's EU and EEA-only list, so a small bilateral pilot could be missed.
- **Fallback flags are keyword matches.** They depend on how each country file is worded.
- The KPI layers contain one row coded "VA". We dropped it as an artefact, not as evidence about Vatican City.
- `data/PSE.json` was added while this work was under way and is covered. Greenland (`GRL`) and Kosovo (`XKX`) were added on 2 October 2026 with their own searches (listed in each `no_exchange` record). Greenland's agreements with Denmark (letter of intent, October 2025; treatment agreement, September 2026) and Kosovo's 2022 health agreements with Albania are recorded under `other_arrangements` as `unknown`: an agreement exists, but nothing we opened says records are exchanged. For Kosovo and Serbia, a 2025 report quoting the Pristina clinical centre that no inter-institutional agreement exists is filed as an `unknown` item under `no_exchange`, because the method has no "no" status for exchange. If more country files are added, the validator fails until they have entries.

## Saved source pages
The pages behind every quote (62 MB, fetched 2 Oct 2026) are archived outside the repo at `~/Projects/whr-archive/crossborder-sources-2026-10-02.tar.gz`. To rerun the word-for-word quote check, extract it to /tmp (it unpacks to /tmp/xb) and run `validate`. The four pages added for Greenland and Kosovo (`grl_ism_aftale`, `grl_knr_hensigt`, `xkx_koha`, `xkx_kossev`, with their `.url` files) and the search results behind their `no_exchange` records (`/tmp/xb/sweep/GRL.json`, `/tmp/xb/sweep/XKX.json`, `/tmp/xb/sweep198/`) are in `~/Projects/whr-archive/crossborder-sources-198-2026-10-02.tar.gz`, which unpacks to the same /tmp/xb paths. The Koha and KoSSev pages were fetched through ScrapingBee because both sites return a bot challenge to curl.

## Relocation and the person's own copy

`relocation_and_copy.json` answers two questions the traveller feature left as "not known": does a record follow a person who moves to another EU or EEA country, and can the person get their own copy at each stop. `test_relocation_copy.py` checks it (run it with no argument for validate plus selftest). Status is as of 2 October 2026. The generator was a scratch script; the JSON is the record and the validator is the check.

### A. A person who moves (relocation)

We opened the Commission's cross-border services page (modified 2 March 2026), the MyHealth@EU questions and answers, the eHealth Network guidelines on the Patient Summary (Release 3.4) and on ePrescription (Release 3.1), Finnish and Danish national pages, three Your Europe pages, Directive 2011/24/EU and the EHDS Regulation 2025/327. Each finding in `relocation_findings` has url, publisher, date, quote and the cached file it was checked against.

- **Who MyHealth@EU serves today.** Every source describes people travelling or visiting. The Patient Summary guideline names two use cases, the occasional visitor and the "regular visitor" who lives in one country and works in another, and says it describes only the occasional visitor. The ePrescription guideline's purpose is "patients who are travelling inside Europe". No source says the services exclude people who move and register in a new country, and none says they serve them.
- **Transfer on moving.** None found. No source describes a mechanism that moves a record from the old country's system to the new one. Eight searches (SerpAPI, Google engine) are listed under `relocation_conclusion.question_2_transfer_on_moving.searches`. Your Europe's page on health cover when living abroad deals with insurance only. The person-carried routes found are a paper copy of an e-prescription (Your Europe) and the Directive 2011/24/EU Article 4(2)(f) right to a copy of the record of cross-border treatment.
- **EHDS from 2029.** Article 3(2) gives a free download in the European exchange format. Article 7(2) gives a right to request transmission to a provider in another Member State through MyHealth@EU, and Recital 33 says such transmission can support continuity of care when people "change their place of residence". Article 105 applies both to patient summaries and prescriptions from 26 March 2029. This is a right on request, not an automatic transfer.

**Rule.** `visitor_only` needs a quote that excludes movers or says no transfer happens; `serves_residents` needs a quote that covers people who move. Today, neither exists, so both channels are `not_stated` for every EU and EEA country. `relocation.ehds_2029` is `serves_residents` from 2029-03-26 for the 27 EU members and `not_stated` for Norway, Iceland and Liechtenstein, because EEA incorporation of the EHDS was not verified. Outside the EU and EEA both channels are `not_stated` with the basis "MyHealth@EU does not apply".

### B. The person's own copy

Values: `copyRight` and `electronic` are `yes`, `no` or `not stated`. `copyParts` lists which of the five parts the right covers; it is omitted when the right is limited to some holders or some media, or when the source's list does not map onto the five parts.

- **EU 27 plus Norway, Iceland, Liechtenstein (30).** GDPR Article 15(3) gives a copy (`copyRight: yes`) and, for a request made by electronic means, "a commonly used electronic form" (`electronic: yes`). It covers all personal data, so all five parts. Article 20 portability is recorded under `portability` with its conditions (consent or contract, automated means, not public-interest processing) and is not counted as a copy right. For the three EEA states the EEA Joint Committee Decision No 154/2018, which incorporates the GDPR into the EEA Agreement, is quoted. Under `national`, each country's health-specific rule is quoted from its file (`data/ISO3.json`, `categories.access`) with the file's own source URL. Malta's file names no statute. National rules do not narrow `copyParts`; where a file says some notes are excluded or can be restricted, `national.caveat` (Spain, Denmark) or `basis` (Switzerland, Andorra, Monaco) quotes it.
- **Outside the EU and EEA (168).** Read only from each country file's access category. `yes` needs the file to say a law, regulation or code in force gives a right to a copy, or to obtain or receive the record or the person's data itself. A right only to see, inspect or be told what is held is `not stated`. A ministry charter, manual, hospital policy or professional ethics code is not a statute: `not stated`, unless the file also says no statute gives the right. `no` needs the file to say no such right exists; such entries quote that sentence. Where the file says only that none was found in the laws it opened, the entry is `not stated` (JAS house rule: "we found no law" reads as none found, never no). Ten entries rest on that wording (Eritrea, Haiti, Liberia, Libya, Marshall Islands, Myanmar, Nepal, North Korea, Palestine, Timor-Leste). A law not in force counts as `no` only where the file says no enforceable right exists, otherwise `not stated`. `electronic: yes` needs the file to say the copy comes in electronic form, on electronic request, or as an export; portability alone does not count. Where `copyRight` is `no`, `electronic` is `no` with the same quote. Each entry has `refs` (path, field, quote) and the validator checks every quote word for word against the current file.
- **Which URL.** Country files do not tie a sentence to a source. `copySource` is the file's source whose title shares a law number with the quote; failing that, the first `legal_text` source; failing that, the first source. Twelve picks were corrected by hand to the source the quote names (`copySourceRule` records which rule applied). `copySourcesInFile` lists all the file's access sources. These URLs come from the country files and were not reopened here.
- **United States.** HIPAA, 45 CFR 164.524, as already quoted in `crossborder.json` (`us_note`): copy and electronic copy both `yes`, re-fetched from eCFR (version 2026-09-01) for the quote check.

### Result on 2 October 2026 (198 countries)

| | yes | no | not stated |
|---|---|---|---|
| copyRight, all | 138 | 23 | 37 |
| copyRight, outside EU and EEA (168) | 108 | 23 | 37 |
| electronic, all | 59 | 23 | 116 |

Counts come from `meta.counts` in the JSON. Greenland and Kosovo (added 2 October 2026) are both `yes` with `electronic: not stated`: Greenland's 2001 ordinance gives a copy for a fee, for records from 1995 on; Kosovo's 2019 data law makes the first copy free and its 2004 patient rights law puts copies at the patient's cost.

### Known limits

- **"Not stated" is a reading of the sources, not a finding that movers are excluded.** The guidelines are written for visitors; whether a doctor in a new country of residence can pull a summary from the old one is not addressed in anything we opened.
- **Judgement calls outside the EU.** Some classifications rest on wording: Brazil (LGPD access and portability, copy only in the medical ethics code), New Zealand and Australia (access rights, copy not stated in those words), the UAE (`no` federally, while the Abu Dhabi and Dubai regulators grant copies by policy), Iraq (`yes` for the Kurdistan Region only), Nicaragua (the data law gives the data, the health norm restricts copies). The `basis` field says why.
- **Scope limits** (private providers only, public bodies only, electronic data only, one region) are in `basis` and remove `copyParts`. The traveller reader treats a missing `copyParts` with `electronic: yes` as all five parts; the one such entry is Vatican City (scope: the Governatorato).
- **Page cache.** Quotes from web pages and EUR-Lex are checked against `$XB2_CACHE` (default `/tmp/xb2/src`), fetched 2 October 2026. Without the cache the validator still checks structure, file quotes and dashes, and says the page check was skipped. The cached pages are archived outside the repo at `~/Projects/whr-archive/relocation-copy-sources-2026-10-02.tar.gz` (it unpacks to /tmp/xb2/src).
