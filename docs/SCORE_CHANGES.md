# Score changes, 1 Oct 2026: the original 43 brought onto the v1.1 anchors

JAS accepted the consistency audit's suggestions for the cells under review (analysis/consistency_audit.md, findings 1 to 7; Dustin defers to JAS). This file lists every score and confidence change made to `data/*.json` for that ruling, the cells that stayed and why, and what is still open. Anchors: docs/RUBRIC_V1_1_ANCHORS.md.

Totals: 44 score changes in 33 countries, 18 confidence changes. Only `score` and `confidence` lines changed; no summary needed rewording (see "Text left as written").

Provenance: inputs were the 64 files in `data/` at commit de89cc2 (asOf 2026-10-01) and `analysis/source_classes.csv` as written by the wave 1 check. Pages opened for this ruling on 1 Oct 2026: the PIPC English press-release list (pipc.go.kr, 25 pages, Sep 2022 to Sep 2026) and the PIPC Coupang decision release (nttId 3071, 11 Jun 2026); the Citizens Information page cited by IRL access; the Privacy Commissioner release cited by NZL access. Belgian primary sites (hda.belgium.be, ehealth.fgov.be, the DPA) were tried once: HDA serves a bot challenge, so Belgium was not re-sourced. No house data service applies: the data-scientist services (client warehouses, Databricks, DataSpine, health APIs, Census) hold no legal-text or citation data. The change table below was generated from a before/after diff of the JSON and fails if any changed cell lacks a reason.

## Definitions used

1. **Band.** Where a v1.1 sub-anchor regime fits the cell's verified facts (access, control, research, ai, privacy), the band is that regime's range. Where none fits, the band is the RUBRIC five-band the score sits in. Lower half = bottom of the band to floor(midpoint): 40-50 -> 40-45; 60-75 -> 60-67; 76-90 -> 76-83; control 40-55 -> 40-47; general-law privacy 45-66 -> 45-55; non-EU AI guidance 35-50 -> 35-42; RUBRIC Mixed 45-64 -> 45-54, Weak 25-44 -> 25-34, Strong 65-84 -> 65-74.
2. **Which "not verified" moves a score (finding 7).** The anchor's test is "a key fact could not be verified". Read per cell, not by regex:
   - Place the cell in the band its verified facts support. An unverified fact that would lift it into a higher band earns nothing and does not cap it (the RUS control precedent).
   - Inside that band, a summary admission is presumed key. A detail admission is key only when the band's own text names the fact (export and "used by a majority" at 76-90; a patient-visible log at control 60-80; "to most residents" at 60-75).
   - Commercial, journey and clinical have no sub-anchor, so only a summary admission moves them, to the lower half of their RUBRIC band. This matches the wave 1 rulings (ISL journey 76, HRV clinical 64, GRC commercial 62 carry detail admissions and stayed).
   - A statement of absence ("we found no rule", "we did not verify a major breach") is a finding, not an admission. An unverified negative fact (a breach, a bill widening access) does not inflate the score and moves nothing.
   - The rule only caps. It never raises a cell that sits below its band.
3. **Access arithmetic, statutory right with no national portal (findings 1 and 2).** Base 45. +5 if the right is free and has a fixed deadline or a structured or portable format. -5 each for a fee charged per request, no fixed deadline, a right limited in scope or not yet enforceable. +5 for provider or regional portals documented on an official or regulator page; +10 if an official figure shows wide use. Clamp 30 to 60. Cross-wave check: COL (wave 1) = 45 + 5 (free complete electronic copy) - 5 (no deadline) = 45, its current score.
4. **Research arithmetic, no individual consent and no general opt-out (finding 4).** Base 40, +3 per documented safeguard class, cap 50: (a) a legal permit or ethics body controls access; (b) a secure processing environment or statutory secrecy on released data; (c) a legal penalty for re-identification or misuse; (d) a public register of approved uses; (e) a partial opt-out or consent route covering part of the data. Wave 1 sits at 42 to 50 in this regime; the 43 now sit at 43 to 49.
5. **EU clinical AI (finding 3).** EU law only = 50, +4 per verified national addition. The wave 1 ruling holds for all 64: a law that only designates AI Act authorities (and the sandboxes and complaint routes the AI Act itself requires) is not a national addition.
6. **Confidence (findings 6 and 7).** Mechanical, for the 43 only (wave 1 was set on 1 Oct): high = 7 or 8 categories with a primary source (official, legal_text, intergov in `analysis/source_classes.csv`), medium = 5 or 6, low = 4 or fewer. Any summary or detail text in the audit's phrase family ("not verified", "unverified", "could not verify/confirm/check", "not confirmed", "not checked"; the same pattern as Validation in `scripts/dti_evidence.py`) caps the label at medium. That is the wave 1 rule (all 16 medium wave 1 files carry such a phrase). Known limit: other phrasings, such as "we did not verify", escape the cap, as they escape Validation; AUT, GBR and NOR keep or reach high only because their one such line is worded that way. No file carries an override note.

Two scopes are deliberate: the score rule uses key admissions read per cell (definition 2); the confidence cap is the mechanical phrase match (definition 6).

## Every score change

