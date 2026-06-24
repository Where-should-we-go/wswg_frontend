<script setup>
// CalendarEvent — 캘린더 그리드에 시각·소요시간으로 배치되는 블록 (시안 schedule-calendar.html `.ev`).
// 절대 위치(top/height 는 상위 TripCalendar 가 layout 으로 계산해 style 로 주입).
// 구성: 타입색 왼쪽 바(.ev:before) + 타입 태그(높이 여유 시) + 제목 + 시간 라벨 + 속성 pill.
//   - 작은 블록(짧은 소요시간)은 제목 + 시간만(태그/pill 생략) — 시안의 64px 블록 톤.
//   - 이동(type:"이동")은 이 컴포넌트가 아니라 점선 스트립으로 따로 렌더(TripCalendar).
// ui/ 프리미티브 + blockMeta/calendar 헬퍼만 조합(하드코딩 색 금지 — --tag-*-fg 토큰).
import { computed } from 'vue'
import { BlockTag } from '@/components/ui/block-tag'
import { PropertyPill } from '@/components/ui/property-pill'
import { typeEmojiOf, railColorOf, propertyPills } from '@/features/trip/lib/blockMeta'
import { eventTimeLabel } from '@/features/trip/lib/calendar'

const props = defineProps({
  // data.items[] 의 한 항목(time 있는 장소/식당/숙소/메모)
  block: { type: Object, required: true },
  // calendar.eventLayout 결과 { top, height, cols, colIndex }
  layout: { type: Object, required: true },
  // BlockTag type 키(tour/food/…)
  typeKey: { type: String, required: true },
})

const emoji = computed(() => typeEmojiOf(props.block.type))
// 왼쪽 바 색 = 타입색(레일 점과 동일 계열 토큰).
const barColor = computed(() => railColorOf(props.block.type))
const timeLabel = computed(() => eventTimeLabel(props.block))
const pills = computed(() => propertyPills(props.block.properties))

// 높이 여유 판단(시안: 64px 블록은 태그/pill 생략, 88px+ 는 노출).
const showTag = computed(() => props.layout.height >= 80)
const showPills = computed(() => props.layout.height >= 96 && pills.value.length > 0)

// 겹침 시 레인별 좌우 분할 + 애플식 살짝 포개짐(폭을 조금 키우고 오른쪽일수록 위로).
// 안 겹치면 cols=1 → 전체 폭(기본 inset).
const colStyle = computed(() => {
  const cols = props.layout.cols ?? 1
  if (cols <= 1) return {}
  const idx = props.layout.colIndex ?? 0
  const widthPct = 100 / cols
  const isLast = idx === cols - 1
  return {
    left: `calc(${idx * widthPct}% + 3px)`,
    // 마지막 레인은 컬럼 밖으로 안 넘치게, 그 외는 다음 레인 위로 살짝 포갬.
    width: isLast ? `calc(${widthPct}% - 7px)` : `calc(${widthPct}% + 5px)`,
    right: 'auto',
    zIndex: 3 + idx,
    boxShadow: '0 2px 8px rgba(20,22,26,0.10)',
  }
})

const style = computed(() => ({
  top: `${props.layout.top}px`,
  height: `${props.layout.height}px`,
  ...colStyle.value,
}))
</script>

<template>
  <!--
    .ev: 절대 위치 카드. 왼쪽 3.5px 타입색 바는 ::before(인라인 색은 CSS 변수로 주입).
    좌우 기본 inset(left:6 / right:8)은 그리드 시안과 동일. 겹칠 때만 colStyle 로 override.
  -->
  <div
    class="ev absolute left-1.5 right-2 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--background)] px-[9px] py-1.5 pl-[11px] shadow-[0_1px_2px_rgba(20,22,26,0.05)]"
    :style="{ ...style, '--ev-bar': barColor }"
    role="button"
    tabindex="0"
  >
    <!-- 타입 태그(높이 여유 시) -->
    <BlockTag v-if="showTag" :type="typeKey" class="mb-[3px] px-[6px] py-px text-[10px]" />
    <!-- 제목 (작은 블록은 선두 이모지 동반 — 시안 식당/이동 톤) -->
    <div class="truncate text-[13px] font-semibold leading-[1.3] text-[var(--ink)]">
      <span v-if="!showTag" aria-hidden="true">{{ emoji }} </span>{{ block.title }}
    </div>
    <!-- 시간 라벨 -->
    <div class="mt-px text-[11px] tabular-nums text-[var(--ink-3)]">{{ timeLabel }}</div>
    <!-- 속성 pill(가장 큰 블록만) -->
    <div v-if="showPills" class="mt-[5px] flex flex-wrap gap-[5px]">
      <PropertyPill v-for="p in pills" :key="p.key" class="text-[11px]">
        <span aria-hidden="true">{{ p.emoji }}</span
        >{{ p.text }}
      </PropertyPill>
    </div>
  </div>
</template>

<style scoped>
/* 왼쪽 타입색 바 — 시안 .ev:before. 색은 --ev-bar 변수로 주입(토큰값). */
.ev::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3.5px;
  border-radius: 3px 0 0 3px;
  background: var(--ev-bar);
}
</style>
