<script setup>
// TripDayGroup — 일차 그룹 + 레일 (시안 schedule-final.html `.day` + `.rail`).
// 헤더: 토글 ▾ + "Day N · 7월 1일 (수) · M 블록". 접기/펼치기.
// 본문: 세로 레일(rail ::before) 위에 같은 날 블록을 daypart(오전/오후/저녁)로 묶어
//       구간 노드(DaypartNode)를 찍고, 그 아래 블록(TripBlock)/이동스트립/메모콜아웃을 렌더.
//   - daypart 분류는 time→daypartOf (스키마 §3). 빈 구간 노드는 생략.
//   - type:"이동" 은 노드 분류 제외, 회색 스트립으로(앞 블록 순서 유지).
//   - type:"메모" 는 콜아웃 박스.
//   - time 없는 항목(미정)은 맨 끝에.
import { ref, computed } from "vue";
import { ChevronDown } from "@lucide/vue";
import TripBlock from "./TripBlock.vue";
import TripMoveStrip from "./TripMoveStrip.vue";
import TripCallout from "./TripCallout.vue";
import DaypartNode from "./DaypartNode.vue";
import AddBlockRow from "./AddBlockRow.vue";
import { daypartOf } from "@/features/trip/lib/blockMeta";

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

// 블록 1개 → 렌더 종류 판별.
function kindOf(b) {
  if (b.type === "이동") return "move";
  if (b.type === "메모") return "callout";
  return "block";
}

// 시간 있는(오전/오후/저녁) 항목을 daypart 노드로 묶고, 시간 없는(미정) 항목은 끝에.
// 반환: { sections: [{ daypart, items: [block] }], undated: [block] }
const DAYPART_ORDER = ["오전", "오후", "저녁"];
const grouped = computed(() => {
  const buckets = { 오전: [], 오후: [], 저녁: [] };
  const undated = [];
  for (const b of props.blocks) {
    if (!b.time) {
      undated.push(b);
      continue;
    }
    const dp = daypartOf(b.time); // 오전|오후|저녁 (time 있으니 미정 아님)
    (buckets[dp] ?? buckets["저녁"]).push(b);
  }
  const sections = DAYPART_ORDER.filter((dp) => buckets[dp].length).map((dp) => ({
    daypart: dp,
    items: buckets[dp],
  }));
  return { sections, undated };
});
</script>

<template>
  <section>
    <!-- 일차 헤더 -->
    <button
      type="button"
      class="mt-[18px] mb-1 flex w-full items-center gap-2 text-left"
      :aria-expanded="open"
      @click="open = !open"
    >
      <ChevronDown
        class="size-3 text-[var(--ink-3)] transition-transform"
        :class="open ? '' : '-rotate-90'"
      />
      <span class="text-[18px] font-bold tracking-[-0.01em]">Day {{ dayIndex }}</span>
      <span class="text-[13.5px] font-medium text-[var(--ink-3)]">· {{ dateLabel }}</span>
      <span class="ml-auto text-[12.5px] text-[var(--ink-3)]">{{ blocks.length }} 블록</span>
    </button>

    <!-- 레일 -->
    <div
      v-show="open"
      class="relative pl-7 before:absolute before:top-1.5 before:bottom-3.5 before:left-[7px] before:w-0.5 before:bg-[var(--border)] before:content-['']"
    >
      <!-- daypart 노드 + 그 안의 블록/스트립/콜아웃 -->
      <template v-for="(sec, si) in grouped.sections" :key="sec.daypart">
        <DaypartNode :daypart="sec.daypart" :first="si === 0" />
        <template v-for="b in sec.items" :key="b.id">
          <TripMoveStrip v-if="kindOf(b) === 'move'" :block="b" />
          <TripCallout v-else-if="kindOf(b) === 'callout'" :block="b" />
          <TripBlock v-else :block="b" :editor="editors[b.id] ?? null" />
        </template>
      </template>

      <!-- 미정(시간 없음) 항목 — 맨 끝 -->
      <template v-for="b in grouped.undated" :key="b.id">
        <TripMoveStrip v-if="kindOf(b) === 'move'" :block="b" />
        <TripCallout v-else-if="kindOf(b) === 'callout'" :block="b" />
        <TripBlock v-else :block="b" :editor="editors[b.id] ?? null" />
      </template>

      <!-- 블록 추가 행 + 슬래시 메뉴 -->
      <AddBlockRow />
    </div>
  </section>
</template>
