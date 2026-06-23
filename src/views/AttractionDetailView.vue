<script setup>
// S4 관광지 상세 `/attractions/:id` — 담당 에이전트 A4.
// 간소화 셸(GlobalHeader) + 히어로(16:9) + 데스크탑 2열(overview / sticky 담기·지도) + 지도 핀.
// 모바일: 1열 스택 + 하단 고정 "내 여행에 추가" → 대상 여행 선택 바텀시트.
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import GlobalHeader from '@/components/common/GlobalHeader.vue'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import EmptyState from '@/components/common/EmptyState.vue'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import TripPickerList from '@/features/attraction-detail/TripPickerList.vue'
import { getAttraction, getContentTypes } from '@/services/attractions'
import { getMyTrips } from '@/services/mypage'
import { getTrip, updateTrip } from '@/services/trips'
import { isAuthenticated } from '@/services/auth'

const route = useRoute()
const router = useRouter()

const attraction = ref(null)
const loading = ref(true)
const notFound = ref(false)
const contentTypes = ref([])

// "내 여행에 추가" 흐름 상태
const pickerOpen = ref(false)
const trips = ref([])
const tripsLoading = ref(false)
const adding = ref(false)

const contentId = computed(() => route.params.id)

// 반응형: 데스크탑(≥1024)은 Dialog, 모바일/태블릿(<1024)은 바텀시트로 대상 여행 선택.
// 디자인시스템 §7.2 데스크탑 경계 1024(lg).
const isDesktop = ref(true)
let mq
function syncViewport(e) {
  isDesktop.value = e.matches
}
onMounted(() => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    mq = window.matchMedia('(min-width: 1024px)')
    isDesktop.value = mq.matches
    mq.addEventListener('change', syncViewport)
  }
})
onUnmounted(() => {
  mq?.removeEventListener('change', syncViewport)
})

const categoryLabel = computed(() => {
  const id = attraction.value?.contentTypeId
  const found = contentTypes.value.find((t) => t.contentTypeId === id)
  return found?.name ?? '관광지'
})

const regionLabel = computed(() => {
  const a = attraction.value
  if (!a) return ''
  return [a.sidoName, a.gugunName].filter(Boolean).join(' ')
})

const fullAddress = computed(() => {
  const a = attraction.value
  if (!a) return ''
  return [a.addr1, a.addr2].filter(Boolean).join(' ')
})

