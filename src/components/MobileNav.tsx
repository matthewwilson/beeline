import { faGear, faMapLocationDot, faSpa } from '@fortawesome/free-solid-svg-icons'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useUiStore } from '../store/useUiStore'
import type { WorkspaceView } from '../store/useUiStore'
import styles from './mobilenav.module.css'

const TABS: { view: WorkspaceView; icon: IconDefinition; label: string }[] = [
  { view: 'map', icon: faMapLocationDot, label: 'Map' },
  { view: 'forage', icon: faSpa, label: 'Forage' },
  { view: 'setup', icon: faGear, label: 'Setup' },
]

export function MobileNav() {
  const currentView = useUiStore((s) => s.view)
  const setView = useUiStore((s) => s.setView)

  return (
    <nav className={styles.nav} aria-label="Views">
      {TABS.map(({ view, icon, label }) => {
        const active = currentView === view
        return (
          <button
            key={view}
            type="button"
            className={`${styles.tab} ${active ? styles.tabActive : ''}`}
            aria-current={active ? 'page' : undefined}
            aria-label={label}
            onClick={() => setView(view)}
          >
            <FontAwesomeIcon icon={icon} className={styles.icon} />
            {label}
          </button>
        )
      })}
    </nav>
  )
}
