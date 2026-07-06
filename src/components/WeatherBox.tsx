import { dayFlyVerdict, flyVerdict, seasonPhrase, VERDICT_COLOUR } from '../lib/weather'
import { useStore } from '../store/useStore'
import type { DailyForecast } from '../types'
import styles from './controls.module.css'

// Weekday initial from an ISO date (YYYY-MM-DD), read in local time.
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
function weekdayInitial(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return WEEKDAYS[new Date(y, m - 1, d).getDay()]
}

function ForecastStrip({ forecast }: { forecast: DailyForecast[] }) {
  return (
    <div className={styles.forecast}>
      {forecast.map((day) => {
        const verdict = dayFlyVerdict(day)
        const colour = VERDICT_COLOUR[verdict.cls]
        return (
          <div key={day.date} className={styles.forecastDay} title={`${verdict.txt} · ${Math.round(day.tempMax)}°C`}>
            <span className={styles.forecastLab}>{weekdayInitial(day.date)}</span>
            <span className={styles.forecastDot} style={{ background: colour }} />
            <span className={styles.forecastTemp}>{Math.round(day.tempMax)}°</span>
          </div>
        )
      })}
    </div>
  )
}

export function WeatherBox() {
  const { current, forecast, growingDegreeDaysTotal, growingDegreeDaysOffsetDays, loading } = useStore((s) => s.weather)
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
      {forecast && forecast.length > 0 && <ForecastStrip forecast={forecast} />}
      {season === 'auto' && growingDegreeDaysTotal != null && (
        <div className={styles.weatherBloom}>
          Auto season from live weather · growing season {seasonPhrase(growingDegreeDaysOffsetDays)} · {growingDegreeDaysTotal} Growing degree days so far
        </div>
      )}
    </div>
  )
}
