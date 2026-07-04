import { useEffect } from 'react'
import { ControlsPanel } from './components/ControlsPanel'
import { FlowerPicker } from './components/FlowerPicker'
import { MapAddMenu } from './components/MapAddMenu'
import { MapExtras } from './components/MapExtras'
import { MobileNav } from './components/MobileNav'
import { ResultsPanel } from './components/ResultsPanel'
import { MapView } from './map/MapView'
import { useStore } from './store/useStore'
import styles from './App.module.css'

const GEO_OPTS: PositionOptions = { enableHighAccuracy: true, timeout: 8000 }

function locateFirstVisit(flyTo: (lat: number, lon: number, zoom: number) => void): void {
  if (useStore.getState().hives.length > 0) return
  if (!navigator.geolocation) return
  navigator.geolocation.getCurrentPosition(
    (pos) => flyTo(pos.coords.latitude, pos.coords.longitude, 13),
    () => {},
    GEO_OPTS,
  )
}

export function App() {
  const init = useStore((s) => s.init)
  const flyTo = useStore((s) => s.flyTo)
  const mobileView = useStore((s) => s.mobileView)
  useEffect(() => {
    init()
    locateFirstVisit(flyTo)
  }, [init, flyTo])

  return (
    <div className={styles.app} data-mobile-view={mobileView}>
      <div className={styles.mapWrap}>
        <MapView />
      </div>
      <div className={`panel scroll-warm ${styles.mapExtras}`}>
        <MapExtras />
      </div>
      <ControlsPanel />
      <ResultsPanel />
      <MapAddMenu />
      <FlowerPicker />
      <MobileNav />
    </div>
  )
}
