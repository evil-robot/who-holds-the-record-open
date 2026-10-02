# Who Holds the Record: A <!-- GEN:n -->65<!-- /GEN:n -->-Country Index of a Person's Right to See, Control and Share Their Health Record

**Jason Alan Snyder**¹, **Bobby Hill**¹, **Dustin Raney**¹

¹SuperTruth Inc., United States. J. A. Snyder ORCID 0009-0001-6157-8100.

**Status:** REVIEW DRAFT, 2 October 2026. Not for circulation or citation.

**Correspondence:** through the SuperTruth contact form, https://supertruth.ai/on-the-record#contact

**Submitted:** October 2026 · **Version:** <!-- GEN:version -->1.0<!-- /GEN:version --> · **Data as of:** <!-- GEN:asof -->2026-10-02<!-- /GEN:asof -->

**DOI:** assigned by Zenodo on deposit. **Interactive index:** https://whoholds.supertruth.ai

---

<!-- Every number between GEN markers is spliced by scripts/paper_gen.js from the repository's computed outputs (out/facts.json, data/, stories/, analysis/); do not hand-edit those spans. -->

## Abstract

We scored <!-- GEN:n -->65<!-- /GEN:n --> countries and territories, including all 27 member states of the European Union, from 0 to 100 on one question: does a person get to see, control and share their own health record? Eight weighted categories cover access to the full record, control and consent, privacy and security, protection from commercial use, a connected care journey, clinician access at the point of care, research consent, and clinical AI governance. Research agents built on Anthropic's Claude models did the research and scoring against a written rubric, and the authors ruled on every finding and every change. The rubric requires an agent to open every source it cites; a later check of every cited link found <!-- GEN:links -->2097 cited links checked: 1968 opened, 11 dead, 104 blocked by bot protection and 14 unreachable or unresolved<!-- /GEN:links -->. Every score cites the public pages it rests on: <!-- GEN:sources -->1862 cited sources (416 undated)<!-- /GEN:sources -->. <!-- GEN:top -->Finland (71)<!-- /GEN:top --> leads and the median is <!-- GEN:median -->57<!-- /GEN:median -->. By band, with the range each count takes when weights and scores are varied: <!-- GEN:bandranges -->9 Strong (6 to 12 across draws), 45 Mixed (41 to 49) and 11 Weak (9 to 13)<!-- /GEN:bandranges -->. <!-- GEN:rbextremes -->No country reaches the top band and none falls to the bottom one in any draw<!-- /GEN:rbextremes -->. A blind re-scoring of a random sample of cells by a separate agent session agreed with the published scores at an intraclass correlation of <!-- GEN:reliccshort -->0.82<!-- /GEN:reliccshort -->, while a single cell can move by about <!-- GEN:relloahalf -->17<!-- /GEN:relloahalf --> points. We also classed where control over the record sits by default, which we call who holds the keys: <!-- GEN:models -->44 Shared, 7 Institutional and 14 State; 0 Individual<!-- /GEN:models -->. No country gives the person the default say over who sees the record; that class is a design target that no national system has built. An audit of our own scores found that the same legal situation was sometimes scored differently in different regions. We tightened the rubric, rescored, and report every change. A separate context layer, which changes no score, asks whether strained public systems push care to private providers whose records do not reach the public record. Alongside the scores we collected <!-- GEN:storytotal -->272<!-- /GEN:storytotal --> published accounts of real problems with health records. They illustrate the scores and do not change them. The paper and data are released under CC BY 4.0 and the code under the MIT licence.

**Keywords:** health records, patient access, consent, health data governance, interoperability, European Health Data Space, HIPAA, GDPR, clinical AI governance, composite index

---

## 1. Why this question

A health record follows a person through every part of care: the family doctor, the hospital, the lab, the pharmacy, the insurer, public health and research. Each party in that chain sees its own part. Clinicians see the records their own service holds. Insurers see claims. Governments see registries. In our view the person whose record it is often sees least: a portal, a summary, or a photocopy that took weeks to arrive. The index measures how far that is true, country by country.

Clinical AI raises the stakes. Systems that read records to suggest diagnoses, summarise notes or triage patients are only as good as the record they read. The person whose record it is usually has the least say in how it is used, and the least ability to find out what it contains.

We wanted one comparable answer, country by country, to a plain question: does a person get to see, control and share their own health record? Most existing indices measure the digital maturity of health systems, as reported by governments. The Euro Health Consumer Index and an earlier patient empowerment report scored record access as one item among many (Section 6). We set out to measure the patient's side as the object of the index: the right in law, and whether it works in practice.

## 2. What we measured

### 2.1 Eight categories

Each country receives a score from 0 to 100 in eight categories. The overall score is their weighted average. The weights are the authors' judgment. Access and control carry the most weight because they are the core of the question.

<!-- GEN:categories -->

| Category | Weight | Min | Q1 | Median | Q3 | Max |
|---|---:|---:|---:|---:|---:|---:|
| Patient access to the full record | 20% | 30 | 55 | 62 | 66 | 80 |
| Patient control and consent | 20% | 25 | 42 | 52 | 66 | 74 |
| Privacy and security | 15% | 34 | 50 | 55 | 58 | 65 |
| Connected care journey | 15% | 28 | 50 | 62 | 68 | 82 |
| Protection from commercial use | 10% | 35 | 50 | 55 | 60 | 70 |
| Clinician access at the point of care | 10% | 22 | 44 | 58 | 64 | 78 |
| Research and trial consent | 5% | 42 | 46 | 49 | 50 | 70 |
| Clinical AI governance | 5% | 30 | 50 | 50 | 55 | 66 |

<!-- /GEN:categories -->

*Table 1. The eight categories, their weights, and the distribution of scores across all countries (minimum, quartiles, median, maximum).*

1. **Patient access to the full record.** The legal right to see and copy the whole record (notes, labs, imaging reports, history), and the practical reality: a national portal or not, summary or full record, how many years, cost and time limits, machine-readable export.
2. **Patient control and consent.** Whether the person decides who sees and uses their data, with granular and revocable choices; whether they can see who accessed it; whether the default is individual or institutional control.
3. **Privacy and security.** Health data's legal status, breach notification, penalties, regulator independence and enforcement, major breaches, state access exceptions.
4. **Protection from commercial use.** Limits on selling health data or using it for marketing, data brokers, consumer health apps outside health law, sale of de-identified data. A high score means strong protection.
5. **Connected care journey.** Infrastructure that links the record across primary care, hospitals, labs, pharmacy, claims, public health and research, and how much it is used.
6. **Clinician access at the point of care.** Whether the treating clinician can see the patient's complete record across providers when needed, under consent and emergency rules.
7. **Research and trial consent.** Ethical, consent-based secondary use; transparency; trial consent law. A high score means the person's choice is respected and research is still possible.
8. **Clinical AI governance.** Rules for AI used in care: device regulation, change control, transparency, data provenance, human oversight, rules for generative AI.

### 2.2 Bands

Scores map to five bands, anchored in the rubric: **Leading** (85 to 100): the right exists in law and works in practice at national scale, with controls the patient can see. **Strong** (65 to 84): the right exists and mostly works, with notable gaps. **Mixed** (45 to 64): partial rights or partial infrastructure. **Weak** (25 to 44): rights mostly on paper, or a fragmented record. **Poor** (0 to 24): no meaningful right or infrastructure, or active misuse.

### 2.3 Who holds the keys

Separately from the score, each country is classed by where control sits by default. The classes were given written anchors on 2 October 2026 (docs/RUBRIC_V1_1_ANCHORS.md) and applied to every country in order:

- **Individual:** the record is held or directed by the person, nothing flows into a state or provider system by default, and every disclosure needs the person's prior, revocable consent, with a log the person can read.
- **Shared:** the system shares by default or by law, but the person has at least one working choice over who sees the record in care (opt-in, opt-out, or blocking named providers or items), in force for the general population. An access log alone is visibility, not control, and a research opt-out alone does not count.
- **State:** no such working choice, and a live government-run national record or exchange used for care holds the data by default.
- **Institutional:** no such working choice, and records are held provider by provider with no live national record of that kind.

Applying the anchors changed <!-- GEN:round2keys -->Cyprus (Shared to State), Greece (Shared to State) and Indonesia (Shared to State)<!-- /GEN:round2keys -->. The class and the control score measure different things and can disagree: a State country with a strong log the patient can see can outscore a Shared country with a weak choice.

## 3. How we scored

