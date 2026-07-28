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

export type Confidence = 'observed' | 'surveyed' | 'openStreetMap'
export type FeatureSourceKey =
  | 'userObservation'
  | 'openStreetMap'
  | 'daeraPriorityHabitats'
  | 'naturalEnglandPriorityHabitats'
  | 'natureScotHabitatMap'
  | 'naturalResourcesWalesPhaseOne'
  | 'nationalParksWildlifeServiceArticle17'
  | 'nationalParksWildlifeServiceNativeWoodland'
  | 'nationalParksWildlifeServiceGrassland'

export type Jurisdiction =
  | 'northernIreland'
  | 'republicOfIreland'
  | 'scotland'
  | 'england'
  | 'wales'
  | 'unsupported'
export type Season = 'auto' | 'spring' | 'summer' | 'late'
export type BloomWindow = [number, number, number, number]

export type HabitatNetworkKey =
  | 'lowlandMeadow'
  | 'traditionalOrchard'
  | 'deciduousWoodland'
  | 'woodPastureAndParkland'
  | 'heath'

export type HabitatNetworkClass =
  | 'Restorable Habitat'
  | 'Fragmentation Action Zone'
  | 'Network Enhancement Zone 1'
  | 'Network Enhancement Zone 2'
  | 'Network Expansion Zone'

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

export type FeatureGeometry =
  | { type: 'Point'; coordinates: [number, number] }
  | { type: 'LineString'; coordinates: number[][] }
  | { type: 'Polygon'; coordinates: number[][][] }
  | { type: 'MultiPolygon'; coordinates: number[][][][] }

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
  source: FeatureSourceKey
  area?: number | null
  geometry?: FeatureGeometry
  bloom?: BloomWindow
  offSeasonFloor?: number
  scoreMultiplier?: number
}

// Nature Recovery Network polygons are decision-support evidence, not present forage.
// Keep them structurally separate from Feature so they cannot enter scoring or bee flights.
export interface HabitatOpportunity {
  habitat: HabitatNetworkKey
  networkClass: HabitatNetworkClass
  geometry: Extract<FeatureGeometry, { type: 'Polygon' | 'MultiPolygon' }>
}

export interface ScoredFeature extends Feature {
  score: number
}

export interface CurrentWeather {
  temperature_2m: number
  wind_speed_10m: number
  precipitation: number
}

export interface DailyForecast {
  date: string
  tempMax: number
  windMax: number
  precip: number
}

export interface HourlyWeather {
  time: string
  temperature: number
  windSpeed: number
  precipitation: number
}

export interface GrowingDegreeDaysProfile {
  total: number
  seasonOffsetDays: number
  meanCumulativeByDay: number[] | null
}
