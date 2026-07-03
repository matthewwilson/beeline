import { distanceMetres, offsetLatLon } from './geo'
import type { LatLon, ScoredFeature } from '../types'

export type BeeBand = 'orientation' | 'forager' | 'scout'

export interface BandInfo {
  id: BeeBand
  label: string
  blurb: string
  count: number
  colour: string
}

// Colours mirror the tokens.css age gradient (young = light, old = deep): --honey-soft,
// --honey, --amber. Kept as literals because Leaflet writes them straight onto SVG stroke
// attributes, where CSS custom properties do not resolve.
export const BANDS: BandInfo[] = [
  {
    id: 'orientation',
    label: 'Orientation flights',
    blurb: 'young bees circling close to the hive to learn landmarks',
    count: 5,
    colour: '#ffce5b',
  },
  {
    id: 'forager',
    label: 'Foragers',
    blurb: 'trips out to about 1 to 3 km towards the best forage',
    count: 8,
    colour: '#f6a800',
  },
  {
    id: 'scout',
    label: 'Far foragers',
    blurb: 'longer trips out towards 5 km when nearby forage is thin',
    count: 5,
    colour: '#c47f00',
  },
]

export interface Bee {
  band: BeeBand
  colour: string
  angle: number
  angularSpeed: number
  loopRadius: number
  dest: LatLon
  legSpeed: number
  t: number
  outbound: boolean
}

const GROUND_SPEED_M_PER_MS = 0.65
const MIN_LEG_MS = 1400
const SCOUT_FALLBACK_COUNT = 6

// The forage score decays steeply with distance, so weighting purely by score would keep every
// band near the hive. Instead each band draws from its own distance window and picks by quality
// within it, so scouts genuinely reach the farthest scored patches.
const BAND_RANGE: Record<BeeBand, [number, number]> = {
  orientation: [0, 500],
  forager: [700, 3200],
  scout: [2800, 5200],
}

function randRange(a: number, b: number): number {
  return a + Math.random() * (b - a)
}

export function candidatePool(scored: ScoredFeature[], band: BeeBand): ScoredFeature[] {
  const [min, max] = BAND_RANGE[band]
  const inRange = scored.filter((f) => f.distance >= min && f.distance <= max)
  if (inRange.length) return inRange
  if (band === 'scout') return [...scored].sort((a, b) => b.distance - a.distance).slice(0, SCOUT_FALLBACK_COUNT)
  return scored
}

export function pickDestination(scored: ScoredFeature[], band: BeeBand): LatLon | null {
  if (!scored.length) return null
  const pool = candidatePool(scored, band)
  const total = pool.reduce((sum, f) => sum + Math.max(0.0001, f.score), 0)
  let r = Math.random() * total
  for (const f of pool) {
    r -= Math.max(0.0001, f.score)
    if (r <= 0) return jitter(f)
  }
  return jitter(pool[pool.length - 1])
}

function jitter(p: LatLon): LatLon {
  return offsetLatLon(p, randRange(-130, 130), randRange(-130, 130))
}

function fallbackDest(band: BeeBand, hive: LatLon): LatLon {
  const radius = band === 'scout' ? randRange(3500, 5000) : randRange(900, 2500)
  const angle = randRange(0, Math.PI * 2)
  return offsetLatLon(hive, radius * Math.sin(angle), radius * Math.cos(angle))
}

function legSpeedFor(hive: LatLon, dest: LatLon): number {
  const legMs = Math.max(MIN_LEG_MS, distanceMetres(hive, dest) / GROUND_SPEED_M_PER_MS)
  return 1 / legMs
}

function makeBee(band: BandInfo, scored: ScoredFeature[], hive: LatLon): Bee {
  if (band.id === 'orientation') {
    return {
      band: band.id,
      colour: band.colour,
      angle: randRange(0, Math.PI * 2),
      angularSpeed: (Math.PI * 2) / randRange(4200, 6800),
      loopRadius: randRange(180, 420),
      dest: hive,
      legSpeed: 0,
      t: 0,
      outbound: true,
    }
  }
  const dest = pickDestination(scored, band.id) ?? fallbackDest(band.id, hive)
  return {
    band: band.id,
    colour: band.colour,
    angle: 0,
    angularSpeed: 0,
    loopRadius: 0,
    dest,
    legSpeed: legSpeedFor(hive, dest),
    t: randRange(0, 1),
    outbound: Math.random() > 0.5,
  }
}

export function createBees(scored: ScoredFeature[], hive: LatLon): Bee[] {
  const bees: Bee[] = []
  for (const band of BANDS) {
    for (let i = 0; i < band.count; i++) bees.push(makeBee(band, scored, hive))
  }
  return bees
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2
}

function lerpLatLon(a: LatLon, b: LatLon, t: number): LatLon {
  return { lat: a.lat + (b.lat - a.lat) * t, lon: a.lon + (b.lon - a.lon) * t }
}

function stepLoop(bee: Bee, dtMs: number, hive: LatLon): LatLon {
  bee.angle += bee.angularSpeed * dtMs
  const east = bee.loopRadius * Math.sin(bee.angle)
  const north = bee.loopRadius * Math.cos(bee.angle)
  return offsetLatLon(hive, east, north)
}

function retarget(bee: Bee, hive: LatLon, scored: ScoredFeature[]): void {
  bee.outbound = true
  bee.dest = pickDestination(scored, bee.band) ?? fallbackDest(bee.band, hive)
  bee.legSpeed = legSpeedFor(hive, bee.dest)
}

function stepTrip(bee: Bee, dtMs: number, hive: LatLon, scored: ScoredFeature[]): LatLon {
  bee.t += (bee.outbound ? 1 : -1) * bee.legSpeed * dtMs
  if (bee.t >= 1) {
    bee.t = 1
    bee.outbound = false
  } else if (bee.t <= 0) {
    bee.t = 0
    retarget(bee, hive, scored)
  }
  return lerpLatLon(hive, bee.dest, easeInOut(bee.t))
}

export function stepBee(bee: Bee, dtMs: number, hive: LatLon, scored: ScoredFeature[]): LatLon {
  if (bee.band === 'orientation') return stepLoop(bee, dtMs, hive)
  return stepTrip(bee, dtMs, hive, scored)
}
