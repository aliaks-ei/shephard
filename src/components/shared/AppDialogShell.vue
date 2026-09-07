<template>
  <q-dialog
    :model-value="modelValue"
    data-pwa-update-blocker="dialog"
    :persistent="persistentDesktop && !isMobile"
    :position="isMobile ? 'bottom' : 'standard'"
    :transition-show="isMobile ? 'slide-up' : 'scale'"
    :transition-hide="isMobile ? 'slide-down' : 'scale'"
    :full-width="isMobile"
    @update:model-value="emit('update:modelValue', $event)"
    @hide="handleDialogHide"
  >
    <q-card
      ref="cardRef"
      v-touch-pan.vertical.mouse="handleSheetPan"
      class="dialog-shell__card column no-wrap min-h-0"
      :class="[
        cardClass,
        {
          'dialog-shell__card--mobile': isMobile,
          'dialog-shell__card--dragging': isDraggingSheet,
          'dialog-shell__card--animating': isAnimatingSheet,
        },
      ]"
      :style="dialogCardStyle"
    >
      <div
        v-if="isMobile"
        class="dialog-shell__swipe-zone q-touch-y col-auto"
        :class="{ 'dialog-shell__swipe-zone--expandable': canExpandSheet }"
      >
        <div
          class="dialog-shell__grabber-row dialog-shell__surface--card row justify-center"
          aria-hidden="true"
        >
          <span class="dialog-shell__grabber" />
        </div>
        <div
          class="dialog-shell__header dialog-shell__header--mobile dialog-shell__surface--card relative-position row items-center justify-center q-pb-md q-pr-md q-pl-sm"
        >
          <div class="absolute-left row items-center q-pl-sm">
            <q-btn
              icon="eva-close-outline"
              flat
              round
              dense
              size="sm"
              aria-label="Close dialog"
              class="mobile-touch-target"
              @click="closeDialog"
            />
          </div>

          <div
            class="dialog-shell__title-block dialog-shell__title-block--mobile full-width min-w-0 text-center"
          >
            <h2 class="text-subtitle1 text-weight-medium ellipsis q-my-none">
              {{ title }}
            </h2>
            <p
              v-if="subtitle"
              class="dialog-shell__subtitle text-caption ellipsis q-mt-xs q-mb-none"
            >
              {{ subtitle }}
            </p>
          </div>

          <div class="dialog-shell__mobile-extra absolute-right row items-center q-pr-md">
            <slot name="mobile-header-extra" />
          </div>
        </div>
      </div>

      <q-card-section
        v-else
        class="dialog-shell__header row items-center no-wrap col-auto"
      >
        <slot name="header-prefix" />

        <div class="dialog-shell__title-block col min-w-0">
          <h2 class="text-h6 text-weight-medium ellipsis q-my-none">
            {{ title }}
          </h2>
          <p
            v-if="subtitle"
            class="dialog-shell__subtitle text-body2 q-mt-xs q-mb-none"
          >
            {{ subtitle }}
          </p>
        </div>

        <q-space />

        <slot name="header-suffix" />

        <q-btn
          icon="eva-close-outline"
          flat
          round
          dense
          size="md"
          aria-label="Close dialog"
          @click="closeDialog"
        />
      </q-card-section>

      <q-separator />

      <div
        class="dialog-shell__body column"
        :class="[
          bodyColumnFlexClass,
          bodyColumnFlexClass === 'col' ? 'min-h-0' : '',
          isMobile ? 'dialog-shell__body--mobile' : '',
          isMobile && mobileBodyCardSurface ? 'dialog-shell__body--mobile-card-surface' : '',
          bodyScrollable ? 'dialog-shell__body--scroll overflow-auto' : 'overflow-hidden',
          bodyClass,
        ]"
      >
        <slot />
      </div>

      <template v-if="showFooter">
        <q-separator v-if="footerSeparator" />

        <q-card-actions
          :align="footerAlign"
          class="dialog-shell__footer col-auto q-mt-auto"
          :class="
            isMobile
              ? 'dialog-shell__footer--mobile dialog-shell__surface--card q-pa-md safe-area-bottom'
              : 'dialog-shell__footer--desktop'
          "
        >
          <slot
            v-if="!isMobile"
            name="footer"
          />

          <q-btn
            v-else-if="primaryActionLabel"
            class="dialog-shell__mobile-primary full-width"
            :label="primaryActionLabel"
            :icon="primaryActionIcon"
            :color="primaryActionColor"
            :loading="primaryActionLoading"
            :disable="primaryActionDisable"
            unelevated
            no-caps
            @click="emit('primary')"
          />
        </q-card-actions>
      </template>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, useSlots } from 'vue'
