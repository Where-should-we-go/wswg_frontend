<script setup>
// DaypartNode — 레일 위 구간 노드 (시안 schedule-final.html `.node`).
// 세로 레일에 박히는 큰 점 + 구간 이모지(🌅/☀️/🌆) + 라벨("오전"…).
// 같은 날 블록을 time→daypart 로 묶을 때 각 구간 머리에 한 번 찍는다.
// 재사용 가능한 표현 전용 컴포넌트 — 분류 로직은 호출부(TripDayGroup).
import { computed } from "vue";
import { daypartMeta } from "@/features/trip/lib/blockMeta";

const props = defineProps({
  // 구간 키: "오전" | "오후" | "저녁" | "미정"
  daypart: { type: String, required: true },
  // 이 구간의 첫 노드인지(시안: 첫 노드는 위 여백 축소)
  first: { type: Boolean, default: false },
});

const meta = computed(() => daypartMeta(props.daypart));
</script>

<template>
  <!--
    레일 점: 노드 전용 큰 점(시안 .node:before — 14px, ink-3 보더).
    레일 세로선은 부모 .rail 의 ::before 가 그린다. 점은 음수 left 로 레일 위에 얹는다.
  -->
  <div
    class="relative flex items-center gap-2 text-[12.5px] font-extrabold text-[var(--ink-2)]"
    :class="first ? 'mt-0.5 mb-1.5' : 'mt-3.5 mb-1.5'"
  >
    <span
      class="absolute -left-[25px] size-[14px] rounded-full bg-[var(--background)] ring-[3px] ring-[var(--background)]"
      style="border: 2.5px solid var(--ink-3)"
      aria-hidden="true"
    />
    <span class="text-[14px]" aria-hidden="true">{{ meta.emoji }}</span>
    <span>{{ meta.label }}</span>
  </div>
</template>
