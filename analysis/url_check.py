"""HEAD-check every URL in data/*.json (sources, laws, news). Read-only.
Polite: max 6 concurrent requests overall, max 1 per host at a time, 20s timeout.
HEAD first; falls back to a streamed GET (body not read past headers) when HEAD
is refused (400/403/405/406/429/501) or errors, since many servers mishandle HEAD.
Writes analysis/url_check.csv: one row per (country, section, field, url)."""
import asyncio, csv, glob, json, collections, datetime
from urllib.parse import urlparse
import httpx

UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/126.0 Safari/537.36")
HDR = {"User-Agent": UA, "Accept": "text/html,application/xhtml+xml,application/pdf,*/*;q=0.8",
       "Accept-Language": "en-US,en;q=0.8"}
ROOT = __import__("os").path.dirname(__import__("os").path.dirname(__import__("os").path.abspath(__file__)))

refs = []
for f in sorted(glob.glob(f"{ROOT}/data/*.json")):
    d = json.load(open(f))
    for k, c in d["categories"].items():
        for i, s in enumerate(c["sources"]):
            refs.append((d["iso3"], "source", f"categories.{k}.sources[{i}]", s["url"]))
    for i, l in enumerate(d["laws"]):
        refs.append((d["iso3"], "law", f"laws[{i}]", l["url"]))
    for i, n in enumerate(d["news"]):
        refs.append((d["iso3"], "news", f"news[{i}]", n["url"]))

uniq = sorted({r[3] for r in refs})
glob_sem = asyncio.Semaphore(6)
host_locks = collections.defaultdict(asyncio.Lock)
results = {}

def classify(status, err, url, final):
    if err:
        return "error"
    if 200 <= status < 300:
        p0, p1 = urlparse(url), urlparse(final)
        if p0.path not in ("", "/") and p1.path in ("", "/"):
            return "redirect_to_homepage"
        return "ok"
    if status in (404, 410):
        return "dead"
    if status in (401, 403, 429, 451):
        return "blocked_unverified"
    if status >= 500:
        return "server_error"
    return f"other_{status}"

async def check(client, url):
    host = urlparse(url).netloc
    async with host_locks[host], glob_sem:
        head_status = get_status = None; final = url; err = ""
        try:
            r = await client.head(url)
            head_status = r.status_code; final = str(r.url)
        except Exception as e:
            err = type(e).__name__
        if err or head_status in (400, 403, 405, 406, 429, 501) or (head_status and head_status >= 500):
            try:
                async with client.stream("GET", url) as r:
                    get_status = r.status_code; final = str(r.url); err = ""
            except Exception as e:
                err = err or type(e).__name__
                err = type(e).__name__
        status = get_status or head_status
        results[url] = dict(head_status=head_status, get_status=get_status, final_url=final,
                            error=err, outcome=classify(status, err, url, final))
        await asyncio.sleep(0.5)

async def main():
    async with httpx.AsyncClient(headers=HDR, follow_redirects=True, timeout=20.0,
                                 verify=True, http2=False) as client:
        await asyncio.gather(*(check(client, u) for u in uniq))

asyncio.run(main())
checked = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%MZ")
with open(f"{ROOT}/analysis/url_check.csv", "w", newline="") as fh:
    w = csv.writer(fh)
    w.writerow(["iso3", "section", "field", "url", "outcome", "head_status", "get_status",
                "final_url", "error", "times_url_used_in_index", "checked_utc"])
    cnt = collections.Counter(r[3] for r in refs)
    for iso, sec, fld, u in refs:
        x = results[u]
        w.writerow([iso, sec, fld, u, x["outcome"], x["head_status"], x["get_status"],
                    x["final_url"], x["error"], cnt[u], checked])
print(len(refs), "refs", len(uniq), "unique", collections.Counter(v["outcome"] for v in results.values()))

# record the data hash this check ran on (DECISION_RULES.md)
import sys as _s; _s.path.insert(0, f"{ROOT}/scripts"); from datahash import write_sidecar; write_sidecar(f"{ROOT}/analysis/url_check.csv", {"script": __file__.split("/")[-1]})
