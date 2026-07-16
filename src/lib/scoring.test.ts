import { describe, expect, it } from 'vitest'
import {
  areaFactor,
  baselineDayForGrowingDegreeDays,
  bloomFactorAtDoy,
  expectedGrowingDegreeDays,
  growingDegreeDaysOffsetDays,
  scoreOf,
  seasonFactor,
} from './scoring'
import { dayOfYear } from './geo'
import type { Confidence, Feature, FeatureSourceKey, ForageKey } from '../types'

const SOURCE_BY_CONFIDENCE: Record<Confidence, FeatureSourceKey> = {
  observed: 'userObservation',
  surveyed: 'daeraPriorityHabitats',
  openStreetMap: 'openStreetMap',
}

function feature(key: ForageKey, distance: number, confidence: Confidence): Feature {
  return { key, name: key, lat: 0, lon: 0, distance, dir: 'N', source: SOURCE_BY_CONFIDENCE[confidence] }
}

describe('bloomFactorAtDoy', () => {
  it('peaks inside the peak window and bottoms out off-season', () => {
    expect(bloomFactorAtDoy('orchard', 130)).toBe(1.25)
    expect(bloomFactorAtDoy('orchard', 90)).toBe(0.05)
    expect(bloomFactorAtDoy('orchard', 200)).toBe(0.05)
  })
  it('ramps linearly into peak', () => {
    expect(bloomFactorAtDoy('orchard', 109)).toBeCloseTo(0.575, 3)
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
  it('ranks confidence observed > surveyed > OpenStreetMap by the exact multipliers', () => {
    const ctx = { season: 'summer' as const, growingDegreeDaysOffsetDays: 0, growingDegreeDaysTotal: null, selectedPollen: null }
    const openStreetMap = scoreOf(feature('meadow', 500, 'openStreetMap'), ctx)
    const surveyed = scoreOf(feature('meadow', 500, 'surveyed'), ctx)
    const observed = scoreOf(feature('meadow', 500, 'observed'), ctx)
    expect(observed).toBeGreaterThan(surveyed)
    expect(surveyed).toBeGreaterThan(openStreetMap)
    expect(surveyed / openStreetMap).toBeCloseTo(1.25, 6)
    expect(observed / openStreetMap).toBeCloseTo(1.5, 6)
  })
  it('applies the pollen-mismatch penalty', () => {
    const base = { season: 'summer' as const, growingDegreeDaysOffsetDays: 0, growingDegreeDaysTotal: null }
    const f = feature('farmland', 500, 'openStreetMap')
    const unfiltered = scoreOf(f, { ...base, selectedPollen: null })
    const mismatched = scoreOf(f, { ...base, selectedPollen: 'grey' })
    expect(mismatched / unfiltered).toBeCloseTo(0.15, 6)
  })
  it('gives a larger habitat patch a modest lift, leaving area-less features unchanged', () => {
    const ctx = { season: 'summer' as const, growingDegreeDaysOffsetDays: 0, growingDegreeDaysTotal: null, selectedPollen: null }
    const noArea = scoreOf(feature('heath', 500, 'surveyed'), ctx)
    const big = scoreOf({ ...feature('heath', 500, 'surveyed'), area: 50 }, ctx)
    expect(big).toBeGreaterThan(noArea)
    expect(big / noArea).toBeCloseTo(areaFactor(50), 6)
  })
  it('uses plant-specific bloom windows on observed flowers', () => {
    const base = { key: 'scrub' as const, name: 'Ivy', lat: 0, lon: 0, distance: 100, dir: 'N', source: 'userObservation' as const }
    const ctx = { season: 'auto' as const, growingDegreeDaysOffsetDays: 275 - dayOfYear(), growingDegreeDaysTotal: null, selectedPollen: null }
    const ivy = scoreOf({ ...base, bloom: [240, 260, 300, 325], offSeasonFloor: 0.03 }, ctx)
    const scrub = scoreOf(base, ctx)
    expect(ivy).toBeGreaterThan(scrub)
  })
  it('discounts generic farmland without flowering crop evidence', () => {
    const ctx = { season: 'spring' as const, growingDegreeDaysOffsetDays: 0, growingDegreeDaysTotal: null, selectedPollen: null }
    const generic = scoreOf({ ...feature('farmland', 500, 'openStreetMap'), scoreMultiplier: 0.45 }, ctx)
    const crop = scoreOf(feature('farmland', 500, 'openStreetMap'), ctx)
    expect(generic / crop).toBeCloseTo(0.45, 6)
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

describe('expectedGrowingDegreeDays', () => {
  it('returns baseline endpoints and interpolates between them', () => {
    expect(expectedGrowingDegreeDays(1)).toBe(2)
    expect(expectedGrowingDegreeDays(365)).toBe(1670)
    expect(expectedGrowingDegreeDays(45)).toBeCloseTo(25, 6)
  })
  it('inverts cumulative GDD to a stable day offset', () => {
    expect(baselineDayForGrowingDegreeDays(400)).toBe(151)
    expect(growingDegreeDaysOffsetDays(400, 141)).toBe(10)
  })
})
