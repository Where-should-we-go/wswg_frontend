<script setup>
// TripMapView — 여행 기록 지도.
// lat/lng 가 있는 블록을 2D 지도 좌표로 정규화하고, 블록 media[] 로 지도 실루엣을 채운다.
// Naver Maps SDK 키가 붙기 전에도 동일 데이터 계약으로 동작한다.
import { computed, ref } from 'vue'
import { Star } from '@lucide/vue'
import EmptyState from '@/components/common/EmptyState.vue'
import AddBlockRow from './AddBlockRow.vue'
import MediaLightbox from './MediaLightbox.vue'
import { typeEmojiOf, railColorOf } from '@/features/trip/lib/blockMeta'

const props = defineProps({
  items: { type: Array, default: () => [] },
  // 지도에서 추가할 때 들어갈 기본 일차(보통 Day 1).
  defaultDate: { type: String, default: null },
})

const emit = defineEmits(['add-block', 'set-representative', 'delete-media'])

const pinned = computed(() =>
  props.items
    .filter((b) => b.lat != null && b.lng != null)
    .sort((a, b) => {
      const ad = a.visitDate ?? ''
      const bd = b.visitDate ?? ''
      if (ad !== bd) return ad.localeCompare(bd)
      return Number(a.order ?? 0) - Number(b.order ?? 0)
    }),
)

// bounding box → 0~1 비율 좌표(여백 10%). 핀 1개면 중앙.
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
  const pad = 0.1
  const span = 1 - pad * 2
  const counts = new Map()
  return pts.map((b, i) => {
    const coordKey = `${Number(b.lat).toFixed(5)}:${Number(b.lng).toFixed(5)}`
    const overlapIndex = counts.get(coordKey) ?? 0
    counts.set(coordKey, overlapIndex + 1)
    const baseX = pts.length === 1 ? 50 : (pad + ((b.lng - minLng) / spanLng) * span) * 100
    const baseY = pts.length === 1 ? 50 : (pad + ((maxLat - b.lat) / spanLat) * span) * 100
    const angle = overlapIndex * 1.8
    const offset = overlapIndex ? 3.2 : 0
    return {
      block: b,
      // 위도가 클수록 위(상단) → y 반전.
      x: Math.min(94, Math.max(6, baseX + Math.cos(angle) * offset)),
      y: Math.min(94, Math.max(6, baseY + Math.sin(angle) * offset)),
      emoji: typeEmojiOf(b.type),
      color: railColorOf(b.type),
      order: i + 1,
    }
  })
})

const active = ref(null)
const lightbox = ref(null)

const mediaMarkers = computed(() =>
  layout.value.flatMap((point) =>
    (point.block.media ?? []).map((media, mediaIndex) => ({
      key: `${point.block.id}-${mediaIndex}`,
      blockId: point.block.id,
      blockTitle: point.block.title,
      mediaIndex,
      media,
      point,
      type: normalizeMediaType(media.type),
      representative: !!media.representative,
    })),
  ),
)

const mediaCount = computed(() => mediaMarkers.value.length)
const photoCount = computed(() => mediaMarkers.value.filter((m) => m.type === 'PHOTO').length)
const audioVideoCount = computed(() => mediaMarkers.value.filter((m) => m.type !== 'PHOTO').length)
const mapFillTiles = computed(() => {
  const markers = mediaMarkers.value
  if (!markers.length) return []
  const minTiles = Math.max(18, markers.length * 5)
  return Array.from({ length: minTiles }, (_, index) => {
    const marker = markers[index % markers.length]
    return {
      ...marker,
      tileKey: `${marker.key}-fill-${index}`,
      muted: index >= markers.length,
    }
  })
})

function normalizeMediaType(type) {
  const normalized = String(type ?? '').toUpperCase()
  return normalized === 'VOICE' ? 'AUDIO' : normalized
}

function mediaIcon(type) {
  if (type === 'VIDEO') return '▶'
  if (type === 'AUDIO') return '🎙'
  return '📷'
}

function mediaLabel(type) {
  if (type === 'VIDEO') return '영상'
  if (type === 'AUDIO') return '녹음'
  return '사진'
}

function markerShapeClass(type) {
  if (type === 'VIDEO') return 'rounded-[10px]'
  if (type === 'AUDIO') return 'rounded-full'
  return 'rounded-[6px]'
}

function tileToneClass(type) {
  if (type === 'VIDEO') return 'bg-[#2f5f7a] text-white'
  if (type === 'AUDIO') return 'bg-[#6f8f74] text-white'
  return 'bg-[var(--bg-subtle)] text-[var(--ink-2)]'
}

function markerOffset(mediaIndex, total) {
  if (total <= 1) return { x: 0, y: 0 }
  const angle = (Math.PI * 2 * mediaIndex) / total - Math.PI / 2
  const radius = Math.min(7, 3.5 + total)
  return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius }
}