**Countries.** <!-- GEN:n -->65<!-- /GEN:n --> countries and territories across <!-- GEN:nregions -->6<!-- /GEN:nregions --> regions, including all 27 member states of the European Union. The first <!-- GEN:norig -->43<!-- /GEN:norig --> were chosen to cover every inhabited region and the largest health systems. They were researched in the index's first version and then re-researched in full on 2 October 2026 to the same standard as the added countries: local-language research, primary sources first, and an independent cross-check. <!-- GEN:nwave1 -->21<!-- /GEN:nwave1 --> countries were added on 1 October 2026, mostly to complete the European Union, and <!-- GEN:latenames -->Albania<!-- /GEN:latenames --> on 2 October. The selection is not a random sample, and the index makes no claim about countries outside it. Names follow our country files; listing a place separately reflects a separate health system and law and implies no position on its status. Regions are our own grouping for reading the tables (Turkey, Russia, Ukraine and Albania are in Europe; Israel is in the Middle East), not a political classification.

**Use of AI.** We report this following the 2025 position statement of Cochrane, the Campbell Collaboration, JBI and the Collaboration for Environmental Evidence, which asks authors to name the AI system, its version and the dates used, the purpose, and how its output was validated [22].

- *System and dates.* Research agents built on Anthropic's Claude models (Claude Opus 5.5, run through Claude Code), used from 30 September to 2 October 2026.
- *What the agents did.* Research and scoring of every country against the written rubric; a cross-check of each country's research by a second agent session, which reclassified every cited publisher, rechecked every link and compared each score with the anchor band for its legal situation; the consistency audit (Section 7); collection and first review of the accounts (Section 5); the outside research for the context layer (Section 9); the reading of the X sample (Section 10); the blind re-scoring below; and drafting of this paper.
- *What the authors did.* The authors directed the research, ruled on every audit finding and every proposed score change, and reviewed and revised the text. Each ruling is recorded with its evidence in docs/SCORE_CHANGES.md. We do not claim that a person read every cell and every source.
- *How the output was checked.* A link check of every cited URL (the figures in the abstract). A verifier for the accounts, tested by planting eight rule violations, all caught. A verifier for the stability analysis, tested with planted bugs (wrong rounding, swapped weights, a score off by one). A verifier of the blind re-scoring transcripts, tested with 13 planted breaches of the blind, all caught. The independent cross-check of each country's research. A blind re-scoring of a random sample of cells, reported below. The checking agents run on the same model family as the research agents, so these checks are independent readings, not independent judges; Section 7.4 sets out what that limits.

The rubric requires that every number and law name come from a page the agent opened, and that a fact which could not be verified be marked "not verified" in the text. Each country file's `asOf` is the date the file was last checked; dates run from <!-- GEN:asofrange -->2026-10-01 to 2026-10-02<!-- /GEN:asofrange -->.

**Evidence.** Each category cites one to four sources, most of them dated, and each source carries its publisher class (law text, government or regulator, intergovernmental body, academic, news, law firm, blog or vendor). Each country also lists its key laws, a care-journey map (each of seven stages marked connected, partial, siloed or unknown), and recent news items.

**Confidence.** Confidence follows a fixed rule from source counts: a country is high confidence when 7 or 8 of its categories cite a primary source (law text, government, regulator or intergovernmental body), medium with 5 or 6, and low with 4 or fewer. The publisher classes behind the count were assigned by agents, and the cross-check reclassified every cited publisher. An admission in the text that a fact was not verified caps the label at medium. The cap matches a fixed set of wordings ("not verified", "could not confirm", "did not verify", "no verified" and similar), widened on 2 October 2026 after a reviewer found wordings that escaped it. <!-- GEN:lowconfn -->0<!-- /GEN:lowconfn --> countries are low confidence: <!-- GEN:lowconf --><!-- /GEN:lowconf -->.

**Same regime, same band.** Rubric v1.1 adds sub-anchors so that the same legal situation lands in the same band wherever it is. For example, a statutory right to a copy with no national portal starts at 45 on access, gains 5 for a free right with a fixed deadline or a structured format, and loses 5 each for a fee, no deadline, a limited scope or a right not yet enforceable. In EU and EEA states the GDPR's one-month deadline and free first copy bind by law, so that step is credited whatever the cited national page says. An EU country with only EU law on clinical AI scores 50, plus 4 for each verified national addition. Research use without consent or opt-out starts at 40 and gains 3 for each documented safeguard, up to 50. If a key fact could not be verified, the score stays in the lower half of its band and earns nothing from that fact.

**Precision.** <!-- GEN:fivepct -->239 of 520 category scores (46%)<!-- /GEN:fivepct --> are multiples of five: scores cluster there, which shows how numbers were chosen rather than how precise they are. The blind re-scoring below measures precision directly. We use competition ranking: tied countries share a rank, shown as "4=", and ties are taken on the displayed whole number.

**How far a second reading agrees.** To test whether the scores depend on who does the scoring, we drew a stratified random sample of <!-- GEN:relsample -->64<!-- /GEN:relsample --> of the 520 country-category cells (8 per category, regions in proportion to country count, fixed seed). A fresh agent session re-scored each one blind. It saw only the rubric, the anchor rules with every country-specific score removed, the country, the category and the cell's cited sources. The analysis plan was written and hashed before any cell was scored. The rater ran on <!-- GEN:reldate -->2026-10-02<!-- /GEN:reldate --> (model <!-- GEN:relmodel -->claude-opus-5-5<!-- /GEN:relmodel -->) and is compared with the scores as published at the time of the run. On the <!-- GEN:reln -->58<!-- /GEN:reln --> cells it could score, it landed on average <!-- GEN:relmad -->5.8 points (95% CI 4.3 to 7.6)<!-- /GEN:relmad --> from the published score, within 10 points in <!-- GEN:relwithin10 -->88%<!-- /GEN:relwithin10 --> of cells, with no overall bias (<!-- GEN:relbias -->-0.4<!-- /GEN:relbias --> points). The intraclass correlation (ICC(2,1), absolute agreement) was <!-- GEN:relicc -->0.82 (95% CI 0.72 to 0.89)<!-- /GEN:relicc --> and the weighted kappa on the five bands <!-- GEN:relkappa -->0.63<!-- /GEN:relkappa -->. The ordering and level of the index replicate. A single category score does not replicate to the point: the limits of agreement are <!-- GEN:relloa -->-17.7 to +16.9<!-- /GEN:relloa --> points, and <!-- GEN:relband -->38%<!-- /GEN:relband --> of cells changed band. <!-- GEN:relnull -->6<!-- /GEN:relnull --> cells could not be scored because the rater could not read their sources, and <!-- GEN:relunread -->43 of 168 (26%)<!-- /GEN:relunread --> of the cited URLs in the sample were unreadable to it, mostly PDFs; agreement was closer where every source was read. The rater shares a model family with the research agents, so this is agreement between two agent readings of the same evidence under the same rubric. It is not a human inter-rater study, and it does not test whether a rater who gathered its own evidence would agree. <!-- GEN:relflag -->5<!-- /GEN:relflag --> cells differed by 15 points or more and were returned to the authors; the rulings so far are in docs/SCORE_CHANGES.md, and one (India, clinician access) awaits a ruling.

**Computation.** The overall score is computed from the category scores and the published weights, in the page itself and in the build script that produced the tables in this paper. No overall score is stored or typed by hand.

## 4. Results

### 4.1 Bands first, then ranks

By band: <!-- GEN:bandranges -->9 Strong (6 to 12 across draws), 45 Mixed (41 to 49) and 11 Weak (9 to 13)<!-- /GEN:bandranges -->. The ranges come from the stability analysis in Section 4.2. No country reaches the Leading band, and none falls to Poor. <!-- GEN:top -->Finland (71)<!-- /GEN:top --> leads and <!-- GEN:bottom -->Egypt (33) is last<!-- /GEN:bottom -->. The median is <!-- GEN:median -->57<!-- /GEN:median -->.

Table 2 gives each country's rank with the range of ranks it holds in 90% of draws. Read the range, not the single rank. Two countries whose ranges overlap should not be called different.

<!-- GEN:ranking -->

