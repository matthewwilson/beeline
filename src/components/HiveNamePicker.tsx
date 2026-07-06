import { useState } from 'react'
import { useStore } from '../store/useStore'
import { useUiStore } from '../store/useUiStore'
import styles from './flowerpicker.module.css'

/**
 * In-app modal for naming a hive being added, replacing the blocking window.prompt.
 * Opened by requestHiveAt (from the add menu or a map tap); saving commits the hive and
 * jumps to the forage results.
 */
export function HiveNamePicker() {
  const pendingHive = useStore((s) => s.pendingHive)
  const saveHive = useStore((s) => s.saveHive)
  const cancelHive = useStore((s) => s.cancelHive)
  const setView = useUiStore((s) => s.setView)

  const [name, setName] = useState('')

  if (!pendingHive) return null

  const onSave = () => {
    saveHive(name)
    setName('')
    setView('map')
  }

  const onCancel = () => {
    cancelHive()
    setName('')
  }

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label="Name this hive"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel()
      }}
    >
      <div className={`panel ${styles.card}`}>
        <h2 className={`wordmark ${styles.title}`}>Name this hive</h2>
        <label className="field-label" htmlFor="hiveName">
          What would you like to call it?
        </label>
        <input
          id="hiveName"
          className="text-input"
          placeholder="My hive"
          value={name}
          autoFocus
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSave()
          }}
        />
        <div className={styles.actions}>
          <button type="button" className="btn btn-primary" onClick={onSave}>
            Save hive
          </button>
          <button type="button" className="btn" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
