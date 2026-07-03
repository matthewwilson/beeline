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
  const suggestions = isGap
    ? GAP_PLANTS.filter((p) => p.months.includes(gapMonth + 1))
        .slice(0, 5)
        .map((p) => p.name)
    : []

  return { monthly, peak, nowMonth, gapMonth, isGap, isJune, suggestions }
}
