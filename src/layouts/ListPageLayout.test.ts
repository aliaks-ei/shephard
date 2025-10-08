import { mount } from '@vue/test-utils'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import { vi, it, expect, beforeEach } from 'vitest'
import type { ComponentProps } from 'vue-component-type-helpers'

import ListPageLayout from './ListPageLayout.vue'

installQuasarPlugin()

type ListPageLayoutProps = ComponentProps<typeof ListPageLayout>

const renderListPageLayout = (props: Partial<ListPageLayoutProps> = {}) => {
  const defaultProps: ListPageLayoutProps = {
    title: 'Test List',
    description: 'Test description',
    createButtonLabel: 'Create Item',
  }

  return mount(ListPageLayout, {
    props: { ...defaultProps, ...props },
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

it('should mount component properly', () => {
  const wrapper = renderListPageLayout()
  expect(wrapper.exists()).toBe(true)
})

it('should render main container with correct layout classes', () => {
  const wrapper = renderListPageLayout()

  const container = wrapper.find('.row.justify-center')
  const col = wrapper.find('.col-12.col-md-10.col-lg-8.col-xl-6')

  expect(container.exists()).toBe(true)
  expect(col.exists()).toBe(true)
})

it('should render header section with correct structure', () => {
  const wrapper = renderListPageLayout()

  const headerSection = wrapper.find('.row.items-center')
  expect(headerSection.exists()).toBe(true)
})

it('should render title with correct styling', () => {
  const wrapper = renderListPageLayout({
    title: 'Custom Title',
  })

  const titleElement = wrapper.find('h1')
  expect(titleElement.exists()).toBe(true)
  expect(titleElement.text()).toBe('Custom Title')
  expect(titleElement.classes()).toContain('text-h4')
  expect(titleElement.classes()).toContain('text-weight-medium')
  expect(titleElement.classes()).toContain('q-my-none')
})

it('should render description with correct styling', () => {
  const wrapper = renderListPageLayout({
    description: 'Custom description text',
  })

  const descriptionElement = wrapper.find('p')
  expect(descriptionElement.exists()).toBe(true)
  expect(descriptionElement.text()).toBe('Custom description text')
  expect(descriptionElement.classes()).toContain('text-body2')
  expect(descriptionElement.classes()).toContain('text-grey-6')
  expect(descriptionElement.classes()).toContain('q-mb-none')
})

it('should render create button with correct attributes', () => {
  const wrapper = renderListPageLayout({
    createButtonLabel: 'Add New Item',
  })

  const createButton = wrapper.find('.q-btn')
  expect(createButton.exists()).toBe(true)
  expect(createButton.text()).toBe('Add New Item')
  expect(createButton.classes()).toContain('q-btn--unelevated')
})

it('should emit create event when create button is clicked', async () => {
  const wrapper = renderListPageLayout()

  const createButton = wrapper.find('.q-btn')
  await createButton.trigger('click')

  expect(wrapper.emitted('create')).toHaveLength(1)
})

it('should hide create button when showCreateButton is false', () => {
  const wrapper = renderListPageLayout({
    showCreateButton: false,
  })

  const createButton = wrapper.find('.q-btn')
  expect(createButton.exists()).toBe(false)
})

it('should render title and description in left column', () => {
  const wrapper = renderListPageLayout({
    title: 'Left Column Title',
    description: 'Left column description',
  })

  const leftColumn = wrapper.find('.col.col-grow')
  const title = leftColumn.find('h1')
  const description = leftColumn.find('p')

  expect(leftColumn.exists()).toBe(true)
  expect(title.text()).toBe('Left Column Title')
  expect(description.text()).toBe('Left column description')
})

it('should render create button in right column', () => {
  const wrapper = renderListPageLayout({
    createButtonLabel: 'Right Column Button',
  })

  const rightColumn = wrapper.find('.col-auto')
  const createButton = rightColumn.find('.q-btn')

  expect(rightColumn.exists()).toBe(true)
  expect(createButton.exists()).toBe(true)
  expect(createButton.text()).toBe('Right Column Button')
})

it('should render default slot content', () => {
  const wrapper = mount(ListPageLayout, {
    props: {
      title: 'Test Title',
      description: 'Test description',
      createButtonLabel: 'Create',
    },
    slots: {
      default: '<div data-testid="slot-content">Slot content here</div>',
    },
  })

  const slotContent = wrapper.find('[data-testid="slot-content"]')
  expect(slotContent.exists()).toBe(true)
  expect(slotContent.text()).toBe('Slot content here')
})

it('should apply responsive grid classes correctly', () => {
  const wrapper = renderListPageLayout()

  const mainContainer = wrapper.find('.row.justify-center')
  const responsiveColumn = wrapper.find('.col-12.col-md-10.col-lg-8.col-xl-6')

  expect(mainContainer.exists()).toBe(true)
  expect(responsiveColumn.exists()).toBe(true)
  expect(responsiveColumn.classes()).toContain('col-12')
  expect(responsiveColumn.classes()).toContain('col-md-10')
  expect(responsiveColumn.classes()).toContain('col-lg-8')
  expect(responsiveColumn.classes()).toContain('col-xl-6')
})

it('should render with all props and slot content', () => {
  const wrapper = mount(ListPageLayout, {
    props: {
      title: 'Complete Title',
      description: 'Complete description',
      createButtonLabel: 'Complete Button',
    },
    slots: {
      default: '<div data-testid="complete-content">Complete slot content</div>',
    },
  })

  expect(wrapper.find('h1').text()).toBe('Complete Title')
  expect(wrapper.find('p').text()).toBe('Complete description')
  expect(wrapper.find('.q-btn').text()).toBe('Complete Button')
  expect(wrapper.find('[data-testid="complete-content"]').text()).toBe('Complete slot content')
})

it('should handle long titles and descriptions gracefully', () => {
  const longTitle =
    'This is a very long title that should still render properly with all the correct styling classes applied'
  const longDescription =
    'This is a very long description that should wrap properly and maintain its styling even when the content extends beyond normal length expectations'

  const wrapper = renderListPageLayout({
    title: longTitle,
    description: longDescription,
  })

  const title = wrapper.find('h1')
  const description = wrapper.find('p')

  expect(title.text()).toBe(longTitle)
  expect(description.text()).toBe(longDescription)
  expect(title.classes()).toContain('text-h4')
  expect(description.classes()).toContain('text-body2')
})
