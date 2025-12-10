import { describe, it, expect } from 'vitest'
import { parseDecimalInput, isValidDecimalInput } from './decimal'

describe('parseDecimalInput', () => {
  it('returns null for null input', () => {
    expect(parseDecimalInput(null)).toBeNull()
  })

  it('returns null for undefined input', () => {
    expect(parseDecimalInput(undefined)).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(parseDecimalInput('')).toBeNull()
  })

  it('returns null for NaN number', () => {
    expect(parseDecimalInput(NaN)).toBeNull()
  })

  it('returns the number for valid number input', () => {
    expect(parseDecimalInput(42)).toBe(42)
    expect(parseDecimalInput(3.14)).toBe(3.14)
    expect(parseDecimalInput(0)).toBe(0)
    expect(parseDecimalInput(-5)).toBe(-5)
  })

  it('parses string with dot decimal separator', () => {
    expect(parseDecimalInput('42.50')).toBe(42.5)
    expect(parseDecimalInput('3.14159')).toBe(3.14159)
    expect(parseDecimalInput('0.99')).toBe(0.99)
  })

  it('parses string with comma decimal separator (European format)', () => {
    expect(parseDecimalInput('42,50')).toBe(42.5)
    expect(parseDecimalInput('3,14159')).toBe(3.14159)
    expect(parseDecimalInput('0,99')).toBe(0.99)
  })

  it('parses integer strings', () => {
    expect(parseDecimalInput('42')).toBe(42)
    expect(parseDecimalInput('100')).toBe(100)
    expect(parseDecimalInput('0')).toBe(0)
  })

  it('parses negative numbers', () => {
    expect(parseDecimalInput('-5.5')).toBe(-5.5)
    expect(parseDecimalInput('-5,5')).toBe(-5.5)
  })

  it('returns null for invalid strings', () => {
    expect(parseDecimalInput('abc')).toBeNull()
    expect(parseDecimalInput('12.34.56')).toBeNull()
    expect(parseDecimalInput('test123')).toBeNull()
  })

  it('handles leading/trailing whitespace by parsing as much as possible', () => {
    // parseFloat handles leading whitespace but stops at trailing non-numeric
    expect(parseDecimalInput('  42  ')).toBe(42)
    expect(parseDecimalInput('  3,14  ')).toBe(3.14)
  })
})

describe('isValidDecimalInput', () => {
  it('returns false for null', () => {
    expect(isValidDecimalInput(null)).toBe(false)
  })

  it('returns false for undefined', () => {
    expect(isValidDecimalInput(undefined)).toBe(false)
  })

  it('returns false for empty string', () => {
    expect(isValidDecimalInput('')).toBe(false)
  })

  it('returns true for valid numbers', () => {
    expect(isValidDecimalInput(42)).toBe(true)
    expect(isValidDecimalInput(0)).toBe(true)
    expect(isValidDecimalInput(-5)).toBe(true)
  })

  it('returns true for valid decimal strings with dot', () => {
    expect(isValidDecimalInput('42.50')).toBe(true)
    expect(isValidDecimalInput('3.14')).toBe(true)
  })

  it('returns true for valid decimal strings with comma', () => {
    expect(isValidDecimalInput('42,50')).toBe(true)
    expect(isValidDecimalInput('3,14')).toBe(true)
  })

  it('returns false for invalid strings', () => {
    expect(isValidDecimalInput('abc')).toBe(false)
    expect(isValidDecimalInput('12.34.56')).toBe(false)
  })
})
