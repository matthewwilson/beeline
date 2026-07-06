import { faGear, faMapLocationDot, faSpa } from '@fortawesome/free-solid-svg-icons'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useUiStore } from '../store/useUiStore'
import type { WorkspaceView } from '../store/useUiStore'
import styles from './desktoprail.module.css'

const ITEMS: { view: WorkspaceView; icon: IconDefinition; label: string }[] = [
  { view: 'map', icon: faMapLocationDot, label: 'Map' },
  { view: 'forage', icon: faSpa, label: 'Forage' },
  { view: 'setup', icon: faGear, label: 'Setup' },
]

export function DesktopRail() {
  const view = useUiStore((s) => s.view)
  const setView = useUiStore((s) => s.setView)

  return (
    <nav className={`panel ${styles.rail}`} aria-label="Workspace views">
      <div className={styles.brand}>
        <span className={`wordmark ${styles.mark}`}>BeeLine</span>
        <span className={styles.kicker}>forage map</span>
      </div>
      <div className={styles.items}>
        {ITEMS.map((item) => {
          const active = view === item.view
          return (
            <button
              key={item.view}
              type="button"
              className={`${styles.item} ${active ? styles.itemActive : ''}`}
              aria-current={active ? 'page' : undefined}
              onClick={() => setView(item.view)}
            >
              <FontAwesomeIcon icon={item.icon} className={styles.icon} />
              <span>{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
