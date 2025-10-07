import { mount } from '@vue/test-utils'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import { vi, it, expect, beforeEach } from 'vitest'
import type { ComponentProps } from 'vue-component-type-helpers'

import BaseItemFormPage from './BaseItemFormPage.vue'

installQuasarPlugin()

type BaseItemFormPageProps = ComponentProps<typeof BaseItemFormPage>

const renderBaseItemFormPage = (props: Partial<BaseItemFormPageProps> = {}) => {
  const defaultProps: BaseItemFormPageProps = {
    pageTitle: 'Test Form',
    pageIcon: 'eva-edit-outline',
  }

  return mount(BaseItemFormPage, {
    props: { ...defaultProps, ...props },
    global: {
      stubs: {
        DetailPageLayout: true,
      },
    },
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

it('should mount component properly', () => {
  const wrapper = renderBaseItemFormPage()
  expect(wrapper.exists()).toBe(true)
})

it('should render DetailPageLayout', () => {
  const wrapper = renderBaseItemFormPage()
  const detailLayout = wrapper.findComponent({ name: 'DetailPageLayout' })
  expect(detailLayout.exists()).toBe(true)
})

it('should emit back event when DetailPageLayout emits back', async () => {
  const wrapper = mount(BaseItemFormPage, {
    props: {
      pageTitle: 'Test Form',
      pageIcon: 'eva-edit-outline',
    },
    global: {
      stubs: {
        DetailPageLayout: {
          template: '<div><button @click="$emit(\'back\')">Back</button></div>',
        },
      },
    },
  })

  const backButton = wrapper.find('button')
  await backButton.trigger('click')

  expect(wrapper.emitted('back')).toHaveLength(1)
})

it('should emit action-clicked event when DetailPageLayout emits it', async () => {
  const wrapper = mount(BaseItemFormPage, {
    props: {
      pageTitle: 'Test Form',
      pageIcon: 'eva-edit-outline',
    },
    global: {
      stubs: {
        DetailPageLayout: {
          template: "<div><button @click=\"$emit('action-clicked', 'save')\">Action</button></div>",
        },
      },
    },
  })

  const actionButton = wrapper.find('button')
  await actionButton.trigger('click')

  expect(wrapper.emitted('action-clicked')).toHaveLength(1)
  expect(wrapper.emitted('action-clicked')?.[0]).toEqual(['save'])
})

it('should render default slot content', () => {
  const wrapper = mount(BaseItemFormPage, {
    props: {
      pageTitle: 'Test Form',
      pageIcon: 'eva-edit-outline',
    },
    slots: {
      default: '<div data-testid="form-content">Form fields here</div>',
    },
    global: {
      stubs: {
        DetailPageLayout: {
          template: '<div><slot /></div>',
        },
      },
    },
  })

  const formContent = wrapper.find('[data-testid="form-content"]')
  expect(formContent.exists()).toBe(true)
  expect(formContent.text()).toBe('Form fields here')
})

it('should render dialogs slot content', () => {
  const wrapper = mount(BaseItemFormPage, {
    props: {
      pageTitle: 'Test Form',
      pageIcon: 'eva-edit-outline',
    },
    slots: {
      dialogs: '<div data-testid="dialog-content">Dialog here</div>',
    },
    global: {
      stubs: {
        DetailPageLayout: {
          template: '<div><slot name="dialogs" /></div>',
        },
      },
    },
  })

  const dialogContent = wrapper.find('[data-testid="dialog-content"]')
  expect(dialogContent.exists()).toBe(true)
  expect(dialogContent.text()).toBe('Dialog here')
})
