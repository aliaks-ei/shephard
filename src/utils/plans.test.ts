import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { Plan } from 'src/api/plans'
import {
  calculateEndDate,
  getPlanStatus,
  canEditPlan,
  canAddExpensesToPlan,
  getDaysRemaining,
  getDaysUntilStart,
  getStatusText,
  getStatusColor,
  getStatusIcon,
  formatDateRange,
} from './plans'

describe('plans utils', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-06-15T12:00:00Z'))
  })

  describe('calculateEndDate', () => {
    it('should calculate weekly end date correctly', () => {
      const startDate = new Date('2024-06-01')
      const endDate = calculateEndDate(startDate, 'weekly')
      expect(endDate.toISOString()).toBe(new Date('2024-06-08').toISOString())
    })

    it('should calculate monthly end date correctly', () => {
      const startDate = new Date('2024-06-01')
      const endDate = calculateEndDate(startDate, 'monthly')
      expect(endDate.toISOString()).toBe(new Date('2024-07-01').toISOString())
    })

    it('should calculate yearly end date correctly', () => {
      const startDate = new Date('2024-06-01')
      const endDate = calculateEndDate(startDate, 'yearly')
      expect(endDate.toISOString()).toBe(new Date('2025-06-01').toISOString())
    })

    it('should handle leap year for yearly calculation', () => {
      const startDate = new Date('2024-02-29')
      const endDate = calculateEndDate(startDate, 'yearly')
      expect(endDate.getFullYear()).toBe(2025)
      expect(endDate.getMonth()).toBe(2)
    })

    it('should handle month end dates for monthly calculation', () => {
      const startDate = new Date('2024-01-31')
      const endDate = calculateEndDate(startDate, 'monthly')
      expect(endDate.getDate()).toBeLessThanOrEqual(29)
    })
  })

  describe('getPlanStatus', () => {
    const createMockPlan = (
      startDate: string,
      endDate: string,
      status: 'active' | 'cancelled' = 'active',
    ): Plan => ({
      id: 'test-plan',
      name: 'Test Plan',
      start_date: startDate,
      end_date: endDate,
      status,
      owner_id: 'user-1',
      currency: 'USD',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      total: null,
      template_id: '',
    })

    it('should return "cancelled" for cancelled plans', () => {
      const plan = createMockPlan('2024-06-01', '2024-06-30', 'cancelled')
      expect(getPlanStatus(plan)).toBe('cancelled')
    })

    it('should return "pending" for future plans', () => {
      const plan = createMockPlan('2024-06-20', '2024-06-30')
      expect(getPlanStatus(plan)).toBe('pending')
    })

    it('should return "active" for current plans', () => {
      const plan = createMockPlan('2024-06-10', '2024-06-20')
      expect(getPlanStatus(plan)).toBe('active')
    })

    it('should return "completed" for past plans', () => {
      const plan = createMockPlan('2024-05-01', '2024-05-31')
      expect(getPlanStatus(plan)).toBe('completed')
    })

    it('should return "active" for plan starting today', () => {
      const plan = createMockPlan('2024-06-15', '2024-06-30')
      expect(getPlanStatus(plan)).toBe('active')
    })

    it('should return "active" for plan ending today', () => {
      const plan = createMockPlan('2024-06-01', '2024-06-15')
      expect(getPlanStatus(plan)).toBe('active')
    })
  })

  describe('canEditPlan', () => {
    const createMockPlan = (
      startDate: string,
      endDate: string,
      status: 'active' | 'cancelled' = 'active',
      permissionLevel?: string,
    ): Plan & { permission_level?: string } => ({
      id: 'test-plan',
      name: 'Test Plan',
      start_date: startDate,
      end_date: endDate,
      status,
      owner_id: 'user-1',
      currency: 'USD',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      total: null,
      template_id: '',
      ...(permissionLevel !== undefined && { permission_level: permissionLevel }),
    })

    it('should return false if user is not owner and has no edit permission', () => {
      const plan = createMockPlan('2024-06-10', '2024-06-20')
      expect(canEditPlan(plan, false)).toBe(false)
    })

    it('should return false for cancelled plans even if owner', () => {
      const plan = createMockPlan('2024-06-10', '2024-06-20', 'cancelled')
      expect(canEditPlan(plan, true)).toBe(false)
    })

    it('should return false for completed plans even if owner', () => {
      const plan = createMockPlan('2024-05-01', '2024-05-31')
      expect(canEditPlan(plan, true)).toBe(false)
    })

    it('should return true for active plans when user is owner', () => {
      const plan = createMockPlan('2024-06-10', '2024-06-20')
      expect(canEditPlan(plan, true)).toBe(true)
    })

    it('should return true for pending plans when user is owner', () => {
      const plan = createMockPlan('2024-06-20', '2024-06-30')
      expect(canEditPlan(plan, true)).toBe(true)
    })

    it('should return true for active plans when user has edit permission', () => {
      const plan = createMockPlan('2024-06-10', '2024-06-20', 'active', 'edit')
      expect(canEditPlan(plan, false)).toBe(true)
    })

    it('should return false for cancelled plans even with edit permission', () => {
      const plan = createMockPlan('2024-06-10', '2024-06-20', 'cancelled', 'edit')
      expect(canEditPlan(plan, false)).toBe(false)
    })

    it('should return false for view-only permission', () => {
      const plan = createMockPlan('2024-06-10', '2024-06-20', 'active', 'view')
      expect(canEditPlan(plan, false)).toBe(false)
    })
  })

  describe('canAddExpensesToPlan', () => {
    const createMockPlanWithPermission = (
      startDate: string,
      endDate: string,
      status: 'active' | 'cancelled' = 'active',
      permissionLevel?: string,
    ): Plan & { permission_level?: string } => {
      const basePlan: Plan = {
        id: 'test-plan',
        name: 'Test Plan',
        start_date: startDate,
        end_date: endDate,
        status,
        owner_id: 'user-1',
        currency: 'USD',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        total: null,
        template_id: '',
      }

      if (permissionLevel) {
        return { ...basePlan, permission_level: permissionLevel }
      }

      return basePlan
    }

    it('should return false for cancelled plans regardless of ownership', () => {
      const plan = createMockPlanWithPermission('2024-06-10', '2024-06-20', 'cancelled')
      expect(canAddExpensesToPlan(plan, true)).toBe(false)
    })

    it('should return false for completed plans regardless of ownership', () => {
      const plan = createMockPlanWithPermission('2024-05-01', '2024-05-31')
      expect(canAddExpensesToPlan(plan, true)).toBe(false)
    })

    it('should return true for owner on active plans', () => {
      const plan = createMockPlanWithPermission('2024-06-10', '2024-06-20')
      expect(canAddExpensesToPlan(plan, true)).toBe(true)
    })

    it('should return true for non-owner with edit permission', () => {
      const plan = createMockPlanWithPermission('2024-06-10', '2024-06-20', 'active', 'edit')
      expect(canAddExpensesToPlan(plan, false)).toBe(true)
    })

    it('should return false for non-owner with view permission', () => {
      const plan = createMockPlanWithPermission('2024-06-10', '2024-06-20', 'active', 'view')
      expect(canAddExpensesToPlan(plan, false)).toBe(false)
    })

    it('should return false for non-owner without permission level', () => {
      const plan = createMockPlanWithPermission('2024-06-10', '2024-06-20')
      expect(canAddExpensesToPlan(plan, false)).toBe(false)
    })
  })

  describe('getDaysRemaining', () => {
    const createMockPlan = (startDate: string, endDate: string): Plan => ({
      id: 'test-plan',
      name: 'Test Plan',
      start_date: startDate,
      end_date: endDate,
      status: 'active',
      owner_id: 'user-1',
      currency: 'USD',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      total: null,
      template_id: '',
    })

    it('should return null for non-active plans', () => {
      const plan = createMockPlan('2024-06-20', '2024-06-30')
      expect(getDaysRemaining(plan)).toBe(null)
    })

    it('should return correct days remaining for active plan', () => {
      const plan = createMockPlan('2024-06-01', '2024-06-20')
      expect(getDaysRemaining(plan)).toBe(5)
    })

    it('should return 0 for plan ending today', () => {
      const plan = createMockPlan('2024-06-01', '2024-06-15')
      expect(getDaysRemaining(plan)).toBe(0)
    })

    it('should not return negative days', () => {
      const plan = createMockPlan('2024-06-01', '2024-06-14')
      expect(getDaysRemaining(plan)).toBe(null)
    })
  })

  describe('getDaysUntilStart', () => {
    const createMockPlan = (startDate: string, endDate: string): Plan => ({
      id: 'test-plan',
      name: 'Test Plan',
      start_date: startDate,
      end_date: endDate,
      status: 'active',
      owner_id: 'user-1',
      currency: 'USD',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      total: null,
      template_id: '',
    })

    it('should return null for non-pending plans', () => {
      const plan = createMockPlan('2024-06-10', '2024-06-20')
      expect(getDaysUntilStart(plan)).toBe(null)
    })

    it('should return correct days until start for pending plan', () => {
      const plan = createMockPlan('2024-06-20', '2024-06-30')
      expect(getDaysUntilStart(plan)).toBe(5)
    })

    it('should return 0 for plan starting today', () => {
      const plan = createMockPlan('2024-06-15', '2024-06-30')
      expect(getDaysUntilStart(plan)).toBe(null)
    })

    it('should not return negative days', () => {
      const plan = createMockPlan('2024-06-14', '2024-06-20')
      expect(getDaysUntilStart(plan)).toBe(null)
    })
  })

  describe('getStatusText', () => {
    const createMockPlan = (
      startDate: string,
      endDate: string,
      status: 'active' | 'cancelled' = 'active',
    ): Plan => ({
      id: 'test-plan',
      name: 'Test Plan',
      start_date: startDate,
      end_date: endDate,
      status,
      owner_id: 'user-1',
      currency: 'USD',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      total: null,
      template_id: '',
    })

    it('should return "Cancelled" for cancelled plans', () => {
      const plan = createMockPlan('2024-06-10', '2024-06-20', 'cancelled')
      expect(getStatusText(plan)).toBe('Cancelled')
    })

    it('should return "Completed" for completed plans', () => {
      const plan = createMockPlan('2024-05-01', '2024-05-31')
      expect(getStatusText(plan)).toBe('Completed')
    })

    it('should return days left for active plan starting and ending in range', () => {
      const plan = createMockPlan('2024-06-10', '2024-06-30')
      expect(getStatusText(plan)).toBe('15 days left')
    })

    it('should return days until start for pending plan', () => {
      const plan = createMockPlan('2024-06-20', '2024-06-30')
      expect(getStatusText(plan)).toBe('Starts in 5 days')
    })

    it('should return singular day text for 1 day until start', () => {
      const plan = createMockPlan('2024-06-16', '2024-06-30')
      expect(getStatusText(plan)).toBe('Starts in 1 day')
    })

    it('should return "Ends today" for active plan ending today', () => {
      const plan = createMockPlan('2024-06-01', '2024-06-15')
      expect(getStatusText(plan)).toBe('Ends today')
    })

    it('should return "1 day left" for active plan with 1 day remaining', () => {
      const plan = createMockPlan('2024-06-01', '2024-06-16')
      expect(getStatusText(plan)).toBe('1 day left')
    })

    it('should return days left for active plan', () => {
      const plan = createMockPlan('2024-06-01', '2024-06-20')
      expect(getStatusText(plan)).toBe('5 days left')
    })
  })

  describe('getStatusColor', () => {
    const createMockPlan = (
      startDate: string,
      endDate: string,
      status: 'active' | 'cancelled' = 'active',
    ): Plan => ({
      id: 'test-plan',
      name: 'Test Plan',
      start_date: startDate,
      end_date: endDate,
      status,
      owner_id: 'user-1',
      currency: 'USD',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      total: null,
      template_id: '',
    })

    it('should return "red" for cancelled plans', () => {
      const plan = createMockPlan('2024-06-10', '2024-06-20', 'cancelled')
      expect(getStatusColor(plan)).toBe('red')
    })

    it('should return "grey" for completed plans', () => {
      const plan = createMockPlan('2024-05-01', '2024-05-31')
      expect(getStatusColor(plan)).toBe('grey')
    })

    it('should return "orange" for pending plans', () => {
      const plan = createMockPlan('2024-06-20', '2024-06-30')
      expect(getStatusColor(plan)).toBe('orange')
    })

    it('should return "green" for active plans', () => {
      const plan = createMockPlan('2024-06-10', '2024-06-20')
      expect(getStatusColor(plan)).toBe('green')
    })
  })

  describe('getStatusIcon', () => {
    const createMockPlan = (
      startDate: string,
      endDate: string,
      status: 'active' | 'cancelled' = 'active',
    ): Plan => ({
      id: 'test-plan',
      name: 'Test Plan',
      start_date: startDate,
      end_date: endDate,
      status,
      owner_id: 'user-1',
      currency: 'USD',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      total: null,
      template_id: '',
    })

    it('should return close icon for cancelled plans', () => {
      const plan = createMockPlan('2024-06-10', '2024-06-20', 'cancelled')
      expect(getStatusIcon(plan)).toBe('eva-close-circle-outline')
    })

    it('should return checkmark icon for completed plans', () => {
      const plan = createMockPlan('2024-05-01', '2024-05-31')
      expect(getStatusIcon(plan)).toBe('eva-checkmark-circle-outline')
    })

    it('should return clock icon for pending plans', () => {
      const plan = createMockPlan('2024-06-20', '2024-06-30')
      expect(getStatusIcon(plan)).toBe('eva-clock-outline')
    })

    it('should return play icon for active plans', () => {
      const plan = createMockPlan('2024-06-10', '2024-06-20')
      expect(getStatusIcon(plan)).toBe('eva-play-circle-outline')
    })
  })

  describe('formatDateRange', () => {
    it('should format date range correctly', () => {
      const result = formatDateRange('2024-01-15', '2024-02-28')
      expect(result).toBe('15 Jan - 28 Feb 2024')
    })

    it('should handle same month range', () => {
      const result = formatDateRange('2024-06-01', '2024-06-30')
      expect(result).toBe('1 Jun - 30 Jun 2024')
    })

    it('should handle single day', () => {
      const result = formatDateRange('2024-12-25', '2024-12-25')
      expect(result).toBe('25 Dec - 25 Dec 2024')
    })

    it('should handle year boundary', () => {
      const result = formatDateRange('2024-12-15', '2025-01-15')
      expect(result).toBe('15 Dec - 15 Jan 2025')
    })
  })
})
