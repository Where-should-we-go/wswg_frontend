<script setup>
// 빈 상태 (전역). 일러스트(이모지/아이콘 슬롯) + 제목 + 설명 + CTA 슬롯.
// 카피는 해요체(디자인시스템 §2 보이스&톤).
import { cn } from '@/lib/utils'

const props = defineProps({
  icon: { type: String, default: '🧭' }, // 이모지(기본). 커스텀은 #icon 슬롯.
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  class: { type: null, required: false },
})
</script>

<template>
  <div
    data-slot="empty-state"
    :class="cn('flex flex-col items-center justify-center gap-3 px-6 py-16 text-center', props.class)"
  >
    <div class="text-4xl">
      <slot name="icon">{{ icon }}</slot>
    </div>
    <p v-if="title" class="text-base font-semibold text-[var(--ink)]">{{ title }}</p>
    <p v-if="description" class="max-w-sm text-sm text-[var(--ink-2)]">{{ description }}</p>
    <div v-if="$slots.default" class="mt-2">
      <slot />
    </div>
  </div>
</template>
