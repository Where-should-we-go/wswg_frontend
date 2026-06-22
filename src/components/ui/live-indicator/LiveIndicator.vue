<script setup>
// 실시간 동기화 표시. 시안 §B `.live` + `.pulse` 재현.
// - label: 상태 텍스트(기본 "실시간 동기화", 예: "3명 편집 중").
// 색은 협업 success 색(--collab-3, 초록). 펄스 ring 애니메이션 포함.
import { cn } from "@/lib/utils";

defineProps({
  label: { type: String, default: "실시간 동기화" },
  class: { type: null, required: false },
});
</script>

<template>
  <span
    :class="
      cn(
        'inline-flex items-center gap-1.5 text-[12px] font-semibold text-[var(--collab-3)]',
        $props.class,
      )
    "
  >
    <span class="wswg-live-pulse h-[7px] w-[7px] rounded-full bg-[var(--collab-3)]" />
    {{ label }}
  </span>
</template>

<style scoped>
.wswg-live-pulse {
  animation: wswg-live-pulse 1.7s infinite;
}
@keyframes wswg-live-pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(63, 154, 106, 0.45);
  }
  70% {
    box-shadow: 0 0 0 7px rgba(63, 154, 106, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(63, 154, 106, 0);
  }
}
</style>
