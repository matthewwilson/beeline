import { useStore } from '../store/useStore'
import { useAddForage } from '../lib/useAddForage'
import { BeeFlights } from './BeeFlights'
import { Credits } from './Credits'
import { DcaPanel } from './DcaPanel'
import { ForageLegend } from './ForageLegend'
import { MatingRadius } from './MatingRadius'
import { PollenSwatches } from './PollenSwatches'
import { Section } from './Section'
import { SeasonSelect } from './SeasonSelect'
import { WeatherBox } from './WeatherBox'
import styles from './controls.module.css'

interface ControlsPanelProps {
  // On desktop this panel also carries the add actions and the weather/pollen/legend
  // sections; on mobile those live in the map's add FAB and the map-extras panel instead.
  isDesktop: boolean
}

export function ControlsPanel({ isDesktop }: ControlsPanelProps) {
  const activeHive = useStore((s) => s.activeHive)
  const status = useStore((s) => s.status)
  const { photoInput, addHiveHere, addFlower, pickPhoto, onPhotoChosen } = useAddForage()

  return (
    <aside className={`panel scroll-warm panel-sheet ${styles.controls}`} data-sheet="controls">
      <header className={styles.header}>
        <h1 className={`wordmark ${styles.title}`}>BeeLine</h1>
        <p className={styles.tagline}>bee forage map</p>
      </header>
      <p className={`hint ${styles.intro}`}>
        Add a hive, then select it to see where its bees most likely forage and which pollen colours to expect. Hives and
        flower sightings are saved on this device.
      </p>

      {isDesktop && (
        <>
          <div className={styles.addRow}>
            <button type="button" className="btn btn-primary" onClick={addHiveHere}>
              Add a hive
            </button>
            <button type="button" className="btn" onClick={addFlower}>
              Add a flower
            </button>
            <button type="button" className="btn" onClick={pickPhoto}>
              Add a flower from a photo
            </button>
            <input
              ref={photoInput}
              className={styles.photoInput}
              type="file"
              accept="image/*"
              onChange={onPhotoChosen}
            />
          </div>
          <p className={`hint ${styles.addHint}`}>
            Or tap the map to drop a hive. Add a flower to log real forage where you’re standing — it sharpens nearby
            predictions. A geotagged photo drops the flower where it was taken, then you pick the plant.
          </p>
        </>
      )}
      {status && <p className={styles.status}>{status}</p>}

      {isDesktop && activeHive && (
        <>
          <div className={styles.sep} />
          <WeatherBox />
        </>
      )}

      <Section title="Season">
        <SeasonSelect />
      </Section>

      {isDesktop && (
        <Section title="Pollen at the entrance" hint="Seeing a colour on returning bees? Tap it to highlight matching sources.">
          <PollenSwatches />
        </Section>
      )}

      <Section title="Foraging flights by age">
        <BeeFlights />
      </Section>

      <Section title="Queen mating flight">
        <MatingRadius />
      </Section>

      <Section title="Drone congregation areas">
        <DcaPanel />
      </Section>

      {isDesktop && (
        <Section title="Forage legend">
          <ForageLegend />
        </Section>
      )}

      <Credits />
    </aside>
  )
}
