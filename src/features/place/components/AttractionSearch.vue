<script setup>
// S3 관광지 검색·목록 본문 — 간소화 셸(GlobalHeader) 아래에 들어가는 검색 화면.
// 존1 검색바(키워드·시도·구군·검색) / 존2 필터칩(테마)+결과 수 / 존3 카드 그리드 / 존4 페이징.
// 데이터는 서비스 레이어(@/services/attractions)로만 접근(mock↔실제 자동 전환).
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Plus, SlidersHorizontal, Search } from '@lucide/vue'
import { toast } from 'vue-sonner'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FilterChips } from '@/components/ui/filter-chips'
import { Pagination } from '@/components/ui/pagination'
import { Skeleton } from '@/components/ui/skeleton'
import { Card } from '@/components/ui/card'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from '@/components/ui/sheet'
import EmptyState from '@/components/common/EmptyState.vue'
import { getSidos, getGuguns, getContentTypes, searchAttractions } from '@/services/attractions'
import { getMyTrips } from '@/services/mypage'
import { getTrip, updateTrip } from '@/services/trips'
import { isAuthenticated } from '@/services/auth'
import TripPickerList from '@/features/attraction-detail/TripPickerList.vue'
import { buildPlaceBlock } from '@/features/trip/lib/placeBlock'

const router = useRouter()
const route = useRoute()

const PAGE_SIZE = 12

// ── 옵션(지역·테마) ──────────────────────────────────────────
const sidos = ref([])
const guguns = ref([])
const contentTypes = ref([])
const optionsLoading = ref(true)
const gugunsLoading = ref(false)

// ── 검색 입력(폼) — 검색 버튼/적용 전까지 쿼리에 반영하지 않음 ──
const form = reactive({
  keyword: '',
  sidoCode: undefined,
  gugunCode: undefined,
  contentTypeIds: [],
})

// ── 실제 검색에 쓰는 확정 쿼리 ───────────────────────────────
const query = reactive({
  keyword: '',
  sidoCode: undefined,
  gugunCode: undefined,
  contentTypeIds: [],
  page: 0,
})

// ── 결과 상태 ────────────────────────────────────────────────
const results = ref([])
const totalElements = ref(0)
const loading = ref(true) // 초기 마운트부터 결과 조회 전까지 스켈레톤 유지
const errored = ref(false)

// ── 검색 결과에서 바로 여행에 담기 ──────────────────────────
const pickerOpen = ref(false)
const trips = ref([])
const tripsLoading = ref(false)
const adding = ref(false)
const selectedPlace = ref(null)

const sidoOptions = computed(() => sidos.value.map((s) => ({ value: s.sidoCode, label: s.sidoName })))
const gugunOptions = computed(() => guguns.value.map((g) => ({ value: g.gugunCode, label: g.gugunName })))
const themeOptions = computed(() =>
  contentTypes.value.map((c) => ({ value: c.contentTypeId, label: c.name })),
)

const typeNameOf = (id) => contentTypes.value.find((c) => c.contentTypeId === id)?.name ?? '관광지'

// 시도 선택이 바뀌면 구군 목록을 새로 로드하고, 현재 선택 구군은 초기화.
watch(
  () => form.sidoCode,
  async (sidoCode) => {
    form.gugunCode = undefined
    guguns.value = []
    if (sidoCode == null) return
    gugunsLoading.value = true
    try {
      guguns.value = await getGuguns(sidoCode)
    } catch {
      toast.error('지역 정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.')
    } finally {
      gugunsLoading.value = false
    }
  },
)

async function loadOptions() {
  optionsLoading.value = true
  try {
    const [s, t] = await Promise.all([getSidos(), getContentTypes()])
    sidos.value = s
    contentTypes.value = t
  } catch {
    toast.error('지역·테마 정보를 불러오지 못했어요.')
  } finally {
    optionsLoading.value = false
  }
}

