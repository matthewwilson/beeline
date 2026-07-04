import { useStore } from '../store/useStore'
import { ForageLegend } from './ForageLegend'
import { WeatherBox } from './WeatherBox'
import styles from './mapextras.module.css'

/**
 * Weather status and forage legend, shown below the map on the mobile Map tab.
 * On desktop these live in the always-visible controls panel instead.
 */
export function MapExtras() {
  const activeHive = useStore((s) => s.activeHive)

  return (
    <div className={styles.extras}>
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