import { useQuasar } from 'quasar'
import type { TouchPanValue } from 'quasar'
import { hapticTap } from 'src/utils/haptics'

type FooterAlign = 'left' | 'right' | 'center' | 'between' | 'around' | 'evenly'
type TouchPanDetails = Parameters<NonNullable<TouchPanValue>>[0]

const MIN_VELOCITY_DRAG_PX = 32
const DISMISS_VELOCITY_THRESHOLD = 0.75
const DISMISS_ANIM_MS = 180
const SPRING_BACK_ANIM_MS = 220
const EXPAND_THRESHOLD_PX = 48
const DISMISS_THRESHOLD_RATIO = 0.24
const MIN_DISMISS_THRESHOLD_PX = 120
const MAX_DISMISS_THRESHOLD_PX = 240

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    title: string
    subtitle?: string
    bodyClass?: string
    cardClass?: string
    /** Mobile sheet body uses muted surface by default; set true for full lists (e.g. swipe rows) that match card background. */
    mobileBodyCardSurface?: boolean
    bodyScrollable?: boolean
    persistentDesktop?: boolean
    footerAlign?: FooterAlign
    footerSeparator?: boolean
    primaryActionLabel?: string | undefined
    primaryActionIcon?: string | undefined
    primaryActionColor?: string
    primaryActionLoading?: boolean | undefined
    primaryActionDisable?: boolean | undefined
    /**
     * Mobile sheet height. `full` = 95dvh, `half` = 58dvh (drag up to expand),
     * `content` = sized by its content (short confirms).
     */
    detent?: 'full' | 'half' | 'content'
  }>(),
  {
    detent: 'full',
    bodyClass: '',
    cardClass: '',
    mobileBodyCardSurface: false,
    bodyScrollable: true,
    persistentDesktop: false,
    footerAlign: 'right',
    footerSeparator: true,
    primaryActionColor: 'primary',
    primaryActionLoading: false,
    primaryActionDisable: false,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  hide: []
  primary: []
}>()

const $q = useQuasar()
const slots = useSlots()
const cardRef = ref<HTMLElement | { $el?: HTMLElement } | null>(null)
const dragTranslateY = ref(0)
const dragActivationOffsetY = ref(0)
const dragVelocityY = ref(0)
const lastPanDurationMs = ref(0)
const isDraggingSheet = ref(false)
const isAnimatingSheet = ref(false)
const wasBlockedByScroll = ref(false)
const isSheetExpanded = ref(false)

let closeTimer: ReturnType<typeof setTimeout> | undefined

const isMobile = computed(() => $q.screen.lt.md)
const canExpandSheet = computed(
  () => isMobile.value && props.detent === 'half' && isSheetExpanded.value !== true,
)

const sheetHeight = computed(() => {
  if (props.detent === 'content') return null
  if (props.detent === 'half' && isSheetExpanded.value !== true) return '58dvh'
  return '95dvh'
})

// Desktop cards have no fixed height; a flex-grown body (Quasar `col`) with min-height:0 can
// collapse to zero when slot content has no intrinsic block size (e.g. q-scroll-area). Mobile
// sheets use a definite height so the body should still consume remaining space.
const bodyColumnFlexClass = computed(() =>
  isMobile.value === true || props.bodyScrollable === true ? 'col' : 'col-auto',
)

const showFooter = computed(() => {
  return isMobile.value ? Boolean(props.primaryActionLabel) : Boolean(slots.footer)
})

const dialogCardStyle = computed(() => {
  if (!isMobile.value) return undefined

  return {
    width: '100vw',
    maxWidth: '100vw',
    height: sheetHeight.value ?? 'auto',
    maxHeight: '95dvh',
    borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
    margin: '0',
    overflow: 'hidden',
    transform: `translateY(${dragTranslateY.value}px)`,
    transition:
      isDraggingSheet.value === true
        ? 'none'
        : `transform ${SPRING_BACK_ANIM_MS}ms var(--ease-spring, cubic-bezier(0.22, 1, 0.36, 1)), height ${SPRING_BACK_ANIM_MS}ms var(--ease-out-quint, ease-out)`,
    willChange:
      dragTranslateY.value > 0 || isDraggingSheet.value === true ? 'transform' : undefined,
  }
})

