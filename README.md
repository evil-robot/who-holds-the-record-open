# Who Holds the Record

An open index of health record rights in 65 countries, by SuperTruth Inc. Each country scores 0 to 100 on one question: can a person see, control and share their own health record?

In 2026, none of the 65 countries we rated puts a person fully in charge of their own health record. Finland scores highest at 71 of 100, one point ahead of Denmark (70); we treat gaps of 4 points or less as ties. The median is 57. By band, 9 countries rate Strong, 45 Mixed and 11 Weak, and none reaches Leading (85 and up). Control sits with the state or providers everywhere: 44 Shared, 7 Institutional, 14 State. Data as of 2 October 2026.

- Live index, country briefs and the Ask the index tool: https://whoholds.supertruth.ai
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

Eight weighted categories: patient access to the full record (20%), patient control and consent (20%), privacy and security (15%), connected care journey (15%), protection from commercial use (10%), clinician access at the point of care (10%), research and trial consent (5%) and clinical AI governance (5%). Research agents built on Anthropic's Claude researched each country in its own language, opening every cited source; a second agent cross-checked each country against the rubric anchors and peer countries; the authors reviewed the results. Everything comes from public information: laws, government and regulator pages, court decisions and published news. Scores move in steps of about 5 points, so read ranks as ranges.

## How to cite

Snyder, J. A., Hill, B., & Raney, D. (2026). Who Holds the Record (version 1.0). SuperTruth Inc. https://whoholds.supertruth.ai/

The three authors conceived the index together and share equal billing.

## Licences

- Data, scores and paper: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Credit SuperTruth and link the index.
- Code: MIT (see `LICENSE`).
- The SuperTruth name and logos in `brand/` are trademarks of SuperTruth Inc. and are not covered by either licence.

## Disclosure and corrections

SuperTruth sells health data verification products. We built this index and chose its stories ourselves; no one paid to be included. This is a research tool, not legal advice. If we got a country wrong, open an issue with the page that shows it and we will fix it in the open.

The published accounts of record problems shown on the site are not deposited here, so that a removal request can be honoured; each links to its public source on the site.
