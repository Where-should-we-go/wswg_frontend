<script setup>
// TripEditor — 여행 계획 블록 에디터 최상위 (디자인시스템.md §6.2, 시안 §B 캔버스).
// trips.data 한 건을 받아 전체를 조립한다:
//   커버 · 페이지 아이콘 · 타이틀 · 속성 테이블 · 뷰 탭 · 일차 그룹들 · 블록들.
// 도메인 전용 — ui/ 프리미티브 + 하위 trip 컴포넌트를 조합한다.
import { computed } from "vue";
import TripPropertyTable from "./TripPropertyTable.vue";
import TripViewTabs from "./TripViewTabs.vue";
import TripDayGroup from "./TripDayGroup.vue";

const props = defineProps({
  // trips 레코드(.data.items 포함). mockTrip 형태.
  trip: { type: Object, required: true },
});

// visitDate 로 그룹핑 → 일차별 [{ date, blocks }] (order 정렬).
const days = computed(() => {
  const map = new Map();
  for (const item of props.trip.data.items) {
    if (!map.has(item.visitDate)) map.set(item.visitDate, []);
    map.get(item.visitDate).push(item);
  }
  return [...map.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([date, blocks]) => ({
      date,
      blocks: [...blocks].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    }));
});

// presence[] → { [blockId]: { name, color } } (편집 중 협업자).
const editorsByBlock = computed(() => {
  const byId = Object.fromEntries(props.trip.members.map((m) => [m.id, m]));
  const out = {};
  for (const p of props.trip.presence ?? []) {
    const m = byId[p.memberId];
    if (m) out[p.blockId] = { name: m.name, color: p.color ?? m.color };
  }
  return out;
});
</script>

<template>
  <article class="relative px-14 pt-[30px] pb-10">
    <!-- 커버 -->
    <div
      class="mb-[18px] h-[120px] rounded-[10px] bg-[linear-gradient(120deg,#D4E4F7,#EAEFF6_50%,#F6EEDD)]"
    />
    <!-- 페이지 아이콘 (커버에 걸침) -->
    <div class="-mt-[52px] mb-2 pl-1 text-[46px] leading-none">{{ trip.icon }}</div>

    <!-- 타이틀 -->
    <h1 class="mt-[18px] mb-3.5 text-[38px] font-extrabold tracking-[-0.03em]">
      {{ trip.title }}
    </h1>

    <!-- 속성 테이블 -->
    <TripPropertyTable :trip="trip" />

    <div class="my-[18px] h-px bg-[var(--border)]" />

    <!-- 뷰 탭 + 일정(일차 그룹들) -->
    <TripViewTabs>
      <TripDayGroup
        v-for="(d, i) in days"
        :key="d.date"
        :day-index="i + 1"
        :date="d.date"
        :blocks="d.blocks"
        :editors="editorsByBlock"
      />
    </TripViewTabs>
  </article>
</template>
