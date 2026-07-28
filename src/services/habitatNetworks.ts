import { HABITAT_NETWORK_CLASSES, HABITAT_NETWORKS } from '../data/habitatNetworks'
import { fetchArcGisFeatures } from './arcGis'
import type { FeatureGeometry, HabitatNetworkClass, HabitatNetworkKey, HabitatOpportunity, LatLon } from '../types'

const SERVICE_BASE = 'https://services3.arcgis.com/HRuPlEcokYlz4mdz/arcgis/rest/services'
const opportunityClasses = new Set(Object.keys(HABITAT_NETWORK_CLASSES) as HabitatNetworkClass[])
const opportunityWhere = `Class IN (${[...opportunityClasses].map((value) => `'${value}'`).join(',')})`

function isOpportunityGeometry(
  geometry: FeatureGeometry | undefined,
): geometry is HabitatOpportunity['geometry'] {
  return geometry?.type === 'Polygon' || geometry?.type === 'MultiPolygon'
}

export async function fetchHabitatOpportunities(
  habitat: HabitatNetworkKey,
  hive: LatLon,
): Promise<HabitatOpportunity[] | null> {
  const serviceName = HABITAT_NETWORKS[habitat].serviceName
  const records = await fetchArcGisFeatures(`${SERVICE_BASE}/${serviceName}/FeatureServer/1`, hive, ['Class'], opportunityWhere)
  if (records === null) return null

  const opportunities: HabitatOpportunity[] = []
  for (const record of records) {
    const networkClass = record.properties?.Class
    const geometry = record.geometry
    if (typeof networkClass !== 'string' || !opportunityClasses.has(networkClass as HabitatNetworkClass)) continue
    if (!isOpportunityGeometry(geometry)) continue
    opportunities.push({ habitat, networkClass: networkClass as HabitatNetworkClass, geometry })
  }
  return opportunities
}
