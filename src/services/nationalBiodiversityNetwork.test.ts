import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchHornetCount } from './nationalBiodiversityNetwork'

afterEach(() => vi.unstubAllGlobals())

function stubJson(body: unknown, status = 200): void {
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(body), { status })))
}

describe('fetchHornetCount', () => {
  it('returns the record count on success', async () => {
    stubJson({ totalRecords: 3 })
    expect(await fetchHornetCount(54, -6)).toBe(3)
  })

  it('defaults to 0 when the field is missing', async () => {
    stubJson({})
    expect(await fetchHornetCount(54, -6)).toBe(0)
  })

  it('returns null (not 0) on an HTTP error, so a failed check is not read as "no hornets"', async () => {
    stubJson({ error: 'server' }, 500)
    expect(await fetchHornetCount(54, -6)).toBeNull()
  })
})
