# Data license: Health Record Rights Index

The data and scores of the Health Record Rights Index are licensed under the Creative Commons Attribution 4.0 International License (CC BY 4.0), https://creativecommons.org/licenses/by/4.0/. The code in this repository is under the MIT license (see `LICENSE`).

This file covers the data in this repository (`data/`, `data/us-states/`, `exports/` and the analysis files) and the same data as the site publishes it: the downloads, the API at https://healthrecordrights.com/api/v1/ and the MCP server at https://healthrecordrights.com/mcp.

## What is licensed under CC BY 4.0

SuperTruth, Inc. licenses the following under CC BY 4.0:

- the scores (overall and per category), bands, ranks, likely rank ranges, lead-group flags, confidence labels and evidence grades;
- the state answers (status, level or value, and our plain-English answer and short label for each question);
- our own words: summaries, details, headlines, "why it matters" lines, paraphrases of real cases (served by the site and the API, not stored in this repository), notes and labels;
- the structure of the data: the field names, the way records are arranged, and the selection of sources and laws.

**Credit line:** "SuperTruth, Inc., Health Record Rights Index", with a link to https://healthrecordrights.com/.

To cite the index in research, see `CITATION.cff` and the README.

## What is not relicensed

CC BY 4.0 covers only what SuperTruth owns. These parts of the data belong to others and keep their owners' terms. Publishing them in our data does not license them to anyone:

- **Quoted text from laws and other sources.** The `quote` field of every state provision, the fee-rule quotes inside `facts`, and any other words in quotation marks are the words of a legislature, agency, court or publisher. Many government texts are free to reuse, but that comes from their own terms, not from us.
- **Titles of third-party pages.** Source titles, law names and news headlines written by others are recorded as they appear, so a reader can find the page. They stay with their authors.
- **The linked pages themselves.** Every URL points to a page we do not own. We do not copy, host or license those pages, and they are not in this repository.
- **Trademarks and names.** DTI™ is a trademark. SuperTruth is a trademark of SuperTruth, Inc. CC BY 4.0 grants no trademark rights.

The API's `license` object says the same in two fields, `covers` and `excludes`, on every answer.

## Automated access

You may read this data by automated means, through the API, the MCP server and the downloads, within the rate limit: 60 requests a minute per address, with bursts up to 120. For the whole index at once, use the downloads.

## Not advice, no warranty

The data is a research tool, not legal or medical advice. Scores rate national law and infrastructure, not any hospital, doctor, insurer or company. The data is provided as is, without warranty, as section 5 of CC BY 4.0 sets out.
