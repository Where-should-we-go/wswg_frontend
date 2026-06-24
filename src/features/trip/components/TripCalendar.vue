<script setup>
// TripCalendar — 캘린더(시간 그리드) 뷰. 같은 원본 items[] 를 시각 위치/높이로 렌더한다.
// 드래그 앤 드롭으로 일정 조율:
//   · 블록을 끌어 다른 시각/요일로 이동(time·visitDate 변경)
//   · 블록 아래 모서리를 끌어 소요시간(durationMin) 리사이즈
//   · 상단 "시간 미정" 칩을 그리드로 끌어와 시각 배치(time 부여)
// 변경은 change(id, patch) 로 상위(useTripEditor.setBlockSchedule)에 위임 → 낙관적 반영 + 실시간 동기화.
import { ref, computed } from 'vue'
import CalendarEvent from './CalendarEvent.vue'
import AddBlockRow from './AddBlockRow.vue'
import BlockTitleInput from './BlockTitleInput.vue'
import { typeEmojiOf, railColorOf, transportOf } from '@/features/trip/lib/blockMeta'
import {
  computeRange,
  hourMarks,
  gridHeightPx,
  buildDayEvents,
  timeToMinutes,
  minutesToTime,
  PX_PER_HOUR,
  MIN_EVENT_MIN,
  MOVE_STRIP_PX,
  DEFAULT_DURATION_MIN,
} from '@/features/trip/lib/calendar'

const props = defineProps({
  // 일정·캘린더가 공유하는 원본 항목 배열(mockTrip.data.items).
  items: { type: Array, default: () => [] },
  // 여행 시작일 "YYYY-MM-DD" — Day N 번호 산출 기준.
  startDate: { type: String, default: null },
  // 읽기 전용(드래그 편집 끔)
  readonly: { type: Boolean, default: false },
})

