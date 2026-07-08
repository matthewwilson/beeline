import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchCurrentWeather, fetchDailyForecast, fetchGrowingDegreeDaysTotal, fetchHourlyForecast } from './weather'

afterEach(() => vi.unstubAllGlobals())

function stubJson(body: unknown, status = 200): void {
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(body), { status })))
}

describe('fetchCurrentWeather', () => {
  it('returns the current block on success', async () => {
    const current = { temperature_2m: 14, wind_speed_10m: 8, precipitation: 0 }
    stubJson({ current })
    expect(await fetchCurrentWeather(54, -6)).toEqual(current)
  })

  it('returns null when the body has no current block', async () => {
    stubJson({})
    expect(await fetchCurrentWeather(54, -6)).toBeNull()
  })

  it('returns null on an HTTP error', async () => {
    stubJson({}, 503)
    expect(await fetchCurrentWeather(54, -6)).toBeNull()
  })
})

describe('fetchDailyForecast', () => {
  it('maps the parallel daily arrays into per-day objects', async () => {
    stubJson({
      daily: {
        time: ['2026-07-06', '2026-07-07'],
        temperature_2m_max: [18, 15],
        wind_speed_10m_max: [12, 30],
        precipitation_sum: [0, 3.2],
      },
    })
    expect(await fetchDailyForecast(54, -6)).toEqual([
      { date: '2026-07-06', tempMax: 18, windMax: 12, precip: 0 },
      { date: '2026-07-07', tempMax: 15, windMax: 30, precip: 3.2 },
    ])
  })

  it('skips days missing a max temperature and defaults absent wind/precip to 0', async () => {
    stubJson({
      daily: {
        time: ['2026-07-06', '2026-07-07'],
        temperature_2m_max: [null, 15],
      },
    })
    expect(await fetchDailyForecast(54, -6)).toEqual([{ date: '2026-07-07', tempMax: 15, windMax: 0, precip: 0 }])
  })

  it('returns null when there is no daily block', async () => {
    stubJson({})
    expect(await fetchDailyForecast(54, -6)).toBeNull()
  })

  it('returns null on an HTTP error', async () => {
    stubJson({}, 500)
    expect(await fetchDailyForecast(54, -6)).toBeNull()
  })
})

describe('fetchHourlyForecast', () => {
  it('maps the parallel hourly arrays into per-hour objects', async () => {
    stubJson({
      hourly: {
        time: ['2026-07-07T09:00', '2026-07-07T10:00'],
        temperature_2m: [12, 15],
        wind_speed_10m: [8, 12],
        precipitation: [0, 0.1],
      },
    })
    expect(await fetchHourlyForecast(54, -6)).toEqual([
      { time: '2026-07-07T09:00', temperature: 12, windSpeed: 8, precipitation: 0 },
      { time: '2026-07-07T10:00', temperature: 15, windSpeed: 12, precipitation: 0.1 },
    ])
  })

  it('skips incomplete hourly rows', async () => {
    stubJson({
      hourly: {
        time: ['2026-07-07T09:00', '2026-07-07T10:00'],
        temperature_2m: [12, null],
        wind_speed_10m: [8, 12],
        precipitation: [0, 0],
      },
    })
    expect(await fetchHourlyForecast(54, -6)).toEqual([
      { time: '2026-07-07T09:00', temperature: 12, windSpeed: 8, precipitation: 0 },
    ])
  })

  it('returns null when there is no hourly block', async () => {
    stubJson({})
    expect(await fetchHourlyForecast(54, -6)).toBeNull()
  })
})

describe('fetchGrowingDegreeDaysTotal', () => {
  it('sums growing-degree-days above the base 5C, ignoring nulls', async () => {
    stubJson({ daily: { temperature_2m_mean: [10, 4, null, 8] } })
    // max(0,10-5) + max(0,4-5) + 0 + max(0,8-5) = 5 + 0 + 0 + 3 = 8
    expect(await fetchGrowingDegreeDaysTotal(54, -6)).toBe(8)
  })

  it('returns 0 when the archive has no daily means', async () => {
    stubJson({})
    expect(await fetchGrowingDegreeDaysTotal(54, -6)).toBe(0)
  })

  it('returns null on an HTTP error', async () => {
    stubJson({}, 500)
    expect(await fetchGrowingDegreeDaysTotal(54, -6)).toBeNull()
  })
})
