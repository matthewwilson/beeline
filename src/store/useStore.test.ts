import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchOverpass, overpassToFeatures } from '../services/overpass'
import { fetchHabitats } from '../services/habitats'
import { fetchElevations } from '../services/elevation'
import { fetchDailyForecast } from '../services/weather'
import { useStore } from './useStore'
import type { DailyForecast, Feature, Hive } from '../types'

// The store orchestrates the service layer; mock it so the tests drive resolution timing
// and stay offline.
vi.mock('../services/overpass', () => ({
  fetchOverpass: vi.fn(),
  overpassToFeatures: vi.fn(() => [] as Feature[]),
}))
vi.mock('../services/habitats', () => ({ fetchHabitats: vi.fn(async () => [] as Feature[]) }))
vi.mock('../services/weather', () => ({
  fetchCurrentWeather: vi.fn(async () => null),
  fetchDailyForecast: vi.fn(async () => null),
  fetchGrowingDegreeDaysTotal: vi.fn(async () => null),
}))
vi.mock('../services/nationalBiodiversityNetwork', () => ({ fetchHornetCount: vi.fn(async () => null) }))
vi.mock('../services/elevation', () => ({ fetchElevations: vi.fn(async () => null) }))
vi.mock('../storage', () => ({
  loadHives: () => [],
  loadFlowers: () => [],
  loadMyHiveIds: () => [],
  saveHives: vi.fn(),
  saveFlowers: vi.fn(),
  saveMyHiveIds: vi.fn(),
}))

function deferred<T>(): { promise: Promise<T>; resolve: (v: T) => void } {
  let resolve!: (v: T) => void
  const promise = new Promise<T>((r) => (resolve = r))
  return { promise, resolve }
}

const flush = () => new Promise((r) => setTimeout(r, 0))

const hiveA: Hive = { id: 1, name: 'A', lat: 54, lon: -6, createdAt: '' }
const hiveB: Hive = { id: 2, name: 'B', lat: 55, lon: -7, createdAt: '' }

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(fetchOverpass).mockResolvedValue([])
  vi.mocked(fetchHabitats).mockResolvedValue([])
  vi.mocked(fetchElevations).mockResolvedValue(null)
  useStore.setState({
    activeHive: null,
    landFeatures: [],
    landCoverAvailable: false,
    features: [],
    flowers: [],
    forageStatus: 'idle',
    showDroneCongregationArea: false,
    droneCongregationAreaCells: [],
    droneCongregationAreaStatus: 'idle',
  })
})
afterEach(() => vi.clearAllMocks())

describe('selectHive stale-request guard', () => {
  it('ignores a slow forage result for a hive that is no longer active', async () => {
    // overpassToFeatures returns a feature tagged with the hive it was scored against.
    vi.mocked(overpassToFeatures).mockImplementation((_els, hive) => [
      { key: 'meadow', name: hive.lat === hiveB.lat ? 'B' : 'A', lat: hive.lat, lon: hive.lon, distance: 0, dir: 'N', confidence: 'openStreetMap' },
    ])

    const first = deferred<[]>()
    const second = deferred<[]>()
    vi.mocked(fetchOverpass).mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise)

    useStore.getState().selectHive(hiveA)
    useStore.getState().selectHive(hiveB)
    expect(useStore.getState().activeHive).toBe(hiveB)

    // Resolve B (current) then A (stale). A must not clobber B's features.
    second.resolve([])
    await flush()
    first.resolve([])
    await flush()

    expect(useStore.getState().activeHive).toBe(hiveB)
    expect(useStore.getState().features).toHaveLength(1)
    expect(useStore.getState().features[0].name).toBe('B')
  })

  it('merges overlapping OSM and surveyed land features', async () => {
    vi.mocked(overpassToFeatures).mockReturnValueOnce([
      { key: 'meadow', name: 'OSM meadow', lat: hiveA.lat, lon: hiveA.lon, distance: 0, dir: 'N', confidence: 'openStreetMap' },
    ])
    vi.mocked(fetchHabitats).mockResolvedValueOnce([
      { key: 'meadow', name: 'Surveyed meadow', lat: hiveA.lat, lon: hiveA.lon, distance: 0, dir: 'N', confidence: 'surveyed', area: 4 },
    ])

    useStore.getState().selectHive(hiveA)
    await flush()

    expect(useStore.getState().landFeatures).toHaveLength(1)
    expect(useStore.getState().landFeatures[0].confidence).toBe('surveyed')
    expect(useStore.getState().landFeatures[0].area).toBe(4)
  })
})

describe('weather forecast', () => {
  it('stores a fresh 7-day forecast for the active hive', async () => {
    const forecast: DailyForecast[] = [{ date: '2026-07-06', tempMax: 18, windMax: 10, precip: 0 }]
    vi.mocked(fetchDailyForecast).mockResolvedValueOnce(forecast)

    useStore.getState().selectHive(hiveA)
    await flush()

    expect(useStore.getState().weather.forecast).toEqual(forecast)
  })

  it('ignores a slow forecast for a hive that is no longer active', async () => {
    const slow = deferred<DailyForecast[]>()
    vi.mocked(fetchDailyForecast).mockReturnValueOnce(slow.promise).mockResolvedValueOnce([])

    useStore.getState().selectHive(hiveA)
    useStore.getState().selectHive(hiveB)
    await flush()

    // Hive A's forecast resolves late; it must not land on hive B.
    slow.resolve([{ date: '2026-07-06', tempMax: 18, windMax: 10, precip: 0 }])
    await flush()

    expect(useStore.getState().weather.forecast).toEqual([])
  })
})

