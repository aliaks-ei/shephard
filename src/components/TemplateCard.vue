<template>
  <q-card
    flat
    bordered
  >
    <q-item
      clickable
      class="q-pa-md"
      @click="editTemplate"
    >
      <q-item-section>
        <div class="row items-start justify-between">
          <div class="col-10">
            <div class="text-h6 text-weight-bold q-mb-xs">
              {{ template.name }}
            </div>
            <div class="row items-center q-gutter-sm">
              <q-chip
                outline
                color="primary"
                size="sm"
                icon="eva-clock-outline"
                class="q-px-sm"
              >
                {{ template.duration }}
              </q-chip>
            </div>
          </div>
          <div class="col-2 text-right">
            <q-btn
              flat
              round
              size="sm"
              icon="eva-more-vertical-outline"
              class="text-grey-6"
              @click.stop
            >
              <q-menu
                auto-close
                anchor="bottom right"
                self="top right"
                :offset="[0, 8]"
              >
                <q-list separator>
                  <q-item
                    clickable
                    @click="editTemplate"
                  >
                    <q-item-section side>
                      <q-icon
                        name="eva-edit-outline"
                        size="18px"
                      />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>Edit Template</q-item-label>
                    </q-item-section>
                  </q-item>
                  <q-item
                    clickable
                    class="text-negative q-px-md"
                    @click="deleteTemplate"
                  >
                    <q-item-section side>
                      <q-icon
                        name="eva-trash-2-outline"
                        color="negative"
                        size="18px"
                      />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>Delete Template</q-item-label>
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-btn>
          </div>
        </div>

        <div class="q-mt-md">
          <div class="row items-end justify-between">
            <div class="col">
              <div class="text-caption text-grey-6 q-mb-xs">Total Amount</div>
              <div class="text-h5 text-weight-bold text-primary">
                {{ formatAmount(template.total) }}
              </div>
            </div>
            <div class="col-auto">
              <q-icon
                name="eva-arrow-forward-outline"
                size="20px"
                color="grey-5"
              />
            </div>
          </div>
        </div>
      </q-item-section>
    </q-item>
  </q-card>
</template>

<script setup lang="ts">
import { formatCurrency, type CurrencyCode } from 'src/utils/currency'
import type { Template } from 'src/api'

const emit = defineEmits<{
  (e: 'edit', id: string): void
  (e: 'delete', template: Template): void
}>()

const props = defineProps<{
  template: Template
}>()

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
