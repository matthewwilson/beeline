import type { CurrentWeather } from '../types'

export type FlyClass = 'good' | 'marg' | 'bad' | 'none'

export interface FlyVerdict {
  txt: string
  cls: FlyClass
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

// Phrase for how far ahead of / behind the average growing season we are, in days.
export function seasonPhrase(ahead: number): string {
  if (ahead === 0) return 'about average'
  if (ahead > 0) return `~${ahead} day${ahead === 1 ? '' : 's'} ahead of average`
  return `~${-ahead} day${ahead === -1 ? '' : 's'} behind average`
}
