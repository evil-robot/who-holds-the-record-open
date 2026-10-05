# Health Record Rights Index: developer starter kit

The Health Record Rights Index scores 198 countries and territories from 0 to 100 on one question: does a person get to see, control and share their own health record? For the United States it also records what each of the 50 states and DC adds to federal law. The data is open, and this kit helps you start using it.

There are three parts. Each folder has its own README.

| Folder | What it is |
|---|---|
| `js-app/` | A small web page in plain JavaScript, with no libraries and no build step. It reads `/api/v1/countries` and shows every country in a table you can filter and sort. |
| `notebook/` | A Jupyter notebook in Python. It loads the scores CSV with pandas, then asks the API for the country list, one country and two states side by side. |
| `mcp/` | Ready-made settings to connect an AI assistant (Claude Code, Claude Desktop, Cursor, VS Code and others) to the index's MCP server. |

## The API in one paragraph

The base address is `https://healthrecordrights.com/api/v1/`. It answers JSON, needs no sign-up and no key, and allows use from any website. Each IP address may make 60 requests a minute, with bursts up to 120; past that you get a 429 with a `Retry-After` header. Every answer carries `version`, `asOf` (the data date), `dataSha256`, `license`, `citation` and `pageUrl` (the page on the site that shows the same thing). The full guide is at https://healthrecordrights.com/developers/.

```
curl https://healthrecordrights.com/api/v1/countries/FIN
```

If you need the whole index at once, download it instead of looping over the API:

- Scores: https://healthrecordrights.com/data/who-holds-the-record-scores.csv
- Sources: https://healthrecordrights.com/data/who-holds-the-record-sources.csv
- Everything: https://healthrecordrights.com/data/who-holds-the-record.json

## License and credit

The scores, summaries, ratings and labels are licensed under CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/). You may use them for any purpose if you give credit. Credit this way:

**SuperTruth, Inc., Health Record Rights Index**, with a link to https://healthrecordrights.com/

The words of laws and other sources that the data quotes, the titles of other people's pages, and the pages the links point to are not ours to license. Their owners' terms apply. The code in this kit is MIT licensed.

## Keep it true

These rules keep what you build true to the index:

- **A score is out of 100.** Write "71 out of 100" or "71/100", never a bare number next to a country.
- **The lead group is a group.** The countries at the top are a group (`leadGroup: true` in the API), never one winner. Do not call one country first, best or top. Show each rank with its likely range (`likelyRankText`), because scores move in steps of about 5 points.
- **There is no state score.** The state answers record what each state's law adds. There is no state score, total, rank or winner.
- **DC is not a state.** Say "the 50 states and DC", and never count DC as a state.
- **Not checked is not no.** If an answer says it was not checked, show that, not a no.
- **Not advice.** The data records what laws and official pages said on the dates they were read. It is not legal, medical or clinical advice.
