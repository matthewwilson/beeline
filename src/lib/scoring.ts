import { CONFIDENCE_WEIGHTS, FORAGE } from '../data/forage'
import { BLOOM, GROWING_DEGREE_DAYS_BASELINE, OFF_SEASON_FLOOR, SEASON } from '../data/bloom'
import { POLLEN } from '../data/pollen'
import { clamp, dayOfYear } from './geo'
import type { BloomWindow, Feature, ForageKey, PollenKey, Season } from '../types'

// A larger habitat patch offers more forage, but with sharply diminishing returns — a
// saturating log bonus capped at ×1.4 so patch size nudges the ranking without ever
// overriding distance, bloom or confidence. Only surveyed polygons carry an area; OpenStreetMap
// and observed features (area undefined/0) score at ×1.
export function areaFactor(area?: number | null): number {
  if (!area || area <= 0) return 1
  return clamp(1 + 0.12 * Math.log10(1 + area), 1, 1.4)
}

export function bloomFactorForWindowAtDoy(window: BloomWindow, doy: number, floor: number): number {
  const [s, ps, pe, e] = window
  if (doy <= s || doy >= e) return floor
  if (doy < ps) return floor + ((1.1 - floor) * (doy - s)) / (ps - s)
  if (doy <= pe) return 1.25
  return floor + ((1.1 - floor) * (e - doy)) / (e - pe)
}

export function bloomFactorAtDoy(key: ForageKey, doy: number): number {
  const w = BLOOM[key]
  if (!w) return 1
  return bloomFactorForWindowAtDoy(w, doy, OFF_SEASON_FLOOR[key])
}

export function bloomFactor(key: ForageKey, growingDegreeDaysOffsetDays: number): number {
  return bloomFactorAtDoy(key, dayOfYear() + growingDegreeDaysOffsetDays)
}

export function seasonFactor(key: ForageKey, season: Season, growingDegreeDaysOffsetDays: number): number {
  if (season !== 'auto') return SEASON[season][key] ?? 1
  return bloomFactor(key, growingDegreeDaysOffsetDays)
}

export function featureSeasonFactor(feature: Feature, ctx: Pick<ScoreContext, 'season' | 'growingDegreeDaysOffsetDays'>): number {
  if (ctx.season !== 'auto') return SEASON[ctx.season][feature.key] ?? 1
  if (feature.bloom) {
    return bloomFactorForWindowAtDoy(
      feature.bloom,
      dayOfYear() + ctx.growingDegreeDaysOffsetDays,
      feature.offSeasonFloor ?? OFF_SEASON_FLOOR[feature.key],
    )
  }
  return bloomFactor(feature.key, ctx.growingDegreeDaysOffsetDays)
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
  let score =
    meta.base *
    featureSeasonFactor(f, ctx) *
    decay *
    confidence *
    areaFactor(f.area) *
    (f.scoreMultiplier ?? 1)
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

export function baselineDayForGrowingDegreeDays(total: number): number {
  const baseline = GROWING_DEGREE_DAYS_BASELINE
  if (total <= baseline[0][1]) return baseline[0][0]
  for (let i = 1; i < baseline.length; i++) {
    if (total <= baseline[i][1]) {
      const [d0, g0] = baseline[i - 1]
      const [d1, g1] = baseline[i]
      return d0 + ((d1 - d0) * (total - g0)) / (g1 - g0)
    }
  }
  return baseline[baseline.length - 1][0]
}

export function growingDegreeDaysOffsetDays(total: number, doy: number = dayOfYear()): number {
  return clamp(Math.round(baselineDayForGrowingDegreeDays(total) - doy), -25, 25)
}
