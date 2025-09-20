<template>
  <q-dialog
    :model-value="modelValue"
    transition-show="scale"
    transition-hide="scale"
    :maximized="$q.screen.xs"
    :full-width="$q.screen.xs"
    :full-height="$q.screen.xs"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <q-card>
      <!-- Header -->
      <q-card-section class="row items-center q-pb-none">
        <h2 class="text-h6 q-my-none">Category Details</h2>
        <q-space />
        <q-btn
          icon="eva-close-outline"
          flat
          round
          dense
          @click="closeDialog"
        />
      </q-card-section>

      <q-separator class="q-mt-md" />

      <div v-if="category">
        <!-- Hero Section -->
        <q-card-section class="text-center q-py-xl">
          <div
            class="q-pa-lg rounded-borders q-mb-md"
            :style="{
              backgroundColor: `${category.color}15`,
              border: `2px solid ${category.color}30`,
            }"
            style="display: inline-block"
          >
            <q-avatar
              :style="{ backgroundColor: category.color }"
              size="64px"
              text-color="white"
            >
              <q-icon
                :name="category.icon"
                size="32px"
              />
            </q-avatar>
          </div>

          <div class="text-h5 text-weight-medium q-mb-sm">
            {{ category.name }}
          </div>

          <q-chip
            :style="{
              backgroundColor: `${category.color}20`,
              color: category.color,
            }"
            size="md"
            class="text-weight-medium"
          >
            <q-icon
              name="eva-grid-outline"
              size="18px"
              class="q-mr-xs"
            />
            {{ category.templates.length }}
            {{ category.templates.length === 1 ? 'template' : 'templates' }}
          </q-chip>
        </q-card-section>

        <!-- Templates List -->
        <q-card-section class="q-pt-none">
          <div class="text-subtitle1 text-weight-medium q-mb-md">
            <q-icon
              name="eva-list-outline"
              class="q-mr-sm"
            />
            Templates using this category
          </div>

          <!-- Template List -->
          <q-list
            v-if="category.templates.length > 0"
            bordered
            separator
            class="rounded-borders"
          >
            <q-item
              v-for="template in category.templates"
              :key="template.id"
              clickable
              @click="navigateToTemplate(template.id)"
            >
              <q-item-section>
                <q-item-label>{{ template.name }}</q-item-label>
              </q-item-section>

              <q-item-section side>
                <div class="row items-center q-gutter-sm">
                  <q-chip
                    v-if="template.permission_level"
                    color="primary"
                    text-color="white"
                    size="sm"
                    outline
                  >
                    Shared
                  </q-chip>
                  <q-icon
                    name="eva-chevron-right-outline"
                    color="grey-6"
                  />
                </div>
              </q-item-section>
            </q-item>
          </q-list>

          <!-- Empty State -->
          <q-card
            v-else
            flat
            class="text-center q-py-lg"
            :class="$q.dark.isActive ? 'bg-black-2 text-white' : 'bg-grey-1'"
          >
            <q-icon
              name="eva-grid-outline"
              size="3rem"
              :class="$q.dark.isActive ? 'text-grey-5 q-mb-md' : 'text-grey-4 q-mb-md'"
            />
            <div
              class="text-body1 q-mb-sm"
              :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'"
            >
              No templates use this category yet
            </div>
            <div
              class="text-body2"
              :class="$q.dark.isActive ? 'text-grey-5' : 'text-grey-5'"
            >
              Templates using this category will appear here
            </div>
          </q-card>
        </q-card-section>
      </div>

      <q-card-actions
        align="right"
        class="q-pa-md"
      >
        <q-btn
          label="Close"
          flat
          no-caps
          @click="closeDialog"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import type { CategoryWithStats } from 'src/api'

const $q = useQuasar()

interface CategoryPreviewDialogProps {
  modelValue: boolean
  category: CategoryWithStats | null
}

defineProps<CategoryPreviewDialogProps>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const router = useRouter()

function closeDialog() {
  emit('update:modelValue', false)
}

function navigateToTemplate(templateId: string) {
  router.push({ name: 'template', params: { id: templateId } })
  closeDialog()
}
</script>
