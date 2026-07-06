import { create } from 'zustand'

export type WorkspaceView = 'map' | 'forage' | 'setup'

// View/navigation state, kept separate from the domain store so hive/flower actions
// stay pure domain mutations. Navigation is always explicit - nothing in the domain
// store reaches in here to change the tab or move the map.
interface UiState {
  view: WorkspaceView
  // A one-shot request for the map to fly somewhere; the nonce lets MapView react even
  // when the same coordinates are requested twice.
  flyRequest: { lat: number; lon: number; zoom: number; nonce: number } | null

  setView: (v: WorkspaceView) => void
  flyTo: (lat: number, lon: number, zoom: number) => void
}

export const useUiStore = create<UiState>((set) => ({
  view: 'map',
  flyRequest: null,

  setView: (view) => set({ view }),

  flyTo: (lat, lon, zoom) =>
    set((s) => ({ flyRequest: { lat, lon, zoom, nonce: (s.flyRequest?.nonce ?? 0) + 1 } })),
}))
