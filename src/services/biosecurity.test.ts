import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchHornetRecords } from './biosecurity'

afterEach(() => vi.unstubAllGlobals())

describe('fetchHornetRecords', () => {
  it('uses NBN Atlas for UK jurisdictions', async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL) => new Response(JSON.stringify({ totalRecords: 4 })))
    vi.stubGlobal('fetch', fetchMock)

    await expect(fetchHornetRecords('scotland', { lat: 55.95, lon: -3.19 })).resolves.toEqual({
      count: 4,
      provider: 'NBN Atlas',
    })
    expect(String(fetchMock.mock.calls[0][0])).toContain('records-ws.nbnatlas.org')
  })

  it('uses NBDC-filtered GBIF records for the Republic of Ireland', async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL) => new Response(JSON.stringify({ count: 2 })))
    vi.stubGlobal('fetch', fetchMock)

    await expect(fetchHornetRecords('republicOfIreland', { lat: 53.35, lon: -6.26 })).resolves.toEqual({
      count: 2,
      provider: 'NBDC via GBIF',
    })
    const url = new URL(String(fetchMock.mock.calls[0][0]))
    expect(url.hostname).toBe('api.gbif.org')
    expect(url.searchParams.get('institution_code')).toBe('NBDC')
    expect(url.searchParams.get('geometry')).toMatch(/^POLYGON\(\(/)
  })

  it('skips country-specific checks in generic mode', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    await expect(fetchHornetRecords('unsupported', { lat: 54.15, lon: -4.49 })).resolves.toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
