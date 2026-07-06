import { useStore } from '../store/useStore'
import { BiosecurityPanel } from './BiosecurityPanel'
import { DestinationList } from './DestinationList'
import { ForageCalendar } from './ForageCalendar'
import styles from './workspace.module.css'

interface ForagePanelProps {
  isDesktop: boolean
}

export function ForagePanel({ isDesktop }: ForagePanelProps) {
  const activeHive = useStore((s) => s.activeHive)

  return (
    <aside className={`panel scroll-warm panel-sheet ${styles.workspacePanel}`} data-sheet="forage">
      <p className="eyebrow">Forage readout</p>
      <h2 className={`wordmark ${styles.title}`}>Likely destinations</h2>
      {activeHive && (
        <p className={styles.context}>
          Ranked around <strong>{activeHive.name}</strong>
        </p>
      )}

      <DestinationList />
      <ForageCalendar />
      <BiosecurityPanel />

      {!isDesktop && <div className={styles.mobileSpacer} />}
    </aside>
  )
}
