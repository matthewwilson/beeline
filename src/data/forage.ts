import type { Confidence, ForageKey, ForageMeta } from '../types'

// `base` = relative forage value (0-10), grounded in Baude et al. 2016/2025 nectar & pollen
// rankings plus standard NI/UK forage references (see references/forage-values.md).
export const FORAGE: Record<ForageKey, ForageMeta> = {
  hedge: { label: 'Hedgerow', base: 9, colour: '#c98a5e', pollen: 'cream', plant: 'hawthorn / blackthorn / bramble' },
  heath: { label: 'Heath', base: 9, colour: '#a06cd5', pollen: 'grey', plant: 'heather' },
  meadow: { label: 'Meadow', base: 8, colour: '#8fd14f', pollen: 'mixed', plant: 'clover / knapweed / dandelion' },
  scrub: { label: 'Scrub', base: 8, colour: '#8a9a5b', pollen: 'green', plant: 'bramble / gorse' },
  garden: { label: 'Garden', base: 7, colour: '#39c5bb', pollen: 'mixed', plant: 'garden flowers' },
  orchard: { label: 'Orchard', base: 7, colour: '#ff9ecb', pollen: 'cream', plant: 'top-fruit blossom' },
  allotments: { label: 'Allotments', base: 6, colour: '#2bb3a3', pollen: 'brown', plant: 'veg & fruit' },
  farmland: { label: 'Farmland', base: 6, colour: '#f2c000', pollen: 'yellow', plant: 'oilseed rape / crops' },
  wood: { label: 'Woodland', base: 5, colour: '#2e7d32', pollen: 'green', plant: 'willow / sycamore / lime' },
  park: { label: 'Park', base: 5, colour: '#6ab04c', pollen: 'mixed', plant: 'verges & ornamentals' },
}

// Map raw OSM tag values onto our forage keys.
export const TAG_TO_KEY: Record<string, ForageKey> = {
  orchard: 'orchard',
  meadow: 'meadow',
  farmland: 'farmland',
  allotments: 'allotments',
  forest: 'wood',
  wood: 'wood',
  heath: 'heath',
  scrub: 'scrub',
  garden: 'garden',
  park: 'park',
  hedge: 'hedge',
  tree_row: 'hedge',
}

export const CONFIDENCE_MULT: Record<Confidence, number> = { observed: 1.5, surveyed: 1.25, osm: 1 }

export const RING_KM = [1, 3, 5]
export const MAX_MARKERS = 150

// Queen mating flight radius. Queens fly to drone congregation areas typically
// 2-3 km from the hive; DCAs sit up to ~5 km out, and genetic paternity work
// (Jensen et al., 2005) found 90% of matings within ~7.5 km. 5 km is the
// well-supported practical reach and matches the outer distance ring.
export const MATING_RADIUS_KM = 5
