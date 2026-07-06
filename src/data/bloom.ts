import type { ForageKey, Season } from '../types'

// Manual season multipliers (used when the Season selector is not "auto").
export const SEASON: Record<Exclude<Season, 'auto'>, Partial<Record<ForageKey, number>>> = {
  spring: { orchard: 1.6, farmland: 1.3, heath: 0.4, garden: 1.1, hedge: 1.3, wood: 1.2 },
  summer: { meadow: 1.3, garden: 1.2, wood: 1.3, orchard: 0.6, farmland: 0.9, hedge: 1.2, scrub: 1.3 },
  late: { heath: 2.2, scrub: 1.3, orchard: 0.2, farmland: 0.5, wood: 0.8, hedge: 0.7, meadow: 0.9 },
}

// Approx NI bloom windows as day-of-year [start, peakStart, peakEnd, end] (see references/forage-values.md).
// Used in "auto" mode, shifted by a growing-degree-day anomaly so a warm year advances bloom.
export const BLOOM: Record<ForageKey, [number, number, number, number]> = {
  hedge: [75, 120, 215, 255],
  scrub: [130, 165, 245, 280],
  heath: [185, 210, 250, 275],
  meadow: [95, 160, 240, 285],
  farmland: [100, 115, 165, 200],
  orchard: [100, 118, 145, 165],
  wood: [85, 120, 200, 225],
  garden: [100, 150, 250, 292],
  park: [110, 150, 245, 288],
  allotments: [110, 150, 250, 288],
}

// Rough Northern Ireland lowland cumulative growing degree days (base 5C) by day-of-year,
// for a "season ahead/behind" estimate only.
export const GROWING_DEGREE_DAYS_BASELINE: Array<[number, number]> = [
  [1, 2],
  [31, 15],
  [59, 35],
  [90, 75],
  [120, 180],
  [151, 400],
  [181, 700],
  [212, 1000],
  [243, 1280],
  [273, 1470],
  [304, 1580],
  [334, 1640],
  [365, 1670],
]

export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
