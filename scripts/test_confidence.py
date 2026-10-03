"""Proves the confidence check (DECISION_RULES.md rule 4) can fail. Works on a temporary copy of data/; the repository is not touched.
1. The real data passes --check.
2. A "high" country with "not verified" planted in one category summary fails --check, and --write makes it medium.
3. A country with four categories planted with an admission fails --check, and --write makes it low.
Run: uv run --project ~/Projects/ds-lab python scripts/test_confidence.py"""
import json, os, shutil, subprocess, sys, tempfile
REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PY = [sys.executable, os.path.join(REPO, "scripts", "confidence.py")]
fails = 0
def check(name, ok):
    global fails; print(("PASS  " if ok else "FAIL  ") + name); fails += not ok
def run(root, *a): return subprocess.run(PY + ["--root", root, *a], capture_output=True, text=True)
with tempfile.TemporaryDirectory() as t:
    shutil.copytree(os.path.join(REPO, "data"), os.path.join(t, "data"))
    check("real data passes --check", run(t).returncode == 0)
    labels = {f[:3]: json.load(open(os.path.join(t, "data", f)))["confidence"] for f in os.listdir(os.path.join(t, "data"))}
    hi = sorted(i for i, l in labels.items() if l == "high")[0]
    p = os.path.join(t, "data", hi + ".json"); d = json.load(open(p))
    d["categories"]["access"]["summary"] += " Machine-readable export was not verified."
    json.dump(d, open(p, "w"), indent=2)
    check(f"planted admission in high {hi}: --check fails", run(t).returncode == 1)
    run(t, "--write"); check(f"--write sets {hi} to medium", json.load(open(p))["confidence"] == "medium")
    med = sorted(i for i, l in labels.items() if l == "medium")[0]
    q = os.path.join(t, "data", med + ".json"); e = json.load(open(q))
    for k in ("access", "control", "privacy", "commercial"): e["categories"][k]["summary"] += " A key fact could not be verified."
    json.dump(e, open(q, "w"), indent=2)
    check(f"four planted admissions in medium {med}: --check fails", run(t).returncode == 1)
    run(t, "--write"); check(f"--write sets {med} to low", json.load(open(q))["confidence"] == "low")
    check("after --write the copy passes --check", run(t).returncode == 0)
print(f"{fails} failed" if fails else "all confidence checks passed"); sys.exit(1 if fails else 0)
