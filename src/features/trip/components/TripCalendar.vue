<script setup>
// TripCalendar — 캘린더(시간 그리드) 뷰 (시안 schedule-calendar.html `.cal` + `.gridbody`).
// 일정(레일) 뷰와 "같은 원본 items[]" 를 받아 시각 위치/높이로 렌더한다(스키마 §5).
// 구성:
//   - 상단 "시간 미정" 트레이: time:null 항목을 칩으로(시안 .tray/.uchip).
//   - DAY 헤더 행: visitDate 별 컬럼 머리(DAY N · 7월 1일 (수)).
//   - 본문: 좌측 시간 눈금(09–21시, 자동 확장) + 시간 그리드 라인 + DAY 컬럼.
//       · time 있는 블록 → CalendarEvent(top/height 배치).
//       · type:"이동" → 얇은 점선 스트립(.move, 큰 블록 아님).
//       · 빈 시간대 "＋" 힌트는 정적 표현(클릭 생성은 TODO).
// 도메인 전용 — ui/ 프리미티브 + calendar/blockMeta 헬퍼만 조합(인라인 컴포넌트·하드코딩 색 금지).
// 색 토큰: 시안 --line→--border, --callout-bg→--sunken 매핑(직전 단계 규칙).
import { computed } from "vue";
import CalendarEvent from "./CalendarEvent.vue";
import { typeEmojiOf, railColorOf, transportOf } from "@/features/trip/lib/blockMeta";
import {
  computeRange,
  hourMarks,
  gridHeightPx,
  buildDayEvents,
  PX_PER_HOUR,
} from "@/features/trip/lib/calendar";

