import type { Directive } from 'vue'

type PillState = {
  pill: HTMLElement
  mutationObserver: MutationObserver
  resizeObserver: ResizeObserver | null
  frame: number
}

const states = new WeakMap<HTMLElement, PillState>()

function positionPill(tabs: HTMLElement, pill: HTMLElement) {
  const content = tabs.querySelector<HTMLElement>('.q-tabs__content')
  const active = tabs.querySelector<HTMLElement>('.q-tab--active')

  if (!content || !active) {
    pill.style.opacity = '0'
    return
  }

  const contentRect = content.getBoundingClientRect()
  const activeRect = active.getBoundingClientRect()

  pill.style.opacity = '1'
  pill.style.width = `${activeRect.width}px`
  pill.style.height = `${activeRect.height}px`
  pill.style.transform = `translate(${activeRect.left - contentRect.left + content.scrollLeft}px, ${activeRect.top - contentRect.top}px)`
}

function schedule(tabs: HTMLElement) {
  const state = states.get(tabs)
  if (!state) return
  cancelAnimationFrame(state.frame)
  state.frame = requestAnimationFrame(() => positionPill(tabs, state.pill))
}

/**
 * `v-tab-pill` on a `<q-tabs>`: replaces the per-tab active background with one
 * pill that slides between tabs (segmented-control behaviour).
 */
export const tabPill: Directive<HTMLElement> = {
  mounted(tabs) {
    const content = tabs.querySelector<HTMLElement>('.q-tabs__content')
    if (!content) return

    const pill = document.createElement('div')
    pill.className = 'tab-pill'
    pill.setAttribute('aria-hidden', 'true')
    content.prepend(pill)
    tabs.classList.add('q-tabs--pill')

    const mutationObserver = new MutationObserver(() => schedule(tabs))
    mutationObserver.observe(tabs, {
      subtree: true,
      attributes: true,
      attributeFilter: ['class'],
      childList: true,
    })

    const resizeObserver =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(() => schedule(tabs))
    resizeObserver?.observe(tabs)

    states.set(tabs, { pill, mutationObserver, resizeObserver, frame: 0 })

    positionPill(tabs, pill)
    requestAnimationFrame(() => pill.classList.add('tab-pill--ready'))
  },
  updated(tabs) {
    schedule(tabs)
  },
  unmounted(tabs) {
    const state = states.get(tabs)
    if (!state) return
    cancelAnimationFrame(state.frame)
    state.mutationObserver.disconnect()
    state.resizeObserver?.disconnect()
    state.pill.remove()
    states.delete(tabs)
  },
}
