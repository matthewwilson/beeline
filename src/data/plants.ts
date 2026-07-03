import type { ForageKey } from '../types'

export interface ForagePlant {
  name: string
  key: ForageKey
}

// Curated NI forage plants for the "add a flower" field log -> mapped to a forage class.
export const FORAGE_PLANTS: ForagePlant[] = [
  { name: 'Hawthorn', key: 'hedge' },
  { name: 'Blackthorn', key: 'hedge' },
  { name: 'Bramble', key: 'scrub' },
  { name: 'Gorse', key: 'scrub' },
  { name: 'Ivy', key: 'scrub' },
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

// Fallback class for a free-text plant.
export const OTHER_FLOWER_KEY: ForageKey = 'garden'

export interface GapPlant {
  name: string
  months: number[]
}

// Gap-filling pollinator plants (AIPP / RHS Plants for Pollinators), by flowering month (1-12).
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
]
