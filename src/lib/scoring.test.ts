import { describe, expect, it } from 'vitest'
import { areaFactor, bloomFactorAtDoy, expectedGdd, scoreOf, seasonFactor } from './scoring'
import type { Feature, ForageKey } from '../types'

function feature(key: ForageKey, distance: number, confidence: Feature['confidence']): Feature {
  return { key, name: key, lat: 0, lon: 0, distance, dir: 'N', confidence }
}

describe('bloomFactorAtDoy', () => {
  it('peaks inside the peak window and bottoms out off-season', () => {
    expect(bloomFactorAtDoy('orchard', 130)).toBe(1.25)
    expect(bloomFactorAtDoy('orchard', 90)).toBe(0.25)
    expect(bloomFactorAtDoy('orchard', 200)).toBe(0.25)
  })
  it('ramps linearly into peak', () => {
    expect(bloomFactorAtDoy('orchard', 109)).toBeCloseTo(0.725, 3)
  })
})

describe('seasonFactor', () => {
  it('uses manual multipliers outside auto mode', () => {
    expect(seasonFactor('orchard', 'spring', 0)).toBe(1.6)
    expect(seasonFactor('heath', 'late', 0)).toBe(2.2)
  })
  it('defaults to 1 for a class not listed that season', () => {
    expect(seasonFactor('meadow', 'spring', 0)).toBe(1)
  })
})

describe('scoreOf', () => {
  it('ranks confidence observed > surveyed > osm by the exact multipliers', () => {
    const ctx = { season: 'summer' as const, gddOffsetDays: 0, selectedPollen: null }
    const osm = scoreOf(feature('meadow', 500, 'osm'), ctx)
    const surveyed = scoreOf(feature('meadow', 500, 'surveyed'), ctx)
    const observed = scoreOf(feature('meadow', 500, 'observed'), ctx)
    expect(observed).toBeGreaterThan(surveyed)
    expect(surveyed).toBeGreaterThan(osm)
    expect(surveyed / osm).toBeCloseTo(1.25, 6)
    expect(observed / osm).toBeCloseTo(1.5, 6)
  })
  it('applies the pollen-mismatch penalty', () => {
    const base = { season: 'summer' as const, gddOffsetDays: 0 }
    const f = feature('farmland', 500, 'osm')
    const unfiltered = scoreOf(f, { ...base, selectedPollen: null })
    const mismatched = scoreOf(f, { ...base, selectedPollen: 'grey' })
    expect(mismatched / unfiltered).toBeCloseTo(0.15, 6)
  })
  it('gives a larger habitat patch a modest lift, leaving area-less features unchanged', () => {
    const ctx = { season: 'summer' as const, gddOffsetDays: 0, selectedPollen: null }
    const noArea = scoreOf(feature('heath', 500, 'surveyed'), ctx)
    const big = scoreOf({ ...feature('heath', 500, 'surveyed'), area: 50 }, ctx)
    expect(big).toBeGreaterThan(noArea)
    expect(big / noArea).toBeCloseTo(areaFactor(50), 6)
  })
})

describe('areaFactor', () => {
  it('is 1 for missing, zero or negative area and grows with a hard ×1.4 cap', () => {
    expect(areaFactor(undefined)).toBe(1)
    expect(areaFactor(0)).toBe(1)
    expect(areaFactor(-5)).toBe(1)
    expect(areaFactor(10)).toBeGreaterThan(1)
    expect(areaFactor(1_000_000)).toBeLessThanOrEqual(1.4)
  })
})

describe('expectedGdd', () => {
  it('returns baseline endpoints and interpolates between them', () => {
    expect(expectedGdd(1)).toBe(2)
    expect(expectedGdd(365)).toBe(1670)
    expect(expectedGdd(45)).toBeCloseTo(25, 6)
  })
})
