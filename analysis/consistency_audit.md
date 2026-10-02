# Who Holds the Record v1: consistency audit

Read-only audit of `data/*.json` (43 files, imported 1 Oct 2026, commit af8f09f) against `RUBRIC.md` v1. Nothing in `data/` was changed. Every fix below is a suggestion for Dustin, the data author; he decides.

Audited 1 Oct 2026. Scripts: `analysis/audit.py` (schema, limits, dates, scores, journey map), `analysis/sources.py` (publisher classes, writes `source_classes.csv`), `analysis/url_check.py` + `analysis/url_recheck.py` (writes `url_check.csv`). Environment: ds-lab (Python 3.14). No house data service was used for Part A; the only inputs are the 43 JSON files and live HTTP requests to the cited URLs.

## Definitions used

- **Overall** = sum of category score x weight / 100, weights from RUBRIC.md (access 20, control 20, privacy 15, commercial 10, journey 15, clinical 10, research 5, AI 5). This reproduces the page's formula (now `build.js` line 42, after the 1 Oct rebuild in commit c6aebed), which then rounds with `Math.round`.
- **Band** = RUBRIC anchors: Leading 85-100, Strong 65-84, Mixed 45-64, Weak 25-44, Poor 0-24.
- **Primary source** = government, legislature, regulator, national health agency or EU institution (`official`), official legal text hosted on a non-government database such as SAFLII, Infoleg, eCFR, Lawphil (`legal_text`), or an intergovernmental body (`intergov`). Everything else is secondary: law firms, blogs and vendors, news and trade press, academic. The classification is mine, by domain; the lists are in `sources.py`.
- **Dead link** = HTTP 404 or 410 on two passes (HEAD then GET on pass 1, serial GET on pass 2). 401/403/429 = blocked, not verified, not dead. Connection failures = unreachable from this network, not verified.
- **Same described regime** = two summaries that state the same legal position and the same infrastructure, in near-identical words.

## Headline numbers

