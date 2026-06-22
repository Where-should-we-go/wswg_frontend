<script setup>
import { computed } from 'vue'
import { cn } from '@/lib/utils'

/**
 * BlockTag — 블록 타입 태그 pill (디자인시스템.md §3.3, §6.2)
 *
 * 여행 계획 블록의 type(관광/식당/이동/숙소/메모/기록)을 노션식 soft 태그로 표현.
 * 색만으로 구분하지 않도록 이모지 + 라벨을 항상 병행한다(WCAG, §3.6).
 * 색은 globals.css의 --tag-*-bg / --tag-*-fg 토큰만 참조(하드코딩 금지).
 */
const props = defineProps({
  /** 블록 타입: tour | food | move | stay | memo | record */
  type: {
    type: String,
    required: true,
    validator: (v) => ['tour', 'food', 'move', 'stay', 'memo', 'record'].includes(v),
  },
  /** 라벨 텍스트 override(기본은 타입별 한글 라벨) */
  label: { type: String, default: '' },
  /** 이모지 숨김(아이콘을 따로 둘 때). 기본 false — 색만으로 구분 금지 원칙상 권장 X */
  hideEmoji: { type: Boolean, default: false },
  class: { type: null, default: '' },
})

// 타입 → 이모지 · 기본 라벨 · 토큰 색 매핑
const META = {
  tour: { emoji: '📍', label: '관광', bg: 'bg-tag-blue-bg', fg: 'text-tag-blue-fg' },
  food: { emoji: '🍜', label: '식당', bg: 'bg-tag-orange-bg', fg: 'text-tag-orange-fg' },
  move: { emoji: '🚄', label: '이동', bg: 'bg-tag-gray-bg', fg: 'text-tag-gray-fg' },
  stay: { emoji: '🏨', label: '숙소', bg: 'bg-tag-purple-bg', fg: 'text-tag-purple-fg' },
  memo: { emoji: '📝', label: '메모', bg: 'bg-tag-yellow-bg', fg: 'text-tag-yellow-fg' },
  record: { emoji: '✓', label: '기록', bg: 'bg-tag-green-bg', fg: 'text-tag-green-fg' },
}

const meta = computed(() => META[props.type] ?? META.tour)
const text = computed(() => props.label || meta.value.label)
</script>

<template>
  <span
    :class="
      cn(
        'inline-flex items-center gap-1 rounded-sm px-[9px] py-[3px] text-xs font-semibold leading-snug whitespace-nowrap',
        meta.bg,
        meta.fg,
        props.class,
      )
    "
  >
    <span v-if="!hideEmoji" aria-hidden="true">{{ meta.emoji }}</span>
    <span>{{ text }}</span>
  </span>
</template>
