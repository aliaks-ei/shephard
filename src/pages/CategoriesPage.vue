<template>
  <ListPageLayout
    title="Available Expense Categories"
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
          class="category-card cursor-pointer full-height column"
        >
          <q-card-section
            class="column flex-center text-center q-py-lg"
            style="flex: 1"
          >
            <q-avatar
              :style="{ backgroundColor: category.color }"
              size="48px"
              text-color="white"
              class="category-card__avatar q-mb-md"
            >
              <q-icon
                :name="category.icon"
                size="24px"
              />
            </q-avatar>

            <div class="text-weight-medium text-body1 q-mb-xs">
              {{ category.name }}
            </div>

            <div class="text-caption text-grey-6">
              {{ category.color }}
            </div>
          </q-card-section>

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
  </ListPageLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useCategoriesStore } from 'src/stores/categories'
import ListPageLayout from 'src/layouts/ListPageLayout.vue'
import SearchAndSort from 'src/components/shared/SearchAndSort.vue'
import ListPageSkeleton from 'src/components/shared/ListPageSkeleton.vue'

const categoriesStore = useCategoriesStore()
const searchQuery = ref('')
const sortBy = ref('name')

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

onMounted(() => {
  categoriesStore.loadCategories()
})
</script>

<style lang="scss" scoped>
.category-card {
  transition-property: transform, box-shadow;
  transition-duration: 0.2s;
  transition-timing-function: ease-in-out;

  &__avatar {
    transition-property: transform;
    transition-duration: 0.2s;
    transition-timing-function: ease-in-out;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

    .category-card__avatar {
      transform: scale(1.05);
      transition: transform 0.2s ease-in-out;
    }
  }
}
</style>
