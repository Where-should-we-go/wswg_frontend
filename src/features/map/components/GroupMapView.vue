<script setup>
// GroupMapView — S8 발자취 지도. 앱 셸 안 본문 캔버스만 그린다(사이드바·토픽바 X).
// 데스크탑 2존: 지도 존(주, RegionMap) + 우측 대표 패널(320~360px).
// 모바일: 풀스크린 지도 + 하단 바텀시트(대표 카드 가로 캐러셀 peek).
// 권역/핀 탭 → 갤러리 풀스크린 시트(E4) → 대표 지정/해제(E3).
// 데이터는 services/groupMap 만 사용(직접 fetch 금지). 카피는 해요체.
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { toast } from 'vue-sonner'
import { getGroupMap } from '@/services/groupMap'
import { getGroup } from '@/services/groups'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import EmptyState from '@/components/common/EmptyState.vue'
import Carousel from '@/components/common/Carousel.vue'
import { MEDIA_BADGE, SIDO_CELLS } from '@/features/map/data/koreaSido'
import RegionMap from './RegionMap.vue'
import MemoryCard from './MemoryCard.vue'
import RegionGallerySheet from './RegionGallerySheet.vue'

const route = useRoute()
const groupId = computed(() => route.params.id)

const items = ref([])
const group = ref(null)
const regionLevel = ref('GUGUN')
const selectedMediaType = ref(null)
const status = ref('loading') // loading | ready | empty | error
const focusedSido = ref(null)

async function load() {
  status.value = 'loading'
  try {
    const params = {
      ...(selectedMediaType.value ? { mediaType: selectedMediaType.value } : {}),
    }
    const data = await getGroupMap(groupId.value, params)
    items.value = Array.isArray(data) ? data : []
    status.value = items.value.length ? 'ready' : 'empty'
  } catch {
    status.value = 'error'
    toast.error('발자취를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.')
  }
}

watch(groupId, load, { immediate: true })
watch(groupId, async (id) => {
  group.value = await getGroup(id).catch(() => null)
}, { immediate: true })
watch(selectedMediaType, load)

const mediaTypeOptions = [
  { value: 'PHOTO', label: '사진' },
  { value: 'AUDIO', label: '녹음' },
  { value: 'VIDEO', label: '영상' },
]

const SIDO_DISPLAY_NAMES = {
  1: '서울시',
  2: '인천시',
  3: '대전시',
  4: '대구시',
  5: '광주시',
  6: '부산시',
  7: '울산시',
  8: '세종시',
  31: '경기도',
  32: '강원도',
  33: '충청북도',
  34: '충청남도',
  35: '경상북도',
  36: '경상남도',
  37: '전라북도',
  38: '전라남도',
  39: '제주도',
}

const regionStats = computed(() => {
  const map = new Map()
  const sourceItems =
    focusedSido.value != null && regionLevel.value === 'GUGUN'
      ? items.value.filter((item) => item.sidoCode === focusedSido.value)
      : items.value
  for (const item of sourceItems) {
    const key =
      regionLevel.value === 'GUGUN'
        ? `${item.sidoCode}-${item.gugunCode ?? 'unknown'}`
        : `${item.sidoCode}`
    const prev = map.get(key) ?? {
      ...item,
      id: `${regionLevel.value}-${key}`,
      groupLevel: regionLevel.value,
      gugunCode: regionLevel.value === 'GUGUN' ? item.gugunCode : null,
      regionLabel: regionLabelOf(item),
      count: 0,
      photo: null,
      types: new Set(),
    }
    prev.count += 1
    prev.types.add(item.mediaType)
    if (!prev.photo && item.mediaType === 'PHOTO' && item.mediaUrl) prev.photo = item.mediaUrl
    map.set(key, prev)
  }
  return [...map.values()].map((v) => ({ ...v, types: [...v.types] }))
})

const totalMediaCount = computed(() => items.value.length)
const title = computed(() => group.value?.groupName ? `${group.value.groupName} 발자취` : '모임 발자취')
const hasFilter = computed(() => !!selectedMediaType.value)
const emptyTitle = computed(() => hasFilter.value ? '이 조건에 맞는 발자취가 없어요' : '아직 함께 다녀온 곳이 없어요')
const emptyDescription = computed(() =>
  hasFilter.value ? '필터를 바꾸거나 여행 기록에 미디어를 더해보세요.' : '여행을 다녀오면 여기에 발자취가 쌓여요.',
)
const regionUnitLabel = computed(() => (regionLevel.value === 'GUGUN' ? '구군' : '도/시'))
const groupedRegionCount = computed(() => regionStats.value.length)

