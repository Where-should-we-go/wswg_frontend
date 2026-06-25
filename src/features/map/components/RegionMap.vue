<script setup>
// RegionMap — 발자취 지도(S8) 본문.
// 전국을 시군구 경계로 그리고, 미디어가 있는 시군구만 사진/타입 배지로 채운다.
import { computed, onMounted, ref, watch } from 'vue'
import { MEDIA_BADGE } from '@/features/map/data/koreaSido'

const MUNICIPALITY_GEOJSON_URL =
  'https://raw.githubusercontent.com/southkorea/southkorea-maps/master/kostat/2018/json/skorea-municipalities-2018-geo.json'

const KOSTAT_PREFIX_TO_SIDO_CODE = {
  11: 1,
  21: 6,
  22: 4,
  23: 2,
  24: 5,
  25: 3,
  26: 7,
  29: 8,
  31: 31,
  32: 32,
  33: 33,
  34: 34,
  35: 37,
  36: 38,
  37: 35,
  38: 36,
  39: 39,
}

const props = defineProps({
  // getGroupMap 응답: [{ id, sidoCode, gugunCode, mediaType, regionLabel, caption, ... }]
  items: { type: Array, default: () => [] },
  focusedSido: { type: Number, default: null },
})

const emit = defineEmits(['select-gugun', 'select-pin'])

const mapStatus = ref('loading')
const rawFeatures = ref([])
const zoomSido = ref(null)

watch(
  () => props.focusedSido,
  (sidoCode) => {
    zoomSido.value = sidoCode
  },
  { immediate: true },
)

onMounted(loadMunicipalities)

async function loadMunicipalities() {
  mapStatus.value = 'loading'
  try {
    const response = await fetch(MUNICIPALITY_GEOJSON_URL)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const geojson = await response.json()
    rawFeatures.value = Array.isArray(geojson.features) ? geojson.features : []
    mapStatus.value = rawFeatures.value.length ? 'ready' : 'error'
  } catch {
    mapStatus.value = 'error'
  }
}

const projection = computed(() => {
  const points = []
  for (const feature of rawFeatures.value) {
    collectLonLat(feature.geometry?.coordinates, points)
  }

  if (!points.length) {
    return {
      project: ([lon, lat]) => [lon, lat],
    }
  }

  const geoBounds = boundsOf(points)
  const minLon = geoBounds.minX
  const maxLon = geoBounds.maxX
  const minLat = geoBounds.minY
  const maxLat = geoBounds.maxY
  const width = maxLon - minLon || 1
  const height = maxLat - minLat || 1
  const scale = Math.min(96 / width, 132 / height)
  const drawnWidth = width * scale
  const drawnHeight = height * scale
  const offsetX = (100 - drawnWidth) / 2
  const offsetY = (140 - drawnHeight) / 2

  return {
    project: ([lon, lat]) => [
      offsetX + (lon - minLon) * scale,
      offsetY + (maxLat - lat) * scale,
    ],
  }
})

// 미디어를 좌표(lat/lng) 기준으로 시군구 GeoJSON 폴리곤에 떨어뜨려 묶는다.
// 지역코드 체계(예: 제주 50 vs 지도 39)나 구군명 표기 차이와 무관하게 매칭된다.
const mediaByFeature = computed(() => {
  const map = new Map()
  for (const item of props.items) {
    const lon = Number(item.longitude)
    const lat = Number(item.latitude)
    if (!Number.isFinite(lon) || !Number.isFinite(lat)) continue
    const feature = rawFeatures.value.find((f) => featureContainsPoint(f, lon, lat))
    if (!feature) continue
    const code = String(feature.properties?.code ?? '')
    const list = map.get(code) ?? []
    list.push(item)
    map.set(code, list)
  }
  return map
})

const cells = computed(() =>
  rawFeatures.value
    .map((feature) => toCell(feature))
    .filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name, 'ko')),
)

const visibleCells = computed(() =>
  zoomSido.value == null
    ? cells.value
    : cells.value.filter((cell) => cell.sidoCode === zoomSido.value),
)

