<template>
  <div class="row justify-center q-pa-md">
    <div class="col-12 col-md-10 col-lg-8 col-xl-6">
      <div class="row items-center justify-between wrap q-col-gutter-md q-mb-lg">
        <div class="col-auto">
          <h1 class="text-h4 text-weight-medium q-mb-sm q-mt-none">Templates</h1>
          <p class="text-body2 text-grey-6 q-mb-none">
            Manage your expense templates and create new ones
          </p>
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

      <q-card
        class="q-mb-lg"
        flat
        bordered
      >
        <q-card-section>
          <div class="row items-center q-col-gutter-md">
            <div class="col-12 col-sm-9">
              <q-input
                v-model="searchQuery"
                placeholder="Search templates..."
                debounce="300"
                outlined
                clearable
              >
                <template #prepend>
                  <q-icon name="eva-search-outline" />
                </template>
              </q-input>
            </div>
            <div class="col-12 col-sm-3">
              <q-select
                v-model="sortBy"
                :options="sortOptions"
                label="Sort by"
                outlined
                emit-value
              />
            </div>
          </div>
        </q-card-section>
      </q-card>

      <div v-if="areTemplatesLoading">
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

      <div
        v-else-if="hasTemplates"
        class="column q-col-gutter-xl"
      >
        <div v-if="filteredAndSortedOwnedTemplates.length > 0">
          <ExpenseTemplatesGroup
            title="My Templates"
            :templates="filteredAndSortedOwnedTemplates"
            @edit="viewTemplate"
            @delete="deleteTemplate"
            @share="openShareDialog"
          />
        </div>

        <div v-if="filteredAndSortedSharedTemplates.length > 0">
          <ExpenseTemplatesGroup
            title="Shared with Me"
            :templates="filteredAndSortedSharedTemplates"
            chip-color="secondary"
            hide-shared-badge
            @edit="viewTemplate"
            @delete="deleteTemplate"
            @share="openShareDialog"
          />
        </div>
      </div>

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

    <ShareExpenseTemplateDialog
      v-if="shareTemplateId"
      v-model="isShareDialogOpen"
      :template-id="shareTemplateId"
      @shared="onTemplateShared"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

import ShareExpenseTemplateDialog from 'src/components/expense-templates/ShareExpenseTemplateDialog.vue'
import ExpenseTemplatesGroup from 'src/components/expense-templates/ExpenseTemplatesGroup.vue'
import { useTemplatesStore } from 'src/stores/templates'
import { useNotificationStore } from 'src/stores/notification'
import { useExpenseTemplates } from 'src/composables/useExpenseTemplates'

const templatesStore = useTemplatesStore()
const notificationsStore = useNotificationStore()
const {
  searchQuery,
  sortBy,
  areTemplatesLoading,
  filteredAndSortedOwnedTemplates,
  filteredAndSortedSharedTemplates,
  hasTemplates,
  goToNewTemplate,
  viewTemplate,
  deleteTemplate,
} = useExpenseTemplates()

const isShareDialogOpen = ref(false)
const shareTemplateId = ref<string | null>(null)

const sortOptions = [
  { label: 'Name', value: 'name' },
  { label: 'Total Amount', value: 'total' },
  { label: 'Duration', value: 'duration' },
  { label: 'Created Date', value: 'created_at' },
]

function openShareDialog(templateId: string): void {
  shareTemplateId.value = templateId
  isShareDialogOpen.value = true
}

function onTemplateShared(): void {
  templatesStore.loadTemplates()
  notificationsStore.showSuccess('Template shared successfully')
}

onMounted(async () => {
  await templatesStore.loadTemplates()
})

onUnmounted(() => {
  templatesStore.reset()
})
</script>
