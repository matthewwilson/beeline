import { MATING_RADIUS_KILOMETRES } from '../data/forage'
import { useStore } from '../store/useStore'
import { ToggleSwitch } from './ToggleSwitch'
import styles from './controls.module.css'

export function MatingRadius() {
  const activeHive = useStore((s) => s.activeHive)
  const showMatingRadius = useStore((s) => s.showMatingRadius)
  const toggleMatingRadius = useStore((s) => s.toggleMatingRadius)

  return (
    <>
      <ToggleSwitch label="Queen mating flight radius" checked={showMatingRadius} onToggle={toggleMatingRadius} />

      {showMatingRadius && !activeHive && (
        <p className={`hint ${styles.blockHint}`}>Select a hive to see the queen's mating range.</p>
      )}

      {showMatingRadius && (
        <p className={`hint ${styles.blockHint}`}>
          ~{MATING_RADIUS_KILOMETRES} km — a practical search radius for drone congregation areas. Queens often mate
          a few kilometres from the hive, while genetic work has found most matings within about 7.5 km. The distance
          rings are hidden while this is on.
        </p>
      )}
    </>
  )
}
