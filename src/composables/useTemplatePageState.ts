import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'

import { useCategoriesQuery } from 'src/queries/categories'
import { useDeleteTemplateMutation } from 'src/queries/templates'
import { useTemplateItems } from 'src/composables/useTemplateItems'
import { useTemplate } from 'src/composables/useTemplate'
import { useDetailPageState } from 'src/composables/useDetailPageState'
import { useEditablePage } from 'src/composables/useEditablePage'
import { useCategoryRefs } from 'src/composables/useCategoryRefs'
import { validateItemForm } from 'src/composables/useItemFormValidation'
import type { ActionBarAction } from 'src/components/shared/ActionBar.vue'
import type { Category, CurrencyCode } from 'src/api'

export function useTemplatePageState() {
  const router = useRouter()
  const { categories } = useCategoriesQuery()
  const deleteTemplateMutation = useDeleteTemplateMutation()

  const {
    currentTemplate,
    isTemplateLoading,
    isNewTemplate,
    routeTemplateId,
    isEditMode,
    templateCurrency,
    createNewTemplateWithItems,
    updateExistingTemplateWithItems,
    loadTemplate,
  } = useTemplate()

  const {
    templateItems,
    totalAmount,
    hasItems,
    hasValidItems,
    hasDuplicateItems,
    categoryGroups,
    addTemplateItem,
    updateTemplateItem,
    removeTemplateItem,
    loadTemplateItems,
    getTemplateItemsForSave,
    getUsedCategoryIds,
  } = useTemplateItems()

  const pageConfig = {
    entityName: 'Template',
    entityNamePlural: 'Templates',
    listRoute: '/templates',
    listIcon: 'eva-grid-outline',
  }

  const { pageTitle } = useDetailPageState(pageConfig, isNewTemplate.value, !isEditMode.value)

  const { openDialog, closeDialog, getDialogState } = useEditablePage()

  const {
    lastAddedCategoryId,
    setCategoryRef,
    focusLastItemInCategory,
    scrollToFirstInvalidField,
    resetLastAddedCategory,
  } = useCategoryRefs(templateItems)

  const editViewRef = ref()
  const allCategoriesExpanded = ref(false)
  const showDeleteDialog = ref(false)
  const form = ref({
    name: '',
    duration: 'monthly' as string,
    currency: templateCurrency.value,
  })

  const nameError = ref(false)
  const nameErrorMessage = ref('')

  const showCategoryDialog = computed({
    get: () => getDialogState('category'),
    set: (value: boolean) => (value ? openDialog('category') : closeDialog('category')),
  })

  const isShareDialogOpen = computed({
    get: () => getDialogState('share'),
    set: (value: boolean) => (value ? openDialog('share') : closeDialog('share')),
  })

  const actionBarActions = computed<ActionBarAction[]>(() => [
    {
      key: 'add-category',
      icon: 'eva-plus-outline',
      label: 'Category',
      color: 'primary',
      priority: 'primary',
      visible: isEditMode.value,
      handler: () => openDialog('category'),
    },
    {
      key: 'save',
      icon: 'eva-save-outline',
      label: isNewTemplate.value ? 'Create' : 'Save',
      color: isNewTemplate.value ? 'primary' : 'positive',
      priority: 'primary',
      loading: deleteTemplateMutation.isPending.value,
      handler: saveTemplate,
    },
    {
      key: 'share',
      icon: 'eva-share-outline',
      label: 'Share',
      color: 'info',
      priority: 'secondary',
      visible: !isNewTemplate.value && isEditMode.value,
      handler: () => openDialog('share'),
    },
    {
      key: 'delete',
      icon: 'eva-trash-2-outline',
      label: 'Delete',
      color: 'negative',
      priority: 'secondary',
      visible: !isNewTemplate.value && isEditMode.value,
      handler: () => {
        showDeleteDialog.value = true
      },
    },
  ])

  async function handleAddTemplateItem(categoryId: string, categoryColor: string): Promise<void> {
    addTemplateItem(categoryId, categoryColor)

    await nextTick()
    focusLastItemInCategory(categoryId)
  }

  async function onCategorySelected(category: Category): Promise<void> {
    addTemplateItem(category.id, category.color || '#1976d2')
    lastAddedCategoryId.value = category.id
    closeDialog('category')

    await nextTick()
    focusLastItemInCategory(category.id)
  }

  function openCategoryDialog(): void {
    openDialog('category')
  }

  function toggleAllCategories(): void {
    allCategoriesExpanded.value = !allCategoriesExpanded.value
    if (allCategoriesExpanded.value) {
      lastAddedCategoryId.value = null
    }
  }

  function goBack(): void {
    router.push({ name: 'templates' })
  }

  function clearNameError(): void {
    nameError.value = false
    nameErrorMessage.value = ''
  }

  async function saveTemplate(): Promise<void> {
    resetLastAddedCategory()
    clearNameError()

    const validationResult = await validateItemForm({
      formRef: editViewRef.value?.formRef ? ref(editViewRef.value.formRef) : ref(undefined),
      hasItems: hasItems.value,
      hasValidItems: hasValidItems.value,
      hasDuplicateItems: hasDuplicateItems.value,
      customValidation: () => {
        if (!form.value.name || form.value.name.trim().length === 0) {
          nameError.value = true
          nameErrorMessage.value = 'Template name is required'
          return { isValid: false }
        }
        return { isValid: true }
      },
      scrollToFirstInvalid: scrollToFirstInvalidField,
      onExpandCategories: () => {
        allCategoriesExpanded.value = true
        nextTick()
      },
    })

    if (!validationResult.isValid) return

    const templateItemsForSave = getTemplateItemsForSave()

    let result
    if (isNewTemplate.value) {
      result = await createNewTemplateWithItems(
        form.value.name.trim(),
        form.value.duration,
        form.value.currency,
        totalAmount.value,
        templateItemsForSave,
      )
    } else {
      result = await updateExistingTemplateWithItems(
        form.value.name.trim(),
        form.value.duration,
        form.value.currency,
        totalAmount.value,
        templateItemsForSave,
      )
    }

    if (result.success) {
      goBack()
    }
  }

  async function loadCurrentTemplate(): Promise<void> {
    const template = await loadTemplate()

    if (!template) return

    form.value.name = template.name
    form.value.duration = template.duration
    form.value.currency = (template.currency as CurrencyCode) || templateCurrency.value

    loadTemplateItems(template)
  }

  async function deleteTemplate(): Promise<void> {
    if (!routeTemplateId.value) return

    await deleteTemplateMutation.mutateAsync(routeTemplateId.value)
    showDeleteDialog.value = false
    goBack()
  }

  function onTemplateShared(): void {
    closeDialog('share')
  }

  onMounted(async () => {
    await loadCurrentTemplate()
  })

  return {
    currentTemplate,
    isTemplateLoading,
    isNewTemplate,
    routeTemplateId,
    isEditMode,
    templateCurrency,
    categories,
    pageTitle,
    categoryGroups,
    totalAmount,
    hasDuplicateItems,
    nameError,
    nameErrorMessage,
    lastAddedCategoryId,
    setCategoryRef,
    editViewRef,
    form,
    allCategoriesExpanded,
    actionBarActions,
    showCategoryDialog,
    isShareDialogOpen,
    showDeleteDialog,
    deleteTemplateMutation,
    getUsedCategoryIds,
    updateTemplateItem,
    removeTemplateItem,
    handleAddTemplateItem,
    saveTemplate,
    clearNameError,
    onCategorySelected,
    openCategoryDialog,
    toggleAllCategories,
    goBack,
    onTemplateShared,
    deleteTemplate,
  }
}
