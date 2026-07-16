import { offsetLatLon } from '../lib/geo'
import { fetchJson } from './http'
import { fetchHornetCount } from './nationalBiodiversityNetwork'
import type { Jurisdiction, LatLon } from '../types'

export interface HornetRecordResult {
  count: number
  provider: 'NBN Atlas' | 'NBDC via GBIF'
}

function circleWellKnownText(centre: LatLon, radiusMetres: number): string {
  const points = Array.from({ length: 33 }, (_, index) => {
    const angle = (2 * Math.PI * (index % 32)) / 32
    const point = offsetLatLon(centre, Math.sin(angle) * radiusMetres, Math.cos(angle) * radiusMetres)
    return `${point.lon.toFixed(5)} ${point.lat.toFixed(5)}`
  })
  return `POLYGON((${points.join(',')}))`
}

async function fetchIrelandHornetCount(hive: LatLon): Promise<number | null> {
  const params = new URLSearchParams({
    taxon_key: '1311477',
    institution_code: 'NBDC',
    has_coordinate: 'true',
    occurrence_status: 'present',
    geometry: circleWellKnownText(hive, 10000),
    limit: '0',
  })
  const data = await fetchJson<{ count?: number }>(`https://api.gbif.org/v1/occurrence/search?${params}`)
  return data?.count ?? null
}

export async function fetchHornetRecords(jurisdiction: Jurisdiction, hive: LatLon): Promise<HornetRecordResult | null> {
  if (jurisdiction === 'unsupported') return null
  if (jurisdiction === 'republicOfIreland') {
    const count = await fetchIrelandHornetCount(hive)
    return count === null ? null : { count, provider: 'NBDC via GBIF' }
  }
  const count = await fetchHornetCount(hive.lat, hive.lon)
  return count === null ? null : { count, provider: 'NBN Atlas' }
}
