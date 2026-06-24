<script setup>
// 로딩 스켈레톤 — 레이아웃 유지용 펄스 블록. 디자인시스템 §4 상태(로딩).
import { cn } from '@/lib/utils'

const props = defineProps({
  class: { type: null, required: false },
})
</script>

<template>
  <div
    data-slot="skeleton"
    :class="cn('animate-pulse rounded-md bg-[var(--hover)]', props.class)"
  />
</template>
