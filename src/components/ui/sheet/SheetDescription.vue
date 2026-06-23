<script setup>
import { reactiveOmit } from '@vueuse/core'
import { DialogDescription } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps({
  asChild: { type: Boolean, required: false },
  as: { type: null, required: false },
  class: { type: null, required: false },
})
const delegated = reactiveOmit(props, 'class')
</script>

<template>
  <DialogDescription
    data-slot="sheet-description"
    v-bind="delegated"
    :class="cn('text-sm text-[var(--ink-2)]', props.class)"
  >
    <slot />
  </DialogDescription>
</template>
