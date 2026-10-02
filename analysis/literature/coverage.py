"""Coverage of countries outside the v1 index by scholarly country-level sources.

Run: python3 analysis/literature/coverage.py   (stdlib only)

Inputs (all in this folder):
  - SOURCES below: country lists transcribed from opened papers (table or
    methods section named in `where`). Only sources whose country list was read
    from the paper itself are included. Greenleaf (172 countries) and Kharko
    et al. 2024 (29 countries) are NOT included: their country lists could not
    be opened (SSRN blocked; IOS Press PDF not retrievable) on 1 Oct 2026.
  - gdhm2023_items_by_country.json: WHO GDHM 2023 items answered per country,
    derived from analysis/external/who_gdhm_relay_2026-10-01.csv. A dataset,
    not a scholarly paper; reported as a separate layer.
  - epmc_hits_2026-10-01.json: Europe PMC hit counts per country for a fixed
    query (see LITERATURE_REVIEW.md). Unopened and indicative only; never
    counted as coverage.

Denominator: the 193 UN member states minus the 42 UN members in the v1 index
(the 43 countries include Taiwan, which is not a UN member) = 151.
"""
import json, os, collections

HERE = os.path.dirname(os.path.abspath(__file__))

UN193 = """AFG ALB DZA AND AGO ATG ARG ARM AUS AUT AZE BHS BHR BGD BRB BLR BEL BLZ BEN BTN BOL BIH BWA BRA BRN BGR BFA BDI CPV KHM CMR CAN CAF TCD CHL CHN COL COM COG CRI CIV HRV CUB CYP CZE PRK COD DNK DJI DMA DOM ECU EGY SLV GNQ ERI EST SWZ ETH FJI FIN FRA GAB GMB GEO DEU GHA GRC GRD GTM GIN GNB GUY HTI HND HUN ISL IND IDN IRN IRQ IRL ISR ITA JAM JPN JOR KAZ KEN KIR KWT KGZ LAO LVA LBN LSO LBR LBY LIE LTU LUX MDG MWI MYS MDV MLI MLT MHL MRT MUS MEX FSM MDA MCO MNG MNE MAR MOZ MMR NAM NRU NPL NLD NZL NIC NER NGA MKD NOR OMN PAK PLW PAN PNG PRY PER PHL POL PRT QAT KOR ROU RUS RWA KNA LCA VCT WSM SMR STP SAU SEN SRB SYC SLE SGP SVK SVN SLB SOM ZAF SSD ESP LKA SDN SUR SWE CHE SYR TJK THA TLS TGO TON TTO TUN TUR TKM TUV UGA UKR ARE GBR TZA USA URY UZB VUT VEN VNM YEM ZMB ZWE""".split()
assert len(set(UN193)) == 193

# The 43 countries of index v1 as briefed (data/*.json on 1 Oct 2026, before
# the 12 EU additions that appeared in data/ during this review).
V1_43 = """ARE ARG AUS AUT BEL BRA CAN CHE CHL CHN DEU DNK EGY ESP EST FIN FRA GBR GHA IDN IND IRL ISR ITA JPN KEN KOR MEX NGA NLD NOR NZL PHL POL RWA SAU SGP SWE THA TWN USA VNM ZAF""".split()
assert len(V1_43) == 43

CATS = ["access", "control", "privacy", "commercial", "journey", "clinical", "research", "ai"]

