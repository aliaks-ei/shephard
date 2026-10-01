<template>
  <div class="receipt-photo-section">
    <q-slide-transition>
      <div
        id="receipt-photo-panel"
        v-show="shouldShowPanel"
        class="receipt-photo-section__panel q-pt-sm"
      >
        <q-uploader
          ref="uploaderRef"
          label="Upload receipt photo"
          accept="image/jpeg,image/png,image/webp,image/heic"
          :max-file-size="5242880"
          :multiple="false"
          :auto-upload="false"
          color="primary"
          class="full-width"
          flat
          bordered
          @added="handlePhotoAdded"
          @removed="handlePhotoRemoved"
        />

        <div
          v-if="photoAnalysis.isAnalyzing.value"
          class="q-mt-sm q-pa-md text-center"
        >
          <q-spinner
            color="primary"
            size="32px"
          />
          <div class="text-body2 q-mt-sm">Analyzing photo...</div>
        </div>

        <div
          v-else-if="photoAnalysis.hasPhoto.value && photoAnalysis.analysisResult.value"
          class="q-mt-sm"
        >
          <div class="row items-center justify-between q-gutter-sm q-px-sm">
            <div class="text-caption text-positive">
              <q-icon
                name="eva-checkmark-circle-outline"
                size="18px"
                class="q-mr-xs"
              />
              Analysis complete ({{
                Math.round(photoAnalysis.analysisResult.value.confidence * 100)
              }}% confidence)
            </div>
            <q-btn
              label="Re-analyze"
              color="primary"
              flat
              dense
              no-caps
              size="sm"
              @click="photoAnalysis.analyzePhoto()"
            />
          </div>
        </div>

        <q-banner
          v-if="photoAnalysis.hasError.value"
          class="bg-warning-soft text-warning-strong q-mt-sm"
          dense
        >
          <template #avatar>
            <q-icon
              name="eva-alert-triangle-outline"
              color="orange-9"
            />
          </template>
          {{ photoAnalysis.errorMessage.value }}
        </q-banner>

        <p class="text-caption q-mt-sm q-mb-none text-center">
          Supports JPEG, PNG, WebP, HEIC • Max 5MB
        </p>
      </div>
    </q-slide-transition>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, toRef } from 'vue'
import type { QUploader } from 'quasar'
import { usePhotoExpenseAnalysis } from 'src/composables/usePhotoExpenseAnalysis'

const props = withDefaults(
  defineProps<{
    planId: string | null
    selectedPlanCurrency: string | null
    defaultCategoryId?: string | null
  }>(),
  {
    defaultCategoryId: null,
  },
)

const emit = defineEmits<{
  'analysis-applied': [value: { expenseName: string; amount: number; categoryId: string | null }]
}>()

const uploaderRef = ref<QUploader | null>(null)
const planIdRef = toRef(props, 'planId')
const currencyRef = toRef(props, 'selectedPlanCurrency')
const photoAnalysis = usePhotoExpenseAnalysis(planIdRef, currencyRef)
// Opened from the camera button in the expense name field
const isExpanded = defineModel<boolean>('open', { default: false })

const shouldShowPanel = computed(() => {
  return isExpanded.value || photoAnalysis.isAnalyzing.value || photoAnalysis.hasError.value
})

async function handlePhotoAdded(files: readonly File[]) {
  isExpanded.value = true
  await photoAnalysis.handleFileAdded(files)

  const result = photoAnalysis.analysisResult.value
  if (!result || result.confidence < 0.5) {
    isExpanded.value = result !== null
    return
  }

  emit('analysis-applied', {
    expenseName: result.expenseName,
    amount: result.amount,
    categoryId: props.defaultCategoryId ? null : result.categoryId,
  })

  isExpanded.value = false
}

function handlePhotoRemoved() {
  photoAnalysis.clearPhoto()
  isExpanded.value = false
}

function reset() {
  photoAnalysis.clearPhoto()
  uploaderRef.value?.reset()
  isExpanded.value = false
}

defineExpose({
  reset,
})
</script>
