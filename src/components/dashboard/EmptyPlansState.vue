<template>
  <q-card
    flat
    bordered
    class="text-center"
  >
    <q-card-section>
      <BrandIllustration
        name="plan"
        class="q-mb-sm"
      />
      <div class="text-h6 q-mb-sm">No Active plans</div>
      <div class="text-body2 text-muted q-mb-md">
        Create your first plan to start tracking expenses
      </div>
      <q-btn
        color="primary"
        label="Create plan"
        icon="eva-plus-outline"
        unelevated
        dense
        no-caps
        to="/plans"
      />
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import BrandIllustration from 'src/components/shared/BrandIllustration.vue'
</script>