# key: (citation key in references.bib, where the list was read, categories it informs, countries)
SOURCES = {
    "Munung2024": ("Table 1 (34 laws by country) plus Botswana, Algeria, Nigeria in Tables 3 and 5",
                   ["access", "control", "privacy", "research"],
                   "EGY TCD TUN SWZ GMB GHA KEN LSO MWI MUS SYC ZAF UGA ZMB ZWE BEN BFA CIV COD GAB MDG MLI MRT MAR NER COG GIN SEN RWA TZA AGO CPV STP GNQ BWA DZA NGA"),
    "Staunton2025": ("Abstract and country guides (12 jurisdictions)", ["privacy", "research"],
                     "BWA CMR GMB GHA KEN MWI NGA RWA ZAF TZA UGA ZWE"),
    "Townsend2023": ("Methods (12 countries)", ["ai", "privacy"],
                     "BWA CMR GMB GHA KEN MWI NGA RWA ZAF TZA UGA ZWE"),
    "NienaberMcKay2024": ("Section III (five countries)", ["privacy", "control", "research"],
                          "GHA KEN NGA ZAF UGA"),
    "Alegre2024": ("Table 1 (EMR and telehealth law by country, 21 rows incl. French Guiana)", ["journey", "privacy"],
                   "ARG BOL BRA CHL COL CRI CUB ECU SLV GTM HTI HND MEX NIC PAN PRY PER DOM URY VEN"),
    "Mamuye2022": ("Table of reviewed strategy documents, column 'Title, Country' (13 countries)", ["journey"],
                   "RWA TZA UGA SWZ ETH KEN SLE CMR ZMB LBR MWI NGA ZAF"),
    "Mugauri2025": ("Table 1 (included EHR studies by country)", ["journey", "clinical"],
                    "NGA ETH GHA KEN BDI RWA GAB ZAF"),
    "Sylla2025": ("Table 'Overview of digital health SP visions' (11 countries)", ["journey"],
                  "CMR COD ETH NAM TUN GIN BWA GHA MWI ZMB BDI"),
    "Holly2022": ("Methods, Figure 1 and Table 1 (10 countries)", ["journey"],
                  "CMR COD ETH LBR MWI MLI NER NGA TZA UGA"),
    "Moghaddasi2018": ("Table 1 (Persian Gulf HIS status)", ["journey", "clinical"],
                       "ARE BHR IRN OMN SAU"),
    "Joseph2021": ("Tables (included studies by country)", ["access"],
                   "ZAF LSO MNG ZMB"),
    "Birinci2023": ("Whole paper (e-Nabiz national PHR)", ["access", "journey", "clinical"],
                    "TUR"),
    "Cwiklicki2020": ("Methods (10 CEE countries; input data are WHO GOe 2015, so dated)", ["journey"],
                      "LTU LVA HUN ROU BGR CZE SVN HRV"),
    "Dapkute2026": ("Whole paper (Lithuania national digital health platform)", ["journey", "clinical"],
                    "LTU"),
}


def main():
    missing = [c for c in UN193 if c not in V1_43]
    assert len(missing) == 151, len(missing)
    gdhm = json.load(open(os.path.join(HERE, "gdhm2023_items_by_country.json")))
    hits = json.load(open(os.path.join(HERE, "epmc_hits_2026-10-01.json")))

    cov = collections.defaultdict(lambda: collections.defaultdict(list))
    for key, (_, cats, ctry) in SOURCES.items():
        for c in ctry.split():
            assert c in UN193, (key, c)
            for cat in cats:
                cov[c][cat].append(key)

    any_sch = [c for c in missing if cov[c]]
    print(f"Missing UN members: {len(missing)}")
    print(f"With >=1 scholarly country-level source (opened): {len(any_sch)}")
    print("By category (missing countries with >=1 scholarly source):")
    for cat in CATS:
        n = sum(1 for c in missing if cov[c].get(cat))
        single = collections.Counter(cov[c][cat][0] for c in missing if len(set(cov[c].get(cat, []))) == 1)
        print(f"  {cat:10s} {n}   rest on a single source: {dict(single)}")

    g_any = [c for c in missing if c in gdhm]
    g_full = [c for c in missing if c in gdhm and "GDHM_Q15" in gdhm[c]]
    print(f"GDHM 2023 (dataset): any item {len(g_any)}; full response incl. Q15 {len(g_full)}")
    both = [c for c in missing if cov[c] or c in gdhm]
    print(f"Scholarly OR GDHM 2023: {len(both)}")
    none = [c for c in missing if not cov[c] and c not in gdhm]
    print(f"Neither ({len(none)}): {' '.join(none)}")
    h0 = [c for c in missing if hits.get(c, 0) == 0]
    print(f"Europe PMC indicative hits = 0 ({len(h0)}): {' '.join(h0)}")

    # live data/ check: countries added after the brief
    data = os.path.join(HERE, "..", "..", "data")
    live = sorted(f[:-5] for f in os.listdir(data) if f.endswith(".json") and not f.startswith("_"))
    added = [c for c in live if c not in V1_43]
    print(f"data/ now has {len(live)} files; added since brief: {' '.join(added)}")
    print(f"Missing vs live data/: {len([c for c in UN193 if c not in live])}")

    rows = []
    for c in missing:
        rows.append({"iso3": c, "scholarly": {k: v for k, v in cov[c].items()},
                     "n_scholarly_sources": len({s for v in cov[c].values() for s in v}),
                     "gdhm2023": ("full" if c in gdhm and "GDHM_Q15" in gdhm[c] else ("partial" if c in gdhm else "none")),
                     "epmc_hits_indicative": hits.get(c)})
    json.dump(rows, open(os.path.join(HERE, "coverage_by_country.json"), "w"), indent=1)


if __name__ == "__main__":
    main()
