import { BANDS } from '../lib/beeFlights'
import { useStore } from '../store/useStore'
import { ToggleSwitch } from './ToggleSwitch'
import styles from './controls.module.css'

export function BeeFlights() {
  const activeHive = useStore((s) => s.activeHive)
  const showBeeFlights = useStore((s) => s.showBeeFlights)
  const toggleBeeFlights = useStore((s) => s.toggleBeeFlights)

  return (
    <>
      <ToggleSwitch label="Animate foraging flights" checked={showBeeFlights} onToggle={toggleBeeFlights} />

      {showBeeFlights && !activeHive && (
        <p className={`hint ${styles.blockHint}`}>Select a hive to watch its bees fly.</p>
      )}

      {showBeeFlights && (
        <ul className={styles.bandLegend}>
          {BANDS.map((b) => (
            <li key={b.id} className={styles.bandRow}>
              <span className={styles.bandDot} style={{ background: b.colour, color: b.colour }} />
              <span className={styles.bandText}>
                <strong>{b.label}</strong> {b.blurb}
              </span>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
