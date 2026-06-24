<script setup>
import { cn } from '@/lib/utils'
const props = defineProps({ class: { type: null, required: false } })
</script>

<template>
  <div data-slot="sheet-header" :class="cn('flex flex-col gap-1', props.class)">
    <slot />
  </div>
</template>
