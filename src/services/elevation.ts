import { fetchJson } from './http'
import type { LatLon } from '../types'

// Open-Meteo Elevation API (keyless, CORS `*`, same host as weather.ts). Backed by
// ~90 m Copernicus/SRTM data. Accepts up to 100 comma-separated coordinates per call,
// so we chunk larger grids and concatenate. Returns null if any chunk fails, letting
// the DCA model fall back to land-cover-only scoring.
const MAX_PER_REQUEST = 100

export async function fetchElevations(points: LatLon[]): Promise<number[] | null> {
  if (points.length === 0) return []
  const requests: Array<Promise<number[] | null>> = []
  for (let i = 0; i < points.length; i += MAX_PER_REQUEST) {
    requests.push(fetchChunk(points.slice(i, i + MAX_PER_REQUEST)))
  }
  const chunks = await Promise.all(requests)
  const goodChunks = chunks.filter((chunk): chunk is number[] => chunk !== null)
  if (goodChunks.length !== chunks.length) return null
  return goodChunks.flat()
}

async function fetchChunk(points: LatLon[]): Promise<number[] | null> {
  const lats = points.map((p) => p.lat.toFixed(5)).join(',')
  const lons = points.map((p) => p.lon.toFixed(5)).join(',')
  const url = `https://api.open-meteo.com/v1/elevation?latitude=${lats}&longitude=${lons}`
  const data = await fetchJson<{ elevation?: number[] }>(url, { timeoutMs: 15000 })
  const elevation = data?.elevation
  if (!elevation || elevation.length !== points.length) return null
  return elevation
}
