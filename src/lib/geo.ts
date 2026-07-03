import type { LatLon } from '../types'

export function distanceMetres(a: LatLon, b: LatLon): number {
  const R = 6371000
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLon = toRad(b.lon - a.lon)
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
}

const METRES_PER_DEG_LAT = 111320

export function offsetLatLon(origin: LatLon, eastMetres: number, northMetres: number): LatLon {
  const dLat = northMetres / METRES_PER_DEG_LAT
  const dLon = eastMetres / (METRES_PER_DEG_LAT * Math.cos((origin.lat * Math.PI) / 180))
  return { lat: origin.lat + dLat, lon: origin.lon + dLon }
}

const COMPASS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']

export function bearing(a: LatLon, b: LatLon): string {
  const toRad = (d: number) => (d * Math.PI) / 180
  const y = Math.sin(toRad(b.lon - a.lon)) * Math.cos(toRad(b.lat))
  const x =
    Math.cos(toRad(a.lat)) * Math.sin(toRad(b.lat)) -
    Math.sin(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.cos(toRad(b.lon - a.lon))
  const deg = ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360
  return COMPASS[Math.round(deg / 45) % 8]
}

export interface GeoJSONGeometry {
  type: string
  coordinates: number[][][] | number[][][][]
}

export function polygonCentroid(geom: GeoJSONGeometry | null | undefined): [number, number] | null {
  if (!geom) return null
  let ring: number[][] | undefined
  if (geom.type === 'Polygon') ring = (geom.coordinates as number[][][])[0]
  else if (geom.type === 'MultiPolygon') ring = (geom.coordinates as number[][][][])[0]?.[0]
  else return null
  if (!ring || !ring.length) return null
  let x = 0
  let y = 0
  for (const p of ring) {
    x += p[0]
    y += p[1]
  }
  return [x / ring.length, y / ring.length]
}

export function dayOfYear(date: Date = new Date()): number {
  const start = new Date(date.getFullYear(), 0, 0)
  return Math.floor((date.getTime() - start.getTime()) / 86400000)
}

export const clamp = (v: number, a: number, b: number): number => Math.max(a, Math.min(b, v))

export function fmtDist(m: number): string {
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`
}

export function escapeHtml(s: unknown): string {
  const map: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }
  return String(s).replace(/[&<>"]/g, (c) => map[c])
}
