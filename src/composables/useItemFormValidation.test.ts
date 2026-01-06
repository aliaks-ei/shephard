import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { validateItemForm } from './useItemFormValidation'
import type { QForm } from 'quasar'

const mockShowError = vi.fn()
vi.mock('src/composables/useBanner', () => ({
  useBanner: () => ({
    showSuccess: vi.fn(),
    showError: mockShowError,
    showWarning: vi.fn(),
    showInfo: vi.fn(),
    banners: ref([]),
    dismissBanner: vi.fn(),
    clearAllBanners: vi.fn(),
  }),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('useItemFormValidation', () => {
  describe('validateItemForm', () => {
    it('returns valid when all validations pass', async () => {
      const mockFormRef = ref({
        validate: vi.fn().mockResolvedValue(true),
      } as unknown as QForm)

      const result = await validateItemForm({
        formRef: mockFormRef,
        hasItems: true,
        hasValidItems: true,
        hasDuplicateItems: false,
        scrollToFirstInvalid: vi.fn(),
        onExpandCategories: vi.fn(),
      })

      expect(result.isValid).toBe(true)
      expect(result.hasFormErrors).toBe(false)
      expect(result.hasItemErrors).toBe(false)
    })

    it('returns invalid when form validation fails', async () => {
      const mockFormRef = ref({
        validate: vi.fn().mockResolvedValue(false),
      } as unknown as QForm)

      const result = await validateItemForm({
        formRef: mockFormRef,
        hasItems: true,
        hasValidItems: true,
        hasDuplicateItems: false,
        scrollToFirstInvalid: vi.fn(),
        onExpandCategories: vi.fn(),
      })

      expect(result.isValid).toBe(false)
      expect(result.hasFormErrors).toBe(true)
      expect(result.hasItemErrors).toBe(false)
    })

    it('shows error banner when no items exist', async () => {
      const mockFormRef = ref({
        validate: vi.fn().mockResolvedValue(true),
      } as unknown as QForm)

      const result = await validateItemForm({
        formRef: mockFormRef,
        hasItems: false,
        hasValidItems: false,
        hasDuplicateItems: false,
        scrollToFirstInvalid: vi.fn(),
        onExpandCategories: vi.fn(),
      })

      expect(result.isValid).toBe(false)
      expect(result.hasItemErrors).toBe(true)
      expect(mockShowError).toHaveBeenCalledWith('Please add at least one category with items')
    })

    it('scrolls to first invalid when items exist but are not valid', async () => {
      const mockScrollToFirstInvalid = vi.fn()
      const mockFormRef = ref({
        validate: vi.fn().mockResolvedValue(true),
      } as unknown as QForm)

      const result = await validateItemForm({
        formRef: mockFormRef,
        hasItems: true,
        hasValidItems: false,
        hasDuplicateItems: false,
        scrollToFirstInvalid: mockScrollToFirstInvalid,
        onExpandCategories: vi.fn(),
      })

      expect(result.isValid).toBe(false)
      expect(result.hasFormErrors).toBe(false)
      expect(result.hasItemErrors).toBe(true)
      expect(mockScrollToFirstInvalid).toHaveBeenCalled()
      expect(mockShowError).not.toHaveBeenCalled()
    })

    it('returns invalid when items have duplicates', async () => {
      const mockExpandCategories = vi.fn()
      const mockFormRef = ref({
        validate: vi.fn().mockResolvedValue(true),
      } as unknown as QForm)

      const result = await validateItemForm({
        formRef: mockFormRef,
        hasItems: true,
        hasValidItems: true,
        hasDuplicateItems: true,
        scrollToFirstInvalid: vi.fn(),
        onExpandCategories: mockExpandCategories,
      })

      expect(result.isValid).toBe(false)
      expect(result.hasFormErrors).toBe(false)
      expect(result.hasItemErrors).toBe(true)
      expect(mockExpandCategories).toHaveBeenCalled()
    })

    it('runs custom validation when provided', async () => {
      const customValidation = vi.fn(() => ({
        isValid: false,
        errorMessage: 'Custom error message',
      }))
      const mockFormRef = ref({
        validate: vi.fn().mockResolvedValue(true),
      } as unknown as QForm)

      const result = await validateItemForm({
        formRef: mockFormRef,
        hasItems: true,
        hasValidItems: true,
        hasDuplicateItems: false,
        customValidation,
        scrollToFirstInvalid: vi.fn(),
        onExpandCategories: vi.fn(),
      })

      expect(result.isValid).toBe(false)
      expect(result.hasFormErrors).toBe(true)
      expect(customValidation).toHaveBeenCalled()
    })

    it('returns form errors when custom validation fails without error message', async () => {
      const customValidation = vi.fn(() => ({
        isValid: false,
      }))
      const mockFormRef = ref({
        validate: vi.fn().mockResolvedValue(true),
      } as unknown as QForm)

      const result = await validateItemForm({
        formRef: mockFormRef,
        hasItems: true,
        hasValidItems: true,
        hasDuplicateItems: false,
        customValidation,
        scrollToFirstInvalid: vi.fn(),
        onExpandCategories: vi.fn(),
      })

      expect(result.isValid).toBe(false)
      expect(result.hasFormErrors).toBe(true)
    })

    it('works without formRef', async () => {
      const mockFormRef = ref(undefined)

      const result = await validateItemForm({
        formRef: mockFormRef,
        hasItems: true,
        hasValidItems: true,
        hasDuplicateItems: false,
        scrollToFirstInvalid: vi.fn(),
        onExpandCategories: vi.fn(),
      })

      expect(result.isValid).toBe(true)
      expect(result.hasFormErrors).toBe(false)
      expect(result.hasItemErrors).toBe(false)
    })

    it('skips item validation when form validation fails', async () => {
      const mockFormRef = ref({
        validate: vi.fn().mockResolvedValue(false),
      } as unknown as QForm)
      const mockScrollToFirstInvalid = vi.fn()

      const result = await validateItemForm({
        formRef: mockFormRef,
        hasItems: true,
        hasValidItems: false,
        hasDuplicateItems: false,
        scrollToFirstInvalid: mockScrollToFirstInvalid,
        onExpandCategories: vi.fn(),
      })

      expect(result.isValid).toBe(false)
      expect(result.hasFormErrors).toBe(true)
      expect(result.hasItemErrors).toBe(false)
      expect(mockScrollToFirstInvalid).not.toHaveBeenCalled()
    })
  })
})
