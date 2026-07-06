import type { BloomWindow, ForageKey } from '../types'

export interface ForagePlant {
  name: string
  key: ForageKey
  bloom?: BloomWindow
  offSeasonFloor?: number
}

// Curated NI forage plants for the "add a flower" field log -> mapped to a forage class.
export const FORAGE_PLANTS: ForagePlant[] = [
  { name: 'Hawthorn', key: 'hedge' },
  { name: 'Blackthorn', key: 'hedge' },
  { name: 'Bramble', key: 'scrub', bloom: [145, 170, 225, 255], offSeasonFloor: 0.05 },
  { name: 'Gorse', key: 'scrub', bloom: [1, 75, 140, 365], offSeasonFloor: 0.35 },
  { name: 'Ivy', key: 'scrub', bloom: [240, 260, 300, 325], offSeasonFloor: 0.03 },
  { name: 'Heather', key: 'heath' },
  { name: 'White clover', key: 'meadow' },
  { name: 'Dandelion', key: 'meadow' },
  { name: 'Knapweed', key: 'meadow' },
  { name: 'Willow', key: 'wood' },
  { name: 'Lime', key: 'wood' },
  { name: 'Sycamore', key: 'wood' },
  { name: 'Oilseed rape', key: 'farmland' },
  { name: 'Field beans', key: 'farmland' },
  { name: 'Apple / fruit blossom', key: 'orchard' },
  { name: 'Phacelia', key: 'garden' },
  { name: 'Borage', key: 'garden' },
  { name: 'Comfrey', key: 'garden' },
  { name: 'Lavender', key: 'garden' },
  { name: 'Rose', key: 'garden' },
  { name: 'Foxglove', key: 'garden' },
  { name: 'Peony', key: 'garden' },
]

export function foragePlantByName(name: string): ForagePlant | undefined {
  const normalised = name.trim().toLowerCase()
  return FORAGE_PLANTS.find((p) => p.name.toLowerCase() === normalised)
}

// Fallback class for a free-text plant.
export const OTHER_FLOWER_KEY: ForageKey = 'garden'

export interface GapPlant {
  name: string
  months: number[]
}

// Gap-filling pollinator plants (AIPP / RHS Plants for Pollinators), by flowering month (1-12).
// Covers both the classic June gap and the later autumn dearth (ivy onward).
export const GAP_PLANTS: GapPlant[] = [
  { name: 'Phacelia', months: [6, 7, 8, 9] },
  { name: 'Borage', months: [6, 7, 8, 9] },
  { name: 'White clover', months: [6, 7, 8] },
  { name: 'Bramble', months: [6, 7, 8] },
  { name: 'Comfrey', months: [5, 6, 7] },
  { name: 'Cotoneaster', months: [5, 6] },
  { name: 'Field beans', months: [6, 7] },
  { name: 'Lime tree', months: [6, 7] },
  { name: 'Foxglove', months: [6, 7] },
  { name: 'Poppy', months: [6, 7] },
  { name: 'Ivy', months: [9, 10] },
  { name: 'Michaelmas daisy', months: [9, 10] },
  { name: 'Sedum', months: [8, 9] },
]
