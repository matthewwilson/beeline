import { useEffect } from 'react'
import { ControlsPanel } from './components/ControlsPanel'
import { FlowerPicker } from './components/FlowerPicker'
import { ResultsPanel } from './components/ResultsPanel'
import { MapView } from './map/MapView'
import { useStore } from './store/useStore'
import styles from './App.module.css'

export function App() {
  const init = useStore((s) => s.init)
  useEffect(() => {
    init()
  }, [init])

  return (
    <div className={styles.app}>
      <div className={styles.mapWrap}>
        <MapView />
      </div>
      <ControlsPanel />
      <ResultsPanel />
      <FlowerPicker />
    </div>
  )
}
