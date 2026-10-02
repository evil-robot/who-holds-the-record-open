# Rubric v1.1 sub-anchors (1 Oct 2026)

Binding for every country on top of RUBRIC.md, so the same legal situation lands in the same band wherever it is.

[Redacted for the blind reliability check: file paths, and every sentence that names a country or states a
country's published score. The general rules from the two "Rulings applied" sections are kept below, worded
without country names.]

## Same regime, same band (score within the stated range; justify any move inside it in the summary)

**access**
- Statutory right to a copy (GDPR Art. 15 or national equivalent), provider-by-provider requests, NO national portal: 40 to 50.
  Add up to +10 for proven provider portals in wide use; subtract up to 10 for fees, no deadline, or weak enforcement.
- Statutory right AND a national portal showing part of the record (summary, prescriptions, labs) to most residents: 60 to 75.
- National portal with near-full record, export, long history, used by a majority: 76 to 90.
- No enforceable right (or right exists only for some records / some people): 15 to 35.

**control**
- Records shared by default with no individual choice and no access log: 20 to 35.
- Opt-out from sharing exists, or an access log the patient can see, but not both: 40 to 55.
- Opt-out (or opt-in) plus a patient-visible access log plus granular choices: 60 to 80.

**research**
- Secondary use of registry or pseudonymised data with no individual consent and no general opt-out: 40 to 50,
  moving only on documented safeguards (re-identification penalties, a public transparency register, an ethics/permit body).
- A general opt-out exists and is honoured: 55 to 70. Dynamic or opt-in consent, transparent: 70 to 85.

**ai**
- EU country with only EU law (MDR/IVDR, AI Act) and no verified national clinical-AI rules: 50.
  +4 each for verified national additions (national AI law, a health-AI authority, binding national guidance), max 66.
- Non-EU: device regulation of AI/ML with change control and human oversight in force: 55 to 70; guidance only: 35 to 50; nothing: 15 to 30.

**privacy**
- Score health-sector evidence first (health-data law, health regulator or DPA health decisions, health breaches).
  If no health-sector evidence is found, score on the general law and its enforcement record, normally 45 to 66, and say so.

## Evidence rules
- No number without verification: if a key fact could not be verified, write "not verified" AND keep the score inside the
  lower half of the band it would otherwise get; set confidence no higher than medium.
- Confidence is mechanical: high = 7 or 8 categories with a primary source (law text, government, regulator,
  intergovernmental body); medium = 5 or 6; low = 4 or fewer. Override only with a written reason in the headline note.
- A primary statistic cites its primary owner (EC, OECD, WHO, a ministry), not news about it.
- Every cited URL must open on the day of research. Read in the local language first.
- `asOf` is the research date. Sources carry `date` = publication date ("undated" if none) and `publisherClass`
  (official | legal_text | intergov | academic | news | law_firm | blog_vendor).

## General rulings (1 Oct 2026), country names and scores removed
- Unverified facts cap confidence at medium.
- EEA countries are treated as EU for the ai anchor. Laws that only designate AI Act authorities are not national additions.
- Control: an access log on request with no opt-out sits at the top of the 40-55 band.
- An opt-out that rests only on a vendor blog, contradicted by news, is not a verified opt-out.
- Non-EU ai: if change control is not verified, score in the lower half of the band.
- Access, statutory right with no national portal: base 45; +5 free with a fixed deadline or structured format; -5 each for a
  per-request fee, no fixed deadline, limited scope or not yet enforceable; +5 portals documented officially, +10 with an official
  figure showing wide use; clamp 30 to 60.
- Research, no consent and no opt-out: base 40, +3 per documented safeguard class (permit or ethics body; secure environment or
  statutory secrecy; re-identification or misuse penalty; public register of uses; partial opt-out or consent route), cap 50.
- "Key fact" for the evidence rule: a summary admission, or a detail admission naming a criterion of the cell's band. An unverified
  fact that would lift the cell into a higher band earns nothing and does not cap. Commercial, journey and clinical move only on a
  summary admission. The rule caps; it never raises.
- Privacy with no health-sector evidence: general-law band 45 to 66.
