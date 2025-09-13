<template>
  <div>
    <div v-if="isLoadingTemplates">
      <div class="row q-col-gutter-md">
        <div
          v-for="n in 3"
          :key="n"
          class="col-12 col-sm-6 col-md-4"
        >
          <q-card
            flat
            bordered
          >
            <q-card-section>
              <q-skeleton
                type="text"
                width="60%"
                height="20px"
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

    <div v-else-if="availableTemplates.length === 0">
      <q-banner class="bg-orange-1 text-orange-8">
        <template #avatar>
          <q-icon name="eva-info-outline" />
        </template>
        <div class="text-body1 q-mb-sm">No templates available</div>
        <div class="text-body2">
          You need to create at least one template before you can create a plan.
        </div>
        <template #action>
          <q-btn
            flat
            color="orange"
            label="Create Template"
            icon="eva-plus-outline"
            @click="goToCreateTemplate"
          />
        </template>
      </q-banner>
    </div>

    <div v-else>
      <div class="text-body2 text-grey-6 q-mb-md">
        Select a template to base your plan on. You can modify the items and amounts after
        selection.
      </div>

      <div class="row q-col-gutter-md">
        <div
          v-for="template in availableTemplates"
          :key="template.id"
          class="col-12 col-sm-6 col-md-4"
        >
          <q-card
            flat
            bordered
            clickable
            @click="selectTemplate(template)"
          >
            <q-card-section>
              <div class="row items-start justify-between">
                <div class="col-10">
                  <h4 class="text-h6 text-weight-bold q-mt-none q-mb-xs">
                    {{ template.name }}
                  </h4>
                  <div class="row items-center q-gutter-xs q-mb-sm">
                    <q-badge
                      color="primary"
                      text-color="white"
                      class="q-px-sm q-py-xs"
                      outline
                    >
                      <q-icon
                        name="eva-clock-outline"
                        size="12px"
                        class="q-mr-xs"
                      />
                      {{ template.duration }}
                    </q-badge>
                    <q-badge
                      v-if="template.permission_level"
                      :color="getPermissionColor(template.permission_level)"
                      class="q-px-sm q-py-xs"
                      outline
                    >
                      <q-icon
                        :name="getPermissionIcon(template.permission_level)"
                        size="12px"
                        class="q-mr-xs"
                      />
                      {{ getPermissionText(template.permission_level) }}
                    </q-badge>
                  </div>
                  <div class="text-h6 text-primary text-weight-bold">
                    {{ formatCurrency(template.total, template.currency as CurrencyCode) }}
                  </div>
                </div>
                <div class="col-2 text-right">
                  <q-icon
                    v-if="selectedTemplateId === template.id"
                    name="eva-checkmark-circle-2"
                    color="primary"
                    size="24px"
                  />
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <div
        v-if="selectedTemplate"
        class="q-mt-lg"
      >
        <q-card
          flat
          bordered
          class="bg-grey-1"
        >
          <q-card-section>
            <div class="text-h6 q-mb-md">
              <q-icon
                name="eva-info-outline"
                class="q-mr-sm"
              />
              Selected Template Details
            </div>

            <div class="row q-col-gutter-md">
              <div class="col-12 col-sm-6">
                <div class="text-caption text-grey-6">Template Name</div>
                <div class="text-body1">{{ selectedTemplate.name }}</div>
              </div>
              <div class="col-12 col-sm-6">
                <div class="text-caption text-grey-6">Duration</div>
                <div class="text-body1 text-capitalize">{{ selectedTemplate.duration }}</div>
              </div>
              <div class="col-12 col-sm-6">
                <div class="text-caption text-grey-6">Total Amount</div>
                <div class="text-body1 text-primary text-weight-bold">
                  {{
                    formatCurrency(
                      selectedTemplate.total,
                      selectedTemplate.currency as CurrencyCode,
                    )
                  }}
                </div>
              </div>
              <div class="col-12 col-sm-6">
                <div class="text-caption text-grey-6">Items</div>
                <div class="text-body1">
                  {{ selectedTemplate.template_items?.length || 0 }} items
                </div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

import { useTemplatesStore } from 'src/stores/templates'
import { formatCurrency, type CurrencyCode } from 'src/utils/currency'
import { getPermissionText, getPermissionColor, getPermissionIcon } from 'src/utils/templates'
import type { TemplateWithItems, TemplateWithPermission } from 'src/api'

const emit = defineEmits<{
  (e: 'template-selected', template: TemplateWithItems): void
}>()

const props = defineProps<{
  modelValue?: TemplateWithItems | null
}>()

const router = useRouter()
const templatesStore = useTemplatesStore()

const selectedTemplateId = ref<string | null>(props.modelValue?.id || null)
const selectedTemplate = ref<TemplateWithItems | null>(props.modelValue || null)

const isLoadingTemplates = computed(() => templatesStore.isLoading)
const availableTemplates = computed(() => templatesStore.templates)

async function selectTemplate(template: TemplateWithPermission): Promise<void> {
  const fullTemplate = await templatesStore.loadTemplateWithItems(template.id)

  if (fullTemplate) {
    selectedTemplateId.value = template.id
    selectedTemplate.value = fullTemplate
    emit('template-selected', fullTemplate)
  }
}

function goToCreateTemplate(): void {
  router.push({ name: 'new-template' })
}
</script>
