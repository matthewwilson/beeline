import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchHabitatOpportunities } from './habitatNetworks'

afterEach(() => vi.unstubAllGlobals())

describe('fetchHabitatOpportunities', () => {
  it('queries one network layer and keeps only published opportunity polygons', async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL) =>
      new Response(
        JSON.stringify({
          features: [
            {
              properties: { Class: 'Network Expansion Zone' },
              geometry: { type: 'Polygon', coordinates: [[[-6, 54], [-6, 54.1], [-5.9, 54], [-6, 54]]] },
            },
            { properties: { Class: 'Primary Habitat' }, geometry: { type: 'Polygon', coordinates: [] } },
            { properties: { Class: 'Restorable Habitat' }, geometry: { type: 'Point', coordinates: [-6, 54] } },
          ],
        }),
      ),
    )
    vi.stubGlobal('fetch', fetchMock)

    const result = await fetchHabitatOpportunities('lowlandMeadow', { lat: 54, lon: -6 })

    expect(result).toEqual([
      {
        habitat: 'lowlandMeadow',
        networkClass: 'Network Expansion Zone',
        geometry: { type: 'Polygon', coordinates: [[[-6, 54], [-6, 54.1], [-5.9, 54], [-6, 54]]] },
      },
    ])
    const url = new URL(String(fetchMock.mock.calls[0][0]))
    expect(url.pathname).toContain('/Lowland_Meadow_Habitat_Network/FeatureServer/1/query')
    expect(url.searchParams.get('outFields')).toBe('Class')
    expect(url.searchParams.get('where')).toContain("'Network Expansion Zone'")
    expect(url.searchParams.get('where')).not.toContain('Primary Habitat')
    expect(url.searchParams.get('f')).toBe('geojson')
    expect(url.searchParams.get('outSR')).toBe('4326')
  })

  it('distinguishes service failure from a successful empty response', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('no', { status: 503 })))
    await expect(fetchHabitatOpportunities('heath', { lat: 54, lon: -6 })).resolves.toBeNull()

    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ features: [] }))))
    await expect(fetchHabitatOpportunities('heath', { lat: 54, lon: -6 })).resolves.toEqual([])
  })
})
