import type { HabitatNetworkClass, HabitatNetworkKey } from '../types'

export interface HabitatNetworkMeta {
  label: string
  serviceName: string
}

export const HABITAT_NETWORKS: Record<HabitatNetworkKey, HabitatNetworkMeta> = {
  lowlandMeadow: { label: 'Lowland meadow', serviceName: 'Lowland_Meadow_Habitat_Network' },
  traditionalOrchard: { label: 'Traditional orchard', serviceName: 'Traditional_Orchard_Habitats_Network' },
  deciduousWoodland: { label: 'Deciduous woodland', serviceName: 'Deciduous_Woodland_Habitat_Network' },
  woodPastureAndParkland: { label: 'Wood pasture & parkland', serviceName: 'Wood_Pasture_and_Parkland_Habitat_Network' },
  heath: { label: 'Heath', serviceName: 'Heath_Habitat_Network' },
}

export const HABITAT_NETWORK_KEYS = Object.keys(HABITAT_NETWORKS) as HabitatNetworkKey[]

export interface HabitatNetworkClassMeta {
  shortLabel: string
  detail: string
  colour: string
  fillOpacity: number
  dashArray?: string
}

// Colour literals are passed directly to Leaflet SVG attributes, where CSS variables do not
// resolve. They intentionally echo the honey, wax and green tones in styles/tokens.css.
export const HABITAT_NETWORK_CLASSES: Record<HabitatNetworkClass, HabitatNetworkClassMeta> = {
  'Network Expansion Zone': {
    shortLabel: 'Expansion',
    detail: 'Published zone where action could address a highly fragmented part of this habitat network.',
    colour: '#f6a800',
    fillOpacity: 0.28,
  },
  'Fragmentation Action Zone': {
    shortLabel: 'Reconnect',
    detail: 'Published zone connecting fragmented habitat patches where habitat creation may reduce fragmentation.',
    colour: '#e6b94f',
    fillOpacity: 0.24,
  },
  'Restorable Habitat': {
    shortLabel: 'Restorable',
    detail: 'Published area where degraded or fragmented habitat may have restoration potential.',
    colour: '#86c661',
    fillOpacity: 0.22,
  },
  'Network Enhancement Zone 1': {
    shortLabel: 'Enhance 1',
    detail: 'Published connecting land considered more likely to support habitat creation.',
    colour: '#c98a5e',
    fillOpacity: 0.19,
    dashArray: '6 4',
  },
  'Network Enhancement Zone 2': {
    shortLabel: 'Enhance 2',
    detail: 'Published connecting land where management or green infrastructure may improve biodiversity value.',
    colour: '#a88d68',
    fillOpacity: 0.14,
    dashArray: '3 5',
  },
}

export const HABITAT_NETWORK_CLASS_KEYS = Object.keys(HABITAT_NETWORK_CLASSES) as HabitatNetworkClass[]