| Country | Field | Old -> new | Finding | Reason (evidence from the cell) |
|---|---|---|---|---|
| Ireland (IRL) | categories.access.score | 24 -> 45 | F1 | Free access by FOI or GDPR subject access request, used at scale (nearly 100,000 HSE requests in three years, RTE): a meaningful, used right, 45. No deadline stated in the cited sources (Citizens Information page opened 1 Oct 2026 gives none), so no +5; the HSE app shows no record, so no portal credit. |
| Argentina (ARG) | categories.access.score | 55 -> 50 | F2 | Certified copy on simple request (Ley 26.529), free access (Ley 27.706) and a 10-day deadline (Ley 25.326 art. 14): 45+5. The unverified item is a national portal, which would lift the cell out of this band, so it earns nothing and does not cap. |
| Canada (CAN) | categories.access.score | 55 -> 45 | F2 | 30-day deadline but cost-recovery fees (IPC Ontario; Alberta $25): 45-5. Government portals in BC and Alberta documented on official pages: +5. Health Canada says 'less than 40%' access electronically, a ceiling, not proof of wide use, so not +10. |
| Chile (CHL) | categories.access.score | 60 -> 50 | F2 | Free copy of the complete record in a structured format (Ley 20.584 art. 13, iura.cl): 45+5. No provider portal documented: +0. |
| Egypt (EGY) | categories.access.score | 30 -> 35 | F2 | Law 151/2020 access right, but the requester bears fees (cap EGP 20,000) and compliance is not due until 1 Nov 2026: 45-5-5. |
| Ghana (GHA) | categories.access.score | 33 -> 35 | F2 | Act 843 s.35, 40-day deadline, but a fee is allowed (s.32): 45-5. The 2025 LHIMS shutdown cut patients off from records (Graphic Online, Ghana Sentinel), a practical enforcement failure: -5. |
| Kenya (KEN) | categories.access.score | 40 -> 45 | F2 | Data Protection Act right; regulator guidance asks for 7 days in machine-readable form (ODPC); fee not stated: 45. SHA/Afya Yangu view shown only by one news case, no usage figure: +0. |
| Mexico (MEX) | categories.access.score | 30 -> 40 | F2 | LFPDPPP ARCO rights with a 20+15 day deadline (diputados.gob.mx), but the cited right binds private holders only and NOM-004 keeps the record as institutional property: 45-5. |
| Nigeria (NGA) | categories.access.score | 30 -> 40 | F2 | NDPA 2023 right of access and portability with no fixed deadline ('without undue delay'): 45-5. No fee or portal evidence either way. |
| New Zealand (NZL) | categories.access.score | 55 -> 50 | F2 | HIPC rule 6 right, charges only in limited cases, no deadline in the cell: 45. Provider portal (Manage My Health) documented by the Privacy Commissioner, no usage figure (the release gives only the ~100,000 breach count): +5. |
| Austria (AUT) | categories.ai.score | 62 -> 50 | F3 | Text: 'No Austria-specific clinical AI rule was verified.' EU law only. |
| Belgium (BEL) | categories.ai.score | 58 -> 50 | F3 | Text: no Belgian clinical AI rules verified; eHealth plan only 'mentions advanced analytics'. |
| Germany (DEU) | categories.ai.score | 58 -> 50 | F3 | Text: no German AI-specific clinical rule verified. DiGA reimburses apps generally; it is not an AI rule. |
| France (FRA) | categories.ai.score | 58 -> 50 | F3 | Text: French health-specific AI rules not verified. Health Data Hub hosting is a data-location fact, not a clinical-AI rule. |
| Ireland (IRL) | categories.ai.score | 56 -> 50 | F3 | Text: no Irish-specific clinical AI rules verified. |
| Denmark (DNK) | categories.ai.score | 52 -> 50 | F3/W1 | Bill L 111 sets up supervision of the AI Act (authority designation) and is only 'proposed'; no other national addition. 52 is not a value the anchor can produce. |
| Spain (ESP) | categories.ai.score | 62 -> 50 | F3/W1 | AESIA is Spain's AI Act supervisory authority; the AI transparency clauses sit in a draft health law that is not in force. |
| Poland (POL) | categories.ai.score | 60 -> 50 | F3/W1 | The AI Systems Act creates KRiBSI to enforce the AI Act, with complaints and sandboxes the AI Act itself requires; text adds 'No Poland-specific rule for clinical AI was verified.' |
| Denmark (DNK) | categories.research.score | 55 -> 49 | F4 | (a) ethics approval; (b) Secure Research Platform; (e) Tissue Use Register opt-out for samples and genetic data. |
| Estonia (EST) | categories.research.score | 64 -> 49 | F4 | (a) ethics and ministry authorisation; (b) secure environment, aggregated results only; (e) Biobank broad consent with withdrawal for 210,000 people. The 2016 opt-out claim is unconfirmed and earns nothing. |
| South Korea (KOR) | categories.research.score | 45 -> 43 | F4 | (c) unauthorised re-identification is a crime (up to 3 years). Risk assessment before use is not a body or register. |
| Norway (NOR) | categories.research.score | 64 -> 43 | F4 | (a) Health Data Service permits with statutory 30/60-day deadlines and REK ethics approval. No secure environment, penalty or register documented. |
| Sweden (SWE) | categories.research.score | 60 -> 46 | F4 | (a) release only for research approved under the Ethical Review Act 2003:460; (b) strong statistical secrecy on register data. 'We found no general right' to opt out is a finding, not an admission. |
| United States (USA) | categories.research.score | 50 -> 46 | F4 | (a) IRB or privacy board waiver criteria under 164.512(i); (e) Part 2 keeps stricter consent for substance use records. De-identified data outside HIPAA earns nothing. |
| South Korea (KOR) | categories.privacy.score | 78 -> 66 | F5 | No health-sector PIPC decision found: the PIPC English press releases from Sep 2022 to Sep 2026 (about 250 titles) list no sanction of a hospital, clinic, pharmacy or health app. Scored on the general law and enforcement: top of 45-66 for the record Coupang penalty (KRW 624.7bn, PIPC 11 Jun 2026) and the 10% revenue tier. The unverified Medical Service Act localisation claim is a health-sector fact and earns nothing. |
| United Arab Emirates (ARE) | categories.access.score | 58 -> 54 | F7 | Summary: 'No verified legal right to a full chart copy'. Without a verified right no access sub-anchor fits (anchor gap: portal without a right); RUBRIC Mixed, lower half 45-54. |
| Argentina (ARG) | categories.clinical.score | 35 -> 34 | F7 | Summary: 'national reach is unverified'. RUBRIC Weak, lower half 25-34. |
| Australia (AUS) | categories.control.score | 65 -> 55 | F7 | 60-80 needs a patient-visible access log; detail: 'Access codes and access history features could not be confirmed'. Without the log the verified facts (ask providers not to upload) support 40-55; top of it. |
| Australia (AUS) | categories.research.score | 55 -> 54 | F7 | Summary: the secondary-use framework and its opt-out were not verified, so no regime is established (opt-out band not earned). RUBRIC Mixed, lower half 45-54. |
| Belgium (BEL) | categories.privacy.score | 60 -> 55 | F7 | Summary: 'We did not verify recent enforcement or breach figures'. No health-sector evidence, so the general-law band 45-66; key admission keeps it in the lower half (45-55). |
| Brazil (BRA) | categories.commercial.score | 60 -> 54 | F7 | Summary: 'Enforcement against data brokers and health apps was not verified'. RUBRIC Mixed, lower half 45-54. |
| Finland (FIN) | categories.access.score | 84 -> 83 | F7 | Near-full national record band 76-90 names export; detail: 'machine-readable export of the full record was not verified'. Lower half 76-83. |
| Ireland (IRL) | categories.privacy.score | 60 -> 55 | F7 | Summary: 'We did not verify recent health breach enforcement'. No health-sector evidence: general-law band 45-66, lower half 45-55. |
| Israel (ISR) | categories.control.score | 62 -> 55 | F7 | 60-80 needs a patient-visible log; detail: 'We did not verify a patient-facing log'. Opt-out from the exchange is verified: 40-55, top of it. |
| Mexico (MEX) | categories.research.score | 35 -> 34 | F7 | Summary: 'not verified in detail'. RUBRIC Weak, lower half 25-34. |
| Netherlands (NLD) | categories.research.score | 56 -> 54 | F7 | Summary: current Dutch research consent rules 'not fully verified'; the opt-out and permits start in 2029. No current regime established: RUBRIC Mixed, lower half 45-54. |
| New Zealand (NZL) | categories.clinical.score | 35 -> 34 | F7 | Summary: 'cross-provider access in practice was not verified'. RUBRIC Weak, lower half 25-34. |
| Rwanda (RWA) | categories.journey.score | 55 -> 54 | F7 | Summary: 'national completion is not verified'. RUBRIC Mixed, lower half 45-54. |
| Saudi Arabia (SAU) | categories.clinical.score | 62 -> 54 | F7 | Summary: clinician use of cross-provider records 'was not verified'. RUBRIC Mixed, lower half 45-54. |
| Thailand (THA) | categories.clinical.score | 55 -> 54 | F7 | Summary: 'use rates were not verified'. RUBRIC Mixed, lower half 45-54. |
| Taiwan (TWN) | categories.ai.score | 45 -> 42 | F7 | Summary: health-specific AI device rules 'were not verified'. Verified: AI Basic Act principles with no penalties = non-EU guidance-only band 35-50, lower half 35-42. |
| Vietnam (VNM) | categories.clinical.score | 40 -> 34 | F7 | Summary: a clinician view of the full record from other hospitals 'was not verified'. RUBRIC Weak, lower half 25-34. |
| Rwanda (RWA) | categories.access.score | 48 -> 45 | F7 (F2 arithmetic) | 30-day right under Law 058/2021, fee not stated: 45. e-Ubuzima patient view rests on news only and usage 'could not verify': no portal credit; lower half of 40-50. |
| Belgium (BEL) | categories.research.score | 52 -> 43 | F7 (and F4 regime) | Own text: 'We found no individual opt-out', so the no-consent band 40-50; summary admission keeps it in the lower half (40-45). (a) HDA access requests with ethics review: 43. |

