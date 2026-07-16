import { describe, expect, it } from 'vitest'
import { forageCalendar } from './calendar'
import { expectedGrowingDegreeDays } from './scoring'
import type { Feature, ForageKey } from '../types'

function feature(key: ForageKey, distance: number): Feature {
  return { key, name: key, lat: 0, lon: 0, distance, dir: 'N', source: 'openStreetMap' }
}

describe('forageCalendar', () => {
  it('returns null with no features', () => {
    expect(forageCalendar([])).toBeNull()
  })

  it('detects a June gap between spring blossom and late-summer heather', () => {
    const result = forageCalendar([feature('orchard', 100), feature('heath', 100)], 6)
    expect(result).not.toBeNull()
    if (!result) return
    expect(result.monthly).toHaveLength(12)
    expect(result.isGap).toBe(true)
    expect(result.gapMonth).toBe(5) // June (0-indexed)
    expect(result.isJune).toBe(true)
    expect(result.suggestions.length).toBeGreaterThan(0)
    // August (heather peak) is the strongest month.
    const argmax = result.monthly.indexOf(Math.max(...result.monthly))
    expect(argmax).toBe(7)
  })

  it('reports steady forage with no severe gap when sources cover the whole season', () => {
    const result = forageCalendar(
      [
        feature('orchard', 100),
        feature('hedge', 100),
        feature('heath', 100),
        feature('meadow', 100),
        { ...feature('garden', 100), bloom: [80, 105, 285, 315], offSeasonFloor: 0.35 },
      ],
      6,
    )
    expect(result).not.toBeNull()
    if (!result) return
    expect(result.isGap).toBe(false)
    expect(result.suggestions).toHaveLength(0)
  })

  it('uses area and score multipliers in the monthly weighting', () => {
    const plain = forageCalendar([feature('heath', 100)], 7)
    const large = forageCalendar([{ ...feature('heath', 100), area: 50, scoreMultiplier: 0.5 }], 7)
    expect(plain).not.toBeNull()
    expect(large).not.toBeNull()
    if (!plain || !large) return
    expect(large.peak).toBeLessThan(plain.peak)
  })

  it('shifts bloom timing with the local growing-degree-day baseline', () => {
    const normalCurve = Array.from({ length: 365 }, (_, day) => expectedGrowingDegreeDays(day + 1))
    const warmCurve = Array.from({ length: 365 }, (_, day) => expectedGrowingDegreeDays(Math.min(365, day + 26)))
    const normal = forageCalendar([feature('orchard', 100)], 3, normalCurve)
    const advanced = forageCalendar([feature('orchard', 100)], 3, warmCurve)
    expect(normal).not.toBeNull()
    expect(advanced).not.toBeNull()
    if (!normal || !advanced) return
    expect(advanced.monthly[3]).toBeGreaterThan(normal.monthly[3])
  })

  it('passes nowMonth through and normalises the peak across 12 months', () => {
    const result = forageCalendar([feature('heath', 200)], 2)
    expect(result).not.toBeNull()
    if (!result) return
    expect(result.nowMonth).toBe(2)
    expect(result.monthly).toHaveLength(12)
    expect(result.peak).toBe(Math.max(...result.monthly, 1))
  })

  it('draws gap-month planting suggestions only for the detected gap month', () => {
    const result = forageCalendar([feature('orchard', 100), feature('heath', 100)], 6)
    expect(result?.isGap).toBe(true)
    // Every suggestion should be a plant that flowers in the gap month (1-indexed).
    expect(result?.suggestions.length).toBeGreaterThan(0)
  })

  it('detects the later autumn dearth, distinct from the June gap, with ivy-type suggestions', () => {
    const result = forageCalendar([feature('orchard', 100), feature('heath', 100)], 6)
    expect(result).not.toBeNull()
    if (!result) return
    expect(result.isAutumnGap).toBe(true)
    expect(result.autumnGapMonth).not.toBe(result.gapMonth)
    expect(result.autumnGapMonth).toBeGreaterThanOrEqual(7) // Aug–Oct
    expect(result.autumnGapMonth).toBeLessThanOrEqual(9)
    expect(result.autumnSuggestions).toContain('Ivy')
  })
})
