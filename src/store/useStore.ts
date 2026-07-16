import { create } from 'zustand'
import { distanceMetres } from '../lib/geo'
import { makeFeature } from '../lib/features'
import { buildGrid, scoreGrid, type DroneCongregationAreaCell } from '../lib/droneCongregationArea'
import { foragePlantByName } from '../data/plants'
import { confidenceForSource } from '../data/sources'
import { jurisdictionAt, jurisdictionsWithinRadius } from '../data/jurisdictions'
import { fetchOverpass, overpassToFeatures } from '../services/overpass'
import { fetchRegionalHabitats } from '../services/regionalHabitats'
import { fetchElevations } from '../services/elevation'
import { fetchCurrentWeather, fetchDailyForecast, fetchGrowingDegreeDaysProfile, fetchHourlyForecast } from '../services/weather'
import { fetchHornetRecords } from '../services/biosecurity'
import {
  loadFlowers,
  loadHives,
  loadMyHiveIds,
  saveFlowers,
  saveHives,
  saveMyHiveIds,
} from '../storage'
import type { CurrentWeather, DailyForecast, Feature, Flower, ForageKey, Hive, HourlyWeather, Jurisdiction, LatLon, PollenKey, Season } from '../types'

export type ForageStatus = 'idle' | 'scanning' | 'busy' | 'empty' | 'ready'

// Partial statuses say which live input was missing. If both land cover and elevation fail, the
// model still renders a low-confidence neutral grid rather than throwing into the UI.
export type DroneCongregationAreaStatus = 'idle' | 'loading' | 'ready' | 'partial-elevation' | 'partial-land-cover' | 'partial'

interface WeatherState {
  current: CurrentWeather | null
  forecast: DailyForecast[] | null
  hourly: HourlyWeather[] | null
  growingDegreeDaysTotal: number | null
  growingDegreeDaysOffsetDays: number
  meanCumulativeGrowingDegreeDaysByDay: number[] | null
  loading: boolean
}

interface BioState {
  loading: boolean
  hornetCount: number | null
  provider: string | null
  failed: boolean
}

const initialWeather: WeatherState = {
  current: null,
  forecast: null,
  hourly: null,
  growingDegreeDaysTotal: null,
  growingDegreeDaysOffsetDays: 0,
  meanCumulativeGrowingDegreeDaysByDay: null,
  loading: false,
}
const initialBio: BioState = { loading: false, hornetCount: null, provider: null, failed: false }

// Guards against stale async results when the user switches hives mid-fetch.
let selectionToken = 0
let droneCongregationAreaToken = 0

function flowerFeatures(flowers: Flower[], hive: LatLon): Feature[] {
  return flowers.map((f) => {
    const plant = foragePlantByName(f.plant)
    return makeFeature(f.key, `🌼 ${f.plant}`, f, hive, 'userObservation', {
      bloom: plant?.bloom,
      offSeasonFloor: plant?.offSeasonFloor,
    })
  })
}

// `land` is already distance-filtered by loadForage; only the observed flowers need trimming.
function mergeFeatures(land: Feature[], flowers: Flower[], hive: LatLon): Feature[] {
  const observed = flowerFeatures(flowers, hive).filter((f) => f.distance <= 5000)
  return [...land, ...observed]
}

const confidenceRank = { observed: 3, surveyed: 2, openStreetMap: 1 } as const

function mergeNearbyLandFeatures(features: Feature[]): Feature[] {
  const merged: Feature[] = []
  for (const feature of [...features].sort(
    (a, b) => confidenceRank[confidenceForSource(b.source)] - confidenceRank[confidenceForSource(a.source)],
  )) {
    const existing = merged.find((candidate) => candidate.key === feature.key && distanceMetres(candidate, feature) < 120)
    if (!existing) {
      merged.push(feature)
      continue
    }
    const area = Math.max(existing.area ?? 0, feature.area ?? 0)
    existing.area = area > 0 ? area : existing.area ?? feature.area
    existing.scoreMultiplier = Math.max(existing.scoreMultiplier ?? 1, feature.scoreMultiplier ?? 1)
    if (!existing.geometry && feature.geometry) existing.geometry = feature.geometry
  }
  return merged
}

interface BeeState {
  hives: Hive[]
  flowers: Flower[]
  myHiveIds: number[]
  activeHive: Hive | null
  activeJurisdiction: Jurisdiction
  landFeatures: Feature[]
  landCoverAvailable: boolean
  features: Feature[]
  forageStatus: ForageStatus
  selectedPollen: PollenKey | null
  season: Season
  weather: WeatherState
  biosecurity: BioState
  placingFlower: boolean
  pendingFlower: LatLon | null
  pendingHive: LatLon | null
  showConfidenceLayer: boolean
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
  toggleConfidenceLayer: () => void
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
    set((s) => ({
      weather: {
        ...s.weather,
        loading: true,
        current: null,
        forecast: null,
        hourly: null,
        growingDegreeDaysTotal: null,
        growingDegreeDaysOffsetDays: 0,
        meanCumulativeGrowingDegreeDaysByDay: null,
      },
    }))

    // Weather calls are independent, so start them together and commit each result as it lands.
    const forecastPromise = fetchDailyForecast(hive.lat, hive.lon)
    const hourlyPromise = fetchHourlyForecast(hive.lat, hive.lon)
    const currentPromise = fetchCurrentWeather(hive.lat, hive.lon)
    const growingDegreeDaysPromise = fetchGrowingDegreeDaysProfile(hive.lat, hive.lon)

    void forecastPromise.then((forecast) => {
      if (token !== selectionToken || !forecast) return
      set((s) => ({ weather: { ...s.weather, forecast } }))
    })

