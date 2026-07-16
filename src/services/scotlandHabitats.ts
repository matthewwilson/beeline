import { makeFeature } from '../lib/features'
import { polygonCentroid } from '../lib/geo'
import { fetchArcGisFeatures } from './arcGis'
import type { Feature, ForageKey, LatLon } from '../types'

const LAYER = 'https://services1.arcgis.com/LM9GyVFsughzHdbO/arcgis/rest/services/Habitat_Map_of_Scotland/FeatureServer/0'
const FORAGE_HABITATS =
  "HABITAT_CODE LIKE 'G%' OR HABITAT_CODE LIKE 'F3%' OR HABITAT_CODE LIKE 'F4%' OR HABITAT_CODE LIKE 'F5%' OR HABITAT_CODE LIKE 'D%' OR HABITAT_CODE LIKE 'E%' OR LOWER(HABITAT_NAME) LIKE '%woodland%'"

export function scotlandForageKey(code: string, name: string): ForageKey | null {
  const value = `${code} ${name}`.toLowerCase()
  if (/woodland|forest|^g[1-5]/.test(value)) return 'wood'
  if (/scrub|^f3|^f5/.test(value)) return 'scrub'
  if (/heath|bog|mire|peat|^d[1-5]|^f4/.test(value)) return 'heath'
  if (/grassland|grass|fen|^e[1-7]/.test(value)) return 'meadow'
  return null
}

export async function fetchScotlandHabitats(hive: LatLon): Promise<Feature[] | null> {
  const records = await fetchArcGisFeatures(
    LAYER,
    hive,
    ['HABITAT_CODE', 'HABITAT_NAME', 'COMPONENT_NAME', 'HAB_PROP', 'HAB_AREA'],
    FORAGE_HABITATS,
  )
  if (!records) return null
  return records.flatMap((record) => {
    const centroid = polygonCentroid(record.geometry)
    if (!centroid) return []
    const properties = record.properties ?? {}
    const name = String(properties.COMPONENT_NAME ?? properties.HABITAT_NAME ?? 'Mapped habitat')
    const key = scotlandForageKey(String(properties.HABITAT_CODE ?? ''), name)
    if (!key) return []
    return [
      makeFeature(key, name, { lat: centroid[1], lon: centroid[0] }, hive, 'natureScotHabitatMap', {
        area: Number(properties.HAB_AREA) || null,
        geometry: record.geometry,
        scoreMultiplier: Math.min(1, Math.max(0, Number(properties.HAB_PROP) || 1)),
      }),
    ]
  })
}