## Confidence changes

| Country | Old -> new | Categories with a primary source | Note |
|---|---|---|---|
| Argentina (ARG) | low -> medium | 8 of 8 | capped at medium by an unverified-fact admission |
| Belgium (BEL) | medium -> low | 1 of 8 |  |
| Germany (DEU) | high -> medium | 8 of 8 | capped at medium by an unverified-fact admission |
| Finland (FIN) | high -> medium | 8 of 8 | capped at medium by an unverified-fact admission |
| France (FRA) | high -> medium | 7 of 8 | capped at medium by an unverified-fact admission |
| Ghana (GHA) | low -> medium | 8 of 8 | capped at medium by an unverified-fact admission |
| Italy (ITA) | high -> medium | 8 of 8 | capped at medium by an unverified-fact admission |
| Kenya (KEN) | medium -> low | 4 of 8 |  |
| South Korea (KOR) | medium -> low | 4 of 8 |  |
| Mexico (MEX) | medium -> low | 4 of 8 |  |
| Norway (NOR) | medium -> high | 8 of 8 |  |
| New Zealand (NZL) | low -> medium | 7 of 8 | capped at medium by an unverified-fact admission |
| Philippines (PHL) | low -> medium | 8 of 8 | capped at medium by an unverified-fact admission |
| Rwanda (RWA) | low -> medium | 6 of 8 |  |
| Saudi Arabia (SAU) | medium -> low | 4 of 8 |  |
| Thailand (THA) | medium -> low | 4 of 8 |  |
| Taiwan (TWN) | high -> medium | 5 of 8 |  |
| United States (USA) | high -> medium | 6 of 8 |  |

