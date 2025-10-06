<template>
  <div class="q-mb-lg">
    <h1
      class="text-weight-medium q-my-none"
      :class="$q.screen.lt.md ? 'text-h5' : 'text-h4'"
    >
      Dashboard
    </h1>
    <p
      class="q-ma-none text-grey-6"
      :class="$q.screen.lt.md ? 'text-caption' : 'text-body2'"
    >
      Your expense tracking overview
    </p>
  </div>
</template>
