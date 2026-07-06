import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchOverpass, overpassToFeatures } from '../services/overpass'
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
  fetchGddTotal: vi.fn(async () => null),
}))
vi.mock('../services/nbn', () => ({ fetchHornetCount: vi.fn(async () => null) }))
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
  useStore.setState({ activeHive: null, landFeatures: [], features: [], flowers: [], forageStatus: 'idle' })
})
afterEach(() => vi.clearAllMocks())

describe('selectHive stale-request guard', () => {
  it('ignores a slow forage result for a hive that is no longer active', async () => {
    // overpassToFeatures returns a feature tagged with the hive it was scored against.
    vi.mocked(overpassToFeatures).mockImplementation((_els, hive) => [
      { key: 'meadow', name: hive.lat === hiveB.lat ? 'B' : 'A', lat: hive.lat, lon: hive.lon, distance: 0, dir: 'N', confidence: 'osm' },
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
})
