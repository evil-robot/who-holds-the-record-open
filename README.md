# Health Record Rights Index

An open index of health record rights in 198 countries and territories (all 193 UN member states, plus Greenland, Kosovo, Palestine, Taiwan and Vatican City), by SuperTruth Inc. Each country scores 0 to 100 on one question: can a person see, control and share their own health record?

In 2026, none of the 198 countries and territories we rated puts a person fully in charge of their own health record. Finland, Denmark, Estonia, Hungary and Sweden lead; allowing for scoring error, any of them could rank first, so we name them together. The median is 39. By band, 9 rate Strong, 66 Mixed, 111 Weak and 12 Poor, and none reaches Leading (85 and up). Control sits with the state or providers everywhere: 51 Shared, 81 Institutional, 66 State. Data as of 2026-10-02.

- Live index, country briefs and the Ask the index tool: https://healthrecordrights.com
- Paper: `paper/paper.pdf` (source `paper/paper.md`)

## What is here

| Path | What it holds |
|---|---|
| `data/` | One JSON file per country: eight category scores, summaries, detail, laws and every cited source with its date |
| `exports/` | The same data as CSV and JSON for analysis |
| `RUBRIC.md`, `docs/RUBRIC_V1_1_ANCHORS.md` | The scoring rubric and its anchors |
| `docs/SCORE_CHANGES.md`, `docs/DEEPEN_43.md` | Every score change, with the reason |
| `docs/STORIES_RULES.md`, `docs/DTI_EVIDENCE.md` | Rules for the stories layer and the evidence grade |
| `analysis/` | Consistency audit, ranking stability tests, blind re-scoring reliability, comparison with other indices, literature review, health-system strain context |
| `build.js` and friends | The code that builds the site from the data (`node build.js` writes `out/`) |

## Method in brief

Eight weighted categories: patient access to the full record (20%), patient control and consent (20%), privacy and security (15%), connected care journey (15%), protection from commercial use (10%), clinician access at the point of care (10%), research and trial consent (5%) and clinical AI governance (5%). Research agents built on Anthropic's Claude researched each country in its own language, under a rule that every cited source be opened (link check results in the paper); a second agent session of the same model family cross-checked each country against the rubric anchors and peer countries; the authors reviewed the results. Everything comes from public information: laws, government and regulator pages, court decisions and published news. Read ranks as the likely ranges published with each country, not as single positions.

## How to cite

Snyder, J. A., Hill, B., & Raney, D. (2026). The Health Record Rights Index (version 1.0). SuperTruth Inc. https://healthrecordrights.com/

The three authors conceived the index together and share equal billing.

## Licences

- Data, scores and paper: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Credit SuperTruth and link the index.
- Code: MIT (see `LICENSE`).
- The SuperTruth name and logos in `brand/` are trademarks of SuperTruth Inc. and are not covered by either licence.

## Disclosure and corrections

SuperTruth sells health data verification products. We built this index and chose its stories ourselves; no one paid to be included. This is a research tool, not legal advice. If we got a country wrong, open an issue with the page that shows it and we will fix it in the open.

The published accounts of record problems shown on the site are not deposited here, so that a removal request can be honoured; each links to its public source on the site.
