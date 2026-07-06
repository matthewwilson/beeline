import type { FeatureGeometry, LatLon } from '../types'

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

const METRES_PER_DEGREE_LATITUDE = 111320

export function offsetLatLon(origin: LatLon, eastMetres: number, northMetres: number): LatLon {
  const dLat = northMetres / METRES_PER_DEGREE_LATITUDE
  const dLon = eastMetres / (METRES_PER_DEGREE_LATITUDE * Math.cos((origin.lat * Math.PI) / 180))
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

export function polygonCentroid(geom: FeatureGeometry | null | undefined): [number, number] | null {
  if (!geom) return null
  let ring: number[][] | undefined
  if (geom.type === 'Polygon') ring = (geom.coordinates as number[][][])[0]
  else if (geom.type === 'MultiPolygon') ring = (geom.coordinates as number[][][][])[0]?.[0]
  else return null
  if (!ring || !ring.length) return null
  const last = ring[ring.length - 1]
  const usable = ring.length > 1 && last[0] === ring[0][0] && last[1] === ring[0][1] ? ring.slice(0, -1) : ring
  let x = 0
  let y = 0
  for (const p of usable) {
    x += p[0]
    y += p[1]
  }
  return [x / usable.length, y / usable.length]
}

function toLocal(origin: LatLon, coord: number[]): { x: number; y: number } {
  return {
    x: (coord[0] - origin.lon) * METRES_PER_DEGREE_LATITUDE * Math.cos((origin.lat * Math.PI) / 180),
    y: (coord[1] - origin.lat) * METRES_PER_DEGREE_LATITUDE,
  }
}

function fromLocal(origin: LatLon, p: { x: number; y: number }): LatLon {
  return offsetLatLon(origin, p.x, p.y)
}

function pointInRing(origin: LatLon, ring: number[][]): boolean {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i]
    const b = ring[j]
    const intersects =
      a[1] > origin.lat !== b[1] > origin.lat &&
      origin.lon < ((b[0] - a[0]) * (origin.lat - a[1])) / (b[1] - a[1] || Number.EPSILON) + a[0]
    if (intersects) inside = !inside
  }
  return inside
}

function closestOnSegment(origin: LatLon, a: number[], b: number[]): { point: LatLon; distance: number } {
  const av = toLocal(origin, a)
  const bv = toLocal(origin, b)
  const dx = bv.x - av.x
  const dy = bv.y - av.y
  const lenSq = dx * dx + dy * dy
  const t = lenSq === 0 ? 0 : clamp(-(av.x * dx + av.y * dy) / lenSq, 0, 1)
  const local = { x: av.x + t * dx, y: av.y + t * dy }
  return { point: fromLocal(origin, local), distance: Math.sqrt(local.x * local.x + local.y * local.y) }
}

function closestOnPath(origin: LatLon, path: number[][]): { point: LatLon; distance: number } | null {
  if (path.length === 0) return null
  if (path.length === 1) {
    const point = { lat: path[0][1], lon: path[0][0] }
    return { point, distance: distanceMetres(origin, point) }
  }
  let best: { point: LatLon; distance: number } | null = null
  for (let i = 1; i < path.length; i++) {
    const c = closestOnSegment(origin, path[i - 1], path[i])
    if (!best || c.distance < best.distance) best = c
  }
  return best
}

function closestOnPolygon(origin: LatLon, rings: number[][][]): { point: LatLon; distance: number } | null {
  const outer = rings[0]
  if (!outer?.length) return null
  if (pointInRing(origin, outer) && rings.slice(1).every((hole) => !pointInRing(origin, hole))) {
    return { point: origin, distance: 0 }
  }
  let best: { point: LatLon; distance: number } | null = null
  for (const ring of rings) {
    const c = closestOnPath(origin, ring)
    if (c && (!best || c.distance < best.distance)) best = c
  }
  return best
}

export function nearestPointOnGeometry(origin: LatLon, geom: FeatureGeometry | null | undefined): LatLon | null {
  if (!geom) return null
  if (geom.type === 'Point') return { lat: geom.coordinates[1], lon: geom.coordinates[0] }
  if (geom.type === 'LineString') return closestOnPath(origin, geom.coordinates)?.point ?? null
  if (geom.type === 'Polygon') return closestOnPolygon(origin, geom.coordinates)?.point ?? null
  let best: { point: LatLon; distance: number } | null = null
  for (const polygon of geom.coordinates) {
    const c = closestOnPolygon(origin, polygon)
    if (c && (!best || c.distance < best.distance)) best = c
  }
  return best?.point ?? null
}

export function distanceToGeometryMetres(origin: LatLon, geom: FeatureGeometry | null | undefined): number | null {
  const nearest = nearestPointOnGeometry(origin, geom)
  return nearest ? distanceMetres(origin, nearest) : null
}

export function dayOfYear(date: Date = new Date()): number {
  const start = new Date(date.getFullYear(), 0, 0)
  return Math.floor((date.getTime() - start.getTime()) / 86400000)
}

export const clamp = (v: number, a: number, b: number): number => Math.max(a, Math.min(b, v))

export function formatDistance(metres: number): string {
  return metres < 1000 ? `${Math.round(metres)} m` : `${(metres / 1000).toFixed(1)} km`
}

export function escapeMarkup(s: unknown): string {
  const map: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }
  return String(s).replace(/[&<>"]/g, (c) => map[c])
}
