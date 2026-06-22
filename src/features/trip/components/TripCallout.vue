<script setup>
// TripCallout — type:"메모" 블록 (시안 schedule-final.html `.callout`).
// 💡 아이콘 + 제목(굵게) + memo 본문. 레일 점 없이 박스로 렌더(메모는 일정 노드가 아님).
// 색은 토큰만: 배경 --sunken, 보더 --border.
import { computed } from "vue";

const props = defineProps({
  // data.items[] 의 type:"메모" 항목
  block: { type: Object, required: true },
});

const memo = computed(() => props.block.properties?.memo ?? "");
</script>

<template>
  <div
    class="my-1.5 flex gap-[11px] rounded-[9px] border border-[var(--border)] bg-[var(--sunken)] px-[13px] py-[11px]"
  >
    <span class="text-[17px] leading-[1.4]" aria-hidden="true">💡</span>
    <p class="text-[13.5px] leading-[1.5] text-[var(--ink-2)]">
      <b v-if="block.title" class="font-semibold text-[var(--ink)]">{{ block.title }}.</b>
      {{ memo }}
    </p>
  </div>
</template>
