<template>
  <ListPageLayout
    title="Categories"
    description="Standard categories available for all expense tracking"
    :show-create-button="false"
  >
    <!-- Search and Sort Section -->
    <SearchAndSort
      :search-query="searchQuery"
      :sort-by="sortBy"
      search-placeholder="Search categories..."
      :sort-options="sortOptions"
      @update:search-query="searchQuery = $event"
      @update:sort-by="sortBy = $event"
    />

    <!-- Loading State -->
    <ListPageSkeleton
      v-if="categoriesStore.isLoading"
      :count="8"
    />

    <!-- Categories Grid -->
    <div
      v-else-if="filteredCategories.length > 0"
      class="row q-col-gutter-md"
    >
      <div
        v-for="category in filteredCategories"
        :key="category.id"
        class="col-12 col-sm-6 col-md-4 col-lg-3"
      >
        <q-card
          flat
          bordered
          class="full-height"
        >
          <q-item
            clickable
            class="q-pa-md"
            @click="openCategoryPreview(category)"
          >
            <!-- Mobile Layout: Icon + Title in same row -->
            <q-item-section
              v-if="$q.screen.xs"
              avatar
            >
              <q-avatar
                :style="{ backgroundColor: category.color }"
                size="40px"
                text-color="white"
              >
                <q-icon
                  :name="category.icon"
                  size="20px"
                />
              </q-avatar>
            </q-item-section>

            <q-item-section v-if="$q.screen.xs">
              <q-item-label class="text-weight-medium text-body1">
                {{ category.name }}
              </q-item-label>
              <q-item-label caption>
                {{ category.templates.length }}
                {{ category.templates.length === 1 ? 'template' : 'templates' }}
              </q-item-label>
            </q-item-section>

            <!-- Desktop Layout: Centered vertical layout -->
            <q-item-section
              v-if="!$q.screen.xs"
              class="column items-center text-center q-py-lg"
            >
              <q-avatar
                :style="{ backgroundColor: category.color }"
                size="48px"
                text-color="white"
                class="q-mb-md"
              >
                <q-icon
                  :name="category.icon"
                  size="24px"
                />
              </q-avatar>

              <div class="text-weight-medium text-body1 q-mb-xs">
                {{ category.name }}
              </div>

              <div class="text-caption text-grey-7">
                {{ category.templates.length }}
                {{ category.templates.length === 1 ? 'template' : 'templates' }}
              </div>
            </q-item-section>
          </q-item>

          <!-- Color strip at bottom -->
          <div :style="{ backgroundColor: category.color, height: '4px' }"></div>
        </q-card>
      </div>
    </div>

    <!-- Empty State -->
    <q-card
      v-else-if="searchQuery"
      flat
      class="text-center q-py-xl"
    >
      <q-card-section>
        <q-icon
          name="eva-search-outline"
          size="4rem"
          class="text-grey-4 q-mb-md"
        />
        <div class="text-h6 q-mb-sm text-grey-7">No categories found</div>
        <div class="text-body2 text-grey-5 q-mb-lg">Try adjusting your search terms</div>
        <q-btn
          color="primary"
          label="Clear Search"
          unelevated
          @click="searchQuery = ''"
        />
      </q-card-section>
    </q-card>

    <!-- Category Preview Dialog -->
    <CategoryPreviewDialog
      v-model="showPreviewDialog"
      :category="selectedCategory"
      @update:model-value="handleDialogClose"
    />
  </ListPageLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useCategoriesStore } from 'src/stores/categories'
import ListPageLayout from 'src/layouts/ListPageLayout.vue'
import SearchAndSort from 'src/components/shared/SearchAndSort.vue'
import ListPageSkeleton from 'src/components/shared/ListPageSkeleton.vue'
import CategoryPreviewDialog from 'src/components/categories/CategoryPreviewDialog.vue'
import type { CategoryWithStats } from 'src/api'

const $q = useQuasar()

const categoriesStore = useCategoriesStore()
const searchQuery = ref('')
const sortBy = ref('name')
const showPreviewDialog = ref(false)
const selectedCategory = ref<CategoryWithStats | null>(null)

const sortOptions = [{ label: 'Name', value: 'name' }]

const filteredCategories = computed(() => {
  let categories = [...categoriesStore.categories]

  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim()
    categories = categories.filter((category) => category.name.toLowerCase().includes(query))
  }

  if (sortBy.value === 'name') {
    categories.sort((a, b) => a.name.localeCompare(b.name))
  }

  return categories
})

function openCategoryPreview(category: CategoryWithStats) {
  selectedCategory.value = category
  showPreviewDialog.value = true
}

function handleDialogClose() {
  showPreviewDialog.value = false
  selectedCategory.value = null
}

onMounted(() => {
  categoriesStore.loadCategories({ includeTemplateStats: true })
})
</script>
