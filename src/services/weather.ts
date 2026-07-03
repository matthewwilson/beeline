import type { CurrentWeather } from '../types'

// Open-Meteo (keyless, CORS `*`).
export async function fetchCurrentWeather(lat: number, lon: number): Promise<CurrentWeather | null> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,wind_speed_10m,precipitation&timezone=auto`
    const res = await fetch(url, { signal: AbortSignal.timeout(12000) })
    const data = await res.json()
    return (data.current as CurrentWeather) ?? null
  } catch {
    return null
  }
}

// Cumulative growing-degree-days (base 5C) for the year to date.
export async function fetchGddTotal(lat: number, lon: number): Promise<number | null> {
  try {
    const now = new Date()
    const today = now.toISOString().slice(0, 10)
    const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${now.getFullYear()}-01-01&end_date=${today}&daily=temperature_2m_mean&timezone=auto`
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) })
    const data = await res.json()
    const temps: Array<number | null> = data.daily?.temperature_2m_mean ?? []
    const gdd = temps.reduce<number>((s, x) => s + (x != null ? Math.max(0, x - 5) : 0), 0)
    return Math.round(gdd)
  } catch {
    return null
  }
}
