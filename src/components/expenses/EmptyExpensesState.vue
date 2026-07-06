<template>
  <q-card
    flat
    bordered
    class="text-center q-py-lg"
  >
    <q-card-section>
      <BrandIllustration
        name="receipt"
        class="q-mb-sm"
      />
      <div class="text-h6 q-mb-sm">No expenses yet</div>
      <div class="text-body2 text-muted q-mb-md">
        Log your first expense and it will show up here
      </div>
      <q-btn
        color="primary"
        label="Add Your First Expense"
        icon="eva-plus-outline"
        unelevated
        dense
        no-caps
        @click="emit('add-expense')"
      />
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import BrandIllustration from 'src/components/shared/BrandIllustration.vue'

const emit = defineEmits<{
  'add-expense': []
}>()
</script>