Six go up: NOR to high (8 primary categories; its only admission, about an opt-out, uses a phrasing outside the audit's phrase family), and ARG, GHA, NZL, PHL, RWA from low to medium on their primary sourcing (6 to 8 categories). The Philippines is the awkward case: 6 of its 7 journey steps are "unknown", but its cells cite primary law, which is what the rule counts. Six lose high: DEU, FIN, FRA and ITA have 7 or 8 primary categories but one or two genuine admissions (capped at medium); TWN (5) and USA (6) fall on the primary count alone. Six fall to low, exactly the audit's list: BEL, KEN, KOR, MEX, SAU, THA; EGY stays low (4 categories).

## Cells that stayed, and why

**Finding 2 (access):**
- South Africa 40: POPIA s.23 right with a prescribed fee: 45 - 5 = 40.
- Philippines 40: right to a copy in a structured format (RA 10173 s.16, s.18), but the 30-day deadline and fee cap are only in a September 2026 draft circular: no fixed deadline, 45 - 5 = 40. The unverified national portal would lift the cell, so it does not cap.

**Finding 3 (ai):** Sweden, Estonia, Finland and the Netherlands were already 50 with no verified national addition. Finland's Secondary Use Act limits on AI training are a data rule, not a clinical-AI rule.

**Finding 4:** every listed cell moved.

**Finding 5:** Korea's research cell moved under finding 4; Korea keeps its other scores.

**Finding 6 (Belgium):** access, control, journey, commercial and clinical kept their scores; only ai (finding 3), research and privacy (finding 7) moved. Belgium is now low confidence (1 of 8 categories with a primary source).

**Finding 7, summary admissions already inside the lower half of their band:** EST access 82 (76-90; export not verified), SGP commercial 65 (Strong 65-74), CHL research 45, VNM research 45, RWA clinical 50 (Mixed 45-54), ARG control 45 (control 40-47), SAU control 40, ARG research 30, CHN research 30, IND research 30, IRL control 28, KEN clinical 30, PHL journey 28, PHL clinical 30 (Weak 25-34), AUS ai 55 (non-EU device band 55-62), POL research 42 (40-45).

**Finding 7, admissions that do not move the score under definition 2:**
- DNK access 78: time limits and export not verified, already in 76-83.
- SWE access 74, VNM access 60, KOR access 65: export or facility counts are not criteria of the 60-75 band (same as TUR 74 in wave 1).
- AUS access 60: usage figures not verified; already at the floor of 60-75.
- PHL access 40, ARG access 50, NZL access 50: the unverified fact is a national portal, which would lift the cell out of its band.
- SAU access 55: the PDPL right of access (30 days) and Sehhaty (over 24 million users) place it in 60-75; it sits below the band, and the rule never raises.
- CAN control 52, POL control 52, THA control 55: the unverified log would lift them into 60-80; the verified facts (lock-box, IKP consents, Health Link consent) hold 40-55.
- CHN ai 55: device registration not verified, but binding human-oversight rules are; same placement as RUS ai 55 (wave 1).
- Privacy cells with "did not verify a major breach" (AUT 75, CHE 68, ESP 62, CAN 60): an unverified breach does not inflate a score.
- Every detail-only admission in commercial, journey or clinical (for example AUS journey 70, CAN clinical 45, DEU journey 68, ITA journey 60, SGP journey 75): no sub-anchor, so only a summary admission moves these.
- PHL research 35: its own text places it in the no-consent regime (a Data Privacy Act research carve-out), whose band is 40 to 50. It sits below the band, so the cap has nothing to do; see "Needs a ruling".

## Text left as written

No summary states something the new score contradicts, so no summary was edited. One **detail** line does: `data/BEL.json` `categories.research.detail[2]` ends "Rated as mixed until verified." The cell is now 43 (Weak). The instruction limited edits to summaries, so the line is unchanged; Dustin should delete that sentence.

## Needs a ruling (not changed)

1. **USA access 66** is in the finding 2 regime (statutory right, provider-by-provider, no national record) but above the anchor's ceiling of 60. Arithmetic: 45 - 5 (cost-based fee) + 10 (ASTP: 65% offered and used online access in 2024) = 50. Moving it costs the US 3.2 overall points. It was never flagged under review, so it was left.
2. **Same-regime research cells outside 40 to 50 that were not flagged:** ESP 54 (pseudonymised use lawful without consent; opt-out only in a draft law) is above the band (arithmetic: 43). Below the band, with their own text describing research use without consent or opt-out: PHL 35, GHA 35, ARG 30, CHN 30, IND 30. The rule never raises, so these need a decision.
3. **EU AI, real national laws.** ITA 66 is Law 132/2025, a national AI law with health duties (Article 7). One addition is +4 = 54; 66 implies four. HUN 54 (wave 1) rests on Act LXXV, which wave1_check item 3 says mostly designates authorities. GRC 54 holds. The anchor needs to say whether one law with several health duties counts once.
4. **Cross-wave mismatch found in the consistency check:** LTU access 70 (wave 1) admits in its detail that portal user numbers were not verified. "To most residents" is a criterion of the 60-75 band, so under definition 2 it belongs in the lower half (60-67), like CRI 64, LVA 64, HRV 62 and SVK 62. It is a wave 1 file, so it was not edited. No other same-regime pair with the same kind of admission splits across halves.
5. **Anchor gaps.** (a) A national or regional portal with no verified legal right (ARE access, now 54 on the RUBRIC fallback). (b) A research prohibition (LIE, from wave 1). (c) Non-EU binding AI rules without verified change control (CHN 55, VNM 50, RUS 55). (d) The RUBRIC fallback halves are discontinuous: a 64 with a key admission drops to 54 while a 65 stays (SAU clinical 62 -> 54 is the largest such move).
6. **Belgium re-sourcing** was not done (HDA site behind a bot challenge). Its privacy, control, research and journey cells still need Belgian primary sources.
7. **Korea privacy source.** The PIPC's own release on the Coupang decision opens and matches the cell (KRW 624.681bn penalty, 33.22 million users plus 4.33 million third parties): https://pipc.go.kr/eng/user/ltn/new/noticeDetail.do?bbsId=BBSMSTR_000000000001&nttId=3071 . It is not a health decision, so it was not added; adding it would give KOR a fifth primary category and move it from low to medium.

8. **Finding 7 rewards silence.** AUS control (-10) and ISR control (-7) moved because their authors admitted no verified access log. Other control cells at 60 to 80 that never mention a log were not touched, since the rule acts on what a cell says. AUS's 4-place fall is entirely this. A full check of every 60-80 control cell for a cited log would remove the asymmetry.
9. **ARE access** used the RUBRIC fallback (54). Read literally, "no enforceable right" is the anchor's 15 to 35 band, which would put it near 25 (-6.6 overall). The anchor does not cover a working portal without a verified right.
10. **"Say so".** The privacy anchor asks that a general-law score say so in the text. KOR, BEL and IRL privacy summaries were not edited (summaries change only when contradicted), so that part of the anchor is unmet for all three.
11. **IRL control.** Audit finding 1 also asked for a check of Irish control against GDPR objection and restriction rights. Not in this ruling's list; still open.

## Ranking after the changes (node build.js, 1 Oct 2026)

Overall = sum of score x weight / 100, shown with Math.round; competition ranks ("4=" = tied). Only countries whose overall or rank changed are listed. Move: positive = up.

| Country | Overall (exact) | Shown | Rank | Move | Band |
|---|---|---|---|---|---|
| Finland (FIN) | 77.15 -> 76.95 | 77 -> 77 | 1 -> 1 | +0 | Strong |
| Estonia (EST) | 72.00 -> 71.25 | 72 -> 71 | 2 -> 2 | +0 | Strong |
| Denmark (DNK) | 70.20 -> 69.80 | 70 -> 70 | 3 -> 3 | +0 | Strong |
| Taiwan (TWN) | 68.95 -> 68.80 | 69 -> 69 | 4= -> 4= | +0 | Strong |
| Austria (AUT) | 69.15 -> 68.55 | 69 -> 69 | 4= -> 4= | +0 | Strong |
| Israel (ISR) | 69.45 -> 68.05 | 69 -> 68 | 4= -> 6= | -2 | Strong |
| Hungary (HUN) | 67.95 -> 67.95 | 68 -> 68 | 7= -> 6= | +1 | Strong |
| France (FRA) | 67.80 -> 67.40 | 68 -> 67 | 7= -> 8 | -1 | Strong |
| Belgium (BEL) | 66.60 -> 65.00 | 67 -> 65 | 9 -> 9= | +0 | Strong |
| Sweden (SWE) | 65.60 -> 64.90 | 66 -> 65 | 10 -> 9= | +1 | Strong |
| Norway (NOR) | 65.05 -> 64.00 | 65 -> 64 | 11 -> 11= | +0 | Strong->Mixed |
| Portugal (PRT) | 64.10 -> 64.10 | 64 -> 64 | 12= -> 11= | +1 | Mixed |
| Netherlands (NLD) | 64.10 -> 64.00 | 64 -> 64 | 12= -> 11= | +1 | Mixed |
| Turkey (TUR) | 63.30 -> 63.30 | 63 -> 63 | 15= -> 14= | +1 | Mixed |
| Germany (DEU) | 62.90 -> 62.50 | 63 -> 63 | 15= -> 14= | +1 | Mixed |
| Australia (AUS) | 64.00 -> 61.95 | 64 -> 62 | 12= -> 16= | -4 | Mixed |
| Spain (ESP) | 62.20 -> 61.60 | 62 -> 62 | 18= -> 16= | +2 | Mixed |
| Latvia (LVA) | 61.50 -> 61.50 | 62 -> 62 | 18= -> 16= | +2 | Mixed |
| Slovenia (SVN) | 61.95 -> 61.95 | 62 -> 62 | 18= -> 16= | +2 | Mixed |
| Singapore (SGP) | 61.70 -> 61.70 | 62 -> 62 | 18= -> 16= | +2 | Mixed |
| Iceland (ISL) | 62.30 -> 62.30 | 62 -> 62 | 18= -> 16= | +2 | Mixed |
| South Korea (KOR) | 63.15 -> 61.25 | 63 -> 61 | 15= -> 22= | -7 | Mixed |
| United Arab Emirates (ARE) | 61.35 -> 60.55 | 61 -> 61 | 23= -> 22= | +1 | Mixed |
| Lithuania (LTU) | 60.80 -> 60.80 | 61 -> 61 | 23= -> 22= | +1 | Mixed |
| Liechtenstein (LIE) | 61.30 -> 61.30 | 61 -> 61 | 23= -> 22= | +1 | Mixed |
| Poland (POL) | 59.70 -> 59.20 | 60 -> 59 | 26= -> 28= | -2 | Mixed |
| Luxembourg (LUX) | 58.80 -> 58.80 | 59 -> 59 | 29= -> 28= | +1 | Mixed |
| Bulgaria (BGR) | 59.45 -> 59.45 | 59 -> 59 | 29= -> 28= | +1 | Mixed |
| Malta (MLT) | 59.00 -> 59.00 | 59 -> 59 | 29= -> 28= | +1 | Mixed |
| Saudi Arabia (SAU) | 53.10 -> 52.30 | 53 -> 52 | 39 -> 39= | +0 | Mixed |
| Switzerland (CHE) | 52.20 -> 52.20 | 52 -> 52 | 40= -> 39= | +1 | Mixed |
| Thailand (THA) | 51.55 -> 51.45 | 52 -> 51 | 40= -> 41= | -1 | Mixed |
| United States (USA) | 50.95 -> 50.75 | 51 -> 51 | 43 -> 41= | +2 | Mixed |
| Canada (CAN) | 52.35 -> 50.35 | 52 -> 50 | 40= -> 43 | -3 | Mixed |
| Brazil (BRA) | 49.25 -> 48.65 | 49 -> 49 | 44= -> 44= | +0 | Mixed |
| Indonesia (IDN) | 47.45 -> 47.45 | 47 -> 47 | 47= -> 47 | +0 | Mixed |
| Rwanda (RWA) | 47.00 -> 46.25 | 47 -> 46 | 47= -> 48= | -1 | Mixed |
| Vietnam (VNM) | 46.95 -> 46.35 | 47 -> 46 | 47= -> 48= | -1 | Mixed |
| Russia (RUS) | 44.85 -> 44.85 | 45 -> 45 | 51= -> 50 | +1 | Mixed |
| Chile (CHL) | 46.25 -> 44.25 | 46 -> 44 | 50 -> 51= | -1 | Mixed->Weak |
| New Zealand (NZL) | 44.75 -> 43.65 | 45 -> 44 | 51= -> 51= | +0 | Mixed->Weak |
| South Africa (ZAF) | 43.55 -> 43.55 | 44 -> 44 | 53 -> 51= | +2 | Weak |
| India (IND) | 42.00 -> 42.00 | 42 -> 42 | 55= -> 55 | +0 | Weak |
| Ireland (IRL) | 37.60 -> 40.75 | 38 -> 41 | 57= -> 56 | +1 | Weak |
| Argentina (ARG) | 41.50 -> 40.40 | 42 -> 40 | 55= -> 57 | -2 | Weak |
| Kenya (KEN) | 38.05 -> 39.05 | 38 -> 39 | 57= -> 58 | -1 | Weak |
| China (CHN) | 37.75 -> 37.75 | 38 -> 38 | 57= -> 59 | -2 | Weak |
| Ghana (GHA) | 34.85 -> 35.25 | 35 -> 35 | 60= -> 60= | +0 | Weak |
| Nigeria (NGA) | 31.60 -> 33.60 | 32 -> 34 | 62 -> 62 | +0 | Weak |
| Egypt (EGY) | 30.05 -> 31.05 | 30 -> 31 | 63 -> 63= | +0 | Weak |
| Mexico (MEX) | 29.25 -> 31.20 | 29 -> 31 | 64 -> 63= | +1 | Weak |

Bands: Strong 11 -> 10, Mixed 41 -> 40, Weak 12 -> 14. Norway drops from Strong to Mixed (65.05 -> 64.00); Chile and New Zealand drop from Mixed to Weak. Finland still leads at 77; the median is still 58. Low-confidence countries on the page are now Belgium, Egypt, Kenya, Mexico, Saudi Arabia, South Korea and Thailand.

## Evidence grade (scripts/dti_evidence.py)

`RETEST` and `OTHER_REVIEW` are now empty; the mechanism stays. 29 of 29 tests pass. Test 7b now plants its finding-6 cell explicitly instead of relying on the real list. Induced failure: a copy of the module with Stability forced to 100 fails test 7a, so the suite still catches a broken Stability. Grades rose 0.15 to 0.75 points in 23 countries (Stability 40 -> 100 on the cleared cells); one tier changed, ARG Gold 89.67 -> Platinum 90.28.

---

# 2 Oct: peer review round

Source of the requests: analysis/review/SYNTHESIS.md (items 6, 7, 9), REVIEW_methods.md (M2, M7, M8), REVIEW_policy.md (M1, M2, M4, M5), and the blind reliability study analysis/reliability/RELIABILITY.md (its five largest disagreements). Applied under JAS's standing approval. Base: `data/` at commit b8bc315 (65 countries, Albania added 1 Oct). Definitions 1 to 6 above still apply; definition 6 is widened below.

This round resolves three items in the 1 Oct "Needs a ruling" list: 1 (USA access), 4 (LTU access) and 9 (ARE access).

Totals: 6 score changes, 3 controlModel changes, 3 confidence changes, text and source edits in 2 Ireland cells.

Pages opened 2 Oct 2026 for this round: the EDPB data protection guide, "Respect individuals' rights" (https://www.edpb.europa.eu/sme/be-compliant/respect-individuals-rights_en: "the controller must respond within one month", "Do not charge a fee"); the Irish Statute Book commencement table for the Health Information Act 2026 (https://www.irishstatutebook.ie/eli/isbc/2026_10.html) and the Act's text (ss. 13 to 16); the Council of the EU Portugal Digital Decade report and the OECD Portugal Country Health Profile 2025 (both PDFs); the recmedia.mx article cited by MEX ai; gob.mx/cofepris (front page and press archive). EUR-Lex served a bot challenge to every request, so the GDPR text itself is cited through the EDPB guide, an official EU body page. The CJEU judgment C-307/22 page (InfoCuria) could not be read, so it is named in the anchor but not cited in any cell. No house data service applies (no service holds legal text).

## Score changes

| Country | Field | Old -> new | Item | Reason (evidence) |
|---|---|---|---|---|
| United States (USA) | categories.access.score | 66 -> 50 | Panel M5/M8, synthesis 9 | Same regime as CAN (statutory right, provider by provider, no national record). Definition 3: 45, -5 for the cost-based fee (45 CFR 164.524, eCFR), +10 for provider portals in wide use (ASTP 2024: 65% offered and used online access). No +5: the right is not free. See "Deviation" below. |
| Ireland (IRL) | categories.access.score | 45 -> 50 | Panel M1, synthesis 6 | GDPR binds Ireland: one-month deadline (Art. 12(3)) and no fee for a normal request (EDPB guide, opened). That is the definition 3 "+5 free with a fixed deadline", now credited by law in every EU/EEA cell (new anchor line). 45 + 5 = 50. |
| Lithuania (LTU) | categories.access.score | 70 -> 67 | Panel M8 | Detail admits "Portal user numbers ... were not verified". Wave 1 treated unverified portal use as key in the 60-75 band (CRI 64, HRV 62, SVK 62, LVA 64, RUS 60), so LTU goes to the top of the lower half, 67. |
| UAE (ARE) | categories.access.score | 54 -> 35 | Reliability study #3 | Own text: no verified legal right to a copy, and Federal Decree-Law 45/2021 excludes health data. Anchor band for "no enforceable right" is 15 to 35. The DOH Abu Dhabi Sahatna app shows Malaffi visits, diagnoses, labs, prescriptions and vaccinations, which lifts it to the top of that band (35), not out of it; it serves one emirate. New anchor line records this. |
| Russia (RUS) | categories.privacy.score | 35 -> 34 | Panel M2 (72-cell re-read) | Detail: "Health-sector enforcement decisions were not verified." Enforcement is a criterion the privacy anchor names; RUBRIC Weak, lower half 25-34. |
| Albania (ALB) | categories.journey.score | 40 -> 34 | Panel M2 (72-cell re-read) | Summary: the electronic public hospital plan "was not verified as done". Journey has no sub-anchor, so a summary admission moves it to the lower half of RUBRIC Weak (25-34), as ARG, NZL and VNM clinical were moved on 1 Oct. |

**Deviation from the instruction for USA.** The instruction said 66 -> 60, citing the regime ceiling. 60 is the maximum the anchor allows, not the value it gives: the same arithmetic gave Canada 45 (fee -5, portals +5). For the US it gives 50 (fee -5, portals +10). Setting 60 would credit the US with a +5 it does not earn under definition 3 and break "same regime, same band" against Canada. Applied 50 (the value proposed in the 1 Oct "Needs a ruling" list, which JAS's approval covers). If JAS wants 60, the anchor needs a written reason for the extra +5 (for example, information-blocking rules and certified API access as a sub-anchor), applied to every country it fits.

## Text and source edits (Ireland)

- `IRL categories.access`: source `about.hse.ie` (HSE app page) replaced by the EDPB guide (4-source limit). detail[3] now attributes the HSE app facts to Citizens Information, which lists them (the "launched February 2025" date was only on the dropped page and was removed). New detail[4] states the GDPR deadline and no-fee rule from the EDPB guide. Summary unchanged.
- `IRL categories.control` (score stays 28): the "commencement was not verified" sentence is replaced with the Statute Book record. Sections 14 (restrict access) and 15 (free information on every access, including automatic notifications) carry no commencement date; ss. 1 to 6, 10 to 12, 16 and 19 to 24 commenced 17 August 2026 (S.I. No. 360 of 2026). The rights are legislated but not in force, so they earn nothing under the control anchor, and 28 stays. The commencement table was added as a source. An Irish practitioner should confirm before deposit (panel M2).
- `analysis/url_check.csv`: the two new URLs added as ok (HTTP 200, 2 Oct 2026 10:18Z, this Mac's network); the dropped HSE row removed. `analysis/source_classes.csv` regenerated by `analysis/sources.py`; the only row changes are these three URLs and the three confidence labels.

## controlModel anchor and changes

The anchor is now in docs/RUBRIC_V1_1_ANCHORS.md ("controlModel"). In short: Shared needs at least one working, live choice over who sees the record in care (opt-in, opt-out or blocking). An access log alone, a choice on paper or in an unbuilt system, a pilot, or a research-only opt-out does not count. With no such choice, the class is State if a live government-run national record or exchange used for care holds the data by default, otherwise Institutional. Individual needs a person-held record with prior consent for every flow; no country meets it.

All 65 checked against their control cells:

| Country | Old -> new | Reason (cell text) |
|---|---|---|
| Cyprus (CYP) | Shared -> State | The opt-out, locking and per-provider permissions "belong to a national record bank that is not yet built"; GeSY today offers a log only and "a way to hide data in GeSY was not verified". GeSY is the state system. |
| Greece (GRC) | Shared -> State | The law logs access and informs the patient; the record is "unified and mandatory nationally" and "a per-doctor consent or opt-out in the live platform is not verified". |
| Indonesia (IDN) | Shared -> State | The 6-digit patient code exists only at two hospitals since 1 September 2026 (a pilot); Regulation 24/2022 Art. 35 still opens records without consent; SATUSEHAT is the ministry's national platform. |

Kept, with the deciding fact:
- **GBR State.** The national data opt-out covers research and planning only. No choice over who sees the record in care is in the cell, and NHS England's platform holds data for direct care. This matches CYP and GRC at the same control score.
- **TWN Shared.** The secondary-use opt-out alone would not qualify, but MediCloud lookups need the patient's card present.
- **SAU State.** The exchange opt-out's legal status is unclear and was not verified in Sehhaty, so it is not a live choice. ARE stays Shared because the Riayati policy's per-facility blocking is verified on the MOHAP policy.
- **Other edge cases.** CRI stays State (a log on request only). SGP and SVK stay Shared (restriction and grant/withdraw are live). CHE stays Shared (a voluntary EPD, open to anyone). CAN stays Shared (the Ontario lock-box is in force). PHL and JPN stay Institutional (state claims reporting is not a care record). MEX stays Institutional (the 2026 shared record is not live until 2027).
- **The rest.** All other labels already met the anchor.

Counts after the round: Shared 39, State 15, Institutional 11, Individual 0. The control score and the class can still disagree by design: CRI (State, control 48) outscores SGP (Shared, 45).

## Item 4: the 72 upper-half cells, re-read with definition 2 (all 65 countries)

The panel's screen (the audit phrase family, upper half of the RUBRIC five-band) reproduces exactly: 72 cells. Two moved (RUS privacy, ALB journey, above). LTU access 70 was not in the 72 (it is lower half of RUBRIC Strong) and moved as panel M8. The other 70 stay, grouped by reason:
- **Lower half of their v1.1 sub-anchor band, so the screen overcounts (as the panel itself noted):** AUS access 60, BGR access 62, CRI 64, HRV 62, LVA 64, ROU 60, RUS 60, SVK 62 (60-75); DNK 78, EST 82, FIN 83 (76-90); CZE control 64, ROU 62 (60-70); AUS control 55, SAU 40, THA 55, IND 55, JPN 40 (40-55; log admissions would lift them); BEL research 43, BGR 44, GRC 44, LIE 42, POL 42, RUS 42, IDN 40 (40-45); BEL privacy 55, IRL privacy 55 (45-55); AUS ai 55, CHN 55, RUS 55 (non-EU 55-62); TWN ai 42, UKR ai 40 (35-42).
- **The unverified fact would lift the cell into a higher band, so it earns nothing and does not cap:** ARG ai 20, PHL ai 20, PHL access 40, IDN access 55, BRA access 55, SAU access 55, VNM access 60 (export is not a 60-75 criterion).
- **Detail-only admission in a category with no sub-anchor (wave 1 precedent: ISL journey 76, HRV clinical 64, GRC commercial 62):** BGR clinical 62, BRA journey 55, CHE commercial 58, EGY commercial 35, ESP journey 62, GRC commercial 62, HRV clinical 64, IDN commercial 40, IDN journey 60, IND clinical 35, IRL journey 24, ISL journey 76, ITA journey 60, KOR commercial 55, KOR journey 62, NZL journey 35, PHL commercial 40, RUS commercial 40, SGP journey 75, TUR commercial 55, TUR journey 80, VNM commercial 55, VNM journey 58.
- **Unverified negative or peripheral fact that does not inflate the score:** AUS privacy 60 (reform not passed), CAN privacy 60 (breach counts), CHN privacy 40 (localisation), FRA privacy 58 (leak source), IND privacy 40 (exemptions), SVN privacy 62 (inspection outcome).
- **Below its regime band (the rule only caps):** PHL research 35, SGP research 55 (gap "not verified either way").

The screen also misses phrasings outside the family ("did not verify", "no verified"). I read those on 1 Oct for the 43 and today for wave 1 and Albania. Only ALB journey's summary qualified, and it was already caught.

A per-cell `regime` and `keyFactUnverified` field (panel M2a) is not built. The re-read above is still one reader's judgment.

## Confidence (all 65, recomputed)

Definition 6 is widened to close the wording gap the panel found (M7). The cap now also matches "did not verify", "no verified", "not reviewed", "not opened", "could not open" and "not fully/separately verified". "Could not find" and "not found" are statements of absence and do not cap.

| Country | Old -> new | Why |
|---|---|---|
| Austria (AUT) | high -> medium | 8 primary categories; privacy "We did not verify a major Austrian health-data breach" now caps. |
| United Kingdom (GBR) | high -> medium | 8 primary categories; commercial "We did not verify a statutory ban" now caps. |
| Norway (NOR) | high -> medium | 8 primary categories; research "We did not verify a general right ... to opt out" now caps. |

This is a rule change, not only a recomputation. The Validation dimension in `scripts/dti_evidence.py` deliberately stays on the narrower 1 Oct family, so evidence grades did not move; the two patterns now differ, and the 1 Oct definition 6 sentence ("the same pattern as Validation") describes 1 Oct only.

All other 62 labels are unchanged by the recomputation, including IRL (medium; it still carries admissions in privacy and journey). High is now Hungary and Portugal only. Low: BEL, EGY, KEN, KOR, MEX, SAU, THA.

## Reliability-study items

- **MEX ai 20, kept.** The recmedia.mx article (opened) says COFEPRIS issued 2025 guidelines for AI in diagnostic imaging and decision support, and authorised a first high-technology software product in May 2025. I could not find or open the COFEPRIS text: gob.mx serves a bot challenge to curl, and through a page fetch neither the COFEPRIS front page nor its press archive lists it. A news report is not a primary source, so the score stays in the "nothing" band. If Dustin opens the COFEPRIS guideline, the cell moves to the guidance band, 35 to 42 (lower half while change control is unverified).
- **PRT access 70 and journey 68, kept.**
  - The Council report (ST 10407/25 ADD 23) opens and shows "Access to e-Health records ... 88.1 ... 82.7".
  - The OECD Portugal profile 2025 opens and supports, word for word: 40% of adults accessed their record online in 2024 against an EU average of 28%, with a 62% against 19% education gap; SNS24 gives vaccination records, e-prescriptions, sick leave, living wills, appointments, and lab orders and results; SPMS supplies "every public provider - and most private ones" with a common data centre, network and software; "no legal requirement for private healthcare providers to make patient data electronically available".
  - The ACSS RSE manual did not resolve from this network today (DNS failure); it was ok in the 1 Oct link check.
  - The rater's low scores came from unreadable PDFs, not from the evidence.

## Ranking after this round (node build.js, 2 Oct 2026)

Only countries whose overall or rank changed. Move: positive = up.

| Country | Overall (exact) | Shown | Rank | Move | Band |
|---|---|---|---|---|---|
| Lithuania (LTU) | 60.80 -> 60.20 | 61 -> 60 | 22= -> 24= | -2 | Mixed |
| Croatia (HRV) | 60.35 -> 60.35 | 60 -> 60 | 26= -> 24= | +2 | Mixed |
| Italy (ITA) | 60.40 -> 60.40 | 60 -> 60 | 26= -> 24= | +2 | Mixed |
| Luxembourg (LUX) | 58.80 -> 58.80 | 59 -> 59 | 28= -> 27= | +1 | Mixed |
| Poland (POL) | 59.20 -> 59.20 | 59 -> 59 | 28= -> 27= | +1 | Mixed |
| Bulgaria (BGR) | 59.45 -> 59.45 | 59 -> 59 | 28= -> 27= | +1 | Mixed |
| Malta (MLT) | 59.00 -> 59.00 | 59 -> 59 | 28= -> 27= | +1 | Mixed |
| Slovakia (SVK) | 57.55 -> 57.55 | 58 -> 58 | 32 -> 31 | +1 | Mixed |
| United Arab Emirates (ARE) | 60.55 -> 56.75 | 61 -> 57 | 22= -> 32= | -10 | Mixed |
| Greece (GRC) | 57.00 -> 57.00 | 57 -> 57 | 33= -> 32= | +1 | Mixed |
| Czechia (CZE) | 57.40 -> 57.40 | 57 -> 57 | 33= -> 32= | +1 | Mixed |
| Thailand (THA) | 51.45 -> 51.45 | 51 -> 51 | 41= -> 41 | +0 | Mixed |
| Canada (CAN) | 50.35 -> 50.35 | 50 -> 50 | 43 -> 42 | +1 | Mixed |
| Brazil (BRA) | 48.65 -> 48.65 | 49 -> 49 | 44= -> 43= | +1 | Mixed |
| Ukraine (UKR) | 48.80 -> 48.80 | 49 -> 49 | 44= -> 43= | +1 | Mixed |
| United States (USA) | 50.75 -> 47.55 | 51 -> 48 | 41= -> 45= | -4 | Mixed |
| Japan (JPN) | 48.00 -> 48.00 | 48 -> 48 | 46 -> 45= | +1 | Mixed |
| Russia (RUS) | 44.85 -> 44.70 | 45 -> 45 | 50 -> 50 | +0 | Mixed |
| Ireland (IRL) | 40.75 -> 41.75 | 41 -> 42 | 57 -> 55= | +2 | Weak |
| Albania (ALB) | 41.90 -> 41.00 | 42 -> 41 | 55= -> 57 | -2 | Weak |

No band changed. Russia's exact overall is now 44.70: it still shows 45 (Mixed) only because of rounding. The UAE falls 10 places and the US 4 (to 45=, 47.55). Ireland rises 2 (to 55=); it is still below Russia.

## Verifiers

- `scripts/test_dti_evidence.py`: 29 of 29 pass.
- `scripts/dti_evidence.py`: only Ireland's grade moved (88.62 -> 89.19, Gold), from the new primary sources. Liechtenstein's S3 citation is still the only author-declared class, so LIE stays provisional.
- `analysis/strain/test_strain.py`: 75 of 75 pass.
- `node build.js`: ok, 65 countries.

## Still open after this round

- **USA access 50 against the instructed 60:** see "Deviation" above. A JAS ruling decides it.
- **First-copy fee wording (panel M1):** LUX, SVN, ISL and PRT access cells describe copy fees without saying whether the first copy is free. Their scores sit in the portal bands, where the +5 does not apply, so no score moves. Their text needs a fee note from Dustin.
- **Research cells below the band:** ESP research 54 (above the band) and PHL, GHA, ARG, CHN, IND research (below the 40-50 band) still need a ruling.
- **AI increments:** ITA ai 66 and HUN ai 54 still need the ruling on how a national law counts.
- **Belgium:** still not re-sourced.
- **Korea privacy:** the PIPC Coupang source is still ready to add.
- **Not built:** the per-cell `regime` / `keyFactUnverified` fields (panel M2, M7) and the uniform check of every 60-80 control cell for a cited log.

## 2 Oct 2026: deep re-research of the original 43 countries
All 43 original countries were rebuilt from sources opened on 2 Oct 2026 and cross-checked against the rubric anchors and peer countries (method and per-country notes: docs/DEEPEN_43.md). 278 of the 344 category scores changed (an earlier count of 318 wrongly included the 6 control-model and 34 confidence-label changes; reconciled against git, commit 322ace8, by analysis/testretest/testretest.py), 6 control models changed (ARG, GBR, JPN, KEN, NZL to Shared; IRL to State) and confidence rose in most files as primary sources were added. Effect on the index: Finland stays first at 71 (was 77), one point ahead of Denmark (70), which our 4-point rule reads as a tie; the median stays 57; bands are 9 Strong, 45 Mixed, 11 Weak (was 10, 40, 15). Research-consent cells converge on the 45 to 50 anchor band, which explains most research changes. Ranking stability at that point (65 countries, uniform +/-5 model with weights): Finland first in 88.4% of 10,000 draws. The calibrated model and the 196-country data supersede this; see analysis/robustness/ROBUSTNESS.md.

## 2 Oct 2026: Vatican City keys model reviewed (QA question)
QA asked whether Vatican City should be State rather than Institutional, given a state polyclinic and a state staff health fund. Under the keys-model anchors (docs/RUBRIC_V1_1_ANCHORS.md), State needs a live, government-run national record or exchange used for care that holds the data by default. The file records none: the Directorate of Health and Hygiene (DSI) polyclinic keeps its own records, outside hospitals keep theirs, and no electronic record or exchange links them. A state-run provider holding its own files is provider-by-provider holding, so the class stays **Institutional**. No score changes. Wording fixes the same day: the data protection complaint "ends in a final order; separate court action remains available"; "DSI" spelled out where the laws list first uses it.

## 2 Oct 2026: confidence labels recomputed under rule 4 (JAS ruling)
Second-round methods review (analysis/review/REVIEW2_methods.md, M2) found the confidence column did not follow the rule the paper printed, and that no script set or checked it. JAS ruled: apply the printed rule and add a real low tier. The definition was written into RUBRIC.md and DECISION_RULES.md (rule 4) before any label was recomputed: high = 7 or 8 categories cite a primary source and none admits an unverified fact; low = 4 or more of the 8 categories weak (no primary source, or a text admission that a fact was not verified); medium otherwise. `scripts/confidence.py --write` set every label; no score changed. Split before: 70 high, 128 medium, 0 low. After: 27 high, 105 medium, 66 low. 103 labels changed: 37 high to medium, 6 high to low (ARE, BHS, BRB, GNB, GTM, NPL), 60 medium to low. Per-country before and after, primary-source count, weak categories and admitting categories are in `analysis/confidence/confidence.json`; the check is `scripts/confidence.py --check`, proved by `scripts/test_confidence.py`.
