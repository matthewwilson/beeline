import { create } from 'zustand'
import { clamp, dayOfYear } from '../lib/geo'
import { makeFeature } from '../lib/features'
import { buildGrid, scoreGrid, type DroneCongregationAreaCell } from '../lib/droneCongregationArea'
import { expectedGrowingDegreeDays } from '../lib/scoring'
import { fetchOverpass, overpassToFeatures } from '../services/overpass'
import { fetchHabitats } from '../services/habitats'
import { fetchElevations } from '../services/elevation'
import { fetchCurrentWeather, fetchDailyForecast, fetchGrowingDegreeDaysTotal } from '../services/weather'
import { fetchHornetCount } from '../services/nationalBiodiversityNetwork'
import {
  loadFlowers,
  loadHives,
  loadMyHiveIds,
  saveFlowers,
  saveHives,
  saveMyHiveIds,
} from '../storage'
import type { CurrentWeather, DailyForecast, Feature, Flower, ForageKey, Hive, LatLon, PollenKey, Season } from '../types'

export type ForageStatus = 'idle' | 'scanning' | 'busy' | 'empty' | 'ready'

// 'partial' = suitability shown but topography (elevation) was unavailable, so it rests
// on land cover alone.
export type DroneCongregationAreaStatus = 'idle' | 'loading' | 'ready' | 'partial'

interface WeatherState {
  current: CurrentWeather | null
  forecast: DailyForecast[] | null
  growingDegreeDaysTotal: number | null
  growingDegreeDaysOffsetDays: number
  loading: boolean
}

interface BioState {
  loading: boolean
  hornetCount: number | null
  failed: boolean
}

const initialWeather: WeatherState = {
  current: null,
  forecast: null,
  growingDegreeDaysTotal: null,
  growingDegreeDaysOffsetDays: 0,
  loading: false,
}
const initialBio: BioState = { loading: false, hornetCount: null, failed: false }

// Guards against stale async results when the user switches hives mid-fetch.
let selectionToken = 0

function flowerFeatures(flowers: Flower[], hive: LatLon): Feature[] {
  return flowers.map((f) => makeFeature(f.key, `🌼 ${f.plant}`, f, hive, 'observed'))
}

// `land` is already distance-filtered by loadForage; only the observed flowers need trimming.
function mergeFeatures(land: Feature[], flowers: Flower[], hive: LatLon): Feature[] {
  const observed = flowerFeatures(flowers, hive).filter((f) => f.distance <= 5000)
  return [...land, ...observed]
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
  pendingHive: LatLon | null
  showBeeFlights: boolean
  showMatingRadius: boolean
  showDroneCongregationArea: boolean
  droneCongregationAreaCells: DroneCongregationAreaCell[]
  droneCongregationAreaStatus: DroneCongregationAreaStatus
  status: string

  init: () => void
  setStatus: (msg: string) => void
  setSeason: (s: Season) => void
  togglePollen: (k: PollenKey) => void
  toggleBeeFlights: () => void
  toggleMatingRadius: () => void
  toggleDroneCongregationArea: () => void
  selectHive: (hive: Hive) => void
  requestHiveAt: (lat: number, lon: number) => void
  saveHive: (name: string) => void
  cancelHive: () => void
  removeHive: (id: number) => void
  requestFlowerAt: (lat: number, lon: number) => void
  cancelFlower: () => void
  saveFlower: (plant: string, key: ForageKey, note: string) => void
  removeFlower: (id: number) => void
  setPlacingFlower: (v: boolean) => void
}

