import { mount } from '@vue/test-utils'
import { it, expect } from 'vitest'
import UserAvatar from './UserAvatar.vue'

const createWrapper = (props: {
  avatarUrl: string | undefined
  nameInitial: string | undefined
  size?: string
}) => {
  return mount(UserAvatar, {
    props,
    global: {
      stubs: {
        QAvatar: {
          template:
            '<div class="q-avatar" :size="size" :color="color" :text-color="textColor"><slot /></div>',
          props: ['size', 'color', 'textColor'],
        },
        QImg: {
          template:
            '<div class="q-img" :src="src" data-test="q-img" @error="$emit(\'error\')"></div>',
          props: ['src', 'ratio', 'noSpinner', 'referrerpolicy', 'crossorigin'],
          emits: ['error'],
        },
      },
    },
  })
}
it('renders QImg when avatarUrl is provided and no image error', () => {
  const wrapper = createWrapper({
    avatarUrl: 'http://example.com/avatar.png',
    nameInitial: 'A',
  })

  expect(wrapper.find('[data-test="q-img"]').exists()).toBe(true)
})

it('passes avatarUrl to QImg component', () => {
  const wrapper = createWrapper({
    avatarUrl: 'http://example.com/avatar.png',
    nameInitial: 'A',
  })

  const qImg = wrapper.find('.q-img')
  expect(qImg.attributes('src')).toBe('http://example.com/avatar.png')
})

it('renders q-avatar with initial when avatarUrl is not provided', () => {
  const wrapper = createWrapper({
    avatarUrl: undefined,
    nameInitial: 'A',
  })

  expect(wrapper.find('[data-test="q-img"]').exists()).toBe(false)

  const qAvatars = wrapper.findAll('.q-avatar')
  expect(qAvatars[0]?.text()).toBe('A')
})

it('renders q-avatar with initial when image error occurs', async () => {
  const wrapper = createWrapper({
    avatarUrl: 'http://example.com/avatar.png',
    nameInitial: 'A',
  })

  expect(wrapper.find('[data-test="q-img"]').exists()).toBe(true)

  await wrapper.find('.q-img').trigger('error')
  expect(wrapper.find('[data-test="q-img"]').exists()).toBe(false)

  const qAvatars = wrapper.findAll('.q-avatar')
  expect(qAvatars[0]?.text()).toBe('A')
})

it('applies size prop to q-avatar', () => {
  const wrapper = createWrapper({
    avatarUrl: undefined,
    nameInitial: 'A',
    size: '50px',
  })

  const qAvatar = wrapper.find('.q-avatar')
  expect(qAvatar.attributes('size')).toBe('50px')
})

it('uses default size and nameInitial when not provided', () => {
  const wrapper = createWrapper({
    avatarUrl: undefined,
    nameInitial: undefined,
  })

  const qAvatar = wrapper.find('.q-avatar')

  expect(qAvatar.text()).toBe('?')
  expect(qAvatar.attributes('size')).toBe('40px')
})

it('reacts to changes in avatarUrl prop', async () => {
  const wrapper = createWrapper({
    avatarUrl: 'http://example.com/avatar.png',
    nameInitial: 'A',
  })

  expect(wrapper.find('[data-test="q-img"]').exists()).toBe(true)

  await wrapper.setProps({
    avatarUrl: undefined,
  })

  expect(wrapper.find('[data-test="q-img"]').exists()).toBe(false)

  const qAvatar = wrapper.find('.q-avatar')
  expect(qAvatar.text()).toBe('A')
})

it('reacts to changes in nameInitial prop', async () => {
  const wrapper = createWrapper({
    avatarUrl: undefined,
    nameInitial: 'A',
  })

  const qAvatar = wrapper.find('.q-avatar')
  expect(qAvatar.text()).toBe('A')

  await wrapper.setProps({
    nameInitial: 'B',
  })

  expect(wrapper.find('.q-avatar').text()).toBe('B')
})
