import type { Confidence, ScoredFeature } from '../types'
import { confidenceForSource, FEATURE_SOURCES, type FeatureSourceMeta } from '../data/sources'

export interface ConfidenceDisplay {
  label: string
  shortLabel: string
  detail: string
  rank: number
}

export interface ConfidenceContribution {
  confidence: Confidence
  label: string
  pct: number
}

export const CONFIDENCE_DISPLAY: Record<Confidence, ConfidenceDisplay> = {
  observed: {
    label: 'Very high confidence',
    shortLabel: 'user observed',
    detail: 'User-confirmed flower sighting',
    rank: 3,
  },
  surveyed: {
    label: 'High confidence',
    shortLabel: 'surveyed',
    detail: 'Authoritative habitat inventory',
    rank: 2,
  },
  openStreetMap: {
    label: 'Moderate confidence',
    shortLabel: 'OpenStreetMap',
    detail: 'Community-mapped land cover',
    rank: 1,
  },
}

export function confidenceDisplay(confidence: Confidence): ConfidenceDisplay {
  return CONFIDENCE_DISPLAY[confidence]
}

export function confidenceContributions(features: ScoredFeature[]): ConfidenceContribution[] {
  const totals: Record<Confidence, number> = { observed: 0, surveyed: 0, openStreetMap: 0 }
  let total = 0

  for (const feature of features) {
    totals[confidenceForSource(feature.source)] += feature.score
    total += feature.score
  }

  if (total <= 0) return []

  return (Object.keys(totals) as Confidence[])
    .filter((confidence) => totals[confidence] > 0)
    .sort((a, b) => CONFIDENCE_DISPLAY[b].rank - CONFIDENCE_DISPLAY[a].rank)
    .map((confidence) => ({
      confidence,
      label: CONFIDENCE_DISPLAY[confidence].shortLabel,
      pct: Math.round((100 * totals[confidence]) / total),
    }))
}

export function sourceDisplay(source: ScoredFeature['source']): FeatureSourceMeta {
  return FEATURE_SOURCES[source]
}
