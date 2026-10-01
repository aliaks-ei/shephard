import { describe, it, expect } from 'vitest'
import { getCategoryTone, getCategoryToneStyle } from './categories'

describe('getCategoryTone', () => {
  it('keeps the hue of a coloured category and caps its chroma', () => {
    const tone = getCategoryTone('#22c55e')
    expect(tone.hue).toBeGreaterThan(140)
    expect(tone.hue).toBeLessThan(155)
    expect(tone.chroma).toBe(0.15)
  })

  it('moves red categories to amber, because red means over budget', () => {
    expect(getCategoryTone('#ef4444').hue).toBe(75)
    expect(getCategoryTone('#7f1d1d').hue).toBe(75)
  })

  it('keeps pink and orange categories as they are', () => {
    expect(getCategoryTone('#ec4899').hue).not.toBe(75)
    expect(getCategoryTone('#f97316').hue).not.toBe(75)
  })

  it('keeps greys low in chroma', () => {
    expect(getCategoryTone('#6b7280').chroma).toBeLessThan(0.03)
  })

  it('accepts short hex and falls back to neutral for other values', () => {
    expect(getCategoryTone('#fff').chroma).toBe(0)
    expect(getCategoryTone('rebeccapurple')).toEqual({ hue: 0, chroma: 0 })
    expect(getCategoryTone(null)).toEqual({ hue: 0, chroma: 0 })
  })

  it('returns CSS custom properties', () => {
    expect(getCategoryToneStyle('#000000')).toEqual({ '--cat-h': '0', '--cat-c': '0' })
  })
})
