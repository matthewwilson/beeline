import { CONFIDENCE_MULT, FORAGE } from '../data/forage'
import { MONTHS } from '../data/bloom'
import { GAP_PLANTS } from '../data/plants'
import { bloomFactorAtDoy } from './scoring'
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
): CalendarResult | null {
  if (!features.length) return null

  const weights = features.map(
    (f) => FORAGE[f.key].base * Math.exp(-f.distance / 1500) * (CONFIDENCE_MULT[f.confidence] ?? 1),
  )
  const monthly = MONTHS.map((_, m) => {
    const midDoy = Math.round((m + 0.5) * 30.4)
    let sum = 0
    features.forEach((f, i) => {
      sum += weights[i] * bloomFactorAtDoy(f.key, midDoy)
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
