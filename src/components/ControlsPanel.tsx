import { useRef } from 'react'
import type { ChangeEvent } from 'react'
import { readPhotoLocation } from '../lib/photo'
import { useStore } from '../store/useStore'
import { BeeFlights } from './BeeFlights'
import { Credits } from './Credits'
import { ForageLegend } from './ForageLegend'
import { PollenSwatches } from './PollenSwatches'
import { SeasonSelect } from './SeasonSelect'
import { WeatherBox } from './WeatherBox'
import styles from './controls.module.css'

const GEO_OPTS: PositionOptions = { enableHighAccuracy: true, timeout: 8000 }

function foundMessage(takenAt: Date | null): string {
  if (!takenAt) return 'Found the photo location. Choose what was flowering.'
  const date = takenAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  return `Found the photo location from ${date}. Choose what was flowering.`
}

export function ControlsPanel() {
  const activeHive = useStore((s) => s.activeHive)
  const status = useStore((s) => s.status)
  const addHive = useStore((s) => s.addHive)
  const requestFlowerAt = useStore((s) => s.requestFlowerAt)
  const setPlacingFlower = useStore((s) => s.setPlacingFlower)
  const setStatus = useStore((s) => s.setStatus)
  const photoInput = useRef<HTMLInputElement>(null)

  const addHiveHere = () => {
    if (!navigator.geolocation) {
      setStatus('Location unavailable — tap the map to place a hive.')
      return
    }
    setStatus('Finding your location…')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const name = window.prompt('Name this hive:', 'My hive')
        if (name === null) {
          setStatus('')
          return
        }
        addHive(pos.coords.latitude, pos.coords.longitude, name)
      },
      () => setStatus('Location denied — tap the map to place your hive.'),
      GEO_OPTS,
    )
  }

  const addFlower = () => {
    if (!navigator.geolocation) {
      setPlacingFlower(true)
      setStatus('Tap the map where the flower is.')
      return
    }
    setStatus('Finding where you’re standing…')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setStatus('')
        requestFlowerAt(pos.coords.latitude, pos.coords.longitude)
      },
      () => {
        setPlacingFlower(true)
        setStatus('Location denied — tap the map where the flower is.')
      },
      GEO_OPTS,
    )
  }

  const pickPhoto = () => photoInput.current?.click()

  const onPhotoChosen = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setStatus('Reading the photo…')
    const location = await readPhotoLocation(file)
    if (!location) {
      setStatus('No location saved in that photo. Add the flower by tapping the map instead.')
      return
    }
    requestFlowerAt(location.lat, location.lon)
    setStatus(foundMessage(location.takenAt))
  }

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
        <>
          <div className={styles.sep} />
          <WeatherBox />
        </>
      )}

      <section className={styles.block}>
        <p className={`eyebrow ${styles.blockLabel}`}>Season</p>
        <SeasonSelect />
      </section>

      <section className={styles.block}>
        <p className={`eyebrow ${styles.blockLabel}`}>Pollen at the entrance</p>
        <p className={`hint ${styles.blockHint}`}>Seeing a colour on returning bees? Tap it to highlight matching sources.</p>
        <PollenSwatches />
      </section>

      <section className={styles.block}>
        <p className={`eyebrow ${styles.blockLabel}`}>Foraging flights by age</p>
        <BeeFlights />
      </section>

      <section className={styles.block}>
        <p className={`eyebrow ${styles.blockLabel}`}>Forage legend</p>
        <ForageLegend />
      </section>

      <Credits />
    </aside>
  )
}
