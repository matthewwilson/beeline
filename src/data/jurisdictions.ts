import boundaryData from './jurisdictionBoundaries.json'
import { distanceToGeometryMetres } from '../lib/geo'
import type { FeatureGeometry, Jurisdiction, LatLon } from '../types'

interface BoundaryRecord {
  jurisdiction: Exclude<Jurisdiction, 'unsupported'>
  geometry: FeatureGeometry
}

// Generated from geoBoundaries gbOpen GBR ADM1 and IRL ADM0 data, then simplified to
// roughly 100 m for client-side routing. See references/regional-data.md.
const BOUNDARIES = boundaryData as BoundaryRecord[]

export function jurisdictionAt(point: LatLon): Jurisdiction {
  return BOUNDARIES.find((boundary) => distanceToGeometryMetres(point, boundary.geometry) === 0)?.jurisdiction ?? 'unsupported'
}

export function jurisdictionsWithinRadius(point: LatLon, radiusMetres: number): Jurisdiction[] {
  if (jurisdictionAt(point) === 'unsupported') return ['unsupported']
  return BOUNDARIES.filter((boundary) => {
    const distance = distanceToGeometryMetres(point, boundary.geometry)
    return distance != null && distance <= radiusMetres
  }).map((boundary) => boundary.jurisdiction)
}
