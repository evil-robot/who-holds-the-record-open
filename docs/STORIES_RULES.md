# Stories layer: binding rules (legal-privacy seat, 1 Oct 2026)

Stories live in `stories/<ISO3>.json` as `{"iso3":"XXX","stories":[...]}`, never inside Dustin's `data/*.json`.
JAS ruled 1 Oct 2026 that news reports are allowed even when the patient is unnamed (an unidentifiable person carries no personal data). These rules are binding. Open legal questions are listed in docs/OPEN_LEGAL_QUESTIONS.md (internal; not routed to Dina, JAS 1 Oct 2026).

## Allowed sources (`sourceType`)
regulator_decision (ombudsman / regulator / data-protection-authority published decision), court_judgment,
parliament_testimony (official record only), journalism (edited outlet; JAS ruling 1 Oct 2026: news reports are allowed whether or not the patient is named; we still never name the person),
advocacy_case (organisation's published case story that says the person agreed), own_blog (ONLY with dated written
consent from the author; none by Sunday, so do not collect).

## MUST NOT
- Any social platform or forum: reddit, x.com, twitter, tiktok, facebook, instagram, youtube, threads, medium comments, quora.
- Minors, or a parent's account of a child, or events when the person was under 18.
- Deceased persons unless the source is regulator_decision, court_judgment or parliament_testimony.
- Naming the person (page says "A patient in <country>"). No handles.
- Naming a provider unless status is `finding` (regulator/court/ombudsman decided) or `admitted` (provider's own public statement).
- Diagnosis, condition, treatment, care dates, or a place smaller than a region, in headline/paraphrase.
- Embeds, mirrors, screenshots. Link out only.
- Stories feeding scores. No story URL may appear among category sources.

## What we write
- headline <= 14 words, our own neutral words. paraphrase <= 40 words, ours, about what went wrong with the record.
- quote only for regulator_decision / court_judgment / parliament_testimony, <= 25 words, original language.
- Non-English source: lang set; page shows "From a <language> source; summary ours."
- Max 5 rendered per country, ordered finding > admitted > alleged > self_reported, then date.
- Every URL opened by the reviewer and reachable on build day.
- Date window (JAS 1 Oct 2026): source published 2024-10-01 to 2026-10-01. Nothing older than two years.

## Schema (one item)
id "<ISO3>-S001", iso3, date (source publication YYYY-MM[-DD]), headline, source (publisher/body), url (https),
why (<=140 chars, why it matters to patients), theme (access_refused | access_delay_or_cost | record_wrong | breach |
sold_or_shared | lost_between_providers | other), sourceType, status (finding | admitted | alleged | self_reported),
paraphrase, quote (string|null), lang (2-letter), personNamed false, providerName (string|null), subjectAdult true,
subjectDeceased bool, consentEvidence (e.g. "named and quoted in article", "testified on record", "org states consent",
"published decision"), reviewedBy, reviewedOn (YYYY-MM-DD), removed false, removedOn null, removalReason null.

## Whitepaper
No per-story data in the Zenodo deposit. Counts by theme and counts by country as two separate tables; no cross-table,
no cell under 5. Method paragraph: search terms, languages, window, source types, rules, reviewer, build date, "not a sample".
