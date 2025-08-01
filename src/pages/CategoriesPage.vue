<template>
  <div class="q-pa-md">
    <div class="row justify-center">
      <div class="col-12 col-md-10 col-lg-8 col-xl-6">
        <div class="row items-center justify-between wrap q-col-gutter-md q-mb-lg">
          <div class="col-auto">
            <h1 class="text-h4 text-weight-medium q-mb-sm q-mt-none">Categories</h1>
            <p class="text-body2 text-grey-6 q-mb-none">Manage your expense categories</p>
          </div>
          <div class="col-auto">
            <q-btn
              color="primary"
              icon="eva-plus-outline"
              label="Add Category"
              unelevated
              @click="openCreateDialog"
            />
          </div>
        </div>

        <!-- Loading State -->
        <q-card
          v-if="categoriesStore.isLoading && categoriesStore.categories.length === 0"
          flat
        >
          <q-list>
            <q-item
              v-for="n in 6"
              :key="n"
            >
              <q-item-section avatar>
                <q-skeleton
                  type="QAvatar"
                  size="24px"
                />
              </q-item-section>
              <q-item-section>
                <q-skeleton
                  type="text"
                  width="40%"
                  height="16px"
                />
              </q-item-section>
              <q-item-section side>
                <q-skeleton
                  type="text"
                  width="60px"
                  height="16px"
                />
              </q-item-section>
              <q-item-section side>
                <q-skeleton
                  type="text"
                  width="80px"
                  height="16px"
                />
              </q-item-section>
              <q-item-section side>
                <div class="row q-gutter-xs">
                  <q-skeleton
                    type="QBtn"
                    size="24px"
                  />
                  <q-skeleton
                    type="QBtn"
                    size="24px"
                  />
                </div>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>

        <!-- Categories Table -->
        <q-table
          v-else-if="categoriesStore.categories.length > 0"
          :rows="categoriesStore.sortedCategories"
          :columns="columns"
          row-key="id"
          bordered
          flat
          :pagination="{ rowsPerPage: 0 }"
          hide-pagination
          class="categories-table"
        >
          <template #body-cell-name="props">
            <q-td :props="props">
              <div class="row items-center q-gutter-sm">
                <q-avatar
                  size="24px"
                  :style="{ backgroundColor: props.row.color }"
                  text-color="white"
                >
                  <q-icon
                    name="eva-pricetags-outline"
                    size="12px"
                  />
                </q-avatar>
                <span class="text-weight-medium">{{ props.row.name }}</span>
              </div>
            </q-td>
          </template>

          <template #body-cell-created="props">
            <q-td :props="props">
              {{ formatDate(props.row.created_at) }}
            </q-td>
          </template>

          <template #body-cell-actions="props">
            <q-td
              :props="props"
              class="text-right"
            >
              <div class="row items-center justify-end q-gutter-xs">
                <q-btn
                  flat
                  round
                  dense
                  icon="eva-edit-outline"
                  color="primary"
                  size="sm"
                  @click="openEditDialog(props.row)"
                >
                  <q-tooltip>Edit category</q-tooltip>
                </q-btn>

                <q-btn
                  flat
                  round
                  dense
                  icon="eva-trash-2-outline"
                  color="negative"
                  size="sm"
                  @click="onDeleteCategory(props.row)"
                >
                  <q-tooltip>Delete category</q-tooltip>
                </q-btn>
              </div>
            </q-td>
          </template>
        </q-table>

        <!-- Empty State -->
        <q-card
          v-else
          flat
          class="text-center q-py-xl"
        >
          <q-card-section>
            <q-icon
              name="eva-pricetags-outline"
              size="4rem"
              class="text-grey-4 q-mb-md"
            />
            <div class="text-h5 q-mb-sm text-grey-7">No categories found</div>
            <div class="text-body2 text-grey-5 q-mb-lg">
              Start by creating your first custom category
            </div>
            <q-btn
              color="primary"
              icon="eva-plus-outline"
              label="Create Your First Category"
              unelevated
              @click="openCreateDialog"
              :loading="categoriesStore.isLoading"
            />
          </q-card-section>
        </q-card>

        <!-- Unified Category Dialog -->
        <CategoryDialog
          v-model="showDialog"
          :category="selectedCategory"
          @category-saved="onCategorySaved"
        />

        <!-- Delete Category Dialog -->
        <CategoryDeleteDialog
          v-model="showDeleteDialog"
          :category="selectedCategory"
          @category-deleted="onCategoryDeleted"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useCategoriesStore } from 'src/stores/categories'
import { formatDate } from 'src/utils/date'
import type { ExpenseCategory } from 'src/api'

import CategoryDialog from 'src/components/categories/CategoryDialog.vue'
import CategoryDeleteDialog from 'src/components/categories/CategoryDeleteDialog.vue'

const categoriesStore = useCategoriesStore()

const showDialog = ref(false)
const showDeleteDialog = ref(false)
const selectedCategory = ref<ExpenseCategory | null>(null)

const columns = [
  {
    name: 'name',
    label: 'Name',
    align: 'left' as const,
    field: 'name',
    sortable: true,
    style: 'width: 50%',
    headerStyle: 'width: 50%',
  },
  {
    name: 'created',
    label: 'Created',
    align: 'left' as const,
    field: 'created_at',
    sortable: true,
    style: 'width: 30%',
    headerStyle: 'width: 30%',
  },
  {
    name: 'actions',
    label: '',
    align: 'right' as const,
    field: 'actions',
    sortable: false,
    style: 'width: 20%',
    headerStyle: 'width: 20%',
  },
]

function openCreateDialog() {
  selectedCategory.value = null
  showDialog.value = true
}

function openEditDialog(category: ExpenseCategory) {
  selectedCategory.value = category
  showDialog.value = true
}

function onDeleteCategory(category: ExpenseCategory) {
  selectedCategory.value = category
  showDeleteDialog.value = true
}

function onCategorySaved() {
  selectedCategory.value = null
}

function onCategoryDeleted() {
  selectedCategory.value = null
}

onMounted(() => {
  categoriesStore.loadCategories()
})
</script>
