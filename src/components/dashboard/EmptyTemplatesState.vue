<template>
  <q-card
    flat
    bordered
    class="text-center"
  >
    <q-card-section>
      <BrandIllustration
        name="template"
        class="q-mb-sm"
      />
      <div class="text-h6 q-mb-sm">No Templates Yet</div>
      <div class="text-body2 text-muted q-mb-md">Create templates to quickly plan your budgets</div>
      <q-btn
        color="primary"
        label="Create Template"
        icon="eva-plus-outline"
        unelevated
        dense
        no-caps
        to="/templates"
      />
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import BrandIllustration from 'src/components/shared/BrandIllustration.vue'
</script>
