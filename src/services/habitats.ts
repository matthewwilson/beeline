import { FORAGE } from '../data/forage'
import { makeFeature } from '../lib/features'
import { offsetLatLon, polygonCentroid, type GeoJSONGeometry } from '../lib/geo'
import { fetchJson } from './http'
import type { Feature, ForageKey, LatLon } from '../types'

// DAERA/NIEA Priority Habitats (OGL) — live ArcGIS FeatureServers, CORS-open, verified.
const HABITAT_BASE = 'https://services-eu1.arcgis.com/kswen6BYexuc1SUk/arcgis/rest/services'

const HABITAT_LAYERS: Array<{ name: string; key: ForageKey }> = [
  { name: 'PriorityHabitatsHeathland', key: 'heath' },
  { name: 'PriorityHabitatsGrassland', key: 'meadow' },
  { name: 'PriorityHabitatsPeatland', key: 'heath' },
  { name: 'PriorityHabitatsFens', key: 'meadow' },
  { name: 'PriorityHabitatsWoodland', key: 'wood' },
]

interface ArcGisFeature {
  geometry?: GeoJSONGeometry
  properties?: { Hab_Type?: string; Area_Hectares?: number }
}

// Surveyed polygons supplement OSM where coverage exists (given a confidence bonus in scoring).
export async function fetchHabitats(hive: LatLon): Promise<Feature[]> {
  const sw = offsetLatLon(hive, -5000, -5000)
  const ne = offsetLatLon(hive, 5000, 5000)
  const bbox = [sw.lon, sw.lat, ne.lon, ne.lat].join(',')
  const layerUrl = (name: string) =>
    `${HABITAT_BASE}/${name}/FeatureServer/0/query?geometry=${bbox}&geometryType=esriGeometryEnvelope&inSR=4326&spatialRel=esriSpatialRelIntersects&outFields=Hab_Type,Area_Hectares&returnGeometry=true&outSR=4326&f=geojson`

  const perLayer = HABITAT_LAYERS.map(async (layer) => {
    const gj = await fetchJson<{ features?: ArcGisFeature[] }>(layerUrl(layer.name), { timeoutMs: 15000 })
    if (!gj) return []
    const mapped: Feature[] = []
    for (const f of gj.features ?? []) {
      const c = polygonCentroid(f.geometry)
      if (!c) continue
      const props = f.properties ?? {}
      const pt = { lat: c[1], lon: c[0] }
      mapped.push(makeFeature(layer.key, props.Hab_Type ?? FORAGE[layer.key].label, pt, hive, 'surveyed', props.Area_Hectares ?? null))
    }
    return mapped
  })
  return (await Promise.all(perLayer)).flat()
}
