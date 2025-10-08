import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { createTestingPinia, type TestingPinia } from '@pinia/testing'
import { setActivePinia } from 'pinia'
import { validateItemForm } from './useItemFormValidation'
import { useNotificationStore } from 'src/stores/notification'
import type { QForm } from 'quasar'

let pinia: TestingPinia

beforeEach(() => {
  pinia = createTestingPinia({ createSpy: vi.fn })
  setActivePinia(pinia)
})

describe('useItemFormValidation', () => {
  describe('validateItemForm', () => {
    it('returns valid when all validations pass', async () => {
      const mockFormRef = ref({
        validate: vi.fn().mockResolvedValue(true),
      } as unknown as QForm)

      const result = await validateItemForm({
        formRef: mockFormRef,
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
      const notificationStore = useNotificationStore()
      const mockFormRef = ref({
        validate: vi.fn().mockResolvedValue(false),
      } as unknown as QForm)

      const result = await validateItemForm({
        formRef: mockFormRef,
        hasValidItems: true,
        hasDuplicateItems: false,
        scrollToFirstInvalid: vi.fn(),
        onExpandCategories: vi.fn(),
      })

      expect(result.isValid).toBe(false)
      expect(result.hasFormErrors).toBe(true)
      expect(result.hasItemErrors).toBe(false)
      expect(notificationStore.showError).toHaveBeenCalledWith(
        'Please fix the form errors before saving',
      )
    })

    it('returns invalid when items are not valid', async () => {
      const mockScrollToFirstInvalid = vi.fn()
      const mockFormRef = ref({
        validate: vi.fn().mockResolvedValue(true),
      } as unknown as QForm)

      const result = await validateItemForm({
        formRef: mockFormRef,
        hasValidItems: false,
        hasDuplicateItems: false,
        scrollToFirstInvalid: mockScrollToFirstInvalid,
        onExpandCategories: vi.fn(),
      })

      expect(result.isValid).toBe(false)
      expect(result.hasFormErrors).toBe(false)
      expect(result.hasItemErrors).toBe(true)
      expect(mockScrollToFirstInvalid).toHaveBeenCalled()
    })

    it('returns invalid when items have duplicates', async () => {
      const notificationStore = useNotificationStore()
      const mockExpandCategories = vi.fn()
      const mockFormRef = ref({
        validate: vi.fn().mockResolvedValue(true),
      } as unknown as QForm)

      const result = await validateItemForm({
        formRef: mockFormRef,
        hasValidItems: true,
        hasDuplicateItems: true,
        scrollToFirstInvalid: vi.fn(),
        onExpandCategories: mockExpandCategories,
      })

      expect(result.isValid).toBe(false)
      expect(result.hasFormErrors).toBe(false)
      expect(result.hasItemErrors).toBe(true)
      expect(mockExpandCategories).toHaveBeenCalled()
      expect(notificationStore.showError).toHaveBeenCalledWith(
        'You have duplicate item names within the same category. Please use unique names.',
      )
    })

    it('runs custom validation when provided', async () => {
      const notificationStore = useNotificationStore()
      const customValidation = vi.fn(() => ({
        isValid: false,
        errorMessage: 'Custom error message',
      }))
      const mockFormRef = ref({
        validate: vi.fn().mockResolvedValue(true),
      } as unknown as QForm)

      const result = await validateItemForm({
        formRef: mockFormRef,
        hasValidItems: true,
        hasDuplicateItems: false,
        customValidation,
        scrollToFirstInvalid: vi.fn(),
        onExpandCategories: vi.fn(),
      })

      expect(result.isValid).toBe(false)
      expect(result.hasFormErrors).toBe(true)
      expect(customValidation).toHaveBeenCalled()
      expect(notificationStore.showError).toHaveBeenCalledWith('Custom error message')
    })

    it('does not show custom error message when not provided', async () => {
      const notificationStore = useNotificationStore()
      const customValidation = vi.fn(() => ({
        isValid: false,
      }))
      const mockFormRef = ref({
        validate: vi.fn().mockResolvedValue(true),
      } as unknown as QForm)

      const result = await validateItemForm({
        formRef: mockFormRef,
        hasValidItems: true,
        hasDuplicateItems: false,
        customValidation,
        scrollToFirstInvalid: vi.fn(),
        onExpandCategories: vi.fn(),
      })

      expect(result.isValid).toBe(false)
      expect(result.hasFormErrors).toBe(true)
      expect(notificationStore.showError).toHaveBeenCalledWith(
        'Please fix the form errors before saving',
      )
    })

    it('works without formRef', async () => {
      const mockFormRef = ref(undefined)

      const result = await validateItemForm({
        formRef: mockFormRef,
        hasValidItems: true,
        hasDuplicateItems: false,
        scrollToFirstInvalid: vi.fn(),
        onExpandCategories: vi.fn(),
      })

      expect(result.isValid).toBe(true)
      expect(result.hasFormErrors).toBe(false)
      expect(result.hasItemErrors).toBe(false)
    })

    it('handles multiple validation failures', async () => {
      const notificationStore = useNotificationStore()
      const mockFormRef = ref({
        validate: vi.fn().mockResolvedValue(false),
      } as unknown as QForm)

      const result = await validateItemForm({
        formRef: mockFormRef,
        hasValidItems: false,
        hasDuplicateItems: false,
        scrollToFirstInvalid: vi.fn(),
        onExpandCategories: vi.fn(),
      })

      expect(result.isValid).toBe(false)
      expect(result.hasFormErrors).toBe(true)
      expect(result.hasItemErrors).toBe(true)
      expect(notificationStore.showError).toHaveBeenCalledWith(
        'Please fix the form errors before saving',
      )
    })
  })
})
