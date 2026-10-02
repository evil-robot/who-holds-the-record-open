"""Build the blind rater prompt for one batch: rubric + redacted anchors + country, category, cited URLs. Nothing else."""
import json, sys, pathlib
KIT = pathlib.Path(__file__).resolve().parents[1] / "rater_kit"
tasks = json.load(open(sys.argv[1]))
rubric = (KIT / "RUBRIC.md").read_text()
anchors = (KIT / "RUBRIC_V1_1_ANCHORS_REDACTED.md").read_text()
lines = []
for t in tasks:
    lines.append(f"- task_id: {t['task_id']}\n  country: {t['name']}\n  category: {t['category']}\n  sources:\n" +
                 "\n".join(f"    - {u}" for u in t["urls"]))
print(f"""You are an independent rater for a health data rights index. Score each task below from 0 to 100 using ONLY the
rubric and anchors printed here and the pages at the listed source URLs.

Rules (binding):
1. Open the listed source URLs for each task with WebFetch. If WebFetch fails on a URL, you may try
   curl -sL -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36" <url>
   (pipe through head or sed to keep output short). Open no other URL, no search engine, no local file, and no
   site that publishes health data rights scores. Do not run any command other than curl.
2. Score from what the sources show, read against the rubric anchors and the redacted sub-anchors. Where the
   sources are silent on a criterion, treat it as not verified (the evidence rule applies).
3. If you could open none of a task's sources, return score null and say so. Do not guess from memory.
4. Work through every task. Keep fetch prompts focused on the category's criteria.

At the very end, output exactly one fenced ```json block holding an array, one object per task:
{{"task_id": "...", "score": <integer 0-100 or null>, "sources_opened": ["<url>", ...], "sources_failed": ["<url>", ...],
 "reason": "<one line, the facts that set the band and the move inside it>"}}

==== RUBRIC.md ====
{rubric}
==== RUBRIC_V1_1_ANCHORS (redacted) ====
{anchors}
==== TASKS ====
""" + "\n".join(lines))
