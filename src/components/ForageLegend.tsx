import { FORAGE } from '../data/forage'
import styles from './controls.module.css'

const ITEMS = Object.values(FORAGE).sort((a, b) => b.base - a.base)

export function ForageLegend() {
  return (
    <div className={styles.legend}>
      {ITEMS.map((m) => (
        <div key={m.label} className={styles.legendRow}>
          <span className={styles.legendDot} style={{ background: m.colour }} />
          <span className={styles.legendLabel}>
            {m.label} <span className={styles.legendPlant}>{m.plant}</span>
          </span>
        </div>
      ))}
    </div>
  )
}
