<template>
  <q-card
    class="cursor-pointer"
    flat
    bordered
    @click="editTemplate"
  >
    <!-- Grid View Layout -->
    <template v-if="viewMode === 'grid'">
      <q-card-section class="q-pb-sm">
        <div class="row items-start justify-between q-mb-sm">
          <div class="col-10">
            <div class="text-h5 text-primary text-weight-medium q-mb-xs">
              {{ template.name }}
            </div>
            <div class="text-body2 text-grey-6 q-mt-xs">
              <q-icon
                name="eva-clock-outline"
                size="16px"
                class="q-mr-xs"
              />
              {{ template.duration }}
            </div>
          </div>
          <div class="col-2 text-right">
            <q-btn
              flat
              round
              size="sm"
              icon="eva-more-vertical-outline"
              class="template-card__menu-btn"
              @click.stop
            >
              <q-menu auto-close>
                <q-list style="min-width: 120px">
                  <q-item
                    clickable
                    @click="editTemplate"
                  >
                    <q-item-section avatar>
                      <q-icon
                        name="eva-edit-outline"
                        color="primary"
                      />
                    </q-item-section>
                    <q-item-section>Edit</q-item-section>
                  </q-item>
                  <q-separator />
                  <q-item
                    clickable
                    class="text-negative"
                    @click="deleteTemplate"
                  >
                    <q-item-section avatar>
                      <q-icon name="eva-trash-2-outline" />
                    </q-item-section>
                    <q-item-section>Delete</q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-btn>
          </div>
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section class="q-py-md">
        <div class="text-caption text-grey-6">Total Amount</div>
        <div class="text-h5 text-weight-medium text-positive">
          {{ formatAmount(template.total) }}
        </div>
      </q-card-section>
    </template>

    <!-- List View Layout -->
    <template v-else>
      <q-card-section class="row items-center q-py-md">
        <div class="col-6">
          <div class="text-subtitle1 text-weight-medium text-primary">
            {{ template.name }}
          </div>
          <div class="text-caption text-grey-6 q-mt-xs">
            <q-icon
              name="eva-clock-outline"
              size="14px"
              class="q-mr-xs"
            />
            {{ template.duration }}
          </div>
        </div>

        <div class="col-4">
          <div class="text-caption text-grey-6">Total Amount</div>
          <div class="text-subtitle1 text-weight-medium text-positive">
            {{ formatAmount(template.total) }}
          </div>
        </div>

        <div class="col-2 text-right">
          <q-btn
            flat
            round
            size="sm"
            icon="eva-more-vertical-outline"
            @click.stop
          >
            <q-menu auto-close>
              <q-list style="min-width: 120px">
                <q-item
                  clickable
                  @click="editTemplate"
                >
                  <q-item-section avatar>
                    <q-icon
                      name="eva-edit-outline"
                      color="primary"
                    />
                  </q-item-section>
                  <q-item-section>Edit</q-item-section>
                </q-item>
                <q-separator />
                <q-item
                  clickable
                  class="text-negative"
                  @click="deleteTemplate"
                >
                  <q-item-section avatar>
                    <q-icon name="eva-trash-2-outline" />
                  </q-item-section>
                  <q-item-section>Delete</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
        </div>
      </q-card-section>
    </template>
  </q-card>
</template>

<script setup lang="ts">
import { formatCurrency, type CurrencyCode } from 'src/utils/currency'
import type { Template } from 'src/api'

const emit = defineEmits<{
  (e: 'edit', id: string): void
  (e: 'delete', template: Template): void
}>()

const props = withDefaults(
  defineProps<{
    template: Template
    viewMode?: 'grid' | 'list'
  }>(),
  {
    viewMode: 'grid',
  },
)

function editTemplate(): void {
  emit('edit', props.template.id)
}

function deleteTemplate(): void {
  emit('delete', props.template)
}

function formatAmount(amount: number | null | undefined): string {
  const currency = props.template.currency as CurrencyCode
  return formatCurrency(amount, currency)
}
</script>