function regionLabelOf(item) {
  if (regionLevel.value === 'GUGUN') {
    return item.gugunName || item.regionLabel || '지역 미상'
  }

  return SIDO_DISPLAY_NAMES[item.sidoCode] || item.sidoName || SIDO_CELLS.find((c) => c.sidoCode === item.sidoCode)?.name || '지역 미상'
}

function resetFilters() {
  selectedMediaType.value = null
  focusedSido.value = null
}

// 지도/카드 클릭 → 해당 시도로 포커스.
function focusRegion(item) {
  focusedSido.value = item.sidoCode
  regionLevel.value = 'GUGUN'
}

// ── 갤러리(E4) ──────────────────────────────────────────────
const gallery = ref({ open: false, loading: false, label: '', sidoCode: null, gugunCode: null, items: [] })

const galleryRepresentativeId = computed(() => {
  // 현재 대표(items)에서 갤러리 지역과 일치하는 한 건.
  const rep = items.value.find(
    (m) =>
      m.sidoCode === gallery.value.sidoCode &&
      (gallery.value.gugunCode == null || (m.gugunCode ?? null) === gallery.value.gugunCode),
  )
  return rep?.id ?? null
})

async function openGallery({ sidoCode, gugunCode = null, regionLabel = '', preloadedItems = null }) {
  gallery.value = { open: true, loading: true, label: regionLabel, sidoCode, gugunCode, items: [] }
  if (Array.isArray(preloadedItems)) {
    gallery.value.items = preloadedItems
    gallery.value.loading = false
    return
  }
  focusedSido.value = sidoCode
  try {
    const data = await getGroupMap(groupId.value, {
      sidoCode,
      ...(gugunCode != null ? { gugunCode } : {}),
      ...(selectedMediaType.value ? { mediaType: selectedMediaType.value } : {}),
    })
    gallery.value.items = Array.isArray(data) ? data : []
  } catch {
    toast.error('이 지역의 추억을 불러오지 못했어요.')
  } finally {
    gallery.value.loading = false
  }
}

function openGalleryByGugun(payload) {
  openGallery(payload)
}

function openGalleryFromCard(item) {
  focusRegion(item)
  openGallery(galleryPayloadFor(item))
}

function galleryPayloadFor(item) {
  const useGugun = regionLevel.value === 'GUGUN'
  return {
    sidoCode: item.sidoCode,
    gugunCode: useGugun ? item.gugunCode ?? null : null,
    regionLabel: item.regionLabel,
  }
}

</script>

