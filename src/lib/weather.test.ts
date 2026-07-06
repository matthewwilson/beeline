import { describe, expect, it } from 'vitest'
import { dayFlyVerdict, flyVerdict, seasonPhrase } from './weather'

describe('flyVerdict', () => {
  it('reports unavailable when there is no weather', () => {
    expect(flyVerdict(null)).toEqual({ txt: 'Conditions unavailable', cls: 'none' })
  })

  it('is good in warm, calm, dry air', () => {
    expect(flyVerdict({ temperature_2m: 15, wind_speed_10m: 10, precipitation: 0 }).cls).toBe('good')
  })

  it('is marginal when cool, or warm but drizzling', () => {
    expect(flyVerdict({ temperature_2m: 11, wind_speed_10m: 10, precipitation: 0 }).cls).toBe('marg')
    expect(flyVerdict({ temperature_2m: 15, wind_speed_10m: 10, precipitation: 0.2 }).cls).toBe('marg')
  })

  it('is bad when cold, wet or very windy', () => {
    expect(flyVerdict({ temperature_2m: 8, wind_speed_10m: 5, precipitation: 0 }).cls).toBe('bad')
    expect(flyVerdict({ temperature_2m: 15, wind_speed_10m: 40, precipitation: 0 }).cls).toBe('bad')
    expect(flyVerdict({ temperature_2m: 15, wind_speed_10m: 10, precipitation: 1 }).cls).toBe('bad')
  })
})

describe('dayFlyVerdict', () => {
  const day = (tempMax: number, windMax: number, precip: number) => ({ date: '2026-07-06', tempMax, windMax, precip })

  it('is good on a warm, calm, dry day', () => {
    expect(dayFlyVerdict(day(18, 12, 0)).cls).toBe('good')
  })

  it('is marginal when cool, or warm with a little rain in the daily total', () => {
    expect(dayFlyVerdict(day(11, 12, 0)).cls).toBe('marg')
    expect(dayFlyVerdict(day(18, 12, 1)).cls).toBe('marg')
  })

  it('is bad when cold, wet or very windy', () => {
    expect(dayFlyVerdict(day(8, 5, 0)).cls).toBe('bad')
    expect(dayFlyVerdict(day(18, 40, 0)).cls).toBe('bad')
    expect(dayFlyVerdict(day(18, 12, 5)).cls).toBe('bad')
  })
})

describe('seasonPhrase', () => {
  it('describes average, ahead and behind with correct singular/plural', () => {
    expect(seasonPhrase(0)).toBe('about average')
    expect(seasonPhrase(1)).toBe('~1 day ahead of average')
    expect(seasonPhrase(5)).toBe('~5 days ahead of average')
    expect(seasonPhrase(-1)).toBe('~1 day behind average')
    expect(seasonPhrase(-3)).toBe('~3 days behind average')
  })
})
