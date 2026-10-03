"""Confidence labels, computed from the data (DECISION_RULES.md rule 4; definition in RUBRIC.md, fixed 2 Oct 2026).
A category cites a primary source when one of its sources is classed official, legal_text or intergov by analysis/sources.py.
A category admits an unverified fact when its summary or a detail paragraph uses the admission wording (ADMIT below).
Weak = no primary source, or an admission. high: >= 7 primary categories and no admission; low: >= 4 weak; else medium.
  --check   exit 1 if any data/ label differs from the computed one (default)
  --write   set every data/ label to the computed one (only the "confidence" line changes) and write
            analysis/confidence/confidence.json with the per-country counts and the data hash
  --root    run on another copy of the repository (used by scripts/test_confidence.py)
Run: uv run --project ~/Projects/ds-lab python scripts/confidence.py --write"""
import argparse, glob, json, os, re, sys
HERE = os.path.dirname(os.path.abspath(__file__)); REPO = os.path.dirname(HERE)
sys.path.insert(0, os.path.join(REPO, "analysis")); sys.path.insert(0, HERE)
from sources import classify, norm, PRIMARY  # the same publisher classes the evidence grade and the paper use
from datahash import data_sha256
# The DTI phrase family (scripts/dti_evidence.py UNVERIFIED) plus the two wordings the paper names: "did not verify", "no verified".
ADMIT = re.compile(r"\bnot (?:independently |been )?verified\b|\bunverified\b|\bcould not (?:be )?(?:verif(?:y|ied)|confirm(?:ed)?|check(?:ed)?)\b"
                   r"|\bnot (?:been )?confirmed\b|\bnot checked\b|\bdid not verify\b|\bno verified\b", re.I)
CATS = ["access", "control", "privacy", "commercial", "journey", "clinical", "research", "ai"]
LINE = re.compile(r'^( {1,2}"confidence": ")(high|medium|low)(",?)$', re.M)

def assess(d):
    prim, admit = [], []
    for k in CATS:
        c = d["categories"][k]
        if any(classify(norm(s["url"]), s.get("publisherClass")) in PRIMARY for s in c.get("sources", [])): prim.append(k)
        text = " ".join([c.get("summary", "")] + list(c.get("detail", []) or []))
        if ADMIT.search(text): admit.append(k)
    weak = [k for k in CATS if k not in prim or k in admit]
    label = "low" if len(weak) >= 4 else "high" if len(prim) >= 7 and not admit else "medium"
    return dict(primary=len(prim), admits=admit, weak=weak, label=label)

def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--write", action="store_true"); ap.add_argument("--check", action="store_true")
    ap.add_argument("--root", default=REPO); a = ap.parse_args()
    files = sorted(glob.glob(os.path.join(a.root, "data", "[A-Z][A-Z][A-Z].json")))
    res, diff = {}, []
    for f in files:
        d = json.load(open(f)); r = assess(d); r["was"] = d["confidence"]; res[d["iso3"]] = r
        if d["confidence"] != r["label"]: diff.append(d["iso3"])
    if not a.write:
        for i in diff: print(f"WRONG LABEL {i}: data says {res[i]['was']}, rule gives {res[i]['label']} (primary {res[i]['primary']}, weak {res[i]['weak']}, admits {res[i]['admits']})")
        print(f"{len(files) - len(diff)} of {len(files)} labels follow the rule"); sys.exit(1 if diff else 0)
    for f in files:
        txt = open(f).read(); iso = os.path.basename(f)[:3]
        if len(LINE.findall(txt)) != 1: raise SystemExit(f"{f}: expected exactly one top-level confidence line")
        new = LINE.sub(lambda m: m.group(1) + res[iso]["label"] + m.group(3), txt)
        if new != txt: open(f, "w").write(new)
    count = lambda key: {l: sum(1 for r in res.values() if r[key] == l) for l in ("high", "medium", "low")}
    out = dict(dataSha256=data_sha256(a.root), rule="RUBRIC.md confidence; DECISION_RULES.md rule 4", counts=count("label"), before=count("was"),
               changed=sorted(diff), countries={i: {k: r[k] for k in ("label", "was", "primary", "admits", "weak")} for i, r in res.items()})
    os.makedirs(os.path.join(a.root, "analysis", "confidence"), exist_ok=True)
    json.dump(out, open(os.path.join(a.root, "analysis", "confidence", "confidence.json"), "w"), indent=1)
    print("before", out["before"], "after", out["counts"], "changed", len(diff))

if __name__ == "__main__":
    main()
