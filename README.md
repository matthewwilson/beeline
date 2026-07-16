# 🐝 BeeLine

A forage, pollen and hive map for beekeepers. Drop a hive on the map and BeeLine predicts
where your bees are most likely foraging — because you can't GPS-track them, but honeybee
foraging is well understood (mostly within 1–2 km of the hive, out to ~5 km, favouring the
richest nectar/pollen sources closest to home).

**Live site:** https://beeline.joyfulhoney.co.uk/ — installable as an app (PWA).

## Features
- **Forage & bloom map** — draws the 1 / 3 / 5 km foraging rings, pulls the real green spaces
  around your hive from OpenStreetMap (orchards, meadows, gardens, farmland, heath, hedgerows,
  woods…) and ranks the **likely destinations** by forage value × bloom timing × distance.
- **Research-grounded forage values** — per-plant nectar values derived from Baude et al.'s
  measured UK nectar/pollen datasets (see [`references/forage-values.md`](references/forage-values.md)).
- **Authoritative regional habitat layers** — supplements OSM with national inventories from
  DAERA/NIEA, Natural England, NatureScot, Natural Resources Wales and Ireland's National Parks
  and Wildlife Service. Surveyed habitat receives a provenance label and confidence bonus.
- **Live weather + dynamic bloom** — an Open-Meteo "are the bees flying today?" panel, and an
  **Auto** season mode that compares the current year with the previous ten years at the hive's
  coordinates and scores bloom against local growing degree days.
- **Hedgerow forage** — hedges (hawthorn/blackthorn/bramble), a major forage source across Britain
  and Ireland, pulled from OSM and scored.
- **Pollen colour map** — each source is tinted by its plant's characteristic pollen colour, and a
  swatch picker highlights the sources matching the pollen you see at the hive entrance.
- **Field flower log** 🌼 — walk up to a plant and log it (curated list, or free text). Saved on
  your device; each sighting becomes a high-confidence forage point that outranks generic data nearby.
- **Forage calendar & June-gap planner** 📅 — a year-round forage-availability chart for the hive,
  flagging lean periods (the classic June gap) and suggesting pollinator plants to fill them.
- **Biosecurity & alerts** 🛡️ — a live "any yellow-legged hornet records within 10 km?" check from
  NBN Atlas in the UK or NBDC records via GBIF in Ireland, with reporting and bee-health guidance
  routed to the correct national authority.
- **Automatic regional coverage** — detects Northern Ireland, the Republic of Ireland, Scotland,
  England or Wales from the hive location. Hives elsewhere retain OSM, weather, elevation and
  observations while regional habitat and biosecurity guidance is clearly unavailable.
- **Your hives** — add as many hives as you like; saved in your browser's `localStorage`, no account,
  no server.

## Tech stack
A **React + Vite + TypeScript** single-page app, built to static files and served from GitHub Pages.
- **Map:** [Leaflet](https://leafletjs.com/) (imperative, wrapped in one component) + OpenStreetMap tiles.
- **State:** a small [Zustand](https://github.com/pmndrs/zustand) store; hives/flowers persist in `localStorage`.
- **Type & data:** self-hosted fonts (Fraunces / Hanken Grotesk / IBM Plex Mono) — no font CDN.
- **PWA:** [`vite-plugin-pwa`](https://vite-pwa-org.netlify.app/) generates the manifest, icons and a
  service worker. The app is **installable** and the shell works offline; live data (map tiles,
  Overpass, national habitat services, Open-Meteo, NBN and GBIF) is fetched over the network and
  is not cached.

All forage data is fetched live, client-side, from free/open APIs. There is no backend. See
[`references/regional-data.md`](references/regional-data.md) for regional coverage and provenance.

## Running locally
Requires Node 20.19+ or 22+.

```bash
npm install
npm run dev       # dev server (http://localhost:5173/)
npm run build     # type-check + production build to dist/
npm run preview   # serve the built dist/ locally
npm test          # unit tests (geo / scoring / calendar)
npm run icons     # regenerate PWA icons from src/assets/icon.png
```

Geolocation ("Add a hive/flower") needs a secure context, which `localhost` provides.

## Deploying to GitHub Pages
Pages is configured to build from **GitHub Actions** (`.github/workflows/deploy.yml`). Every push to
`main` runs `npm ci && npm run build` and publishes `dist/` to
`https://beeline.joyfulhoney.co.uk/`. The Vite `base` is `/`, threaded through the PWA manifest
and service-worker scope.

> If a deploy fails, push a fresh commit — do **not** re-run the same workflow/SHA (re-runs
> duplicate the Pages artifact and the deploy wedges on the failed SHA).

## Data & attribution
- Forage values: **Baude et al.** nectar (2016) & pollen (2025) datasets, UKCEH/EIDC, Open
  Government Licence. See `references/forage-values.md`.
- Habitats: **DAERA/NIEA Priority Habitats**, **Natural England Priority Habitats Inventory**,
  **NatureScot Habitat Map of Scotland**, **Natural Resources Wales Phase 1 Habitat Survey** and
  **NPWS Article 17, native woodland and semi-natural grassland surveys**. See the regional data
  reference for licences and endpoints.
- Weather: **Open-Meteo**. Map & land use: **© OpenStreetMap contributors** (ODbL).
- Yellow-legged hornet check: **NBN Atlas** in the UK and **NBDC records via GBIF** in Ireland.
  Planting suggestions: **All-Ireland Pollinator Plan** / **RHS Plants for Pollinators**.
