import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchJson } from './http'

afterEach(() => vi.unstubAllGlobals())

function stubFetch(impl: () => Promise<Response>): void {
  vi.stubGlobal('fetch', vi.fn(impl))
}

describe('fetchJson', () => {
  it('returns the parsed body on a 2xx response', async () => {
    stubFetch(async () => new Response(JSON.stringify({ a: 1 }), { status: 200 }))
    expect(await fetchJson('https://x')).toEqual({ a: 1 })
  })

  it('returns null on a non-2xx status', async () => {
    stubFetch(async () => new Response('boom', { status: 500 }))
    expect(await fetchJson('https://x')).toBeNull()
  })

  it('returns null when fetch rejects (network error / timeout)', async () => {
    stubFetch(async () => {
      throw new Error('network')
    })
    expect(await fetchJson('https://x')).toBeNull()
  })

  it('returns null on a malformed JSON body', async () => {
    stubFetch(async () => new Response('not json', { status: 200 }))
    expect(await fetchJson('https://x')).toBeNull()
  })
})
