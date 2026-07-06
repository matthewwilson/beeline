import { CONFIDENCE_WEIGHTS, FORAGE } from '../data/forage'
import { BLOOM, GROWING_DEGREE_DAYS_BASELINE, SEASON } from '../data/bloom'
import { POLLEN } from '../data/pollen'
import { clamp, dayOfYear } from './geo'
import type { Feature, ForageKey, PollenKey, Season } from '../types'

// A larger habitat patch offers more forage, but with sharply diminishing returns — a
// saturating log bonus capped at ×1.4 so patch size nudges the ranking without ever
// overriding distance, bloom or confidence. Only surveyed polygons carry an area; OpenStreetMap
// and observed features (area undefined/0) score at ×1.
export function areaFactor(area?: number | null): number {
  if (!area || area <= 0) return 1
  return clamp(1 + 0.12 * Math.log10(1 + area), 1, 1.4)
}

export function bloomFactorAtDoy(key: ForageKey, doy: number): number {
  const w = BLOOM[key]
  if (!w) return 1
  const [s, ps, pe, e] = w
  if (doy <= s || doy >= e) return 0.25
  if (doy < ps) return 0.35 + (0.75 * (doy - s)) / (ps - s)
  if (doy <= pe) return 1.25
  return 0.35 + (0.75 * (e - doy)) / (e - pe)
}

export function bloomFactor(key: ForageKey, growingDegreeDaysOffsetDays: number): number {
  return bloomFactorAtDoy(key, dayOfYear() + growingDegreeDaysOffsetDays)
}

export function seasonFactor(key: ForageKey, season: Season, growingDegreeDaysOffsetDays: number): number {
  if (season !== 'auto') return SEASON[season][key] ?? 1
  return bloomFactor(key, growingDegreeDaysOffsetDays)
}

export interface ScoreContext {
  season: Season
  growingDegreeDaysOffsetDays: number
  selectedPollen: PollenKey | null
}

export function scoreOf(f: Feature, ctx: ScoreContext): number {
  const meta = FORAGE[f.key]
  const decay = Math.exp(-f.distance / 1500)
  const confidence = CONFIDENCE_WEIGHTS[f.confidence] ?? 1
  let score = meta.base * seasonFactor(f.key, ctx.season, ctx.growingDegreeDaysOffsetDays) * decay * confidence * areaFactor(f.area)
  if (ctx.selectedPollen && !POLLEN[ctx.selectedPollen].keys.includes(f.key)) score *= 0.15
  return score
}

// Rough Northern Ireland lowland cumulative growing degree days (base 5C) expected by a
// given day-of-year, interpolated from the baseline curve.
export function expectedGrowingDegreeDays(doy: number): number {
  const baseline = GROWING_DEGREE_DAYS_BASELINE
  if (doy <= baseline[0][0]) return baseline[0][1]
  for (let i = 1; i < baseline.length; i++) {
    if (doy <= baseline[i][0]) {
      const [d0, g0] = baseline[i - 1]
      const [d1, g1] = baseline[i]
      return g0 + ((g1 - g0) * (doy - d0)) / (d1 - d0)
    }
  }
  return baseline[baseline.length - 1][1]
}
