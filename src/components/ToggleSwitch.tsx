import styles from './toggleswitch.module.css'

interface ToggleSwitchProps {
  label: string
  checked: boolean
  onToggle: () => void
}

/**
 * A labelled on/off switch (button with role="switch"). Shared by the bee-flight, mating
 * radius and drone congregation area panels so the track/thumb markup lives in one place.
 */
export function ToggleSwitch({ label, checked, onToggle }: ToggleSwitchProps) {
  return (
    <button
      type="button"
      className={`btn ${styles.toggle} ${checked ? styles.toggleOn : ''}`}
      role="switch"
      aria-checked={checked}
      onClick={onToggle}
    >
      <span className={styles.toggleTrack}>
        <span className={styles.toggleThumb} />
      </span>
      {label}
    </button>
  )
}
