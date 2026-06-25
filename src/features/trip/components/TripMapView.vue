<script setup>
// TripMapView — 여행 기록 지도.
// lat/lng 가 있는 블록을 실제 네이버 지도 위에 방문 순서대로 마커로 찍고,
// 마커를 누르면 그 장소의 사진·녹음·영상을 펼쳐 본다.
// 인증 키(VITE_NAVER_MAP_CLIENT_ID)가 없거나 로드에 실패해도 미디어 목록은 그대로 동작한다.
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Star } from '@lucide/vue'
import EmptyState from '@/components/common/EmptyState.vue'
import AddBlockRow from './AddBlockRow.vue'
import MediaLightbox from './MediaLightbox.vue'
import { typeEmojiOf, railColorOf } from '@/features/trip/lib/blockMeta'
import { hasNaverClientId, loadNaverMaps, onAuthFailure } from '@/features/trip/lib/naverMaps'

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

const mediaMarkers = computed(() =>
  pinned.value.flatMap((block, order) =>
    (block.media ?? []).map((media, mediaIndex) => ({
      key: `${block.id}-${mediaIndex}`,
      blockId: block.id,
      blockTitle: block.title,
      visitDate: block.visitDate,
      order: order + 1,
      mediaIndex,
      media,
      type: normalizeMediaType(media.type),
      representative: !!media.representative,
    })),
  ),
)

const mediaCount = computed(() => mediaMarkers.value.length)
const photoCount = computed(() => mediaMarkers.value.filter((m) => m.type === 'PHOTO').length)
const audioVideoCount = computed(() => mediaMarkers.value.filter((m) => m.type !== 'PHOTO').length)

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

function mediaAtBlock(blockId) {
  return mediaMarkers.value.filter((m) => m.blockId === blockId)
}

// ── 네이버 지도 ──────────────────────────────────────────────
const mapEl = ref(null)
// 'idle' | 'loading' | 'ready' | 'no-key' | 'error'
const mapStatus = ref('idle')
const selectedId = ref(null)

const selectedBlock = computed(() => pinned.value.find((b) => b.id === selectedId.value) ?? null)
const selectedIndex = computed(() => pinned.value.findIndex((b) => b.id === selectedId.value))
const selectedMedia = computed(() =>
  selectedBlock.value ? mediaAtBlock(selectedBlock.value.id) : [],
)

let maps = null // window.naver.maps 네임스페이스
let mapInstance = null
let markers = []
let polyline = null
let removeAuthListener = null
// 디자인 토큰(--primary)을 SDK 가 읽을 수 있는 실제 색 문자열로 변환해 둔다.
let brandColor = '#2c6fe3'

function readBrandColor() {
  if (typeof window === 'undefined') return brandColor
  const v = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim()
  return v || brandColor
}

function markerContent(block, order) {
  const color = railColorOf(block.type)
  const emoji = typeEmojiOf(block.type)
  return `
    <div style="position:relative;transform:translate(-50%,-100%);cursor:pointer;">
      <div style="display:flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:9999px;border:2px solid #fff;background:${color};font-size:15px;box-shadow:0 4px 10px rgba(0,0,0,.25);">${emoji}</div>
      <div style="position:absolute;top:-7px;right:-7px;min-width:17px;height:17px;padding:0 4px;display:flex;align-items:center;justify-content:center;border-radius:9999px;background:#fff;border:1px solid ${brandColor};color:${brandColor};font-size:11px;font-weight:700;line-height:1;">${order}</div>
      <div style="position:absolute;left:50%;bottom:-6px;transform:translateX(-50%);width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:7px solid #fff;"></div>
    </div>`
}

function clearOverlays() {
  for (const m of markers) m.setMap(null)
  markers = []
  if (polyline) {
    polyline.setMap(null)
    polyline = null
  }
}

