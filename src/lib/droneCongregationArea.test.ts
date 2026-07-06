import { describe, expect, it } from 'vitest'
import { buildGrid, cellFactorRows, scoreGrid, slopeAspect } from './droneCongregationArea'
import type { DroneCongregationAreaCell } from './droneCongregationArea'
import { distanceMetres } from './geo'
import type { Feature, ForageKey, LatLon } from '../types'

const HIVE: LatLon = { lat: 54.6, lon: -5.9 }

function feat(key: ForageKey, at: LatLon): Feature {
  return { key, name: key, lat: at.lat, lon: at.lon, distance: 0, dir: 'N', confidence: 'openStreetMap' }
}

describe('buildGrid', () => {
  it('is square, odd-sized and centred on the hive', () => {
    const g = buildGrid(HIVE, 400, 200)
    expect(g.cols).toBe(5)
    expect(g.rows).toBe(5)
    expect(g.points).toHaveLength(25)
    const centre = g.points[12]
    expect(distanceMetres(HIVE, centre)).toBeCloseTo(0, 5)
  })
  it('spaces neighbours by roughly the step distance', () => {
    const g = buildGrid(HIVE, 400, 200)
    const d = distanceMetres(g.points[12], g.points[13]) // centre → east neighbour
    expect(d).toBeGreaterThan(190)
    expect(d).toBeLessThan(210)
  })
})

describe('slopeAspect', () => {
  it('reports a south-facing aspect when the land falls to the south', () => {
    const g = buildGrid(HIVE, 400, 200)
    // Row 0 is north (high), last row is south (low): the surface faces south.
    const elev = g.points.map((_, i) => {
      const row = Math.floor(i / g.cols)
      return 100 - row * 10
    })
    const sa = slopeAspect(g, elev, 2, 2)
    expect(sa).not.toBeNull()
    expect(sa!.aspectDeg).toBeCloseTo(180, 0)
    expect(sa!.slopePct).toBeGreaterThan(0)
  })
  it('reports a north-facing aspect when the land falls to the north', () => {
    const g = buildGrid(HIVE, 400, 200)
    const elev = g.points.map((_, i) => {
      const row = Math.floor(i / g.cols)
      return row * 10 // north (row 0) low, south high
    })
    const sa = slopeAspect(g, elev, 2, 2)
    expect(sa!.aspectDeg).toBeCloseTo(0, 0)
  })
  it('returns null on edge cells', () => {
    const g = buildGrid(HIVE, 400, 200)
    const elev = g.points.map(() => 0)
    expect(slopeAspect(g, elev, 0, 0)).toBeNull()
  })
})

describe('scoreGrid', () => {
  it('favours south-facing over north-facing terrain', () => {
    const g = buildGrid(HIVE, 400, 200)
    const south = scoreGrid(g, g.points.map((_, i) => 100 - Math.floor(i / g.cols) * 10), [], 1000)
    const north = scoreGrid(g, g.points.map((_, i) => Math.floor(i / g.cols) * 10), [], 1000)
    // Compare the centre cell (index 12, interior so aspect is defined).
    expect(south[12].factors.south).toBeGreaterThan(north[12].factors.south)
    expect(south[12].score).toBeGreaterThan(north[12].score)
  })

  it('scores open ground above wooded ground', () => {
    const g = buildGrid(HIVE, 400, 200)
    const land = [feat('meadow', g.points[6]), feat('wood', g.points[18])]
    const cells = scoreGrid(g, null, land, 1000) // land-cover-only path
    expect(cells[6].factors.openness).toBeGreaterThan(cells[18].factors.openness)
    expect(cells[6].score).toBeGreaterThan(cells[18].score)
  })

  it('rates local low ground higher than local high ground', () => {
    const g = buildGrid(HIVE, 400, 200)
    const elev = g.points.map(() => 50)
    elev[6] = 10 // a dip
    elev[18] = 90 // a rise
    const cells = scoreGrid(g, elev, [], 1000)
    expect(cells[6].factors.low).toBeGreaterThan(cells[18].factors.low)
  })

  it('clips cells beyond the radius', () => {
    const g = buildGrid(HIVE, 400, 200)
    const cells = scoreGrid(g, null, [], 400)
    // The four corners of the 5×5 grid sit ~566 m out, so they are dropped.
    expect(cells.length).toBeLessThan(25)
    for (const cell of cells) {
      expect(distanceMetres(HIVE, cell)).toBeLessThanOrEqual(400)
    }
  })

  it('falls back to land-cover-only scoring without elevation', () => {
    const g = buildGrid(HIVE, 400, 200)
    const cells = scoreGrid(g, null, [feat('meadow', g.points[12])], 1000)
    for (const cell of cells) {
      expect(cell.factors.low).toBe(0.5)
      expect(cell.factors.south).toBe(0.5)
      expect(cell.factors.slope).toBe(0.5)
      expect(cell.score).toBeGreaterThanOrEqual(0)
      expect(cell.score).toBeLessThanOrEqual(1)
    }
  })
})

describe('cellFactorRows', () => {
  const cell: DroneCongregationAreaCell = {
    lat: 54.6,
    lon: -5.9,
    score: 0.7,
    factors: { openness: 0.8, shelter: 0.5, low: 0.6, south: 0.9, slope: 0.4 },
  }

  it('lists all five factors as 0–100 percentages when elevation is available', () => {
    const rows = cellFactorRows(cell, true)
    expect(rows).toHaveLength(5)
    expect(rows[0]).toEqual({ label: 'Open ground', pct: 80 })
    for (const r of rows) {
      expect(r.pct).toBeGreaterThanOrEqual(0)
      expect(r.pct).toBeLessThanOrEqual(100)
    }
  })

  it('shows only the measured land-cover factors in partial mode', () => {
    const rows = cellFactorRows(cell, false)
    expect(rows.map((r) => r.label)).toEqual(['Open ground', 'Shelter / landmark'])
  })
})
