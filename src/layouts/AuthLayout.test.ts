import { mount } from '@vue/test-utils'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import { expect, it } from 'vitest'

import AuthLayout from './AuthLayout.vue'

installQuasarPlugin()

it('uses the dynamic viewport auth shell without Quasar window-height locking', () => {
  const wrapper = mount(AuthLayout, {
    global: {
      stubs: {
        'router-view': true,
      },
    },
  })

  expect(wrapper.find('.auth-layout').exists()).toBe(true)
  expect(wrapper.find('.window-height').exists()).toBe(false)
})