// 일정 변경: (id, patch) · 블록 추가: (koType, date) · 제목 편집: (id, title)
const emit = defineEmits(['change', 'add-block', 'edit-title'])

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']
function dateLabel(date) {
  const d = new Date(date + 'T00:00:00')
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${WEEKDAYS[d.getDay()]})`
}

// 시간 그리드 범위(09–21 기본, 일정에 그 밖 시각 있으면 자동 확장).
const range = computed(() => computeRange(props.items))
const marks = computed(() => hourMarks(range.value))
const bodyHeight = computed(() => gridHeightPx(range.value))

// visitDate 별 컬럼: [{ date, dayIndex, events, undated }] (order 정렬).
const days = computed(() => {
  const map = new Map()
  for (const it of props.items) {
    if (!map.has(it.visitDate)) map.set(it.visitDate, [])
    map.get(it.visitDate).push(it)
  }
  const sortedDates = [...map.keys()].sort((a, b) => (a < b ? -1 : 1))
  return sortedDates.map((date, i) => {
    const blocks = [...map.get(date)].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    const { events, undated } = buildDayEvents(blocks, range.value)
    return { date, dayIndex: i + 1, events, undated }
  })
})

// 상단 트레이: 모든 날의 time:null 항목을 한데 모음(시안 .tray, 날짜 무관 칩).
const undatedChips = computed(() => {
  const chips = []
  for (const d of days.value) {
    for (const b of d.undated) {
      chips.push({
        block: b,
        emoji: typeEmojiOf(b.type),
        barColor: railColorOf(b.type),
      })
    }
  }
  return chips
})

// 컬럼 grid-template: 시간 눈금(54px) + DAY 컬럼 N개.
const TIME_GUTTER = 54
const DAY_COL_W = 168 // 날짜 컬럼 고정 폭(가독성). 일수가 많으면 가로 스크롤.
const SNAP_MIN = 5 // 5분 단위 스냅
const gridCols = computed(() => `${TIME_GUTTER}px repeat(${days.value.length}, ${DAY_COL_W}px)`)

// 이동 스트립 본문: "제목 · 교통수단".
function moveText(b) {
  const t = transportOf(b.properties)
  return t ? `${b.title} · ${t}` : b.title
}

// ── 드래그 앤 드롭 ─────────────────────────────────────────
const bodyRef = ref(null)
const trayRef = ref(null)
// drag = { id, block, mode:'move'|'resize', grabOffsetMin, durationMin, fromTray, preview }
// preview = { colIndex, date, top, height, startMin, durationMin }
const drag = ref(null)

function snap(min) {
  return Math.round(min / SNAP_MIN) * SNAP_MIN
}
function bodyRect() {
  return bodyRef.value?.getBoundingClientRect()
}
// 포인터가 "시간 미정" 트레이 위에 있는지(시각 해제 드롭 판정).
function pointInTray(x, y) {
  const r = trayRef.value?.getBoundingClientRect()
  return !!r && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom
}
function pointToColIndex(clientX) {
  const rect = bodyRect()
  if (!rect) return 0
  const x = clientX - rect.left - TIME_GUTTER
  return Math.min(Math.max(Math.floor(x / DAY_COL_W), 0), days.value.length - 1)
}
function pointToMin(clientY) {
  const rect = bodyRect()
  if (!rect) return range.value.startHour * 60
  const y = clientY - rect.top
  return range.value.startHour * 60 + (y * 60) / PX_PER_HOUR
}
function durationOf(block) {
  return block.durationMin != null && Number(block.durationMin) > 0
    ? Number(block.durationMin)
    : DEFAULT_DURATION_MIN
}
function topFor(startMin) {
  return ((startMin - range.value.startHour * 60) * PX_PER_HOUR) / 60
}
function heightFor(block, durationMin) {
  if (block.type === '이동') return MOVE_STRIP_PX
  return (Math.max(durationMin, MIN_EVENT_MIN) * PX_PER_HOUR) / 60
}

// ── 이동(시각/요일 변경) ───────────────────────────────────
function onGrab(ev, block, fromTray = false) {
  if (props.readonly || (ev.button != null && ev.button !== 0)) return
  ev.preventDefault()
  const startMin = fromTray ? null : timeToMinutes(block.time)
  const grabOffsetMin = fromTray || startMin == null ? 0 : pointToMin(ev.clientY) - startMin
  drag.value = {
    id: block.id,
    block,
    mode: 'move',
    fromTray,
    durationMin: durationOf(block),
    grabOffsetMin,
    preview: null,
  }
  updateMovePreview(ev)
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp, { once: true })
}
function updateMovePreview(ev) {
  const d = drag.value
  if (!d) return
  const colIndex = pointToColIndex(ev.clientX)
  const date = days.value[colIndex]?.date
  const minStart = range.value.startHour * 60
  const maxStart = range.value.endHour * 60 - SNAP_MIN
  let startMin = snap(pointToMin(ev.clientY) - d.grabOffsetMin)
  startMin = Math.min(Math.max(startMin, minStart), maxStart)
  d.overTray = pointInTray(ev.clientX, ev.clientY)
  d.preview = {
    colIndex,
    date,
    top: topFor(startMin),
    height: heightFor(d.block, d.durationMin),
    startMin,
    durationMin: d.durationMin,
  }
}
function onMove(ev) {
  updateMovePreview(ev)
}
function onUp() {
  window.removeEventListener('pointermove', onMove)
  const d = drag.value
  drag.value = null
  if (!d) return
  // 트레이 위에서 놓으면 "시간 미정"으로 되돌리기(시각 해제) — 원래 시각이 있던 경우만.
  if (d.overTray) {
    if (timeToMinutes(d.block.time) != null) emit('change', d.id, { time: null })
    return
  }
  if (!d.preview || !d.preview.date) return
  emit('change', d.id, {
    time: minutesToTime(d.preview.startMin),
    visitDate: d.preview.date,
  })
}

// ── 리사이즈(소요시간 변경) ────────────────────────────────
function onResizeGrab(ev, block) {
  if (props.readonly) return
  ev.stopPropagation()
  ev.preventDefault()
  const startMin = timeToMinutes(block.time)
  if (startMin == null) return
  drag.value = { id: block.id, block, mode: 'resize', startMin, preview: null }
  updateResizePreview(ev)
  window.addEventListener('pointermove', onResizeMove)
  window.addEventListener('pointerup', onResizeUp, { once: true })
}
function updateResizePreview(ev) {
  const d = drag.value
  if (!d) return
  const endMin = snap(pointToMin(ev.clientY))
  const durationMin = Math.max(SNAP_MIN, endMin - d.startMin)
  const colIndex = days.value.findIndex((x) => x.date === d.block.visitDate)
  d.preview = {
    colIndex,
    date: d.block.visitDate,
    top: topFor(d.startMin),
    height: heightFor(d.block, durationMin),
    startMin: d.startMin,
    durationMin,
  }
}
function onResizeMove(ev) {
  updateResizePreview(ev)
}
function onResizeUp() {
  window.removeEventListener('pointermove', onResizeMove)
  const d = drag.value
  drag.value = null
  if (!d || !d.preview) return
  emit('change', d.id, { durationMin: d.preview.durationMin })
}

// 트레이 안내 문구 — 시각 있는 블록을 끄는 중이면 "여기로 놓으면 해제" 안내.
const trayHint = computed(() => {
  const d = drag.value
  if (d && d.mode === 'move' && timeToMinutes(d.block.time) != null) {
    return "여기에 놓으면 '시간 미정'으로 돌아가요"
  }
  if (undatedChips.value.length) return '시간 미정 · 끌어다 캘린더에 놓으면 시각이 정해져요'
  return '시간 미정 · 캘린더 일정을 여기로 끌어오면 시각이 해제돼요'
})

// 미리보기 라벨(끄는 동안 시각 표시).
const previewLabel = computed(() => {
  const p = drag.value?.preview
  if (!p) return ''
  if (drag.value.mode === 'resize') {
    return `${minutesToTime(p.startMin)} – ${minutesToTime(p.startMin + p.durationMin)}`
  }
  return minutesToTime(p.startMin)
})
</script>

<template>
  <div :class="drag ? 'cursor-grabbing select-none' : ''">
    <!-- 시간 미정 트레이 — time:null 항목 칩. 그리드↔트레이 양방향 드롭(시각 배치/해제). -->
    <!-- 항상 렌더해 드롭 타깃 공간을 예약(드래그 중 레이아웃 흔들림·좌표 어긋남 방지). -->
    <div
      ref="trayRef"
      class="mb-1.5 rounded-[10px] border border-dashed bg-[var(--sunken)] px-[13px] py-2.5 transition-colors"
      :class="
        drag?.overTray ? 'border-[var(--brand)] bg-[var(--brand)]/[0.06]' : 'border-[var(--border)]'
      "
    >
      <div
        class="flex items-center gap-1.5 text-[11.5px] font-bold tracking-[0.04em] text-[var(--ink-3)] uppercase"
        :class="undatedChips.length ? 'mb-2' : ''"
      >
        <span aria-hidden="true">🕓</span> {{ trayHint }}
      </div>
      <div v-if="undatedChips.length" class="flex flex-wrap gap-2">
        <span
          v-for="c in undatedChips"
          :key="c.block.id"
          class="inline-flex items-center gap-[7px] rounded-lg border border-[var(--border)] bg-[var(--background)] px-[11px] py-1.5 text-[13px] shadow-[0_1px_2px_rgba(0,0,0,0.03)] touch-none"
          :class="[readonly ? '' : 'cursor-grab', drag?.id === c.block.id ? 'opacity-30' : '']"
          @pointerdown="onGrab($event, c.block, true)"
        >
          <span
            class="h-[15px] w-[3px] rounded-[2px]"
            :style="{ background: c.barColor }"
            aria-hidden="true"
          />
          <span aria-hidden="true">{{ c.emoji }}</span>
          <!-- 제목 인라인 편집(빈 메모·이동도 바로 작성) -->
          <BlockTitleInput
            :value="c.block.title"
            placeholder="제목"
            class="w-[8rem] text-[13px]"
            @commit="(t) => emit('edit-title', c.block.id, t)"
          />
          <span class="ml-0.5 text-[11px] text-[var(--ink-3)]" aria-hidden="true">⋮⋮</span>
        </span>
      </div>
    </div>

    <!-- 가로 스크롤 래퍼 — 헤더+본문이 함께 스크롤, 좌측 시간축은 sticky 로 고정. -->
    <!-- 가로만 스크롤(세로 스크롤 금지). 하단 pb 로 가로 스크롤바가 본문을 가리지 않게. -->
    <div class="overflow-x-auto overflow-y-hidden">
      <div class="w-max min-w-full pb-3">
        <!-- DAY 헤더 행 -->
        <div class="grid" :style="{ gridTemplateColumns: gridCols }">
          <div aria-hidden="true" class="sticky left-0 z-20 bg-[var(--background)]" />
          <div
            v-for="d in days"
            :key="d.date"
            class="border-b-2 border-[var(--border)] px-2.5 pt-2 pb-[11px]"
          >
            <div class="flex items-center justify-between gap-1">
              <span class="text-[14px] font-extrabold">DAY {{ d.dayIndex }}</span>
              <AddBlockRow
                v-if="!readonly"
                variant="icon"
                @add="(t) => emit('add-block', t, d.date)"
              />
            </div>
            <div class="mt-px text-[11.5px] text-[var(--ink-3)]">{{ dateLabel(d.date) }}</div>
          </div>
        </div>

        <!-- 그리드 본문: 시간 눈금 + DAY 컬럼 -->
        <div ref="bodyRef" class="grid" :style="{ gridTemplateColumns: gridCols }">
          <!-- 좌측 시간 눈금 — sticky 로 가로 스크롤해도 고정. -->
          <div
            class="sticky left-0 z-20 bg-[var(--background)]"
            :style="{ height: `${bodyHeight}px` }"
          >
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
            v-for="(d, ci) in days"
            :key="d.date"
            class="relative border-l border-[var(--border)]"
            :class="
              drag?.preview && drag.preview.colIndex === ci && !drag.overTray
                ? 'bg-[var(--brand)]/[0.03]'
                : ''
            "
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
                class="absolute left-1.5 right-2 flex items-center gap-1.5 overflow-hidden rounded-md border border-dashed border-[var(--border)] px-2 py-px text-[11px] text-[var(--tag-gray-fg)] touch-none"
                :class="[
                  readonly ? '' : 'cursor-grab',
                  drag?.id === e.block.id && drag.mode === 'move' ? 'opacity-30' : '',
                ]"
                :style="{
                  top: `${e.layout.top}px`,
                  height: `${e.layout.height}px`,
                  background:
                    'repeating-linear-gradient(135deg, var(--tag-gray-bg) 0 6px, transparent 6px 12px)',
                }"
                @pointerdown="onGrab($event, e.block)"
              >
                <span aria-hidden="true">{{ typeEmojiOf(e.block.type) }}</span>
                <span v-if="e.block.time" class="shrink-0 tabular-nums font-semibold">{{
                  e.block.time
                }}</span>
                <span class="truncate">{{ moveText(e.block) }}</span>
              </div>
              <!-- 일반 블록 -->
              <CalendarEvent
                v-else
                :block="e.block"
                :layout="e.layout"
                :type-key="e.typeKey"
                class="touch-none"
                :class="[
                  readonly ? '' : 'cursor-grab',
                  drag?.id === e.block.id && drag.mode === 'move' ? 'opacity-30' : '',
                ]"
                @pointerdown="onGrab($event, e.block)"
              />
              <!-- 리사이즈 핸들(아래 모서리) — 이동·일반 모두 소요시간 조절 -->
              <div
                v-if="!readonly"
                class="absolute z-10 h-2.5 cursor-ns-resize touch-none"
                :style="{
                  top: `${e.layout.top + e.layout.height - 6}px`,
                  left:
                    e.layout.cols > 1
                      ? `calc(${(e.layout.colIndex / e.layout.cols) * 100}% + 6px)`
                      : '6px',
                  right: e.layout.cols > 1 ? 'auto' : '8px',
                  width: e.layout.cols > 1 ? `calc(${(1 / e.layout.cols) * 100}% - 12px)` : 'auto',
                }"
                @pointerdown="onResizeGrab($event, e.block)"
              >
                <div
                  class="mx-auto mt-1 h-1 w-7 rounded-full bg-[var(--border)] opacity-0 transition-opacity hover:opacity-100"
                />
              </div>
            </template>

            <!-- 드래그 미리보기(고스트) — 트레이 위로 가면 숨김(해제 모드). -->
            <div
              v-if="drag?.preview && drag.preview.colIndex === ci && !drag.overTray"
              class="pointer-events-none absolute left-1.5 right-2 z-20 flex items-start justify-between gap-1 overflow-hidden rounded-lg border-2 border-[var(--brand)] bg-[var(--brand)]/10 px-[9px] py-1 text-[11px] font-semibold text-[var(--brand)]"
              :style="{ top: `${drag.preview.top}px`, height: `${drag.preview.height}px` }"
            >
              <span class="truncate">{{ drag.block.title }}</span>
              <span class="shrink-0 tabular-nums">{{ previewLabel }}</span>
            </div>

            <!-- 빈 컬럼 힌트 — 끌어다 놓기 안내. -->
            <div
              v-if="!d.events.length"
              class="pointer-events-none absolute left-1.5 right-2 top-3 flex items-center justify-center rounded-lg border-[1.5px] border-dashed border-[var(--border)] py-3 text-[12px] font-semibold text-[var(--ink-3)]"
              style="background: rgba(44, 111, 227, 0.03)"
            >
              여기로 끌어다 놓기
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
