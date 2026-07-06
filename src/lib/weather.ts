import type { CurrentWeather, DailyForecast } from '../types'

export type FlyClass = 'good' | 'marg' | 'bad' | 'none'

export interface FlyVerdict {
  txt: string
  cls: FlyClass
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