| Rank | Rank range (90%) | Country | Region | Keys | Overall | Band | Confidence |
|---|---|---|---|---|---:|---|---|
| 1 | 1 to 2 | Finland | Europe | Shared | 71 | Strong | high |
| 2 | 1 to 3 | Denmark | Europe | Shared | 70 | Strong | medium |
| 3= | 2 to 6 | Estonia | Europe | Shared | 68 | Strong | medium |
| 3= | 2 to 6 | Hungary | Europe | Shared | 68 | Strong | high |
| 5 | 3 to 8 | Sweden | Europe | Shared | 67 | Strong | high |
| 6= | 3 to 10 | Australia | Oceania | Shared | 66 | Strong | high |
| 6= | 3 to 11 | France | Europe | Shared | 66 | Strong | high |
| 6= | 3 to 10 | Norway | Europe | Shared | 66 | Strong | high |
| 9 | 5 to 13 | Austria | Europe | Shared | 65 | Strong | high |
| 10 | 6 to 15 | Portugal | Europe | Shared | 64 | Mixed | high |
| 11= | 8 to 20 | Belgium | Europe | Shared | 63 | Mixed | medium |
| 11= | 8 to 20 | Germany | Europe | Shared | 63 | Mixed | high |
| 11= | 8 to 22 | Italy | Europe | Shared | 63 | Mixed | high |
| 11= | 8 to 23 | Taiwan | Asia | Shared | 63 | Mixed | high |
| 11= | 6 to 19 | Turkey | Europe | Shared | 63 | Mixed | medium |
| 16= | 8 to 23 | Iceland | Europe | Shared | 62 | Mixed | medium |
| 16= | 10 to 26 | Israel | Middle East | Shared | 62 | Mixed | high |
| 16= | 11 to 25 | Latvia | Europe | Shared | 62 | Mixed | medium |
| 16= | 11 to 25 | Singapore | Asia | Shared | 62 | Mixed | high |
| 16= | 10 to 23 | Slovenia | Europe | Shared | 62 | Mixed | medium |
| 21= | 11 to 27 | Liechtenstein | Europe | Shared | 61 | Mixed | medium |
| 21= | 12 to 27 | Spain | Europe | Shared | 61 | Mixed | high |
| 23= | 14 to 29 | Croatia | Europe | Shared | 60 | Mixed | medium |
| 23= | 14 to 30 | Lithuania | Europe | Shared | 60 | Mixed | medium |
| 23= | 16 to 32 | Netherlands | Europe | Shared | 60 | Mixed | high |
| 23= | 13 to 29 | South Korea | Asia | Shared | 60 | Mixed | high |
| 27= | 17 to 32 | Bulgaria | Europe | Shared | 59 | Mixed | medium |
| 27= | 19 to 34 | Luxembourg | Europe | Shared | 59 | Mixed | medium |
| 27= | 18 to 33 | Malta | Europe | Shared | 59 | Mixed | medium |
| 27= | 19 to 34 | Poland | Europe | Shared | 59 | Mixed | high |
| 27= | 17 to 32 | United Kingdom | Europe | Shared | 59 | Mixed | high |
| 32 | 25 to 36 | Slovakia | Europe | Shared | 58 | Mixed | medium |
| 33= | 25 to 36 | Czechia | Europe | Shared | 57 | Mixed | medium |
| 33= | 26 to 37 | Greece | Europe | State | 57 | Mixed | medium |
| 35= | 28 to 38 | Japan | Asia | Shared | 56 | Mixed | high |
| 35= | 29 to 38 | Romania | Europe | Shared | 56 | Mixed | medium |
| 37= | 32 to 40 | Cyprus | Europe | State | 55 | Mixed | medium |
| 37= | 30 to 42 | United Arab Emirates | Middle East | Shared | 55 | Mixed | high |
| 39= | 34 to 43 | Costa Rica | Americas | State | 54 | Mixed | medium |
| 39= | 34 to 43 | Switzerland | Europe | Shared | 54 | Mixed | medium |
| 41 | 35 to 44 | Saudi Arabia | Middle East | State | 53 | Mixed | medium |
| 42= | 38 to 44 | Brazil | Americas | State | 52 | Mixed | high |
| 42= | 38 to 44 | Canada | Americas | Shared | 52 | Mixed | high |
| 42= | 39 to 45 | Thailand | Asia | Shared | 52 | Mixed | high |
| 45= | 43 to 49 | Kenya | Africa | Shared | 49 | Mixed | medium |
| 45= | 43 to 51 | Ukraine | Europe | Shared | 49 | Mixed | medium |
| 47= | 45 to 52 | Argentina | Americas | Shared | 48 | Mixed | medium |
| 47= | 45 to 52 | New Zealand | Oceania | Shared | 48 | Mixed | high |
| 47= | 44 to 52 | United States | Americas | Institutional | 48 | Mixed | high |
| 50= | 45 to 53 | Indonesia | Asia | State | 47 | Mixed | medium |
| 50= | 45 to 54 | Ireland | Europe | State | 47 | Mixed | high |
| 50= | 45 to 53 | Vietnam | Asia | State | 47 | Mixed | high |
| 53= | 48 to 57 | India | Asia | Shared | 45 | Mixed | medium |
| 53= | 49 to 58 | Russia | Europe | State | 45 | Mixed | medium |
| 55 | 50 to 58 | Rwanda | Africa | State | 44 | Weak | medium |
| 56= | 52 to 60 | China | Asia | State | 43 | Weak | high |
| 56= | 52 to 59 | Colombia | Americas | State | 43 | Weak | medium |
| 56= | 51 to 59 | South Africa | Africa | Institutional | 43 | Weak | high |
| 59 | 54 to 60 | Mexico | Americas | Institutional | 42 | Weak | high |
| 60 | 56 to 61 | Albania | Europe | Institutional | 41 | Weak | medium |
| 61= | 59 to 63 | Chile | Americas | Institutional | 39 | Weak | medium |
| 61= | 59 to 63 | Philippines | Asia | Institutional | 39 | Weak | medium |
| 63 | 60 to 63 | Ghana | Africa | State | 38 | Weak | high |
| 64 | 63 to 65 | Nigeria | Africa | Institutional | 35 | Weak | high |
| 65 | 64 to 65 | Egypt | Middle East | State | 33 | Weak | high |

<!-- /GEN:ranking -->

*Table 2. Overall scores, ranks (competition ranking on the displayed score; "=" marks a tie), the 90% rank range from the stability analysis (Section 4.2), region, keys class, band and confidence. Data as of the date on the title page.*

### 4.2 How stable the ranking is

We tested how much the ranking depends on our own choices, following the uncertainty and sensitivity analysis in the OECD and European Commission Joint Research Centre Handbook on Constructing Composite Indicators [21]. We redrew the eight weights <!-- GEN:rbdraws -->10,000<!-- /GEN:rbdraws --> times around the published ones, in three ways (a Dirichlet draw, and each weight moved by up to 25% or up to 50% and then rescaled). We added up to five points of random error to every category score. We also did both at once. Separately, we rebuilt the index with equal weights, with a geometric mean, and eight times with one category left out.

<!-- GEN:rbfirstall -->Finland is first in every rebuilt index<!-- /GEN:rbfirstall --> and in <!-- GEN:rbfinland -->88.4%<!-- /GEN:rbfinland --> of draws with weights and scores varied together. <!-- GEN:rbextremes2 -->No country reaches Leading and none falls to Poor in any draw<!-- /GEN:rbextremes2 -->: the highest score seen is <!-- GEN:rbmax -->77<!-- /GEN:rbmax --> and the lowest <!-- GEN:rbmin -->28<!-- /GEN:rbmin -->. The median country stays Mixed (<!-- GEN:rbmedian -->56 to 58<!-- /GEN:rbmedian -->). The rebuilt rankings correlate with ours at <!-- GEN:rbrho -->0.96<!-- /GEN:rbrho --> or above (Spearman). With weights and score error varied together, half the countries have a 90% rank range of <!-- GEN:rbwidth -->9<!-- /GEN:rbwidth --> places or fewer.

The band counts are softer than the ranking. <!-- GEN:rbedgen -->14<!-- /GEN:rbedgen --> countries keep their band in fewer than 90% of draws, because they sit within two points of a band line (unrounded score in brackets): <!-- GEN:rbedge -->Australia (65.8), France (65.6), Norway (65.8), Austria (64.8), Portugal (64.1), Belgium (62.9), Turkey (63.3), Ireland (46.5), India (45.1), Russia (44.7), Rwanda (44.4), China (43.1), Colombia (43.4) and South Africa (43.5)<!-- /GEN:rbedge -->. If a rater were generous or harsh by up to five points across a whole country, rather than category by category, Finland would stay first in <!-- GEN:rbfinlandpess -->53.0%<!-- /GEN:rbfinlandpess --> of draws and ranks would loosen further. Which kind of error is closer to the truth is not known: the blind re-scoring in Section 3 measured disagreement cell by cell and did not test a shared offset across a country. The code, the seed (<!-- GEN:rbseed -->20261002<!-- /GEN:rbseed -->) and every setting are released with the index.

