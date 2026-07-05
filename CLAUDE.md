# CLAUDE.md

Guidance for AI assistants working in this repository. Read this before making changes.

## What BeeLine is

BeeLine is a forage, pollen and hive map for beekeepers. You drop a hive on the map and it
predicts where honeybees are most likely foraging (mostly within 1-2 km, out to ~5 km, favouring
the richest nectar/pollen sources closest to home), ranks the likely destinations, and layers on
weather, bloom timing, biosecurity alerts and queen-mating/drone-congregation geometry.

It is a **client-only single-page app**. There is no backend and no database. Everything runs in
the browser: hives and flower sightings live in `localStorage`, and all live data (map tiles,
land cover, habitats, weather, hornet records, elevation) is fetched client-side from free/open
APIs. The app is a PWA and its shell works offline, but live data is deliberately never cached.

Geography note: the app is tuned for **Northern Ireland**. Forage values, bloom windows, the
GDD baseline and the authoritative habitat/disease layers are NI-specific.

## Tech stack

- **React 19 + TypeScript + Vite 8**, built to static files and served from GitHub Pages.
- **Leaflet** for the map (imperative, wrapped in a single component - see below).
- **Zustand** for state (`src/store/useStore.ts`), a single store.
- **Vitest** for unit tests (pure logic in `src/lib`).
- Self-hosted fonts via `@fontsource*` (Fraunces / Hanken Grotesk / IBM Plex Mono) - no font CDN.
- `vite-plugin-pwa` for the manifest, icons and service worker.

Requires Node 20.19+ or 22+ (CI uses Node 22).

## Commands

```bash
npm install
npm run dev       # dev server at http://localhost:5173/beeline/
npm run build     # tsc -b (type-check) + vite build to dist/
npm run preview   # serve the built dist/ locally
npm test          # vitest run - unit tests (geo / scoring / calendar / dca / beeFlights)
npm run icons     # regenerate PWA icons from src/assets/icon.png
```

Note the `/beeline/` path: the Vite `base` is `/beeline/`, so the dev server and all routes are
served under that prefix. Geolocation ("Add a hive/flower") needs a secure context, which
`localhost` provides.

Before committing non-trivial changes, run `npm run build` (it type-checks) and `npm test`.

## Architecture

Data flows in one direction: **services fetch → store orchestrates → lib scores → components render**.

### Directory layout

```
src/
  App.tsx            Layout shell; wires the panels together, first-visit geolocation
  main.tsx           Entry point; global CSS + font imports
  types.ts           Shared domain types (Hive, Flower, Feature, ForageKey, etc.)
  storage.ts         localStorage read/write for hives, flowers, "my hive" ids
  store/useStore.ts  The single Zustand store - all app state + async orchestration
  map/               MapView.tsx - the ONE Leaflet component + its CSS module
  components/        React UI panels (each with a co-located *.module.css)
  lib/               Pure logic, unit-tested: geo, scoring, calendar, dca, beeFlights, photo
  services/          Network fetches to external APIs (overpass, habitats, weather, nbn, elevation)
  data/              Static domain data tables: forage, bloom, plants, pollen
  styles/            tokens.css (design tokens) + global.css (base styles)
references/          Provenance docs for the forage values and the DCA model (source of truth
                    for the numbers - update these when the numbers change)
scripts/            generate-icons.mjs (PWA icon generation via sharp)
```

### Key layers

**`src/data/*` - static domain tables.** `forage.ts` is the heart of the model: `FORAGE` maps each
`ForageKey` to a relative forage value (`base`, 0-10), display colour, characteristic pollen colour
and representative plant. `TAG_TO_KEY` maps raw OSM tags onto forage keys. `CONFIDENCE_MULT` weights
observed > surveyed > OSM sources. `bloom.ts` holds bloom windows (day-of-year quadruples), manual
per-season multipliers and the GDD baseline curve. The `base` values and bloom windows are
research-grounded - see `references/forage-values.md`. **If you change a number, update the reference.**

**`src/services/*` - external API clients.** Each returns typed data or `null`/`[]` on failure
(the app degrades gracefully, it never throws to the UI). All APIs are keyless and CORS-open:
- `overpass.ts` - OpenStreetMap land cover via Overpass; races 4 mirrors with `Promise.any`.
- `habitats.ts` - DAERA/NIEA Priority Habitats (NI) via ArcGIS FeatureServers; marked `surveyed`.
- `weather.ts` - Open-Meteo current weather + cumulative growing-degree-days.
- `nbn.ts` - NBN Atlas Asian hornet (Vespa velutina) occurrence count within 10 km.
- `elevation.ts` - Open-Meteo elevation for the DCA model (chunked to 100 points/request).