export const useStore = create<BeeState>((set, get) => {
  async function loadWeather(hive: Hive, token: number) {
    set((s) => ({ weather: { ...s.weather, loading: true, current: null, forecast: null } }))

    // Weather calls are independent, so start them together and commit each result as it lands.
    const forecastPromise = fetchDailyForecast(hive.lat, hive.lon)
    const currentPromise = fetchCurrentWeather(hive.lat, hive.lon)
    const growingDegreeDaysPromise = fetchGrowingDegreeDaysTotal(hive.lat, hive.lon)

    void forecastPromise.then((forecast) => {
      if (token !== selectionToken || !forecast) return
      set((s) => ({ weather: { ...s.weather, forecast } }))
    })

    const current = await currentPromise
    if (token !== selectionToken) return
    set((s) => ({ weather: { ...s.weather, current, loading: false } }))

    const growingDegreeDaysTotal = await growingDegreeDaysPromise
    if (token !== selectionToken || growingDegreeDaysTotal == null) return
    const perDay = Math.max(1, (current ? current.temperature_2m : 12) - 5)
    const growingDegreeDaysOffsetDays = clamp(Math.round((growingDegreeDaysTotal - expectedGrowingDegreeDays(dayOfYear())) / perDay), -25, 25)
    set((s) => ({ weather: { ...s.weather, growingDegreeDaysTotal, growingDegreeDaysOffsetDays } }))
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
      droneCongregationAreaCells: [],
      droneCongregationAreaStatus: get().showDroneCongregationArea ? 'loading' : 'idle',
      status: 'Reading the landscape around this hive…',
    })
    const [elements, habitats] = await Promise.all([
      fetchOverpass(hive.lat, hive.lon),
      fetchHabitats(hive),
    ])
    if (token !== selectionToken) return

    const openStreetMap = elements ? overpassToFeatures(elements, hive) : []
    const land = [...openStreetMap, ...habitats].filter((f) => f.distance <= 5000)
    const features = mergeFeatures(land, get().flowers, hive)

    let forageStatus: ForageStatus = 'ready'
    if (!elements && features.length === 0) forageStatus = 'busy'
    else if (features.length === 0) forageStatus = 'empty'

    set({ landFeatures: land, features, forageStatus, status: '' })

    if (get().showDroneCongregationArea) void loadDroneCongregationArea(hive, token)
  }

  // Scores a grid of candidate spots around the hive for drone-congregation-area
  // suitability (see lib/droneCongregationArea.ts). Reuses the land features already fetched by loadForage;
  // elevation is fetched here and the model degrades to land-cover-only if it fails.
  async function loadDroneCongregationArea(hive: Hive, token: number) {
    set({ droneCongregationAreaStatus: 'loading' })
    const grid = buildGrid(hive)
    const elevations = await fetchElevations(grid.points)
    if (token !== selectionToken) return
    const cells = scoreGrid(grid, elevations, get().landFeatures)
    set({ droneCongregationAreaCells: cells, droneCongregationAreaStatus: elevations ? 'ready' : 'partial' })
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
    pendingHive: null,
    showBeeFlights: false,
    showMatingRadius: false,
    showDroneCongregationArea: false,
    droneCongregationAreaCells: [],
    droneCongregationAreaStatus: 'idle',
    status: '',

    init: () => set({ hives: loadHives(), flowers: loadFlowers(), myHiveIds: loadMyHiveIds() }),

    setStatus: (msg) => set({ status: msg }),

    setSeason: (season) => set({ season }),

    togglePollen: (k) => set((s) => ({ selectedPollen: s.selectedPollen === k ? null : k })),

    toggleBeeFlights: () => set((s) => ({ showBeeFlights: !s.showBeeFlights })),

    toggleMatingRadius: () => set((s) => ({ showMatingRadius: !s.showMatingRadius })),

    toggleDroneCongregationArea: () => {
      const on = !get().showDroneCongregationArea
      set({ showDroneCongregationArea: on })
      const hive = get().activeHive
      if (on && hive) void loadDroneCongregationArea(hive, selectionToken)
      else if (!on) set({ droneCongregationAreaCells: [], droneCongregationAreaStatus: 'idle' })
    },

    selectHive: (hive) => {
      const token = ++selectionToken
      set({ activeHive: hive })
      void loadWeather(hive, token)
      void loadBiosecurity(hive, token)
      void loadForage(hive, token)
    },

    // Adding a hive is a two-step flow like adding a flower: pick the spot, then name it
    // in the HiveNamePicker modal. requestHiveAt opens the modal; saveHive commits it.
    requestHiveAt: (lat, lon) => set({ pendingHive: { lat, lon } }),

    cancelHive: () => set({ pendingHive: null }),

    saveHive: (name) => {
      const pending = get().pendingHive
      if (!pending) return
      const hives = get().hives
      const id = Math.max(0, ...hives.map((h) => h.id)) + 1
      const hive: Hive = {
        id,
        name: (name.trim() || 'My hive').slice(0, 60),
        lat: pending.lat,
        lon: pending.lon,
        createdAt: new Date().toISOString(),
      }
      const nextHives = [...hives, hive]
      const myHiveIds = [...get().myHiveIds, id]
      saveHives(nextHives)
      saveMyHiveIds(myHiveIds)
      set({ hives: nextHives, myHiveIds, pendingHive: null, status: 'Hive saved in this browser.' })
      get().selectHive(hive)
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
          droneCongregationAreaCells: [],
          droneCongregationAreaStatus: 'idle',
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

    setPlacingFlower: (v) => set({ placingFlower: v }),
  }
})
