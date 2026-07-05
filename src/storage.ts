import { FORAGE } from './data/forage'
import type { Flower, Hive } from './types'

const STORAGE_KEY = 'beeline-hives'
const FLOWERS_KEY = 'beeline-flowers'
const MY_HIVES_KEY = 'beeline-my-hives'

export function loadHives(): Hive[] {
  try {
    const list = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    if (!Array.isArray(list)) return []
    return list.filter((h): h is Hive => h && typeof h.id === 'number')
  } catch {
    return []
  }
}

export function saveHives(hives: Hive[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(hives))
}

export function loadFlowers(): Flower[] {
  try {
    const list = JSON.parse(localStorage.getItem(FLOWERS_KEY) ?? '[]')
    if (!Array.isArray(list)) return []
    return list.filter((f): f is Flower => f && typeof f.id === 'number' && !!FORAGE[f.key as keyof typeof FORAGE])
  } catch {
    return []
  }
}

export function saveFlowers(flowers: Flower[]): void {
  localStorage.setItem(FLOWERS_KEY, JSON.stringify(flowers))
}

export function loadMyHiveIds(): number[] {
  try {
    const ids = JSON.parse(localStorage.getItem(MY_HIVES_KEY) ?? '[]')
    return Array.isArray(ids) ? ids.filter((n) => typeof n === 'number') : []
  } catch {
    return []
  }
}

export function saveMyHiveIds(ids: number[]): void {
  localStorage.setItem(MY_HIVES_KEY, JSON.stringify(ids))
}
