import { describe, it, expect } from 'vitest'
import {
  getBudgetProgressColor,
  getBudgetRemainingColorClass,
  calculateBudgetPercentage,
} from './budget'

describe('budget utils', () => {
  describe('getBudgetProgressColor', () => {
    it('should return "primary" for percentage below 100', () => {
      expect(getBudgetProgressColor(0)).toBe('primary')
      expect(getBudgetProgressColor(50)).toBe('primary')
      expect(getBudgetProgressColor(99.9)).toBe('primary')
    })

    it('should return "positive" for percentage exactly 100', () => {
      expect(getBudgetProgressColor(100)).toBe('positive')
    })

    it('should return "warning" for percentage between 100 and 110', () => {
      expect(getBudgetProgressColor(100.1)).toBe('warning')
      expect(getBudgetProgressColor(105)).toBe('warning')
      expect(getBudgetProgressColor(110)).toBe('warning')
    })

    it('should return "negative" for percentage above 110', () => {
      expect(getBudgetProgressColor(110.1)).toBe('negative')
      expect(getBudgetProgressColor(150)).toBe('negative')
      expect(getBudgetProgressColor(999)).toBe('negative')
    })
  })

  describe('getBudgetRemainingColorClass', () => {
    it('should return "text-primary" for percentage below 100', () => {
      expect(getBudgetRemainingColorClass(0)).toBe('text-primary')
      expect(getBudgetRemainingColorClass(50)).toBe('text-primary')
      expect(getBudgetRemainingColorClass(99.9)).toBe('text-primary')
    })

    it('should return "text-positive" for percentage exactly 100', () => {
      expect(getBudgetRemainingColorClass(100)).toBe('text-positive')
    })

    it('should return "text-warning" for percentage between 100 and 110', () => {
      expect(getBudgetRemainingColorClass(100.1)).toBe('text-warning')
      expect(getBudgetRemainingColorClass(105)).toBe('text-warning')
      expect(getBudgetRemainingColorClass(110)).toBe('text-warning')
    })

    it('should return "text-negative" for percentage above 110', () => {
      expect(getBudgetRemainingColorClass(110.1)).toBe('text-negative')
      expect(getBudgetRemainingColorClass(150)).toBe('text-negative')
      expect(getBudgetRemainingColorClass(999)).toBe('text-negative')
    })
  })

  describe('calculateBudgetPercentage', () => {
    it('should return 0 when budget is 0', () => {
      expect(calculateBudgetPercentage(100, 0)).toBe(0)
      expect(calculateBudgetPercentage(0, 0)).toBe(0)
    })

    it('should calculate percentage correctly for normal values', () => {
      expect(calculateBudgetPercentage(50, 100)).toBe(50)
      expect(calculateBudgetPercentage(100, 100)).toBe(100)
      expect(calculateBudgetPercentage(150, 100)).toBe(150)
    })

    it('should handle decimal values correctly', () => {
      expect(calculateBudgetPercentage(33.33, 100)).toBe(33.33)
      expect(calculateBudgetPercentage(66.67, 100)).toBe(66.67)
    })

    it('should cap percentage at 999 to prevent overflow', () => {
      expect(calculateBudgetPercentage(10000, 100)).toBe(999)
      expect(calculateBudgetPercentage(100000, 100)).toBe(999)
    })

    it('should handle zero spent correctly', () => {
      expect(calculateBudgetPercentage(0, 100)).toBe(0)
      expect(calculateBudgetPercentage(0, 1000)).toBe(0)
    })

    it('should calculate percentage over 100 correctly', () => {
      expect(calculateBudgetPercentage(110, 100)).toBeCloseTo(110)
      expect(calculateBudgetPercentage(200, 100)).toBe(200)
    })
  })
})
