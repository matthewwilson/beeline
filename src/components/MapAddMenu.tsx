import { useEffect, useRef, useState } from 'react'
import { faPlus } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useAddForage } from '../lib/useAddForage'
import { useStore } from '../store/useStore'
import styles from './mapaddmenu.module.css'

export function MapAddMenu() {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const status = useStore((s) => s.status)
  const { photoInput, addHiveHere, addFlower, pickPhoto, onPhotoChosen } = useAddForage()

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const run = (action: () => void) => () => {
    setOpen(false)
    action()
  }

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <button
        type="button"
        className={`btn btn-primary ${styles.fab} ${open ? styles.fabOpen : ''}`}
        aria-label={open ? 'Close add menu' : 'Add to the map'}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <FontAwesomeIcon icon={faPlus} className={styles.fabIcon} />
      </button>

      {open && (
        <div className={`panel ${styles.menu}`} role="menu" aria-label="Add to the map">
          <button type="button" className={`btn btn-primary ${styles.item}`} role="menuitem" onClick={run(addHiveHere)}>
            <span className={styles.itemIcon} aria-hidden="true">🐝</span>
            Add a hive
          </button>
          <button type="button" className={`btn ${styles.item}`} role="menuitem" onClick={run(addFlower)}>
            <span className={styles.itemIcon} aria-hidden="true">🌼</span>
            Add a flower
          </button>
          <button type="button" className={`btn ${styles.item}`} role="menuitem" onClick={run(pickPhoto)}>
            <span className={styles.itemIcon} aria-hidden="true">📷</span>
            Add a flower from a photo
          </button>
        </div>
      )}

      {status && <p className={styles.status}>{status}</p>}

      <input ref={photoInput} type="file" name="flowerPhoto" accept="image/*" hidden onChange={onPhotoChosen} />
    </div>
  )
}