### 4.3 No country gives the person the keys

By keys class: <!-- GEN:models -->44 Shared, 7 Institutional and 14 State; 0 Individual<!-- /GEN:models -->. <!-- GEN:strongshared -->All 9 countries in the Strong band are Shared<!-- /GEN:strongshared -->: the person has real controls (a consent register, an opt-out, an access log, a portal) inside a system run by the state or by providers. This link partly holds by construction, since a working choice over sharing also raises the control score, which carries 20% of the weight. No country we rated is Individual. That class describes a design no national system has built, so the empty class is a finding about how systems are designed, not a shortfall of effort by any one country.

More individual control is not free. In a randomised trial of 2,228 new outpatients at one Dutch tertiary hospital, an opt-out procedure for the secondary use of routine health data gave higher consent rates than opt-in, with less bias by gender, socioeconomic status and country of birth [26]. That trial concerns research use, not sharing in care, and one hospital. It still shows that a stricter consent default can make the data that research and planning rely on less representative. Our rubric rewards both the person's choice and research that remains possible (Section 2.1), and it does not yet say how to weigh one against the other.

### 4.4 Which rights lag

Table 1 gives the spread in each category. <!-- GEN:catmedians -->The highest median is patient access to the full record and connected care journey (62); the lowest is research and trial consent (49)<!-- /GEN:catmedians -->. <!-- GEN:catspread -->The widest spread between the first and third quartiles is in patient control and consent (24 points); the narrowest is in research and trial consent (4)<!-- /GEN:catspread -->. A spread is not a cause, and gaps of a few points between categories are within the precision of a single score.

### 4.5 By region

<!-- GEN:regions -->

| Region | Countries | Mean overall | Range |
|---|---:|---:|---|
| Europe | 36 | 60 | 41 to 71 |
| Oceania | 2 | 57 | 48 to 66 |
| Asia | 10 | 51 | 39 to 63 |
| Middle East | 4 | 51 | 33 to 62 |
| Americas | 8 | 47 | 39 to 54 |
| Africa | 5 | 42 | 35 to 49 |

<!-- /GEN:regions -->

*Table 3. Mean overall score and range by region. Regions differ in how many countries we rated; a regional mean over few countries says little.*

## 5. What people report

### 5.1 Method

Everything in this index, the scores and the accounts alike, comes from public information: laws, government and regulator pages, court decisions and published news reports. We link to every source.

Alongside the scores we collected published accounts of real problems people have had with their health records: records refused, delayed or charged for; records that were wrong; breaches; records sold or shared without consent; records lost between providers. Research agents searched on <!-- GEN:storysearched -->2026-10-01<!-- /GEN:storysearched --> in <!-- GEN:languages -->40<!-- /GEN:languages --> languages, local languages first, and found accounts in <!-- GEN:storylangs -->37<!-- /GEN:storylangs -->. The window was two years: material published between 1 October 2024 and 1 October 2026, and nothing older.

The rules below were written before collection by an internal privacy review (an agent working to a written brief) and approved by the authors. No outside legal review was commissioned. They are binding on every item:

- **Allowed sources:** published decisions of regulators, data protection authorities and ombudsmen; court and tribunal judgments; official parliamentary records; journalism from an edited outlet, whether or not the patient is named; case stories published by patient organisations that state the person agreed; personal blogs only with the author's dated written consent (none were collected for this version).
- **Excluded:** every social media platform and forum; anyone under 18, or events from when they were; deceased persons unless the source is a regulator, court or parliamentary record.
- **What we publish:** our own neutral summary of no more than 40 words and a link to the original. We never name the person. We name a hospital or company only where a regulator, court or the organisation itself has stated what happened. A non-English source is marked as such, with the summary ours.
- **Separation:** stories never feed a score. A release check fails if any story's link is also a source for a score.
- **Verification:** an agent reviewer opened every item. A verifier rechecks every rule flag and every link; it checks the flags the collecting agent set, and does not read each summary for names or conditions. Its run of 2 October 2026 found 2 of 272 links not answering. We tested it by planting eight rule violations, and it caught all eight. Eight of eight is a small test: it is consistent with a true catch rate well below 100%.

These are accounts we could find and publish under these rules. They are not a sample. Counts reflect where people speak publicly, where regulators publish their decisions, and where we searched; they do not measure how common problems are.

### 5.2 What we found

We collected <!-- GEN:storytotal -->272<!-- /GEN:storytotal --> accounts covering <!-- GEN:storycountries -->63<!-- /GEN:storycountries --> countries, published <!-- GEN:storywindow -->2024-10-03 to 2026-10-01<!-- /GEN:storywindow -->. Of these, <!-- GEN:status -->142 rest on a regulator, court or ombudsman finding, 58 on the organisation's own admission, and 72 on an account not yet tested<!-- /GEN:status -->. No account names the person. The tables also suppress any count below five; no cell in Tables 4 to 6 is that small.

<!-- GEN:themes -->

| Theme | Stories |
|---|---:|
| Breach | 125 |
| Record wrong | 43 |
| Sold or shared without consent | 33 |
| Access refused | 21 |
| Access delayed or charged | 19 |
| Other | 18 |
| Lost between providers | 13 |

<!-- /GEN:themes -->

*Table 4. Accounts by theme.*

<!-- GEN:types -->

| Source type | Stories |
|---|---:|
| News report | 173 |
| Regulator or ombudsman decision | 87 |
| Court or tribunal judgment | 12 |

<!-- /GEN:types -->

*Table 5. Accounts by source type.*

<!-- GEN:storyregions -->

| Region | Stories |
|---|---:|
| Europe | 156 |
| Asia | 43 |
| Americas | 37 |
| Africa | 14 |
| Middle East | 12 |
| Oceania | 10 |

<!-- /GEN:storyregions -->

*Table 6. Accounts by region. We publish counts by theme and by region as separate tables only; there is no cross-table, and the individual accounts are linked from the interactive index rather than deposited with this paper, so that a removal request can be honoured.*

News reports are the largest source type. They count whether or not the patient is named, and we never name the person. Where a country shows few or no accounts, that reflects what is published and findable, not an absence of problems.

## 6. Related work, and how our scores compare with other indices

### 6.1 Related work

We found no index whose object is a person's rights over their own health record. The nearest is the Euro Health Consumer Index, which in its 2018 edition scored 35 European countries on 46 health-system indicators, one of them "Access to own medical record" [19]. The same organisation's 2009 report on patient empowerment scored 31 European countries on a set of patient-rights and information indicators that included whether patients can read their own medical records [20]. Both are grey literature from a private company, and in both, record access is one item in a broader health-system or empowerment score.

Other work compares and describes without scoring. Essén and colleagues compared patient-accessible record policy and services in ten countries; all ten gave patients some right of access, and they differed on login security, proxy access and how soon results appear [7]. Kharko and colleagues surveyed experts in 29 countries on online record access: 23 had it, and clinical notes were available in 12 [8]. The NORDeHEALTH group surveyed 29,334 portal users in Norway, Sweden, Finland and Estonia [9], set out five principles for record access under the European Health Data Space (right of access, proxy access, patient-entered data, rectification and access control) [10], and proposed a framework for comparing countries [11]. Those five principles map closely onto our access and control categories. For Africa, Munung and colleagues tabulated data protection laws in 37 countries, including whether health data is a special category and which data-subject rights exist [12]; Townsend and colleagues found no AI-specific law in the 12 African countries they studied [13]. Alegre and colleagues mapped electronic record and telehealth laws across Latin America [14]. Essén and colleagues compared health app policy in nine countries, the only cross-country work we found that touches our commercial category [15]. Our contribution is a scored, sourced and repeatable comparison with the patient's rights as its object.

### 6.2 Comparison with other indices

Several indices measure neighbouring things. We compared country orderings using Spearman rank correlation with 95% percentile bootstrap intervals (4,000 resamples; resamples with no variation are dropped). This is a sanity check. It does not validate our scores. The other indices describe earlier years (2018 to 2024), mostly rely on government self-report, and measure digital maturity rather than patient rights. Table 7 shows <!-- GEN:extshown -->8<!-- /GEN:extshown --> rows, one per external measure and matched category; all <!-- GEN:extrows -->15<!-- /GEN:extrows --> computed rows are in the repository (analysis/external/external_corr.json).

<!-- GEN:external -->

