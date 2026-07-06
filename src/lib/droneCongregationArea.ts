import type { Feature, ForageKey, LatLon } from '../types'
import { clamp, distanceMetres, distanceToGeometryMetres, offsetLatLon } from './geo'

/**
 * Drone congregation area suitability model.
 *
 * A drone congregation area is an aerial patch (~100 m across, 10–40 m up) where male
 * honeybees gather to mate with virgin queens. Real sites can only be confirmed in the
 * field (pheromone lure or tethered queen), but two studies found their presence
 * correlates with a small set of landscape/topographic features we can compute:
 *
 *   - Galindo-Cardona et al. 2012, J. Insect Sci. 12:122 — south-facing aspect and open,
 *     non-steep terrain were the significant correlates.
 *   - Hayashi & Satoh 2021, Ethology 127:582 — sites were open, at local low elevation,
 *     with high sun irradiance.
 *
 * This module turns those findings into a 0–1 suitability score per grid cell. It is a
 * prediction, not a detection — see references/dca-model.md for the full rationale.
 */

export const DEFAULT_RADIUS_METRES = 2000
export const DEFAULT_STEP_METRES = 200

// Maximum terrain slope (%) tolerated before a cell is treated as too steep.
const SLOPE_MAX_PERCENT = 19
// How far from a cell we look for open land / landmarks (matches the studies' buffers).
const OPEN_RADIUS_METRES = 500
const WOOD_RADIUS_METRES = 250
const LANDMARK_RADIUS_METRES = 400

// Factor weights when full topography is available (sum to 1).
const FACTOR_WEIGHTS = { openness: 0.3, south: 0.25, low: 0.2, shelter: 0.15, slope: 0.1 }
// Fallback weights when elevation is unavailable (openness + shelter, renormalised).
const LAND_COVER_ONLY_WEIGHTS = { openness: 0.65, shelter: 0.35 }

const OPEN_FORAGE_KEYS = new Set<ForageKey>(['meadow', 'farmland', 'heath', 'park', 'scrub', 'allotments', 'garden', 'orchard'])
const CLOSED_FORAGE_KEYS = new Set<ForageKey>(['wood'])
// Hedges, including OpenStreetMap tree rows, and wood edges act as the visual landmarks /
// wind shelter that drone congregation areas sit beside.
const LANDMARK_FORAGE_KEYS = new Set<ForageKey>(['hedge', 'wood'])

export interface Grid {
  points: LatLon[] // row-major; row 0 is the northernmost row
  cols: number
  rows: number
  stepMetres: number
  hive: LatLon
}

export interface DroneCongregationAreaFactors {
  openness: number
  shelter: number
  low: number
  south: number
  slope: number
}

export interface DroneCongregationAreaCell {
  lat: number
  lon: number
  score: number
  factors: DroneCongregationAreaFactors
}

// Square grid of candidate points centred on the hive. Kept rectangular (not clipped to a
// circle) so every interior cell has the four neighbours needed for slope/aspect.
export function buildGrid(hive: LatLon, radiusMetres = DEFAULT_RADIUS_METRES, stepMetres = DEFAULT_STEP_METRES): Grid {
  const n = Math.max(1, Math.floor(radiusMetres / stepMetres))
  const cols = 2 * n + 1
  const rows = 2 * n + 1
  const points: LatLon[] = []
  for (let r = 0; r < rows; r++) {
    const northMetres = (n - r) * stepMetres
    for (let c = 0; c < cols; c++) {
      const eastMetres = (c - n) * stepMetres
      points.push(offsetLatLon(hive, eastMetres, northMetres))
    }
  }
  return { points, cols, rows, stepMetres, hive }
}

// Steepest-descent slope (%) and aspect (compass azimuth of the downhill direction, 0=N,
// 90=E, 180=S) for an interior cell, via central differences on its neighbours. Returns
// null on edge cells (no full neighbourhood).
export function slopeAspect(
  grid: Grid,
  elevations: number[],
  r: number,
  c: number,
): { slopePct: number; aspectDeg: number | null } | null {
  const { cols, rows, stepMetres } = grid
  if (r <= 0 || c <= 0 || r >= rows - 1 || c >= cols - 1) return null
  const at = (rr: number, cc: number) => elevations[rr * cols + cc]
  const dzdx = (at(r, c + 1) - at(r, c - 1)) / (2 * stepMetres) // rise per metre east
  const dzdy = (at(r - 1, c) - at(r + 1, c)) / (2 * stepMetres) // rise per metre north (row-1 is north)
  const slopePct = Math.sqrt(dzdx * dzdx + dzdy * dzdy) * 100
  if (slopePct < 0.01) return { slopePct, aspectDeg: null }
  // Downhill direction points opposite the gradient.
  const aspectDeg = ((Math.atan2(-dzdx, -dzdy) * 180) / Math.PI + 360) % 360
  return { slopePct, aspectDeg }
}

