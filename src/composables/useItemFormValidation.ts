import type { Ref } from 'vue'
import type { QForm } from 'quasar'
import { useNotificationStore } from 'src/stores/notification'

export type ItemFormValidationOptions = {
  formRef: Ref<QForm | undefined>
  hasValidItems: boolean
  hasDuplicateItems: boolean
  customValidation?: () => { isValid: boolean; errorMessage?: string }
  scrollToFirstInvalid: () => Promise<void>
  onExpandCategories: () => void
}

export type ItemFormValidationResult = {
  isValid: boolean
  hasFormErrors: boolean
  hasItemErrors: boolean
}

export async function validateItemForm(
  options: ItemFormValidationOptions,
): Promise<ItemFormValidationResult> {
  const notificationsStore = useNotificationStore()
  let hasFormErrors = false
  let hasItemErrors = false

  if (options.customValidation) {
    const customResult = options.customValidation()
    if (!customResult.isValid) {
      if (customResult.errorMessage) {
        notificationsStore.showError(customResult.errorMessage)
      }
      hasFormErrors = true
    }
  }

  if (options.formRef.value) {
    const isFormValid = await options.formRef.value.validate()
    if (!isFormValid) {
      hasFormErrors = true
    }
  }

  const isValidForSave = options.hasValidItems && !options.hasDuplicateItems

  if (!isValidForSave) {
    hasItemErrors = true

    if (!options.hasValidItems) {
      await options.scrollToFirstInvalid()
    } else if (options.hasDuplicateItems) {
      notificationsStore.showError(
        'You have duplicate item names within the same category. Please use unique names.',
      )
      options.onExpandCategories()
    }
  }

  if (hasFormErrors) {
    notificationsStore.showError('Please fix the form errors before saving')
  }

  return {
    isValid: !hasFormErrors && !hasItemErrors,
    hasFormErrors,
    hasItemErrors,
  }
}
