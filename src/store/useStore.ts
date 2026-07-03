import { create } from 'zustand'
import { bearing, clamp, dayOfYear, distanceMetres } from '../lib/geo'
import { expectedGdd } from '../lib/scoring'
import { fetchOverpass, overpassToFeatures } from '../services/overpass'
import { fetchHabitats } from '../services/habitats'
import { fetchCurrentWeather, fetchGddTotal } from '../services/weather'
import { fetchHornetCount } from '../services/nbn'
import {
  loadFlowers,
  loadHives,
  loadMyHiveIds,
  saveFlowers,
  saveHives,
  saveMyHiveIds,
} from '../storage'
import type { CurrentWeather, Feature, Flower, ForageKey, Hive, LatLon, PollenKey, Season } from '../types'

export type ForageStatus = 'idle' | 'scanning' | 'busy' | 'empty' | 'ready'

export type MobileView = 'map' | 'controls' | 'results'

interface WeatherState {
  current: CurrentWeather | null
  gddTotal: number | null
  gddOffsetDays: number
  loading: boolean
}

interface BioState {
  loading: boolean
  hornetCount: number | null
  failed: boolean
}

const initialWeather: WeatherState = { current: null, gddTotal: null, gddOffsetDays: 0, loading: false }
const initialBio: BioState = { loading: false, hornetCount: null, failed: false }

// Guards against stale async results when the user switches hives mid-fetch.
let selectionToken = 0

function flowerFeatures(flowers: Flower[], hive: LatLon): Feature[] {
  return flowers.map((f) => ({
    key: f.key,
    name: `🌼 ${f.plant}`,
    lat: f.lat,
    lon: f.lon,
    distance: distanceMetres(hive, f),
    dir: bearing(hive, f),
    confidence: 'observed',
  }))
}

function mergeFeatures(land: Feature[], flowers: Flower[], hive: LatLon): Feature[] {
  return [...land, ...flowerFeatures(flowers, hive)].filter((f) => f.distance <= 5000)
}

interface BeeState {
  hives: Hive[]
  flowers: Flower[]
  myHiveIds: number[]
  activeHive: Hive | null
  landFeatures: Feature[]
  features: Feature[]
  forageStatus: ForageStatus
  selectedPollen: PollenKey | null
  season: Season
  weather: WeatherState
  biosecurity: BioState
  placingFlower: boolean
  pendingFlower: LatLon | null
  showBeeFlights: boolean
  status: string
  mobileView: MobileView
  flyRequest: { lat: number; lon: number; zoom: number; nonce: number } | null

  init: () => void
  setMobileView: (v: MobileView) => void
  setStatus: (msg: string) => void
  setSeason: (s: Season) => void
  togglePollen: (k: PollenKey) => void
  toggleBeeFlights: () => void
  flyTo: (lat: number, lon: number, zoom: number) => void
  selectHive: (hive: Hive, focusResults?: boolean) => void
  addHive: (lat: number, lon: number, name: string) => void
  removeHive: (id: number) => void
  requestFlowerAt: (lat: number, lon: number) => void
  cancelFlower: () => void
  saveFlower: (plant: string, key: ForageKey, note: string) => void
  removeFlower: (id: number) => void
  setPlacingFlower: (v: boolean) => void
}

