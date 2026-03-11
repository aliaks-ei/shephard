import { mount } from '@vue/test-utils'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import { describe, expect, it, vi, beforeEach } from 'vitest'

import DetailMobileActionBar from './DetailMobileActionBar.vue'

installQuasarPlugin()

vi.mock('vue-router', () => ({
  useRoute: () => ({
    name: 'plan',
    path: '/plans/plan-1',
    params: { id: 'plan-1' },
  }),
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

vi.mock('src/stores/preferences', () => ({
  usePreferencesStore: () => ({
    isPrivacyModeEnabled: false,
    togglePrivacyMode: vi.fn(),
  }),
}))

const renderComponent = () =>
  mount(DetailMobileActionBar, {
    props: {
      visible: true,
      actions: [
        {
          key: 'save',
          icon: 'eva-save-outline',
          label: 'Save',
          color: 'positive',
          priority: 'primary',
          handler: vi.fn(),
        },
        {
          key: 'share',
          icon: 'eva-share-outline',
          label: 'Share',
          color: 'info',
          priority: 'secondary',
          handler: vi.fn(),
        },
      ],
    },
    global: {
      stubs: {
        ExpenseRegistrationDialog: true,
        QPageSticky: {
          template: '<div class="page-sticky"><slot /></div>',
        },
        QBtn: {
          template:
            '<button class="q-btn" :data-label="label" :class="$attrs.class" @click="$emit(\'click\')">{{ label }}<slot /></button>',
          props: ['label', 'icon', 'loading', 'disabled', 'size', 'flat', 'stack', 'dense'],
          emits: ['click'],
        },
        QMenu: {
          template: '<div class="q-menu"><slot /></div>',
        },
        QList: {
          template: '<div class="q-list"><slot /></div>',
        },
        QItem: {
          template: '<div class="q-item" @click="$emit(\'click\')"><slot /></div>',
          emits: ['click'],
        },
        QItemSection: {
          template: '<div class="q-item-section"><slot /></div>',
        },
        QIcon: {
          template: '<i class="q-icon" />',
        },
      },
    },
  })

describe('DetailMobileActionBar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('highlights the save action on mobile', () => {
    const wrapper = renderComponent()

    const saveButton = wrapper.find('[data-label="Save"]')
    expect(saveButton.classes()).toContain('text-primary')
  })

  it('keeps non-save actions neutral', () => {
    const wrapper = renderComponent()

    const shareButton = wrapper.find('[data-label="Share"]')
    expect(shareButton.classes()).not.toContain('text-primary')
  })
})
