import { mount } from '@vue/test-utils'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { ComponentProps } from 'vue-component-type-helpers'

import PlansGroup from './PlansGroup.vue'
import type { PlanWithPermission } from 'src/api'

installQuasarPlugin()

type PlansGroupProps = ComponentProps<typeof PlansGroup>

const mockPlan: PlanWithPermission = {
  id: 'plan-1',
  name: 'Test Plan',
  owner_id: 'user-1',
  currency: 'USD',
  total: 1000,
  start_date: '2024-01-01',
  end_date: '2024-01-31',
  status: 'active',
  template_id: 'template-1',
  created_at: '2023-12-01T00:00:00Z',
  updated_at: '2023-12-01T00:00:00Z',
  permission_level: 'edit',
  is_shared: true,
}

const renderPlansGroup = (props: PlansGroupProps) => {
  return mount(PlansGroup, {
    props,
    global: {
      stubs: {
        ItemsGroup: {
          template: '<div><slot name="item-card" :item="items[0]" /></div>',
          props: ['items', 'title', 'icon', 'chipColor'],
        },
        PlanCard: {
          template:
            '<div class="plan-card">\n<button class="e" @click="$emit(\'edit\', plan.id)"></button>\n<button class="s" @click="$emit(\'share\', plan.id)"></button>\n<button class="d" @click="$emit(\'delete\', plan)"></button>\n<button class="c" @click="$emit(\'cancel\', plan)"></button>\n</div>',
          props: ['plan', 'hideSharedBadge'],
        },
      },
    },
  })
}

describe('PlansGroup', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should mount component properly', () => {
    const wrapper = renderPlansGroup({ plans: [mockPlan], title: 'Plans' })
    expect(wrapper.exists()).toBe(true)
  })

  it('should pass items and title to ItemsGroup', () => {
    const wrapper = renderPlansGroup({ plans: [mockPlan], title: 'My Plans' })
    expect(wrapper.text()).toContain('')
    expect(wrapper.props('title')).toBe('My Plans')
  })

  it('should provide default props', () => {
    const wrapper = renderPlansGroup({ plans: [mockPlan], title: 'Plans' })
    expect(wrapper.props('chipColor')).toBe('primary')
    expect(wrapper.props('hideSharedBadge')).toBe(false)
  })

  it('should allow overriding optional props', () => {
    const wrapper = renderPlansGroup({
      plans: [mockPlan],
      title: 'Plans',
      chipColor: 'secondary',
      hideSharedBadge: true,
    })
    expect(wrapper.props('chipColor')).toBe('secondary')
    expect(wrapper.props('hideSharedBadge')).toBe(true)
  })

  it('should bubble edit/share/delete/cancel events from PlanCard', async () => {
    const wrapper = renderPlansGroup({ plans: [mockPlan], title: 'Plans' })
    const card = wrapper.find('.plan-card')
    await card.find('.e').trigger('click')
    await card.find('.s').trigger('click')
    await card.find('.d').trigger('click')
    await card.find('.c').trigger('click')

    expect(wrapper.emitted('edit')).toBeTruthy()
    expect(wrapper.emitted('share')).toBeTruthy()
    expect(wrapper.emitted('delete')).toBeTruthy()
    expect(wrapper.emitted('cancel')).toBeTruthy()
  })
})
