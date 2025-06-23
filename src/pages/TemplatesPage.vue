<template>
  <div class="q-pa-md">
    <div class="row justify-center">
      <div class="col-12 col-md-10 col-lg-8 col-xl-6">
        <!-- Enhanced Header Section -->
        <div class="row items-center justify-between q-mb-lg">
          <div class="col">
            <div class="text-h4 text-weight-medium q-mb-sm">Templates</div>
            <div class="text-body2 text-grey-6">
              Manage your expense templates and create new ones
            </div>
          </div>
          <div class="col-auto">
            <q-btn
              color="primary"
              icon="eva-plus-outline"
              label="Create Template"
              unelevated
              @click="goToNewTemplate"
            />
          </div>
        </div>

        <!-- Enhanced Search and Filters Section -->
        <q-card
          flat
          bordered
          class="q-mb-lg"
        >
          <q-card-section>
            <div class="row items-center q-col-gutter-lg">
              <div class="col-12 col-sm-7">
                <q-input
                  v-model="searchQuery"
                  outlined
                  placeholder="Search templates..."
                  clearable
                  debounce="300"
                >
                  <template #prepend>
                    <q-icon name="eva-search-outline" />
                  </template>
                </q-input>
              </div>
              <div class="col-6 col-sm-3">
                <q-btn-toggle
                  v-model="viewMode"
                  toggle-color="primary"
                  flat
                  :options="[
                    { label: 'Grid', value: 'grid', icon: 'eva-grid-outline' },
                    { label: 'List', value: 'list', icon: 'eva-list-outline' },
                  ]"
                />
              </div>
              <div class="col-6 col-sm-2">
                <q-select
                  v-model="sortBy"
                  outlined
                  dense
                  :options="sortOptions"
                  label="Sort by"
                  style="min-width: 120px"
                />
              </div>
            </div>
          </q-card-section>
        </q-card>

        <!-- Loading State with Skeletons -->
        <div v-if="isLoading">
          <!-- Grid Skeleton -->
          <div
            v-if="viewMode === 'grid'"
            class="row q-col-gutter-lg"
          >
            <div
              v-for="n in 6"
              :key="n"
              class="col-12 col-sm-6 col-lg-4 col-xl-3"
            >
              <q-card
                flat
                bordered
              >
                <q-card-section>
                  <q-skeleton
                    type="text"
                    width="60%"
                    height="24px"
                    class="q-mb-sm"
                  />
                  <q-skeleton
                    type="text"
                    width="40%"
                    height="16px"
                    class="q-mb-md"
                  />
                  <q-skeleton
                    type="text"
                    width="80%"
                    height="16px"
                  />
                </q-card-section>
              </q-card>
            </div>
          </div>

          <!-- List Skeleton -->
          <div
            v-else
            class="column q-gutter-md"
          >
            <q-card
              v-for="n in 6"
              :key="n"
              flat
              bordered
            >
              <q-card-section>
                <q-skeleton
                  type="text"
                  width="60%"
                  height="24px"
                  class="q-mb-sm"
                />
                <q-skeleton
                  type="text"
                  width="40%"
                  height="16px"
                  class="q-mb-md"
                />
                <q-skeleton
                  type="text"
                  width="80%"
                  height="16px"
                />
              </q-card-section>
            </q-card>
          </div>
        </div>

        <!-- Templates Grid/List -->
        <div v-else-if="filteredAndSortedTemplates.length > 0">
          <!-- Grid View -->
          <div
            v-if="viewMode === 'grid'"
            class="row q-col-gutter-lg"
          >
            <div
              v-for="template in filteredAndSortedTemplates"
              :key="template.id"
              class="col-12 col-sm-6 col-lg-4 col-xl-3"
            >
              <TemplateCard
                :template="template"
                :view-mode="viewMode"
                @edit="viewTemplate"
                @delete="deleteTemplate"
              />
            </div>
          </div>

          <!-- List View -->
          <div
            v-else
            class="column q-gutter-md"
          >
            <TemplateCard
              v-for="template in filteredAndSortedTemplates"
              :key="template.id"
              :template="template"
              :view-mode="viewMode"
              @edit="viewTemplate"
              @delete="deleteTemplate"
            />
          </div>
        </div>

        <!-- Enhanced Empty State -->
        <q-card
          v-else
          flat
          class="text-center q-py-xl"
        >
          <q-card-section>
            <q-icon
              :name="searchQuery ? 'eva-search-outline' : 'eva-file-text-outline'"
              size="4rem"
              class="text-grey-4 q-mb-md"
            />

            <div class="text-h5 q-mb-sm text-grey-7">
              {{ searchQuery ? 'No templates found' : 'No templates yet' }}
            </div>

            <div class="text-body2 text-grey-5 q-mb-lg">
              {{
                searchQuery
                  ? 'Try adjusting your search terms or create a new template'
                  : 'Create your first template to start managing your expenses efficiently'
              }}
            </div>

            <!-- Empty State Actions -->
            <div class="q-gutter-sm">
              <q-btn
                v-if="searchQuery"
                flat
                color="primary"
                icon="eva-close-outline"
                label="Clear Search"
                @click="searchQuery = ''"
              />
              <q-btn
                color="primary"
                icon="eva-plus-outline"
                label="Create Your First Template"
                unelevated
                @click="goToNewTemplate"
              />
            </div>
          </q-card-section>
        </q-card>

        <!-- Floating Action Button for Mobile -->
        <q-page-sticky
          position="bottom-right"
          :offset="[18, 18]"
          class="mobile-only"
        >
          <q-fab
            color="primary"
            icon="eva-plus-outline"
            direction="up"
            @click="goToNewTemplate"
          />
        </q-page-sticky>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'

