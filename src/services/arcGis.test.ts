import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchArcGisFeatures, queryEnvelope } from './arcGis'

afterEach(() => vi.unstubAllGlobals())

describe('queryEnvelope', () => {
  it('builds a bounding box around the hive', () => {
    const values = queryEnvelope({ lat: 54, lon: -6 }, 1000).split(',').map(Number)
    expect(values[0]).toBeLessThan(-6)
    expect(values[1]).toBeLessThan(54)
    expect(values[2]).toBeGreaterThan(-6)
    expect(values[3]).toBeGreaterThan(54)
  })
})

describe('fetchArcGisFeatures', () => {
  it('continues through full result pages', async () => {
    const fullPage = Array.from({ length: 2000 }, (_, id) => ({ properties: { id } }))
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ features: fullPage })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ features: [{ properties: { id: 2000 } }] })))
    vi.stubGlobal('fetch', fetchMock)

    const records = await fetchArcGisFeatures('https://example.test/FeatureServer/0', { lat: 54, lon: -6 }, ['id'])
    expect(records).toHaveLength(2001)
    expect(new URL(String(fetchMock.mock.calls[1][0])).searchParams.get('resultOffset')).toBe('2000')
    expect(new URL(String(fetchMock.mock.calls[0][0])).searchParams.get('where')).toBe('1=1')
  })

  it('distinguishes a failed first page from an empty response', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('no', { status: 503 })))
    await expect(fetchArcGisFeatures('https://example.test/FeatureServer/0', { lat: 54, lon: -6 }, ['id'])).resolves.toBeNull()
  })
})
