import { faGear, faMapLocationDot, faSpa } from '@fortawesome/free-solid-svg-icons'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useStore } from '../store/useStore'
import type { MobileView } from '../store/useStore'
import styles from './mobilenav.module.css'

const TABS: { view: MobileView; icon: IconDefinition; label: string }[] = [
  { view: 'map', icon: faMapLocationDot, label: 'Map' },
  { view: 'controls', icon: faGear, label: 'Setup' },
  { view: 'results', icon: faSpa, label: 'Forage' },
]

export function MobileNav() {
  const mobileView = useStore((s) => s.mobileView)
  const setMobileView = useStore((s) => s.setMobileView)

  return (
    <nav className={styles.nav} aria-label="Views">
      {TABS.map(({ view, icon, label }) => {
        const active = mobileView === view
        return (
          <button
            key={view}
            type="button"
            className={`${styles.tab} ${active ? styles.tabActive : ''}`}
            aria-current={active ? 'page' : undefined}
            aria-label={label}
            onClick={() => setMobileView(view)}
          >
            <FontAwesomeIcon icon={icon} className={styles.icon} />
            {label}
          </button>
        )
      })}
    </nav>
  )
}
