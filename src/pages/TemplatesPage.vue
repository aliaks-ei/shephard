<template>
  <div class="row justify-center q-pa-md">
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
        class="q-mb-md"
      >
        <q-card-section>
          <div class="row items-center q-col-gutter-md">
            <div class="col-12 col-sm-9">
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
            <div class="col-12 col-sm-3">
              <q-select
                v-model="sortBy"
                outlined
                :options="sortOptions"
                label="Sort by"
                emit-value
              />
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Loading State with Skeletons -->
      <div v-if="isLoading">
        <div class="row q-col-gutter-lg">
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
      </div>

      <!-- Templates Sections -->
      <div
        v-else-if="
          filteredAndSortedOwnedTemplates.length > 0 || filteredAndSortedSharedTemplates.length > 0
        "
      >
        <!-- Owned Templates Section -->
        <div
          v-if="filteredAndSortedOwnedTemplates.length > 0"
          class="q-mb-xl"
        >
          <div class="row items-center justify-between q-mb-md">
            <div class="row items-center text-h6 text-weight-medium">
              <q-icon
                name="eva-person-outline"
                class="q-mr-sm"
              />
              My Templates
              <q-chip
                :label="filteredAndSortedOwnedTemplates.length"
                color="primary"
                text-color="white"
                size="sm"
                class="q-ml-sm"
              />
            </div>
          </div>

          <div class="row q-col-gutter-md">
            <div
              v-for="template in filteredAndSortedOwnedTemplates"
              :key="template.id"
              class="col-12 col-sm-6 col-lg-4 col-xl-3"
            >
              <ExpenseTemplateCard
                class="full-height"
                :template="template"
                @edit="viewTemplate"
                @delete="deleteTemplate"
                @share="openShareDialog"
              />
            </div>
          </div>
        </div>

        <!-- Shared Templates Section -->
        <div v-if="filteredAndSortedSharedTemplates.length > 0">
          <div class="row items-center justify-between q-mb-md">
            <div class="row items-center text-h6 text-weight-medium">
              <q-icon
                name="eva-people-outline"
                class="q-mr-sm"
              />
              Shared with Me
              <q-chip
                :label="filteredAndSortedSharedTemplates.length"
                color="secondary"
                text-color="white"
                size="sm"
                class="q-ml-sm"
              />
            </div>
          </div>

          <div class="row q-col-gutter-md">
            <div
              v-for="template in filteredAndSortedSharedTemplates"
              :key="template.id"
              class="col-12 col-sm-6 col-lg-4 col-xl-3"
            >
              <ExpenseTemplateCard
                :template="template"
                @edit="viewTemplate"
                @delete="deleteTemplate"
                @share="openShareDialog"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
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
    </div>

    <!-- Share Template Dialog -->
    <ShareExpenseTemplateDialog
      v-if="shareTemplateId"
      v-model="isShareDialogOpen"
      :template-id="shareTemplateId"
      @shared="onTemplateShared"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'

import { useTemplatesStore } from 'src/stores/templates'
import { useNotificationStore } from 'src/stores/notification'
import ExpenseTemplateCard from 'src/components/expense-templates/ExpenseTemplateCard.vue'
import ShareExpenseTemplateDialog from 'src/components/expense-templates/ShareExpenseTemplateDialog.vue'
import type { ExpenseTemplateWithPermission } from 'src/api'

const router = useRouter()
const $q = useQuasar()
const templatesStore = useTemplatesStore()
const notificationsStore = useNotificationStore()

const searchQuery = ref('')
const sortBy = ref('name')
const isShareDialogOpen = ref(false)
const shareTemplateId = ref<string | null>(null)

const sortOptions = [
  { label: 'Name', value: 'name' },
  { label: 'Total Amount', value: 'total' },
  { label: 'Duration', value: 'duration' },
  { label: 'Created Date', value: 'created_at' },
]

const isLoading = computed(() => templatesStore.isLoading && templatesStore.templates.length === 0)

// Helper function to filter and sort templates
function filterAndSortTemplates(templates: ExpenseTemplateWithPermission[]) {
  let filtered = templates

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(
      (template) =>
        template.name.toLowerCase().includes(query) ||
        template.duration?.toLowerCase().includes(query),
    )
  }

  return [...filtered].sort((a, b) => {
    switch (sortBy.value) {
      case 'total':
        return (b.total || 0) - (a.total || 0)
      case 'duration':
        return (a.duration || '').localeCompare(b.duration || '')
      case 'created_at':
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      default:
        return (a.name ?? '').localeCompare(b.name ?? '')
    }
  })
}

const filteredAndSortedOwnedTemplates = computed(() => {
  return filterAndSortTemplates(templatesStore.ownedTemplates)
})

const filteredAndSortedSharedTemplates = computed(() => {
  return filterAndSortTemplates(templatesStore.sharedTemplates)
})

function goToNewTemplate(): void {
  router.push({ name: 'new-template' })
}

function viewTemplate(id: string): void {
  router.push({ name: 'template', params: { id } })
}

function deleteTemplate(template: ExpenseTemplateWithPermission): void {
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

function openShareDialog(templateId: string): void {
  shareTemplateId.value = templateId
  isShareDialogOpen.value = true
}

function onTemplateShared(): void {
  // Refresh templates to show updated share counts
  templatesStore.loadTemplates()
  // Show success message
  notificationsStore.showSuccess('Template shared successfully')
}

onMounted(async () => {
  await templatesStore.loadTemplates()
})

onUnmounted(() => {
  templatesStore.reset()
})
</script>
