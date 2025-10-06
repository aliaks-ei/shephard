<template>
  <q-card
    flat
    bordered
    class="text-center"
  >
    <q-card-section>
      <q-icon
        name="eva-calendar-outline"
        size="64px"
        color="grey-5"
        class="q-mb-md"
      />
      <div class="text-h6 text-grey-7 q-mb-sm">No Active Plans</div>
      <div class="text-body2 text-grey-6 q-mb-md">
        Create your first plan to start tracking expenses
      </div>
      <q-btn
        color="primary"
        label="Create Plan"
        icon="eva-plus-outline"
        unelevated
        no-caps
        to="/plans"
      />
    </q-card-section>
  </q-card>
</template>
