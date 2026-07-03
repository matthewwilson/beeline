import { POLLEN } from '../data/pollen'
import { useStore } from '../store/useStore'
import type { PollenKey } from '../types'
import styles from './controls.module.css'

const ENTRIES = Object.entries(POLLEN) as Array<[PollenKey, (typeof POLLEN)[PollenKey]]>

export function PollenSwatches() {
  const selectedPollen = useStore((s) => s.selectedPollen)
  const togglePollen = useStore((s) => s.togglePollen)
  const setStatus = useStore((s) => s.setStatus)

  const pick = (k: PollenKey) => {
    const clearing = selectedPollen === k
    togglePollen(k)
    setStatus(clearing ? '' : `Highlighting ${POLLEN[k].label.toLowerCase()} pollen sources (${POLLEN[k].note})`)
  }

  return (
    <div className={styles.swatches}>
      {ENTRIES.map(([k, p]) => (
        <button
          key={k}
          type="button"
          title={`${p.label} — ${p.note}`}
          aria-label={p.label}
          aria-pressed={selectedPollen === k}
          className={`${styles.swatch} ${selectedPollen === k ? styles.swatchActive : ''}`}
          style={{ background: p.colour }}
          onClick={() => pick(k)}
        />
      ))}
    </div>
  )
}
