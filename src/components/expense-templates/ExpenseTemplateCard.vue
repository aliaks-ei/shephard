<template>
  <q-card
    flat
    bordered
  >
    <q-item
      clickable
      class="full-height q-pa-md"
      @click="editTemplate"
    >
      <q-item-section class="justify-between">
        <div class="row items-start justify-between">
          <div class="col-10">
            <div class="text-h6 text-weight-bold q-mb-xs">
              {{ template.name }}
            </div>
            <div class="row items-center q-gutter-xs">
              <q-badge
                v-if="isOwner && hasShares"
                outline
                color="positive"
                class="q-px-sm q-py-xs"
              >
                <q-icon
                  name="eva-people-outline"
                  size="12px"
                  class="q-mr-xs"
                />
                {{ shareText }}
              </q-badge>
              <q-badge
                v-if="!isOwner"
                outline
                color="secondary"
                class="q-px-sm q-py-xs"
              >
                <q-icon
                  name="eva-people-outline"
                  size="12px"
                  class="q-mr-xs"
                />
                shared
              </q-badge>
              <q-badge
                v-if="!isOwner && template.permission_level"
                outline
                :color="getPermissionColor(template.permission_level)"
                class="q-px-sm q-py-xs"
              >
                <q-icon
                  :name="getPermissionIcon(template.permission_level)"
                  size="12px"
                  class="q-mr-xs"
                />
                {{ getPermissionText(template.permission_level) }}
              </q-badge>
            </div>
          </div>
          <div class="col-2 text-right">
            <q-btn
              flat
              round
              size="sm"
              dense
              icon="eva-more-vertical-outline"
              class="text-grey-7"
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
                        :name="getMenuActionIcon()"
                        size="18px"
                      />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>{{ getMenuActionText() }}</q-item-label>
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
              <q-badge
                color="primary"
                text-color="white"
                class="q-px-sm q-py-xs"
              >
                <q-icon
                  name="eva-clock-outline"
                  size="14px"
                  class="q-mr-xs"
                />
                {{ template.duration }}
              </q-badge>
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
import type { ExpenseTemplateWithPermission } from 'src/api'

const emit = defineEmits<{
  (e: 'edit', id: string): void
  (e: 'delete', template: ExpenseTemplateWithPermission): void
  (e: 'share', id: string): void
}>()

const props = defineProps<{
  template: ExpenseTemplateWithPermission
}>()

const userStore = useUserStore()

const isOwner = computed(() => props.template.owner_id === userStore.userProfile?.id)

const hasShares = computed(() => {
  return isOwner.value && (props.template.share_count ?? 0) > 0
})

const shareText = computed(() => {
  const count = props.template.share_count ?? 0
  if (count === 1) return 'shared with 1 person'
  return `shared with ${count} people`
})

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

function getMenuActionText(): string {
  if (isOwner.value) return 'Edit Template'
  if (props.template.permission_level === 'edit') return 'Edit Template'
  return 'View Template'
}

function getMenuActionIcon(): string {
  if (isOwner.value) return 'eva-edit-outline'
  if (props.template.permission_level === 'edit') return 'eva-edit-outline'
  return 'eva-eye-outline'
}
</script>
