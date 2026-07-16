import { offsetLatLon } from '../lib/geo'
import { fetchJson } from './http'
import type { FeatureGeometry, LatLon } from '../types'

export interface GeoJsonRecord {
  geometry?: FeatureGeometry
  properties?: Record<string, unknown>
}

const PAGE_SIZE = 2000
const MAX_FEATURES = 6000

export function queryEnvelope(hive: LatLon, radiusMetres = 5000): string {
  const southWest = offsetLatLon(hive, -radiusMetres, -radiusMetres)
  const northEast = offsetLatLon(hive, radiusMetres, radiusMetres)
  return [southWest.lon, southWest.lat, northEast.lon, northEast.lat].join(',')
}

export async function fetchArcGisFeatures(
  layerUrl: string,
  hive: LatLon,
  outFields: string[],
  where = '1=1',
): Promise<GeoJsonRecord[] | null> {
  const records: GeoJsonRecord[] = []
  for (let offset = 0; offset < MAX_FEATURES; offset += PAGE_SIZE) {
    const params = new URLSearchParams({
      geometry: queryEnvelope(hive),
      geometryType: 'esriGeometryEnvelope',
      inSR: '4326',
      spatialRel: 'esriSpatialRelIntersects',
      outFields: outFields.join(','),
      where,
      returnGeometry: 'true',
      outSR: '4326',
      geometryPrecision: '5',
      resultOffset: String(offset),
      resultRecordCount: String(PAGE_SIZE),
      f: 'geojson',
    })
    const page = await fetchJson<{ features?: GeoJsonRecord[] }>(`${layerUrl}/query?${params}`, { timeoutMs: 20000 })
    if (!page) return offset === 0 ? null : records
    const features = page.features ?? []
    records.push(...features)
    if (features.length < PAGE_SIZE) break
  }
  return records
}

export async function fetchWfsFeatures(typeName: string, hive: LatLon): Promise<GeoJsonRecord[] | null> {
  const records: GeoJsonRecord[] = []
  for (let offset = 0; offset < MAX_FEATURES; offset += PAGE_SIZE) {
    const params = new URLSearchParams({
      service: 'WFS',
      version: '2.0.0',
      request: 'GetFeature',
      typeNames: typeName,
      outputFormat: 'application/json',
      srsName: 'EPSG:4326',
      bbox: `${queryEnvelope(hive)},EPSG:4326`,
      count: String(PAGE_SIZE),
      startIndex: String(offset),
    })
    const page = await fetchJson<{ features?: GeoJsonRecord[] }>(`https://datamap.gov.wales/geoserver/ows?${params}`, {
      timeoutMs: 20000,
    })
    if (!page) return offset === 0 ? null : records
    const features = page.features ?? []
    records.push(...features)
    if (features.length < PAGE_SIZE) break
  }
  return records
}
