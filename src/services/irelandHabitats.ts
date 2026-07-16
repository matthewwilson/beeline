import { makeFeature } from '../lib/features'
import { polygonCentroid } from '../lib/geo'
import { fetchArcGisFeatures, type GeoJsonRecord } from './arcGis'
import type { Feature, FeatureSourceKey, ForageKey, LatLon } from '../types'

const BASE = 'https://services-eu1.arcgis.com/Jhij7i46ouO8Cc0N/arcgis/rest/services'

interface IrishLayer {
  url: string
  fields: string[]
  source: FeatureSourceKey
  fixedKey?: ForageKey
}

const LAYERS: IrishLayer[] = [
  {
    url: `${BASE}/Article17HabitatDetailsTerrestrial2019/FeatureServer/2`,
    fields: ['Code', 'Hab_Name', 'Site_Name', 'Area_sq_m'],
    source: 'nationalParksWildlifeServiceArticle17',
  },
  {
    url: `${BASE}/NationalSurveyofNativeWoodlands2008/FeatureServer/4`,
    fields: ['F_Dom_Des', 'ITM_Area'],
    source: 'nationalParksWildlifeServiceNativeWoodland',
    fixedKey: 'wood',
  },
  {
    url: `${BASE}/IrishSemiNaturalGrasslandSurvey20072012HabitatPolygonsNPWS/FeatureServer/4`,
    fields: ['FOSS_DESC', 'MAP_HAB', 'ITM_Area'],
    source: 'nationalParksWildlifeServiceGrassland',
    fixedKey: 'meadow',
  },
]

export function irelandArticle17ForageKey(code: string, name: string): ForageKey | null {
  const normalisedCode = code.trim().toUpperCase()
  const numeric = Number.parseInt(normalisedCode, 10)
  const value = name.toLowerCase()
  if (/^9[12]/.test(normalisedCode)) return 'wood'
  if ((numeric >= 4000 && numeric < 4100) || (numeric >= 7100 && numeric < 7200) || /heath|bog|mire/.test(value)) return 'heath'
  if ((numeric >= 6100 && numeric < 6600) || /grassland|meadow|fen/.test(value)) return 'meadow'
  if ((numeric >= 5100 && numeric < 5200) || /scrub|juniper/.test(value)) return 'scrub'
  return null
}

function mapIrishRecord(record: GeoJsonRecord, layer: IrishLayer, hive: LatLon): Feature[] {
  const centroid = polygonCentroid(record.geometry)
  if (!centroid) return []
  const properties = record.properties ?? {}
  const name = String(properties.Hab_Name ?? properties.Site_Name ?? properties.F_Dom_Des ?? properties.FOSS_DESC ?? properties.MAP_HAB ?? 'NPWS habitat')
  const key = layer.fixedKey ?? irelandArticle17ForageKey(String(properties.Code ?? ''), name)
  if (!key) return []
  const squareMetres = Number(properties.Area_sq_m ?? properties.ITM_Area)
  return [
    makeFeature(key, name, { lat: centroid[1], lon: centroid[0] }, hive, layer.source, {
      area: squareMetres > 0 ? squareMetres / 10000 : null,
      geometry: record.geometry,
    }),
  ]
}

export async function fetchIrelandHabitats(hive: LatLon): Promise<Array<{ source: FeatureSourceKey; features: Feature[] | null }>> {
  return Promise.all(
    LAYERS.map(async (layer) => ({
      source: layer.source,
      features: (await fetchArcGisFeatures(layer.url, hive, layer.fields))?.flatMap((record) => mapIrishRecord(record, layer, hive)) ?? null,
    })),
  )
}