const visibleVisitedCount = computed(() => visibleCells.value.filter((cell) => cell.media.length > 0).length)
const visibleTotalCount = computed(() => visibleCells.value.length)
const focusedSidoName = computed(() =>
  zoomSido.value == null ? '' : (visibleCells.value[0]?.sidoName ?? ''),
)
const zoomOptions = computed(() => {
  const bySido = new Map()
  for (const cell of cells.value) {
    if (!bySido.has(cell.sidoCode)) bySido.set(cell.sidoCode, cell.sidoName)
  }
  return [...bySido.entries()]
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label, 'ko'))
})
const mapViewBox = computed(() => {
  if (zoomSido.value == null || !visibleCells.value.length) return '0 0 100 140'

  const minX = Math.min(...visibleCells.value.map((cell) => cell.bounds.x))
  const minY = Math.min(...visibleCells.value.map((cell) => cell.bounds.y))
  const maxX = Math.max(...visibleCells.value.map((cell) => cell.bounds.x + cell.bounds.w))
  const maxY = Math.max(...visibleCells.value.map((cell) => cell.bounds.y + cell.bounds.h))
  const padding = 2.4
  const x = Math.max(0, minX - padding)
  const y = Math.max(0, minY - padding)
  const width = Math.min(100 - x, maxX - minX + padding * 2)
  const height = Math.min(140 - y, maxY - minY + padding * 2)

  return `${round(x)} ${round(y)} ${round(width)} ${round(height)}`
})

function toCell(feature) {
  const code = String(feature.properties?.code ?? '')
  const name = feature.properties?.name ?? ''
  const sidoCode = KOSTAT_PREFIX_TO_SIDO_CODE[code.slice(0, 2)]
  if (!sidoCode || !name || !feature.geometry) return null

  const path = geometryToPath(feature.geometry)
  if (!path) return null

  const points = []
  collectLonLat(feature.geometry.coordinates, points)
  const projected = points.map((point) => projection.value.project(point))
  const projectedBounds = boundsOf(projected)
  const bounds = {
    x: projectedBounds.minX,
    y: projectedBounds.minY,
    w: projectedBounds.maxX - projectedBounds.minX,
    h: projectedBounds.maxY - projectedBounds.minY,
  }
  const center = polygonCenter(projected, bounds)
  const media = mediaByFeature.value.get(code) ?? []
  // 여행에서 대표로 선정한 사진(representative)을 우선, 없으면 첫 사진을 권역 대표로.
  const photo =
    media.find((item) => item.representative && item.mediaType === 'PHOTO' && item.mediaUrl) ??
    media.find((item) => item.mediaType === 'PHOTO' && item.mediaUrl)
  const representative = photo ?? media[0] ?? null

  return {
    id: code,
    code,
    sidoCode,
    sidoName: sidoNameOf(sidoCode),
    gugunCode: representative?.gugunCode ?? null,
    name,
    label: [sidoNameOf(sidoCode), name].filter(Boolean).join(' '),
    path,
    bounds,
    center,
    media,
    representative,
  }
}

function geometryToPath(geometry) {
  const polygons =
    geometry.type === 'Polygon'
      ? [geometry.coordinates]
      : geometry.type === 'MultiPolygon'
        ? geometry.coordinates
        : []

  return polygons
    .map((polygon) =>
      polygon
        .map((ring) => {
          const points = ring.map((point) => projection.value.project(point))
          if (!points.length) return ''
          return `M${points.map(([x, y]) => `${round(x)} ${round(y)}`).join('L')}Z`
        })
        .join(''),
    )
    .join('')
}

function collectLonLat(value, out) {
  if (!Array.isArray(value)) return
  if (typeof value[0] === 'number' && typeof value[1] === 'number') {
    out.push(value)
    return
  }
  for (const child of value) collectLonLat(child, out)
}

function boundsOf(points) {
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  for (const [x, y] of points) {
    if (x < minX) minX = x
    if (x > maxX) maxX = x
    if (y < minY) minY = y
    if (y > maxY) maxY = y
  }
  return { minX, maxX, minY, maxY }
}

