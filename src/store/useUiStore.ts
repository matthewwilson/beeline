import { create } from 'zustand'

export type MobileView = 'map' | 'controls' | 'results'

// View/navigation state, kept separate from the domain store so hive/flower actions
// stay pure domain mutations. Navigation is always explicit - nothing in the domain
// store reaches in here to change the tab or move the map.
interface UiState {
  mobileView: MobileView
  // A one-shot request for the map to fly somewhere; the nonce lets MapView react even
  // when the same coordinates are requested twice.
  flyRequest: { lat: number; lon: number; zoom: number; nonce: number } | null

  setMobileView: (v: MobileView) => void
  flyTo: (lat: number, lon: number, zoom: number) => void
}

export const useUiStore = create<UiState>((set) => ({
  mobileView: 'map',
  flyRequest: null,

  setMobileView: (mobileView) => set({ mobileView }),

  flyTo: (lat, lon, zoom) =>
    set((s) => ({ flyRequest: { lat, lon, zoom, nonce: (s.flyRequest?.nonce ?? 0) + 1 } })),
}))