// Proximity ramp: 1 on top of the target, fading linearly to 0 at radius R.
const prox = (d: number, R: number) => clamp(1 - d / R, 0, 1)

// 0 (north-facing) → 1 (south-facing); 0.5 for E/W or flat/undefined aspect.
function southness(aspectDeg: number | null): number {
  if (aspectDeg == null) return 0.5
  return (1 - Math.cos((aspectDeg * Math.PI) / 180)) / 2
}

function opennessAt(cell: LatLon, land: Feature[]): number {
  let openDistance = Infinity
  let woodDistance = Infinity
  for (const f of land) {
    if (!OPEN_FORAGE_KEYS.has(f.key) && !CLOSED_FORAGE_KEYS.has(f.key)) continue
    const d = distanceToFeatureMetres(cell, f)
    if (OPEN_FORAGE_KEYS.has(f.key)) openDistance = Math.min(openDistance, d)
    else woodDistance = Math.min(woodDistance, d)
  }
  return clamp(prox(openDistance, OPEN_RADIUS_METRES) - 0.8 * prox(woodDistance, WOOD_RADIUS_METRES), 0, 1)
}

function shelterAt(cell: LatLon, land: Feature[]): number {
  let landmarkDistance = Infinity
  for (const f of land) {
    if (!LANDMARK_FORAGE_KEYS.has(f.key)) continue
    landmarkDistance = Math.min(landmarkDistance, distanceToFeatureMetres(cell, f))
  }
  return prox(landmarkDistance, LANDMARK_RADIUS_METRES)
}

function distanceToFeatureMetres(cell: LatLon, feature: Feature): number {
  return distanceToGeometryMetres(cell, feature.geometry) ?? distanceMetres(cell, feature)
}

export interface FactorRow {
  label: string
  pct: number
}

// Human-readable breakdown of why a cell scored as it did, ordered by the model's weighting.
// Without elevation (partial mode) the south/low/slope factors are neutral placeholders, so we
// drop them and show only the land-cover factors that were actually measured.
export function cellFactorRows(cell: DroneCongregationAreaCell, haveElev: boolean): FactorRow[] {
  const { openness, shelter, low, south, slope } = cell.factors
  const rows: FactorRow[] = [
    { label: 'Open ground', pct: Math.round(openness * 100) },
    { label: 'Shelter / landmark', pct: Math.round(shelter * 100) },
  ]
  if (haveElev) {
    rows.push(
      { label: 'South-facing', pct: Math.round(south * 100) },
      { label: 'Low-lying', pct: Math.round(low * 100) },
      { label: 'Gentle slope', pct: Math.round(slope * 100) },
    )
  }
  return rows
}

// Score every in-range grid cell. `elevations` aligns 1:1 with grid.points; pass null when
// the elevation API was unavailable to score on land cover alone.
export function scoreGrid(
  grid: Grid,
  elevations: number[] | null,
  land: Feature[],
  radiusMetres = DEFAULT_RADIUS_METRES,
): DroneCongregationAreaCell[] {
  const haveElev = elevations != null && elevations.length === grid.points.length
  let min = Infinity
  let max = -Infinity
  if (haveElev) {
    for (const e of elevations!) {
      if (e < min) min = e
      if (e > max) max = e
    }
  }
  const span = max - min

  const out: DroneCongregationAreaCell[] = []
  for (let r = 0; r < grid.rows; r++) {
    for (let c = 0; c < grid.cols; c++) {
      const i = r * grid.cols + c
      const cell = grid.points[i]
      if (distanceMetres(grid.hive, cell) > radiusMetres) continue

      const openness = opennessAt(cell, land)
      const shelter = shelterAt(cell, land)

      let factors: DroneCongregationAreaFactors
      let score: number
      if (haveElev) {
        const sa = slopeAspect(grid, elevations!, r, c)
        const south = southness(sa ? sa.aspectDeg : null)
        const slope = sa ? clamp(1 - sa.slopePct / SLOPE_MAX_PERCENT, 0, 1) : 0.5
        // Lower-lying ground scores higher; neutral 0.5 on flat terrain.
        const low = span > 0 ? clamp((max - elevations![i]) / span, 0, 1) : 0.5
        factors = { openness, shelter, low, south, slope }
        score =
          FACTOR_WEIGHTS.openness * openness +
          FACTOR_WEIGHTS.south * south +
          FACTOR_WEIGHTS.low * low +
          FACTOR_WEIGHTS.shelter * shelter +
          FACTOR_WEIGHTS.slope * slope
      } else {
        factors = { openness, shelter, low: 0.5, south: 0.5, slope: 0.5 }
        score = LAND_COVER_ONLY_WEIGHTS.openness * openness + LAND_COVER_ONLY_WEIGHTS.shelter * shelter
      }
      out.push({ lat: cell.lat, lon: cell.lon, score, factors })
    }
  }
  return out
}
