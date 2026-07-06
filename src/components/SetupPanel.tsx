import { useStore } from '../store/useStore'
import { Credits } from './Credits'
import { SeasonSelect } from './SeasonSelect'
import { Section } from './Section'
import styles from './workspace.module.css'

interface SetupPanelProps {
  isDesktop: boolean
}

export function SetupPanel({ isDesktop }: SetupPanelProps) {
  const activeHive = useStore((s) => s.activeHive)
  const myHiveIds = useStore((s) => s.myHiveIds)
  const removeHive = useStore((s) => s.removeHive)

  return (
    <aside className={`panel scroll-warm panel-sheet ${styles.workspacePanel}`} data-sheet="setup">
      <p className="eyebrow">Setup</p>
      <h2 className={`wordmark ${styles.title}`}>Hive &amp; season</h2>
      <p className={`hint ${styles.copy}`}>
        Prediction settings and saved hive details live here. Map layer controls stay with the map.
      </p>

      <Section title="Active hive">
        {activeHive ? (
          <div className={styles.hiveCard}>
            <div>
              <strong>{activeHive.name}</strong>
              <p className={styles.hiveMeta}>{myHiveIds.includes(activeHive.id) ? 'Your hive' : 'Saved hive'}</p>
            </div>
            <button type="button" className={styles.removeLink} onClick={() => removeHive(activeHive.id)}>
              Remove
            </button>
          </div>
        ) : (
          <p className="hint">Add or select a hive on the map to start a forage readout.</p>
        )}
      </Section>

      <Section title="Season model">
        <SeasonSelect />
      </Section>

      <Credits />

      {!isDesktop && <div className={styles.mobileSpacer} />}
    </aside>
  )
}
