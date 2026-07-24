import type { ForageKey, PollenKey, Season } from '../types'
import type { WorkspaceView } from '../store/useUiStore'

interface AnalyticsEvents {
  bee_flights_toggled: { enabled: boolean }
  confidence_layer_toggled: { enabled: boolean }
  drone_congregation_area_toggled: { enabled: boolean }
  flower_added: { forage_key: ForageKey; has_note: boolean }
  flower_photo_location_read: { has_date: boolean }
  flower_removed: Record<string, never>
  forage_destination_viewed: { forage_key: ForageKey; rank: number; relative_score_percent: number }
  forage_results_loaded: { feature_count: number; land_cover_available: boolean; status: 'busy' | 'empty' | 'ready' }
  hive_added: { used_custom_name: boolean }
  hive_removed: Record<string, never>
  hive_selected: Record<string, never>
  mating_radius_toggled: { enabled: boolean }
  pollen_filter_toggled: { pollen_key: PollenKey; action: 'applied' | 'cleared' }
  season_changed: { season: Season }
  workspace_view_changed: { view: WorkspaceView; layout: 'desktop' | 'mobile' }
}

type PostHogClient = typeof import('posthog-js').default

let clientPromise: Promise<PostHogClient | null> | null = null

function loadAnalytics(): Promise<PostHogClient | null> {
  if (clientPromise) return clientPromise

  if (import.meta.env.MODE === 'test') {
    clientPromise = Promise.resolve(null)
    return clientPromise
  }

  const token = import.meta.env.VITE_POSTHOG_PROJECT_TOKEN
  const host = import.meta.env.VITE_POSTHOG_HOST
  if (!token || !host) {
    if (import.meta.env.DEV) console.info('PostHog is disabled because its environment variables are not set.')
    clientPromise = Promise.resolve(null)
    return clientPromise
  }

  clientPromise = import('posthog-js')
    .then(({ default: posthog }) => {
      posthog.init(token, {
        api_host: host,
        defaults: '2026-05-30',
        autocapture: false,
        capture_pageview: true,
        disable_session_recording: true,
        person_profiles: 'identified_only',
      })
      return posthog
    })
    .catch(() => null)
  return clientPromise
}

/** Load analytics after the application has rendered, keeping it off the initial execution path. */
export function initialiseAnalytics(): void {
  window.setTimeout(() => void loadAnalytics(), 0)
}

/** Capture privacy-safe product events without exposing the analytics client to components. */
export function captureEvent<Event extends keyof AnalyticsEvents>(
  event: Event,
  properties: AnalyticsEvents[Event],
): void {
  void loadAnalytics().then((posthog) => posthog?.capture(event, properties))
}