- 43 countries. Overall range 29.3 (Mexico) to 77.2 (Finland). Nobody reaches Leading (the page's claim holds). Ten countries are Strong, 22 Mixed, 11 Weak.
- 1,297 URL references, 549 unique. Final status: 512 live, 5 dead, 21 blocked by bot protection, 9 unreachable, 2 unresolved redirects.
- 907 category citations: 53.6% primary. 20.4% come from law firms (91) or blogs and vendors (94). 67 of the 344 country-category cells cite no primary source at all.
- 32 of 344 category summaries say in their own words that a fact the score depends on was not verified, yet carry a number.

## Ranked findings

Ranked by the house order: a figure that could be wrong or misread first, then coverage, then presentation.

### 1. Ireland's access score (24, Poor) contradicts its own text and the rubric. High consequence.

- **Where:** `data/IRL.json` `categories.access.score` (also `clinical` 24, `journey` 24, `control` 28).
- **What:** Poor means "no meaningful right or infrastructure". The Irish detail text says access is free by FOI or GDPR subject access request, and that the HSE received nearly 100,000 such requests in three years. That is a meaningful, used legal right without a portal: the same regime as South Africa (40), Kenya (40) and the Philippines (40), and stronger in practice than Nigeria (30), which has no fixed deadline. Ireland ranks 38th of 43, below China (37th). That ordering will be challenged by a European audience this week.
- **Sensitivity:** with access at 40 (the score given to the same regime elsewhere) Ireland's overall moves from 37.6 to 40.8 and its rank from 38 to 36; Kenya and China each drop one place.
- **Also:** Ireland's access summary cites the EU 25% figure through a Yahoo syndication of Euronews (`ca.news.yahoo.com`), not the EC study itself. The same Yahoo URL is used by BEL, ESP and ITA.
- **Suggested fix:** re-score Irish access into Weak, in line with the "legal right, no national portal" peers; check control against GDPR objection and restriction rights, which apply in Ireland now regardless of the new Act's commencement. Replace the Yahoo link with the EC study (doi 10.2759/2737039, Appendix A p.72, Ireland 25%).

### 2. "Legal right to a copy, no national portal" is scored anywhere from 24 to 60. High.

- **Where:** `categories.access.score` in CHL (60), ARG (55), NZL (55), CAN (55), PHL (40), ZAF (40), KEN (40), GHA (33), NGA (30), MEX (30), EGY (30), IRL (24).
- **What:** Chile and the Philippines carry almost the same sentence: a statutory right to a copy in a structured electronic format, and no national portal. Chile scores 60, the Philippines 40. Twenty points on access is 4 points overall. The pattern follows region (Latin America high, Africa and Ireland low), which suggests the separate research passes anchored differently.
- **Suggested fix:** add a sub-anchor to RUBRIC.md for this regime (for example: statutory right plus provider-by-provider access = 40-50; add up to 10 for proven provider portals, as in NZL and CAN; subtract for fees or no deadline) and apply it to all twelve.

### 3. Identical EU clinical-AI text is scored 50 to 62. Medium.

- **Where:** `categories.ai.score` in AUT (62), FRA (58), DEU (58), BEL (58), IRL (56), SWE (50), EST (50), FIN (50), NLD (50).
- **What:** All nine say, in nearly the same words, "Clinical AI falls under EU device law and the EU AI Act ... No [country]-specific clinical AI rules were verified." Austria gets 62, Finland 50. Weight is only 5, so overall moves by at most 0.6 points, but anyone comparing two country cards side by side will see it.
- **Related source issue:** the claim that AI Act device duties start 2 August 2028 rests in 13 EU files on a law firm (`cuatrecasas.com`) and a blog (`cyberlawwatch.com`). Secondary sources name it Regulation (EU) 2026/1744, published 24 July 2026. EUR-Lex returned a bot challenge to my request, so I could not open the official text; please open `https://eur-lex.europa.eu/eli/reg/2026/1744/oj/eng` and cite it directly.
- **Suggested fix:** one base score for "EU law only", with documented increments for national additions (Italy's AI law, Spain's AESIA, Poland's AI Systems Act, Denmark's supplementary bill).

### 4. Research use without individual consent is scored 45 to 64. Medium.

- **Where:** `categories.research.score` in NOR (64), EST (64), SWE (60), DNK (55), USA (50), KOR (45).
- **What:** All six describe research use of registry or pseudonymised data with no individual consent and no general opt-out. Korea's summary says "patients have no say" and scores 45; Norway's says "no general register opt-out was verified" and scores 64. That is the same regime 19 points apart.
- **Suggested fix:** a sub-anchor for "no individual choice, research easy". Score the difference only on documented safeguards (re-identification penalties, transparency registers).

### 5. Korea's privacy score (78, the highest in the index) rests on a non-health case. Medium-high.

- **Where:** `data/KOR.json` `categories.privacy` (score 78; Austria 75, Finland 70).
- **What:** the rubric's privacy category asks about health-data law, regulator enforcement and health breaches. Korea's summary and detail rest on the PIPC's June 2026 Coupang fines, an e-commerce breach and covert browsing-data collection. The only health-related items are Coupang's logistics arm using employees' weight data, and a claim that the Medical Service Act bars storing medical records outside Korea, marked by the author as "primary text not verified". All three sources are secondary (Korea Herald, The Record, recordinglaw.com); none is the PIPC or a statute. A Strong-band score with no health-sector evidence is a band-versus-text mismatch, and Korea outranking Austria and Finland on health privacy is a question the Amsterdam audience will ask.
- **Suggested fix:** find a health-sector PIPC decision or a health breach record and cite the PIPC and the PIPA text directly. If none turns up, score privacy on the general law and its enforcement record, where most EU countries sit (60 to 66).

### 6. Belgium is ranked 8th on the thinnest sourcing in the index. Medium-high.

- **Where:** `data/BEL.json`, all categories; `confidence` = "medium".
- **What:** only 1 of Belgium's 8 categories cites a primary source (health.belgium.be, for access). The rest rely on trade press (lespecialiste.be, medi-sphere.be), a mutual insurer (cm.be), a regional hub (brusselshealthnetwork.be), law firms and icthealth.org. Primary share is 5%, the lowest of all 43. Belgium's privacy and research summaries admit the key facts were not verified. With Amsterdam next door, Belgium's rank is likely to be checked.
- **Wider pattern:** the `confidence` label does not track sourcing. Argentina is "low" with 100% primary citations, while Taiwan is "high" with 44%. The rubric defines high as "primary sources for most categories", but no file applies that as a test.
- **Suggested fix:** source Belgium's privacy, control, research and journey cells from the Belgian DPA, eHealth platform and Health Data Agency pages, or set Belgium to "low". Make confidence mechanical: high = 7 or more categories with a primary source, medium = 5 or 6, low = 4 or fewer, overridden only with a written reason. On that rule Belgium, Kenya, Egypt, Saudi Arabia, Mexico, Korea and Thailand would be low, and Taiwan (now high, 5 categories) would be medium.

### 7. 32 "not verified" cells carry a number as if measured. Medium-high.

- **Where:** 32 category summaries (research 10, clinical 6, access 4, control 3, AI 3, privacy 2, commercial 2, journey 2), for example EST access 82 ("machine-readable export was not verified"), SGP commercial 65, SAU clinical 62, BEL privacy 60, IRL privacy 60. Another 84 cells make the admission only in the detail text. Counted by phrase match ("not verified", "could not verify", "not confirmed", "not checked" and similar) and then read one by one; statements of absence such as "we found no rule" are not counted, since they are findings.
- **What:** the rubric asks authors to say "not verified" and lower confidence, which they did. But the number on the dial reads the same as a verified one. That is an unknown presented as a measurement, which the house rules (ds-rigor gate 3; DataSpine "unknown recorded as unknown") do not allow.
- **Suggested fix:** add `"verified": false` per category in the schema and show it on the card (a hollow dial or "estimate" tag). For the whitepaper, report how many cells are estimates and run the overall with and without them.

### 8. Ranks are less precise than a single number implies. Medium (figure could be misread).

- **Ties:** after `Math.round`, ten groups of countries share a displayed score (for example AUT, ISR, TWN all show 69; CHN, IRL, KEN all show 38). The v1 template broke ties by file order. **The 1 Oct rebuild (commit c6aebed, `build.js` lines 44-49) already fixed this** with shared ranks ("4=") and a lede that computes the leader's name instead of hard-coding "Finland". No action needed on ties.
- **Rank stability (sensitivity analysis, not a confidence interval):** adding independent uniform noise of plus or minus 5 points to every category score gives a median 90% rank range of 4 places. At plus or minus 10 it is 8 places, and no rank is fixed (Finland ranges 1 to 2, Mexico 41 to 43). At plus or minus 5 only Finland's rank is fixed; the bottom three each span two or three places. Findings 1 to 5 show inconsistencies of 10 to 36 points actually exist.
- **Suggested fix (for the tufte agent and the whitepaper):** say in the methods that ranks are approximate, give rank ranges in the paper, and lean on bands in talk.

### 9. Journey and clinical are nearly the same measure. Low-medium (method).

- **What:** across 43 countries the journey and clinical scores correlate at r = 0.96. Together they carry 25% of the weight, so connected infrastructure is effectively counted twice. Access correlates with both at about 0.8.
- **Suggested fix:** say so in the methods section, or merge them in v2. Not an error in any one file.

### 10. Dead, blocked and unreachable links. Medium (coverage).

404 on the serial GET recheck (pass 2):

| Country | Fields | URL |
|---|---|---|
| CHE | access.sources[0], privacy.sources[1], commercial.sources[1], laws[0] | kmu.admin.ch, new FADP page |
| IND | access.sources[0], laws[2] | nmc.org.in, Code of Medical Ethics 2002 |
| RWA | ai.sources[0], laws[1] | rwandafda.gov.rw, SaMD guidelines PDF (Dec 2025) |
| NLD | control.sources[1], journey.sources[0] | infoizo.nl, Mitz article |
| GHA | ai.sources[1] | mesopotamian.press, journal PDF |

- **Unreachable from a US network (9 URLs), not verified:** president.gov.tw (cited 6 times in TWN, including the NHI Data Management Act), mohw.gov.tw, langzhong.gov.cn, sis.gov.eg (2 pages), mohap.gov.ae (Riayati policy, 3 cells), dataprotection.org.gh, ethics.gc.ca, airtabat.com. Likely geo or TLS blocking. Please recheck from another network before calling them dead.
- **Blocked by bot protection (21 URLs, 403):** digital.nhs.uk (4 GBR cells), lexology.com (ISR, ARE), tweakers.net, ghalii.org, ameli.fr, beckershospitalreview.com, nhi.gov.tw and others. These very likely work in a browser.
- **Unresolved redirects:** DEU apotheken-umschau.de (3 cells, final status 302), SAU tamimi.com (2 cells, final status 307). Not a loop (the client would have raised one); the redirect target did not resolve to a page.
- **Checker note:** on pass 1, HEAD requests reported false 404s for legislation.gov.au and imy.se. A serial GET proved them live, so `url_check.csv` keeps both passes and a `final_outcome` column.
- **Suggested fix:** replace the five dead links (the Swiss FADP text is on fedlex.admin.ch; the Rwanda FDA PDF has probably moved within the site). Archive every cited URL in the Wayback Machine before the Zenodo deposit, so readers can still check the evidence if a page moves.

### 11. Secondary sources carry two categories. Medium (coverage).

- **What:** citations and primary share by category: access 135 (64%), control 123 (63%), privacy 130 (40%), commercial 101 (50%), journey 136 (47%), clinical 94 (61%), research 91 (66%), AI 97 (37%). Total 907. Some heavily used secondary domains are law-firm or vendor summaries: cuatrecasas.com (18 citations), dlapiperdataprotection.com (14), recordinglaw.com (13), hlc.com (12), cyberlawwatch.com (10), chambers.com (10). The README admits this "mostly Latin America and Korea"; the data shows it is also true across the EU AI cells and the privacy category generally.
- **Suggested fix:** for each law named in `laws[]`, link the official text (127 of 202 law URLs already point to official text or an official-text database; 61 point to law firms or blogs).

### 12. `source.date` has no definition. Low-medium (provenance).

- **What:** the rubric never says whether `date` means published or accessed. Values mix both: 22 use the asOf date 2026-10-01 (accessed), most use publication dates, 50 say "n.d.", 33 are blank (AUT, POL, SAU, ARE, ISR, CHE) and 2 say "not verified" (BRA control and journey).
- **Suggested fix:** split into `published` (may be "unknown") and `accessed`; never leave it blank.

### 13. Schema and writing-rule violations. Low.

- `ARG.news`: 0 items (rubric: 3-5). Already noted in the README.
- Detail paragraphs below 3: CHN clinical and research; IND research; JPN commercial, clinical and research; KOR clinical and research; SGP research (9 cells, 2 paragraphs each).
- `DEU.categories.ai.summary`: 3 sentences (limit 2).
- `GHA.categories.commercial.detail[2]`: uses "leverage" (on the banned list).
- News outside Oct 2025-Sep 2026: `EST.news[3]` dated 2025-09-05 (Apotheka fine).
- News date not in YYYY-MM form: `EGY.news[2]` and `EST.news[2]` give only "2026".
- Passed with no violations: enum values (controlModel, confidence, journey states, law levels), headline 25 words, journeyNote 40 words, news headline 14 words, law "what" 20 words, detail paragraph 60 words, 1-4 sources per category, 3-7 laws, score integer 0-100, no em dashes.

### 14. README omits a low-confidence country. Low.

- `data/EGY.json` has `confidence: "low"`; the README's list (ARG, NZL, PHL, GHA, RWA) leaves Egypt out. Suggested fix: add Egypt, or generate the list from the data.

### 15. Journey map and journey score agree. Informational.

- The 7-step journey map (connected 1, partial 0.5, siloed 0, unknown excluded) correlates with the journey score at Spearman 0.89 (n = 43). Largest gaps: PHL (6 of 7 steps "unknown"), ARG, NZL below the map; SAU, ESP, CHE above it. No change needed. PHL's map is mostly unknown, which supports its low-confidence label.

### 16. Same URL, different titles. Cosmetic.

- 10 URLs appear with two or three different titles (for example the LGPD on planalto.gov.br cited as Art. 11, Art. 13 and whole act). Harmless; optionally standardise.

## How the checker was tested (gate 11)

- **Planted-failure test:** I copied `data/` to `/tmp/advtest`, planted ten violations in FIN.json (an em dash, a 39-word headline, a 57-word 3-sentence summary, score 101, an out-of-window news date, a future source date, bad controlModel, law level and journey enums, a banned word) and ran `audit.py` against the copy (`WHTR_ROOT=/tmp/advtest`). It flagged all ten.
- **Known limits:** summaries are flagged above 50 words, not 45, because the rubric says "~45" (a 46-50 word summary passes). Only the first banned word per field is reported. The sentence counter can miscount abbreviations. Publisher classes are a hand-made domain list, so a reviewer should spot-check `source_classes.csv`. Band-versus-text and cross-country findings (1 to 7) come from my reading all 344 summaries, not from code. A second reader should repeat that read before anything is published (gate 10).
- **URL checker:** the first pass's false 404s from HEAD (legislation.gov.au, imy.se) are the failure that justified the GET recheck. Both passes are kept in the CSV.

## Suggested decision rules for v1.1 (gate 16)

Each rule names the incident here that bought it. Rules without a check say so.

1. **Same regime, same band.** Bought by findings 1 to 5. Check: none yet; proposed `audit.py` extension that groups summaries by sub-anchor tag and fails on a spread above 10.
2. **No number without verification.** Bought by finding 7. Check: schema field `verified`; audit fails if a summary contains "not verified" and `verified` is not false.
3. **Confidence is computed.** Bought by finding 6. Check: `sources.py` primary-coverage count against the label.
4. **Every cited URL resolves before release.** Bought by finding 10. Check: `url_check.py` + `url_recheck.py`; any `dead` fails the build.
5. **Primary statistics cite the primary.** Bought by the Yahoo/Euronews citation for the EC figure. Check: a list of known statistic owners (EC, OECD, WHO) in `sources.py`; fail when a figure from one is cited through news.

`audit.py` is ready to become the adversary script. A ratcheted baseline (for example "dead URLs = 0, unverified-with-number = 0, schema violations = 0") would make it a release gate.

---
Provenance: all figures computed by `analysis/audit.py`, `sources.py`, `url_check.py`, `url_recheck.py` from `data/*.json` as imported 1 Oct 2026 (asOf 2026-10-01 in every file). URL checks run 1 Oct 2026, 13:03Z and about 13:15Z, from a US residential network. Coverage: all 43 files, all 1,297 URL references. Services: no house data service was needed for Part A; inputs were the JSON files and direct HTTP requests to each cited URL.
