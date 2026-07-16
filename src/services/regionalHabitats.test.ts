import { describe, expect, it } from 'vitest'
import { englandForageKeys } from './englandHabitats'
import { irelandArticle17ForageKey } from './irelandHabitats'
import { scotlandForageKey } from './scotlandHabitats'
import { walesForageKey } from './walesHabitats'

describe('regional habitat mappings', () => {
  it('maps and de-duplicates Natural England habitat codes', () => {
    expect(englandForageKeys('DWOOD, FHEAT, TORCH, DWOOD')).toEqual(['wood', 'heath', 'orchard'])
  })

  it('maps NatureScot habitat codes and descriptions', () => {
    expect(scotlandForageKey('G1', 'Broadleaved woodland')).toBe('wood')
    expect(scotlandForageKey('', 'Blanket bog')).toBe('heath')
    expect(scotlandForageKey('H1', 'Inland rock')).toBeNull()
  })

  it('maps Natural Resources Wales Phase 1 codes', () => {
    expect(walesForageKey('A1.1.1')).toBe('wood')
    expect(walesForageKey('B2.2')).toBe('meadow')
    expect(walesForageKey('D1.1')).toBe('heath')
    expect(walesForageKey('I1')).toBeNull()
  })

  it('maps NPWS Article 17 habitat codes and names', () => {
    expect(irelandArticle17ForageKey('91A0', 'Old sessile oak woods')).toBe('wood')
    expect(irelandArticle17ForageKey('4030', 'European dry heaths')).toBe('heath')
    expect(irelandArticle17ForageKey('6510', 'Lowland hay meadows')).toBe('meadow')
    expect(irelandArticle17ForageKey('1230', 'Vegetated sea cliffs')).toBeNull()
  })
})
