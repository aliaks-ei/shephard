<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    @show="onDialogShow"
    @hide="onDialogHide"
  >
    <q-card style="min-width: 350px">
      <q-card-section class="row items-center">
        <div class="col">
          <h2 class="text-h6 q-my-none">
            {{ isEditMode ? 'Edit Category' : 'Create New Category' }}
          </h2>
          <p class="text-body2 text-grey-6 q-my-none">
            {{
              isEditMode
                ? 'Update your category details'
                : 'Add a custom category for your expenses'
            }}
          </p>
        </div>
        <div class="col-auto q-ml-md">
          <q-btn
            flat
            round
            dense
            icon="eva-close-outline"
            @click="$emit('update:modelValue', false)"
          />
        </div>
      </q-card-section>

      <q-card-section>
        <q-form
          ref="formRef"
          @submit="onSubmit"
          class="q-gutter-sm"
        >
          <q-input
            v-model="categoryName"
            label="Category Name"
            outlined
            dense
            maxlength="100"
            counter
            :rules="nameRules"
            :loading="isSubmitting"
          ></q-input>

          <ColorPicker v-model="categoryColor" />
        </q-form>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn
          flat
          label="Cancel"
          @click="$emit('update:modelValue', false)"
          :disable="isSubmitting"
        />
        <q-btn
          unelevated
          :label="isEditMode ? 'Save Changes' : 'Create Category'"
          color="primary"
          :loading="isSubmitting"
          @click="onSubmit"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { QForm } from 'quasar'
import ColorPicker from './ColorPicker.vue'
import { generateRandomColor } from 'src/utils/color'
import { useCategoriesStore } from 'src/stores/categories'
import type { ExpenseCategory } from 'src/api'

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'category-saved', category: ExpenseCategory): void
}>()

const props = defineProps<{
  modelValue: boolean
  category?: ExpenseCategory | null
}>()

const categoriesStore = useCategoriesStore()
const formRef = ref<QForm>()

const categoryName = ref('')
const categoryColor = ref('')
const isSubmitting = ref(false)

const isEditMode = computed(() => !!props.category)
const nameRules = computed(() => [
  (val: string) => {
    if (!val || val.trim().length === 0) {
      return 'Category name is required'
    }
    if (val.length > 100) {
      return 'Category name must be 100 characters or less'
    }
    return true
  },
])

async function onSubmit() {
  const isValid = await formRef.value?.validate()
  if (!isValid) return

  isSubmitting.value = true

  let success = false

  if (isEditMode.value && props.category) {
    success = await categoriesStore.editCategory(props.category.id, {
      name: categoryName.value.trim(),
      color: categoryColor.value,
    })
  } else {
    success = await categoriesStore.addCategory({
      name: categoryName.value.trim(),
      color: categoryColor.value,
    })
  }

  if (success) {
    const savedCategory = categoriesStore.categories.find(
      (c) => c.name === categoryName.value.trim() && c.color === categoryColor.value,
    )
    if (savedCategory) {
      emit('category-saved', savedCategory)
    }
    emit('update:modelValue', false)
  }

  isSubmitting.value = false
}

function onDialogShow() {
  if (isEditMode.value && props.category) {
    categoryName.value = props.category.name
    categoryColor.value = props.category.color
  } else {
    categoryName.value = ''
    categoryColor.value = generateRandomColor()
  }
  formRef.value?.resetValidation()
}

function onDialogHide() {
  categoryName.value = ''
  categoryColor.value = ''
  isSubmitting.value = false
  formRef.value?.resetValidation()
}

watch(
  () => props.category,
  (newCategory) => {
    if (newCategory) {
      categoryName.value = newCategory.name
      categoryColor.value = newCategory.color
    }
  },
  { immediate: true },
)
</script>
