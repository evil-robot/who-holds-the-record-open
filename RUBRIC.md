# Health Data Rights Index — scoring rubric (v1, 2026-10-01)

Purpose: rate how well each country's health data system serves the PATIENT on access, consent, privacy and a connected record across the whole care journey. Scores are 0-100 per category. Score from evidence you opened, not reputation.

Anchors (use for every category):
- 85-100 Leading: the right exists in law AND works in practice at national scale, with patient-visible controls.
- 65-84 Strong: right exists and mostly works; notable gaps (coverage, usage, exceptions).
- 45-64 Mixed: partial rights or partial infrastructure; works for some people, some settings.
- 25-44 Weak: rights mostly on paper or fragmented; patient depends on institutions.
- 0-24 Poor: no meaningful right or infrastructure, or active misuse.

## The 8 categories (key, weight)

1. `access` (20) — Patient access to full record. Legal right to see/get a copy of the WHOLE record (notes, labs, imaging reports, history) + practical reality (national portal? only a summary? only claims data? how many years? cost/time limits? export in machine-readable form?).
2. `control` (20) — Patient control and explicit consent. Can the person decide who sees and uses their data (granular, revocable, opt-in vs opt-out), see who accessed it (access log), and is the default individual control or institutional/state control?
3. `privacy` (15) — Privacy and security protection. Strength of health-data law (special category status, breach notification, penalties), regulator independence and actual enforcement, major breaches, state/police access exceptions, data localization.
4. `commercial` (10) — Protection from commercial exploitation. Limits on selling health data, using it for marketing/advertising, data brokers, consumer health apps outside health law, de-identified data sales. High score = strong protection.
5. `journey` (15) — Connected care journey. Infrastructure that links the record across primary care, hospitals, labs, pharmacy/e-prescription, insurance claims, public health and research. National HIE / national EHR coverage and real usage.
6. `clinical` (10) — Clinician access at point of care. Can the treating clinician see the patient's complete record across providers when needed (with consent/emergency rules)?
7. `research` (5) — Research and trial consent. Ethical, consent-based secondary use (opt-in, dynamic or permit-based with opt-out), transparency, trials consent law. High = person's choice respected AND research is possible.
8. `ai` (5) — Clinical AI governance. Rules for AI used in care (device regulation of AI/ML, change control, transparency, provenance of data, human oversight, generative AI rules).

Overall = weighted average (weights above, sum 100).

`controlModel` (one of): "Individual" (person holds the keys), "Shared" (person has real controls inside a state/provider system), "Institutional" (providers/insurers decide), "State" (government decides, limited individual say).

`confidence`: "high", "medium" or "low". Set by `scripts/confidence.py` from the data, never by hand (definition fixed 2 Oct 2026, before any label was recomputed):
- A category **cites a primary source** when at least one of its sources is classed official, legal_text or intergov by `analysis/sources.py`.
- A category **admits an unverified fact** when its summary or any detail paragraph uses the admission wording: "not verified", "not independently verified", "not been verified", "unverified", "could not (be) verify/verified/confirm/confirmed/check/checked", "not (been) confirmed", "not checked", "did not verify", "no verified".
- A category is **weak** when it cites no primary source or admits an unverified fact.
- **high**: 7 or 8 categories cite a primary source and no category admits an unverified fact.
- **low**: 4 or more of the 8 categories are weak, that is, at least half the categories rest on no primary source or on a fact the text says was not verified. (This includes the earlier "4 or fewer categories with a primary source".)
- **medium**: every other country.

## Writing rules
- Plain English, short sentences, no em dashes (use commas, periods, parentheses). No hype words (revolutionary, robust, seamless, cutting-edge, landscape, leverage, delve). Specifics beat adjectives: numbers, law names, dates.
- Never fabricate. Every number and law name must come from a page you opened. If you could not verify, say "not verified" in the text and lower confidence.
- summary: 2 sentences max, ~45 words, explains WHY the score, with one concrete fact.
- detail: 3-5 short paragraphs (each <= 60 words) for the in-depth review.
- sources per category: 1-4 objects {title, url, date} of pages you actually opened.
- news: 3-5 items from the last ~12 months (Oct 2025 - Sep 2026) about health data, records, privacy, consent or health AI in that country. {date "YYYY-MM-DD" or "YYYY-MM", headline (your own neutral paraphrase, <= 14 words), source (publisher), url, why (one line on why it matters to patients)}. Only stories you opened.
- laws: 3-7 key laws/regulations {name, level ("Supranational"|"National"|"State/Provincial"|"Regional"), year, what (<= 20 words), url}. For federal countries include notable state/provincial laws.
- journey: for each of primaryCare, hospital, labs, pharmacy, claims, publicHealth, research give one of "connected" | "partial" | "siloed" | "unknown", plus journeyNote (<= 40 words).

## JSON schema (write one file per country: /home/claude/globe/data/<ISO3>.json)
{
  "iso3": "USA", "name": "United States", "region": "Americas",
  "controlModel": "Institutional",
  "headline": "One sentence (<= 25 words) that captures the country's situation for a patient.",
  "confidence": "high",
  "categories": {
    "access":     {"score": 0, "summary": "", "detail": ["",""], "sources": [{"title":"","url":"","date":""}]},
    "control":    {...}, "privacy": {...}, "commercial": {...}, "journey": {...}, "clinical": {...}, "research": {...}, "ai": {...}
  },
  "journey": {"primaryCare":"partial","hospital":"partial","labs":"partial","pharmacy":"connected","claims":"connected","publicHealth":"partial","research":"partial"},
  "journeyNote": "",
  "laws": [ {"name":"","level":"National","year":"","what":"","url":""} ],
  "news": [ {"date":"","headline":"","source":"","url":"","why":""} ],
  "asOf": "2026-10-01"
}
Validate the file with: python3 -c "import json;json.load(open('<path>'))"