describe('saveFlower / removeFlower', () => {
  it('merges an observed flower into the features for the active hive', () => {
    useStore.setState({
      activeHive: hiveA,
      landFeatures: [],
      features: [],
      flowers: [],
      pendingFlower: { lat: 54.001, lon: -6 },
    })

    useStore.getState().saveFlower('Clover', 'meadow', 'covered in bees')
    const st = useStore.getState()
    expect(st.flowers).toHaveLength(1)
    expect(st.pendingFlower).toBeNull()
    expect(st.features.some((f) => f.confidence === 'observed')).toBe(true)

    useStore.getState().removeFlower(st.flowers[0].id)
    expect(useStore.getState().flowers).toHaveLength(0)
    expect(useStore.getState().features.some((f) => f.confidence === 'observed')).toBe(false)
  })

  it('attaches plant-specific bloom metadata to recognised observed flowers', () => {
    useStore.setState({
      activeHive: hiveA,
      landFeatures: [],
      features: [],
      flowers: [],
      pendingFlower: { lat: 54.001, lon: -6 },
    })

    useStore.getState().saveFlower('Ivy', 'scrub', '')
    const observed = useStore.getState().features.find((f) => f.confidence === 'observed')

    expect(observed?.bloom).toEqual([240, 260, 300, 325])
    expect(observed?.offSeasonFloor).toBe(0.03)
  })
})

describe('drone congregation area loading', () => {
  it('does not commit a DCA result after the layer is toggled off', async () => {
    vi.mocked(fetchOverpass).mockResolvedValueOnce([])
    vi.mocked(fetchHabitats).mockResolvedValueOnce([])
    const elevations = deferred<number[] | null>()
    vi.mocked(fetchElevations).mockReturnValueOnce(elevations.promise)

    useStore.getState().selectHive(hiveA)
    await flush()
    useStore.getState().toggleDroneCongregationArea()
    expect(useStore.getState().droneCongregationAreaStatus).toBe('loading')

    useStore.getState().toggleDroneCongregationArea()
    elevations.resolve([1])
    await flush()

    expect(useStore.getState().showDroneCongregationArea).toBe(false)
    expect(useStore.getState().droneCongregationAreaStatus).toBe('idle')
    expect(useStore.getState().droneCongregationAreaCells).toEqual([])
  })

  it('marks DCA as terrain-only when land-cover data is unavailable', async () => {
    vi.mocked(fetchOverpass).mockResolvedValueOnce(null)
    vi.mocked(fetchHabitats).mockResolvedValueOnce([])
    vi.mocked(fetchElevations).mockResolvedValueOnce(Array.from({ length: 441 }, () => 50))

    useStore.getState().selectHive(hiveA)
    await flush()
    useStore.getState().toggleDroneCongregationArea()
    await flush()

    expect(useStore.getState().droneCongregationAreaStatus).toBe('partial-land-cover')
    expect(useStore.getState().droneCongregationAreaCells.length).toBeGreaterThan(0)
  })

  it('marks DCA as land-cover-only when elevation is unavailable', async () => {
    vi.mocked(overpassToFeatures).mockReturnValueOnce([
      { key: 'meadow', name: 'Meadow', lat: hiveA.lat, lon: hiveA.lon, distance: 0, dir: 'N', confidence: 'openStreetMap' },
    ])
    vi.mocked(fetchElevations).mockResolvedValueOnce(null)

    useStore.getState().selectHive(hiveA)
    await flush()
    useStore.getState().toggleDroneCongregationArea()
    await flush()

    expect(useStore.getState().landCoverAvailable).toBe(true)
    expect(useStore.getState().droneCongregationAreaStatus).toBe('partial-elevation')
  })

  it('marks DCA as low-confidence partial when both elevation and land cover are unavailable', async () => {
    vi.mocked(fetchOverpass).mockResolvedValueOnce(null)
    vi.mocked(fetchHabitats).mockResolvedValueOnce([])
    vi.mocked(fetchElevations).mockResolvedValueOnce(null)

    useStore.getState().selectHive(hiveA)
    await flush()
    useStore.getState().toggleDroneCongregationArea()
    await flush()

    expect(useStore.getState().landCoverAvailable).toBe(false)
    expect(useStore.getState().droneCongregationAreaStatus).toBe('partial')
  })

  it('waits for forage loading before starting a toggled-on DCA scan', async () => {
    const overpass = deferred<[]>()
    vi.mocked(fetchOverpass).mockReturnValueOnce(overpass.promise)

    useStore.getState().selectHive(hiveA)
    useStore.getState().toggleDroneCongregationArea()

    expect(useStore.getState().droneCongregationAreaStatus).toBe('loading')
    expect(fetchElevations).not.toHaveBeenCalled()

    overpass.resolve([])
    await flush()

    expect(fetchElevations).toHaveBeenCalledOnce()
  })
})