| External measure (data year) | Our category | n | rho | 95% interval |
|---|---|---:|---:|---|
| European Commission Digital Decade eHealth indicator (2024) [1] | Access | 14 | +0.24 | -0.34 to +0.76 |
| OECD EHR technical and operational readiness (2021) [2] | Journey | 18 | +0.45 | -0.09 to +0.82 |
| OECD EHR governance for analytics (2021) [2] | Research | 18 | +0.03 | -0.57 to +0.54 |
| Bertelsmann #SmartHealthSystems (2018) [3] | Overall | 16 | +0.26 | -0.35 to +0.75 |
| WHO Global Digital Health Monitor, overall (2023) [4] | Overall | 18 | +0.62 | +0.20 to +0.87 |
| WHO Global Digital Health Monitor, exchange architecture (2023) [4] | Journey | 18 | +0.55 | -0.01 to +0.94 |
| WHO Global Digital Health Monitor, AI protocol (2023) [4] | AI | 18 | +0.49 | -0.06 to +0.88 |
| WHO Global Digital Health Monitor, privacy laws (2023) [4] | Privacy | 18 | +0.23 | -0.21 to +0.65 |

<!-- /GEN:external -->

*Table 7. Rank correlations between our categories and published indices, for the countries in both. Computed <!-- GEN:extcomputed -->2026-10-02<!-- /GEN:extcomputed --> on our current scores. The European Commission, OECD and Bertelsmann values were transcribed for the original 43 countries only, so their rows cover those; the WHO values were matched for every country in the index that WHO publishes. Our data cites the European Commission indicator for three countries; without them, rho is <!-- GEN:extnocite -->+0.16 (n 11)<!-- /GEN:extnocite -->.*

<!-- GEN:extpos -->Every correlation is positive<!-- /GEN:extpos -->, and most are weak to moderate, which fits an index that measures the patient's side rather than system maturity. The only interval in Table 7 that clears zero is the <!-- GEN:extclear -->WHO Global Digital Health Monitor, overall (2023)<!-- /GEN:extclear -->; the countries that answered the full 2023 WHO survey are mostly outside Europe and mostly lower and middle income, so that row measures a different set of countries from the others. The largest disagreements are informative. The European Commission indicator rates Norway's and Germany's online access well above our access scores (<!-- GEN:cell_NOR_access -->68<!-- /GEN:cell_NOR_access --> and <!-- GEN:cell_DEU_access -->64<!-- /GEN:cell_DEU_access -->). The OECD readiness survey rates Germany well below our journey score (<!-- GEN:cell_DEU_journey -->66<!-- /GEN:cell_DEU_journey -->), but the survey predates Germany's 2025 rollout of its national electronic record; it rates Japan well above ours (<!-- GEN:cell_JPN_journey -->48<!-- /GEN:cell_JPN_journey -->). In the WHO monitor, the figures labelled 2024 repeat the 2019 figures row for row. For many countries the 2023 overall score rests on only two legal questions, so we used only the <!-- GEN:extgdhmn -->18<!-- /GEN:extgdhmn --> countries that answered the full 2023 survey.

## 7. An audit of our own scores, and limitations

### 7.1 What the audit found

Before publication an audit agent checked the original 43 countries against their own rubric. It found seven problems in the scores:

1. **The same legal situation was sometimes scored differently in different regions.** Countries with a legal right to a copy of the record but no national portal were scored anywhere from 24 to 60. Ireland's access score (24, Poor) was the clearest case: its own text describes a working legal right that is used heavily.
2. **Identical EU clinical AI situations carried different scores,** from 50 to 62.
3. **Research use without individual consent or opt-out** was scored from 45 to 64.
4. **One country's privacy score rested on a large breach outside health.**
5. **One country ranked in the top ten on very few official sources.**
6. **Confidence labels did not track sourcing.**
7. **Some cells said a key fact was not verified but still carried a number** that read as if measured.

### 7.2 What we changed

The authors accepted the audit's suggested decision rules on 1 October 2026. They became the rubric v1.1 anchors (Section 3), and the original 43 were rescored against them. In all, <!-- GEN:changes -->44 category scores changed in 33 countries, and 18 confidence labels changed<!-- /GEN:changes -->. Of the score changes, <!-- GEN:changesup -->6<!-- /GEN:changesup --> went up and <!-- GEN:changesdown -->38<!-- /GEN:changesdown --> went down. The largest moves were <!-- GEN:bigchanges -->Ireland access 24 to 45, Norway research 64 to 43, Estonia research 64 to 49, Sweden research 60 to 46, Austria clinical AI 62 to 50, South Korea privacy 78 to 66 and Spain clinical AI 62 to 50<!-- /GEN:bigchanges -->. Three countries changed band: <!-- GEN:bandmoves -->Norway (Strong to Mixed), Chile (Mixed to Weak) and New Zealand (Mixed to Weak)<!-- /GEN:bandmoves -->; each move is within the precision set out in Section 4.2. <!-- GEN:rankmoves -->The largest fall was South Korea (7 places); the largest rise was 2 places (Spain, Latvia, Slovenia, Singapore, Iceland, United States and South Africa)<!-- /GEN:rankmoves -->. Confidence became the fixed rule in Section 3.

On 2 October 2026 three internal reviews (methods, policy and law, and data integrity) and the blind re-scoring led to a second round: <!-- GEN:round2 -->6 category scores changed in 6 countries, 3 keys classes changed and 3 confidence labels changed<!-- /GEN:round2 -->. The GDPR deadline and free first copy are now credited by law in every EU and EEA access cell. The United States and Lithuania access cells, which sat above where their own regime's arithmetic put them, were brought onto it. A one-region portal now lifts an access cell within the "no enforceable right" band, never out of it. Every cell in the upper half of its band that admits an unverified fact was re-read; two moved. The keys anchors in Section 2.3 were written and applied, and the confidence cap was widened. The reviews were drafted by agents working for the authors; they are internal pre-deposit reviews, not journal peer review.

Every change, with the evidence for it, and every cell that stayed, with the reason, is listed in the repository (docs/SCORE_CHANGES.md).

### 7.3 Edge cases still open

The rules settle most of the audit's findings. These cases remain, and we report them rather than force them:

- **Research cells outside the no-consent band.** Some cells whose own text describes research use without consent or opt-out sit below the band (the rule caps scores and never raises them), and one sits above it.
- **One national AI law with several health duties.** Italy's clinical AI score (<!-- GEN:cell_ITA_ai -->54<!-- /GEN:cell_ITA_ai -->) rests on one national AI law. The anchor does not yet say whether one law with several health duties counts once.
- **Gaps in the anchors.** The anchors do not yet cover a portal with no verified legal right, a research prohibition, or binding non-EU AI rules without verified change control.
- **First-copy fees.** Some EU and EEA access cells describe copy fees without saying whether the first copy is free. Their scores sit in the portal bands, where the step does not apply, so no score moves, but the text needs a fee note.
- **The rule acts on what a cell says.** The cap on unverified facts is applied by reading each cell's text. A per-cell record of the regime each cell was placed in, and of whether a key fact is unverified, would let a reader check "same regime, same band" mechanically. It is not built in this version.

### 7.4 Limitations

