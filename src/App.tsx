import { useEffect } from 'react'
import { ControlsPanel } from './components/ControlsPanel'
import { FlowerPicker } from './components/FlowerPicker'
import { MapAddMenu } from './components/MapAddMenu'
import { MapExtras } from './components/MapExtras'
import { MobileNav } from './components/MobileNav'
import { ResultsPanel } from './components/ResultsPanel'
import { MapView } from './map/MapView'
import { GEO_OPTS } from './lib/useAddForage'
import { useIsDesktop } from './lib/useMediaQuery'
import { useStore } from './store/useStore'
import styles from './App.module.css'

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
  const isDesktop = useIsDesktop()

  useEffect(() => {
    init()
    locateFirstVisit(flyTo)
  }, [init, flyTo])

  // Desktop floats the panels over a full-bleed map and ignores the tab attribute; mobile
  // is a tab-switched SPA. Mobile-only chrome (nav, add FAB, map extras) never mounts on
  // desktop, and the shared weather/pollen/legend sections mount exactly once per viewport
  // (in the controls panel on desktop, in the map extras on mobile).
  return (
    <div className={styles.app} data-mobile-view={isDesktop ? undefined : mobileView}>
      <div className={styles.mapWrap}>
        <MapView />
      </div>

      {!isDesktop && mobileView === 'map' && (
        <div className={`panel scroll-warm ${styles.mapExtras}`}>
          <MapExtras />
        </div>
      )}

      <ControlsPanel isDesktop={isDesktop} />
      <ResultsPanel />

      {!isDesktop && <MapAddMenu />}
      {!isDesktop && <MobileNav />}
      <FlowerPicker />
    </div>
  )
}
