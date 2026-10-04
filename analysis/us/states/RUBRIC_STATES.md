# US state layer: rubric (v1, 3 Oct 2026)

This rubric scores what one US jurisdiction's own law adds to the federal floor for a person's health record. It covers the 50 states and the District of Columbia (51 jurisdictions). Territories are out of scope in v1.

It is a context layer. It never changes the national US score in `data/USA.json`, which rates federal law and national infrastructure and stays as published. It gives no state total and no state rank.

**This is not legal advice.** It records what a primary legal text said on the date it was read. Statutes, regulations and court orders change, and a provision can be enjoined, amended or repealed after that date. Read the `checkedAt` date on every cell, and read the law itself before relying on it.

This file is the rater kit for the blind re-score. It names no jurisdiction's result, on purpose.

## 1. The federal floor (what "beyond HIPAA" is measured against)

Every jurisdiction starts from the same federal rules. A state provision counts only if it gives the person something the federal floor does not. The floor is the eCFR text as it stands on the first research date, and it is frozen for the run: a federal change during the run is logged, not applied mid-run. In short:

- Copies: a covered entity must act on a request within 30 days, with one 30-day extension, and may charge only a reasonable cost-based fee (45 CFR 164.524).
- Consent: providers and plans may use and share records for treatment, payment and health care operations without the person's consent (45 CFR 164.506). A person may ask for restrictions, and the entity may refuse except for items paid in full out of pocket (164.522).
- Sale and marketing need written authorization (164.508). De-identified data is outside the rule (164.514).
- HIPAA binds providers, health plans, clearinghouses and their business associates. It does not bind most apps, wearables or data brokers.
- Preemption: a state law that is "more stringent" than HIPAA survives (45 CFR 160.203). A state rule that gives the person less (for example a per-page copy fee above HIPAA's cost-based fee) does not apply to the person's own request and never counts here.

## 2. Status of a provision (every cell has exactly one)

| Status | Meaning |
|---|---|
| `in_force` | The provision is law and its effective date is on or before the cell's `checkedAt` date, and no court order stays it. Only this status earns a level above the lowest. |
| `enacted_not_yet_effective` | Signed into law, effective date after `checkedAt`. Recorded with the date. Earns nothing. |
| `enjoined_or_stayed` | A court order currently blocks it. Recorded with the order. Earns nothing. |
| `repealed_or_superseded` | No longer law. Recorded only if it would otherwise mislead. Earns nothing. |
| `no_law_found` | The required search (section 4) was done and found no provision. This is a finding, with a search log. |
| `not_checked` | The default. The question was not researched. Never shown as "no". |

**How a cell gets its status, level and value.**
- The cell's status is the status of the provision that sets its level or value. If nothing relevant is in force, it is the status of the most advanced relevant provision found (`enacted_not_yet_effective`, `enjoined_or_stayed`, `repealed_or_superseded`), or `no_law_found`.
- `in_force` cells carry the level or value the in-force provision earns (which can be the lowest, for example a breach law in force whose definition leaves out health data).
- Every other found status, and `no_law_found`, carries the lowest level (0) on an ordinal dimension, and the "none" value on a nominal one (`no_rule_found` for D3, `none_in_force` for D4). These are findings.
- `not_checked` carries `level: null` (or `value: null`). It is never 0 and never "none".
- If any relevant provision is enacted but not yet effective, the cell carries `pending: true` and lists it, with its date, in `provisions[]`, whatever its own status.
- A provision with phased dates is judged by the part that earns the level. If that part is not yet effective, it earns nothing yet, even if other parts of the act are in force.

## 3. Dimensions

Every dimension is ordinal or nominal. None is scored 0 to 100: these are facts about whether a provision exists and what it requires, and a 100-point number would claim a precision the evidence does not have. Higher levels on an ordinal dimension mean the provision gives the person more on that one question. They do not mean the jurisdiction is better overall.

### D1 `consumer_health_data`: health data held outside HIPAA

**Question.** For health data about a person held by a business that HIPAA does not cover (apps, wearables, websites, retailers, data brokers), what does state law in force require before the business collects, shares or sells it?

| Level | Anchor |
|---|---|
| 0 | No in-force provision found that gives the person a choice over such data beyond general consumer-protection law. |
| 1 | A comprehensive consumer privacy law in force treats health data as sensitive or special data, but gives only an opt-out (a right to limit, or to opt out of sale, sharing or targeted advertising). |
| 2 | A law in force requires the person's opt-in consent before such data is processed or disclosed. This includes a comprehensive privacy law that requires consent for sensitive data, and a law that covers only one class of non-HIPAA holder (for example health apps treated as providers) if it requires consent for that class. |
| 3 | A dedicated consumer health data law in force, general in scope (any regulated entity that collects consumer health data, not one class of holder), that requires consent to collect or share and a separate signed authorization to sell. |

Score the strongest in-force provision. Record every relevant provision in `provisions[]`, including applicability thresholds (`appliesTo`, quoted). Enforcement by the person is D5, not here; do not move D1 for a private right of action.

### D2 `copy_rights`: getting a copy, on terms better than HIPAA

**Question.** Does state law in force give the person a copy of their own record on terms better than the federal floor?

Two elements, each counted only when a state statute or regulation in force says it:
- (a) **Deadline**: a deadline to provide the copy that is shorter than 30 days.
- (b) **Free copy**: a copy that must be provided free in at least one defined case (for example a first copy, a copy for a benefits claim or appeal, or a copy for continuing care).

| Level | Anchor |
|---|---|
| 0 | Neither element found (HIPAA floor only). |
| 1 | One element in force. |
| 2 | Both elements in force. |

Record the deadline in days, every fee rule (quoted, with amounts) and who the provision binds. A per-page fee cap is recorded as a fact and never counted as better than HIPAA. A deadline that applies only to some holders (for example hospitals only) counts, and `appliesTo` says so.

### D3 `hie_consent`: the consent rule for health information exchange (nominal)

**Question.** When a person's record is shared through a health information exchange (HIE) in this jurisdiction, what consent rule applies to routine clinical data?

| Value | Meaning |
|---|---|
| `opt_in` | Records are exchanged only after the person agrees. |
| `opt_out` | Records are exchanged unless the person says no, and a way to say no is published. |
| `no_choice_required` | Exchange is permitted under HIPAA rules and no state rule or HIE policy offers a general choice. |
| `no_rule_found` | No state rule in force and no current policy of a state-designated HIE found. Pairs with any status other than `in_force`. |

The first three values need status `in_force`. When the law is silent and the value comes from the designated HIE's policy, `basis` is `hie_policy` and `in_force` means the policy is published and current on `checkedAt`. Record `basis` (statute, regulation, executive order, or HIE policy), the designated HIE's name if any, and `stricterForSensitive` (true when a category such as substance use, HIV or mental health records needs consent although routine data does not). State law outranks HIE policy: when both exist and differ, the cell follows the law and `note` says so. These values are not ordered. Opt-in and opt-out trade a person's control against a connected record; this layer does not rank them.

### D4 `sensitive_records`: category-specific confidentiality rules (nominal, four sub-cells)

**Question, asked separately for four categories: `reproductive`, `mental_health`, `hiv`, `genetic`.** Is there a state statute or regulation in force that specifically governs the confidentiality or disclosure of records in this category (for example by requiring the person's specific consent, or by limiting disclosure in legal proceedings or to other states)?

Values: `yes` (status `in_force`, with the provision quoted) or `none_in_force` (any other found status, or `no_law_found`); `null` when `not_checked`. An enacted provision not yet effective gives `none_in_force` with `pending: true`.

Neutral wording is binding for this dimension. No text in any D4 cell, note, table or caption may use a word that grades the state ("strong", "weak", "protective", "restrictive", "better", "worse", "hostile", "friendly", or similar). D4 records whether a confidentiality or disclosure rule for the record exists and what it says. It records nothing about whether any care is legal or available. D4 is never mapped and never counted into anything.

### D5 `private_right`: can the person enforce it themselves?

**Question.** Can a person sue in their own name for a violation of a state health data or medical records law?

| Level | Anchor |
|---|---|
| 0 | No private right of action found (enforcement by the attorney general or a regulator only, or none). |
| 1 | A private right of action limited to a data breach (a security failure), or to one narrow category of record (for example genetic test results). |
| 2 | A private right of action for unlawful collection, use or disclosure of medical records or consumer health data generally. |

A right to sue that exists only through a general consumer-protection statute counts if the health data law says a violation is a violation of that statute and that statute lets a person sue; quote both. Record statutory damages as a fact.

### D6 `breach_health`: is health data in the breach notification law?

**Question.** Does the state's breach notification statute define personal information to include medical information and health insurance information?

| Level | Anchor |
|---|---|
| 0 | Neither is in the definition. |
| 1 | One of the two is in the definition. |
| 2 | Both are in the definition. |

Record as facts: the notice deadline (days, or "without unreasonable delay"), whether the attorney general or a regulator must be told, and any clause deeming HIPAA-compliant entities compliant.

### D7 `ai_care`: rules for AI used in a person's care or coverage

**Question.** What does state law in force require when AI is used in a person's health care or in a decision about coverage of their care?

Three elements, each counted only when in force and only when the provision applies to health care or health coverage by its own words:
- (a) **Disclosure**: the person must be told when AI (including generative AI) is used to communicate with them about their care, or in their diagnosis or treatment.
- (b) **Clinician decides**: a licensed clinician must review AI output, or AI may not be the sole basis for a diagnosis, treatment decision, or denial or reduction of coverage.
- (c) **Human recourse**: the person may reach a human or have a human review a decision about their care or coverage that AI made or supported.

| Level | Anchor |
|---|---|
| 0 | No element in force. |
| 1 | One element in force. |
| 2 | Two elements in force. |
| 3 | All three in force. |

A general AI law counts only if it names health care services or coverage among the decisions it covers. Record bans on specific AI uses (`prohibitions[]`, quoted) as facts; they move no level.

### Context fact, not a dimension: `data_broker_registry`

Recorded, never scored, never mapped: whether a data broker registry is in force (`in_force` / `no_law_found` / `not_checked`), its statute, and whether it offers the person a deletion request.

## 4. What counts as evidence

**Evidence is a primary source opened on the research date:**
1. The official code, session law or register on the legislature's or the revisor's own site, or the official publisher it links to. Where a state's official code is hosted by a contracted vendor, the vendor page counts only when reached from a link on the legislature's own site, and `linkedFrom` records that page.
2. The attorney general, the health department, or the regulator that enforces the provision (rules, guidance that quotes the rule, enforcement pages).
3. For D3 only: the state-designated HIE's own published policy, with the designation shown on a state government page (`linkedFrom`).
4. Court orders on a court's own site, for `enjoined_or_stayed`.

**Leads are never evidence.** Justia, FindLaw, Casetext, Cornell LII state pages, NCSL, IAPP, FPF, law-firm alerts, trade press and Wikipedia may be used to find a law and must be recorded in `leads[]`. A cell whose only support is a lead is `not_checked`.

**Every cell with status `in_force`, `enacted_not_yet_effective`, `enjoined_or_stayed` or `repealed_or_superseded` carries:** the citation (code section or act number), the official URL, the effective date (or order date), a verbatim quote of no more than 50 words that carries the level, and `checkedAt`.

**`no_law_found` carries a search log:** the official code search used (URL), the exact terms searched, the AG or regulator page checked, and at least one lead source checked for that dimension. A cell without that log is `not_checked`.

**No answer from memory.** A level resting on a statute the session did not open on the research date is not allowed.

## 5. Writing rules

Plain English, short sentences, no em dashes. Numbers, law names and dates over adjectives. A note is at most 40 words. The D4 neutral-wording rule applies everywhere D4 appears.
