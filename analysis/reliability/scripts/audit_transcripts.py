"""Blinding verifier. Walks each rater stream-json transcript and fails (exit 1) if the rater:
  - used any tool other than WebFetch or Bash, or ran any MCP server or tool list beyond those two;
  - fetched (WebFetch) a URL not cited for a task in its batch (or that URL's recorded redirect);
  - ran a Bash command that does not start with curl, names a URL outside the batch's cited set, uses file:,
    or names a local path (/Users, ~, data/, .json under the repo);
  - mentions the published index host anywhere in a tool call;
  - returned a non-null score for a task whose sources_opened is empty, or listed as opened a URL not cited;
  - returned a task set that does not match its batch, or no parsable final JSON block.
Usage: audit_transcripts.py <transcript.jsonl> [...]   (batch file is batches/<stem>.json)
       audit_transcripts.py --selftest   (planted red cases in adversary/ must all fail)"""
import json, re, sys, pathlib
R = pathlib.Path(__file__).resolve().parents[1]
SAMPLE = json.load(open(R / "sample.json"))
REDIRECTS = {c["cell_id"]: c.get("allowed_redirects", []) for c in SAMPLE["cells"]}
REDIRECTS[SAMPLE["pilot"]["cell_id"]] = SAMPLE["pilot"].get("allowed_redirects", [])
FORBIDDEN_HOSTS = ["whoholds", "healthrecordrights", "who-holds", "whoholdstherecord", "supertruth", "railway.app", "localhost", "127.0.0.1"]
URL_RE = re.compile(r"""https?://[^\s"'<>|\\)]+""")
TEXT_FILTERS = {"head", "tail", "sed", "grep", "tr", "cut", "wc", "iconv", "strings", "fold", "awk", "sort", "uniq", "cat", "xmllint", "textutil", "pdftotext"}

def norm(u):
    return u.rstrip("/").replace("http://", "https://").split("#")[0]

def parse_final(text):
    blocks = re.findall(r"```json\s*(.*?)```", text, re.S)
    if not blocks:
        return None
    try:
        return json.loads(blocks[-1])
    except Exception:
        return None

def audit(path):
    path = pathlib.Path(path)
    stem = path.stem
    first = json.loads(open(path).readline() or "{}")
    if first.get("type") == "_meta":
        stem = first["batch"]
    batch = json.load(open(R / "batches" / f"{stem}.json"))
    allowed = set()
    for t in batch:
        cid = t["task_id"].split("#")[0]
        allowed |= {norm(u) for u in t["urls"]} | {norm(u) for u in REDIRECTS.get(cid, [])}
    allowed_prefixes = allowed
    fails, final_text, model = [], None, None
    lines = open(path).read().splitlines()
    denied = set()
    for line in lines:
        try:
            m = json.loads(line)
        except Exception:
            continue
        if m.get("type") == "user" and isinstance(m.get("message", {}).get("content"), list):
            for b in m["message"]["content"]:
                if b.get("type") == "tool_result" and b.get("is_error") and re.search(
                        r"require[s]? approval|cannot be checked in advance|permission", str(b.get("content")), re.I):
                    denied.add(b.get("tool_use_id"))
    warns = []
    for line in lines:
        try:
            m = json.loads(line)
        except Exception:
            continue
        if m.get("type") == "system" and m.get("subtype") == "init":
            model = m.get("model")
            if set(m.get("tools", [])) - {"WebFetch", "Bash"}:
                fails.append(f"extra tools available: {m.get('tools')}")
            if m.get("mcp_servers"):
                fails.append(f"mcp servers present: {m.get('mcp_servers')}")
        if m.get("type") == "assistant":
            for b in m["message"].get("content", []):
                if b.get("type") != "tool_use":
                    continue
                blob = json.dumps(b["input"])
                for h in FORBIDDEN_HOSTS:
                    if h in blob.lower():
                        fails.append(f"forbidden host '{h}' in {b['name']} call")
                if b["name"] == "WebFetch":
                    if norm(b["input"].get("url", "")) not in allowed:
                        fails.append(f"WebFetch outside cited set: {b['input'].get('url')}")
                elif b["name"] == "Bash":
                    cmd = b["input"].get("command", "")
                    before = len(fails)
                    first = cmd.strip().split()[0] if cmd.strip() else ""
                    if first not in ("curl",):
                        fails.append(f"Bash not curl: {cmd[:120]}")
                    bare = URL_RE.sub(" ", cmd)  # judge local paths outside URLs (a URL path may contain "data/")
                    if "file:" in cmd or re.search(r"(/Users/|~/|\bdata/|who-holds-the-record|\.claude)", bare):
                        fails.append(f"local path in Bash: {cmd[:120]}")
                    for seg in re.split(r"\|", cmd)[1:]:
                        tok = seg.strip().split()[0] if seg.strip() else ""
                        if tok not in TEXT_FILTERS:
                            fails.append(f"pipe into non-filter '{tok}': {cmd[:120]}")
                    for u in URL_RE.findall(cmd):
                        if norm(u) not in allowed:
                            fails.append(f"curl outside cited set: {u}")
                    if b.get("id") in denied and len(fails) > before and not any("forbidden host" in f or "local path" in f for f in fails[before:]):
                        warns += [f"denied, not executed: {f}" for f in fails[before:]]
                        del fails[before:]
                else:
                    fails.append(f"tool not allowed: {b['name']}")
        if m.get("type") == "result":
            final_text = m.get("result", "")
    out = parse_final(final_text or "")
    if out is None:
        fails.append("no parsable final json block")
        out = []
    want = {t["task_id"] for t in batch}
    got = {o.get("task_id") for o in out}
    if out and got != want:
        fails.append(f"task set mismatch: missing {sorted(want - got)} extra {sorted(got - want)}")
    by_id = {t["task_id"]: t for t in batch}
    for o in out:
        t = by_id.get(o.get("task_id"))
        if not t:
            continue
        cited = {norm(u) for u in t["urls"]} | {norm(u) for u in REDIRECTS.get(t["task_id"].split("#")[0], [])}
        opened = [norm(u) for u in o.get("sources_opened", [])]
        if o.get("score") is not None and not opened:
            fails.append(f"{o['task_id']}: scored with no source opened")
        if o.get("score") is not None and not (isinstance(o["score"], int) and 0 <= o["score"] <= 100):
            fails.append(f"{o['task_id']}: score not an integer 0-100: {o['score']}")
        for u in opened:
            if u not in cited:
                fails.append(f"{o['task_id']}: lists opened URL not cited for it: {u}")
    return {"transcript": path.name, "model": model, "n_tasks": len(out), "fails": fails, "warns": warns, "pass": not fails}

if __name__ == "__main__":
    if sys.argv[1:] == ["--selftest"]:
        bad = 0
        for p in sorted((R / "adversary").glob("*.jsonl")):
            r = audit(p)
            ok = (not r["pass"]) if p.name.startswith("red_") else r["pass"]
            print(("OK     " if ok else "WRONG  ") + p.name, r["fails"][:3])
            bad += not ok
        good = audit(R / "transcripts" / "pilot.jsonl")
        print("pilot (expected pass):", good["pass"], good["fails"])
        sys.exit(1 if bad or not good["pass"] else 0)
    res = [audit(p) for p in sys.argv[1:]]
    for r in res:
        print(("PASS " if r["pass"] else "FAIL ") + r["transcript"], r["model"], r["n_tasks"], r["fails"][:5], ("warns: %d" % len(r["warns"])))
    sys.exit(0 if all(r["pass"] for r in res) else 1)
