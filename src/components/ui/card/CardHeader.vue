<script setup>
import { cn } from '@/lib/utils'

const props = defineProps({
  class: { type: null, required: false },
})
</script>

<template>
  <div data-slot="card-header" :class="cn('flex flex-col gap-1.5 px-5', props.class)">
    <slot />
  </div>
</template>