function mediaAtBlock(block) {
  return mediaMarkers.value.filter((m) => m.blockId === block.id)
}

function mediaStyle(marker) {
  const siblings = mediaAtBlock(marker.point.block)
  const offset = markerOffset(marker.mediaIndex, siblings.length)
  return {
    left: `calc(${marker.point.x}% + ${offset.x}px)`,
    top: `calc(${marker.point.y}% + ${offset.y}px)`,
  }
}

function openMedia(marker) {
  active.value = marker.blockId
  lightbox.value = marker
}

function closeLightbox() {
  lightbox.value = null
}

function selectRepresentative(marker) {
  if (!marker) return
  emit('set-representative', marker.blockId, marker.mediaIndex)
}

function deleteMedia(marker) {
  if (!marker) return
  emit('delete-media', marker.blockId, marker.mediaIndex)
  closeLightbox()
}
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
      class="relative aspect-[16/10] w-full overflow-hidden rounded-[var(--radius-win)] border border-[var(--border)] bg-[var(--sunken)]"
    >
      <!-- 지도 바탕: 물/녹지/도로 느낌의 가벼운 2D 맵 -->
      <div class="absolute inset-0 bg-[linear-gradient(135deg,#dfeef3_0%,#eef6f1_42%,#f7f2e6_100%)]" />
      <div
        class="absolute -left-[8%] top-[10%] h-[46%] w-[48%] rounded-[48%] bg-[#b9d9e8]/55 blur-[1px]"
        aria-hidden="true"
      />
      <div
        class="absolute right-[4%] bottom-[2%] h-[34%] w-[38%] rounded-[48%] bg-[#cfe5c9]/60"
        aria-hidden="true"
      />
      <div
        class="absolute inset-0 opacity-50"
        style="
          background-image:
            linear-gradient(28deg, transparent 0 41%, rgba(255,255,255,.9) 41.4% 42.2%, transparent 42.7%),
            linear-gradient(118deg, transparent 0 55%, rgba(255,255,255,.82) 55.3% 56.2%, transparent 56.8%),
            linear-gradient(0deg, rgba(255,255,255,.24), rgba(255,255,255,.24));
        "
        aria-hidden="true"
      />

      <!-- 지도 실루엣을 미디어로 채운 콜라주. 실제 지도 SDK가 붙으면 이 레이어만 지도 폴리곤에 맞추면 된다. -->
      <div
        class="map-media-shape absolute inset-x-[8%] inset-y-[10%] z-[1] overflow-hidden border border-white/75 bg-white/55 shadow-[var(--shadow-soft)]"
        aria-label="미디어로 채운 여행 지도"
      >
        <div
          v-if="mapFillTiles.length"
          class="grid h-full w-full grid-cols-6 auto-rows-fr gap-[3px] bg-white/60 p-[3px]"
        >
          <button
            v-for="tile in mapFillTiles"
            :key="tile.tileKey"
            type="button"
            class="relative min-h-0 overflow-hidden transition-transform hover:z-[2] hover:scale-105"
            :class="[tileToneClass(tile.type), tile.muted ? 'opacity-55' : 'opacity-95']"
            :aria-label="`${tile.blockTitle} ${mediaLabel(tile.type)} 보기`"
            @click="openMedia(tile)"
          >
            <img
              v-if="tile.type === 'PHOTO' && tile.media.url"
              :src="tile.media.url"
              alt=""
              class="h-full w-full object-cover"
            />
            <span
              v-else
              class="grid h-full w-full place-items-center text-[18px]"
              :class="tile.type === 'PHOTO' ? 'bg-[linear-gradient(135deg,#ffffff,#e8f1f4)]' : ''"
              aria-hidden="true"
            >
              {{ mediaIcon(tile.type) }}
            </span>
            <span
              v-if="tile.representative && !tile.muted"
              class="absolute top-1 right-1 grid size-4 place-items-center rounded-full bg-[var(--brand)] text-[9px] text-white"
              aria-hidden="true"
            >
              ★
            </span>
          </button>
        </div>
        <div
          v-else
          class="grid h-full w-full place-items-center bg-[linear-gradient(135deg,rgba(255,255,255,.76),rgba(255,255,255,.32))] text-[12px] font-semibold text-[var(--ink-3)]"
        >
          미디어가 쌓이면 지도 모양으로 채워져요
        </div>
      </div>

      <div
        class="absolute top-3 left-3 z-[2] flex flex-wrap items-center gap-2 rounded-[var(--radius)] border border-white/70 bg-white/85 px-3 py-2 text-[12px] text-[var(--ink-2)] shadow-[var(--shadow-soft)]"
      >
        <b class="text-[var(--ink)]">{{ layout.length }}곳</b>
        <span>미디어 {{ mediaCount }}개</span>
        <span>사진 {{ photoCount }} · 녹음/영상 {{ audioVideoCount }}</span>
      </div>

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

      <!-- 장소 핀 -->
      <button
        v-for="p in layout"
        :key="p.block.id"
        type="button"
        class="absolute z-[2] -translate-x-1/2 -translate-y-full"
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

      <!-- 미디어 앵커: 콜라주 위에서 원본 장소 위치를 짚어준다. -->
      <button
        v-for="marker in mediaMarkers"
        :key="marker.key"
        type="button"
        class="absolute z-[3] flex size-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center border-2 border-white bg-[var(--card)] text-[13px] shadow-[var(--shadow-pop)] transition-transform hover:scale-110"
        :class="markerShapeClass(marker.type)"
        :style="mediaStyle(marker)"
        :aria-label="`${marker.blockTitle} ${mediaLabel(marker.type)} 보기`"
        @click="openMedia(marker)"
      >
        <img
          v-if="marker.type === 'PHOTO' && marker.media.url"
          :src="marker.media.url"
          alt=""
          class="h-full w-full object-cover"
          :class="markerShapeClass(marker.type)"
        />
        <span
          v-else
          class="grid h-full w-full place-items-center bg-[linear-gradient(135deg,var(--brand-soft),var(--bg-subtle))]"
          :class="markerShapeClass(marker.type)"
          aria-hidden="true"
        >
          {{ mediaIcon(marker.type) }}
        </span>
        <span
          v-if="marker.representative"
          class="absolute -top-1 -right-1 grid size-5 place-items-center rounded-full bg-[var(--brand)] text-[10px] text-white"
          aria-hidden="true"
        >
          ★
        </span>
      </button>
    </div>

    <p v-if="layout.length" class="mt-2 text-[12px] text-[var(--ink-3)]">
      위치가 있는 {{ layout.length }}개 장소를 방문 순서대로 잇고, 사진·녹음·영상으로 지도 모양을 채워 보여줘요.
    </p>

    <div v-if="mediaMarkers.length" class="mt-3 flex flex-col gap-2">
      <p class="text-[12px] font-bold text-[var(--ink-3)]">지도 위 미디어</p>
      <div class="grid gap-2 sm:grid-cols-2">
        <button
          v-for="marker in mediaMarkers"
          :key="`list-${marker.key}`"
          type="button"
          class="flex min-w-0 items-center gap-2 rounded-[var(--radius)] border border-[var(--border)] px-2.5 py-2 text-left transition-colors hover:bg-[var(--hover)]"
          @click="openMedia(marker)"
        >
          <span
            class="grid size-9 flex-none place-items-center overflow-hidden border border-[var(--border)] bg-[var(--bg-subtle)]"
            :class="markerShapeClass(marker.type)"
          >
            <img
              v-if="marker.type === 'PHOTO' && marker.media.url"
              :src="marker.media.url"
              alt=""
              class="h-full w-full object-cover"
            />
            <span v-else aria-hidden="true">{{ mediaIcon(marker.type) }}</span>
          </span>
          <span class="min-w-0 flex-1">
            <span class="block truncate text-[13px] font-semibold text-[var(--ink)]">
              {{ marker.blockTitle }}
            </span>
            <span class="block text-[11.5px] text-[var(--ink-3)]">
              {{ mediaLabel(marker.type) }} · {{ marker.point.block.visitDate || '날짜 미정' }}
            </span>
          </span>
          <Star v-if="marker.representative" class="size-3.5 flex-none fill-current text-[var(--brand)]" />
        </button>
      </div>
    </div>

    <!-- 블록 추가(관광지 검색 등) — Day 1 로 들어가고, 이후 다른 뷰에서 옮길 수 있어요. -->
    <AddBlockRow variant="plain" class="mt-3" @add="(t) => emit('add-block', t, defaultDate)" />

    <MediaLightbox
      :media="lightbox?.media ?? null"
      :caption="lightbox?.blockTitle ?? ''"
      can-set-representative
      can-delete
      @close="closeLightbox"
      @set-representative="selectRepresentative(lightbox)"
      @delete="deleteMedia(lightbox)"
    />
  </div>
</template>

<style scoped>
.map-media-shape {
  border-radius: 42% 58% 48% 52% / 34% 38% 62% 66%;
  clip-path: polygon(
    8% 32%,
    16% 15%,
    35% 9%,
    50% 14%,
    63% 7%,
    81% 18%,
    91% 36%,
    86% 55%,
    95% 72%,
    75% 90%,
    55% 84%,
    36% 94%,
    17% 82%,
    6% 62%
  );
}
</style>
