<script setup>
import { cn } from '@/lib/utils'

/**
 * PropertyPill — 인라인 속성 pill (디자인시스템.md §6.2)
 *
 * 블록의 properties(예산·평점·시간·예약 등)를 노션식 인라인 칩으로 표현.
 *   <PropertyPill>💰 9,000원</PropertyPill>
 *   <PropertyPill>⭐ 5.0</PropertyPill>
 * slot 기반(이모지+텍스트 자유 조합). 배경은 --hover(=accent 토큰),
 * 텍스트는 --text-muted(=muted-foreground). 하드코딩 색 금지.
 */
const props = defineProps({
  /**
   * 변형:
   *  - filled: 기본. accent 배경 칩
   *  - faint:  배경 없이 흐린 텍스트(예: "TourAPI 없음 · 직접 추가")
   */
  variant: {
    type: String,
    default: 'filled',
    validator: (v) => ['filled', 'faint'].includes(v),
  },
  class: { type: null, default: '' },
})
</script>

<template>
  <span
    :class="
      cn(
        'inline-flex items-center gap-1 rounded-sm px-[7px] py-px text-[11.5px] leading-snug whitespace-nowrap',
        props.variant === 'filled' ? 'bg-accent text-muted-foreground' : 'text-muted-foreground/70',
        props.class,
      )
    "
  >
    <slot />
  </span>
</template>