function closeDialog() {
  emit('update:modelValue', false)
}

function handleSheetPan(details: TouchPanDetails) {
  if (isMobile.value !== true) {
    return
  }

  const rawOffsetY = Math.max(0, details.offset?.y ?? 0)
  const target = details.evt?.target

  if (details.isFirst === true) {
    clearCloseTimer()
    isAnimatingSheet.value = false
    isDraggingSheet.value = false
    wasBlockedByScroll.value = false
    dragActivationOffsetY.value = 0
    dragVelocityY.value = 0
    lastPanDurationMs.value = 0
  }

  // Half sheets: an upward drag from the handle area expands to the full detent.
  if (canExpandSheet.value && isDraggingSheet.value !== true && (details.offset?.y ?? 0) < 0) {
    if (details.evt?.cancelable === true && canDragSheetFromTarget(target)) {
      details.evt.preventDefault()
    }

    if (details.isFinal === true) {
      if ((details.offset?.y ?? 0) <= -EXPAND_THRESHOLD_PX && canDragSheetFromTarget(target)) {
        isSheetExpanded.value = true
        hapticTap()
      }
      resetPanState()
    }
    return
  }

  if (details.isFinal === true) {
    finishPanGesture()
    return
  }

  if (isDraggingSheet.value !== true) {
    const canTrackSheet = details.direction === 'down' && canDragSheetFromTarget(target)

    if (canTrackSheet !== true) {
      if (details.direction === 'down' && hasScrolledAncestor(target)) {
        wasBlockedByScroll.value = true
      }

      lastPanDurationMs.value = details.duration ?? lastPanDurationMs.value
      return
    }

    isDraggingSheet.value = true
    dragActivationOffsetY.value = wasBlockedByScroll.value === true ? rawOffsetY : 0
  }

  if (details.evt?.cancelable === true) {
    details.evt.preventDefault()
  }

  const nextTranslateY = Math.max(0, rawOffsetY - dragActivationOffsetY.value)
  const nextDurationMs = details.duration ?? lastPanDurationMs.value
  const durationDeltaMs = Math.max(nextDurationMs - lastPanDurationMs.value, 1)

  dragVelocityY.value = (nextTranslateY - dragTranslateY.value) / durationDeltaMs
  dragTranslateY.value = Math.min(nextTranslateY, getSheetHeightPx())
  lastPanDurationMs.value = nextDurationMs
  setBackdropDragProgress(dragTranslateY.value / getSheetHeightPx())
}

// The backdrop lives outside the card, so expose drag progress as a root CSS variable
// and let the backdrop fade with the sheet (native sheet behaviour).
function setBackdropDragProgress(progress: number) {
  if (typeof document === 'undefined') return
  const clamped = Math.min(Math.max(progress, 0), 1)
  if (clamped === 0) {
    document.documentElement.style.removeProperty('--sheet-dismiss-progress')
    return
  }
  document.documentElement.style.setProperty('--sheet-dismiss-progress', clamped.toFixed(3))
}

function finishPanGesture() {
  if (isDraggingSheet.value !== true) {
    resetPanState()
    return
  }

  const shouldDismiss =
    dragTranslateY.value >= getDismissThresholdPx() ||
    (dragTranslateY.value >= MIN_VELOCITY_DRAG_PX &&
      dragVelocityY.value >= DISMISS_VELOCITY_THRESHOLD)

  if (shouldDismiss === true) {
    // An expanded half sheet collapses back to its resting detent before it can be dismissed.
    if (props.detent === 'half' && isSheetExpanded.value === true) {
      isSheetExpanded.value = false
      hapticTap()
      animateSheetTo(0)
      return
    }

    dismissDraggedSheet()
    return
  }

  animateSheetTo(0)
}

function dismissDraggedSheet() {
  hapticTap()
  isDraggingSheet.value = false
  isAnimatingSheet.value = true
  dragTranslateY.value = getSheetHeightPx()
  setBackdropDragProgress(1)
  clearCloseTimer()
  closeTimer = setTimeout(() => {
    closeTimer = undefined
    closeDialog()
  }, DISMISS_ANIM_MS)
}

function animateSheetTo(value: number) {
  isDraggingSheet.value = false
  isAnimatingSheet.value = true
  dragTranslateY.value = value
  setBackdropDragProgress(value === 0 ? 0 : value / getSheetHeightPx())
  clearCloseTimer()
  closeTimer = setTimeout(() => {
    closeTimer = undefined
    if (value === 0) {
      resetPanState()
    }
  }, SPRING_BACK_ANIM_MS)
}

