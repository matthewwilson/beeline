# Drone congregation area (DCA) suitability model

BeeLine's "Show drone congregation areas" layer scores the landscape around a hive for how
likely it is to hold a **drone congregation area** — the aerial patch (~100 m across,
10–40 m up) where male honeybees gather on warm afternoons to mate with virgin queens.

**This is a prediction, not a detection.** A real DCA can only be confirmed in the field
(a queen-pheromone lure hoisted on a balloon/kite, or a tethered virgin queen). What the
layer does is rank candidate airspace by the *landscape features that peer-reviewed studies
found associated with DCA presence*. Treat it as "worth checking here first", not "a DCA is
here".

## Why this is possible at all

DCAs are notoriously stable — the same sites are used year after year, by drones from many
colonies — which suggests they are cued by persistent landscape/topographic features rather
than by the colonies present in any given year. Two studies tested exactly this by comparing
confirmed DCA sites against nearby non-DCA sites in a GIS:

- **Galindo-Cardona, A. et al. (2012)**. *Landscape analysis of drone congregation areas of
  the honey bee, Apis mellifera.* Journal of Insect Science 12:122.
  https://pmc.ncbi.nlm.nih.gov/articles/PMC3635128/
  Compared 8 DCAs vs non-DCA candidates in circular buffers (200 / 400 / 800 m), profiling
  % pasture/urban/crop cover, solar radiation, aspect, slope and feature densities.
  **Aspect** (DCAs concentrated **facing south**) and open, non-steep terrain were the
  standout correlates.

- **Hayashi, S. & Satoh, T. (2021)**. *Landscape features causing the local congregation of
  honeybee males (Apis mellifera L.).* Ethology 127:582–591.
  https://doi.org/10.1111/eth.13165
  Compared DCA vs non-DCA sites using a digital elevation model, digital surface model and
  land-cover data. DCAs were **open** (few structures), at **local low elevation**, with high
  **sun irradiance**.

Supporting background (reviews, beekeeping literature, Wikipedia): DCAs sit in **open,
wind-sheltered** ground, beside **visual landmarks** (hedges, tree-lines, subtle ridges),
avoid dense forest and urban clutter, and occur on **gentle slopes** (broadly < ~19%).

## The model (`src/lib/dca.ts`)

A square grid of candidate points is laid out around the hive (default **2 km** radius,
**200 m** spacing — drones average roughly 900 m to a DCA, and 200 m ≈ real DCA scale). Each
in-range cell gets five 0–1 factor scores which are combined into a weighted suitability
score.

| Factor | What it measures | Weight | Grounded in |
|---|---|---|---|
| **Openness** | proximity to open land (meadow, farmland, heath, park, scrub, allotments, garden, orchard), penalised by nearby woodland | 0.30 | DCAs are open fields, avoid forest/urban clutter (Hayashi; Galindo-Cardona) |
| **South aspect** | how close the downhill slope azimuth is to due south (180°) | 0.25 | south-facing was the strongest correlate (Galindo-Cardona) |
| **Local low** | how low the cell sits relative to the sampled grid | 0.20 | DCAs at local low points / dips (Hayashi) |
| **Shelter / landmark** | proximity to a hedge, tree-row or wood edge | 0.15 | DCAs sit beside visual landmarks and use them as wind shelter |
| **Gentle slope** | flatter scores higher; ~0 at/above 19% slope | 0.10 | DCAs on non-steep terrain (Galindo-Cardona) |

**Sun irradiance** is not fetched separately — it is represented implicitly by the
south-aspect and openness factors, which are its main landscape drivers, keeping the model to
one extra network call.

### Data sources
- **Land cover** (openness, shelter): the OpenStreetMap Overpass land-use features BeeLine
  already fetches for forage (`src/services/overpass.ts`) — reused, no extra request.
- **Topography** (low, aspect, slope): elevations from the keyless **Open-Meteo Elevation
  API** (`src/services/elevation.ts`), ~90 m Copernicus/SRTM data, batched ≤100 points per
  request. Slope and aspect are derived by central differences over the elevation grid.

### Graceful degradation
If the elevation API is unavailable, the model drops the three topographic factors and scores
on land cover alone (openness 0.65 / shelter 0.35, renormalised). The UI flags this as a
"land-cover estimate only" (`dcaStatus === 'partial'`).

### Rendering
The map (`src/map/MapView.tsx`) draws the stronger cells (top ~half by relative score) as
graded, warm, semi-transparent squares — amber (less likely) → deep red (more likely). Cells
are non-interactive so you can still click the map to drop a hive beneath them.

## Limitations (read before trusting a hot cell)
- **Coarse elevation.** 90 m SRTM under-resolves the 100 m features that matter; aspect/slope
  are approximate and derived, not surveyed.
- **No urban/building layer.** Overpass here fetches forage land use, not buildings, so
  "openness" is inferred from open-land vs woodland proximity, not from built-up density. A
  cell in a treeless housing estate can look artificially open.
- **Not validated for this region.** The source studies are from Puerto Rico and Japan.
  BeeLine is NI-focused; the *direction* of each effect is transferable, the exact weights are
  a reasoned starting point, not locally calibrated.
- **Aspect effect is a hypothesis-level driver.** South preference may be a proxy for
  irradiance and/or geomagnetic cues; either way it is a correlation, not a mechanism.
- **Still requires field confirmation.** The layer narrows the search; it does not replace a
  lure flight.
