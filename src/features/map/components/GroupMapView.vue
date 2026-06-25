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
import { getGuguns, getSidos } from '@/services/attractions'
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
const sidos = ref([])
const guguns = ref([])
const selectedSido = ref(null)
const selectedGugun = ref(null)
const selectedMediaType = ref(null)
const status = ref('loading') // loading | ready | empty | error
const focusedSido = ref(null)

async function load() {
  status.value = 'loading'
  try {
    const params = {
      ...(selectedSido.value != null ? { sidoCode: selectedSido.value } : {}),
      ...(selectedGugun.value != null ? { gugunCode: selectedGugun.value } : {}),
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
watch(groupId, async () => {
  sidos.value = (await getSidos().catch(() => [])).map((s) => ({
    value: s.sidoCode,
    label: s.sidoName,
  }))
}, { immediate: true })
watch(selectedSido, async (sidoCode) => {
  selectedGugun.value = null
  focusedSido.value = sidoCode == null ? null : Number(sidoCode)
  if (sidoCode == null) {
    guguns.value = []
    return
  }
  guguns.value = (await getGuguns(sidoCode).catch(() => [])).map((g) => ({
    value: g.gugunCode,
    label: g.gugunName,
  }))
})
watch([selectedSido, selectedGugun, selectedMediaType], load)

const mediaTypeOptions = [
  { value: 'PHOTO', label: '사진' },
  { value: 'AUDIO', label: '녹음' },
  { value: 'VIDEO', label: '영상' },
]

const regionStats = computed(() => {
  const map = new Map()
  for (const item of items.value) {
    const key = `${item.sidoCode}-${item.gugunCode ?? 'all'}`
    const prev = map.get(key) ?? {
      ...item,
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

const visitedSidoCount = computed(() => new Set(items.value.map((item) => item.sidoCode)).size)
const totalMediaCount = computed(() => items.value.length)
const title = computed(() => group.value?.groupName ? `${group.value.groupName} 발자취` : '모임 발자취')
const hasFilter = computed(() => selectedSido.value != null || selectedGugun.value != null || !!selectedMediaType.value)
const emptyTitle = computed(() => hasFilter.value ? '이 조건에 맞는 발자취가 없어요' : '아직 함께 다녀온 곳이 없어요')
const emptyDescription = computed(() =>
  hasFilter.value ? '필터를 바꾸거나 여행 기록에 미디어를 더해보세요.' : '여행을 다녀오면 여기에 발자취가 쌓여요.',
)

function resetFilters() {
  selectedSido.value = null
  selectedGugun.value = null
  selectedMediaType.value = null
  focusedSido.value = null
}

// 지도/카드 클릭 → 해당 시도로 포커스.
function focusRegion(item) {
  focusedSido.value = item.sidoCode
}

// ── 갤러리(E4) ──────────────────────────────────────────────
const gallery = ref({ open: false, loading: false, label: '', sidoCode: null, gugunCode: null, items: [] })

const galleryRepresentativeId = computed(() => {
  // 현재 대표(items)에서 갤러리 지역과 일치하는 한 건.
  const rep = items.value.find(
    (m) => m.sidoCode === gallery.value.sidoCode && (m.gugunCode ?? null) === (gallery.value.gugunCode ?? null),
  )
  return rep?.id ?? null
})

async function openGallery({ sidoCode, gugunCode = null, regionLabel = '' }) {
  focusedSido.value = sidoCode
  gallery.value = { open: true, loading: true, label: regionLabel, sidoCode, gugunCode, items: [] }
  try {
    const data = await getGroupMap(groupId.value, { sidoCode, ...(gugunCode != null ? { gugunCode } : {}) })
    gallery.value.items = Array.isArray(data) ? data : []
  } catch {
    toast.error('이 지역의 추억을 불러오지 못했어요.')
  } finally {
    gallery.value.loading = false
  }
}

function openGalleryBySido(sidoCode) {
  const cell = SIDO_CELLS.find((c) => c.sidoCode === sidoCode)
  selectedSido.value = sidoCode
  openGallery({ sidoCode, regionLabel: cell?.name || '' })
}

function openGalleryFromPin(item) {
  openGallery({ sidoCode: item.sidoCode, gugunCode: item.gugunCode ?? null, regionLabel: item.regionLabel })
}

function openGalleryFromCard(item) {
  focusRegion(item)
  openGallery({ sidoCode: item.sidoCode, gugunCode: item.gugunCode ?? null, regionLabel: item.regionLabel })
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
              다녀온 지역은 미디어로 채워지고, 아직 안 간 곳은 지도 그대로 남아요.
            </p>
          </div>
          <div class="grid grid-cols-2 gap-2 sm:grid-cols-[150px_150px_130px_auto]">
            <Select v-model="selectedSido" :options="sidos" placeholder="시도 전체" />
            <Select
              v-model="selectedGugun"
              :options="guguns"
              placeholder="구군 전체"
              :disabled="!selectedSido || !guguns.length"
            />
            <Select v-model="selectedMediaType" :options="mediaTypeOptions" placeholder="미디어 전체" />
            <Button variant="outline" size="sm" class="h-9" @click="resetFilters">초기화</Button>
          </div>
        </div>
      </div>

      <div class="relative min-h-[320px] flex-1">
      <RegionMap
        :items="status === 'ready' ? items : []"
        :focused-sido="focusedSido"
        @select-region="openGalleryBySido"
        @select-pin="openGalleryFromPin"
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
          <div class="text-[11px] font-bold text-[var(--ink-3)]">방문 시도</div>
          <div class="mt-1 text-[22px] font-extrabold text-[var(--brand-ink)]">{{ visitedSidoCount }}</div>
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
          :key="m.id"
          :item="m"
          :active="focusedSido === m.sidoCode"
          @focus="openGalleryFromCard"
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
        <span>발자취 {{ regionStats.length }}곳</span>
        <Badge variant="secondary">{{ totalMediaCount }}개 기록</Badge>
      </div>
      <Carousel :arrows="false">
        <button
          v-for="m in regionStats"
          :key="m.id"
          type="button"
          class="w-[130px] flex-none snap-start text-left"
          @click="openGalleryFromCard(m)"
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