async function fetchResults() {
  // page/size 음수는 클라이언트에서 막아 400 방지.
  const page = Math.max(0, query.page)
  loading.value = true
  errored.value = false
  try {
    const res = await searchAttractions({
      keyword: query.keyword || undefined,
      sidoCode: query.sidoCode ?? undefined,
      gugunCode: query.gugunCode ?? undefined,
      contentTypeId: query.contentTypeIds.length ? query.contentTypeIds : undefined,
      page,
      size: PAGE_SIZE,
    })
    results.value = res.content
    totalElements.value = res.totalElements
  } catch {
    errored.value = true
    results.value = []
    totalElements.value = 0
  } finally {
    loading.value = false
  }
}

// 검색 버튼: 폼 입력을 쿼리로 확정하고 1페이지부터 다시 조회.
function runSearch() {
  query.keyword = form.keyword.trim()
  query.sidoCode = form.sidoCode
  query.gugunCode = form.gugunCode
  query.contentTypeIds = [...form.contentTypeIds]
  query.page = 0
  fetchResults()
}

// 테마 칩은 즉시 적용(데스크탑 존2). 모바일은 바텀시트 "적용"에서 한꺼번에 반영.
function onThemeChange(next) {
  form.contentTypeIds = next
  query.contentTypeIds = [...next]
  query.page = 0
  fetchResults()
}

function changePage(p) {
  query.page = Math.max(0, p)
  fetchResults()
  if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
}

function resetFilters() {
  form.keyword = ''
  form.sidoCode = undefined
  form.gugunCode = undefined
  form.contentTypeIds = []
  query.keyword = ''
  query.sidoCode = undefined
  query.gugunCode = undefined
  query.contentTypeIds = []
  query.page = 0
  fetchResults()
}

function goDetail(contentId) {
  if (contentId == null) return
  router.push(`/attractions/${contentId}`)
}

async function onAddPlaceClick(place) {
  if (!isAuthenticated()) {
    toast('여행지에 담으려면 로그인이 필요해요.')
    router.push({ name: 'login', query: { redirect: route.fullPath } })
    return
  }
  selectedPlace.value = place
  pickerOpen.value = true
  await loadTrips()
}

async function loadTrips() {
  tripsLoading.value = true
  try {
    const [mine, joined] = await Promise.all([getMyTrips('mine'), getMyTrips('joined')])
    const seen = new Set()
    trips.value = [...mine, ...joined].filter((trip) => {
      if (seen.has(trip.tripId)) return false
      seen.add(trip.tripId)
      return true
    })
  } catch {
    trips.value = []
    toast.error('여행 목록을 불러오지 못했어요.')
  } finally {
    tripsLoading.value = false
  }
}

async function addPlaceToTrip(tripCard) {
  if (adding.value || !selectedPlace.value) return
  adding.value = true
  try {
    const trip = await getTrip(tripCard.tripId)
    const data = trip.data && typeof trip.data === 'object' ? trip.data : { items: [] }
    const items = Array.isArray(data.items) ? data.items : []
    const sameDay = items.filter((item) => item.visitDate == null)
    const maxOrder = sameDay.reduce((max, item) => Math.max(max, item.order ?? 0), 0)
    const block = buildPlaceBlock(selectedPlace.value, { order: maxOrder + 1 })
    await updateTrip(tripCard.tripId, {
      title: trip.title,
      startDate: trip.start_date,
      endDate: trip.end_date,
      data: { ...data, items: [...items, block] },
    })
    pickerOpen.value = false
    toast.success('여행에 담았어요.')
    router.push(`/trips/${tripCard.tripId}`)
  } catch {
    toast.error('여행에 담지 못했어요. 잠시 후 다시 시도해 주세요.')
  } finally {
    adding.value = false
  }
}

function goCreateTrip() {
  pickerOpen.value = false
  router.push('/plans/new')
}

// ── 모바일 바텀시트 ──────────────────────────────────────────
const filterOpen = ref(false)
function applySheet() {
  filterOpen.value = false
  runSearch()
}
function resetSheet() {
  form.sidoCode = undefined
  form.gugunCode = undefined
  form.contentTypeIds = []
}

const isFiltered = computed(
  () =>
    !!query.keyword ||
    query.sidoCode != null ||
    query.gugunCode != null ||
    query.contentTypeIds.length > 0,
)