**`src/lib/*` - pure, tested logic.** No React, no network. `geo.ts` (distance, bearing, centroid,
day-of-year, formatting helpers), `scoring.ts` (the core `scoreOf` = base × season/bloom × distance
decay × confidence, plus pollen filtering), `calendar.ts` (year-round forage curve + June-gap
detector), `dca.ts` (drone-congregation-area suitability grid model - see `references/dca-model.md`),
`beeFlights.ts` (animated bee flight simulation), `photo.ts` (EXIF geolocation from a photo).
`useAddForage.ts` is the one exception - a shared hook for the "add hive/flower/photo" actions.

**`src/store/useStore.ts` - the orchestrator.** A single Zustand store holding all state and the
async flows. When a hive is selected it fires `loadWeather`, `loadBiosecurity` and `loadForage` in
parallel. Note the **`selectionToken` pattern**: a module-level counter incremented on every hive
switch; async results check their token against the current one and bail if stale, preventing a
slow fetch for hive A from clobbering hive B. Preserve this pattern when adding async flows.

**`src/map/MapView.tsx` - the single Leaflet boundary.** Leaflet is imperative and mutates the DOM,
so it is quarantined in one component. It subscribes to the store and imperatively syncs Leaflet
layers (markers, rings, bee-flight animation, DCA cells) to state. **Do not create other components
that touch the `L` (Leaflet) instance** - route map interactions through the store.

**`src/components/*` - declarative UI panels.** Each reads from the store via `useStore` selectors
and renders. Panels: controls/setup, results/destinations, forage calendar, biosecurity, weather,
pollen swatches, season select, flower picker, mobile nav, map add menu. Desktop shows panels
side-by-side; mobile uses a tab-style nav (`mobileView` in the store: `map` / `controls` / `results`).

## Conventions

- **TypeScript is strict.** `noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax`,
  `erasableSyntaxOnly` are on. Use `import type { ... }` for type-only imports. No `enum` /
  `namespace` (erasable syntax only). Prefer explicit return types on exported functions.
- **No default exports** - use named exports throughout.
- **Styling** is CSS Modules (`*.module.css`) co-located with each component, plus global design
  tokens in `src/styles/tokens.css`. The identity is a dark, warm "apiary instrument" chrome with a
  honey accent. Use the CSS custom properties (`--honey`, `--wax`, `--panel`, `--r-md`, `--space`,
  etc.) rather than hard-coding colours or sizes. Global utility classes exist (`panel`, `eyebrow`,
  `wordmark`, `scroll-warm`). One caveat: Leaflet writes some colours straight onto SVG attributes
  where CSS variables do not resolve, so a few colour literals in `beeFlights.ts` / `MapView.tsx`
  intentionally mirror the token values - keep them in sync if you change the tokens.
- **State** goes in the Zustand store; components stay declarative. Select narrowly
  (`useStore((s) => s.field)`), don't grab the whole store.
- **Services fail soft.** Return `null`/`[]` on error; never let a fetch reject into the UI.
- **Tests** live beside the code as `*.test.ts` and cover the pure `src/lib` logic. Add tests when
  you touch scoring, geo, calendar, dca or beeFlights. Vitest runs in the `node` environment.
- **Spelling and punctuation:** this project uses UK/British spelling (colour, favour, behaviour).
  No Oxford commas. Use hyphens or en dashes, not em dashes.

## Deployment

GitHub Pages builds from **GitHub Actions** (`.github/workflows/deploy.yml`). Every push to `main`
runs `npm ci && npm run build` and publishes `dist/` to `https://<user>.github.io/beeline/`. The
Vite `base` (`/beeline/`) is threaded through the PWA manifest `id`/`scope`/`start_url` and the
service-worker scope.

> If a deploy fails, push a fresh commit - do **not** re-run the same workflow/SHA. Re-runs
> duplicate the Pages artifact and the deploy wedges on the failed SHA.

## Data and attribution

All forage data is fetched live from free/open APIs; there is no backend. Sources and licences:
- Forage values: **Baude et al.** nectar (2016) & pollen (2025) datasets, UKCEH/EIDC, OGL
  (`references/forage-values.md`).
- Habitats: **DAERA/NIEA Priority Habitats** via OpenDataNI, OGL.
- Weather + elevation: **Open-Meteo**. Map & land use: **© OpenStreetMap contributors** (ODbL).
- Asian hornet check: **NBN Atlas**. Planting suggestions: **All-Ireland Pollinator Plan** / RHS.
- Bee-health guidance: **DAERA** (NI - report disease to DAERA, not the GB bee unit).
