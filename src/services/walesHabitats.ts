import { makeFeature } from '../lib/features'
import { polygonCentroid } from '../lib/geo'
import { fetchWfsFeatures } from './arcGis'
import type { Feature, ForageKey, LatLon } from '../types'

export function walesForageKey(code: string): ForageKey | null {
  const normalised = code.toUpperCase()
  if (/^A1/.test(normalised)) return 'wood'
  if (/^A2|^C1/.test(normalised)) return 'scrub'
  if (/^B[1-3]|^B5|^E[2-5]/.test(normalised)) return 'meadow'
  if (/^D[1-6]|^E1/.test(normalised)) return 'heath'
  if (/^J1/.test(normalised)) return 'farmland'
  if (/^J2/.test(normalised)) return 'park'
  return null
}

export async function fetchWalesHabitats(hive: LatLon): Promise<Feature[] | null> {
  const records = await fetchWfsFeatures('geonode:nrw_phase1_vegetation_voronoi', hive)
  if (!records) return null
  return records.flatMap((record) => {
    const centroid = polygonCentroid(record.geometry)
    if (!centroid) return []
    const properties = record.properties ?? {}
    const code = String(properties.phase1_code ?? properties.label ?? '')
    const key = walesForageKey(code)
    if (!key) return []
    return [
      makeFeature(key, `Phase 1 habitat ${code}`, { lat: centroid[1], lon: centroid[0] }, hive, 'naturalResourcesWalesPhaseOne', {
        area: Number(properties.area_ha) || null,
        geometry: record.geometry,
      }),
    ]
  })
}
