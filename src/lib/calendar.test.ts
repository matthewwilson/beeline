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
})
