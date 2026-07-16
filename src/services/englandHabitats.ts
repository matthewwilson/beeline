import { makeFeature } from '../lib/features'
import { polygonCentroid } from '../lib/geo'
import { fetchArcGisFeatures } from './arcGis'
import type { Feature, ForageKey, LatLon } from '../types'

const LAYER = 'https://services.arcgis.com/JJzESW51TqeY9uat/arcgis/rest/services/Priority_Habitats_Inventory_England/FeatureServer/0'

const CODE_TO_FORAGE_KEY: Record<string, ForageKey> = {
  BLBOG: 'heath',
  CFPGM: 'meadow',
  DWOOD: 'wood',
  FHEAT: 'heath',
  GMOOR: 'meadow',
  GQSIG: 'meadow',
  LCGRA: 'meadow',
  LDAGR: 'meadow',
  LFENS: 'meadow',
  LHEAT: 'heath',
  LMEAD: 'meadow',
  LRBOG: 'heath',
  MHWSC: 'scrub',
  PMGRP: 'meadow',
  TORCH: 'orchard',
  UCGRA: 'meadow',
  UFFSW: 'meadow',
  UHEAT: 'heath',
  UHMEA: 'meadow',
}

export function englandForageKeys(codes: string): ForageKey[] {
  return [...new Set(codes.split(',').map((code) => CODE_TO_FORAGE_KEY[code.trim()]).filter((key) => key != null))]
}

export async function fetchEnglandHabitats(hive: LatLon): Promise<Feature[] | null> {
  const records = await fetchArcGisFeatures(LAYER, hive, ['MainHabs', 'HabCodes', 'AreaHa'])
  if (!records) return null
  return records.flatMap((record) => {
    const centroid = polygonCentroid(record.geometry)
    if (!centroid) return []
    const properties = record.properties ?? {}
    const keys = englandForageKeys(String(properties.HabCodes ?? ''))
    if (!keys.length) return []
    const point = { lat: centroid[1], lon: centroid[0] }
    return keys.map((key) =>
      makeFeature(key, String(properties.MainHabs ?? 'Priority habitat'), point, hive, 'naturalEnglandPriorityHabitats', {
        area: Number(properties.AreaHa) || null,
        geometry: record.geometry,
        scoreMultiplier: 1 / keys.length,
      }),
    )
  })
}
