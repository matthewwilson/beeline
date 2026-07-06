import { describe, expect, it } from 'vitest'
import { forageCalendar } from './calendar'
import type { Feature, ForageKey } from '../types'

function feature(key: ForageKey, distance: number): Feature {
  return { key, name: key, lat: 0, lon: 0, distance, dir: 'N', confidence: 'osm' }
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
      [feature('orchard', 100), feature('hedge', 100), feature('heath', 100), feature('meadow', 100)],
      6,
    )
    expect(result).not.toBeNull()
    if (!result) return
    expect(result.isGap).toBe(false)
    expect(result.suggestions).toHaveLength(0)
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