import { useTemplatesStore } from 'src/stores/templates'
import { useNotificationStore } from 'src/stores/notification'
import TemplateCard from 'src/components/TemplateCard.vue'
import type { Template } from 'src/api'

const router = useRouter()
const $q = useQuasar()
const templatesStore = useTemplatesStore()
const notificationsStore = useNotificationStore()

const searchQuery = ref('')
const viewMode = ref<'grid' | 'list'>('grid')
const sortBy = ref('name')

const sortOptions = [
  { label: 'Name', value: 'name' },
  { label: 'Total Amount', value: 'total' },
  { label: 'Duration', value: 'duration' },
  { label: 'Created Date', value: 'created_at' },
]

const isLoading = computed(() => templatesStore.isLoading && templatesStore.templates.length === 0)
const filteredAndSortedTemplates = computed(() => {
  let filtered = templatesStore.templates

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(
      (template) =>
        template.name.toLowerCase().includes(query) ||
        template.duration?.toLowerCase().includes(query),
    )
  }

  filtered = [...filtered].sort((a, b) => {
    switch (sortBy.value) {
      case 'total':
        return (b.total || 0) - (a.total || 0)
      case 'duration':
        return (a.duration || '').localeCompare(b.duration || '')
      case 'created_at':
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      default:
        return a.name.localeCompare(b.name)
    }
  })

  return filtered
})

function goToNewTemplate(): void {
  router.push({ name: 'new-template' })
}

function viewTemplate(id: string): void {
  router.push({ name: 'template', params: { id } })
}

function deleteTemplate(template: Template): void {
  $q.dialog({
    title: 'Delete Template',
    message: `Are you sure you want to delete "${template.name}"? This action cannot be undone.`,
    persistent: true,
    ok: {
      label: 'Delete',
      color: 'negative',
      unelevated: true,
    },
    cancel: {
      label: 'Cancel',
      flat: true,
    },
  }).onOk(() => {
    templatesStore.removeTemplate(template.id)
    notificationsStore.showSuccess('Template deleted successfully')
  })
}

onMounted(async () => {
  await templatesStore.loadTemplates()
})

onUnmounted(() => {
  templatesStore.reset()
})
</script>
