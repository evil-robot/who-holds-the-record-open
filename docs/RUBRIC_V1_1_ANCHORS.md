# Rubric v1.1 sub-anchors (1 Oct 2026)

Binding for every NEW country (wave 1 onward) on top of RUBRIC.md. Written from the consistency audit
(analysis/consistency_audit.md findings 1 to 7 and its suggested decision rules) so the same legal situation lands
in the same band wherever it is. The original 43 were brought onto these anchors on 1 Oct 2026 (JAS ruling on audit findings 1 to 7; every change, every kept cell and the open questions are in docs/SCORE_CHANGES.md).

## Same regime, same band (score within the stated range; justify any move inside it in the summary)

**access**
- Statutory right to a copy (GDPR Art. 15 or national equivalent), provider-by-provider requests, NO national portal: 40 to 50.
  Add up to +10 for proven provider portals in wide use; subtract up to 10 for fees, no deadline, or weak enforcement.
- Statutory right AND a national portal showing part of the record (summary, prescriptions, labs) to most residents: 60 to 75.
- National portal with near-full record, export, long history, used by a majority: 76 to 90.
- No enforceable right (or right exists only for some records / some people): 15 to 35. A government portal that shows part of
  the record to the residents of one region lifts the cell within this band (to 35 at most), never out of it (ARE, 2 Oct 2026).
- EU and EEA states: GDPR Art. 12(3) (answer within one month) and the free first copy (Art. 12(5), 15(3); CJEU C-307/22, cited by the review panel and data/CZE.json, not opened on 2 Oct) bind by
  law, so the "+5 free with a fixed deadline" step is credited whatever the cited national page restates (IRL, 2 Oct 2026).

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

## Rulings applied 1 Oct 2026 (from analysis/wave1_check.md)
- ROU, MLT, UKR confidence high -> medium (unverified facts cap confidence at medium).
- ISL ai 45 -> 50 (EEA, EU-law-only regime, same as LIE); SVN, MLT ai 54 -> 50 (laws that only designate AI Act authorities are not national additions).
- ISL control 60 -> 55 (access log on request, no opt-out: top of the 40-55 band; matches CRI's regime).
- RUS control 40 -> 30 (opt-out rests on a vendor blog contradicted by news: no verified opt-out); RUS ai 58 -> 55 (change control not verified: lower half of band).
- EEA countries are treated as EU for the ai anchor.

## Rulings applied 1 Oct 2026 to the original 43 (docs/SCORE_CHANGES.md)
- Access, statutory right with no national portal: base 45; +5 free with a fixed deadline or structured format; -5 each for a
  per-request fee, no fixed deadline, limited scope or not yet enforceable; +5 portals documented officially, +10 with an official
  figure showing wide use; clamp 30 to 60. Kept with this reason: ZAF 40 (fee), PHL 40 (deadline only in a draft circular).
- Research, no consent and no opt-out: base 40, +3 per documented safeguard class (permit or ethics body; secure environment or
  statutory secrecy; re-identification or misuse penalty; public register of uses; partial opt-out or consent route), cap 50.
- EU AI: the authority-designation ruling above applies to DNK, POL and ESP (all now 50).
- "Key fact" for the evidence rule: a summary admission, or a detail admission naming a criterion of the cell's band. An unverified
  fact that would lift the cell into a higher band earns nothing and does not cap. Commercial, journey and clinical move only on a
  summary admission. The rule caps; it never raises.
- Privacy with no health-sector evidence: general-law band 45 to 66 (KOR 66, BEL 55, IRL 55).

## controlModel (the "keys" class), anchored 2 Oct 2026
Grounded in RUBRIC.md: who decides by default, and whether the person has real, person-level controls. Apply in order.
- **Individual** (person holds the keys): the record is held or directed by the person, nothing flows into a state or
  provider system by default, and every disclosure needs the person's prior, revocable consent, with a log the person can
  read. No national system is built this way today; the class is a design target, so an empty class is a finding about design.
- **Shared** (real controls inside a state or provider system): the system shares by default or by law, but the person has at
  least one working choice over who sees the record in care: opt-in consent, an opt-out, or blocking named providers, groups
  or items. The choice must be in force and live for the general population, not a plan, an unbuilt system or a pilot at a
  few sites. An access log alone is visibility, not control. A research or secondary-use opt-out alone is scored under
  research and does not make a country Shared.
- **Institutional** (providers or insurers decide): no working person-level choice over sharing in care, and records are held
  provider by provider with no live, government-run national record or exchange used for care that holds the person's data by
  default. Claims or statistical reporting to a state insurer (PhilHealth, Japan's claims system) does not by itself make a country State.
- **State** (government decides, limited individual say): no working person-level choice over sharing in care (or the choice
  is broadly overridden by statute), and a live, government-run national record or exchange used for care holds the data by default.
- The class and the control score measure different things and can disagree: a State country with a strong patient-visible
  log (CRI, GRC) can outscore a Shared country with a weak choice.
