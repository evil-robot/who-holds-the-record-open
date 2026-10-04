# Decision rules: US state layer (house gate 16)

Each rule names the incident or reason that bought it, the number that proves it, and the check that enforces it. From PLAN.md section 12. A rule with no check yet says so.

| Rule | Why | Proof | Check |
|---|---|---|---|
| The layer never moves a national score or the data hash. | Owner's brief: a context layer. A test on 3 Oct 2026 showed the hash gate is blind to a stray `data/CA.json`. | Baseline `national_baseline.json`: datahash 676e7813...e008, eight USA category scores. | `verify_states.py` cases 1, 2; fixtures `red_c1_*`, `red_c2_*`. |
| Unknown is not no. `not_checked` (null) and `no_law_found` (a finding with a log) are never merged or counted together. | The strain layer's rule. | Fixture `red_c4_aggregate_counts_null_as_zero`. | Cases 4, 10. Display review: no check yet. |
| Only an in-force provision earns a level. | Study 2's PRY.access disagreement (a law not yet in force). | Fixtures `red_c5_*`, `red_c6_*`, `red_c7_*`. | Cases 5, 6, 7. |
| No level without a primary page opened in the session and a quote found in the raw page. | Gate 2, no fabrication. | 20 red transcripts in `adversary/audit/`; fixtures `red_c11_*`. | `audit_research.py`; case 11. |
| Every session bills the SuperTruth key. | Owner's billing rule, 3 Oct 2026. | Org id 884d6716... confirmed by header; an invalid key made the CLI fail 401 with no fallback. | `audit_research.py` (apiKeySource), fixtures `red_billing_*`. |
| No composite, no rank. | PLAN.md section 6. | Fixtures `red_c13_*`. | Case 13. |
| D4 carries no valence word and is never mapped. | Neutrality. | Fixture `red_c12_valence_word_d4_note`. | Case 12. Mapping: display rule, no check yet. |
| The cross-checker is trusted only if it disputes at least 22 of 24 planted cells. | Gate 11. | Main run only; the pilot's four plants are a smoke test (D-2). | `plant.py grade` on the committed ledger. |
| A dimension below 70% exact agreement in arm A is table only. | PLAN.md section 7. | Not yet run. | No check yet (the analyze script is written for the re-score). |
| SDOH figures carry source and real period, share-vintage ratios only, reconciled slugs only, county weights only on matching county sets, and every DataSpine value verified at its publisher. | Gate 3, the DataSpine traps, D-4. | Fixtures `red_c17_*` (11). | Case 17. |
| Coverage floors (cells not `not_checked`, per dimension) only ratchet up. | Gate 16. | Created with the first verified main run. | `coverage_baseline.json`: no check yet. |

## Rules added by the pilot (3 Oct 2026)

| Rule | Why | Proof | Check |
|---|---|---|---|
| The session runner never executes from a file that can change under it. | D-10: an edit during the pilot research runs made zsh misparse after `claude` exited. | Unguarded copy reproduced the misparse; guarded copy ran clean. | `run_session.sh` snapshot guard. |
| The cross-checker sees the researcher's file only, never the harness's verification marks. | D-9: `quoteVerified: "raw"` beside a planted quote invites the cross-checker to skip the check. | Planted copies carry 0 `quoteVerified` fields (grep). | `plant.py` strips them. |
| The transcript audit is frozen for the main run; a new false alarm is reported, not fixed mid-run. | D-6, D-8, D-11: eight false-alarm shapes in four pilot transcripts, no true violation. | 46 planted transcripts, 14 good and 32 red. | `audit_research.py --selftest`; no check enforces the freeze itself (process rule). |
| A quote checked against its raw page must be found there; a fetched page is never excused as "session". | D-7: a citation-token test marked 7 fetched DC pages "session", which skips the quote check. | After the fix: DC 14 of 14 and LA 18 of 18 quotes found in the stored pages. | `raw_fetch.py`; verifier case 11. |

## Rules added by the main run (3 and 4 Oct 2026)

| Rule | Why | Proof | Check |
|---|---|---|---|
| No audit rule changes without an independent adversarial review, and every change is disclosed. | D-20: the audit was amended mid-run after transcripts were seen; a fresh reviewer then found 41 holes in the first draft. | 106 planted transcripts (46 standing, 12 for D-20, 48 from the reviewer), all correct; 119 with D-20b, D-20c and D-23. | `audit_research.py --selftest`. |
| Shell commands are judged by tokens, not by string patterns. | D-20: string patterns both missed real attacks and failed harmless syntax. | Reviewer probes (`adversary/review_d20/`). | `bash_check.py`, used by every audit. |
| The arm A rater cannot leave the cited sources: Read only, no network, by mechanism. | D-22: in the first run all 16 rater sessions fetched uncited pages, 54 of them web searches. | Live attack test: six network routes all blocked (`main/locktest/`); 14 planted locked-arm cases. | `run_session.sh` (sandbox and API-only proxy), `audit_raters.py`. |
| CLI side-files stay in the session's scratch dir. | D-23: three sessions read the CLI's own output files outside their sandbox. | Session config and memory written under `<scratch>/.cfg`. | `CLAUDE_CONFIG_DIR` and `TMPDIR` in `run_session.sh`. |
| A billing error stops the queue; every session bills the SuperTruth key. | D-19: one outage ran 50 states and DC through a credit error in minutes. | Stub test: 2 of 6 launched, then stopped. | `run_queue.py`; apiKeySource in every audit. |
| Spend never passes the owner's cap. | Coordinator's stop rule. | Stub tests both ways. | `run_queue.py` reserve gate. |
| Rulings apply all-or-nothing, against exact current values; composed text is flagged; the harness alone sets quote checks. | D-25 to D-27: rulings were written in prose. | 0 rows applied twice on re-run (before-value mismatch); every change in `main/rulings_applied.json`. | `apply_rulings.py`. |
| Author-ruling exceptions are counted and reported, never silent passes. | D-26 Q3 and Q6, D-27 Q168. | 13 exceptions listed by the verifier. | `verify_states.py` (cases 8 and 9, fixtures `d26_*`, `d27_*`). |
| A formerly excluded SDOH slug is shown only with a matching Census reconciliation in the same build. | D-28: DataSpine fixed three excluded slugs. | 867 publisher checks, 0 mismatches. | `verify_states.py` case 17 (fixtures `c17_fixed_slug_*`). |
| Coverage per dimension only ratchets up. | Gate 16. | `coverage_baseline.json` recorded 4 Oct 2026. | `build_aggregate.py` refuses a drop. |
