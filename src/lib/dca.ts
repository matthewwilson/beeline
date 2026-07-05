import type { Feature, ForageKey, LatLon } from '../types'
import { clamp, distanceMetres, offsetLatLon } from './geo'

/**
 * Drone Congregation Area (DCA) suitability model.
 *
 * A DCA is an aerial patch (~100 m across, 10–40 m up) where male honeybees gather to
 * mate with virgin queens. Real DCAs can only be confirmed in the field (pheromone lure
 * or tethered queen), but two GIS studies that compared DCA vs non-DCA sites found their
 * presence correlates with a small set of landscape/topographic features we can compute:
 *
 *   - Galindo-Cardona et al. 2012, J. Insect Sci. 12:122 — south-facing aspect and open,
 *     non-steep terrain were the significant correlates.
 *   - Hayashi & Satoh 2021, Ethology 127:582 — DCAs were open, at local low elevation,
 *     with high sun irradiance.
 *
 * This module turns those findings into a 0–1 suitability score per grid cell. It is a
 * prediction, not a detection — see references/dca-model.md for the full rationale.
 */

export const DEFAULT_RADIUS_M = 2000
export const DEFAULT_STEP_M = 200

// Max terrain slope (%) tolerated before a cell is treated as too steep for a DCA.
const SLOPE_MAX_PCT = 19
// How far from a cell we look for open land / landmarks (matches the studies' buffers).
const OPEN_RADIUS_M = 500
const WOOD_RADIUS_M = 250
const LANDMARK_RADIUS_M = 400

// Factor weights when full topography is available (sum to 1).
const W = { openness: 0.3, south: 0.25, low: 0.2, shelter: 0.15, slope: 0.1 }
// Fallback weights when elevation is unavailable (openness + shelter, renormalised).
const W_FLAT = { openness: 0.65, shelter: 0.35 }

const OPEN_KEYS = new Set<ForageKey>(['meadow', 'farmland', 'heath', 'park', 'scrub', 'allotments', 'garden', 'orchard'])
const CLOSED_KEYS = new Set<ForageKey>(['wood'])
// Hedges (incl. OSM tree rows) and wood edges act as the visual landmarks / wind shelter
// that DCAs sit beside.
const LANDMARK_KEYS = new Set<ForageKey>(['hedge', 'wood'])

export interface Grid {
  points: LatLon[] // row-major; row 0 is the northernmost row
  cols: number
  rows: number
  stepM: number
  hive: LatLon
}

export interface DcaFactors {
  openness: number
  shelter: number
  low: number
  south: number
  slope: number
}

export interface DcaCell {
  lat: number
  lon: number
  score: number
  factors: DcaFactors
}

// Square grid of candidate points centred on the hive. Kept rectangular (not clipped to a
// circle) so every interior cell has the four neighbours needed for slope/aspect.
export function buildGrid(hive: LatLon, radiusM = DEFAULT_RADIUS_M, stepM = DEFAULT_STEP_M): Grid {
  const n = Math.max(1, Math.floor(radiusM / stepM))
  const cols = 2 * n + 1
  const rows = 2 * n + 1
  const points: LatLon[] = []
  for (let r = 0; r < rows; r++) {
    const northM = (n - r) * stepM
    for (let c = 0; c < cols; c++) {
      const eastM = (c - n) * stepM
      points.push(offsetLatLon(hive, eastM, northM))
    }
  }
  return { points, cols, rows, stepM, hive }
}

// Steepest-descent slope (%) and aspect (compass azimuth of the downhill direction, 0=N,
// 90=E, 180=S) for an interior cell, via central differences on its neighbours. Returns
// null on edge cells (no full neighbourhood).
export function slopeAspect(
  grid: Grid,
  elevations: number[],
  r: number,
  c: number,
): { slopePct: number; aspectDeg: number } | null {
  const { cols, rows, stepM } = grid
  if (r <= 0 || c <= 0 || r >= rows - 1 || c >= cols - 1) return null
  const at = (rr: number, cc: number) => elevations[rr * cols + cc]
  const dzdx = (at(r, c + 1) - at(r, c - 1)) / (2 * stepM) // rise per metre east
  const dzdy = (at(r - 1, c) - at(r + 1, c)) / (2 * stepM) // rise per metre north (row-1 is north)
  const slopePct = Math.sqrt(dzdx * dzdx + dzdy * dzdy) * 100
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
  let dOpen = Infinity
  let dWood = Infinity
  for (const f of land) {
    if (!OPEN_KEYS.has(f.key) && !CLOSED_KEYS.has(f.key)) continue
    const d = distanceMetres(cell, f)
    if (OPEN_KEYS.has(f.key)) dOpen = Math.min(dOpen, d)
    else dWood = Math.min(dWood, d)
  }
  return clamp(prox(dOpen, OPEN_RADIUS_M) - 0.8 * prox(dWood, WOOD_RADIUS_M), 0, 1)
}

function shelterAt(cell: LatLon, land: Feature[]): number {
  let dLandmark = Infinity
  for (const f of land) {
    if (!LANDMARK_KEYS.has(f.key)) continue
    dLandmark = Math.min(dLandmark, distanceMetres(cell, f))
  }
  return prox(dLandmark, LANDMARK_RADIUS_M)
}

// Score every in-range grid cell. `elevations` aligns 1:1 with grid.points; pass null when
// the elevation API was unavailable to score on land cover alone.
export function scoreGrid(
  grid: Grid,
  elevations: number[] | null,
  land: Feature[],
  radiusM = DEFAULT_RADIUS_M,
): DcaCell[] {
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

  const out: DcaCell[] = []
  for (let r = 0; r < grid.rows; r++) {
    for (let c = 0; c < grid.cols; c++) {
      const i = r * grid.cols + c
      const cell = grid.points[i]
      if (distanceMetres(grid.hive, cell) > radiusM) continue

      const openness = opennessAt(cell, land)
      const shelter = shelterAt(cell, land)

      let factors: DcaFactors
      let score: number
      if (haveElev) {
        const sa = slopeAspect(grid, elevations!, r, c)
        const south = southness(sa ? sa.aspectDeg : null)
        const slope = sa ? clamp(1 - sa.slopePct / SLOPE_MAX_PCT, 0, 1) : 0.5
        // Lower-lying ground scores higher; neutral 0.5 on flat terrain.
        const low = span > 0 ? clamp((max - elevations![i]) / span, 0, 1) : 0.5
        factors = { openness, shelter, low, south, slope }
        score =
          W.openness * openness + W.south * south + W.low * low + W.shelter * shelter + W.slope * slope
      } else {
        factors = { openness, shelter, low: 0.5, south: 0.5, slope: 0.5 }
        score = W_FLAT.openness * openness + W_FLAT.shelter * shelter
      }
      out.push({ lat: cell.lat, lon: cell.lon, score, factors })
    }
  }
  return out
}
