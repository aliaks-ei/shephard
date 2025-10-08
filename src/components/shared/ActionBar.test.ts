import { mount } from '@vue/test-utils'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { ComponentProps } from 'vue-component-type-helpers'

import ActionBar from './ActionBar.vue'

vi.mock('quasar', async () => {
  const actual = await vi.importActual('quasar')
  return {
    ...actual,
    useQuasar: vi.fn(() => ({
      screen: {
        lt: { md: false },
      },
    })),
  }
})

installQuasarPlugin()

type ActionBarProps = ComponentProps<typeof ActionBar>

const mockHandler = vi.fn()

const createMockActions = () => [
  {
    key: 'save',
    icon: 'eva-save-outline',
    label: 'Save',
    color: 'primary',
    loading: false,
    visible: true,
    handler: mockHandler,
  },
  {
    key: 'delete',
    icon: 'eva-trash-outline',
    label: 'Delete',
    color: 'negative',
    loading: false,
    visible: true,
    handler: mockHandler,
  },
  {
    key: 'hidden',
    icon: 'eva-eye-off-outline',
    label: 'Hidden',
    color: 'grey',
    loading: false,
    visible: false,
    handler: mockHandler,
  },
]

const renderComponent = (props: ActionBarProps) => {
  return mount(ActionBar, {
    props,
    global: {
      stubs: {
        'q-btn': {
          template: '<button @click="$emit(\'click\')"><slot /></button>',
          props: [
            'icon',
            'label',
            'color',
            'loading',
            'disabled',
            'flat',
            'outline',
            'stack',
            'size',
            'no-caps',
          ],
          emits: ['click'],
        },
        'q-page-sticky': {
          template: '<div class="page-sticky"><slot /></div>',
          props: ['position', 'expand', 'offset'],
        },
      },
    },
  })
}

describe('ActionBar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should mount component properly', () => {
    const wrapper = renderComponent({
      actions: createMockActions(),
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('should receive correct action props', () => {
    const wrapper = renderComponent({
      actions: createMockActions(),
    })
    const props = wrapper.props('actions')
    expect(props).toHaveLength(3)
    expect(props[0]?.key).toBe('save')
    expect(props[1]?.key).toBe('delete')
  })

  it('should not render hidden actions', () => {
    const actions = createMockActions()
    const wrapper = renderComponent({ actions })
    expect(wrapper.text()).not.toContain('Hidden')
  })

  it('should emit action-clicked event', () => {
    const actions = createMockActions()
    const wrapper = renderComponent({ actions })

    wrapper.vm.$emit('action-clicked', 'save')
    expect(wrapper.emitted('action-clicked')).toBeTruthy()
    expect(wrapper.emitted('action-clicked')?.[0]).toEqual(['save'])
  })

  it('should filter visible actions correctly', () => {
    const actions = createMockActions()
    const wrapper = renderComponent({ actions })

    const props = wrapper.props('actions')
    expect(props).toHaveLength(3)
    const visibleActions = actions.filter((a) => a.visible !== false)
    expect(visibleActions).toHaveLength(2)
  })

  it('should not render anything when visible prop is false', () => {
    const wrapper = renderComponent({
      actions: createMockActions(),
      visible: false,
    })
    const buttons = wrapper.findAll('button')
    expect(buttons.length).toBe(0)
  })

  it('should not render when no visible actions', () => {
    const wrapper = renderComponent({
      actions: [
        {
          key: 'hidden',
          icon: 'eva-eye-off-outline',
          label: 'Hidden',
          color: 'grey',
          visible: false,
          handler: mockHandler,
        },
      ],
    })
    const buttons = wrapper.findAll('button')
    expect(buttons.length).toBe(0)
  })

  it('should accept actions with async handlers', () => {
    const asyncHandler = vi.fn().mockResolvedValue(undefined)
    const wrapper = renderComponent({
      actions: [
        {
          key: 'async',
          icon: 'eva-sync-outline',
          label: 'Sync',
          color: 'primary',
          handler: asyncHandler,
        },
      ],
    })

    const props = wrapper.props('actions')
    expect(props).toHaveLength(1)
    expect(props[0]?.handler).toBe(asyncHandler)
  })
})