<template>
  <div class="flex h-full min-h-[420px] flex-col md:grid md:grid-cols-[1fr_360px]">
    <!-- ─── 지도 존(주) ─── -->
    <section class="relative flex min-h-[360px] flex-1 flex-col md:h-full">
      <div class="border-b border-[var(--border)] bg-[var(--card)] px-4 py-3">
        <div class="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 class="text-[20px] font-extrabold tracking-tight text-[var(--ink)]">{{ title }}</h1>
            <p class="mt-1 text-[12.5px] text-[var(--ink-3)]">
              다녀온 기록을 도/시 또는 구군 단위로 묶어 미디어를 보여줘요.
            </p>
          </div>
          <div class="grid grid-cols-[130px_auto] gap-2">
            <Select v-model="selectedMediaType" :options="mediaTypeOptions" placeholder="미디어 전체" />
            <Button variant="outline" size="sm" class="h-9" @click="resetFilters">초기화</Button>
          </div>
        </div>
      </div>

      <div class="relative min-h-[320px] flex-1">
      <RegionMap
        :items="status === 'ready' ? items : []"
        :focused-sido="focusedSido"
        @select-gugun="openGalleryByGugun"
      />

      <!-- 빈: 회색 전국 지도 위 EmptyState 오버레이 -->
      <div
        v-if="status === 'empty'"
        class="absolute inset-0 z-[3] flex items-center justify-center bg-[color-mix(in_srgb,var(--bg-subtle)_70%,transparent)]"
      >
        <EmptyState
          icon="🧭"
          :title="emptyTitle"
          :description="emptyDescription"
        />
      </div>

      <!-- 에러: 인라인 + 재시도 -->
      <div
        v-else-if="status === 'error'"
        class="absolute inset-0 z-[3] flex flex-col items-center justify-center gap-3 bg-[color-mix(in_srgb,var(--bg-subtle)_70%,transparent)] text-center"
      >
        <p class="text-sm text-[var(--ink-2)]">발자취를 불러오지 못했어요.</p>
        <Button variant="outline" size="sm" @click="load">다시 시도</Button>
      </div>

      <!-- 로딩: 지도 위 메시지 -->
      <div
        v-else-if="status === 'loading'"
        class="absolute inset-0 z-[3] flex items-center justify-center bg-[color-mix(in_srgb,var(--bg-subtle)_70%,transparent)]"
      >
        <p class="text-sm text-[var(--ink-3)]">발자취를 불러오고 있어요…</p>
      </div>
      </div>
    </section>

    <!-- ─── 우측 대표 패널 (데스크탑) ─── -->
    <aside class="hidden overflow-auto border-l border-[var(--border)] p-4 md:block">
      <h2 class="text-[15px] font-extrabold text-[var(--ink)]">우리가 함께 밟은 발자취</h2>
      <p class="mt-1 text-[12.5px] text-[var(--ink-3)]">지역별 여행 기록과 미디어를 모았어요.</p>

      <div class="my-4 grid grid-cols-2 gap-2">
        <div class="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-subtle)] p-3">
          <div class="text-[11px] font-bold text-[var(--ink-3)]">{{ regionUnitLabel }} 묶음</div>
          <div class="mt-1 text-[22px] font-extrabold text-[var(--brand-ink)]">{{ groupedRegionCount }}</div>
        </div>
        <div class="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-subtle)] p-3">
          <div class="text-[11px] font-bold text-[var(--ink-3)]">기록 미디어</div>
          <div class="mt-1 text-[22px] font-extrabold text-[var(--brand-ink)]">{{ totalMediaCount }}</div>
        </div>
      </div>

      <!-- 로딩 -->
      <div v-if="status === 'loading'" class="flex flex-col gap-2">
        <Skeleton v-for="n in 4" :key="n" class="h-[72px] w-full" />
      </div>

      <!-- 빈 -->
      <p v-else-if="status === 'empty'" class="text-[12.5px] text-[var(--ink-3)]">
        다녀온 여행이 쌓이면 대표 추억이 여기에 나타나요.
      </p>

      <!-- 기본 -->
      <div v-else-if="status === 'ready'" class="flex flex-col gap-2">
        <MemoryCard
          v-for="m in regionStats"
          :key="`${m.groupLevel}-${m.id}`"
          :item="m"
          :active="focusedSido === m.sidoCode"
          @focus="focusRegion"
          @change="openGalleryFromCard"
        />
      </div>
    </aside>

    <!-- ─── 하단 바텀시트(모바일): 대표 카드 가로 캐러셀 peek ─── -->
    <div
      v-if="status === 'ready'"
      class="border-t border-[var(--border)] bg-[var(--card)] px-4 pt-2.5 pb-3 md:hidden"
    >
      <div class="mx-auto mb-2.5 h-1 w-9 rounded-full bg-[var(--border-strong)]" />
      <div class="mb-2 flex items-center justify-between gap-2 text-[13px] font-bold text-[var(--ink)]">
        <span>{{ regionUnitLabel }} {{ regionStats.length }}곳</span>
        <Badge variant="secondary">{{ totalMediaCount }}개 기록</Badge>
      </div>
      <Carousel :arrows="false">
        <button
          v-for="m in regionStats"
          :key="`mobile-${m.groupLevel}-${m.id}`"
          type="button"
          class="w-[130px] flex-none snap-start text-left"
          @click="focusRegion(m)"
        >
          <img
            v-if="m.photo || m.mediaUrl"
            :src="m.photo || m.mediaUrl"
            alt=""
            class="h-[90px] w-full rounded-[var(--radius)] object-cover"
          />
          <div
            v-else
            class="h-[90px] w-full rounded-[var(--radius)] bg-[linear-gradient(135deg,var(--brand-soft),var(--bg-subtle))]"
            aria-hidden="true"
          />
          <div class="mt-1.5 truncate text-[12.5px] font-bold text-[var(--ink)]">
            {{ m.regionLabel }}
          </div>
          <div class="truncate text-[11px] text-[var(--ink-3)]">
            {{ m.count }}개 기록 · {{ MEDIA_BADGE[m.mediaType]?.emoji }} {{ m.caption }}
          </div>
        </button>
      </Carousel>
    </div>

    <!-- 갤러리 시트(E4) + 대표 지정/해제(E3) -->
    <RegionGallerySheet
      v-model:open="gallery.open"
      :loading="gallery.loading"
      :region-label="gallery.label"
      :items="gallery.items"
      :representative-id="galleryRepresentativeId"
    />
  </div>
</template>
