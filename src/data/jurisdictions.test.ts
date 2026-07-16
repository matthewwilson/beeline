import { describe, expect, it } from 'vitest'
import { jurisdictionAt, jurisdictionsWithinRadius } from './jurisdictions'

describe('jurisdictionAt', () => {
  it.each([
    [{ lat: 54.5973, lon: -5.9301 }, 'northernIreland'],
    [{ lat: 53.3498, lon: -6.2603 }, 'republicOfIreland'],
    [{ lat: 55.9533, lon: -3.1883 }, 'scotland'],
    [{ lat: 51.5074, lon: -0.1278 }, 'england'],
    [{ lat: 51.4816, lon: -3.1791 }, 'wales'],
    [{ lat: 54.1523, lon: -4.4861 }, 'unsupported'],
  ] as const)('classifies %o as %s', (point, expected) => {
    expect(jurisdictionAt(point)).toBe(expected)
  })
})

describe('jurisdictionsWithinRadius', () => {
  it('includes both Irish jurisdictions for a hive close to the border', () => {
    expect(jurisdictionsWithinRadius({ lat: 54.12, lon: -6.35 }, 5000)).toEqual(
      expect.arrayContaining(['northernIreland', 'republicOfIreland']),
    )
  })

  it('keeps unsupported locations in generic mode', () => {
    expect(jurisdictionsWithinRadius({ lat: 54.1523, lon: -4.4861 }, 5000)).toEqual(['unsupported'])
  })
})
