import { fetchJson } from './http'
import { clamp } from '../lib/geo'
import type { CurrentWeather, DailyForecast, GrowingDegreeDaysProfile, HourlyWeather } from '../types'

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

function normalisedDayOfYear(isoDate: string): number {
  const [year, month, day] = isoDate.split('-').map(Number)
  const utc = Date.UTC(year, month - 1, day)
  const start = Date.UTC(year, 0, 1)
  let doy = Math.floor((utc - start) / 86400000) + 1
  const leap = new Date(Date.UTC(year, 1, 29)).getUTCMonth() === 1
  if (leap && month > 2) doy--
  return doy
}

export function growingDegreeDaysProfileFromDaily(
  dates: string[],
  temperatures: Array<number | null>,
  currentYear: number,
): GrowingDegreeDaysProfile {
  const cumulativeByYear = new Map<number, number[]>()
  for (let index = 0; index < dates.length; index++) {
    const year = Number(dates[index].slice(0, 4))
    const monthDay = dates[index].slice(5)
    if (monthDay === '02-29') continue
    const curve = cumulativeByYear.get(year) ?? Array.from({ length: 365 }, () => 0)
    const doyIndex = normalisedDayOfYear(dates[index]) - 1
    curve[doyIndex] = Math.max(0, (temperatures[index] ?? 5) - 5)
    cumulativeByYear.set(year, curve)
  }

  for (const curve of cumulativeByYear.values()) {
    for (let day = 1; day < curve.length; day++) curve[day] += curve[day - 1]
  }

  const currentCurve = cumulativeByYear.get(currentYear)
  const total = currentCurve?.[normalisedDayOfYear(dates.at(-1) ?? `${currentYear}-01-01`) - 1] ?? 0
  const history = [...cumulativeByYear.entries()]
    .filter(([year]) => year < currentYear)
    .map(([, curve]) => curve)
    .filter((curve) => curve[364] > 0)
  if (history.length < 5) return { total: Math.round(total), seasonOffsetDays: 0, meanCumulativeByDay: null }

  const meanCumulativeByDay = Array.from({ length: 365 }, (_, day) =>
    history.reduce((sum, curve) => sum + curve[day], 0) / history.length,
  )
  const currentDay = normalisedDayOfYear(dates.at(-1) ?? `${currentYear}-01-01`)
  let equivalentDay = 1
  let closest = Number.POSITIVE_INFINITY
  meanCumulativeByDay.forEach((value, day) => {
    const difference = Math.abs(value - total)
    if (difference < closest) {
      closest = difference
      equivalentDay = day + 1
    }
  })
  return {
    total: Math.round(total),
    seasonOffsetDays: clamp(equivalentDay - currentDay, -25, 25),
    meanCumulativeByDay,
  }
}

// One archive request supplies current thermal time and a rolling local ten-year baseline.
export async function fetchGrowingDegreeDaysProfile(lat: number, lon: number): Promise<GrowingDegreeDaysProfile | null> {
  const now = new Date()
  const today = now.toISOString().slice(0, 10)
  const startYear = now.getFullYear() - 10
  const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${startYear}-01-01&end_date=${today}&daily=temperature_2m_mean&timezone=auto`
  const data = await fetchJson<{ daily?: { time?: string[]; temperature_2m_mean?: Array<number | null> } }>(url, { timeoutMs: 20000 })
  if (!data) return null
  const dates = data.daily?.time
  const temperatures = data.daily?.temperature_2m_mean
  if (!dates || !temperatures || dates.length !== temperatures.length) return null
  return growingDegreeDaysProfileFromDaily(dates, temperatures, now.getFullYear())
}
