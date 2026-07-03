export type ForageKey =
  | 'hedge'
  | 'heath'
  | 'meadow'
  | 'scrub'
  | 'garden'
  | 'orchard'
  | 'allotments'
  | 'farmland'
  | 'wood'
  | 'park'

export type PollenKey = 'yellow' | 'orange' | 'cream' | 'grey' | 'green' | 'purple' | 'brown'
export type PollenName = PollenKey | 'mixed'

export type Confidence = 'observed' | 'surveyed' | 'osm'
export type Season = 'auto' | 'spring' | 'summer' | 'late'

export interface ForageMeta {
  label: string
  base: number
  colour: string
  pollen: PollenName
  plant: string
}

export interface LatLon {
  lat: number
  lon: number
}

export interface Hive {
  id: number
  name: string
  lat: number
  lon: number
  createdAt: string
}

export interface Flower {
  id: number
  plant: string
  key: ForageKey
  note: string
  lat: number
  lon: number
  createdAt: string
}

export interface Feature {
  key: ForageKey
  name: string
  lat: number
  lon: number
  distance: number
  dir: string
  confidence: Confidence
  area?: number | null
}

export interface ScoredFeature extends Feature {
  score: number
}

export interface CurrentWeather {
  temperature_2m: number
  wind_speed_10m: number
  precipitation: number
}