function polygonCenter(points, bounds) {
  if (!points.length) return { x: bounds.x + bounds.w / 2, y: bounds.y + bounds.h / 2 }
  const sample = points.filter((_, index) => index % 8 === 0)
  const source = sample.length ? sample : points
  return {
    x: source.reduce((sum, point) => sum + point[0], 0) / source.length,
    y: source.reduce((sum, point) => sum + point[1], 0) / source.length,
  }
}

// 점-다각형 포함 판정: [lon,lat]가 feature 폴리곤(외곽 링) 안이고 구멍(홀)에 없으면 true.
function featureContainsPoint(feature, lon, lat) {
  const geometry = feature.geometry
  if (!geometry) return false
  const polygons =
    geometry.type === 'Polygon'
      ? [geometry.coordinates]
      : geometry.type === 'MultiPolygon'
        ? geometry.coordinates
        : []
  for (const polygon of polygons) {
    const outer = polygon[0]
    if (!outer || !pointInRing(lon, lat, outer)) continue
    let inHole = false
    for (let h = 1; h < polygon.length; h++) {
      if (pointInRing(lon, lat, polygon[h])) {
        inHole = true
        break
      }
    }
    if (!inHole) return true
  }
  return false
}

function pointInRing(lon, lat, ring) {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0]
    const yi = ring[i][1]
    const xj = ring[j][0]
    const yj = ring[j][1]
    const intersect =
      yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi
    if (intersect) inside = !inside
  }
  return inside
}

function clipId(cell) {
  return `gugun-media-${cell.id}`
}

function cellClass(cell) {
  if (cell.media.length) {
    return 'fill-[var(--brand-soft)] stroke-[var(--brand-ink)] hover:stroke-[var(--brand-ink)]'
  }
  return 'fill-[var(--bg-subtle)] stroke-[color-mix(in_srgb,var(--ink-3)_70%,var(--border))] hover:fill-[var(--hover)] hover:stroke-[var(--ink-2)]'
}

function cellOpacity(cell) {
  if (zoomSido.value == null || zoomSido.value === cell.sidoCode) return 1
  return 0.2
}

function mediaImageBox(cell) {
  return {
    x: cell.bounds.x,
    y: cell.bounds.y,
    w: Math.max(cell.bounds.w, 0.8),
    h: Math.max(cell.bounds.h, 0.8),
  }
}

function badgeRadius(cell) {
  return Math.max(0.75, Math.min(1.8, Math.min(cell.bounds.w, cell.bounds.h) * 0.22))
}

function shouldShowLabel(cell) {
  return cell.media.length > 0
}

function onCell(cell) {
  emit('select-gugun', {
    sidoCode: cell.sidoCode,
    gugunCode: cell.gugunCode,
    regionLabel: cell.label,
    preloadedItems: cell.media,
  })
}

function onZoomChange(event) {
  const value = event.target.value
  zoomSido.value = value === '' ? null : Number(value)
}

function round(value) {
  return Number(value).toFixed(2).replace(/\.?0+$/, '')
}

function sidoNameOf(sidoCode) {
  return (
    {
      1: '서울',
      2: '인천',
      3: '대전',
      4: '대구',
      5: '광주',
      6: '부산',
      7: '울산',
      8: '세종',
      31: '경기',
      32: '강원',
      33: '충북',
      34: '충남',
      35: '경북',
      36: '경남',
      37: '전북',
      38: '전남',
      39: '제주',
    }[sidoCode] ?? ''
  )
}
</script>

