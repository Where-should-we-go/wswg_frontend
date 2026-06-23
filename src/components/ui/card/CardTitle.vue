<script setup>
import { cn } from '@/lib/utils'

const props = defineProps({
  class: { type: null, required: false },
})
</script>

<template>
  <div
    data-slot="card-title"
    :class="cn('font-semibold leading-tight text-[var(--ink)]', props.class)"
  >
    <slot />
  </div>
</template>
