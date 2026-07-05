import { useStore } from '../store/useStore'
import { useAddForage } from '../lib/useAddForage'
import { BeeFlights } from './BeeFlights'
import { Credits } from './Credits'
import { DcaPanel } from './DcaPanel'
import { ForageLegend } from './ForageLegend'
import { MatingRadius } from './MatingRadius'
import { PollenSwatches } from './PollenSwatches'
import { SeasonSelect } from './SeasonSelect'
import { WeatherBox } from './WeatherBox'
import styles from './controls.module.css'

export function ControlsPanel() {
  const activeHive = useStore((s) => s.activeHive)
  const status = useStore((s) => s.status)
  const { photoInput, addHiveHere, addFlower, pickPhoto, onPhotoChosen } = useAddForage()

  return (
    <aside className={`panel scroll-warm ${styles.controls}`}>
      <header className={styles.header}>
        <h1 className={`wordmark ${styles.title}`}>BeeLine</h1>
        <p className={styles.tagline}>bee forage map</p>
      </header>
      <p className={`hint ${styles.intro}`}>
        Add a hive, then select it to see where its bees most likely forage and which pollen colours to expect. Hives and
        flower sightings are saved on this device.
      </p>

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
      {status && <p className={styles.status}>{status}</p>}

      {activeHive && (
        <div className={styles.desktopOnly}>
          <div className={styles.sep} />
          <WeatherBox />
        </div>
      )}

      <section className={styles.block}>
        <p className={`eyebrow ${styles.blockLabel}`}>Season</p>
        <SeasonSelect />
      </section>

      <section className={`${styles.block} ${styles.desktopOnly}`}>
        <p className={`eyebrow ${styles.blockLabel}`}>Pollen at the entrance</p>
        <p className={`hint ${styles.blockHint}`}>Seeing a colour on returning bees? Tap it to highlight matching sources.</p>
        <PollenSwatches />
      </section>

      <section className={styles.block}>
        <p className={`eyebrow ${styles.blockLabel}`}>Foraging flights by age</p>
        <BeeFlights />
      </section>

      <section className={styles.block}>
        <p className={`eyebrow ${styles.blockLabel}`}>Queen mating flight</p>
        <MatingRadius />
      </section>

      <section className={styles.block}>
        <p className={`eyebrow ${styles.blockLabel}`}>Drone congregation areas</p>
        <DcaPanel />
      </section>

      <section className={`${styles.block} ${styles.desktopOnly}`}>
        <p className={`eyebrow ${styles.blockLabel}`}>Forage legend</p>
        <ForageLegend />
      </section>

      <Credits />
    </aside>
  )
}
