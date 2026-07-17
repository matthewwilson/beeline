import { useStore } from '../store/useStore'
import { useAddForage } from '../lib/useAddForage'
import { BeeFlights } from './BeeFlights'
import { ConfidenceLayer } from './ConfidenceLayer'
import { DroneCongregationAreaPanel } from './DroneCongregationAreaPanel'
import { ForageLegend } from './ForageLegend'
import { MatingRadius } from './MatingRadius'
import { PollenSwatches } from './PollenSwatches'
import { Section } from './Section'
import { WeatherBox } from './WeatherBox'
import styles from './workspace.module.css'

interface MapPanelProps {
  isDesktop: boolean
  className?: string
  id?: string
}

export function MapPanel({ isDesktop, className = '', id }: MapPanelProps) {
  const activeHive = useStore((s) => s.activeHive)
  const status = useStore((s) => s.status)
  const { photoInput, addHiveHere, addFlower, pickPhoto, onPhotoChosen } = useAddForage()

  return (
    <aside
      id={id}
      className={`panel scroll-warm ${isDesktop ? 'panel-sheet' : styles.mobileMapPanel} ${styles.workspacePanel} ${className}`}
      data-sheet="map"
    >
      <p className="eyebrow">Map workspace</p>
      <h2 className={`wordmark ${styles.title}`}>Field view</h2>
      {activeHive && (
        <p className={styles.context}>
          Active hive: <strong>{activeHive.name}</strong>
        </p>
      )}

      {isDesktop && (
        <>
          <div className={styles.actionGrid}>
            <button type="button" className="btn btn-primary" onClick={addHiveHere}>
              Add a hive
            </button>
            <button type="button" className="btn" onClick={addFlower}>
              Add a flower
            </button>
            <button type="button" className="btn" onClick={pickPhoto}>
              Add from photo
            </button>
            <input
              ref={photoInput}
              className={styles.photoInput}
              type="file"
              name="flowerPhoto"
              accept="image/*"
              onChange={onPhotoChosen}
            />
          </div>
          <p className={`hint ${styles.copy}`}>
            Tap the map to drop a hive. Add a flower to log real forage where you are standing.
          </p>
        </>
      )}

      {status && <p className={styles.status}>{status}</p>}

      {activeHive && (
        <Section title="Weather">
          <WeatherBox />
        </Section>
      )}

      <Section title="Pollen filter" hint="Seeing a colour on returning bees? Tap it to highlight matching sources.">
        <PollenSwatches />
      </Section>

      <Section title="Map layers">
        <div className={styles.layerStack}>
          <ConfidenceLayer />
          <BeeFlights />
          <MatingRadius />
          <DroneCongregationAreaPanel />
        </div>
      </Section>

      <Section title="Forage legend">
        <ForageLegend />
      </Section>

      <a className={styles.aboutLink} href="/about/">
        How BeeLine predicts forage
      </a>
    </aside>
  )
}
