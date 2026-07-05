import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchCurrentWeather, fetchGddTotal } from './weather'

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

describe('fetchGddTotal', () => {
  it('sums growing-degree-days above the base 5C, ignoring nulls', async () => {
    stubJson({ daily: { temperature_2m_mean: [10, 4, null, 8] } })
    // max(0,10-5) + max(0,4-5) + 0 + max(0,8-5) = 5 + 0 + 0 + 3 = 8
    expect(await fetchGddTotal(54, -6)).toBe(8)
  })

  it('returns 0 when the archive has no daily means', async () => {
    stubJson({})
    expect(await fetchGddTotal(54, -6)).toBe(0)
  })

  it('returns null on an HTTP error', async () => {
    stubJson({}, 500)
    expect(await fetchGddTotal(54, -6)).toBeNull()
  })
})
