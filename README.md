# 🐝 BeeLine

A forage, pollen and hive map for beekeepers. Drop a hive on the map and BeeLine predicts
where your bees are most likely foraging — because you can't GPS-track them, but honeybee
foraging is well understood (mostly within 1–2 km of the hive, out to ~5 km, favouring the
richest nectar/pollen sources closest to home).

**Live site:** https://matthewwilson.github.io/beeline/

## Features
- **Forage & bloom map** — draws the 1 / 3 / 5 km foraging rings, pulls the real green spaces
  around your hive from OpenStreetMap (orchards, meadows, gardens, farmland, heath, woods…)
  and ranks the **likely destinations** by forage value × distance × season.
- **Pollen colour map** — each source is tinted by its plant's characteristic pollen colour,
  and a swatch picker highlights the sources matching the pollen you see at the hive entrance.
- **Season selector** — reweights the ranking through the year (blossom in spring, heather in
  late summer, and so on).
- **Your hives** — add as many hives as you like; they're saved in your browser's
  `localStorage`, so they're there next time you visit. No account, no server.

## How it works
It's a single static `index.html` — no build step and no backend. Map tiles come from
OpenStreetMap, and forage features come from the free [Overpass API](https://overpass-api.de/)
(four mirrors are raced in parallel for resilience).

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
This repo is already Pages-ready (`index.html` at the root, plus a `.nojekyll` marker). To
enable it: **Settings → Pages → Build and deployment → Deploy from a branch → `main` / `/root`**.
The site publishes at `https://<user>.github.io/beeline/`.
