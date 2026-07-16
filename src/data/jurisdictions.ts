import boundaryData from './jurisdictionBoundaries.json'
import { distanceToGeometryMetres } from '../lib/geo'
import type { FeatureGeometry, Jurisdiction, LatLon } from '../types'

export interface JurisdictionProfile {
  label: string
  habitatCredit: string | null
  hornetReportUrl: string | null
  diseaseAuthority: string | null
  diseaseUrl: string | null
}

export const JURISDICTION_PROFILES: Record<Jurisdiction, JurisdictionProfile> = {
  northernIreland: {
    label: 'Northern Ireland',
    habitatCredit: 'DAERA/NIEA Priority Habitats (OGL)',
    hornetReportUrl: 'https://www.invasivespeciesni.co.uk/how-to-report',
    diseaseAuthority: 'DAERA',
    diseaseUrl: 'https://www.daera-ni.gov.uk/articles/bee-health',
  },
  republicOfIreland: {
    label: 'Republic of Ireland',
    habitatCredit: 'National Parks and Wildlife Service habitat surveys (CC BY 4.0)',
    hornetReportUrl: 'https://records.biodiversityireland.ie/record/invasives',
    diseaseAuthority: 'Department of Agriculture, Food and the Marine',
    diseaseUrl: 'https://www.gov.ie/en/department-of-agriculture-food-and-the-marine/services/honey-bee-health-surveillance-programme/',
  },
  scotland: {
    label: 'Scotland',
    habitatCredit: 'NatureScot Habitat Map of Scotland (OGL)',
    hornetReportUrl: 'https://www.ceh.ac.uk/our-science/projects/yellow-legged-asian-hornet-alert',
    diseaseAuthority: 'Scottish Government Bee Inspector',
    diseaseUrl: 'https://www.gov.scot/publications/honey-bee-health-guidance/pages/diseases-and-pests/',
  },
  england: {
    label: 'England',
    habitatCredit: 'Natural England Priority Habitats Inventory (OGL)',
    hornetReportUrl: 'https://www.ceh.ac.uk/our-science/projects/yellow-legged-asian-hornet-alert',
    diseaseAuthority: 'National Bee Unit',
    diseaseUrl: 'https://www.gov.uk/guidance/honey-bees-protecting-them-from-pests-and-diseases',
  },
  wales: {
    label: 'Wales',
    habitatCredit: 'Natural Resources Wales Phase 1 Habitat Survey (OGL)',
    hornetReportUrl: 'https://www.ceh.ac.uk/our-science/projects/yellow-legged-asian-hornet-alert',
    diseaseAuthority: 'National Bee Unit',
    diseaseUrl: 'https://www.gov.wales/healthy-honey-bees',
  },
  unsupported: {
    label: 'Generic coverage',
    habitatCredit: null,
    hornetReportUrl: null,
    diseaseAuthority: null,
    diseaseUrl: null,
  },
}

interface BoundaryRecord {
  jurisdiction: Exclude<Jurisdiction, 'unsupported'>
  geometry: FeatureGeometry
}

// Generated from geoBoundaries gbOpen GBR ADM1 and IRL ADM0 data, then simplified to
// roughly 100 m for client-side routing. See references/regional-data.md.
const BOUNDARIES = boundaryData as BoundaryRecord[]

export function jurisdictionAt(point: LatLon): Jurisdiction {
  return BOUNDARIES.find((boundary) => distanceToGeometryMetres(point, boundary.geometry) === 0)?.jurisdiction ?? 'unsupported'
}

export function jurisdictionsWithinRadius(point: LatLon, radiusMetres: number): Jurisdiction[] {
  if (jurisdictionAt(point) === 'unsupported') return ['unsupported']
  return BOUNDARIES.filter((boundary) => {
    const distance = distanceToGeometryMetres(point, boundary.geometry)
    return distance != null && distance <= radiusMetres
  }).map((boundary) => boundary.jurisdiction)
}
