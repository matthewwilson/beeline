import { useStore } from '../store/useStore'
import { ForageLegend } from './ForageLegend'
import { PollenSwatches } from './PollenSwatches'
import { Section } from './Section'
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
      <Section title="Pollen at the entrance" hint="Seeing a colour on returning bees? Tap it to highlight matching sources.">
        <PollenSwatches />
      </Section>

      {activeHive && (
        <Section title="Weather">
          <WeatherBox />
        </Section>
      )}

      <Section title="Forage legend">
        <ForageLegend />
      </Section>
    </div>
  )
}
