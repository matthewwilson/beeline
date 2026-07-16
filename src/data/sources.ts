import type { Confidence, FeatureSourceKey } from '../types'

export interface FeatureSourceMeta {
  label: string
  shortLabel: string
  detail: string
  confidence: Confidence
}

export const FEATURE_SOURCES: Record<FeatureSourceKey, FeatureSourceMeta> = {
  userObservation: {
    label: 'You spotted',
    shortLabel: 'user observed',
    detail: 'User-confirmed flower sighting',
    confidence: 'observed',
  },
  openStreetMap: {
    label: 'OpenStreetMap',
    shortLabel: 'OpenStreetMap',
    detail: 'Community-mapped land cover',
    confidence: 'openStreetMap',
  },
  daeraPriorityHabitats: {
    label: 'DAERA/NIEA surveyed',
    shortLabel: 'DAERA/NIEA',
    detail: 'DAERA/NIEA Priority Habitat survey',
    confidence: 'surveyed',
  },
  naturalEnglandPriorityHabitats: {
    label: 'Natural England surveyed',
    shortLabel: 'Natural England',
    detail: 'Natural England Priority Habitats Inventory',
    confidence: 'surveyed',
  },
  natureScotHabitatMap: {
    label: 'NatureScot surveyed',
    shortLabel: 'NatureScot',
    detail: 'NatureScot Habitat Map of Scotland',
    confidence: 'surveyed',
  },
  naturalResourcesWalesPhaseOne: {
    label: 'NRW surveyed',
    shortLabel: 'NRW',
    detail: 'Natural Resources Wales Phase 1 Habitat Survey',
    confidence: 'surveyed',
  },
  nationalParksWildlifeServiceArticle17: {
    label: 'NPWS mapped',
    shortLabel: 'NPWS Article 17',
    detail: 'NPWS Article 17 terrestrial habitat mapping',
    confidence: 'surveyed',
  },
  nationalParksWildlifeServiceNativeWoodland: {
    label: 'NPWS surveyed',
    shortLabel: 'NPWS woodland',
    detail: 'NPWS National Survey of Native Woodlands',
    confidence: 'surveyed',
  },
  nationalParksWildlifeServiceGrassland: {
    label: 'NPWS surveyed',
    shortLabel: 'NPWS grassland',
    detail: 'NPWS Irish Semi-natural Grassland Survey',
    confidence: 'surveyed',
  },
}

export function confidenceForSource(source: FeatureSourceKey): Confidence {
  return FEATURE_SOURCES[source].confidence
}
