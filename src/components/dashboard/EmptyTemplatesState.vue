<template>
  <q-card
    flat
    bordered
    class="text-center"
  >
    <q-card-section>
      <q-icon
        name="eva-bookmark-outline"
        size="64px"
        color="grey-5"
        class="q-mb-md"
      />
      <div class="text-h6 text-grey-7 q-mb-sm">No Templates Yet</div>
      <div class="text-body2 text-grey-6 q-mb-md">
        Create templates to quickly plan your budgets
      </div>
      <q-btn
        color="primary"
        label="Create Template"
        icon="eva-plus-outline"
        unelevated
        no-caps
        to="/templates"
      />
    </q-card-section>
  </q-card>
</template>
