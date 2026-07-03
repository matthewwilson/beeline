import { FORAGE } from '../data/forage'
import { bearing, distanceMetres, polygonCentroid, type GeoJSONGeometry } from '../lib/geo'
import type { Feature, ForageKey, LatLon } from '../types'

// DAERA/NIEA Priority Habitats (OGL) — live ArcGIS FeatureServers, CORS-open, verified.
export const HABITAT_BASE = 'https://services-eu1.arcgis.com/kswen6BYexuc1SUk/arcgis/rest/services'

export const HABITAT_LAYERS: Array<{ name: string; key: ForageKey }> = [
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
  const dLat = 5000 / 111000
  const dLon = 5000 / (111000 * Math.cos((hive.lat * Math.PI) / 180))
  const bbox = [hive.lon - dLon, hive.lat - dLat, hive.lon + dLon, hive.lat + dLat].join(',')
  const layerUrl = (name: string) =>
    `${HABITAT_BASE}/${name}/FeatureServer/0/query?geometry=${bbox}&geometryType=esriGeometryEnvelope&inSR=4326&spatialRel=esriSpatialRelIntersects&outFields=Hab_Type,Area_Hectares&returnGeometry=true&outSR=4326&f=geojson`

  const perLayer = HABITAT_LAYERS.map(async (layer) => {
    try {
      const res = await fetch(layerUrl(layer.name), { signal: AbortSignal.timeout(15000) })
      if (!res.ok) return []
      const gj = await res.json()
      const features: ArcGisFeature[] = gj.features ?? []
      const mapped: Feature[] = []
      for (const f of features) {
        const c = polygonCentroid(f.geometry)
        if (!c) continue
        const props = f.properties ?? {}
        const pt = { lat: c[1], lon: c[0] }
        mapped.push({
          key: layer.key,
          name: props.Hab_Type ?? FORAGE[layer.key].label,
          lat: pt.lat,
          lon: pt.lon,
          area: props.Area_Hectares ?? null,
          distance: distanceMetres(hive, pt),
          dir: bearing(hive, pt),
          confidence: 'surveyed',
        })
      }
      return mapped
    } catch {
      return []
    }
  })
  return (await Promise.all(perLayer)).flat()
}
