import { useStore } from '../store/useStore'
import type { CurrentWeather } from '../types'
import styles from './controls.module.css'

const VERDICT_COLOUR = {
  good: 'var(--fly-good)',
  marg: 'var(--fly-marg)',
  bad: 'var(--fly-bad)',
  none: 'var(--wax-dim)',
} as const

function flyVerdict(w: CurrentWeather | null): { txt: string; cls: keyof typeof VERDICT_COLOUR } {
  if (!w) return { txt: 'Conditions unavailable', cls: 'none' }
  const { temperature_2m: t, wind_speed_10m: wind, precipitation: p } = w
  if (t >= 13 && wind < 25 && p === 0) return { txt: 'Good foraging weather', cls: 'good' }
  if (t >= 10 && p < 0.3 && wind < 35) return { txt: 'Some foragers out', cls: 'marg' }
  return { txt: 'Bees are staying home', cls: 'bad' }
}

function seasonPhrase(ahead: number): string {
  if (ahead === 0) return 'about average'
  if (ahead > 0) return `~${ahead} day${ahead === 1 ? '' : 's'} ahead of average`
  return `~${-ahead} day${ahead === -1 ? '' : 's'} behind average`
}

export function WeatherBox() {
  const { current, gddTotal, gddOffsetDays, loading } = useStore((s) => s.weather)
  const season = useStore((s) => s.season)

  const verdict = flyVerdict(current)
  const colour = VERDICT_COLOUR[verdict.cls]

  return (
    <div className={styles.weather}>
      <div className={styles.weatherVerdict} style={{ color: colour }}>
        <span className={styles.verdictDot} style={{ background: colour }} />
        {loading && !current ? 'Reading the sky…' : verdict.txt}
      </div>
      {current && (
        <div className={styles.weatherCond}>
          {Math.round(current.temperature_2m)}°C · wind {Math.round(current.wind_speed_10m)} km/h ·{' '}
          {current.precipitation > 0 ? `${current.precipitation} mm rain` : 'dry'}
        </div>
      )}
      {season === 'auto' && gddTotal != null && (
        <div className={styles.weatherBloom}>
          Auto season from live weather · growing season {seasonPhrase(gddOffsetDays)} · {gddTotal} GDD so far
        </div>
      )}
    </div>
  )
}
