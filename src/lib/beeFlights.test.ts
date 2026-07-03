import { describe, expect, it } from 'vitest'
import { BANDS, candidatePool, createBees, pickDestination, stepBee } from './beeFlights'
import { distanceMetres } from './geo'
import type { ScoredFeature } from '../types'

const HIVE = { lat: 54.6, lon: -5.9 }

function scored(distance: number, score: number): ScoredFeature {
  const dest = { lat: HIVE.lat + distance / 111320, lon: HIVE.lon }
  return { key: 'meadow', name: 'meadow', dir: 'N', confidence: 'osm', score, ...dest, distance }
}

describe('candidatePool', () => {
  const patches = [scored(400, 9), scored(1800, 5), scored(4600, 3)]

  it('keeps foragers in the mid range', () => {
    expect(candidatePool(patches, 'forager')).toEqual([patches[1]])
  })
  it('sends scouts to the far range even when nearer patches score higher', () => {
    expect(candidatePool(patches, 'scout')).toEqual([patches[2]])
  })
  it('falls back to the farthest patches when nothing sits in the scout range', () => {
    const near = [scored(300, 9), scored(1200, 6)]
    expect(candidatePool(near, 'scout')[0]).toBe(near[1])
  })
})

describe('pickDestination', () => {
  it('returns null when there are no candidates', () => {
    expect(pickDestination([], 'forager')).toBeNull()
  })
  it('returns a jittered point near a real candidate', () => {
    const only = scored(1500, 5)
    const dest = pickDestination([only], 'forager')
    expect(dest).not.toBeNull()
    expect(distanceMetres(only, dest!)).toBeLessThan(300)
  })
})

describe('createBees', () => {
  it('spawns one bee per band slot', () => {
    const total = BANDS.reduce((sum, b) => sum + b.count, 0)
    expect(createBees([scored(2000, 5)], HIVE)).toHaveLength(total)
  })
  it('still spawns foragers when no forage is scored', () => {
    const bees = createBees([], HIVE)
    expect(bees.length).toBeGreaterThan(0)
    expect(bees.every((b) => Number.isFinite(b.dest.lat) && Number.isFinite(b.dest.lon))).toBe(true)
  })
})

describe('stepBee', () => {
  it('keeps orientation bees within their loop radius of the hive', () => {
    const bee = createBees([], HIVE).find((b) => b.band === 'orientation')!
    const p = stepBee(bee, 500, HIVE, [])
    expect(distanceMetres(HIVE, p)).toBeCloseTo(bee.loopRadius, 0)
  })
  it('turns a trip bee back once it reaches the destination', () => {
    const bee = createBees([scored(2000, 5)], HIVE).find((b) => b.band === 'forager')!
    bee.t = 0.99
    bee.outbound = true
    stepBee(bee, 1000, HIVE, [scored(2000, 5)])
    expect(bee.outbound).toBe(false)
  })
})
