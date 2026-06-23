<script setup>
// TripMapView — 🗺️ 지도 뷰 (화면정의서 S6, 간단 시각화).
// lat/lng 가 있는 블록을 정규화 좌표로 핀 배치한 가벼운 지도 시각화.
// 실제 지도 라이브러리 없이 좌표 bounding box → 비율 좌표로 핀만 찍는다(시안 OK 수준).
// 핀 클릭/호버 → 블록 제목 라벨. 좌표 있는 블록 없으면 빈 상태.
import { computed, ref } from 'vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { typeEmojiOf, railColorOf } from '@/features/trip/lib/blockMeta'

const props = defineProps({
  items: { type: Array, default: () => [] },
})

const pinned = computed(() =>
  props.items.filter((b) => b.lat != null && b.lng != null),
)

// bounding box → 0~1 비율 좌표(여백 8%). 핀 1개면 중앙.
const layout = computed(() => {
  const pts = pinned.value
  if (!pts.length) return []
  const lats = pts.map((p) => p.lat)
  const lngs = pts.map((p) => p.lng)
  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)
  const minLng = Math.min(...lngs)
  const maxLng = Math.max(...lngs)
  const spanLat = maxLat - minLat || 1
  const spanLng = maxLng - minLng || 1
  const pad = 0.08
  const span = 1 - pad * 2
  return pts.map((b, i) => ({
    block: b,
    // 위도가 클수록 위(상단) → y 반전.
    x: pts.length === 1 ? 50 : (pad + ((b.lng - minLng) / spanLng) * span) * 100,
    y: pts.length === 1 ? 50 : (pad + ((maxLat - b.lat) / spanLat) * span) * 100,
    emoji: typeEmojiOf(b.type),
    color: railColorOf(b.type),
    order: i + 1,
  }))
})

const active = ref(null)
</script>

<template>
  <div>
    <EmptyState
      v-if="!layout.length"
      icon="🗺️"
      title="지도에 표시할 장소가 없어요"
      description="관광지·식당 블록에 위치가 들어오면 지도에 핀으로 보여요."
    />

    <div
      v-else
      class="relative aspect-[16/10] w-full overflow-hidden rounded-[var(--radius-win)] border border-[var(--border)]"
      style="
        background-image:
          linear-gradient(0deg, rgba(44, 111, 227, 0.04), rgba(44, 111, 227, 0.04)),
          repeating-linear-gradient(0deg, var(--border) 0 1px, transparent 1px 44px),
          repeating-linear-gradient(90deg, var(--border) 0 1px, transparent 1px 44px);
        background-color: var(--sunken);
      "
    >
      <!-- 연결선(방문 순서) -->
      <svg class="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
        <polyline
          v-if="layout.length > 1"
          :points="layout.map((p) => `${p.x}%,${p.y}%`).join(' ')"
          fill="none"
          stroke="var(--brand)"
          stroke-width="2"
          stroke-dasharray="5 5"
          opacity="0.5"
          vector-effect="non-scaling-stroke"
        />
      </svg>

      <!-- 핀 -->
      <button
        v-for="p in layout"
        :key="p.block.id"
        type="button"
        class="absolute -translate-x-1/2 -translate-y-full"
        :style="{ left: `${p.x}%`, top: `${p.y}%` }"
        @click="active = active === p.block.id ? null : p.block.id"
        @mouseenter="active = p.block.id"
      >
        <span
          class="flex size-7 items-center justify-center rounded-full border-2 border-white text-[13px] shadow-[var(--shadow-pop)]"
          :style="{ backgroundColor: p.color }"
          aria-hidden="true"
        >
          {{ p.emoji }}
        </span>
        <!-- 라벨(활성 핀) -->
        <span
          v-if="active === p.block.id"
          class="absolute bottom-full left-1/2 mb-1 -translate-x-1/2 whitespace-nowrap rounded-md bg-[var(--popover)] px-2 py-1 text-[12px] font-medium text-[var(--ink)] shadow-[var(--shadow-pop)]"
        >
          {{ p.order }}. {{ p.block.title }}
        </span>
      </button>
    </div>

    <p class="mt-2 text-[12px] text-[var(--ink-3)]">
      위치가 있는 {{ layout.length }}개 장소를 방문 순서대로 이어 보여줘요.
    </p>
  </div>
</template>
