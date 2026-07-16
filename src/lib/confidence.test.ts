import { describe, expect, it } from 'vitest'
import { confidenceContributions, confidenceDisplay } from './confidence'
import type { ScoredFeature } from '../types'

function scored(source: ScoredFeature['source'], score: number): ScoredFeature {
  return {
    key: 'meadow',
    name: source,
    lat: 0,
    lon: 0,
    distance: 100,
    dir: 'N',
    source,
    score,
  }
}

describe('confidenceDisplay', () => {
  it('describes feature confidence sources', () => {
    expect(confidenceDisplay('observed').label).toBe('Very high confidence')
    expect(confidenceDisplay('surveyed').detail).toContain('Authoritative')
    expect(confidenceDisplay('openStreetMap').shortLabel).toBe('OpenStreetMap')
  })
})

describe('confidenceContributions', () => {
  it('weights confidence by scored forage contribution', () => {
    expect(
      confidenceContributions([
        scored('openStreetMap', 20),
        scored('daeraPriorityHabitats', 30),
        scored('userObservation', 50),
      ]),
    ).toEqual([
      { confidence: 'observed', label: 'user observed', pct: 50 },
      { confidence: 'surveyed', label: 'surveyed', pct: 30 },
      { confidence: 'openStreetMap', label: 'OpenStreetMap', pct: 20 },
    ])
  })

  it('omits zero-score sources', () => {
    expect(confidenceContributions([scored('openStreetMap', 0), scored('daeraPriorityHabitats', 10)])).toEqual([
      { confidence: 'surveyed', label: 'surveyed', pct: 100 },
    ])
  })
})