const homepageHref = computed(() => {
  const hp = attraction.value?.homepage
  if (!hp) return ''
  return /^https?:\/\//.test(hp) ? hp : `https://${hp}`
})
const homepageLabel = computed(() => attraction.value?.homepage?.replace(/^https?:\/\//, '') ?? '')

const hasLatLng = computed(
  () => attraction.value?.mapY != null && attraction.value?.mapX != null,
)

async function load() {
  loading.value = true
  notFound.value = false
  attraction.value = null
  try {
    attraction.value = await getAttraction(contentId.value)
  } catch (err) {
    if (err?.status === 404) {
      notFound.value = true
    } else {
      toast.error('관광지를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.')
    }
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  try {
    contentTypes.value = await getContentTypes()
  } catch {
    contentTypes.value = []
  }
  await load()
})

// 같은 컴포넌트로 다른 id 진입 시 재조회
watch(contentId, () => load())

function goSearch() {
  router.push('/attractions')
}

// ── "내 여행에 추가" ─────────────────────────────────────────
async function onAddClick() {
  if (!isAuthenticated()) {
    toast('내 여행에 담으려면 로그인이 필요해요.')
    // 로그인 후 이 상세로 복귀하도록 의도 보존.
    router.push({ name: 'login', query: { redirect: route.fullPath } })
    return
  }
  pickerOpen.value = true
  await loadTrips()
}

async function loadTrips() {
  tripsLoading.value = true
  try {
    const [mine, joined] = await Promise.all([getMyTrips('mine'), getMyTrips('joined')])
    const seen = new Set()
    trips.value = [...mine, ...joined].filter((t) => {
      if (seen.has(t.tripId)) return false
      seen.add(t.tripId)
      return true
    })
  } catch {
    toast.error('여행 목록을 불러오지 못했어요.')
    trips.value = []
  } finally {
    tripsLoading.value = false
  }
}

async function addToTrip(tripCard) {
  if (adding.value) return
  adding.value = true
  const a = attraction.value
  try {
    const trip = await getTrip(tripCard.tripId)
    const items = trip.data?.items ?? []
    const block = {
      id: `b-${Date.now()}`,
      content_id: a.contentId,
      title: a.title,
      type: '관광',
      lat: a.mapY ?? null,
      lng: a.mapX ?? null,
      visitDate: null,
      time: null,
      durationMin: null,
      order: items.length + 1,
      media: [],
      properties: { region: regionLabel.value },
    }
    const nextData = { ...trip.data, items: [...items, block] }
    await updateTrip(tripCard.tripId, {
      title: trip.title,
      startDate: trip.start_date,
      endDate: trip.end_date,
      data: nextData,
    })
    pickerOpen.value = false
    toast.success('여행에 담았어요! 일정도 같이 다듬어볼까요?')
    router.push(`/trips/${tripCard.tripId}`)
  } catch {
    toast.error('여행에 담지 못했어요. 잠시 후 다시 시도해 주세요.')
  } finally {
    adding.value = false
  }
}
</script>

<template>
  <main class="flex min-h-screen flex-col bg-[var(--card)] text-[var(--ink)]">
    <GlobalHeader>
      <template #center>
        <nav v-if="attraction" class="truncate text-sm text-[var(--ink-2)]" aria-label="브레드크럼">
          <RouterLink to="/attractions" class="hover:text-[var(--ink)]">관광지</RouterLink>
          <span class="mx-1.5 text-[var(--ink-3)]">›</span>
          <span v-if="regionLabel">
            {{ regionLabel }}
            <span class="mx-1.5 text-[var(--ink-3)]">›</span>
          </span>
          <b class="font-semibold text-[var(--ink)]">{{ attraction.title }}</b>
        </nav>
      </template>
    </GlobalHeader>

    <!-- 404 빈 상태 -->
    <div v-if="notFound" class="flex flex-1 items-center justify-center">
      <EmptyState
        icon="🧭"
        title="찾는 관광지가 없어요. 다른 곳을 둘러볼까요?"
        description="주소가 바뀌었거나 사라진 곳일 수 있어요."
      >
        <Button @click="goSearch">검색으로 가기</Button>
      </EmptyState>
    </div>

    <!-- 로딩 Skeleton -->
    <div v-else-if="loading" class="flex-1">
      <Skeleton class="aspect-[16/9] w-full rounded-none" />
      <div class="mx-auto w-full max-w-5xl px-5 py-6 sm:px-8">
        <Skeleton class="h-8 w-2/3" />
        <Skeleton class="mt-3 h-4 w-1/2" />
        <div class="mt-8 grid gap-7 lg:grid-cols-[1.9fr_1fr]">
          <div class="space-y-3">
            <Skeleton class="h-4 w-full" />
            <Skeleton class="h-4 w-full" />
            <Skeleton class="h-4 w-5/6" />
            <Skeleton class="h-4 w-4/6" />
          </div>
          <Skeleton class="h-48 w-full rounded-[var(--radius-win)]" />
        </div>
      </div>
    </div>

    <!-- 기본 상태 -->
    <article v-else-if="attraction" class="flex-1">
      <!-- 히어로 이미지 (풀폭 16:9) -->
      <div class="aspect-[16/9] w-full bg-[var(--bg-subtle)]">
        <img
          v-if="attraction.firstImage1"
          :src="attraction.firstImage1"
          :alt="attraction.title"
          class="h-full w-full object-cover"
        />
        <div
          v-else
          class="flex h-full w-full flex-col items-center justify-center gap-2 text-[var(--ink-3)]"
        >
          <span class="text-4xl">🏞️</span>
          <span class="text-sm">아직 사진이 없어요.</span>
        </div>
      </div>

      <div class="mx-auto w-full max-w-5xl px-5 pb-24 pt-6 sm:px-8 lg:pb-12">
        <!-- 제목 · 카테고리 · 주소 -->
        <header>
          <div class="flex flex-wrap items-center gap-3">
            <h1 class="text-2xl font-extrabold sm:text-3xl">{{ attraction.title }}</h1>
            <Badge
              variant="outline"
              class="border-[var(--tag-blue-bg)] bg-[var(--tag-blue-bg)] text-[var(--tag-blue-fg)]"
            >
              {{ categoryLabel }}
            </Badge>
          </div>
          <p v-if="fullAddress" class="mt-1.5 text-sm text-[var(--ink-3)]">{{ fullAddress }}</p>
        </header>

        <!-- 2열 (데스크탑) / 스택 (모바일) -->
        <div class="mt-6 grid gap-7 lg:grid-cols-[1.9fr_1fr]">
          <!-- 좌: 연락 정보 + 소개 -->
          <div class="min-w-0">
            <dl v-if="attraction.tel || homepageHref">
              <div
                v-if="attraction.tel"
                class="flex gap-3 border-b border-[var(--border)] py-2 text-sm"
              >
                <dt class="w-16 shrink-0 text-[var(--ink-3)]">전화</dt>
                <dd>
                  <a :href="`tel:${attraction.tel}`" class="text-[var(--brand-ink)] hover:underline">
                    {{ attraction.tel }}
                  </a>
                </dd>
              </div>
              <div
                v-if="homepageHref"
                class="flex gap-3 border-b border-[var(--border)] py-2 text-sm"
              >
                <dt class="w-16 shrink-0 text-[var(--ink-3)]">홈페이지</dt>
                <dd class="min-w-0 truncate">
                  <a
                    :href="homepageHref"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-[var(--brand-ink)] hover:underline"
                  >
                    {{ homepageLabel }} ↗
                  </a>
                </dd>
              </div>
            </dl>

            <section v-if="attraction.overview">
              <h2 class="mb-2.5 mt-6 text-base font-bold">소개</h2>
              <p class="max-w-[60ch] text-sm leading-7 text-[var(--ink)]">
                {{ attraction.overview }}
              </p>
            </section>
          </div>

          <!-- 우: sticky 담기 + 지도 + 주소 (데스크탑) -->
          <aside class="hidden lg:block">
            <div
              class="sticky top-20 rounded-[var(--radius-win)] border border-[var(--border)] bg-[var(--card)] p-3.5"
            >
              <Button class="w-full" @click="onAddClick">＋ 내 여행에 추가</Button>
              <p class="mb-3 mt-2 text-center text-xs text-[var(--ink-3)]">담을 여행을 골라요</p>

              <div
                class="relative grid h-40 place-items-center overflow-hidden rounded-[var(--radius)] bg-[var(--bg-subtle)] text-3xl"
              >
                <template v-if="hasLatLng">
                  <span aria-hidden="true">📍</span>
                  <span class="sr-only">
                    위도 {{ attraction.mapY }}, 경도 {{ attraction.mapX }}
                  </span>
                </template>
                <span v-else class="text-sm text-[var(--ink-3)]">위치 정보가 없어요.</span>
              </div>

              <p
                v-if="fullAddress"
                class="mt-2.5 text-[13px] leading-relaxed text-[var(--ink-2)]"
              >
                {{ fullAddress }}
              </p>
            </div>
          </aside>
        </div>

        <!-- 지도 + 주소 (모바일: 본문 흐름에 포함) -->
        <section class="mt-6 lg:hidden">
          <div
            class="relative grid h-40 place-items-center overflow-hidden rounded-[var(--radius)] bg-[var(--bg-subtle)] text-3xl"
          >
            <template v-if="hasLatLng">
              <span aria-hidden="true">📍</span>
              <span class="sr-only">위도 {{ attraction.mapY }}, 경도 {{ attraction.mapX }}</span>
            </template>
            <span v-else class="text-sm text-[var(--ink-3)]">위치 정보가 없어요.</span>
          </div>
          <p v-if="fullAddress" class="mt-2.5 text-[13px] leading-relaxed text-[var(--ink-2)]">
            {{ fullAddress }}
          </p>
        </section>
      </div>

      <!-- 모바일 하단 고정 액션바 -->
      <div
        class="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--border)] bg-[var(--card)] p-3 lg:hidden"
      >
        <Button class="min-h-11 w-full" @click="onAddClick">＋ 내 여행에 추가</Button>
      </div>
    </article>

    <!-- 데스크탑: 대상 여행 선택 Dialog -->
    <Dialog v-if="isDesktop" v-model:open="pickerOpen">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>어느 여행에 담을까요?</DialogTitle>
          <DialogDescription>고른 여행 일정에 이 관광지를 블록으로 추가해요.</DialogDescription>
        </DialogHeader>
        <div class="max-h-[50vh] overflow-auto">
          <TripPickerList
            :trips="trips"
            :loading="tripsLoading"
            :adding="adding"
            @select="addToTrip"
            @create="router.push('/plans/new')"
          />
        </div>
      </DialogContent>
    </Dialog>

    <!-- 모바일: 대상 여행 선택 바텀시트 -->
    <Sheet v-else v-model:open="pickerOpen">
      <SheetContent side="bottom">
        <SheetHeader class="text-left">
          <SheetTitle>어느 여행에 담을까요?</SheetTitle>
          <SheetDescription>고른 여행 일정에 이 관광지를 블록으로 추가해요.</SheetDescription>
        </SheetHeader>
        <div class="max-h-[60vh] overflow-auto">
          <TripPickerList
            :trips="trips"
            :loading="tripsLoading"
            :adding="adding"
            @select="addToTrip"
            @create="router.push('/plans/new')"
          />
        </div>
      </SheetContent>
    </Sheet>
  </main>
</template>
