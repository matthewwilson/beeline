# 🐝 BeeLine

A forage, pollen and hive map for beekeepers. Drop a hive on the map and BeeLine predicts
where your bees are most likely foraging — because you can't GPS-track them, but honeybee
foraging is well understood (mostly within 1–2 km of the hive, out to ~5 km, favouring the
richest nectar/pollen sources closest to home).

**Live site:** https://matthewwilson.github.io/beeline/

## Features
- **Forage & bloom map** — draws the 1 / 3 / 5 km foraging rings, pulls the real green spaces
  around your hive from OpenStreetMap (orchards, meadows, gardens, farmland, heath, hedgerows,
  woods…) and ranks the **likely destinations** by forage value × bloom timing × distance.
- **Research-grounded forage values** — the per-plant nectar values are derived from Baude et al.'s
  measured UK nectar/pollen datasets (see [`references/forage-values.md`](references/forage-values.md)),
  not guesswork.
- **Authoritative NI habitat layers** — supplements OSM with DAERA/NIEA **Priority Habitats**
  (surveyed heath, species-rich grassland, peatland, fens, woodland), marked ✓ surveyed and given
  a confidence bonus.
- **Live weather + dynamic bloom** — an Open-Meteo "are the bees flying today?" panel (temperature,
  wind, rain), and an **Auto** season mode that shifts bloom timing by the year's growing-degree-day
  anomaly instead of fixed months.
- **Hedgerow forage** — hedges (hawthorn/blackthorn/bramble), the biggest real NI forage source, are
  pulled from OSM and scored.
- **Pollen colour map** — each source is tinted by its plant's characteristic pollen colour, and a
  swatch picker highlights the sources matching the pollen you see at the hive entrance.
- **Field flower log** 🌼 — walk up to a plant and log it (from a curated NI forage-plant list, or
  free text). Saved in your browser; each sighting becomes a *high-confidence* forage point that
  outranks generic OSM/DAERA data nearby.
- **Forage calendar & June-gap planner** 📅 — a year-round forage-availability chart for the hive,
  flagging lean periods (the classic June gap) and suggesting pollinator plants to fill them.
- **Biosecurity & alerts** 🛡️ — a live "any Asian hornet records within 10 km?" check (NBN Atlas)
  plus one-tap reporting, and NI-correct disease guidance (report to DAERA, not the GB bee unit).
- **Your hives** — add as many hives as you like; they're saved in your browser's `localStorage`,
  so they're there next time you visit. No account, no server.

## How it works
It's a single static `index.html` — no build step and no backend. Everything is fetched live,
client-side, from free/open APIs:
- **Map & land use:** OpenStreetMap tiles + the [Overpass API](https://overpass-api.de/) (four
  mirrors raced in parallel for resilience).
- **NI habitats:** DAERA/NIEA Priority Habitats ArcGIS FeatureServers (OGL).
- **Weather / growing-degree-days:** [Open-Meteo](https://open-meteo.com/) (keyless).

## Data & attribution
- Forage values: **Baude et al.** nectar (2016) & pollen (2025) datasets, UKCEH/EIDC, Open
  Government Licence. See `references/forage-values.md`.
- Habitats: **DAERA/NIEA Priority Habitats**, via [OpenDataNI](https://www.opendatani.gov.uk/),
  Open Government Licence.
- Weather: **Open-Meteo**. Map & land use: **© OpenStreetMap contributors** (ODbL).
- Asian hornet check: **NBN Atlas** occurrence API. Planting suggestions: **All-Ireland Pollinator
  Plan** / **RHS Plants for Pollinators**. Bee-health guidance: **DAERA** (NI).

## Running locally
Because geolocation needs a secure context, serve it over `localhost` rather than opening the
file directly:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

(Opening `index.html` straight from disk works too, but the "Add my hive here" geolocation
button won't — click the map to place a hive instead.)

## Deploying to GitHub Pages
Pages is configured to build from **GitHub Actions** (`.github/workflows/deploy.yml`). Every push
to `main` publishes the site at `https://<user>.github.io/beeline/`. No build step - the workflow
just uploads the repo root as the Pages artifact.
