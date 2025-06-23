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
            <div class="row items-center q-gutter-xs">
              <q-chip
                outline
                color="primary"
                size="sm"
                icon="eva-clock-outline"
                class="q-px-sm"
              >
                {{ template.duration }}
              </q-chip>
              <q-chip
                v-if="!isOwner"
                outline
                color="secondary"
                size="sm"
                icon="eva-people-outline"
                class="q-px-sm"
              >
                shared
              </q-chip>
              <q-chip
                v-if="!isOwner && template.permission_level"
                outline
                :color="getPermissionColor(template.permission_level)"
                size="sm"
                :icon="getPermissionIcon(template.permission_level)"
                class="q-px-sm"
              >
                {{ getPermissionText(template.permission_level) }}
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
                    v-if="isOwner"
                    clickable
                    @click="shareTemplate"
                  >
                    <q-item-section side>
                      <q-icon
                        name="eva-share-outline"
                        size="18px"
                      />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>Share Template</q-item-label>
                    </q-item-section>
                  </q-item>
                  <q-item
                    v-if="isOwner"
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
import { computed } from 'vue'
import { formatCurrency, type CurrencyCode } from 'src/utils/currency'
import { useUserStore } from 'src/stores/user'
import type { TemplateWithPermission } from 'src/api'

const emit = defineEmits<{
  (e: 'edit', id: string): void
  (e: 'delete', template: TemplateWithPermission): void
  (e: 'share', id: string): void
}>()

const props = defineProps<{
  template: TemplateWithPermission
}>()

const userStore = useUserStore()

const isOwner = computed(() => props.template.owner_id === userStore.userProfile?.id)

function editTemplate(): void {
  emit('edit', props.template.id)
}

function deleteTemplate(): void {
  emit('delete', props.template)
}

function shareTemplate(): void {
  emit('share', props.template.id)
}

function formatAmount(amount: number | null | undefined): string {
  const currency = props.template.currency as CurrencyCode
  return formatCurrency(amount, currency)
}

function getPermissionText(permission: string): string {
  switch (permission) {
    case 'view':
      return 'view only'
    case 'edit':
      return 'can edit'
    default:
      return 'unknown'
  }
}

function getPermissionColor(permission: string): string {
  switch (permission) {
    case 'view':
      return 'warning'
    case 'edit':
      return 'positive'
    default:
      return 'grey'
  }
}

function getPermissionIcon(permission: string): string {
  switch (permission) {
    case 'view':
      return 'eva-eye-outline'
    case 'edit':
      return 'eva-edit-outline'
    default:
      return 'eva-question-mark-outline'
  }
}
</script>
