<script setup>
// 평면 카드(노션식: 그림자 대신 hairline + hover). 디자인시스템 §3·5.
import { cn } from '@/lib/utils'

const props = defineProps({
  class: { type: null, required: false },
})
</script>

<template>
  <div
    data-slot="card"
    :class="
      cn(
        'flex flex-col gap-4 rounded-[var(--radius-win)] border border-[var(--border)] bg-[var(--card)] py-5 text-[var(--card-foreground)]',
        props.class,
      )
    "
  >
    <slot />
  </div>
</template>
