import { describe, it, expect } from 'vitest'
import { formatDate, formatDateRelative } from './date'

describe('formatDate', () => {
  it('should format ISO date string correctly', () => {
    const result = formatDate('2025-05-22T10:30:00.000Z')
    expect(result).toBe('May 22, 2025')
  })

  it('should format date string without time correctly', () => {
    const result = formatDate('2025-12-31')
    expect(result).toBe('Dec 31, 2025')
  })

  it('should format date string with different month correctly', () => {
    const result = formatDate('2024-01-01T00:00:00Z')
    expect(result).toBe('Jan 1, 2024')
  })

  it('should handle leap year date correctly', () => {
    const result = formatDate('2024-02-29')
    expect(result).toBe('Feb 29, 2024')
  })

  it('should format date with timezone offset correctly', () => {
    const result = formatDate('2025-07-15T14:30:00+02:00')
    expect(result).toBe('Jul 15, 2025')
  })

  it('should handle single digit day and month correctly', () => {
    const result = formatDate('2025-03-05')
    expect(result).toBe('Mar 5, 2025')
  })

  it('should handle different year correctly', () => {
    const result = formatDate('2023-11-28')
    expect(result).toBe('Nov 28, 2023')
  })

  it('should format date at start of year correctly', () => {
    const result = formatDate('2025-01-01')
    expect(result).toBe('Jan 1, 2025')
  })

  it('should format date at end of year correctly', () => {
    const result = formatDate('2025-12-31')
    expect(result).toBe('Dec 31, 2025')
  })

  it('should handle milliseconds in date string correctly', () => {
    const result = formatDate('2025-08-20T16:45:30.123Z')
    expect(result).toBe('Aug 20, 2025')
  })
})

describe('formatDateRelative', () => {
  it('should return "Today" for today\'s date', () => {
    const today = new Date()
    const result = formatDateRelative(today.toISOString())
    expect(result).toBe('Today')
  })

  it('should return "Yesterday" for yesterday\'s date', () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const result = formatDateRelative(yesterday.toISOString())
    expect(result).toBe('Yesterday')
  })

  it('should return formatted date without year for current year', () => {
    const currentYear = new Date().getFullYear()
    const dateInCurrentYear = `${currentYear}-06-15T10:00:00Z`
    const result = formatDateRelative(dateInCurrentYear)
    expect(result).toMatch(/Jun 15/)
    expect(result).not.toMatch(new RegExp(String(currentYear)))
  })

  it('should return formatted date with year for different year', () => {
    const result = formatDateRelative('2020-06-15T10:00:00Z')
    expect(result).toBe('Jun 15, 2020')
  })
})