function resetPanState() {
  clearCloseTimer()
  setBackdropDragProgress(0)
  isDraggingSheet.value = false
  isAnimatingSheet.value = false
  wasBlockedByScroll.value = false
  dragTranslateY.value = 0
  dragActivationOffsetY.value = 0
  dragVelocityY.value = 0
  lastPanDurationMs.value = 0
}

function clearCloseTimer() {
  if (closeTimer !== undefined) {
    clearTimeout(closeTimer)
    closeTimer = undefined
  }
}

function getSheetHeightPx() {
  const cardElement = getCardElement()
  const measuredHeight = cardElement?.getBoundingClientRect().height ?? 0
  return measuredHeight > 0 ? measuredHeight : window.innerHeight * 0.95
}

defineExpose({
  expandSheet: () => {
    isSheetExpanded.value = true
  },
})

function getDismissThresholdPx() {
  return Math.min(
    Math.max(getSheetHeightPx() * DISMISS_THRESHOLD_RATIO, MIN_DISMISS_THRESHOLD_PX),
    MAX_DISMISS_THRESHOLD_PX,
  )
}

function getCardElement() {
  const cardValue = cardRef.value

  if (cardValue instanceof HTMLElement) {
    return cardValue
  }

  return cardValue?.$el instanceof HTMLElement ? cardValue.$el : null
}

function canDragSheetFromTarget(target: EventTarget | null | undefined) {
  const targetElement = target instanceof Element ? target : null

  if (targetElement === null) {
    return true
  }

  if (
    targetElement.closest('.dialog-shell__swipe-zone') !== null ||
    targetElement.closest('.dialog-shell__footer--mobile') !== null
  ) {
    return true
  }

  return hasScrolledAncestor(targetElement) !== true
}

function hasScrolledAncestor(target: EventTarget | null | undefined) {
  const targetElement = target instanceof Element ? target : null
  const cardElement = getCardElement()

  if (targetElement === null || cardElement === null) {
    return false
  }

  let currentElement: HTMLElement | null =
    targetElement instanceof HTMLElement ? targetElement : targetElement.parentElement

  while (currentElement !== null && currentElement !== cardElement) {
    if (isScrollableElement(currentElement) && currentElement.scrollTop > 0) {
      return true
    }

    currentElement = currentElement.parentElement
  }

  return false
}

function isScrollableElement(element: HTMLElement) {
  const style = window.getComputedStyle(element)
  return (
    /(auto|scroll|overlay)/.test(style.overflowY) && element.scrollHeight > element.clientHeight + 1
  )
}

function handleDialogHide() {
  resetPanState()
  isSheetExpanded.value = false
  emit('hide')
}

onBeforeUnmount(() => {
  clearCloseTimer()
  setBackdropDragProgress(0)
})
</script>

<style lang="scss" scoped>
.dialog-shell__card--mobile {
  overscroll-behavior-y: contain;
}

.dialog-shell__grabber-row {
  padding-top: 8px;
  padding-bottom: 4px;
}

.dialog-shell__grabber {
  display: block;
  width: 36px;
  height: 5px;
  border-radius: var(--radius-full);
  background: hsl(var(--muted-foreground) / 0.35);
}

:global(.q-dialog__backdrop) {
  opacity: calc(1 - var(--sheet-dismiss-progress, 0));
}

.dialog-shell__card--dragging {
  cursor: grabbing;
}

.dialog-shell__title-block--mobile {
  padding-inline: 72px;
}

.dialog-shell__surface--card {
  background: hsl(var(--card));
}

.dialog-shell__subtitle {
  color: hsl(var(--muted-foreground));
}

.dialog-shell__body--mobile {
  background: hsl(var(--muted));
}

.dialog-shell__body--scroll {
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-y: contain;
}

.dialog-shell__mobile-primary {
  min-height: 48px;
}

@supports (background: color-mix(in srgb, white, black)) {
  .dialog-shell__body--mobile {
    background: color-mix(in srgb, hsl(var(--muted)) 72%, hsl(var(--card)));
  }

  :global(.body--dark) .dialog-shell__body--mobile {
    background: color-mix(in srgb, hsl(var(--muted)) 94%, white);
  }
}

/* Solid card matches q-item / q-slide-item rows during horizontal swipe on mobile. */
.dialog-shell__body--mobile.dialog-shell__body--mobile-card-surface {
  background: hsl(var(--card));
}
</style>