const props = defineProps({
  // 일정·캘린더가 공유하는 원본 항목 배열(mockTrip.data.items).
  items: { type: Array, default: () => [] },
  // 여행 시작일 "YYYY-MM-DD" — Day N 번호 산출 기준.
  startDate: { type: String, default: null },
});

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
function dateLabel(date) {
  const d = new Date(date + "T00:00:00");
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${WEEKDAYS[d.getDay()]})`;
}

// 시간 그리드 범위(09–21 기본, 일정에 그 밖 시각 있으면 자동 확장).
const range = computed(() => computeRange(props.items));
const marks = computed(() => hourMarks(range.value));
const bodyHeight = computed(() => gridHeightPx(range.value));

// visitDate 별 컬럼: [{ date, dayIndex, events, undated }] (order 정렬).
const days = computed(() => {
  const map = new Map();
  for (const it of props.items) {
    if (!map.has(it.visitDate)) map.set(it.visitDate, []);
    map.get(it.visitDate).push(it);
  }
  const sortedDates = [...map.keys()].sort((a, b) => (a < b ? -1 : 1));
  return sortedDates.map((date, i) => {
    const blocks = [...map.get(date)].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const { events, undated } = buildDayEvents(blocks, range.value);
    return { date, dayIndex: i + 1, events, undated };
  });
});

// 상단 트레이: 모든 날의 time:null 항목을 한데 모음(시안 .tray, 날짜 무관 칩).
const undatedChips = computed(() => {
  const chips = [];
  for (const d of days.value) {
    for (const b of d.undated) {
      chips.push({
        block: b,
        emoji: typeEmojiOf(b.type),
        barColor: railColorOf(b.type),
      });
    }
  }
  return chips;
});

// 컬럼 grid-template: 시간 눈금(54px) + DAY 컬럼 N개.
const gridCols = computed(() => `54px repeat(${days.value.length}, minmax(0, 1fr))`);

// 이동 스트립 본문: "제목 · 교통수단".
function moveText(b) {
  const t = transportOf(b.properties);
  return t ? `${b.title} · ${t}` : b.title;
}

// TODO(narrow): 좁은 화면에서 단일 DAY 토글(하루씩 보기). 지금은 데스크탑 = DAY 나란히.
</script>

<template>
  <div>
    <!-- 시간 미정 트레이 (시안 .tray) — time:null 항목 칩. -->
    <div
      v-if="undatedChips.length"
      class="mb-1.5 rounded-[10px] border border-dashed border-[var(--border)] bg-[var(--sunken)] px-[13px] py-2.5"
    >
      <div
        class="mb-2 flex items-center gap-1.5 text-[11.5px] font-bold tracking-[0.04em] text-[var(--ink-3)] uppercase"
      >
        <span aria-hidden="true">🕓</span> 시간 미정 · 정해지면 캘린더에 배치해요
      </div>
      <div class="flex flex-wrap gap-2">
        <span
          v-for="c in undatedChips"
          :key="c.block.id"
          class="inline-flex cursor-grab items-center gap-[7px] rounded-lg border border-[var(--border)] bg-[var(--background)] px-[11px] py-1.5 text-[13px] shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
        >
          <span
            class="h-[15px] w-[3px] rounded-[2px]"
            :style="{ background: c.barColor }"
            aria-hidden="true"
          />
          <span aria-hidden="true">{{ c.emoji }}</span>
          <span>{{ c.block.title }}</span>
          <span class="ml-0.5 text-[11px] text-[var(--ink-3)]" aria-hidden="true">⋮⋮</span>
        </span>
      </div>
    </div>

    <!-- DAY 헤더 행 -->
    <div class="grid" :style="{ gridTemplateColumns: gridCols }">
      <div aria-hidden="true" />
      <div
        v-for="d in days"
        :key="d.date"
        class="border-b-2 border-[var(--border)] px-2.5 pt-2 pb-[11px]"
      >
        <div class="text-[14px] font-extrabold">DAY {{ d.dayIndex }}</div>
        <div class="mt-px text-[11.5px] text-[var(--ink-3)]">{{ dateLabel(d.date) }}</div>
      </div>
    </div>

    <!-- 그리드 본문: 시간 눈금 + DAY 컬럼 -->
    <div class="grid" :style="{ gridTemplateColumns: gridCols }">
      <!-- 좌측 시간 눈금 (09~21시, 자동 확장) -->
      <div class="relative" :style="{ height: `${bodyHeight}px` }">
        <div
          v-for="m in marks"
          :key="m.hour"
          class="absolute right-[9px] -translate-y-1/2 text-[11px] tabular-nums text-[var(--ink-3)]"
          :style="{ top: `${(m.hour - range.startHour) * PX_PER_HOUR}px` }"
        >
          {{ m.label }}
        </div>
      </div>

      <!-- DAY 컬럼 -->
      <div
        v-for="d in days"
        :key="d.date"
        class="relative border-l border-[var(--border)]"
        :style="{ height: `${bodyHeight}px` }"
      >
        <!-- 정시 그리드 라인(시안 .lines repeating-gradient) -->
        <div
          class="pointer-events-none absolute inset-0"
          aria-hidden="true"
          :style="{
            backgroundImage: `repeating-linear-gradient(to bottom, transparent 0, transparent calc(${PX_PER_HOUR}px - 1px), var(--border) calc(${PX_PER_HOUR}px - 1px), var(--border) ${PX_PER_HOUR}px)`,
          }"
        />

        <!-- 시각 블록 · 이동 스트립 -->
        <template v-for="e in d.events" :key="e.block.id">
          <!-- 이동: 얇은 점선 스트립(시안 .move) -->
          <div
            v-if="e.layout.isMove"
            class="absolute left-1.5 right-2 flex items-center gap-1.5 overflow-hidden rounded-md border border-dashed border-[var(--border)] px-2 py-px text-[11px] text-[var(--tag-gray-fg)]"
            :style="{
              top: `${e.layout.top}px`,
              height: `${e.layout.height}px`,
              background:
                'repeating-linear-gradient(135deg, var(--tag-gray-bg) 0 6px, transparent 6px 12px)',
            }"
          >
            <span aria-hidden="true">{{ typeEmojiOf(e.block.type) }}</span>
            <span class="truncate">{{ moveText(e.block) }}</span>
          </div>
          <!-- 일반 블록 -->
          <CalendarEvent v-else :block="e.block" :layout="e.layout" :type-key="e.typeKey" />
        </template>

        <!-- 빈 컬럼 "＋" 힌트(정적). 클릭 생성: TODO(backend). -->
        <div
          v-if="!d.events.length"
          class="absolute left-1.5 right-2 top-3 flex items-center justify-center rounded-lg border-[1.5px] border-dashed border-[var(--border)] py-3 text-[12px] font-semibold text-[var(--ink-3)]"
          style="background: rgba(44, 111, 227, 0.03)"
        >
          ＋ 일정 추가
        </div>
      </div>
    </div>
  </div>
</template>
