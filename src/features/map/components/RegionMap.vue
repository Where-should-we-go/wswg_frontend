<script setup>
// RegionMap — 발자취 지도(S8) 본문. 단순 그리드 대신 시도별 SVG path로
// 대한민국 윤곽을 그리고, 방문 권역에는 대표 미디어를 얹는다.
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
  const hasThumbnail = !!thumbnailFor(cell)
  return [
    'cursor-pointer transition-colors',
    hasThumbnail
      ? ''
      : isVisited
        ? 'fill-[var(--brand-soft)] hover:fill-[var(--selected-bg)]'
        : 'fill-[var(--bg-subtle)]',
    isFocused ? 'stroke-[var(--brand-ink)]' : isVisited ? 'stroke-[var(--brand)]' : 'stroke-[var(--border)]',
  ]
}

function onCell(cell) {
  if (!visited.value.has(cell.sidoCode)) return
  emit('select-region', cell.sidoCode)
}

function patternId(sidoCode) {
  return `footprint-media-${sidoCode}`
}

function thumbnailFor(cell) {
  const item = pinBySido.value.get(cell.sidoCode)
  return item?.mediaType === 'PHOTO' && item.mediaUrl ? item.mediaUrl : ''
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
    <svg viewBox="0 24 82 116" class="block h-full w-full" role="img" aria-label="발자취 지도">
      <defs>
        <pattern
          v-for="cell in SIDO_CELLS"
          :id="patternId(cell.sidoCode)"
          :key="`pattern-${cell.sidoCode}`"
          patternUnits="userSpaceOnUse"
          :x="cell.x"
          :y="cell.y"
          :width="cell.w"
          :height="cell.h"
        >
          <image
            v-if="thumbnailFor(cell)"
            :href="thumbnailFor(cell)"
            :x="cell.x"
            :y="cell.y"
            :width="cell.w"
            :height="cell.h"
            preserveAspectRatio="xMidYMid slice"
          />
        </pattern>
      </defs>

      <!-- 권역 셀 -->
      <g>
        <path
          v-for="cell in SIDO_CELLS"
          :key="`cell-${cell.sidoCode}`"
          :d="cell.d"
          stroke-width="0.9"
          stroke-linejoin="round"
          :fill="thumbnailFor(cell) ? `url(#${patternId(cell.sidoCode)})` : undefined"
          :class="cellClass(cell)"
          :aria-label="cell.name"
          @click="onCell(cell)"
        />
        <path
          v-for="cell in SIDO_CELLS"
          :key="`shade-${cell.sidoCode}`"
          :d="cell.d"
          class="pointer-events-none"
          :class="visited.has(cell.sidoCode) ? 'fill-[var(--brand)] opacity-15' : 'fill-transparent'"
        />
        <text
          v-for="cell in SIDO_CELLS"
          :key="`label-${cell.sidoCode}`"
          :x="cell.labelX"
          :y="cell.labelY + 1"
          text-anchor="middle"
          class="pointer-events-none fill-[var(--ink)] text-[3.2px] font-extrabold"
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
