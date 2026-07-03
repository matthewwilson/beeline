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
    <select className="select" value={season} onChange={(e) => setSeason(e.target.value as Season)} aria-label="Season">
      {OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}
