import { useEffect } from 'react'
import { DesktopRail } from './components/DesktopRail'
import { ForagePanel } from './components/ForagePanel'
import { FlowerPicker } from './components/FlowerPicker'
import { HiveNamePicker } from './components/HiveNamePicker'
import { MapAddMenu } from './components/MapAddMenu'
import { MobileFieldDrawer } from './components/MobileFieldDrawer'
import { MobileNav } from './components/MobileNav'
import { MapPanel } from './components/MapPanel'
import { SetupPanel } from './components/SetupPanel'
import { MapView } from './map/MapView'
import { GEO_OPTS } from './lib/useAddForage'
import { useIsDesktop } from './lib/useMediaQuery'
import { useStore } from './store/useStore'
import { useUiStore } from './store/useUiStore'
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
  const flyTo = useUiStore((s) => s.flyTo)
  const view = useUiStore((s) => s.view)
  const isDesktop = useIsDesktop()

  useEffect(() => {
    init()
    locateFirstVisit(flyTo)
  }, [init, flyTo])

  // The map stays mounted as the workspace on every viewport. Mobile keeps the tabbed
  // sheet model; desktop uses the same view hierarchy through a compact rail and one
  // contextual side panel.
  return (
    <div className={styles.app} data-view={view}>
      <div className={styles.mapWrap}>
        <MapView />
      </div>

      {isDesktop && <DesktopRail />}
      {isDesktop && view === 'map' && <MapPanel isDesktop />}
      {isDesktop && view === 'forage' && <ForagePanel isDesktop />}
      {isDesktop && view === 'setup' && <SetupPanel isDesktop />}

      {!isDesktop && view === 'map' && <MobileFieldDrawer />}
      {!isDesktop && view === 'forage' && <ForagePanel isDesktop={false} />}
      {!isDesktop && view === 'setup' && <SetupPanel isDesktop={false} />}

      {!isDesktop && <MapAddMenu />}
      {!isDesktop && <MobileNav />}
      <FlowerPicker />
      <HiveNamePicker />
    </div>
  )
}
