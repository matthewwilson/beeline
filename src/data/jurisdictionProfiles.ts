import type { Jurisdiction } from '../types'

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
