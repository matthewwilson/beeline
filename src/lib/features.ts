import { bearing, distanceMetres } from './geo'
import type { Confidence, Feature, ForageKey, LatLon } from '../types'

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
  confidence: Confidence,
  area?: number | null,
): Feature {
  const feature: Feature = {
    key,
    name,
    lat: pt.lat,
    lon: pt.lon,
    distance: distanceMetres(hive, pt),
    dir: bearing(hive, pt),
    confidence,
  }
  if (area !== undefined) feature.area = area
  return feature
}
