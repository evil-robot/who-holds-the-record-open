"""Second pass over every URL whose first-pass outcome was not 'ok' (network dropped once during pass 1).
Serial, GET with redirects, 25s timeout, 1s spacing. Adds recheck_outcome/recheck_status/recheck_utc columns.
Final outcome rule: ok on either pass = ok; otherwise the recheck outcome stands.

Curl fallback (2 Oct 2026): when the httpx GET does not reach ok, the same URL is fetched once more with curl, same
browser headers, 30s timeout; recheck_via records which client gave the outcome. Some hosts time out or refuse
Python's TLS client but answer curl.

Targeted mode: --iso KEN,BFA rechecks only the not-ok URLs cited by those countries, leaves every other row exactly as
it was, and applies the result to every row that cites the same URL (an outcome belongs to the URL, not the row).
Spacing is 2s and a 429 is retried once after its Retry-After (capped at 30s)."""
import argparse, csv, subprocess, time, datetime, httpx
from urllib.parse import urlparse
ROOT = __import__("os").path.dirname(__import__("os").path.dirname(__import__("os").path.abspath(__file__)))
ap = argparse.ArgumentParser(); ap.add_argument("--iso", default="", help="comma-separated ISO3 codes (targeted mode)")
ISO = {x.strip().upper() for x in ap.parse_args().iso.split(",") if x.strip()}
rows = list(csv.DictReader(open(f"{ROOT}/analysis/url_check.csv")))
if ISO:
    todo = sorted({r["url"] for r in rows if r["iso3"] in ISO and r["final_outcome"] != "ok"})
else:
    todo = sorted({r["url"] for r in rows if r["outcome"] != "ok"})
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"
HDR = {"User-Agent": UA, "Accept": "text/html,application/xhtml+xml,application/pdf,*/*;q=0.8", "Accept-Language": "en-US,en;q=0.8"}
def cls(st, err, url, final):
    if err: return "error"
    if 200 <= st < 300:
        return "redirect_to_homepage" if urlparse(url).path not in ("", "/") and urlparse(final).path in ("", "/") else "ok"
    return "dead" if st in (404, 410) else "blocked_unverified" if st in (401, 403, 429, 451) else "server_error" if st >= 500 else f"other_{st}"
def via_httpx(c, u):
    st, err, final, wait = 0, "", u, 0
    try:
        with c.stream("GET", u) as r:
            st, final = r.status_code, str(r.url)
            if st == 429: wait = min(int(r.headers.get("retry-after", "10")) if r.headers.get("retry-after", "").isdigit() else 10, 30)
    except Exception as e: err = type(e).__name__
    return st, err, final, wait
def via_curl(u):
    cmd = ["curl", "-sSL", "-o", "/dev/null", "-w", "%{http_code} %{url_effective}", "--max-time", "30", "--max-redirs", "15", "-A", UA]
    for k, v in HDR.items():
        if k != "User-Agent": cmd += ["-H", f"{k}: {v}"]
    p = subprocess.run(cmd + [u], capture_output=True, text=True)
    code, _, final = p.stdout.strip().partition(" ")
    return (0, f"curl_exit_{p.returncode}", u) if p.returncode or not code.isdigit() or code == "000" else (int(code), "", final or u)
res = {}
with httpx.Client(headers=HDR, follow_redirects=True, timeout=25.0, max_redirects=15) as c:
    for u in todo:
        st, err, final, wait = via_httpx(c, u)
        if wait and ISO:
            time.sleep(wait); st, err, final, wait = via_httpx(c, u)
        o, via = cls(st, err, u, final), "httpx"
        if o != "ok":
            cst, cerr, cfinal = via_curl(u); co = cls(cst, cerr, u, cfinal)
            if co == "ok" or o == "error":
                o, st, err, via = co, cst, cerr, "curl"
        res[u] = (o, st or "", err, via); time.sleep(2 if ISO else 1)
now = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%MZ")
for r in rows:
    r.setdefault("recheck_via", "")
    if ISO and r["url"] not in res:
        continue  # targeted mode: rows not rechecked keep their recorded outcome and time
    o, s, e, v = res.get(r["url"], ("", "", "", ""))
    r["recheck_outcome"], r["recheck_status"], r["recheck_error"], r["recheck_utc"], r["recheck_via"] = o, s, e, (now if o else ""), v
    r["final_outcome"] = "ok" if r["outcome"] == "ok" or o == "ok" else o
with open(f"{ROOT}/analysis/url_check.csv", "w", newline="") as fh:
    cols = [k for k in rows[0] if k != "final_outcome"] + ["final_outcome"]  # paper_gen.js reads final_outcome as the last column
    w = csv.DictWriter(fh, fieldnames=cols); w.writeheader(); w.writerows(rows)
for u in todo: print(res[u][0], res[u][1], res[u][2], res[u][3], u)
if ISO:
    print("rows touched outside", ",".join(sorted(ISO)) + ":", sorted({r["iso3"] for r in rows if r["url"] in res and r["iso3"] not in ISO}))

# record the data hash this check ran on (DECISION_RULES.md)
import sys as _s; _s.path.insert(0, f"{ROOT}/scripts"); from datahash import write_sidecar; write_sidecar(f"{ROOT}/analysis/url_check.csv", {"script": __file__.split("/")[-1]})
