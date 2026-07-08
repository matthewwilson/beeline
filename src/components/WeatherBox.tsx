import { useMemo } from 'react'
import { dayFlyVerdict, flightWindows, flyVerdict, hourFlyVerdict, seasonPhrase, VERDICT_COLOUR } from '../lib/weather'
import { useStore } from '../store/useStore'
import type { DailyForecast, HourlyWeather } from '../types'
import styles from './controls.module.css'

// Weekday initial from an ISO date (YYYY-MM-DD), read in local time.
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
function weekdayInitial(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return WEEKDAYS[new Date(y, m - 1, d).getDay()]
}

function hourLabel(iso: string): string {
  return iso.slice(11, 16)
}

function hourAfterLabel(iso: string): string {
  const hour = Number(iso.slice(11, 13))
  if (Number.isNaN(hour)) return hourLabel(iso)
  return `${String((hour + 1) % 24).padStart(2, '0')}:00`
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

function HourlyFlightStrip({ hourly }: { hourly: HourlyWeather[] }) {
  const nextHours = useMemo(() => hourly.slice(0, 24), [hourly])
  const windows = useMemo(() => flightWindows(nextHours), [nextHours])
  const nextWindow = windows[0]
  const windowCopy = nextWindow
    ? `Next flight window: ${hourLabel(nextWindow.start)}-${hourAfterLabel(nextWindow.end)}`
    : 'No flyable window in the next 24 hours'

  return (
    <div className={styles.flightEnvelope}>
      <div className={styles.flightEnvelopeTop}>
        <span>Flight envelope</span>
        <span>{windowCopy}</span>
      </div>
      <div className={styles.hourlyRail} aria-label={windowCopy}>
        {nextHours.map((hour, i) => {
          const verdict = hourFlyVerdict(hour)
          const colour = VERDICT_COLOUR[verdict.cls]
          const label = `${hourLabel(hour.time)} · ${verdict.txt} · ${Math.round(hour.temperature)}°C · wind ${Math.round(hour.windSpeed)} km/h`
          return (
            <span
              key={hour.time}
              className={styles.hourTick}
              title={label}
              style={{ background: colour, color: colour }}
              data-labelled={i % 6 === 0 ? hourLabel(hour.time) : undefined}
            />
          )
        })}
      </div>
    </div>
  )
}

export function WeatherBox() {
  const { current, forecast, hourly, growingDegreeDaysTotal, growingDegreeDaysOffsetDays, loading } = useStore((s) => s.weather)
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
      {hourly && hourly.length > 0 && <HourlyFlightStrip hourly={hourly} />}
      {season === 'auto' && growingDegreeDaysTotal != null && (
        <div className={styles.weatherBloom}>
          Auto season from live weather · growing season {seasonPhrase(growingDegreeDaysOffsetDays)} · {growingDegreeDaysTotal} Growing degree days so far
        </div>
      )}
    </div>
  )
}