1. **Ranks are approximate.** Section 4.2 gives each country a rank range. Read bands before ranks, and ranks as a range.
2. **A single category score carries real judgement.** The blind re-scoring puts the limits of agreement for one cell at <!-- GEN:relloa -->-17.7 to +16.9<!-- /GEN:relloa --> points. The rater was an agent session from the same model family as the research agents. Two readings from one model family may share the same blind spots, so their agreement may be higher than agreement with a human rater or a different model would be. No human inter-rater study has been done.
3. **The average lets strength offset weakness.** A weighted arithmetic mean lets a strong score in one category make up for a weak score in another: good infrastructure can offset weak consent. A geometric mean, which penalises imbalance, ranks the countries almost identically (Spearman <!-- GEN:rbgeo -->0.99<!-- /GEN:rbgeo -->), so the choice does not drive the ranking here, but the index does not say that every right must be met.
4. **Two categories overlap.** The connected care journey and clinician access move closely together (<!-- GEN:journeyclinical -->r = 0.94 across 65 countries<!-- /GEN:journeyclinical -->). Together they carry 25% of the weight, so connected infrastructure is in effect counted twice. Leaving either one out moves the ranking little (average rank shift <!-- GEN:rbdropj -->2.3<!-- /GEN:rbdropj --> places without journey, <!-- GEN:rbdropc -->1.4<!-- /GEN:rbdropc --> without clinician access, against <!-- GEN:rbdropctl -->3.9<!-- /GEN:rbdropctl --> without control), so we kept both at full weight in this version.
5. **Breach evidence depends on reporting rules.** The privacy category counts major breaches. Breaches are only visible where law requires them to be reported and published, and the authors of two US breach studies judge that even the published US counts understate the true number, because breaches go unreported and small ones are excluded [27, 28]. A country with mandatory public reporting can look worse than one whose breaches stay unseen.
6. **No equity criterion.** A right can work on average and fail for groups: in the United States, Black and Hispanic adults were less likely than White adults to be offered a patient portal and, when offered, to access it [29]. The rubric scores national rights and infrastructure and has no criterion for who can use them.
7. **Sources.** The index rests on <!-- GEN:sources -->1862 cited sources (416 undated)<!-- /GEN:sources -->. Some laws are cited from secondary summaries rather than official text, and a few cells cite tertiary sources such as Wikipedia. Across all <!-- GEN:citations -->2097<!-- /GEN:citations --> citations (<!-- GEN:distincturls -->930<!-- /GEN:distincturls --> distinct pages) in category sources, laws and news, <!-- GEN:links -->2097 cited links checked: 1968 opened, 11 dead, 104 blocked by bot protection and 14 unreachable or unresolved<!-- /GEN:links -->. A link that opens shows the page exists, not that it says what the summary says; apart from the blind re-scoring, no check compares each summary with its source.
8. **Sites that block agents.** Some official sites refuse automated access. Where they did, a cell can rest on secondary sources, so confidence partly reflects whether a government's website admits agents.
9. **Time.** Scores describe the date on the title page. Several systems are changing quickly, in particular in Europe ahead of the European Health Data Space [5].
10. **Coverage.** <!-- GEN:n -->65<!-- /GEN:n --> countries, chosen by the authors; <!-- GEN:lowconfn -->0<!-- /GEN:lowconfn --> are low confidence.

## 8. How strong is the evidence? A grade adapted from the Data Trust Index

### 8.1 What it is

SuperTruth's Data Trust Index (DTI) grades health data records before an AI system uses them, on eight weighted dimensions [6]. The DTI is the authors' company's own framework, and [6] is the first author's own deposit; it has not been peer reviewed. We apply its dimensions and weights to a different object: the evidence behind each score. One cell is one country and one category, with its summary, its detail and its cited sources. Each cell gets a grade from 0 to 100. A country's grade is its cells weighted by the index's category weights.

This is an adaptation. Several dimensions have no direct counterpart in published evidence:

| Dimension (weight) | As adapted for evidence |
|---|---|
| Provenance (25) | How close each publisher is to the fact: law text, government or intergovernmental body highest, then academic, news, law firm, blog or vendor |
| Consent (20) | Open availability: whether anyone can open the source today. The furthest stretch, since published evidence has no data subject |
| Recency (15) | Time since publication; a law in force counts as current at any age |
| Quality (10) | Completeness of the evidence record, including a publication date for every source |
| Concordance (10) | Number of independent publishers |
| Validation (10) | Whether the text admits that a fact was not verified |
| Breadth (5) | Number of distinct kinds of evidence |
| Stability (5) | Whether the cell sits in an open finding of the consistency audit |

*Table 8. The DTI dimensions as adapted to the evidence behind a score.*

Tiers follow the DTI paper: Platinum 90 and above, Gold 80 to 89, Silver 70 to 79, Bronze 55 to 69, and below that, Below Bronze. Tiers use the unrounded grade, so a grade shown as 80 can be Silver and one shown as 90 can be Gold.

**Our extension.** The DTI paper defines no cap. We added one: a cell with no primary source cannot be labelled above Silver, and neither can a country with fewer than 4 of its 8 categories citing a primary source. The number is never changed, only the label. The cap applied to <!-- GEN:dticapped -->35 cells and 0 countries<!-- /GEN:dticapped -->.

### 8.2 Results

Country grades run from <!-- GEN:dtirange -->75 to 93<!-- /GEN:dtirange -->: <!-- GEN:dtitiers -->8 Platinum, 51 Gold, 5 Silver (64 countries with a published grade)<!-- /GEN:dtitiers -->. <!-- GEN:dtiprov -->Liechtenstein is provisional and has no published grade<!-- /GEN:dtiprov -->, because one of its sources is cited from a shared file host instead of the publisher. Across all <!-- GEN:dticells -->520 cells: 160 Platinum, 255 Gold, 98 Silver, 7 Bronze<!-- /GEN:dticells -->.

### 8.3 What it is not

- **It does not grade the country.** A Gold grade means the evidence behind the scores is well sourced. It says nothing about whether the country protects patients well. A country can have strong evidence for a weak score.
- **It does not change any score.** No category score, overall score or rank is touched by it.
- **It is not the confidence label.** Confidence counts categories with a primary source; the grade also weighs whether sources open, their dates and how many publishers agree. A low-confidence country can grade Gold. Where the two disagree, read the confidence label, which is the stricter test. The grade's cap (fewer than 4 primary categories) and the confidence rule (4 or fewer is low) are not yet aligned.
- **It does not read the sources.** It checks who published a source, whether the link opens, when the source was published and whether the author admitted a gap. It does not check that the page says what the summary says.
- **The tier names are borrowed, not their meanings.** In the DTI paper, Gold means suitable for clinical decision support. That sentence describes health records and does not carry over to evidence.
- **It is generous.** On the published weights, a cell resting on one dated news article that opens and admits no gap reaches Gold. Two dimensions vary little across cells, which pushes most grades up.

## 9. Strain and split: context, not scored

### 9.1 The question

This layer asks a question in four links. A public system short of doctors and nurses for the demand produces long waits. People who can pay turn to private care. Public and private providers keep different record systems, so the person's record breaks apart. The layer measures each link in that chain from public data, country by country, and says where the data is silent. It changes no score, and the build fails if any score moves when it loads.

Outside work supports the first two links only in part. In Britain, buying private health insurance is associated with longer local NHS waiting lists [24]. In Australia, the expected wait does not raise the chance that a person buys insurance; a high chance of a long wait does, and on average waiting time has no significant effect [25]. The link from waits to private care is real in some systems and conditional in others.

### 9.2 Indicators and sources

| Link in the chain | Indicator | Source |
|---|---|---|
| Too few staff | Medical doctors, and nursing and midwifery personnel, per 10,000 people | WHO Global Health Observatory, National Health Workforce Accounts [16] |
| Money going private | Voluntary health insurance plus household out-of-pocket payments, as a share of current health spending, same year | WHO Global Health Expenditure Database, final years only [17] |
| Long waits | Median days from specialist assessment to treatment, hip and knee replacement | OECD Health Statistics, waiting times [18] |
| A record that stops at the private door | Whether private providers write to the record the public system uses: connected, partial, split or unknown | Our country files, and outside research with a quoted source |

*Table 9. The four links and their sources.*

Every value carries its own year, source and retrieval date. Years differ by country, from <!-- GEN:strainyears -->2017 to 2025<!-- /GEN:strainyears -->, and the expenditure data stop at <!-- GEN:ghedyear -->2023<!-- /GEN:ghedyear -->, the latest year the WHO database marks as final. Data were retrieved <!-- GEN:strainretrieved -->2026-10-02<!-- /GEN:strainretrieved -->. The wait measure counts the wait of patients who were treated, which understates the queue of those still waiting.

### 9.3 Flags

There is no composite score. Each country gets four flags, each true, false or unknown. A flag is true when doctors or nurses fall below the lower quartile, or private spending above the upper quartile, of the countries with a value: <!-- GEN:straincutoffs -->26.52 doctors or 41.63 nurses and midwives per 10,000 (lower quartiles of 63 and 63 countries with a value), and 38.17% of current health spending (upper quartile of 61)<!-- /GEN:straincutoffs -->. A wait flag is true when the longer of the hip and knee medians is over 90 days, the OECD's own three-month line. A record flag is true when the class is split. Unknown is never counted as false.

### 9.4 Coverage

Countries with a value, of <!-- GEN:strainn -->65<!-- /GEN:strainn -->: <!-- GEN:straincover -->doctors 63, nurses and midwives 63, private insurance plus out-of-pocket spending 61, duplicate private insurance 18, median hip and knee waits 18<!-- /GEN:straincover -->. Flags: <!-- GEN:strainflags -->staffing 63 measured, 21 true; private spending 61 measured, 15 true; waits 18 measured, 14 true; record split 53 known, 4 true<!-- /GEN:strainflags -->. Waits are reported for only <!-- GEN:strainwait -->18 of 65<!-- /GEN:strainwait --> countries, mostly those that run waiting lists, and most of those exceed 90 days, so the wait flag separates little. The staffing and spending quartiles mostly sort countries by national income. Whether the record reaches private providers is known for <!-- GEN:strainsplitknown -->53 of 65<!-- /GEN:strainsplitknown -->. Of the known classes, <!-- GEN:strainbasis -->15 from our country files alone, 30 from the outside research alone and 8 from both, in agreement<!-- /GEN:strainbasis -->. Each class from the outside research rests on one quoted sentence from a named source, mostly laws, ministries and system operators. Each quote was fetched again and checked against its page, except on two pages that block automated access.