<template>
  <div class="relative h-full min-h-[420px] overflow-hidden bg-[var(--bg-subtle)]">
    <div class="absolute top-3.5 right-3.5 left-3.5 z-[2] flex flex-wrap items-start justify-between gap-2">
      <div
        class="rounded-[var(--radius)] border border-[var(--border)] bg-[color-mix(in_srgb,var(--card)_94%,transparent)] px-3 py-2 text-[13px] text-[var(--ink-2)]"
      >
        <template v-if="mapStatus === 'ready'">
          <b class="text-[var(--brand-ink)]">{{ focusedSidoName || '전국' }}</b>
          시군구 {{ visibleTotalCount }}곳 중
          <b class="text-[var(--brand-ink)]">{{ visibleVisitedCount }}곳</b>에 기록이 있어요
        </template>
        <template v-else-if="mapStatus === 'loading'">시군구 지도를 불러오고 있어요…</template>
        <template v-else>시군구 지도를 불러오지 못했어요</template>
      </div>

      <label
        class="flex items-center gap-2 rounded-[var(--radius)] border border-[var(--border)] bg-[color-mix(in_srgb,var(--card)_94%,transparent)] px-3 py-2 text-[12px] font-bold text-[var(--ink-2)]"
      >
        <span>도/시 확대</span>
        <select
          :value="zoomSido ?? ''"
          class="h-7 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--card)] px-2 text-[12px] font-semibold text-[var(--ink)] outline-none focus:border-[var(--brand)]"
          aria-label="도/시 확대"
          @change="onZoomChange"
        >
          <option value="">전국</option>
          <option v-for="option in zoomOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </label>
    </div>

    <div
      class="absolute bottom-3.5 left-3.5 z-[2] flex gap-3 rounded-[var(--radius)] border border-[var(--border)] bg-[color-mix(in_srgb,var(--card)_94%,transparent)] px-3 py-2 text-[11.5px] text-[var(--ink-2)]"
    >
      <span class="flex items-center gap-1.5">
        <i class="inline-block size-2.5 rounded-sm border border-[var(--brand)] bg-[var(--brand-soft)]" />기록 있음
      </span>
      <span class="flex items-center gap-1.5">
        <i class="inline-block size-2.5 rounded-sm border border-[var(--border)] bg-[var(--bg-subtle)]" />기록 없음
      </span>
    </div>

    <svg :viewBox="mapViewBox" class="block h-full w-full" role="img" aria-label="시군구 발자취 지도">
      <defs>
        <clipPath v-for="cell in visibleCells" :id="clipId(cell)" :key="`clip-${cell.id}`">
          <path :d="cell.path" />
        </clipPath>
      </defs>

      <g>
        <g
          v-for="cell in visibleCells"
          :key="cell.id"
          class="cursor-pointer transition-opacity"
          :opacity="cellOpacity(cell)"
          role="button"
          :aria-label="`${cell.label} ${cell.media.length ? `미디어 ${cell.media.length}개` : '기록 없음'}`"
          @click="onCell(cell)"
        >
          <path :d="cell.path" :class="cellClass(cell)" stroke-width="0.13" />
          <image
            v-if="cell.representative?.mediaType === 'PHOTO' && cell.representative?.mediaUrl"
            :href="cell.representative.mediaUrl"
            :clip-path="`url(#${clipId(cell)})`"
            v-bind="{
              x: mediaImageBox(cell).x,
              y: mediaImageBox(cell).y,
              width: mediaImageBox(cell).w,
              height: mediaImageBox(cell).h,
            }"
            opacity="0.9"
            preserveAspectRatio="xMidYMid slice"
          />
          <path
            v-if="cell.media.length"
            :d="cell.path"
            class="pointer-events-none fill-[var(--brand)] opacity-10"
          />
          <circle
            v-if="cell.media.length"
            :cx="cell.center.x"
            :cy="cell.center.y"
            :r="badgeRadius(cell) * 2.8"
            class="fill-white opacity-[0.01]"
          />
          <text
            v-if="cell.representative && cell.representative.mediaType !== 'PHOTO'"
            :x="cell.center.x"
            :y="cell.center.y + badgeRadius(cell) + 1.8"
            text-anchor="middle"
            class="pointer-events-none text-[2px]"
          >
            {{ MEDIA_BADGE[cell.representative.mediaType]?.emoji || '📍' }}
          </text>
          <text
            v-if="shouldShowLabel(cell)"
            :x="cell.center.x"
            :y="cell.center.y + badgeRadius(cell) + 3.8"
            text-anchor="middle"
            class="pointer-events-none fill-[var(--ink)] text-[1.55px] font-bold"
          >
            {{ cell.name }}
          </text>
        </g>
      </g>
    </svg>
  </div>
</template>
