import { useStore } from '../store/useStore'
import styles from './controls.module.css'

// Colour stops mirroring the map's warm suitability ramp (see MapView `dcaColour`).
const RAMP = [
  { colour: 'hsl(45, 85%, 56%)', label: 'Less likely' },
  { colour: 'hsl(28, 85%, 51%)', label: 'Possible' },
  { colour: 'hsl(12, 85%, 46%)', label: 'More likely' },
]

/**
 * Toggle + legend for the drone-congregation-area suitability layer. A DCA is where male
 * bees gather to mate; the layer scores the surrounding landscape for the features the
 * research links to DCAs. It is a prediction, not a detection — see references/dca-model.md.
 */
export function DcaPanel() {
  const activeHive = useStore((s) => s.activeHive)
  const showDca = useStore((s) => s.showDca)
  const toggleDca = useStore((s) => s.toggleDca)
  const dcaStatus = useStore((s) => s.dcaStatus)

  return (
    <>
      <button
        type="button"
        className={`btn ${styles.toggle} ${showDca ? styles.toggleOn : ''}`}
        role="switch"
        aria-checked={showDca}
        onClick={toggleDca}
      >
        <span className={styles.toggleTrack}>
          <span className={styles.toggleThumb} />
        </span>
        Show drone congregation areas
      </button>

      {showDca && !activeHive && (
        <p className={`hint ${styles.blockHint}`}>Select a hive to map likely drone-gathering spots.</p>
      )}

      {showDca && activeHive && dcaStatus === 'loading' && (
        <p className={`hint ${styles.blockHint}`}>Modelling the terrain around this hive…</p>
      )}

      {showDca && dcaStatus === 'partial' && (
        <p className={`hint ${styles.blockHint}`}>
          Elevation data unavailable — showing a land-cover estimate only.
        </p>
      )}

      {showDca && (
        <>
          <ul className={styles.bandLegend}>
            {RAMP.map((r) => (
              <li key={r.label} className={styles.bandRow}>
                <span className={styles.bandDot} style={{ background: r.colour, color: r.colour }} />
                <span className={styles.bandText}>{r.label}</span>
              </li>
            ))}
          </ul>
          <p className={`hint ${styles.blockHint}`}>
            Warmer cells hold more of the features drones favour: open ground beside a hedge or tree-line,
            low-lying, on a gentle south-facing slope.
          </p>
          <p className={styles.credits}>
            A prediction from landscape features, not a detection — confirm any site in the field with a
            drone lure or tethered queen. Model after Galindo-Cardona et al. 2012 (J. Insect Sci. 12:122)
            and Hayashi &amp; Satoh 2021 (Ethology 127:582).
          </p>
        </>
      )}
    </>
  )
}
