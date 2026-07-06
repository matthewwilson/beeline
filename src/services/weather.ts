import { fetchJson } from './http'
import type { CurrentWeather } from '../types'

// Open-Meteo (keyless, CORS `*`).
export async function fetchCurrentWeather(lat: number, lon: number): Promise<CurrentWeather | null> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,wind_speed_10m,precipitation&timezone=auto`
  const data = await fetchJson<{ current?: CurrentWeather }>(url)
  return data?.current ?? null
}

// Cumulative growing-degree-days (base 5C) for the year to date. Returns null if the fetch
// failed, or the running total (0 if the archive returned no daily means).
export async function fetchGddTotal(lat: number, lon: number): Promise<number | null> {
  const now = new Date()
  const today = now.toISOString().slice(0, 10)
  const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${now.getFullYear()}-01-01&end_date=${today}&daily=temperature_2m_mean&timezone=auto`
  const data = await fetchJson<{ daily?: { temperature_2m_mean?: Array<number | null> } }>(url, { timeoutMs: 15000 })
  if (!data) return null
  const temps = data.daily?.temperature_2m_mean ?? []
  const gdd = temps.reduce<number>((s, x) => s + (x != null ? Math.max(0, x - 5) : 0), 0)
  return Math.round(gdd)
}