function renderOverlays() {
  if (!maps || !mapInstance) return
  clearOverlays()

  const pts = pinned.value
  if (!pts.length) return

  const bounds = new maps.LatLngBounds()
  const path = []

  pts.forEach((block, index) => {
    const pos = new maps.LatLng(Number(block.lat), Number(block.lng))
    bounds.extend(pos)
    path.push(pos)

    const marker = new maps.Marker({
      position: pos,
      map: mapInstance,
      title: block.title,
      icon: {
        content: markerContent(block, index + 1),
        anchor: new maps.Point(15, 38),
      },
      zIndex: 100 + index,
    })
    maps.Event.addListener(marker, 'click', () => {
      selectedId.value = block.id
      mapInstance.panTo(pos)
    })
    markers.push(marker)
  })

  if (path.length > 1) {
    polyline = new maps.Polyline({
      map: mapInstance,
      path,
      strokeColor: brandColor,
      strokeWeight: 3,
      strokeOpacity: 0.7,
      strokeStyle: 'shortdash',
    })
  }

  if (pts.length === 1) {
    mapInstance.setCenter(path[0])
    mapInstance.setZoom(14)
  } else {
    mapInstance.fitBounds(bounds, { top: 56, right: 32, bottom: 32, left: 32 })
  }
}

async function initMap() {
  if (!hasNaverClientId()) {
    mapStatus.value = 'no-key'
    return
  }
  mapStatus.value = 'loading'
  try {
    maps = await loadNaverMaps()
    if (!mapEl.value) return
    brandColor = readBrandColor()
    mapInstance = new maps.Map(mapEl.value, {
      center: new maps.LatLng(36.5, 127.8), // 대한민국 중앙(첫 렌더 직후 fitBounds 로 덮어씀)
      zoom: 7,
      scaleControl: false,
      mapDataControl: false,
      logoControlOptions: { position: maps.Position.BOTTOM_LEFT },
      zoomControl: true,
      zoomControlOptions: { position: maps.Position.TOP_RIGHT },
    })
    mapStatus.value = 'ready'
    renderOverlays()
  } catch (err) {
    mapStatus.value = err?.message === 'NAVER_MAP_CLIENT_ID_MISSING' ? 'no-key' : 'error'
  }
}

onMounted(() => {
  removeAuthListener = onAuthFailure(() => {
    mapStatus.value = 'error'
  })
  if (pinned.value.length) initMap()
})

onBeforeUnmount(() => {
  clearOverlays()
  if (mapInstance) {
    mapInstance.destroy?.()
    mapInstance = null
  }
  if (removeAuthListener) removeAuthListener()
})

// 핀(좌표) 목록이 바뀌면 지도를 다시 그린다. 아직 지도가 없으면(첫 핀) 초기화.
watch(
  () => pinned.value.map((b) => `${b.id}:${b.lat}:${b.lng}`).join('|'),
  () => {
    if (selectedId.value && !pinned.value.some((b) => b.id === selectedId.value)) {
      selectedId.value = null
    }
    if (mapStatus.value === 'ready') renderOverlays()
    else if (mapStatus.value === 'idle' && pinned.value.length) initMap()
  },
)

// ── 미디어 라이트박스 ────────────────────────────────────────
const lightbox = ref(null)

