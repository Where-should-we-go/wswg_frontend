<script setup>
// GroupMapView — S8 발자취 지도. 앱 셸 안 본문 캔버스만 그린다(사이드바·토픽바 X).
// 데스크탑 2존: 지도 존(주, RegionMap) + 우측 대표 패널(320~360px).
// 모바일: 풀스크린 지도 + 하단 바텀시트(대표 카드 가로 캐러셀 peek).
// 권역/핀 탭 → 갤러리 풀스크린 시트(E4) → 대표 지정/해제(E3).
// 데이터는 services/groupMap 만 사용(직접 fetch 금지). 카피는 해요체.
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { toast } from 'vue-sonner'
import { getGroupMap, curateRepresentative, removeRepresentative } from '@/services/groupMap'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import EmptyState from '@/components/common/EmptyState.vue'
import Carousel from '@/components/common/Carousel.vue'
import { MEDIA_BADGE, SIDO_CELLS } from '@/features/map/data/koreaSido'
import RegionMap from './RegionMap.vue'
import MemoryCard from './MemoryCard.vue'
import RegionGallerySheet from './RegionGallerySheet.vue'

const route = useRoute()
const groupId = computed(() => route.params.id)

const items = ref([])
const status = ref('loading') // loading | ready | empty | error
const focusedSido = ref(null)

async function load() {
  status.value = 'loading'
  try {
    const data = await getGroupMap(groupId.value)
    items.value = Array.isArray(data) ? data : []
    status.value = items.value.length ? 'ready' : 'empty'
  } catch {
    status.value = 'error'
    toast.error('발자취를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.')
  }
}

watch(groupId, load, { immediate: true })

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
  openGallery({ sidoCode, regionLabel: cell?.name || '' })
}

function openGalleryFromPin(item) {
  openGallery({ sidoCode: item.sidoCode, gugunCode: item.gugunCode ?? null, regionLabel: item.regionLabel })
}

function openGalleryFromCard(item) {
  focusRegion(item)
  openGallery({ sidoCode: item.sidoCode, gugunCode: item.gugunCode ?? null, regionLabel: item.regionLabel })
}

// ── 대표 지정/해제(E3) ─────────────────────────────────────
async function curate(media) {
  try {
    await curateRepresentative(groupId.value, {
      tripId: media.tripId,
      sidoCode: media.sidoCode,
      gugunCode: media.gugunCode,
      mediaUrl: media.mediaUrl,
      mediaType: media.mediaType,
    })
    toast.success('대표 추억으로 정했어요!')
    await load()
  } catch {
    toast.error('대표 추억을 정하지 못했어요. 다시 시도해 주세요.')
  }
}

async function removeRep(media) {
  try {
    await removeRepresentative(groupId.value, media.id)
    toast.success('대표 추억을 해제했어요.')
    await load()
  } catch {
    toast.error('대표 추억을 해제하지 못했어요. 다시 시도해 주세요.')
  }
}
</script>

<template>
  <div class="flex h-full min-h-[420px] flex-col md:grid md:grid-cols-[1fr_340px]">
    <!-- ─── 지도 존(주) ─── -->
    <section class="relative min-h-[320px] flex-1 md:h-full">
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
          title="아직 함께 다녀온 곳이 없어요"
          description="여행을 다녀오면 여기에 발자취가 쌓여요."
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
    </section>

    <!-- ─── 우측 대표 패널 (데스크탑) ─── -->
    <aside class="hidden overflow-auto border-l border-[var(--border)] p-4 md:block">
      <h2 class="text-[15px] font-extrabold text-[var(--ink)]">우리가 함께 밟은 발자취</h2>
      <p class="mt-1 mb-3.5 text-[12.5px] text-[var(--ink-3)]">지역마다 대표 추억 한 장이에요.</p>

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
          v-for="m in items"
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
      <div class="mb-2 text-[13px] font-bold text-[var(--ink)]">대표 추억 {{ items.length }}</div>
      <Carousel :arrows="false">
        <button
          v-for="m in items"
          :key="m.id"
          type="button"
          class="w-[130px] flex-none snap-start text-left"
          @click="openGalleryFromCard(m)"
        >
          <img
            v-if="m.mediaUrl"
            :src="m.mediaUrl"
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
            {{ MEDIA_BADGE[m.mediaType]?.emoji }} {{ m.caption }}
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
      @curate="curate"
      @remove="removeRep"
    />
  </div>
</template>
