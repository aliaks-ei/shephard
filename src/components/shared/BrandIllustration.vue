<template>
  <svg
    class="brand-illustration"
    :width="props.width"
    viewBox="0 0 160 120"
    fill="none"
    stroke-width="3"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <!-- Lost sheep (brand motif) -->
    <g v-if="name === 'sheep'">
      <line
        class="illu-muted"
        x1="30"
        y1="104"
        x2="130"
        y2="104"
        stroke-dasharray="2 8"
      />
      <rect
        class="illu-accent"
        x="35"
        y="45"
        width="70"
        height="42"
        rx="21"
      />
      <path
        class="illu-accent"
        d="M47 45q4-9 13-8M65 42q5-8 14-6M83 40q6-7 13-3"
      />
      <circle
        class="illu-accent"
        cx="112"
        cy="52"
        r="12"
      />
      <path
        class="illu-accent"
        d="M120 43q8-4 10 2-4 4-9 2"
      />
      <circle
        class="illu-dot"
        cx="109"
        cy="50"
        r="1.6"
      />
      <circle
        class="illu-dot"
        cx="115.5"
        cy="50"
        r="1.6"
      />
      <path
        class="illu-accent"
        d="M35 60q-8 2-6 10"
      />
      <path
        class="illu-accent"
        d="M55 87v14M75 87v14M95 87v14"
      />
    </g>

    <!-- Calendar with sprout (plans) -->
    <g v-else-if="name === 'plan'">
      <rect
        class="illu-accent"
        x="45"
        y="35"
        width="70"
        height="60"
        rx="8"
      />
      <path
        class="illu-accent"
        d="M60 27v14M100 27v14M45 52h70"
      />
      <path
        class="illu-accent"
        d="M80 85V70"
      />
      <path
        class="illu-accent"
        d="M80 72q-10-2-12-12 10 0 12 12zM80 76q10-2 12-12-10 0-12 12z"
      />
      <circle
        class="illu-dot-muted"
        cx="58"
        cy="62"
        r="1.6"
      />
      <circle
        class="illu-dot-muted"
        cx="70"
        cy="62"
        r="1.6"
      />
      <circle
        class="illu-dot-muted"
        cx="90"
        cy="62"
        r="1.6"
      />
      <circle
        class="illu-dot-muted"
        cx="102"
        cy="62"
        r="1.6"
      />
    </g>

    <!-- Receipt with add-coin (expenses) -->
    <g v-else-if="name === 'receipt'">
      <path
        class="illu-accent"
        d="M50 25h50v63l-6.25 6-6.25-6-6.25 6-6.25-6-6.25 6-6.25-6-6.25 6-6.25-6z"
      />
      <path
        class="illu-muted"
        d="M58 40h26M58 50h34M58 60h20"
      />
      <circle
        class="illu-accent"
        cx="112"
        cy="78"
        r="14"
      />
      <path
        class="illu-accent"
        d="M112 71v14M105 78h14"
      />
    </g>

    <!-- Stacked documents (templates) -->
    <g v-else-if="name === 'template'">
      <rect
        class="illu-muted"
        x="50"
        y="28"
        width="48"
        height="58"
        rx="6"
      />
      <rect
        class="illu-accent"
        x="62"
        y="38"
        width="48"
        height="58"
        rx="6"
      />
      <path
        class="illu-muted"
        d="M70 52h28M70 62h32M70 72h20"
      />
    </g>
  </svg>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    name: 'sheep' | 'plan' | 'receipt' | 'template'
    width?: number
  }>(),
  {
    width: 160,
  },
)
</script>

<style lang="scss" scoped>
.brand-illustration {
  display: block;
  margin: 0 auto;

  .illu-accent {
    stroke: hsl(var(--primary) / 0.75);
  }

  .illu-muted {
    stroke: hsl(var(--muted-foreground) / 0.45);
  }

  .illu-dot {
    fill: hsl(var(--primary) / 0.75);
    stroke: none;
  }

  .illu-dot-muted {
    fill: hsl(var(--muted-foreground) / 0.45);
    stroke: none;
  }
}
</style>
