import type { Ref } from 'vue'
import type { QForm } from 'quasar'
import { useBanner } from 'src/composables/useBanner'

export type ItemFormValidationOptions = {
  formRef: Ref<QForm | undefined>
  hasValidItems: boolean
  hasDuplicateItems: boolean
  hasItems: boolean
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
  const { showError } = useBanner()
  let hasFormErrors = false
  let hasItemErrors = false

  if (options.customValidation) {
    const customResult = options.customValidation()
    if (!customResult.isValid) {
      hasFormErrors = true
    }
  }

  if (options.formRef.value) {
    const isFormValid = await options.formRef.value.validate()
    if (!isFormValid) {
      hasFormErrors = true
    }
  }

  // Only check items if form validation passed
  if (!hasFormErrors) {
    const isValidForSave = options.hasValidItems && !options.hasDuplicateItems

    if (!isValidForSave) {
      hasItemErrors = true

      if (!options.hasItems) {
        showError('Please add at least one category with items')
      } else if (!options.hasValidItems) {
        await options.scrollToFirstInvalid()
      } else if (options.hasDuplicateItems) {
        options.onExpandCategories()
      }
    }
  }

  return {
    isValid: !hasFormErrors && !hasItemErrors,
    hasFormErrors,
    hasItemErrors,
  }
}
