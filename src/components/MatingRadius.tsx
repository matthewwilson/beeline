import { MATING_RADIUS_KM } from '../data/forage'
import { useStore } from '../store/useStore'
import styles from './controls.module.css'

export function MatingRadius() {
  const activeHive = useStore((s) => s.activeHive)
  const showMatingRadius = useStore((s) => s.showMatingRadius)
  const toggleMatingRadius = useStore((s) => s.toggleMatingRadius)

  return (
    <>
      <button
        type="button"
        className={`btn ${styles.toggle} ${showMatingRadius ? styles.toggleOn : ''}`}
        role="switch"
        aria-checked={showMatingRadius}
        onClick={toggleMatingRadius}
      >
        <span className={styles.toggleTrack}>
          <span className={styles.toggleThumb} />
        </span>
        Queen mating flight radius
      </button>

      {showMatingRadius && !activeHive && (
        <p className={`hint ${styles.blockHint}`}>Select a hive to see the queen's mating range.</p>
      )}

      {showMatingRadius && (
        <p className={`hint ${styles.blockHint}`}>
          ~{MATING_RADIUS_KM} km — the practical reach to drone congregation areas. Queens usually mate
          within 2 to 3 km (Jensen et al., 2005). The distance rings are hidden while this is on.
        </p>
      )}
    </>
  )
}
