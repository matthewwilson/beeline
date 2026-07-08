import { CONFIDENCE_DISPLAY } from '../lib/confidence'
import { useStore } from '../store/useStore'
import { ToggleSwitch } from './ToggleSwitch'
import styles from './controls.module.css'

const LEGEND = [
  { confidence: 'observed' as const, colour: 'var(--honey-soft)' },
  { confidence: 'surveyed' as const, colour: 'var(--surveyed)' },
  { confidence: 'openStreetMap' as const, colour: 'rgba(243,231,204,0.85)' },
]

export function ConfidenceLayer() {
  const showConfidenceLayer = useStore((s) => s.showConfidenceLayer)
  const toggleConfidenceLayer = useStore((s) => s.toggleConfidenceLayer)

  return (
    <>
      <ToggleSwitch label="Show data confidence" checked={showConfidenceLayer} onToggle={toggleConfidenceLayer} />

      {showConfidenceLayer && (
        <ul className={styles.bandLegend}>
          {LEGEND.map((item) => {
            const display = CONFIDENCE_DISPLAY[item.confidence]
            return (
              <li key={item.confidence} className={styles.bandRow}>
                <span className={styles.confidenceGlyph} style={{ borderColor: item.colour }} />
                <span className={styles.bandText}>
                  <strong>{display.label}</strong> {display.detail}.
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}
