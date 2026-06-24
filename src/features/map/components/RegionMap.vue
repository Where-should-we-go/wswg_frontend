<script setup>
// RegionMap — 발자취 지도(S8) 본문. 실제 GeoJSON SDK 없이 17개 시도를 둥근
// 셀로 그리고, 방문 권역을 색칠(--brand-soft + --brand 보더)한다. 미방문은
// --bg-subtle + --border. 각 방문 권역에 대표 추억 핀(MemoryPin)을 얹는다.
// 색만으로 상태 전달 금지 → 핀 이모지·라벨 병행(§3.6). 클릭 시 상위로 위임.
import { computed } from 'vue'
import { SIDO_CELLS, SIDO_CENTER, MEDIA_BADGE, TOTAL_SIDO } from '@/features/map/data/koreaSido'

const props = defineProps({
  // getGroupMap 응답: [{ id, sidoCode, gugunCode, mediaType, regionLabel, caption, ... }]
  items: { type: Array, default: () => [] },
  focusedSido: { type: Number, default: null },
})

const emit = defineEmits(['select-region', 'select-pin'])

// 방문 시도 코드 집합.
const visited = computed(() => new Set(props.items.map((m) => m.sidoCode)))

// 시도별 대표 추억 1개(핀). 같은 시도 여러 건이면 첫 건을 대표 핀으로.
const pinBySido = computed(() => {
  const map = new Map()
  for (const m of props.items) {
    if (!map.has(m.sidoCode)) map.set(m.sidoCode, m)
  }
  return map
})

const pins = computed(() =>
  [...pinBySido.value.values()]
    .map((m) => ({ item: m, center: SIDO_CENTER[m.sidoCode] }))
    .filter((p) => p.center),
)

const visitedCount = computed(() => visited.value.size)

function cellClass(cell) {
  const isVisited = visited.value.has(cell.sidoCode)
  const isFocused = props.focusedSido === cell.sidoCode
  return [
    'cursor-pointer transition-colors',
    isVisited ? 'fill-[var(--brand-soft)] hover:fill-[var(--selected-bg)]' : 'fill-[var(--bg-subtle)]',
    isFocused ? 'stroke-[var(--brand-ink)]' : isVisited ? 'stroke-[var(--brand)]' : 'stroke-[var(--border)]',
  ]
}

function onCell(cell) {
  if (!visited.value.has(cell.sidoCode)) return
  emit('select-region', cell.sidoCode)
}
</script>

<template>
  <div class="relative h-full min-h-[420px] overflow-hidden bg-[var(--bg-subtle)]">
    <!-- 좌상단 요약 -->
    <div
      class="absolute top-3.5 left-3.5 z-[2] rounded-[var(--radius)] border border-[var(--border)] bg-[color-mix(in_srgb,var(--card)_92%,transparent)] px-3 py-2 text-[13px] text-[var(--ink-2)]"
    >
      전국 {{ TOTAL_SIDO }}곳 중
      <b class="text-[var(--brand-ink)]">{{ visitedCount }}곳</b>, 같이 다녀왔어요 🧭
    </div>

    <!-- 줌 토글(시각만 — 시도/구군) -->
    <div
      class="absolute top-3.5 right-3.5 z-[2] flex overflow-hidden rounded-[var(--radius)] border border-[var(--border-strong)] text-[12.5px] text-[var(--ink-2)]"
    >
      <span class="bg-[var(--brand)] px-3 py-1.5 font-semibold text-white">시도</span>
      <span class="cursor-not-allowed px-3 py-1.5 opacity-60">구군</span>
    </div>

    <!-- 범례 -->
    <div
      class="absolute bottom-3.5 left-3.5 z-[2] flex gap-3.5 rounded-[var(--radius)] border border-[var(--border)] bg-[color-mix(in_srgb,var(--card)_92%,transparent)] px-3 py-2 text-[11.5px] text-[var(--ink-2)]"
    >
      <span class="flex items-center gap-1.5">
        <i class="inline-block size-2.5 rounded-sm border border-[var(--brand)] bg-[var(--brand-soft)]" />다녀온 곳
      </span>
      <span class="flex items-center gap-1.5">
        <i class="inline-block size-2.5 rounded-sm border border-[var(--border)] bg-[var(--bg-subtle)]" />아직
      </span>
    </div>

    <!-- 지도 SVG -->
    <svg viewBox="0 0 100 140" class="block h-full w-full" role="img" aria-label="발자취 지도">
      <!-- 권역 셀 -->
      <g>
        <rect
          v-for="cell in SIDO_CELLS"
          :key="`cell-${cell.sidoCode}`"
          :x="cell.x"
          :y="cell.y"
          :width="cell.w"
          :height="cell.h"
          rx="2.5"
          stroke-width="0.6"
          :class="cellClass(cell)"
          :aria-label="cell.name"
          @click="onCell(cell)"
        />
        <text
          v-for="cell in SIDO_CELLS"
          :key="`label-${cell.sidoCode}`"
          :x="cell.x + cell.w / 2"
          :y="cell.y + cell.h / 2 + 1"
          text-anchor="middle"
          class="pointer-events-none fill-[var(--ink-3)] text-[3px] font-semibold"
        >
          {{ cell.name }}
        </text>
      </g>

      <!-- 대표 추억 핀 -->
      <g
        v-for="p in pins"
        :key="`pin-${p.item.id}`"
        class="cursor-pointer"
        role="button"
        :aria-label="`${p.item.regionLabel} 대표 추억`"
        @click="emit('select-pin', p.item)"
      >
        <circle :cx="p.center.x" :cy="p.center.y" r="3.6" class="fill-white" />
        <circle :cx="p.center.x" :cy="p.center.y" r="2.8" class="fill-[var(--brand)]" />
        <text
          :x="p.center.x"
          :y="p.center.y + 1"
          text-anchor="middle"
          class="pointer-events-none text-[2.6px]"
        >
          {{ MEDIA_BADGE[p.item.mediaType]?.emoji || '📍' }}
        </text>
      </g>
    </svg>
  </div>
</template>
