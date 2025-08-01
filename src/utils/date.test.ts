import { describe, it, expect } from 'vitest'
import { formatDate } from './date'

describe('formatDate', () => {
  it('should format ISO date string correctly', () => {
    const result = formatDate('2025-05-22T10:30:00.000Z')
    expect(result).toBe('22 May 2025')
  })

  it('should format date string without time correctly', () => {
    const result = formatDate('2025-12-31')
    expect(result).toBe('31 Dec 2025')
  })

  it('should format date string with different month correctly', () => {
    const result = formatDate('2024-01-01T00:00:00Z')
    expect(result).toBe('1 Jan 2024')
  })

  it('should handle leap year date correctly', () => {
    const result = formatDate('2024-02-29')
    expect(result).toBe('29 Feb 2024')
  })

  it('should format date with timezone offset correctly', () => {
    const result = formatDate('2025-07-15T14:30:00+02:00')
    expect(result).toBe('15 Jul 2025')
  })

  it('should handle single digit day and month correctly', () => {
    const result = formatDate('2025-03-05')
    expect(result).toBe('5 Mar 2025')
  })

  it('should handle different year correctly', () => {
    const result = formatDate('2023-11-28')
    expect(result).toBe('28 Nov 2023')
  })

  it('should format date at start of year correctly', () => {
    const result = formatDate('2025-01-01')
    expect(result).toBe('1 Jan 2025')
  })

  it('should format date at end of year correctly', () => {
    const result = formatDate('2025-12-31')
    expect(result).toBe('31 Dec 2025')
  })

  it('should handle milliseconds in date string correctly', () => {
    const result = formatDate('2025-08-20T16:45:30.123Z')
    expect(result).toBe('20 Aug 2025')
  })
})
