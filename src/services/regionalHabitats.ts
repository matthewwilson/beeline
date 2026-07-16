import { fetchNorthernIrelandHabitats } from './habitats'
import { fetchEnglandHabitats } from './englandHabitats'
import { fetchIrelandHabitats } from './irelandHabitats'
import { fetchScotlandHabitats } from './scotlandHabitats'
import { fetchWalesHabitats } from './walesHabitats'
import type { Feature, FeatureSourceKey, Jurisdiction, LatLon } from '../types'

export interface HabitatFetchResult {
  features: Feature[]
  successfulSources: FeatureSourceKey[]
  failedSources: FeatureSourceKey[]
}

interface SourceResult {
  source: FeatureSourceKey
  features: Feature[] | null
}

async function fetchJurisdiction(jurisdiction: Jurisdiction, hive: LatLon): Promise<SourceResult[]> {
  if (jurisdiction === 'northernIreland') {
    return [{ source: 'daeraPriorityHabitats', features: await fetchNorthernIrelandHabitats(hive) }]
  }
  if (jurisdiction === 'england') {
    return [{ source: 'naturalEnglandPriorityHabitats', features: await fetchEnglandHabitats(hive) }]
  }
  if (jurisdiction === 'scotland') {
    return [{ source: 'natureScotHabitatMap', features: await fetchScotlandHabitats(hive) }]
  }
  if (jurisdiction === 'wales') {
    return [{ source: 'naturalResourcesWalesPhaseOne', features: await fetchWalesHabitats(hive) }]
  }
  if (jurisdiction === 'republicOfIreland') return fetchIrelandHabitats(hive)
  return []
}

export async function fetchRegionalHabitats(jurisdictions: Jurisdiction[], hive: LatLon): Promise<HabitatFetchResult> {
  const results = (
    await Promise.all([...new Set(jurisdictions)].map((jurisdiction) => fetchJurisdiction(jurisdiction, hive)))
  ).flat()
  return {
    features: results.flatMap((result) => result.features ?? []),
    successfulSources: results.filter((result) => result.features !== null).map((result) => result.source),
    failedSources: results.filter((result) => result.features === null).map((result) => result.source),
  }
}
