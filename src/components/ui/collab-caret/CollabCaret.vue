<script setup>
// CollabCaret — 실시간 협업 카렛 (디자인시스템.md §6.3, 시안 §B `.caret`/`.caret-tag`).
// 다른 사용자가 편집 중인 위치를 깜빡이는 컬러 카렛 + 이름 태그(│민지)로 표시.
// 범용 프리미티브: 색·이름만 받는다. trip 도메인 결합은 TripBlock 에서.
// 색은 --collab-* 토큰을 호출부에서 넘긴다(하드코딩 금지).
import { cn } from "@/lib/utils";

const props = defineProps({
  // 표시할 협업자 이름(태그 라벨)
  name: { type: String, required: true },
  // 카렛/태그 색. 보통 var(--collab-1|2|3).
  color: { type: String, default: "var(--collab-2)" },
  class: { type: null, required: false },
});
</script>

<template>
  <span :class="cn('relative inline-flex items-start', props.class)">
    <!-- 깜빡이는 카렛 -->
    <span
      class="wswg-caret inline-block h-[15px] w-[2px] align-[-2px]"
      :style="{ backgroundColor: color }"
      aria-hidden="true"
    />
    <!-- 이름 태그 -->
    <span
      class="relative -top-[9px] -ml-px rounded-sm rounded-bl-none px-1.5 py-px text-[10.5px] font-bold whitespace-nowrap text-white"
      :style="{ backgroundColor: color }"
      >{{ name }}</span
    >
  </span>
</template>

<style scoped>
.wswg-caret {
  animation: wswg-caret-blink 1s steps(1) infinite;
}
@keyframes wswg-caret-blink {
  50% {
    opacity: 0;
  }
}
</style>
