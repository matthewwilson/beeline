import type { CurrentWeather, DailyForecast, HourlyWeather } from '../types'

export type FlyClass = 'good' | 'marg' | 'bad' | 'none'

export interface FlyVerdict {
  txt: string
  cls: FlyClass
}

export interface FlightWindow {
  start: string
  end: string
  cls: Exclude<FlyClass, 'bad' | 'none'>
}

// Shared verdict → colour token, used by the current-weather box and the 7-day strip.
export const VERDICT_COLOUR: Record<FlyClass, string> = {
  good: 'var(--fly-good)',
  marg: 'var(--fly-marg)',
  bad: 'var(--fly-bad)',
  none: 'var(--wax-dim)',
}

// Rule-of-thumb foraging conditions from current weather. Honeybees fly readily from ~13C
// in calm dry air; below ~10C or in rain/strong wind they mostly stay home.
export function flyVerdict(w: CurrentWeather | null): FlyVerdict {
  if (!w) return { txt: 'Conditions unavailable', cls: 'none' }
  const { temperature_2m: t, wind_speed_10m: wind, precipitation: p } = w
  if (t >= 13 && wind < 25 && p === 0) return { txt: 'Good foraging weather', cls: 'good' }
  if (t >= 10 && p < 0.3 && wind < 35) return { txt: 'Some foragers out', cls: 'marg' }
  return { txt: 'Bees are staying home', cls: 'bad' }
}

export function hourFlyVerdict(hour: HourlyWeather): FlyVerdict {
  const { temperature: t, windSpeed: wind, precipitation: p } = hour
  if (t >= 13 && wind < 25 && p === 0) return { txt: 'Good flight hour', cls: 'good' }
  if (t >= 10 && p < 0.3 && wind < 35) return { txt: 'Marginal flight hour', cls: 'marg' }
  return { txt: 'Grounded hour', cls: 'bad' }
}

export function flightAvailabilityFactor(cls: FlyClass): number {
  if (cls === 'good') return 1
  if (cls === 'marg') return 0.55
  if (cls === 'bad') return 0.16
  return 1
}

export function flightWindows(hours: HourlyWeather[]): FlightWindow[] {
  const windows: FlightWindow[] = []
  let active: FlightWindow | null = null

  for (const hour of hours) {
    const cls = hourFlyVerdict(hour).cls
    if (cls !== 'good' && cls !== 'marg') {
      if (active) {
        active = null
      }
      continue
    }

    if (!active || active.cls !== cls) {
      active = { start: hour.time, end: hour.time, cls }
      windows.push(active)
      continue
    }

    active.end = hour.time
  }

  return windows
}

// Same rule of thumb as flyVerdict, but read off a day's forecast maxima rather than current
// conditions — so precipitation is a daily sum (mm), not an instantaneous rate.
export function dayFlyVerdict(d: DailyForecast): FlyVerdict {
  const { tempMax: t, windMax: wind, precip: p } = d
  if (t >= 13 && wind < 25 && p < 0.3) return { txt: 'Good foraging day', cls: 'good' }
  if (t >= 10 && p < 2 && wind < 35) return { txt: 'Some foragers out', cls: 'marg' }
  return { txt: 'Bees mostly grounded', cls: 'bad' }
}

// Phrase for how far ahead of / behind the average growing season we are, in days.
export function seasonPhrase(ahead: number): string {
  if (ahead === 0) return 'about average'
  if (ahead > 0) return `~${ahead} day${ahead === 1 ? '' : 's'} ahead of average`
  return `~${-ahead} day${ahead === -1 ? '' : 's'} behind average`
}
