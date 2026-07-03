import { useStore } from '../store/useStore'
import type { MobileView } from '../store/useStore'
import styles from './mobilenav.module.css'

const TABS: { view: MobileView; icon: string; label: string }[] = [
  { view: 'map', icon: '🗺️', label: 'Map' },
  { view: 'controls', icon: '🍯', label: 'Setup' },
  { view: 'results', icon: '🌸', label: 'Forage' },
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
            <span className={styles.icon} aria-hidden="true">
              {icon}
            </span>
            {label}
          </button>
        )
      })}
    </nav>
  )
}
