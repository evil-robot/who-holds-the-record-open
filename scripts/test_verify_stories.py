"""Adversarial test for verify_stories.py: one clean story plus eight planted violations; all eight must fail, the clean one must pass.
Run: /usr/bin/python3 scripts/test_verify_stories.py"""
import json, os, shutil, subprocess, sys, tempfile
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
good = {"id": "USA-S001", "iso3": "USA", "date": "2026-08", "headline": "Patient waited two years for records", "source": "HHS",
        "url": "https://www.hhs.gov/", "why": "Shows slow access", "theme": "access_delay_or_cost", "sourceType": "regulator_decision",
        "status": "finding", "paraphrase": "A patient waited about two years.", "quote": None, "lang": "en", "personNamed": False,
        "providerName": "Azul Vision", "subjectAdult": True, "subjectDeceased": False, "consentEvidence": "published decision",
        "reviewedBy": "t", "reviewedOn": "2026-10-01", "removed": False, "removedOn": None, "removalReason": None}
src = json.load(open(os.path.join(ROOT, "data/USA.json")))["categories"]["access"]["sources"][0]["url"]
bad = {"USA-S002": dict(url="https://www.reddit.com/r/x"), "USA-S003": dict(status="alleged", url="https://a.org/1"),
       "USA-S004": dict(personNamed=True, url="https://a.org/2"), "USA-S005": dict(sourceType="journalism", quote="hi", url="https://a.org/3"),
       "USA-S006": dict(paraphrase="w " * 41, url="https://a.org/4"), "USA-S007": dict(url=src),
       "USA-S008": dict(subjectAdult=False, url="https://a.org/5"), "USA-S009": dict(headline="a — b", url="https://a.org/6")}
with tempfile.TemporaryDirectory() as d:
    os.makedirs(f"{d}/stories"); os.makedirs(f"{d}/data")
    shutil.copy(os.path.join(ROOT, "data/USA.json"), f"{d}/data/")
    json.dump({"iso3": "USA", "stories": [good] + [dict(good, id=k, **v) for k, v in bad.items()]}, open(f"{d}/stories/USA.json", "w"))
    out = subprocess.run([sys.executable, os.path.join(ROOT, "scripts/verify_stories.py"), "--no-net"], cwd=d, capture_output=True, text=True).stdout
failed = {l.split()[1].rstrip(":") for l in out.splitlines() if l.startswith("FAIL")}
ok = failed == set(bad) and "USA-S001" not in failed
print(out.strip()); print("PASS: all 8 planted violations caught, clean story passed" if ok else f"TEST FAILED: caught {sorted(failed)}")
sys.exit(0 if ok else 1)
