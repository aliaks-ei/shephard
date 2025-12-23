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
      :count="12"
      column-class="col-6 col-sm-4 col-md-3 col-lg-2"
    >
      <q-item class="q-pa-sm full-height column flex-center text-center">
        <q-item-section class="q-mb-xs">
          <q-skeleton
            type="QAvatar"
            :size="$q.screen.lt.sm ? '32px' : '48px'"
          />
        </q-item-section>

        <q-item-section class="full-width">
          <q-skeleton
            type="text"
            width="60%"
            class="q-mx-auto"
          />
          <q-skeleton
            type="text"
            width="30%"
            height="10px"
            class="q-mx-auto q-mt-xs"
          />
        </q-item-section>
      </q-item>
    </ListPageSkeleton>

    <!-- Categories Grid -->
    <div
      v-else-if="filteredCategories.length > 0"
      class="row"
      :class="$q.screen.lt.md ? 'q-col-gutter-sm' : 'q-col-gutter-md'"
    >
      <div
        v-for="category in filteredCategories"
        :key="category.id"
        class="col-6 col-sm-4 col-md-3 col-lg-2"
      >
        <q-card
          :bordered="$q.dark.isActive"
          class="full-height shadow-1 overflow-hidden"
        >
          <q-item
            clickable
            class="q-pa-sm full-height column flex-center text-center"
            @click="openCategoryPreview(category)"
          >
            <q-item-section class="q-mb-xs">
              <CategoryIcon
                :color="category.color"
                :icon="category.icon"
                :size="$q.screen.lt.sm ? 'sm' : 'md'"
              />
            </q-item-section>

            <q-item-section>
              <q-item-label
                class="text-weight-medium text-body2"
                :class="{ 'text-caption': $q.screen.lt.sm }"
              >
                {{ category.name }}
              </q-item-label>
              <q-item-label
                caption
                style="font-size: 0.7rem"
              >
                {{ category.templates.length }}
                {{ category.templates.length === 1 ? 'template' : 'templates' }}
              </q-item-label>
            </q-item-section>

            <div
              class="absolute-bottom"
              :style="{ backgroundColor: category.color, height: '3px' }"
            ></div>
          </q-item>
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
          no-caps
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
import CategoryIcon from 'src/components/categories/CategoryIcon.vue'
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

const sortOptions = [
  { label: 'Name', value: 'name' },
  { label: 'Usage', value: 'usage' },
]

const filteredCategories = computed(() => {
  let categories = [...categoriesStore.categories]

  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim()
    categories = categories.filter((category) => category.name.toLowerCase().includes(query))
  }

  if (sortBy.value === 'name') {
    categories.sort((a, b) => a.name.localeCompare(b.name))
  } else if (sortBy.value === 'usage') {
    categories.sort((a, b) => b.templates.length - a.templates.length)
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
