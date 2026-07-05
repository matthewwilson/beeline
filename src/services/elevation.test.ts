import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchElevations } from './elevation'
import type { LatLon } from '../types'

afterEach(() => vi.unstubAllGlobals())

function points(n: number): LatLon[] {
  return Array.from({ length: n }, (_, i) => ({ lat: 54 + i / 1000, lon: -6 }))
}

// Echoes one elevation per requested coordinate, so chunked requests concatenate correctly.
function stubEchoElevations(): void {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      const lats = new URL(url).searchParams.get('latitude')?.split(',') ?? []
      return new Response(JSON.stringify({ elevation: lats.map(() => 100) }), { status: 200 })
    }),
  )
}

describe('fetchElevations', () => {
  it('returns [] for no points without fetching', async () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    expect(await fetchElevations([])).toEqual([])
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('chunks large grids (>100 points) and concatenates the results', async () => {
    stubEchoElevations()
    const result = await fetchElevations(points(250))
    expect(result).toHaveLength(250)
    expect(fetch).toHaveBeenCalledTimes(3) // 100 + 100 + 50
  })

  it('returns null when a chunk length does not match the request', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ elevation: [1, 2] }), { status: 200 })))
    expect(await fetchElevations(points(3))).toBeNull()
  })

  it('returns null on an HTTP error', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('err', { status: 500 })))
    expect(await fetchElevations(points(3))).toBeNull()
  })
})
