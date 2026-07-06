import { describe, expect, it } from 'vitest'
import { overpassToFeatures } from './overpass'
import type { OverpassElement } from './overpass'

const hive = { lat: 54.6, lon: -5.9 }

describe('overpassToFeatures', () => {
  it('keeps way geometry for distance scoring', () => {
    const elements: OverpassElement[] = [
      {
        tags: { landuse: 'meadow', name: 'Long meadow' },
        geometry: [
          { lat: 54.59, lon: -5.91 },
          { lat: 54.59, lon: -5.89 },
          { lat: 54.61, lon: -5.89 },
          { lat: 54.61, lon: -5.91 },
          { lat: 54.59, lon: -5.91 },
        ],
      },
    ]
    const [feature] = overpassToFeatures(elements, hive)
    expect(feature.geometry?.type).toBe('Polygon')
    expect(feature.distance).toBe(0)
  })

  it('keeps open way geometry as a line and derives a display point when no centre is present', () => {
    const elements: OverpassElement[] = [
      {
        tags: { barrier: 'hedge' },
        geometry: [
          { lat: 54.6, lon: -5.91 },
          { lat: 54.6, lon: -5.89 },
        ],
      },
    ]
    const [feature] = overpassToFeatures(elements, hive)
    expect(feature.key).toBe('hedge')
    expect(feature.geometry?.type).toBe('LineString')
    expect(feature.lat).toBeCloseTo(54.6, 5)
    expect(feature.lon).toBeCloseTo(-5.9, 5)
    expect(feature.distance).toBe(0)
  })

  it('drops recognised tags that have neither centre nor geometry', () => {
    expect(overpassToFeatures([{ tags: { landuse: 'meadow' } }], hive)).toEqual([])
  })

  it('discounts generic farmland but not flowering crop evidence', () => {
    const generic = overpassToFeatures(
      [{ center: hive, tags: { landuse: 'farmland' }, geometry: [{ lat: hive.lat, lon: hive.lon }] }],
      hive,
    )[0]
    const flowering = overpassToFeatures(
      [{ center: hive, tags: { landuse: 'farmland', crop: 'rapeseed' }, geometry: [{ lat: hive.lat, lon: hive.lon }] }],
      hive,
    )[0]
    expect(generic.scoreMultiplier).toBe(0.45)
    expect(flowering.scoreMultiplier).toBeUndefined()
  })

  it('treats beans and clover tags as flowering crop evidence', () => {
    const [beans] = overpassToFeatures(
      [{ center: hive, tags: { landuse: 'farmland', crop: 'field_beans' }, geometry: [{ lat: hive.lat, lon: hive.lon }] }],
      hive,
    )
    const [clover] = overpassToFeatures(
      [{ center: hive, tags: { landuse: 'farmland', crop: 'clover ley' }, geometry: [{ lat: hive.lat, lon: hive.lon }] }],
      hive,
    )
    expect(beans.scoreMultiplier).toBeUndefined()
    expect(clover.scoreMultiplier).toBeUndefined()
  })
})
