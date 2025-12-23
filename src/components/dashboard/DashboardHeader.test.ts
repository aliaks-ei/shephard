import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import { computed } from 'vue'
import DashboardHeader from './DashboardHeader.vue'
import type { UserProfile } from 'src/stores/user'

const mockScreen = {
  lt: { md: false },
}

vi.mock('quasar', async () => {
  const actual = await vi.importActual('quasar')
  return {
    ...actual,
    useQuasar: vi.fn(() => ({
      screen: mockScreen,
    })),
  }
})

const mockUserProfile: UserProfile = {
  id: 'user-1',
  email: 'john@example.com',
  displayName: 'John Doe',
  avatarUrl: undefined,
  nameInitial: 'J',
  authProvider: 'google',
  createdAt: '2024-01-01T00:00:00Z',
  formattedCreatedAt: 'January 1, 2024',
  preferences: null,
}

vi.mock('src/stores/user', () => ({
  useUserStore: vi.fn(() => ({
    userProfile: computed(() => mockUserProfile),
  })),
}))

installQuasarPlugin()

describe('DashboardHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    mockScreen.lt.md = false
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const createWrapper = () => {
    return mount(DashboardHeader)
  }

  it('renders the component on desktop', () => {
    mockScreen.lt.md = false
    const wrapper = createWrapper()
    expect(wrapper.exists()).toBe(true)
  })

  it('hides the component on mobile', () => {
    mockScreen.lt.md = true
    const wrapper = createWrapper()
    expect(wrapper.find('div').exists()).toBe(false)
  })

  it('displays greeting with user first name', () => {
    mockScreen.lt.md = false
    const wrapper = createWrapper()
    const greeting = wrapper.find('h1').text()
    expect(greeting).toContain('John')
  })

  it('displays morning greeting before 12 PM', () => {
    mockScreen.lt.md = false
    vi.setSystemTime(new Date('2024-01-01T10:00:00Z'))
    const wrapper = createWrapper()
    const greeting = wrapper.find('h1').text()
    expect(greeting).toContain('Morning')
  })

  it('displays afternoon greeting between 12 PM and 6 PM', () => {
    mockScreen.lt.md = false
    vi.setSystemTime(new Date('2024-01-01T14:00:00Z'))
    const wrapper = createWrapper()
    const greeting = wrapper.find('h1').text()
    expect(greeting).toContain('Afternoon')
  })

  it('displays evening greeting after 6 PM', () => {
    mockScreen.lt.md = false
    vi.setSystemTime(new Date('2024-01-01T20:00:00Z'))
    const wrapper = createWrapper()
    const greeting = wrapper.find('h1').text()
    expect(greeting).toContain('Evening')
  })

  it('displays the subtitle', () => {
    mockScreen.lt.md = false
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('What would you like to do today?')
  })

  it('applies correct classes to title', () => {
    mockScreen.lt.md = false
    const wrapper = createWrapper()
    const title = wrapper.find('h1')
    expect(title.classes()).toContain('text-weight-medium')
    expect(title.classes()).toContain('q-my-none')
    expect(title.classes()).toContain('text-h4')
  })

  it('applies correct classes to subtitle', () => {
    mockScreen.lt.md = false
    const wrapper = createWrapper()
    const subtitle = wrapper.find('p')
    expect(subtitle.classes()).toContain('q-ma-none')
    expect(subtitle.classes()).toContain('text-grey-6')
    expect(subtitle.classes()).toContain('text-body1')
  })

  it('handles user with only first name', () => {
    mockScreen.lt.md = false
    mockUserProfile.displayName = 'John'
    const wrapper = createWrapper()
    const greeting = wrapper.find('h1').text()
    expect(greeting).toContain('John')
    mockUserProfile.displayName = 'John Doe' // Reset
  })

  it('handles user without display name', () => {
    mockScreen.lt.md = false
    mockUserProfile.displayName = ''
    const wrapper = createWrapper()
    const greeting = wrapper.find('h1').text()
    expect(greeting).toContain('there')
    mockUserProfile.displayName = 'John Doe' // Reset
  })
})
