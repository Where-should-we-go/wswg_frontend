<script setup>
// TripDayGroup — 일차 그룹 (시안 §B `.day-h` + 블록 리스트).
// 헤더: 토글 ▾ + "N일차 · 7월 1일 (수) · M 블록". 접기/펼치기 동작.
// visitDate 로 묶인 블록들(부모가 정렬·그룹핑해서 내려줌)을 TripBlock 으로 렌더.
import { ref, computed } from "vue";
import { ChevronDown } from "@lucide/vue";
import TripBlock from "./TripBlock.vue";
import AddBlockRow from "./AddBlockRow.vue";

const props = defineProps({
  // 일차 번호(1-base)
  dayIndex: { type: Number, required: true },
  // "YYYY-MM-DD"
  date: { type: String, required: true },
  // 이 날의 블록 목록(order 정렬됨)
  blocks: { type: Array, default: () => [] },
  // 편집 중 presence 맵: { [blockId]: { name, color } }
  editors: { type: Object, default: () => ({}) },
});

const open = ref(true);

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const dateLabel = computed(() => {
  const d = new Date(props.date + "T00:00:00");
  const wd = WEEKDAYS[d.getDay()];
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${wd})`;
});
</script>

<template>
  <section>
    <!-- 일차 헤더 -->
    <button
      type="button"
      class="group mt-[18px] mb-1 flex w-full items-center gap-[9px] text-[var(--ink-2)]"
      :aria-expanded="open"
      @click="open = !open"
    >
      <ChevronDown
        class="size-3.5 text-[var(--ink-3)] transition-transform"
        :class="open ? '' : '-rotate-90'"
      />
      <span class="text-[14.5px] font-bold text-[var(--ink)]">{{ dayIndex }}일차</span>
      <span class="text-[12.5px] text-[var(--ink-3)]"
        >· {{ dateLabel }} · {{ blocks.length }} 블록</span
      >
    </button>

    <!-- 블록들 -->
    <div v-show="open">
      <TripBlock
        v-for="b in blocks"
        :key="b.id"
        :block="b"
        :editor="editors[b.id] ?? null"
      />
      <AddBlockRow />
    </div>
  </section>
</template>
