import type { ForageKey, PollenKey, PollenName } from '../types'

export interface PollenMeta {
  colour: string
  label: string
  keys: ForageKey[]
  note: string
}

// Pollen colour palette -> swatch colour + matching forage keys.
export const POLLEN: Record<PollenKey, PollenMeta> = {
  yellow: { colour: '#f2c000', label: 'Bright yellow', keys: ['farmland', 'wood'], note: 'oilseed rape, willow, gorse' },
  orange: { colour: '#ef8a17', label: 'Orange', keys: ['farmland', 'meadow'], note: 'dandelion, rape' },
  cream: { colour: '#f3e9cf', label: 'Cream / white', keys: ['orchard', 'scrub', 'hedge'], note: 'top fruit, hawthorn, bramble' },
  grey: { colour: '#9b9186', label: 'Grey / dull', keys: ['heath'], note: 'heather' },
  green: { colour: '#7cae5b', label: 'Green', keys: ['wood', 'scrub'], note: 'lime, some crops' },
  purple: { colour: '#8a63d2', label: 'Blue / purple', keys: ['meadow', 'garden'], note: 'phacelia, bluebell' },
  brown: { colour: '#8a5a2b', label: 'Brown', keys: ['allotments', 'farmland'], note: 'field beans' },
}

const MIXED_GRADIENT = 'conic-gradient(from 0deg, #f2c000, #ef8a17, #8a63d2, #7cae5b, #f2c000)'

export function pollenColour(name: PollenName): string {
  const found = Object.values(POLLEN).find((p) => p.label.toLowerCase().includes(name))
  if (found) return found.colour
  if (name === 'mixed') return MIXED_GRADIENT
  return '#ccc'
}
