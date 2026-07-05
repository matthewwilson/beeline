import type { LatLon } from '../types'

// Open-Meteo Elevation API (keyless, CORS `*`, same host as weather.ts). Backed by
// ~90 m Copernicus/SRTM data. Accepts up to 100 comma-separated coordinates per call,
// so we chunk larger grids and concatenate. Returns null if any chunk fails, letting
// the DCA model fall back to land-cover-only scoring.
const MAX_PER_REQUEST = 100

export async function fetchElevations(points: LatLon[]): Promise<number[] | null> {
  if (points.length === 0) return []
  try {
    const chunks: number[][] = []
    for (let i = 0; i < points.length; i += MAX_PER_REQUEST) {
      chunks.push(await fetchChunk(points.slice(i, i + MAX_PER_REQUEST)))
    }
    return chunks.flat()
  } catch {
    return null
  }
}

async function fetchChunk(points: LatLon[]): Promise<number[]> {
  const lats = points.map((p) => p.lat.toFixed(5)).join(',')
  const lons = points.map((p) => p.lon.toFixed(5)).join(',')
  const url = `https://api.open-meteo.com/v1/elevation?latitude=${lats}&longitude=${lons}`
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) })
  if (!res.ok) throw new Error('status ' + res.status)
  const data = await res.json()
  const elevation = data.elevation as number[] | undefined
  if (!elevation || elevation.length !== points.length) throw new Error('bad elevation response')
  return elevation
}
