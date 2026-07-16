import { CONFIDENCE_WEIGHTS, FORAGE } from '../data/forage'
import { BLOOM, MONTHS, OFF_SEASON_FLOOR } from '../data/bloom'
import { GAP_PLANTS } from '../data/plants'
import { confidenceForSource } from '../data/sources'
import { areaFactor, bloomFactorAtDoy, bloomFactorForWindowAtDoy, bloomFactorForWindowAtGrowingDegreeDays } from './scoring'
import type { Feature } from '../types'

export interface CalendarResult {
  monthly: number[]
  peak: number
  nowMonth: number
  gapMonth: number
  isGap: boolean
  isJune: boolean
  suggestions: string[]
  autumnGapMonth: number
  isAutumnGap: boolean
  autumnSuggestions: string[]
}

// Gap-filling suggestions that flower in a given month (0-indexed), capped at five names.
function gapSuggestions(monthIndex: number): string[] {
  return GAP_PLANTS.filter((p) => p.months.includes(monthIndex + 1))
    .slice(0, 5)
    .map((p) => p.name)
}

// Year-round relative forage-availability curve for a hive's nearby sources, plus a June-gap
// detector. Weights each source by base value, distance decay and confidence, then spreads it
// across the year by each class's bloom window.
export function forageCalendar(
  features: Feature[],
  nowMonth: number = new Date().getMonth(),
  meanCumulativeGrowingDegreeDaysByDay: number[] | null = null,
): CalendarResult | null {
  if (!features.length) return null

  const weights = features.map(
    (f) =>
      FORAGE[f.key].base *
      Math.exp(-f.distance / 1500) *
      CONFIDENCE_WEIGHTS[confidenceForSource(f.source)] *
      areaFactor(f.area) *
      (f.scoreMultiplier ?? 1),
  )
  const monthly = MONTHS.map((_, m) => {
    const midDoy = Math.round((m + 0.5) * 30.4)
    const meanGrowingDegreeDays = meanCumulativeGrowingDegreeDaysByDay?.[Math.min(364, Math.max(0, midDoy - 1))]
    let sum = 0
    features.forEach((f, i) => {
      const floor = f.offSeasonFloor ?? OFF_SEASON_FLOOR[f.key]
      const bloomFactor = meanGrowingDegreeDays != null
        ? bloomFactorForWindowAtGrowingDegreeDays(f.bloom ?? BLOOM[f.key], meanGrowingDegreeDays, floor)
        : f.bloom
          ? bloomFactorForWindowAtDoy(f.bloom, midDoy, floor)
          : bloomFactorAtDoy(f.key, midDoy)
      sum += weights[i] * bloomFactor
    })
    return sum
  })

  const peak = Math.max(...monthly, 1)
  // Lowest month within the active foraging season (Apr–Sep, indices 3..8).
  let gapMonth = 3
  for (let m = 3; m <= 8; m++) if (monthly[m] < monthly[gapMonth]) gapMonth = m
  const isGap = monthly[gapMonth] / peak < 0.5
  const isJune = gapMonth >= 4 && gapMonth <= 6
  const suggestions = isGap ? gapSuggestions(gapMonth) : []

  // The later autumn dearth: the lowest late-season month (Aug–Oct, indices 7..9), reported
  // separately from the primary gap so an early-summer gap and an autumn one can both surface.
  let autumnGapMonth = 7
  for (let m = 7; m <= 9; m++) if (monthly[m] < monthly[autumnGapMonth]) autumnGapMonth = m
  const isAutumnGap = autumnGapMonth !== gapMonth && monthly[autumnGapMonth] / peak < 0.5
  const autumnSuggestions = isAutumnGap ? gapSuggestions(autumnGapMonth) : []

  return {
    monthly,
    peak,
    nowMonth,
    gapMonth,
    isGap,
    isJune,
    suggestions,
    autumnGapMonth,
    isAutumnGap,
    autumnSuggestions,
  }
}