### 9.5 What it shows

By record class: <!-- GEN:strainclasses -->12 connected, 37 partial, 4 split and 12 unknown<!-- /GEN:strainclasses -->. Split means private providers do not write to the record the public system uses. Partial means some do, or some services do: often the gap is a single kind of provider, such as private imaging in one province. Counting both, in <!-- GEN:strainnotfull -->41 of the 53<!-- /GEN:strainnotfull --> countries we could check the public health record does not fully reach private care; most of those are partial, not split. <!-- GEN:strainthree -->Mexico and South Africa<!-- /GEN:strainthree --> carry three of the four flags; in both, the fourth is waits, which are not reported.

**Canada, a worked example.** <!-- GEN:straincanada -->Canada has 28.54 doctors per 10,000 (WHO, 2024), 31 of 38 OECD members (1 = most), and 116.18 nurses and midwives (14 of 38). Its median waits from specialist assessment to treatment are 120 days for a hip and 146 for a knee (OECD, 2025), 9 of 18 and 12 of 18 reporting members (1 = longest). Voluntary insurance pays 12.66% of health spending (2023), 2 of 35 OECD members with a value, and 67% of people hold it (2025, provisional); OECD reports no figure for duplicate cover. The record-split class is partial: British Columbia Ministry of Health, Digital Health Initiative: Health Gateway 'Diagnostic Imaging Reports' frequently asked questions states "Diagnostic imaging reports from most private clinics will not be available in Health Gateway as they currently are not available to our provincial repository." Canada carries 1 of 4 flags, and all four were measured<!-- /GEN:straincanada -->. Canada's doctor count is low among OECD members but above the index's lower quartile, so its staffing flag is false; its one true flag is waits. Its record reaches some private providers and not others, province by province and service by service. The data does not show waits driving people into a parallel private system for the same care: duplicate private insurance, the kind that buys a faster route to care the public plan already covers, has no OECD figure for Canada. The countries where OECD reports the most duplicate cover are <!-- GEN:straindup -->Israel (87.6% of people; record class unknown), Ireland (46% of people; record class partial) and Australia (45.4% of people; record class partial)<!-- /GEN:straindup -->.

### 9.6 Guards against reading it as a ranking

These are the layer's design rules for the interactive index.

- No composite and no flag-count column. Countries are listed alphabetically, never by flags.
- No colour, and no mark on the globe, the map or the ranked table, so the layer cannot read as a second score.
- Unknown is printed as the word "unknown", so missing data cannot pass for low strain.
- The quartiles across all countries mostly sort by national income. For OECD members we show the OECD rank beside each value.
- Voluntary insurance excludes compulsory private insurance, which is large in the United States, the Netherlands and Switzerland. It is shown separately.
- We do not correlate the record class with the journey or clinician scores. Where the class comes from our own country files, the two share a source and would agree by construction.

### 9.7 Status of the hypothesis

The hypothesis is not tested here. Public data can measure each link: staff, waits, private spending, and whether the record reaches private providers. It cannot test the causal step, that waits push people to private care and that this care then splits their record. That would need data on who goes private and why, and on what happens to their record when they do.

## 10. A method note: counting posts on X

We tried to count posts on X (formerly Twitter) about real problems with health records, as a second view of what people report. We used the official X API (full-archive counts and search) for posts from <!-- GEN:xwindow -->2024-10-01 to 2026-09-30<!-- /GEN:xwindow -->, with one query per country in its main languages. Raw counts are not a measure: most matching posts are policy talk, news about other countries, spam or jokes. So an agent read a random sample of matching posts for each country and classified each against a written definition. A country's figure would be shown only if at least 60% of at least 20 sampled posts were on topic. Two deliberately broad test queries failed the gate, which shows the gate can reject a broad query.

Only <!-- GEN:xgate -->7 of 43<!-- /GEN:xgate --> countries passed: <!-- GEN:xusable -->Argentina, Chile, Germany, Mexico, Netherlands, Poland and Spain<!-- /GEN:xusable -->. Most of what passed was breach news, recall was not measured, and the figures could not be compared across countries because X use and query breadth differ by country. The <!-- GEN:xnotcovered -->22<!-- /GEN:xnotcovered --> countries added after the run started were not measured. We therefore do not show X counts in the index. For most countries, public posts on X cannot be turned into a usable count of record problems. No post text, handle or post identifier is kept in the repository.

## 11. Authors' position: the record should travel with the person

*This section is the authors' position, not a finding. It aligns with what SuperTruth sells (see Conflict of Interest).*

<!-- GEN:strongshared -->All 9 countries in the Strong band are Shared<!-- /GEN:strongshared -->: they give the person a register of consent, a log of who looked, and a copy of their own record, inside infrastructure that the state or providers run. That is a real achievement, and most countries in this index fall short of it. It is also not the same as the person holding the record.

As clinical AI reads more records, the question of who holds them becomes a question of who can check them. Records contain errors that the people they describe can see. In a survey at three US health systems, 21.1% of 22,889 patients who read their visit notes reported a mistake they perceived, and 42.3% of those called it serious [23]. Those are errors as patients perceived them, not errors confirmed by a clinician. A record the person can see is a record the person can correct. A record whose every use is logged is a record whose use can be proven. We think the next step for every system in this index, the strong ones included, is to make the record verifiable by the person it describes.

## Funding

This work was supported by internal funding from SuperTruth Inc. No external funding was received.

## Conflict of Interest

The authors are officers of SuperTruth Inc., which sells health data verification products. SuperTruth funded this work and controlled its design, analysis, writing and the decision to publish. The evidence grade in Section 8 adapts SuperTruth's own Data Trust Index; its source [6] is the first author's own deposit and has not been peer reviewed. The position in Section 11 aligns with what SuperTruth sells. SuperTruth built this index and chose the accounts in Section 5 itself; no country, company or person paid to be included, excluded or scored. Readers should weigh this disclosure when evaluating the results.

## Intended Use

This index is a research tool. It is not legal advice and does not assess the compliance of any organisation. The accounts in Section 5 are summaries of published sources and make no finding of our own about any person or organisation. The context layer in Section 9 is not a score and not a ranking.

## Data and Code Availability

The public release is a clean export of the project, in a public repository linked from the Zenodo record. It holds the scores, category texts, sources, laws, journey maps and news items for every country; the rubric and its v1.1 anchors; the build script that computes every overall score; the audit and the record of score changes; the evidence grade; the strain and split layer; the external cross-check; the stability analysis and the blind re-scoring (plan, rater kit and ratings); and the script that fills every number in this paper. It does not include internal working files such as drafts, launch materials and internal review notes, and it does not include the individual accounts. The paper and data are released under CC BY 4.0 and the scoring and analysis code under the MIT licence, copyright SuperTruth Inc. The dataset DOI is assigned by Zenodo on deposit.

The interactive index is at https://whoholds.supertruth.ai. Each of the <!-- GEN:briefs -->65<!-- /GEN:briefs --> countries also has a printable one-page brief at https://whoholds.supertruth.ai/brief/ISO3/ (for example /brief/FIN/ for Finland). "Ask the index" is an agent on the same page that answers questions only from the index's own data and says so when the index does not hold an answer.

The accounts in Section 5 are linked from the interactive index and are not deposited, so that a removal request can be honoured; aggregate counts are in Tables 4 to 6. Removal and correction requests: see the interactive index.

## Author Contributions

All three authors conceived the index together, directed the research, reviewed the results and approved the final text, and share equal credit.

## About the Authors

**Jason Alan Snyder** is Co-Founder and Chief AI Officer of SuperTruth Inc. **Bobby Hill** is Co-Founder and Chief Executive Officer of SuperTruth Inc. **Dustin Raney** is Chief Strategy Officer of SuperTruth Inc.

## References

[1] European Commission (2025). *Digital Decade 2025: eHealth indicator study.* https://digital-strategy.ec.europa.eu/en/library/digital-decade-2025-ehealth-indicator-study

