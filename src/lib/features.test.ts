import { describe, expect, it } from 'vitest'
import { makeFeature } from './features'

const hive = { lat: 54.6, lon: -5.9 }

describe('makeFeature', () => {
  it('fills distance and compass bearing from the hive', () => {
    const f = makeFeature('meadow', 'Meadow', { lat: 54.61, lon: -5.9 }, hive, 'openStreetMap')
    expect(f.key).toBe('meadow')
    expect(f.name).toBe('Meadow')
    expect(f.confidence).toBe('openStreetMap')
    expect(f.distance).toBeGreaterThan(0)
    expect(f.dir).toBe('N') // due north of the hive
  })

  it('omits area unless it is passed', () => {
    const f = makeFeature('wood', 'Wood', hive, hive, 'openStreetMap')
    expect('area' in f).toBe(false)
  })

  it('includes area (including null) when provided for surveyed habitats', () => {
    expect(makeFeature('wood', 'Wood', hive, hive, 'surveyed', 12).area).toBe(12)
    expect(makeFeature('wood', 'Wood', hive, hive, 'surveyed', null).area).toBeNull()
  })
})
