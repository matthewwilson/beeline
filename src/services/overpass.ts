import { FORAGE, TAG_TO_FORAGE_KEY } from '../data/forage'
import { makeFeature } from '../lib/features'
import type { Feature, LatLon } from '../types'

// Overpass mirrors are raced in parallel (Promise.any) — availability/latency varies a lot.
const OVERPASS = [
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass-api.de/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
]

export interface OverpassElement {
  center?: { lat: number; lon: number }
  tags?: Record<string, string>
}

function buildQuery(lat: number, lon: number): string {
  return `[out:json][timeout:25];
(
  way["landuse"~"orchard|meadow|farmland|allotments|forest|heath"](around:5000,${lat},${lon});
  way["leisure"~"garden|park"](around:5000,${lat},${lon});
  way["natural"~"heath|scrub|wood|tree_row"](around:5000,${lat},${lon});
  way["barrier"="hedge"](around:5000,${lat},${lon});
);
out center tags;`
}

// Races the mirrors; each attempt rejects on a bad response so Promise.any keeps the first
// mirror that actually works. Returns null only if every mirror fails.
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
    const key = rawVal ? TAG_TO_FORAGE_KEY[rawVal] : undefined
    if (!key || !center || center.lat == null) continue
    const pt = { lat: center.lat, lon: center.lon }
    out.push(makeFeature(key, tags.name ?? FORAGE[key].label, pt, hive, 'openStreetMap'))
  }
  return out
}
