# A starter notebook for the Health Record Rights Index

`hrr_starter.ipynb` is a Jupyter notebook in Python. It:

1. loads the scores CSV (`/data/who-holds-the-record-scores.csv`) with pandas;
2. describes the overall scores and counts the countries in each band;
3. summarizes the eight rights;
4. loads the same list from the API (`/api/v1/countries`) and shows the lead group;
5. reads one country in detail (`/api/v1/countries/FIN`);
6. puts two US states side by side (`/api/v1/states/compare?s=CA,TX`);
7. prints the citation and the credit.

The saved outputs come from a run against healthrecordrights.com on October 5, 2026. Run it again to get the current data.

## Run it

```
python3 -m venv .venv && . .venv/bin/activate
pip install -r requirements.txt jupyter
jupyter notebook hrr_starter.ipynb
```

No key is needed. The API allows 60 requests a minute per IP address, with bursts up to 120. For the whole index at once, read the CSV or JSON downloads, as the notebook does, instead of asking the API for each country.

## Columns in the scores CSV

`iso3`, `country`, `region`, `overall`, `rank`, `likely_rank`, `band`, `keys_model`, `confidence`, `dti_evidence`, `dti_tier`, the eight rights (`access`, `control`, `privacy`, `journey`, `commercial`, `clinical`, `research`, `ai`), `stories` (the number of real cases) and `as_of`.

## Keep it true

- A score is out of 100: write "71 out of 100", never a bare number.
- Quote a rank with its likely range (`likely_rank` in the CSV, `likelyRankText` in the API). The countries at the top are a lead group; do not call one of them first or best.
- There is no state score, total or rank, and DC is not a state.
- If you change a score or recompute a rank, say so.
- Credit: "SuperTruth, Inc., Health Record Rights Index", CC BY 4.0, with a link to https://healthrecordrights.com/.
