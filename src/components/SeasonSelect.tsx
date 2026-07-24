import { captureEvent } from '../lib/analytics'
import { useStore } from '../store/useStore'
import type { Season } from '../types'

const OPTIONS: Array<{ value: Season; label: string }> = [
  { value: 'auto', label: 'Auto — from live weather' },
  { value: 'spring', label: 'Spring — blossom & rape' },
  { value: 'summer', label: 'Summer — meadows & lime' },
  { value: 'late', label: 'Late summer — heather & ivy' },
]

export function SeasonSelect() {
  const season = useStore((s) => s.season)
  const setSeason = useStore((s) => s.setSeason)
  return (
    <select
      className="select"
      name="season"
      value={season}
      onChange={(e) => {
        const next = e.target.value as Season
        captureEvent('season_changed', { season: next })
        setSeason(next)
      }}
      aria-label="Season"
    >
      {OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}