[2] Slawomirski L, Lindner L, de Bienassis K, Haywood P, Hashiguchi T C O, Steentjes M, Oderkirk J (2023). *Progress on implementing and using electronic health record systems: Developments in OECD countries as of 2021.* OECD Health Working Papers No. 160. OECD Publishing, Paris. https://doi.org/10.1787/4f4ce846-en

[3] Thiel R, Deimel L, Schmidtmann D, Piesche K, Hüsing T, Rennoch J, Stroetmann V, Stroetmann K (empirica) (2019). *#SmartHealthSystems: International comparison of digital strategies.* Bertelsmann Stiftung. Summary (Focus Europe): https://www.bertelsmann-stiftung.de/fileadmin/files/Projekte/Der_digitale_Patient/VV_SHS_Europe_eng.pdf. Full study: https://www.bertelsmann-stiftung.de/fileadmin/files/Projekte/Der_digitale_Patient/VV_SHS-Studie_EN.pdf

[4] World Health Organization. *Global Digital Health Monitor.* Data accessed 1 October 2026. https://data.who.int/dashboards/gdhm/data

[5] Regulation (EU) 2025/327 of the European Parliament and of the Council of 11 February 2025 on the European Health Data Space and amending Directive 2011/24/EU and Regulation (EU) 2024/2847. OJ L, 2025/327, 5 March 2025. CELEX 32025R0327. ELI: http://data.europa.eu/eli/reg/2025/327/oj. In force 25 March 2025; applies from 26 March 2027, with the patient access rights (Articles 3 to 15) applying from 26 March 2029 or 26 March 2031 depending on the data category, and the secondary use chapter (Chapter IV) from 26 March 2029, with listed exceptions (Article 105).

[6] Snyder J A (2026). *The Data Trust Index: A Multidimensional Framework for Evaluating Health Data Integrity in AI Systems.* Zenodo. https://doi.org/10.5281/zenodo.19601616

[7] Essén A, Scandurra I, Gerrits R, Humphrey G, Johansen M A, Kierkegaard P, Koskinen J, Liaw S-T, Odeh S, Ross P, Ancker J S (2018). Patient access to electronic health records: Differences across ten countries. *Health Policy and Technology* 7(1):44-56. https://doi.org/10.1016/j.hlpt.2017.11.003

[8] Kharko A, Blease C, Johansen M, Moen A, Scandurra I, McMillan B, Hägglund M (2024). Mapping patients' online record access worldwide: Preliminary results from an international survey of healthcare experts. In *MEDINFO 2023: The Future Is Accessible.* Studies in Health Technology and Informatics 310:114-118. IOS Press. https://doi.org/10.3233/shti230938

[9] Hägglund M, Kharko A, Hagström J, Bärkås A, Blease C, et al. (2023). The NORDeHEALTH 2022 patient survey: Cross-sectional study of national patient portal users in Norway, Sweden, Finland, and Estonia. *Journal of Medical Internet Research* 25:e47573. https://doi.org/10.2196/47573

[10] Hägglund M, Kharko A, Bärkås A, Blease C, Cajander Å, et al. (2024). A Nordic perspective on patient online record access and the European Health Data Space. *Journal of Medical Internet Research* 26:e49084. https://doi.org/10.2196/49084

[11] Moll J, Scandurra I, Bärkås A, Blease C, Hägglund M, Hörhammer I, Kane B, Kristiansen E, Ross P, Åhlfeldt R-M, Klein G O (2024). Sociotechnical cross-country analysis of contextual factors that impact patients' access to electronic health records in 4 European countries: Framework evaluation study. *Journal of Medical Internet Research* 26:e55752. https://doi.org/10.2196/55752

[12] Munung N S, Staunton C, Mazibuko O, Wall P J, Wonkam A (2024). Data protection legislation in Africa and pathways for enhancing compliance in big data health research. *Health Research Policy and Systems* 22:145. https://doi.org/10.1186/s12961-024-01230-7

[13] Townsend B A, Sihlahla I, Naidoo M, Naidoo S, Donnelly D-L, Thaldar D W (2023). Mapping the regulatory landscape of AI in healthcare in Africa. *Frontiers in Pharmacology* 14:1214422. https://doi.org/10.3389/fphar.2023.1214422

[14] Alegre V, Álvarez M Y, Bianchini A, Buedo P, Campi N, et al. (2024). Salud digital en América Latina: legislación actual y aspectos éticos. *Revista Panamericana de Salud Pública* 48:e40. https://doi.org/10.26633/rpsp.2024.40

[15] Essén A, Stern A D, Haase C B, Car J, Greaves F, Paparova D, Vandeput S, Wehrens R, Bates D W (2022). Health app policy: International comparison of nine countries' approaches. *npj Digital Medicine* 5:31. https://doi.org/10.1038/s41746-022-00573-1

[16] World Health Organization. *Global Health Observatory: National Health Workforce Accounts,* indicators HWF_0001 (medical doctors per 10,000) and HWF_0006 (nursing and midwifery personnel per 10,000), December 2025 update. https://ghoapi.azureedge.net/api/HWF_0001

[17] World Health Organization. *Global Health Expenditure Database,* release of 12 December 2025. https://apps.who.int/nha/database

[18] OECD. *OECD Health Statistics: Waiting times* (DSD_HEALTH_PROC@DF_WAITING) and *Healthcare coverage* (DSD_HEALTH_PROT@DF_HEALTH_PROT). https://sdmx.oecd.org

[19] Björnberg A, Phang A Y (2019). *Euro Health Consumer Index 2018 Report.* Health Consumer Powerhouse. Grey literature. Opened through the Internet Archive: https://web.archive.org/web/2019/https://healthpowerhouse.com/media/EHCI-2018/EHCI-2018-report.pdf

[20] Health Consumer Powerhouse (2009). *The Empowerment of the European Patient 2009: options and implications.* Grey literature. https://www.elpartoesnuestro.es/sites/default/files/2011/09/the-empowerment-of-the-european-patient_1.pdf

[21] Nardo M, Saisana M, Saltelli A, Tarantola S (European Commission Joint Research Centre); Hoffmann A, Giovannini E (OECD) (2008). *Handbook on Constructing Composite Indicators: Methodology and User Guide.* OECD Publishing, Paris. ISBN 978-92-64-04345-9. https://doi.org/10.1787/9789264043466-en

[22] Flemyng E, Noel-Storr A, Macura B, Gartlehner G, Thomas J, Meerpohl J J, et al. (2025). Position statement on artificial intelligence (AI) use in evidence synthesis across Cochrane, the Campbell Collaboration, JBI and the Collaboration for Environmental Evidence 2025. *Environmental Evidence* 14:20. https://doi.org/10.1186/s13750-025-00374-5. Published at the same time in the Cochrane Database of Systematic Reviews, Campbell Systematic Reviews and JBI Evidence Synthesis.

[23] Bell S K, Delbanco T, Elmore J G, Fitzgerald P S, Fossa A, Harcourt K, Leveille S G, Payne T H, Stametz R A, Walker J, DesRoches C M (2020). Frequency and types of patient-reported errors in electronic health record ambulatory care notes. *JAMA Network Open* 3(6):e205867. https://doi.org/10.1001/jamanetworkopen.2020.5867

[24] Besley T, Hall J, Preston I (1999). The demand for private health insurance: do waiting lists matter? *Journal of Public Economics* 72(2):155-181. https://doi.org/10.1016/s0047-2727(98)00108-x

[25] Johar M, Jones G, Keane M, Savage E, Stavrunova O (2011). Waiting times for elective surgery and the decision to buy private health insurance. *Health Economics* 20(S1):68-86. https://doi.org/10.1002/hec.1707

[26] Hermus M, Scharloo-Karels C H, Ikram M A, Andrinopoulou E-R, Rizopoulos D, Marck D H, Michels M, van Kemenade F (2025). Opt-in versus opt-out for the secondary use of routinely recorded health data: A randomized controlled trial. *European Journal of Internal Medicine* 133:100-105. https://doi.org/10.1016/j.ejim.2025.01.017

[27] Liu V, Musen M A, Chou T (2015). Data breaches of protected health information in the United States. *JAMA* 313(14):1471. https://doi.org/10.1001/jama.2015.2252 (corrected version).

[28] Jiang J X, Ross J S, Bai G (2025). Ransomware attacks and data breaches in US health care systems. *JAMA Network Open* 8(5):e2510180. https://doi.org/10.1001/jamanetworkopen.2025.10180

[29] Richwine C, Johnson C, Patel V (2023). Disparities in patient portal access and the role of providers in encouraging access and use. *Journal of the American Medical Informatics Association* 30(2):308-317. https://doi.org/10.1093/jamia/ocac227