    void hourlyPromise.then((hourly) => {
      if (token !== selectionToken || !hourly) return
      set((s) => ({ weather: { ...s.weather, hourly } }))
    })

    const current = await currentPromise
    if (token !== selectionToken) return
    set((s) => ({ weather: { ...s.weather, current, loading: false } }))

    const growingDegreeDaysProfile = await growingDegreeDaysPromise
    if (token !== selectionToken || !growingDegreeDaysProfile) return
    set((s) => ({
      weather: {
        ...s.weather,
        growingDegreeDaysTotal: growingDegreeDaysProfile.total,
        growingDegreeDaysOffsetDays: growingDegreeDaysProfile.seasonOffsetDays,
        meanCumulativeGrowingDegreeDaysByDay: growingDegreeDaysProfile.meanCumulativeByDay,
      },
    }))
  }

  async function loadBiosecurity(hive: Hive, jurisdiction: Jurisdiction, token: number) {
    if (jurisdiction === 'unsupported') {
      set({ biosecurity: initialBio })
      return
    }
    set({ biosecurity: { loading: true, hornetCount: null, provider: null, failed: false } })
    const result = await fetchHornetRecords(jurisdiction, hive)
    if (token !== selectionToken) return
    set({
      biosecurity: {
        loading: false,
        hornetCount: result?.count ?? null,
        provider: result?.provider ?? null,
        failed: result === null,
      },
    })
  }

  async function loadForage(hive: Hive, token: number) {
    set({
      forageStatus: 'scanning',
      landFeatures: [],
      landCoverAvailable: false,
      features: [],
      droneCongregationAreaCells: [],
      droneCongregationAreaStatus: get().showDroneCongregationArea ? 'loading' : 'idle',
      status: 'Reading the landscape around this hive…',
    })
    const [elements, habitatResult] = await Promise.all([
      fetchOverpass(hive.lat, hive.lon),
      fetchRegionalHabitats(jurisdictionsWithinRadius(hive, 5000), hive),
    ])
    if (token !== selectionToken) return

    const openStreetMap = elements ? overpassToFeatures(elements, hive) : []
    const landCoverAvailable = elements !== null || habitatResult.successfulSources.length > 0
    const land = mergeNearbyLandFeatures([...openStreetMap, ...habitatResult.features].filter((f) => f.distance <= 5000))
    const features = mergeFeatures(land, get().flowers, hive)

    let forageStatus: ForageStatus = 'ready'
    if (elements === null && habitatResult.successfulSources.length === 0 && features.length === 0) forageStatus = 'busy'
    else if (features.length === 0) forageStatus = 'empty'

    set({ landFeatures: land, landCoverAvailable, features, forageStatus, status: '' })

    if (get().showDroneCongregationArea) void loadDroneCongregationArea(hive, token)
  }

  // Scores a grid of candidate spots around the hive for drone-congregation-area
  // suitability (see lib/droneCongregationArea.ts). Reuses the land features already fetched by loadForage;
  // elevation is fetched here and the model degrades to land-cover-only if it fails.
  async function loadDroneCongregationArea(hive: Hive, token: number) {
    const requestToken = ++droneCongregationAreaToken
    set({ droneCongregationAreaCells: [], droneCongregationAreaStatus: 'loading' })
    const grid = buildGrid(hive)
    const elevations = await fetchElevations(grid.points)
    if (token !== selectionToken || requestToken !== droneCongregationAreaToken || !get().showDroneCongregationArea) return
    const cells = scoreGrid(grid, elevations, get().landFeatures)
    const landCoverAvailable = get().landCoverAvailable
    let droneCongregationAreaStatus: DroneCongregationAreaStatus = 'ready'
    if (!elevations && !landCoverAvailable) droneCongregationAreaStatus = 'partial'
    else if (!elevations) droneCongregationAreaStatus = 'partial-elevation'
    else if (!landCoverAvailable) droneCongregationAreaStatus = 'partial-land-cover'
    set({ droneCongregationAreaCells: cells, droneCongregationAreaStatus })
  }

  return {
    hives: [],
    flowers: [],
    myHiveIds: [],
    activeHive: null,
    activeJurisdiction: 'unsupported',
    landFeatures: [],
    landCoverAvailable: false,
    features: [],
    forageStatus: 'idle',
    selectedPollen: null,
    season: 'auto',
    weather: initialWeather,
    biosecurity: initialBio,
    placingFlower: false,
    pendingFlower: null,
    pendingHive: null,
    showConfidenceLayer: false,
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

    toggleConfidenceLayer: () => set((s) => ({ showConfidenceLayer: !s.showConfidenceLayer })),

    toggleBeeFlights: () => set((s) => ({ showBeeFlights: !s.showBeeFlights })),

    toggleMatingRadius: () => set((s) => ({ showMatingRadius: !s.showMatingRadius })),

    toggleDroneCongregationArea: () => {
      const on = !get().showDroneCongregationArea
      set({ showDroneCongregationArea: on })
      const hive = get().activeHive
      if (on && hive && get().forageStatus !== 'scanning') void loadDroneCongregationArea(hive, selectionToken)
      else if (on && hive) set({ droneCongregationAreaStatus: 'loading' })
      else if (!on) {
        droneCongregationAreaToken++
        set({ droneCongregationAreaCells: [], droneCongregationAreaStatus: 'idle' })
      }
    },

    selectHive: (hive) => {
      const token = ++selectionToken
      const jurisdiction = jurisdictionAt(hive)
      set({ activeHive: hive, activeJurisdiction: jurisdiction })
      void loadWeather(hive, token)
      void loadBiosecurity(hive, jurisdiction, token)
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
          activeJurisdiction: 'unsupported',
          features: [],
          landFeatures: [],
          landCoverAvailable: false,
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
