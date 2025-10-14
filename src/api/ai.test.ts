import { describe, it, expect, vi, beforeEach } from 'vitest'
import { suggestExpenseCategory, analyzeExpensePhoto } from './ai'

const { mockInvoke } = vi.hoisted(() => ({
  mockInvoke: vi.fn(),
}))

vi.mock('src/lib/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: mockInvoke,
    },
  },
}))

describe('AI API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('suggestExpenseCategory', () => {
    it('should return category suggestion when successful', async () => {
      const mockResponse = {
        success: true,
        data: {
          categoryId: 'cat-1',
          categoryName: 'Groceries',
          confidence: 0.9,
          reasoning: 'Clear match for grocery expenses',
        },
      }

      mockInvoke.mockResolvedValue({
        data: mockResponse,
        error: null,
      } as unknown as Awaited<ReturnType<typeof mockInvoke>>)

      const result = await suggestExpenseCategory('Grocery shopping', 'plan-1')

      expect(mockInvoke).toHaveBeenCalledWith('categorize-expense', {
        body: { expenseName: 'Grocery shopping', planId: 'plan-1' },
      })
      expect(result).toEqual(mockResponse.data)
    })

    it('should work without planId', async () => {
      const mockResponse = {
        success: true,
        data: {
          categoryId: 'cat-1',
          categoryName: 'Other',
          confidence: 0.7,
          reasoning: 'General category',
        },
      }

      mockInvoke.mockResolvedValue({
        data: mockResponse,
        error: null,
      } as unknown as Awaited<ReturnType<typeof mockInvoke>>)

      const result = await suggestExpenseCategory('Random expense')

      expect(mockInvoke).toHaveBeenCalledWith('categorize-expense', {
        body: { expenseName: 'Random expense', planId: undefined },
      })
      expect(result).toEqual(mockResponse.data)
    })

    it('should throw error when API call fails', async () => {
      mockInvoke.mockResolvedValue({
        data: null,
        error: { message: 'Network error' },
      } as unknown as Awaited<ReturnType<typeof mockInvoke>>)

      await expect(suggestExpenseCategory('Test', 'plan-1')).rejects.toThrow(
        'Failed to categorize expense: Network error',
      )
    })

    it('should throw error when response indicates failure', async () => {
      mockInvoke.mockResolvedValue({
        data: { success: false, error: 'Invalid expense name' },
        error: null,
      } as unknown as Awaited<ReturnType<typeof mockInvoke>>)

      await expect(suggestExpenseCategory('', 'plan-1')).rejects.toThrow('Invalid expense name')
    })
  })

  describe('analyzeExpensePhoto', () => {
    it('should return photo analysis result when successful', async () => {
      const mockResponse = {
        success: true,
        data: {
          expenseName: 'Grocery Store',
          amount: 45.99,
          categoryId: 'cat-1',
          categoryName: 'Groceries',
          confidence: 0.9,
          reasoning: 'Clear receipt with total visible',
        },
      }

      mockInvoke.mockResolvedValue({
        data: mockResponse,
        error: null,
      } as unknown as Awaited<ReturnType<typeof mockInvoke>>)

      const result = await analyzeExpensePhoto(
        'data:image/jpeg;base64,base64-image-data',
        'plan-1',
        'USD',
      )

      expect(mockInvoke).toHaveBeenCalledWith('analyze-expense-photo', {
        body: {
          imageBase64: 'data:image/jpeg;base64,base64-image-data',
          planId: 'plan-1',
          currency: 'USD',
        },
      })
      expect(result).toEqual(mockResponse.data)
    })

    it('should default to EUR when currency not provided', async () => {
      const mockResponse = {
        success: true,
        data: {
          expenseName: 'Restaurant',
          amount: 25.5,
          categoryId: 'cat-2',
          categoryName: 'Dining',
          confidence: 0.8,
          reasoning: 'Restaurant receipt',
        },
      }

      mockInvoke.mockResolvedValue({
        data: mockResponse,
        error: null,
      } as unknown as Awaited<ReturnType<typeof mockInvoke>>)

      await analyzeExpensePhoto('data:image/png;base64,base64-image-data', 'plan-1')

      expect(mockInvoke).toHaveBeenCalledWith('analyze-expense-photo', {
        body: {
          imageBase64: 'data:image/png;base64,base64-image-data',
          planId: 'plan-1',
          currency: 'EUR',
        },
      })
    })

    it('should work without planId', async () => {
      const mockResponse = {
        success: true,
        data: {
          expenseName: 'Gas Station',
          amount: 50.0,
          categoryId: 'cat-3',
          categoryName: 'Transportation',
          confidence: 0.85,
          reasoning: 'Gas receipt detected',
        },
      }

      mockInvoke.mockResolvedValue({
        data: mockResponse,
        error: null,
      } as unknown as Awaited<ReturnType<typeof mockInvoke>>)

      const result = await analyzeExpensePhoto(
        'data:image/webp;base64,base64-image-data',
        undefined,
        'GBP',
      )

      expect(mockInvoke).toHaveBeenCalledWith('analyze-expense-photo', {
        body: {
          imageBase64: 'data:image/webp;base64,base64-image-data',
          planId: undefined,
          currency: 'GBP',
        },
      })
      expect(result).toEqual(mockResponse.data)
    })

    it('should throw error when API call fails', async () => {
      mockInvoke.mockResolvedValue({
        data: null,
        error: { message: 'Network error' },
      } as unknown as Awaited<ReturnType<typeof mockInvoke>>)

      await expect(analyzeExpensePhoto('data:image/jpeg;base64,base64', 'plan-1')).rejects.toThrow(
        'Failed to analyze photo: Network error',
      )
    })

    it('should throw error when response indicates failure', async () => {
      mockInvoke.mockResolvedValue({
        data: { success: false, error: 'Invalid image format' },
        error: null,
      } as unknown as Awaited<ReturnType<typeof mockInvoke>>)

      await expect(
        analyzeExpensePhoto('data:image/jpeg;base64,invalid-base64', 'plan-1', 'EUR'),
      ).rejects.toThrow('Invalid image format')
    })

    it('should handle low confidence results', async () => {
      const mockResponse = {
        success: true,
        data: {
          expenseName: 'Unknown',
          amount: 0,
          categoryId: 'cat-default',
          categoryName: 'Other',
          confidence: 0.3,
          reasoning: 'Image too blurry to read',
        },
      }

      mockInvoke.mockResolvedValue({
        data: mockResponse,
        error: null,
      } as unknown as Awaited<ReturnType<typeof mockInvoke>>)

      const result = await analyzeExpensePhoto(
        'data:image/jpeg;base64,blurry-image-base64',
        'plan-1',
        'EUR',
      )

      expect(result.confidence).toBe(0.3)
      expect(result.expenseName).toBe('Unknown')
    })
  })
})
