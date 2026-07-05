import { useStore } from '../store/useStore'
import { BiosecurityPanel } from './BiosecurityPanel'
import { DestinationList } from './DestinationList'
import { ForageCalendar } from './ForageCalendar'
import styles from './results.module.css'

export function ResultsPanel() {
  const activeHive = useStore((s) => s.activeHive)
  const myHiveIds = useStore((s) => s.myHiveIds)
  const removeHive = useStore((s) => s.removeHive)

  return (
    <aside className={`panel scroll-warm panel-sheet ${styles.results}`} data-sheet="results">
      <p className="eyebrow">Readout</p>
      <h2 className={`wordmark ${styles.title}`}>Likely destinations</h2>

      {activeHive && (
        <div className={styles.activeHive}>
          <span className={styles.badge}>
            🐝 {activeHive.name}
            {myHiveIds.includes(activeHive.id) ? ' · your hive' : ''}
          </span>
          <button type="button" className={styles.removeLink} onClick={() => removeHive(activeHive.id)}>
            Remove hive
          </button>
        </div>
      )}

      <DestinationList />
      <ForageCalendar />
      <BiosecurityPanel />
    </aside>
  )
}
