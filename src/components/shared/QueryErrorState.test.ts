import { mount } from '@vue/test-utils'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import { describe, expect, it } from 'vitest'
import QueryErrorState from './QueryErrorState.vue'

installQuasarPlugin()

describe('QueryErrorState', () => {
  it.each([
    ['not-found', 'Plan not found'],
    ['denied', 'Access denied'],
    ['error', 'Could not load plan'],
  ] as const)('renders the %s state', (kind, expectedTitle) => {
    const wrapper = mount(QueryErrorState, {
      props: {
        kind,
        entityName: 'Plan',
      },
    })

    expect(wrapper.text()).toContain(expectedTitle)
  })

  it('emits retry and back actions', async () => {
    const wrapper = mount(QueryErrorState, {
      props: {
        entityName: 'Plans',
        showBack: true,
      },
    })

    const retryButton = wrapper.findAll('button').find((button) => button.text() === 'Retry')
    const backButton = wrapper.findAll('button').find((button) => button.text() === 'Go back')

    await retryButton?.trigger('click')
    await backButton?.trigger('click')

    expect(wrapper.emitted('retry')).toHaveLength(1)
    expect(wrapper.emitted('back')).toHaveLength(1)
  })
})
