import { describe, expect, it } from 'vitest'
import { bearing, clamp, dayOfYear, distanceMetres, escapeHtml, fmtDist, polygonCentroid } from './geo'

describe('distanceMetres', () => {
  it('is zero for identical points', () => {
    expect(distanceMetres({ lat: 54.6, lon: -5.9 }, { lat: 54.6, lon: -5.9 })).toBe(0)
  })
  it('matches a known east-west span', () => {
    const d = distanceMetres({ lat: 54.607, lon: -5.926 }, { lat: 54.607, lon: -5.826 })
    expect(d).toBeGreaterThan(6300)
    expect(d).toBeLessThan(6600)
  })
})

describe('bearing', () => {
  it('reads compass points', () => {
    expect(bearing({ lat: 54.6, lon: -5.9 }, { lat: 55.6, lon: -5.9 })).toBe('N')
    expect(bearing({ lat: 54.6, lon: -5.9 }, { lat: 54.6, lon: -4.9 })).toBe('E')
    expect(bearing({ lat: 54.6, lon: -5.9 }, { lat: 53.6, lon: -5.9 })).toBe('S')
    expect(bearing({ lat: 54.6, lon: -5.9 }, { lat: 54.6, lon: -6.9 })).toBe('W')
  })
})

describe('polygonCentroid', () => {
  it('averages a polygon ring', () => {
    expect(
      polygonCentroid({ type: 'Polygon', coordinates: [[[0, 0], [2, 0], [2, 2], [0, 2]]] }),
    ).toEqual([1, 1])
  })
  it('handles MultiPolygon and rejects other geometry', () => {
    expect(
      polygonCentroid({ type: 'MultiPolygon', coordinates: [[[[0, 0], [4, 0], [4, 4], [0, 4]]]] }),
    ).toEqual([2, 2])
    expect(polygonCentroid({ type: 'Point', coordinates: [[[0, 0]]] })).toBeNull()
    expect(polygonCentroid(null)).toBeNull()
  })
})

describe('helpers', () => {
  it('counts days from Jan 1 (endpoints are DST-free)', () => {
    expect(dayOfYear(new Date(2026, 0, 1))).toBe(1)
    expect(dayOfYear(new Date(2026, 11, 31))).toBe(365)
  })
  it('clamp bounds a value', () => {
    expect(clamp(30, -25, 25)).toBe(25)
    expect(clamp(-40, -25, 25)).toBe(-25)
    expect(clamp(10, -25, 25)).toBe(10)
  })
  it('fmtDist switches units at 1 km', () => {
    expect(fmtDist(450)).toBe('450 m')
    expect(fmtDist(2500)).toBe('2.5 km')
  })
  it('escapeHtml neutralises markup', () => {
    expect(escapeHtml('<b>"x" & y</b>')).toBe('&lt;b&gt;&quot;x&quot; &amp; y&lt;/b&gt;')
  })
})
