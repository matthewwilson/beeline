import { bearing, distanceMetres, nearestPointOnGeometry } from './geo'
import type { BloomWindow, Feature, FeatureGeometry, FeatureSourceKey, ForageKey, LatLon } from '../types'

export interface FeatureOptions {
  area?: number | null
  geometry?: FeatureGeometry
  bloom?: BloomWindow
  offSeasonFloor?: number
  scoreMultiplier?: number
}

/**
 * Build a forage Feature at a point, filling in its distance and compass bearing from the
 * hive. Shared by the OpenStreetMap, habitat and observed-flower sources so the distance/dir mapping
 * lives in one place. Pass `area` only for surveyed habitat polygons.
 */
export function makeFeature(
  key: ForageKey,
  name: string,
  pt: LatLon,
  hive: LatLon,
  source: FeatureSourceKey,
  options: FeatureOptions | number | null = {},
): Feature {
  const opts: FeatureOptions = typeof options === 'number' || options === null ? { area: options } : options
  const distancePoint = nearestPointOnGeometry(hive, opts.geometry) ?? pt
  const feature: Feature = {
    key,
    name,
    lat: pt.lat,
    lon: pt.lon,
    distance: distanceMetres(hive, distancePoint),
    dir: bearing(hive, distancePoint),
    source,
  }
  if (opts.area !== undefined) feature.area = opts.area
  if (opts.geometry) feature.geometry = opts.geometry
  if (opts.bloom) feature.bloom = opts.bloom
  if (opts.offSeasonFloor !== undefined) feature.offSeasonFloor = opts.offSeasonFloor
  if (opts.scoreMultiplier !== undefined) feature.scoreMultiplier = opts.scoreMultiplier
  return feature
}
