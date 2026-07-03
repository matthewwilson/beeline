import { FORAGE, TAG_TO_KEY } from '../data/forage'
import { bearing, distanceMetres } from '../lib/geo'
import type { Feature, LatLon } from '../types'

// Overpass mirrors are raced in parallel (Promise.any) — availability/latency varies a lot.
export const OVERPASS = [
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass-api.de/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
]

export interface OverpassElement {
  center?: { lat: number; lon: number }
  tags?: Record<string, string>
}

export function buildQuery(lat: number, lon: number): string {
  return `[out:json][timeout:25];
(
  way["landuse"~"orchard|meadow|farmland|allotments|forest|heath"](around:5000,${lat},${lon});
  way["leisure"~"garden|park"](around:5000,${lat},${lon});
  way["natural"~"heath|scrub|wood|tree_row"](around:5000,${lat},${lon});
  way["barrier"="hedge"](around:5000,${lat},${lon});
);
out center tags;`
}

export async function fetchOverpass(lat: number, lon: number): Promise<OverpassElement[] | null> {
  const query = buildQuery(lat, lon)
  const attempt = (endpoint: string) =>
    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'data=' + encodeURIComponent(query),
      signal: AbortSignal.timeout(30000),
    }).then(async (res) => {
      if (!res.ok) throw new Error('status ' + res.status)
      const json = await res.json()
      return (json.elements ?? []) as OverpassElement[]
    })
  try {
    return await Promise.any(OVERPASS.map(attempt))
  } catch {
    return null
  }
}

export function overpassToFeatures(elements: OverpassElement[], hive: LatLon): Feature[] {
  const out: Feature[] = []
  for (const el of elements) {
    const center = el.center
    const tags = el.tags ?? {}
    const rawVal = tags.landuse ?? tags.natural ?? tags.leisure ?? tags.barrier
    const key = rawVal ? TAG_TO_KEY[rawVal] : undefined
    if (!key || !center || center.lat == null) continue
    const pt = { lat: center.lat, lon: center.lon }
    out.push({
      key,
      name: tags.name ?? FORAGE[key].label,
      lat: pt.lat,
      lon: pt.lon,
      distance: distanceMetres(hive, pt),
      dir: bearing(hive, pt),
      confidence: 'osm',
    })
  }
  return out
}
