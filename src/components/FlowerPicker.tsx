import { useState } from 'react'
import { FORAGE_PLANTS, OTHER_FLOWER_KEY } from '../data/plants'
import { useStore } from '../store/useStore'
import type { ForageKey } from '../types'
import styles from './flowerpicker.module.css'

export function FlowerPicker() {
  const pendingFlower = useStore((s) => s.pendingFlower)
  const saveFlower = useStore((s) => s.saveFlower)
  const cancelFlower = useStore((s) => s.cancelFlower)

  const [choice, setChoice] = useState('0')
  const [other, setOther] = useState('')
  const [note, setNote] = useState('')

  if (!pendingFlower) return null

  const reset = () => {
    setChoice('0')
    setOther('')
    setNote('')
  }

  const onSave = () => {
    let plant: string
    let key: ForageKey
    if (choice === 'other') {
      plant = other.trim() || 'Unknown flower'
      key = OTHER_FLOWER_KEY
    } else {
      const p = FORAGE_PLANTS[Number(choice)]
      plant = p.name
      key = p.key
    }
    saveFlower(plant, key, note)
    reset()
  }

  const onCancel = () => {
    cancelFlower()
    reset()
  }

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label="Add a flower"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel()
      }}
    >
      <div className={`panel ${styles.card}`}>
        <h2 className={`wordmark ${styles.title}`}>Add a flower</h2>
        <label className="field-label" htmlFor="flowerSelect">
          What’s flowering here?
        </label>
        <select id="flowerSelect" className="select" value={choice} onChange={(e) => setChoice(e.target.value)}>
          {FORAGE_PLANTS.map((p, i) => (
            <option key={p.name} value={i}>
              {p.name}
            </option>
          ))}
          <option value="other">Other (type it)…</option>
        </select>
        {choice === 'other' && (
          <input
            className={`text-input ${styles.mt}`}
            placeholder="Type the plant name"
            value={other}
            onChange={(e) => setOther(e.target.value)}
          />
        )}
        <input
          className={`text-input ${styles.mt}`}
          placeholder="Optional note (e.g. covered in bees)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <div className={styles.actions}>
          <button type="button" className="btn btn-primary" onClick={onSave}>
            Save flower
          </button>
          <button type="button" className="btn" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
