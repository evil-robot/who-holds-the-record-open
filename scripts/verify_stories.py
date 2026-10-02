"""Verify stories/*.json against docs/STORIES_RULES.md. Exit 1 on any failure.

Usage: python scripts/verify_stories.py [--no-net]
"""
import glob, json, re, sys, urllib.request, urllib.parse, concurrent.futures as cf
from datetime import date

DENY = re.compile(r"(^|\.)(reddit\.com|x\.com|twitter\.com|tiktok\.com|facebook\.com|fb\.com|instagram\.com|youtube\.com|youtu\.be|threads\.net|quora\.com|linkedin\.com)$")
THEMES = {"access_refused", "access_delay_or_cost", "record_wrong", "breach", "sold_or_shared", "lost_between_providers", "other"}
TYPES = {"regulator_decision", "court_judgment", "parliament_testimony", "journalism", "advocacy_case", "own_blog"}
QUOTABLE = {"regulator_decision", "court_judgment", "parliament_testimony"}
STATUS = {"finding", "admitted", "alleged", "self_reported"}
REQ = ["id", "iso3", "date", "headline", "source", "url", "why", "theme", "sourceType", "status", "paraphrase", "lang",
       "personNamed", "providerName", "subjectAdult", "subjectDeceased", "consentEvidence", "reviewedBy", "reviewedOn", "removed"]
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36"

words = lambda s: len((s or "").split())


def host(url):
    m = re.match(r"https://([^/]+)", url or "")
    return m.group(1).lower() if m else ""


def check_item(it, iso, category_urls):
    errs = []
    for k in REQ:
        if k not in it:
            errs.append(f"missing {k}")
    if errs:
        return errs
    if it["iso3"] != iso: errs.append("iso3 mismatch")
    if not re.fullmatch(rf"{iso}-S\d{{3}}", it["id"]): errs.append("bad id")
    if not re.fullmatch(r"\d{4}-\d{2}(-\d{2})?", it["date"]): errs.append("bad date")
    elif not ("2024-10" <= it["date"][:7] <= "2026-10"): errs.append(f"date {it['date']} outside window")
    if not it["url"].startswith("https://"): errs.append("url not https")
    if DENY.search(host(it["url"])): errs.append("social/forum domain")
    if not it["removed"] and it["url"] in category_urls: errs.append("story url also used as a score source")
    if words(it["headline"]) > 14: errs.append(f"headline {words(it['headline'])} words")
    if words(it["paraphrase"]) > 40: errs.append(f"paraphrase {words(it['paraphrase'])} words")
    if len(it["why"]) > 140: errs.append("why > 140 chars")
    for f in ("headline", "paraphrase", "why"):
        if "—" in (it.get(f) or ""): errs.append(f"em dash in {f}")
    if it["theme"] not in THEMES: errs.append("bad theme")
    if it["sourceType"] not in TYPES: errs.append("bad sourceType")
    if it["status"] not in STATUS: errs.append("bad status")
    if it["sourceType"] == "own_blog" and not re.match(r"written yes from author \d{4}-\d{2}-\d{2}", it["consentEvidence"]):
        errs.append("own_blog without written consent")
    q = it.get("quote")
    if q:
        if it["sourceType"] not in QUOTABLE: errs.append("quote on non-quotable source")
        if words(q) > 25: errs.append("quote > 25 words")
    if it["personNamed"] is not False: errs.append("personNamed must be false")
    if it["subjectAdult"] is not True: errs.append("subjectAdult must be true")
    if it["subjectDeceased"] and it["sourceType"] not in QUOTABLE: errs.append("deceased subject on disallowed source")
    if it["status"] in ("alleged", "self_reported") and it["providerName"]: errs.append("provider named on allegation")
    if not re.fullmatch(r"[a-z]{2}", it["lang"]): errs.append("bad lang")
    if len(it["consentEvidence"]) < 10: errs.append("consentEvidence too short")
    try:
        ro = date.fromisoformat(it["reviewedOn"])
        if (date.today() - ro).days > 730: errs.append("review older than 24 months")
    except ValueError:
        errs.append("bad reviewedOn")
    if it["removed"] and not (it.get("removedOn") and it.get("removalReason")): errs.append("tombstone missing removedOn/reason")
    return errs


def reachable(url, tries=2):
    # Python 3.9's urllib does not follow 308; follow it (and 301/302/307) once by hand. One retry on a dropped connection.
    ok, code = _reachable(url)
    if not ok and code in (301, 302, 307, 308):
        try:
            r = urllib.request.Request(url, method="GET", headers={"User-Agent": UA, "Accept": "text/html,application/xhtml+xml", "Accept-Language": "en-US,en;q=0.9"})
            urllib.request.urlopen(r, timeout=20)
        except urllib.error.HTTPError as e:
            loc = e.headers.get("Location")
            if loc: return _reachable(urllib.parse.urljoin(url, loc))
    if not ok and tries > 1 and not isinstance(code, int): return reachable(url, tries - 1)
    if not ok and not isinstance(code, int):  # some sites drop Python's TLS client but serve curl
        import subprocess
        out = subprocess.run(["curl", "-sL", "-o", "/dev/null", "-m", "25", "-A", UA, "-w", "%{http_code}", url], capture_output=True, text=True).stdout.strip()
        if out.isdigit() and int(out) < 400: return True, int(out)
    return ok, code


def _reachable(url):
    for method in ("HEAD", "GET"):
        try:
            r = urllib.request.Request(url, method=method, headers={"User-Agent": UA, "Accept": "text/html,application/xhtml+xml", "Accept-Language": "en-US,en;q=0.9"})
            with urllib.request.urlopen(r, timeout=20) as resp:
                if resp.status < 400: return True, resp.status
        except urllib.error.HTTPError as e:
            if method == "GET": return (e.code in (401, 403, 429)), e.code  # bot walls: page exists
        except Exception as e:
            if method == "GET": return False, type(e).__name__
    return False, "?"


def main():
    net = "--no-net" not in sys.argv
    category_urls = set()
    for f in glob.glob("data/*.json"):
        d = json.load(open(f))
        for c in d["categories"].values():
            category_urls |= {s.get("url") for s in c.get("sources", [])}
    fails, items = [], []
    for f in sorted(glob.glob("stories/*.json")):
        iso = f.split("/")[-1][:3]
        d = json.load(open(f))
        seen = set()
        ids = [it.get("id") for it in d["stories"]]
        for dup in sorted({i for i in ids if ids.count(i) > 1}): fails.append(f"{dup}: duplicate id")
        tomb = {s["url"] for s in d["stories"] if s.get("removed")}
        for it in d["stories"]:
            for e in check_item(it, iso, category_urls):
                fails.append(f"{it.get('id', iso)}: {e}")
            if it.get("url") in seen: print(f"WARN {it.get('id')}: url shared with another story (fine for one report with several cases)")
            if not it.get("removed") and it.get("url") in tomb: fails.append(f"{it.get('id')}: re-adds a removed url")
            seen.add(it.get("url"))
            if not it.get("removed"): items.append(it)
    if net:
        with cf.ThreadPoolExecutor(6) as ex:
            for it, (ok, code) in zip(items, ex.map(lambda i: reachable(i["url"]), items)):
                if not ok: fails.append(f"{it['id']}: url unreachable ({code}) {it['url']}")
    print(f"{len(items)} live stories checked; {len(fails)} failures")
    for x in fails: print("FAIL", x)
    sys.exit(1 if fails else 0)


if __name__ == "__main__":
    main()
