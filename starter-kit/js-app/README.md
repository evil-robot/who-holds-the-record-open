# A small web page for the Health Record Rights Index

`index.html` and `app.js` make one page: every country and territory from `/api/v1/countries` in a table. You can filter by name, code, region or band, and sort by name, score or band. Each name links to that country's brief on healthrecordrights.com. The page shows the data date and the credit the license asks for.

No libraries, no build step, no key.

## Run it

Serve the folder with any static server and open it in a browser. For example:

```
python3 -m http.server 8000
```

Then open http://localhost:8000/. Opening `index.html` straight from disk may not work in every browser, because some block requests from `file://` pages.

The API allows use from any website (`Access-Control-Allow-Origin: *`), so the page can call it from your own address.

## Change it

- To use a local copy of the site, change `API` at the top of `app.js`, for example to `http://localhost:8799/api/v1/`.
- The fields come from the API answer: `name`, `iso3`, `region`, `overall`, `band`, `rank`, `rankTied`, `leadGroup`, `likelyRankText` and `pageUrl` for each country, and `asOf`, `version` and `license` around the data. The API never removes or renames a field in version 1.

## Keep it true

- Scores are shown as "71/100", never as a bare number.
- The countries at the top are shown as the lead group, not as one winner. Lead-group countries have no rank number in the API (`rank` is `null`), on purpose.
- Every rank is shown with its likely range, because scores move in steps of about 5 points.
- Keep the credit line: "SuperTruth, Inc., Health Record Rights Index", CC BY 4.0.