function openMedia(marker) {
  selectedId.value = marker.blockId
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
      v-if="!pinned.length"
      icon="🗺️"
      title="지도에 표시할 장소가 없어요"
      description="관광지·식당 블록에 위치가 들어오면 지도에 핀으로 보여요."
    />

    <div
      v-else
      class="relative aspect-[16/10] w-full overflow-hidden rounded-[var(--radius-win)] border border-[var(--border)] bg-[var(--sunken)]"
    >
      <!-- 실제 네이버 지도가 그려지는 캔버스 -->
      <div ref="mapEl" class="absolute inset-0 h-full w-full" />

      <!-- 로딩 -->
      <div
        v-if="mapStatus === 'loading'"
        class="absolute inset-0 z-[2] grid place-items-center bg-[var(--sunken)] text-[13px] text-[var(--ink-3)]"
      >
        지도를 불러오는 중…
      </div>

      <!-- 키 미설정 / 인증·로드 실패 -->
      <div
        v-else-if="mapStatus === 'no-key' || mapStatus === 'error'"
        class="absolute inset-0 z-[2] grid place-items-center bg-[var(--bg-subtle)] p-6 text-center"
      >
        <div
          class="max-w-sm rounded-[var(--radius-win)] border border-[var(--border)] bg-[var(--card)] px-5 py-4 shadow-[var(--shadow-soft)]"
        >
          <p class="text-[14px] font-semibold text-[var(--ink)]">
            {{ mapStatus === 'no-key' ? '네이버 지도 키가 설정되지 않았어요' : '네이버 지도 인증에 실패했어요' }}
          </p>
          <p class="mt-1 text-[12.5px] leading-relaxed text-[var(--ink-3)]">
            <template v-if="mapStatus === 'no-key'">
              <code class="rounded bg-[var(--bg-subtle)] px-1">.env</code> 에
              <code class="rounded bg-[var(--bg-subtle)] px-1">VITE_NAVER_MAP_CLIENT_ID</code> 를 넣어주세요.
            </template>
            <template v-else>
              Client ID 와 NCP 콘솔에 등록한 서비스 URL(도메인)을 확인해 주세요.
            </template>
          </p>
          <p class="mt-2 text-[12px] text-[var(--ink-3)]">
            위치가 있는 장소 <b class="text-[var(--ink)]">{{ pinned.length }}곳</b> 의 미디어는 아래 목록에서 볼 수 있어요.
          </p>
        </div>
      </div>

      <!-- 통계 배지 -->
      <div
        v-if="mapStatus === 'ready'"
        class="pointer-events-none absolute top-3 left-3 z-[2] flex flex-wrap items-center gap-2 rounded-[var(--radius)] border border-white/70 bg-white/85 px-3 py-2 text-[12px] text-[var(--ink-2)] shadow-[var(--shadow-soft)]"
      >
        <b class="text-[var(--ink)]">{{ pinned.length }}곳</b>
        <span>미디어 {{ mediaCount }}개</span>
        <span>사진 {{ photoCount }} · 녹음/영상 {{ audioVideoCount }}</span>
      </div>

      <!-- 선택한 장소 카드 -->
      <div
        v-if="mapStatus === 'ready' && selectedBlock"
        class="absolute right-3 bottom-3 left-3 z-[3] mx-auto max-w-md rounded-[var(--radius-win)] border border-[var(--border)] bg-[var(--card)]/95 p-3 shadow-[var(--shadow-pop)] backdrop-blur"
      >
        <div class="flex items-start justify-between gap-2">
          <div class="min-w-0">
            <p class="truncate text-[13.5px] font-semibold text-[var(--ink)]">
              <span
                class="mr-1.5 inline-flex size-[18px] items-center justify-center rounded-full text-[10px] font-bold text-white"
                :style="{ backgroundColor: railColorOf(selectedBlock.type) }"
              >{{ selectedIndex + 1 }}</span>
              {{ selectedBlock.title }}
            </p>
            <p class="mt-0.5 text-[11.5px] text-[var(--ink-3)]">
              {{ selectedBlock.visitDate || '날짜 미정' }} · 미디어 {{ selectedMedia.length }}개
            </p>
          </div>
          <button
            type="button"
            class="flex-none rounded-md px-1.5 text-[16px] leading-none text-[var(--ink-3)] hover:text-[var(--ink)]"
            aria-label="닫기"
            @click="selectedId = null"
          >×</button>
        </div>
        <div v-if="selectedMedia.length" class="mt-2 flex gap-2 overflow-x-auto pb-0.5">
          <button
            v-for="marker in selectedMedia"
            :key="marker.key"
            type="button"
            class="relative grid size-12 flex-none place-items-center overflow-hidden border border-[var(--border)] bg-[var(--bg-subtle)] transition-transform hover:scale-105"
            :class="markerShapeClass(marker.type)"
            :aria-label="`${marker.blockTitle} ${mediaLabel(marker.type)} 보기`"
            @click="openMedia(marker)"
          >
            <img
              v-if="marker.type === 'PHOTO' && marker.media.url"
              :src="marker.media.url"
              alt=""
              class="h-full w-full object-cover"
            />
            <span v-else aria-hidden="true">{{ mediaIcon(marker.type) }}</span>
            <span
              v-if="marker.representative"
              class="absolute -top-1 -right-1 grid size-4 place-items-center rounded-full bg-[var(--brand)] text-[9px] text-white"
              aria-hidden="true"
            >★</span>
          </button>
        </div>
        <p v-else class="mt-2 text-[12px] text-[var(--ink-3)]">아직 이 장소에 올린 미디어가 없어요.</p>
      </div>
    </div>

    <p v-if="pinned.length" class="mt-2 text-[12px] text-[var(--ink-3)]">
      위치가 있는 {{ pinned.length }}개 장소를 방문 순서대로 잇고, 마커를 누르면 사진·녹음·영상을 볼 수 있어요.
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
              {{ mediaLabel(marker.type) }} · {{ marker.visitDate || '날짜 미정' }}
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
