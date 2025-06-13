<template>
  <q-page class="templates-page">
    <div class="q-pa-lg">
      <!-- Header with search and add button -->
      <div class="row items-center justify-between q-mb-lg">
        <div class="col-6">
          <q-input
            v-model="searchQuery"
            dense
            outlined
            placeholder="Search templates..."
            clear-icon="eva-close-circle-outline"
            clearable
          >
            <template #prepend>
              <q-icon name="eva-search-outline" />
            </template>
          </q-input>
        </div>
        <div class="col-auto">
          <q-btn
            color="primary"
            icon="eva-plus-outline"
            label="Create template"
            size="md"
            @click="createNewTemplate"
          />
        </div>
      </div>

      <!-- Loading state -->
      <div
        v-if="showLoading"
        class="row q-gutter-md"
      >
        <div
          v-for="n in 6"
          :key="n"
          class="col-12 col-sm-6 col-md-3"
        >
          <q-skeleton
            height="200px"
            class="rounded-borders"
          />
        </div>
      </div>

      <!-- Templates grid -->
      <div
        v-else
        class="row q-gutter-md"
      >
        <div
          v-for="template in filteredTemplates"
          :key="template.id"
          class="col-12 col-sm-6 col-md-3"
        >
          <TemplateCard
            :template="template"
            @edit="editTemplate"
            @delete="confirmDeleteTemplate"
          />
        </div>
      </div>

      <!-- Empty state -->
      <div
        v-if="showEmptyState"
        class="text-center q-mt-xl"
      >
        <q-icon
          name="eva-file-text-outline"
          size="4rem"
          class="q-mb-md text-grey-5"
        />
        <div class="text-h6 q-mb-sm">
          {{ searchQuery ? 'No templates found' : 'No templates yet' }}
        </div>
        <div class="text-body2 text-grey-6">
          {{
            searchQuery
              ? 'Try adjusting your search terms'
              : 'Create your first template to get started'
          }}
        </div>
        <q-btn
          v-if="!searchQuery"
          color="primary"
          icon="eva-plus-outline"
          label="Create template"
          class="q-mt-md"
          @click="createNewTemplate"
        />
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'

import { useTemplatesStore } from 'src/stores/templates'
import TemplateCard from 'src/components/TemplateCard.vue'
import type { Template } from 'src/api'

const router = useRouter()
const $q = useQuasar()
const templatesStore = useTemplatesStore()

const searchQuery = ref('')

const showLoading = computed(
  () => templatesStore.isLoading && templatesStore.templates.length === 0,
)
const showEmptyState = computed(
  () => !templatesStore.isLoading && filteredTemplates.value.length === 0,
)
const filteredTemplates = computed(() =>
  templatesStore.templates.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.value.toLowerCase()),
  ),
)

function createNewTemplate(): void {
  router.push({ name: 'new-template' })
}

function editTemplate(id: string): void {
  router.push({ name: 'template', params: { id } })
}

function confirmDeleteTemplate(template: Template): void {
  $q.dialog({
    title: 'Delete Template',
    message: `Are you sure you want to delete "${template.name}"? This action cannot be undone.`,
    cancel: true,
    persistent: true,
  }).onOk(() => {
    templatesStore.removeTemplate(template.id)
  })
}

onMounted(async () => {
  await templatesStore.loadTemplates()
})

onUnmounted(() => {
  templatesStore.reset()
})
</script>