export const useStore = create<BeeState>((set, get) => {
  async function loadWeather(hive: Hive, token: number) {
    set((s) => ({ weather: { ...s.weather, loading: true, current: null } }))
    const current = await fetchCurrentWeather(hive.lat, hive.lon)
    if (token !== selectionToken) return
    set((s) => ({ weather: { ...s.weather, current, loading: false } }))

    const gddTotal = await fetchGddTotal(hive.lat, hive.lon)
    if (token !== selectionToken || gddTotal == null) return
    const cur = get().weather.current
    const perDay = Math.max(1, (cur ? cur.temperature_2m : 12) - 5)
    const gddOffsetDays = clamp(Math.round((gddTotal - expectedGdd(dayOfYear())) / perDay), -25, 25)
    set((s) => ({ weather: { ...s.weather, gddTotal, gddOffsetDays } }))
  }

  async function loadBiosecurity(hive: Hive, token: number) {
    set({ biosecurity: { loading: true, hornetCount: null, failed: false } })
    const count = await fetchHornetCount(hive.lat, hive.lon)
    if (token !== selectionToken) return
    set({ biosecurity: { loading: false, hornetCount: count, failed: count === null } })
  }

  async function loadForage(hive: Hive, token: number) {
    set({
      forageStatus: 'scanning',
      landFeatures: [],
      features: [],
      status: 'Reading the landscape around this hive…',
    })
    const [elements, habitats] = await Promise.all([
      fetchOverpass(hive.lat, hive.lon),
      fetchHabitats(hive),
    ])
    if (token !== selectionToken) return

    const osm = elements ? overpassToFeatures(elements, hive) : []
    const land = [...osm, ...habitats].filter((f) => f.distance <= 5000)
    const features = mergeFeatures(land, get().flowers, hive)

    let forageStatus: ForageStatus = 'ready'
    if (!elements && features.length === 0) forageStatus = 'busy'
    else if (features.length === 0) forageStatus = 'empty'

    set({ landFeatures: land, features, forageStatus, status: '' })
  }

  return {
    hives: [],
    flowers: [],
    myHiveIds: [],
    activeHive: null,
    landFeatures: [],
    features: [],
    forageStatus: 'idle',
    selectedPollen: null,
    season: 'auto',
    weather: initialWeather,
    biosecurity: initialBio,
    placingFlower: false,
    pendingFlower: null,
    showBeeFlights: false,
    status: '',
    mobileView: 'map',
    flyRequest: null,

    init: () => set({ hives: loadHives(), flowers: loadFlowers(), myHiveIds: loadMyHiveIds() }),

    setMobileView: (mobileView) => set({ mobileView }),

    setStatus: (msg) => set({ status: msg }),

    setSeason: (season) => set({ season }),

    togglePollen: (k) => set((s) => ({ selectedPollen: s.selectedPollen === k ? null : k })),

    toggleBeeFlights: () => set((s) => ({ showBeeFlights: !s.showBeeFlights })),

    flyTo: (lat, lon, zoom) =>
      set((s) => ({ flyRequest: { lat, lon, zoom, nonce: (s.flyRequest?.nonce ?? 0) + 1 } })),

    selectHive: (hive, focusResults = false) => {
      const token = ++selectionToken
      // Tapping a hive on the map keeps you on the map (rings + bee flights show
      // there); only a deliberate add jumps to the Forage results on mobile.
      set(focusResults ? { activeHive: hive, mobileView: 'results' } : { activeHive: hive })
      void loadWeather(hive, token)
      void loadBiosecurity(hive, token)
      void loadForage(hive, token)
    },

    addHive: (lat, lon, name) => {
      const hives = get().hives
      const id = Math.max(0, ...hives.map((h) => h.id)) + 1
      const hive: Hive = {
        id,
        name: (name.trim() || 'My hive').slice(0, 60),
        lat,
        lon,
        createdAt: new Date().toISOString(),
      }
      const nextHives = [...hives, hive]
      const myHiveIds = [...get().myHiveIds, id]
      saveHives(nextHives)
      saveMyHiveIds(myHiveIds)
      set({ hives: nextHives, myHiveIds, status: 'Hive saved in this browser.' })
      get().selectHive(hive, true)
    },

    removeHive: (id) => {
      const hives = get().hives.filter((h) => h.id !== id)
      saveHives(hives)
      set({ hives })
      if (get().activeHive?.id === id) {
        selectionToken++
        set({
          activeHive: null,
          features: [],
          landFeatures: [],
          forageStatus: 'idle',
          weather: initialWeather,
          biosecurity: initialBio,
        })
      }
    },

    requestFlowerAt: (lat, lon) => set({ pendingFlower: { lat, lon }, placingFlower: false }),

    cancelFlower: () => set({ pendingFlower: null }),

    saveFlower: (plant, key, note) => {
      const pending = get().pendingFlower
      if (!pending) return
      const flowers = get().flowers
      const id = Math.max(0, ...flowers.map((f) => f.id)) + 1
      const flower: Flower = {
        id,
        plant: plant.slice(0, 60),
        key,
        note: note.trim().slice(0, 120),
        lat: pending.lat,
        lon: pending.lon,
        createdAt: new Date().toISOString(),
      }
      const next = [...flowers, flower]
      saveFlowers(next)
      set({
        flowers: next,
        pendingFlower: null,
        status: `Logged ${plant}. It now sharpens nearby forage predictions.`,
      })
      const hive = get().activeHive
      if (!hive) return
      const features = mergeFeatures(get().landFeatures, next, hive)
      set({ features, forageStatus: features.length ? 'ready' : get().forageStatus })
    },

    removeFlower: (id) => {
      const next = get().flowers.filter((f) => f.id !== id)
      saveFlowers(next)
      set({ flowers: next })
      const hive = get().activeHive
      if (!hive) return
      set({ features: mergeFeatures(get().landFeatures, next, hive) })
    },

    setPlacingFlower: (v) => set(v ? { placingFlower: v, mobileView: 'map' } : { placingFlower: v }),
  }
})
