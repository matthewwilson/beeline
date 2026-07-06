# AGENTS.md

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
- **Zustand** for state: `src/store/useStore.ts` (domain data + async orchestration) and
  `src/store/useUiStore.ts` (view/navigation state - `mobileView`, map fly requests).
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
npm test          # vitest run - unit tests (lib / services / storage / store)
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
  store/useStore.ts  Domain Zustand store - hives/flowers/forage state + async orchestration
  store/useUiStore.ts View/navigation store - mobileView tab + map fly requests
  map/               MapView.tsx - the ONE Leaflet component + its CSS module
  components/        React UI panels (each with a co-located *.module.css)
  lib/               Pure logic, unit-tested: geo, features, scoring, calendar, dca, beeFlights,
                    weather, photo; plus hooks useAddForage / useScoredFeatures / useMediaQuery
  services/          Network fetches to external APIs via fetchJson (http, overpass, habitats,
                    weather, nbn, elevation)
  data/              Static domain data tables: forage, bloom, plants, pollen
  styles/            tokens.css (design tokens) + global.css (base styles) + media.css (breakpoint)
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
(the app degrades gracefully, it never throws to the UI). Most build on `http.ts`'s `fetchJson`,
which adds a `res.ok` check + timeout + soft-fail so `null` (failed) stays distinct from `[]`
(empty). All APIs are keyless and CORS-open:
- `overpass.ts` - OpenStreetMap land cover via Overpass; races 4 mirrors with `Promise.any` (keeps
  its own throw-on-error fetch so the race picks the first working mirror).
- `habitats.ts` - DAERA/NIEA Priority Habitats (NI) via ArcGIS FeatureServers; marked `surveyed`.
- `weather.ts` - Open-Meteo current weather + cumulative growing-degree-days.
- `nbn.ts` - NBN Atlas Asian hornet (Vespa velutina) occurrence count within 10 km.
- `elevation.ts` - Open-Meteo elevation for the DCA model (chunked to 100 points/request).

**`src/lib/*` - pure logic + a few hooks.** The pure, tested modules take no React and no network:
`geo.ts` (distance, bearing, centroid, day-of-year, formatting), `features.ts` (`makeFeature` -
the shared distance/dir Feature builder), `scoring.ts` (the core `scoreOf` = base × season/bloom ×
distance decay × confidence, plus pollen filtering), `calendar.ts` (year-round forage curve +
June-gap detector), `dca.ts` (drone-congregation-area suitability grid - see `references/dca-model.md`),
`beeFlights.ts` (animated bee flight simulation), `weather.ts` (`flyVerdict`/`seasonPhrase`),
`photo.ts` (EXIF geolocation). The hooks are the exception: `useAddForage.ts` (shared add
hive/flower/photo actions), `useScoredFeatures.ts` (the one memoised score/sort pipeline used by
the destination list, forage markers and bee flights) and `useMediaQuery.ts` (`useIsDesktop`, the
single JS source of the layout breakpoint).

**`src/store/useStore.ts` - the orchestrator.** The domain Zustand store holding hive/flower state
and the async flows (view/navigation state lives in `useUiStore`). When a hive is selected it fires
`loadWeather`, `loadBiosecurity` and `loadForage` in parallel. Note the **`selectionToken` pattern**:
a module-level counter incremented on every hive switch; async results check their token against the
current one and bail if stale, preventing a slow fetch for hive A from clobbering hive B. Preserve
this pattern when adding async flows. Keep domain actions pure - navigation is explicit at call
sites via `useUiStore.setMobileView`, never a side-effect of `selectHive`/`saveHive`.

**`src/map/MapView.tsx` - the single Leaflet boundary.** Leaflet is imperative and mutates the DOM,
so it is quarantined in one component. It subscribes to the store and imperatively syncs Leaflet
layers (markers, rings, bee-flight animation, DCA cells) to state. **Do not create other components
that touch the `L` (Leaflet) instance** - route map interactions through the store.

**`src/components/*` - declarative UI panels.** Each reads from the stores via selectors and
renders. Panels: controls/setup, results/destinations, forage calendar, biosecurity, weather,
pollen swatches, season select, flower picker, hive-name picker, mobile nav, map add menu. Shared
building blocks: `Section` (labelled panel section) and `ToggleSwitch` (the on/off switch). The
layout is **mobile-first**: `App.tsx` reads `useIsDesktop()` and mounts the floating side panels on
desktop, or the tab-switched map/controls/results views + bottom nav + add FAB on mobile - the
shared weather/pollen/legend sections mount once per viewport (never double-mounted). CSS is
authored mobile-first with one desktop layer (`@media (--desktop)`).

## Conventions

- **TypeScript is strict.** `noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax`,
  `erasableSyntaxOnly` are on. Use `import type { ... }` for type-only imports. No `enum` /
  `namespace` (erasable syntax only). Prefer explicit return types on exported functions.
- **No default exports** - use named exports throughout.
- **Styling** is CSS Modules (`*.module.css`) co-located with each component, plus global design
  tokens in `src/styles/tokens.css`. The identity is a dark, warm "apiary instrument" chrome with a
  honey accent. Use the CSS custom properties (`--honey`, `--wax`, `--panel`, `--r-md`, the
  `--space-*` scale, `--z-*` ladder, `--transition`, `--nav-h`, etc.) rather than hard-coding colours
  or sizes. Global utility classes exist (`panel`, `panel-sheet`, `eyebrow`, `wordmark`, `scroll-warm`).
  One caveat: Leaflet writes some colours straight onto SVG attributes where CSS variables do not
  resolve, so a few colour literals in `beeFlights.ts` / `MapView.tsx` intentionally mirror the token
  values - keep them in sync if you change the tokens.
- **Mobile-first CSS.** Author base rules for mobile, then add the desktop layer inside
  `@media (--desktop)`. That `--desktop` custom media is defined once in `src/styles/media.css`
  (via `postcss-custom-media` + `@csstools/postcss-global-data`, see `postcss.config.js`); don't
  hard-code `820px` in a module. In JS, get the breakpoint from `useIsDesktop()`, not `matchMedia`.
- **State**: domain data in `useStore`, view/navigation in `useUiStore`; components stay declarative
  and select narrowly (`useStore((s) => s.field)`). Keep navigation explicit - domain actions must
  not write `mobileView`.
- **Services fail soft.** Return `null`/`[]` on error; never let a fetch reject into the UI. Reach
  for `fetchJson` (`services/http.ts`) for new clients so the `res.ok`/timeout/soft-fail is uniform.
- **Tests** live beside the code as `*.test.ts` and cover `src/lib`, `src/services`, `src/storage`
  and the store. Add tests when you touch scoring, geo, calendar, dca, beeFlights, features, weather,
  a service or the store's stale-guard. Vitest runs in the `node` environment (stub `fetch`/
  `localStorage`).
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
