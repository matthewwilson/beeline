import { useStore } from '../store/useStore'
import { ForageLegend } from './ForageLegend'
import { PollenSwatches } from './PollenSwatches'
import { WeatherBox } from './WeatherBox'
import styles from './mapextras.module.css'

/**
 * Pollen swatches, weather status and forage legend, shown below the map on the
 * mobile Map tab. On desktop these live in the always-visible controls panel instead.
 */
export function MapExtras() {
  const activeHive = useStore((s) => s.activeHive)

  return (
    <div className={styles.extras}>
      <section className={styles.block}>
        <p className={`eyebrow ${styles.blockLabel}`}>Pollen at the entrance</p>
        <p className={`hint ${styles.blockHint}`}>Seeing a colour on returning bees? Tap it to highlight matching sources.</p>
        <PollenSwatches />
      </section>

      {activeHive && (
        <section className={styles.block}>
          <p className={`eyebrow ${styles.blockLabel}`}>Weather</p>
          <WeatherBox />
        </section>
      )}

      <section className={styles.block}>
        <p className={`eyebrow ${styles.blockLabel}`}>Forage legend</p>
        <ForageLegend />
      </section>
    </div>
  )
}
