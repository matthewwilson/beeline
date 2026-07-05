import { flyVerdict, seasonPhrase } from '../lib/weather'
import type { FlyClass } from '../lib/weather'
import { useStore } from '../store/useStore'
import styles from './controls.module.css'

const VERDICT_COLOUR: Record<FlyClass, string> = {
  good: 'var(--fly-good)',
  marg: 'var(--fly-marg)',
  bad: 'var(--fly-bad)',
  none: 'var(--wax-dim)',
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
