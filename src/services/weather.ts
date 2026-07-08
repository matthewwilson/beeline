import { fetchJson } from './http'
import type { CurrentWeather, DailyForecast, HourlyWeather } from '../types'

// Open-Meteo (keyless, CORS `*`).
export async function fetchCurrentWeather(lat: number, lon: number): Promise<CurrentWeather | null> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,wind_speed_10m,precipitation&timezone=auto`
  const data = await fetchJson<{ current?: CurrentWeather }>(url)
  return data?.current ?? null
}

interface DailyBlock {
  time?: string[]
  temperature_2m_max?: Array<number | null>
  wind_speed_10m_max?: Array<number | null>
  precipitation_sum?: Array<number | null>
}

interface HourlyBlock {
  time?: string[]
  temperature_2m?: Array<number | null>
  wind_speed_10m?: Array<number | null>
  precipitation?: Array<number | null>
}

// Next 7 days of daily maxima for the "will the bees fly this week?" strip. Returns null on
// failure; skips any day missing its temperature (Open-Meteo pads arrays with nulls).
export async function fetchDailyForecast(lat: number, lon: number): Promise<DailyForecast[] | null> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,wind_speed_10m_max,precipitation_sum&forecast_days=7&timezone=auto`
  const data = await fetchJson<{ daily?: DailyBlock }>(url)
  const d = data?.daily
  if (!d?.time) return null
  const out: DailyForecast[] = []
  d.time.forEach((date, i) => {
    const tempMax = d.temperature_2m_max?.[i]
    if (tempMax == null) return
    out.push({
      date,
      tempMax,
      windMax: d.wind_speed_10m_max?.[i] ?? 0,
      precip: d.precipitation_sum?.[i] ?? 0,
    })
  })
  return out
}

// Next 48 hours, used for the flight-envelope timeline. Returns null on fetch failure and
// skips incomplete rows so visualisation code can treat the result as clean hourly records.
export async function fetchHourlyForecast(lat: number, lon: number): Promise<HourlyWeather[] | null> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,wind_speed_10m,precipitation&forecast_hours=48&timezone=auto`
  const data = await fetchJson<{ hourly?: HourlyBlock }>(url)
  const h = data?.hourly
  if (!h?.time) return null
  const out: HourlyWeather[] = []
  h.time.forEach((time, i) => {
    const temperature = h.temperature_2m?.[i]
    const windSpeed = h.wind_speed_10m?.[i]
    const precipitation = h.precipitation?.[i]
    if (temperature == null || windSpeed == null || precipitation == null) return
    out.push({ time, temperature, windSpeed, precipitation })
  })
  return out
}

// Cumulative growing-degree-days (base 5C) for the year to date. Returns null if the fetch
// failed, or the running total (0 if the archive returned no daily means).
export async function fetchGrowingDegreeDaysTotal(lat: number, lon: number): Promise<number | null> {
  const now = new Date()
  const today = now.toISOString().slice(0, 10)
  const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${now.getFullYear()}-01-01&end_date=${today}&daily=temperature_2m_mean&timezone=auto`
  const data = await fetchJson<{ daily?: { temperature_2m_mean?: Array<number | null> } }>(url, { timeoutMs: 15000 })
  if (!data) return null
  const temps = data.daily?.temperature_2m_mean ?? []
  const growingDegreeDays = temps.reduce<number>((s, x) => s + (x != null ? Math.max(0, x - 5) : 0), 0)
  return Math.round(growingDegreeDays)
}
