<template>
  <div class="q-mb-md">
    <q-uploader
      ref="uploaderRef"
      label="Upload Receipt Photo"
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
      <div class="row items-center justify-between q-px-sm">
        <div class="text-caption text-positive">
          <q-icon
            name="eva-checkmark-circle-outline"
            size="18px"
            class="q-mr-xs"
          />
          Analysis complete ({{ Math.round(photoAnalysis.analysisResult.value.confidence * 100) }}%
          confidence)
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
      class="bg-orange-1 text-orange-9 q-mt-sm"
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

    <p class="text-caption text-grey-7 q-mt-sm q-mb-none text-center">
      Supports JPEG, PNG, WebP, HEIC • Max 5MB
    </p>
  </div>

  <div class="row items-center q-mb-md">
    <q-separator class="col" />
    <span class="q-mx-md text-grey-6 text-caption text-weight-medium"> OR ENTER MANUALLY </span>
    <q-separator class="col" />
  </div>
</template>

<script setup lang="ts">
import { ref, toRef } from 'vue'
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
  (
    e: 'analysis-applied',
    value: { expenseName: string; amount: number; categoryId: string | null },
  ): void
}>()

const uploaderRef = ref<QUploader | null>(null)
const planIdRef = toRef(props, 'planId')
const currencyRef = toRef(props, 'selectedPlanCurrency')
const photoAnalysis = usePhotoExpenseAnalysis(planIdRef, currencyRef)

async function handlePhotoAdded(files: readonly File[]) {
  await photoAnalysis.handleFileAdded(files)

  const result = photoAnalysis.analysisResult.value
  if (!result || result.confidence < 0.5) {
    return
  }

  emit('analysis-applied', {
    expenseName: result.expenseName,
    amount: result.amount,
    categoryId: props.defaultCategoryId ? null : result.categoryId,
  })
}

function handlePhotoRemoved() {
  photoAnalysis.clearPhoto()
}

function reset() {
  photoAnalysis.clearPhoto()
  uploaderRef.value?.reset()
}

defineExpose({
  reset,
})
</script>