onMounted(async () => {
  await loadOptions()
  await fetchResults()
})
</script>

<template>
  <main class="mx-auto w-full max-w-[1280px] px-4 py-6 text-[var(--ink)] sm:px-6 lg:py-8">
    <header class="mb-5">
      <h1 class="text-xl font-extrabold tracking-tight sm:text-2xl">
        어디로 떠나볼까요? 가고 싶은 곳을 찾아보세요
      </h1>
    </header>

    <!-- 존1 검색바 (데스크탑) -->
    <div class="mb-3 hidden gap-2 sm:flex">
      <div class="relative flex-1">
        <Search class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--ink-3)]" />
        <Input
          v-model="form.keyword"
          placeholder="키워드로 검색해보세요"
          class="pl-9"
          @keyup.enter="runSearch"
        />
      </div>
      <Select
        v-model="form.sidoCode"
        :options="sidoOptions"
        placeholder="시/도"
        :disabled="optionsLoading"
        class="w-32"
      />
      <Select
        v-model="form.gugunCode"
        :options="gugunOptions"
        placeholder="구/군"
        :disabled="form.sidoCode == null || gugunsLoading"
        class="w-32"
      />
      <Button class="shrink-0" @click="runSearch">
        <Search class="size-4" /> 검색하기
      </Button>
    </div>

    <!-- 존1 검색바 (모바일): 키워드 + 필터 버튼 -->
    <div class="mb-3 flex gap-2 sm:hidden">
      <div class="relative flex-1">
        <Search class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--ink-3)]" />
        <Input
          v-model="form.keyword"
          placeholder="키워드로 검색"
          class="h-11 pl-9"
          @keyup.enter="runSearch"
        />
      </div>
      <Button variant="outline" class="h-11 shrink-0 px-4" @click="filterOpen = true">
        <SlidersHorizontal class="size-4" /> 필터
      </Button>
    </div>

    <!-- 존2 필터 칩(테마) — 데스크탑 -->
    <div class="mb-4 hidden sm:block">
      <FilterChips
        :model-value="form.contentTypeIds"
        :options="themeOptions"
        multiple
        tone="brand"
        @update:model-value="onThemeChange"
      />
    </div>

    <!-- 결과 수 -->
    <div class="mb-3 flex items-center justify-between">
      <p class="text-sm text-[var(--ink-3)]">
        <template v-if="loading">불러오는 중…</template>
        <template v-else>총 {{ totalElements }}곳</template>
      </p>
      <Button
        v-if="isFiltered && !loading"
        variant="ghost"
        size="sm"
        class="text-[var(--ink-2)]"
        @click="resetFilters"
      >
        필터 초기화
      </Button>
    </div>

    <!-- 존3 카드 그리드 -->
    <!-- 로딩: 스켈레톤 카드(레이아웃 유지) -->
    <div
      v-if="loading"
      class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      <Card v-for="n in 8" :key="n" class="gap-0 overflow-hidden py-0">
        <Skeleton class="aspect-[4/3] w-full rounded-none" />
        <div class="flex flex-col gap-2 p-4">
          <Skeleton class="h-4 w-3/4" />
          <Skeleton class="h-3 w-1/2" />
        </div>
      </Card>
    </div>

    <!-- 에러: 인라인 + 재시도 -->
    <div
      v-else-if="errored"
      class="flex flex-col items-center gap-3 rounded-[var(--radius-win)] border border-[var(--border)] bg-[var(--bg-subtle)] px-6 py-16 text-center"
    >
      <p class="text-sm text-[var(--ink-2)]">결과를 불러오지 못했어요. 잠시 후 다시 시도해 볼까요?</p>
      <Button variant="outline" size="sm" @click="fetchResults">다시 시도</Button>
    </div>

    <!-- 빈 상태 -->
    <EmptyState
      v-else-if="!results.length"
      icon="🧭"
      title="찾는 곳이 없네요"
      description="키워드나 지역을 바꿔볼까요?"
    >
      <Button variant="outline" size="sm" @click="resetFilters">필터 초기화</Button>
    </EmptyState>

    <!-- 기본: 카드 그리드 -->
    <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <Card
        v-for="place in results"
        :key="place.contentId ?? place.no"
        role="button"
        tabindex="0"
        class="group cursor-pointer gap-0 overflow-hidden py-0 transition-colors hover:border-[var(--border-strong)] hover:bg-[var(--hover)]"
        @click="goDetail(place.contentId)"
        @keyup.enter="goDetail(place.contentId)"
      >
        <!-- 썸네일(없으면 플레이스홀더) -->
        <img
          v-if="place.firstImage1"
          :src="place.firstImage1"
          :alt="place.title"
          loading="lazy"
          class="aspect-[4/3] w-full object-cover"
        />
        <div
          v-else
          class="grid aspect-[4/3] w-full place-items-center bg-[linear-gradient(135deg,var(--brand-soft),var(--bg-subtle))] text-3xl text-[var(--ink-3)]"
          aria-hidden="true"
        >
          📍
        </div>

        <div class="flex flex-col gap-1.5 p-4">
          <h3 class="truncate text-sm font-semibold text-[var(--ink)]">{{ place.title }}</h3>
          <div class="flex items-center gap-2">
            <span class="truncate text-xs text-[var(--ink-3)]">
              {{ [place.sidoName, place.gugunName].filter(Boolean).join(' ') }}
            </span>
            <Badge variant="secondary" class="shrink-0">{{ typeNameOf(place.contentTypeId) }}</Badge>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            class="mt-2 h-8 w-full"
            :disabled="adding && selectedPlace?.contentId === place.contentId"
            :aria-label="`${place.title} 여행지 담기`"
            @click.stop="onAddPlaceClick(place)"
          >
            <Plus class="size-3.5" />
            여행지 담기
          </Button>
        </div>
      </Card>
    </div>

    <!-- 존4 페이징 -->
    <Pagination
      v-if="!loading && !errored && results.length"
      class="mt-8"
      :page="query.page"
      :size="PAGE_SIZE"
      :total-elements="totalElements"
      @update:page="changePage"
    />

    <!-- 모바일 필터 바텀시트 -->
    <Sheet v-model:open="filterOpen">
      <SheetContent side="bottom" class="gap-5">
        <SheetHeader class="p-0 text-left">
          <SheetTitle>필터</SheetTitle>
          <SheetDescription>지역과 테마로 가고 싶은 곳을 좁혀보세요.</SheetDescription>
        </SheetHeader>

        <div class="flex flex-col gap-4 overflow-auto">
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-semibold text-[var(--ink-2)]">시/도</label>
            <Select
              v-model="form.sidoCode"
              :options="sidoOptions"
              placeholder="시/도"
              :disabled="optionsLoading"
              class="h-11"
            />
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-semibold text-[var(--ink-2)]">구/군</label>
            <Select
              v-model="form.gugunCode"
              :options="gugunOptions"
              placeholder="구/군"
              :disabled="form.sidoCode == null || gugunsLoading"
              class="h-11"
            />
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-semibold text-[var(--ink-2)]">테마</label>
            <FilterChips
              v-model="form.contentTypeIds"
              :options="themeOptions"
              multiple
              tone="brand"
            />
          </div>
        </div>

        <SheetFooter class="flex-row gap-2 p-0">
          <SheetClose as-child>
            <Button variant="outline" class="h-11 flex-1" @click="resetSheet">초기화</Button>
          </SheetClose>
          <Button class="h-11 flex-1" @click="applySheet">적용</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>

    <Sheet v-model:open="pickerOpen">
      <SheetContent side="bottom" class="gap-5 sm:max-w-xl sm:rounded-t-[var(--radius-win)]">
        <SheetHeader class="p-0 text-left">
          <SheetTitle>어느 여행에 담을까요?</SheetTitle>
          <SheetDescription>
            {{ selectedPlace?.title ?? '선택한 여행지' }}를 여행 블록으로 추가해요.
          </SheetDescription>
        </SheetHeader>
        <TripPickerList
          :trips="trips"
          :loading="tripsLoading"
          :adding="adding"
          @select="addPlaceToTrip"
          @create="goCreateTrip"
        />
      </SheetContent>
    </Sheet>
  </main>
</template>
