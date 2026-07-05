import { useMemo } from 'react'
import { scoreOf } from './scoring'
import { useStore } from '../store/useStore'
import type { ScoredFeature } from '../types'

/**
 * The forage features scored for the active hive and season, sorted best-first. Centralises
 * the score/sort pipeline so the destination list, forage markers and bee flights all read
 * the same derived data instead of recomputing it three ways.
 */
export function useScoredFeatures(): ScoredFeature[] {
  const features = useStore((s) => s.features)
  const season = useStore((s) => s.season)
  const selectedPollen = useStore((s) => s.selectedPollen)
  const gddOffsetDays = useStore((s) => s.weather.gddOffsetDays)

  return useMemo(() => {
    const ctx = { season, gddOffsetDays, selectedPollen }
    return features.map((f) => ({ ...f, score: scoreOf(f, ctx) })).sort((a, b) => b.score - a.score)
  }, [features, season, selectedPollen, gddOffsetDays])
}
