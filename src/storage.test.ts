import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { loadFlowers, loadHives, loadMyHiveIds, saveHives } from './storage'
import type { Hive } from './types'

const HIVES_KEY = 'beeline-hives'
const FLOWERS_KEY = 'beeline-flowers'
const MY_HIVES_KEY = 'beeline-my-hives'

function memoryStorage(): Storage {
  const map = new Map<string, string>()
  return {
    getItem: (k) => (map.has(k) ? (map.get(k) as string) : null),
    setItem: (k, v) => void map.set(k, String(v)),
    removeItem: (k) => void map.delete(k),
    clear: () => map.clear(),
    key: (i) => Array.from(map.keys())[i] ?? null,
    get length() {
      return map.size
    },
  } as Storage
}

beforeEach(() => vi.stubGlobal('localStorage', memoryStorage()))
afterEach(() => vi.unstubAllGlobals())

describe('loadHives', () => {
  it('returns [] when nothing is stored', () => {
    expect(loadHives()).toEqual([])
  })

  it('drops entries without a numeric id', () => {
    localStorage.setItem(
      HIVES_KEY,
      JSON.stringify([{ id: 1, name: 'A', lat: 0, lon: 0, createdAt: '' }, { name: 'no id' }]),
    )
    const hives = loadHives()
    expect(hives).toHaveLength(1)
    expect(hives[0].id).toBe(1)
  })

  it('returns [] on malformed JSON', () => {
    localStorage.setItem(HIVES_KEY, '{ not json')
    expect(loadHives()).toEqual([])
  })

  it('returns [] when the stored value is not an array', () => {
    localStorage.setItem(HIVES_KEY, JSON.stringify({ id: 1 }))
    expect(loadHives()).toEqual([])
  })

  it('round-trips through saveHives', () => {
    const hive: Hive = { id: 5, name: 'H', lat: 1, lon: 2, createdAt: 'now' }
    saveHives([hive])
    expect(loadHives()).toEqual([hive])
  })
})

describe('loadFlowers', () => {
  it('keeps valid flowers and drops ones with an unknown forage key', () => {
    localStorage.setItem(
      FLOWERS_KEY,
      JSON.stringify([
        { id: 1, plant: 'Clover', key: 'meadow', note: '', lat: 0, lon: 0, createdAt: '' },
        { id: 2, plant: 'Mystery', key: 'bogus', note: '', lat: 0, lon: 0, createdAt: '' },
      ]),
    )
    const flowers = loadFlowers()
    expect(flowers).toHaveLength(1)
    expect(flowers[0].key).toBe('meadow')
  })
})

describe('loadMyHiveIds', () => {
  it('keeps only numeric ids', () => {
    localStorage.setItem(MY_HIVES_KEY, JSON.stringify([1, 'two', 3]))
    expect(loadMyHiveIds()).toEqual([1, 3])
  })
})
