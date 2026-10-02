# Record split: primary-source research

Researched 1 Oct 2026. Output: `record_split_research.json`, one entry per country: class, quote, url, source, date, notes. This research edited nothing in `strain.json`, `data/` or the build. `build_strain.py` now has a `merge_research` step that reads this file on the next build. A dry run in memory accepted all 49 entries and flagged one conflict, Greece. On that run the research class replaces every file "unknown", including the three flagged entries below.

## The question

When a person is treated by a private provider, is that care written into the record the public system uses (national, provincial or regional EHR, patient summary, national portal)?

- **Private** means care paid outside the public scheme (out of pocket or by voluntary insurance), or given by a provider outside the public network. A privately owned practice that bills the public plan (Canadian GPs, German Vertragsärzte, French libéraux) is not private here. Private hospitals that deliver publicly funded care are a grey zone, and each entry says which kind of private its quote covers.
- **Write, not read.** The class rests on whether private providers feed the record. A private clinic that can only view a public viewer is not connected. Read access is noted separately.
- **Classes** are the four in METHOD.md section 2, with the same two exclusions: insurer or claims links, and software vendors, are not private care providers. A law in force with a future deadline is partial. A bill not in force counts for nothing.

## How

Nine research agents, one brief (each country researched once). Sources: laws, ministry and operator pages, auditor and inquiry reports, peer-reviewed papers, reputable news, searched in the local language first. The WebSearch budget was spent, so searching ran through SerpAPI. Every quote was copied from the opened page, in the original language, with a translation in notes.

After merging, every quote was fetched again and checked against the page text. 46 of 49 matched (five PDFs needed line breaks ignored; the Hebrew PDF extracts right to left, so its key words were checked instead). For the other three: France was confirmed through a separate fetch, while Denmark (page drawn by script) and Portugal (blocks automated fetches) could not be fetched from here. Their notes say so.

**Independent of the country files.** METHOD.md warns that its record-split classes share a source with the journey score. These classes come from outside sources, so that warning does not apply to them. Each entry's notes still say whether it agrees with the country file.

## Result

49 countries: 8 connected, 28 partial, 4 split (2 flagged: United Kingdom and Nigeria), 9 unknown. The 15 countries not researched already had a class from their country files.

| Country | File class | Research class |
|---|---|---|
| Canada | unknown | partial |
| United Kingdom (England) | unknown | split (flagged) |
| Ireland, Australia, New Zealand, Spain, Germany, India, Colombia | unknown | partial |
| Italy, Portugal, Brazil, Chile | partial | partial |
| Greece | connected | **partial** |
| Poland, France | connected | connected |
| South Africa, Mexico | split | split |
| Other unknowns (31) | unknown | 6 connected, 15 partial, 1 split (Nigeria, flagged), 9 still unknown |

**Canada against the hypothesis.** Partial, province by province, and by service rather than by payer. BC's ministry says reports from most private imaging clinics are not in the provincial repository, and Health Gateway shows only MSP-billed visits. Ontario requires operators of Integrated Community Health Services Centres to send to the EHR when Ontario Health asks. Alberta's Netcare lists private radiology clinics among its contributors. Quebec's law makes private imaging labs, labs and pharmacies feed the Dossier santé Québec, but private physician offices and specialised medical centres can only read it. So private care does break the record in Canada, but in patches. No source says privately paid care as a class is kept out. Nothing was found on private virtual-care or membership clinics.

**Greece** disagrees with its file. Law 4600/2019 requires doctors to write to the record, but lab-result uploads are enforced only for EOPYY-contracted units, from 1 Nov 2026. Private diagnostic centres otherwise upload by choice.

## Editor flags

1. **United Kingdom: split.** Rests on HSSIB (June 2026): "No independent prescribing organisations currently have 'write access' to patients' NHS medical records", plus an NHS England forum reply on read access. No source was found either way on private hospitals. England only.
2. **Nigeria: split.** One hedged sentence ("often operate in silos with minimal data exchange") from a startup-financing paper. Nigeria has no national EHR for private care to feed.
3. **United States: partial.** Scoped to the VA, the only public system that keeps a clinical record. Not a national class.
4. **Softest connected classes:** Lithuania (operator statement; the statute could not be opened) and Liechtenstein (no compliance rate published).
5. **Spain** rests on a news subheading (Redacción Médica, 2022). The primary sources (the ministry's HCDSNS page and Madrid's Ley 11/2022) are in its notes. If the rule of one quoted sentence is applied strictly, promote a primary sentence.
6. **Grey zones:** Taiwan, Korea, Belgium and the Netherlands have mostly privately owned providers that bill public or compulsory insurance. Their classes cover only care outside that insurance, where it could be found.

## Not done

- No rebuild. Before the next build, an editor should decide on the three flagged entries, since the merge would put them into the flags as they stand. The verifier cannot check research quotes. They were checked by hand, as described above.
- Wales, Scotland and Northern Ireland, and Canadian provinces other than the four researched.

## 2 Oct 2026: quotes re-anchored after the deep re-research

Fifteen country files were rewritten on 2 Oct 2026 (ARG AUT BRA CHL FIN FRA GHA ITA MEX POL RWA SGP SWE THA ZAF), so their record-split quotes no longer matched. Each was re-read and given a new quote from the new file under the same rules. Ten keep their class with a new quote: AUT, BRA, ITA, SGP, SWE (partial), POL (connected), MEX, ZAF (split), GHA, RWA (unknown, new note). Five changed:

- **Argentina: partial -> unknown.** The old quote (Ley 27.706 across "public, private and social security sectors") is gone. The new file never mentions private providers.
- **Chile: partial -> split.** "Private links are uneven" is gone. The only public/private sentence left is `categories.journey.detail[2]`: "The Clinic reported that public and private systems remain far from interoperable." That is the split rule. The research file says partial (Ley 21.668 with a lapsed deadline), so the build marks a conflict and the flag follows the file class (now true). Editor to resolve.
- **Finland: connected -> partial.** The new file names a gap: "All public health care, all pharmacies and two thirds of private health firms use Kanta" (`categories.journey.summary`).
- **France: connected -> partial.** The only write-side private figure left is regional: "In Nouvelle-Aquitaine 90% of health establishments and 68.5% of private professionals feed it" (`categories.journey.detail[2]`). The 38,000 private doctors in `categories.clinical` consult the record, which is read access. The research file says connected, so the build marks a conflict; the flag is false either way. Editor to resolve.
- **Thailand: partial -> unknown.** "400 public and private facilities" is gone. The new file counts "about 8,500 clinics and pharmacies" without saying public or private (kept as an unknown note).

Unknown notes for Canada and India were re-anchored to the new wording of the same facts (Canada: 52% of providers share outside their workplace; India: 450 public and private software products). Both still take the research class (partial).

METHOD.md section 2 (its table and the 1 Oct counts) was not updated with these changes.
