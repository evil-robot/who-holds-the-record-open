# How the editor rulings were made (state layer, main run)

**Disclosure, for the paper and the state methods text.** The editor rulings for the state layer were drafted by an agent against the primary sources and approved by the authors (J. A. Snyder, in consultation with co-authors R. P. Hill IV and D. Raney; 3 October 2026). Judgment calls were held back from that approval and ruled by the authors separately (DEVIATIONS D-26, D-27 and D-29; who ruled: D-31). This text, or a faithful summary of it, must appear in the paper and in the state-layer methods text, beside the D-20 audit disclosure.

## What was ruled on

- The editor queue as rebuilt after the blind re-score and the second search (`editor_queue.json`, commit 1c457af): 219 items on 146 cells. That is 86 cross-check disputes, 71 quotes not found on the stored page, 28 evidence-rule failures (12 missing effective dates, 16 quotes over 50 words), 17 Alabama URLs whose text never reached the research session, 4 non-official evidence hosts, 4 arm B misses, 3 arm A disagreements, and 6 second-search findings (D-24).
- The 24 planted cells whose cross-check verdict was set aside. Nobody had checked them, so each got a full cross-checker's check.
- The 9 unplanted New Jersey cells. These were checked before NJ cross-check r3 passed, and compared with it afterwards: r3 confirmed all 9, and this check agrees on every status and value. One quote was re-cut (Q109, repeated as NJ-7), because the harness could not match it across a PDF line break.

## How

1. **Drafting.** Sixteen headless agent sessions (claude CLI 2.1.288, model claude-opus-5-5, SuperTruth Anthropic key, no MCP servers, each in its own scratch directory under /tmp, outside the study tree). Each session got the rubric, the plan, the deviations log, the harness's own quote checker (`quotecheck.py`, copied), and a package of items. That package held each item's researcher and cross-checker readings, the assembled cell, and the harness's extracted text of the stored raw page. Measured cost: $48.18, by the CLI's own per-session reports, plus the coordinating session.
2. **Evidence rule.** Every proposal cites a page the session opened with curl on 3 October 2026, with a quote of 50 words or fewer copied from the saved page text. WebFetch and WebSearch were used only to find pages, because WebFetch returns a model-condensed reading (PLAN.md section 13). Leads (Justia, FindLaw, CourtListener, law firms, press) were never used as evidence.
3. **Quote checks.** Every proposed quote was tested with `quotecheck.quote_in`, the same normalising substring test the harness uses (PLAN.md section 3, verifier case 11). The coordinator then re-ran that test, independently, against every page each session had saved. All quotes passed, all were 50 words or fewer, and rows on the same cell were checked to give one outcome. For the 37 Alabama rows (31 of them ruled) that move the evidence URL to the legislature's own API (a GET request on alison.legislature.state.al.us), the quotes were also tested on the raw API bytes with the harness's own text extraction, without JSON parsing: all pass. Every ruled row's URL is on a .gov or .us host, or on a vendor or HIE host whose provision carries a .gov or .us linkedFrom.
4. **Allowed rulings only.** keep as researched; take the cross-checker's version; correct (field by field, with a quote and URL); mark unverifiable (the cell is set to `not_checked`, the plan's status for evidence that fails the rules, since the rubric has no "not established" status); escalate.
5. **Coordinator adjustments**, each stated in the affected entry: three Massachusetts one-day date disputes were moved from "not_checked" to escalation, with a recommendation; four groups of rows that touched the same cell from different sessions were aligned to one ruling (NM breach quote, the IA, SD and WV quote trims, NH reproductive status, DC genetic); and the anchor rows (AK and ND D1; TX, SD and KY D6) were cross-referenced so each is ruled once.

## Which rows became rulings, and which were escalated

Fixed by the owner's instruction (relayed 3 October 2026) before the split was computed:

- **Ruled** (approved by the authors): the drafting check was "sure", meaning mechanical, with a primary-source quote that passed the quote check, AND the ruling neither moves a level by more than one step, nor moves a cell to or from `not_checked`, nor changes a nominal value.
- **Escalated:** every judgment call; every row the drafting check was not sure of; every row that would change a level by more than one step, take a cell off the map, or change a nominal value; every row on a cell where an arm B rater reported a missed law (AK copy rights, FL reproductive records, AL private right). One exception, ID copy rights: the conflict was settled by a primary source, the Idaho Administrative Bulletin of 2 July 2025, which records IDAPA 16.03.14 as void from 1 July 2025.
- **No ruling needed:** New Jersey cells that both this check and NJ cross-check r3 confirmed unchanged.

Result: 252 rows (219 queue, 24 planted, 9 New Jersey). 146 ruled, 98 escalated (on 71 cells), 8 needed no ruling. No ruled row changes any cell's level or value. Six ruled rows (Q007 to Q009, Q077 to Q079) correct dates using a default-date rule; they reopen if the reviewers reject default dates (ESCALATIONS.md, question 4). Every level or value change is in the escalation brief (`ESCALATIONS.md`) with options and a recommendation.

## Limits

- The drafting sessions, the researchers, the cross-checkers and the raters are the same model family. Shared priors can make them agree on a wrong reading. The escalation rule sends every interpretation question to people for this reason.
- "Sure" means the deciding text was on the page and the change was mechanical. It does not mean a lawyer reviewed it. This is not legal advice.
- Some official pages could not be read by curl (Cloudflare blocks, HTTP 403 or 404 on archives, script-built pages). Where that left a date or a quote unverified, the row says so and was escalated or marked `not_checked`, never filled from memory.
- The rulings were drafted after the blind re-score had run. The agreement figures in `reliability.json` predate them (D-18).

## Files

- `EDITOR_PROPOSALS.md` and `editor_proposals.json`: every row, with its disposition (ruled, escalated, no ruling needed), quote, URL, quote check and pages opened.
- `ESCALATIONS.md`: a brief drafted for outside reviewers; never sent. The authors ruled on its questions themselves (D-26, D-27, D-29, D-31).
- Applying the ruled rows to `main/final/` and re-running the verifier is the run agent's step. Nothing here edits a study file.
