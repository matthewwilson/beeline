import { useEffect, useState } from 'react'
import { faBars, faXmark } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { MapPanel } from './MapPanel'
import styles from './mobilefielddrawer.module.css'

export function MobileFieldDrawer() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      <button
        type="button"
        className={`btn ${styles.trigger} ${open ? styles.triggerOpen : ''}`}
        aria-label={open ? 'Close field view' : 'Open field view'}
        aria-controls="mobileFieldView"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <FontAwesomeIcon icon={open ? faXmark : faBars} className={styles.icon} />
      </button>

      {open && (
        <>
          <button
            type="button"
            className={styles.backdrop}
            aria-label="Close field view"
            onClick={() => setOpen(false)}
          />
          <MapPanel id="mobileFieldView" isDesktop={false} className={styles.drawer} />
        </>
      )}
    </>
  )
}
