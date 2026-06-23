<script setup>
// S7 마이페이지 — 앱 셸 안 본문 캔버스만 그린다(사이드바·토픽바는 셸 담당).
// 내가 만든 여행 / 참여중 여행을 탭으로 모아 보고, 상태(예정·진행중·완료)를
// 한눈에 파악하며, 새 여행을 시작하거나 정리(삭제)하는 화면이에요.
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { getMyTrips, tripStatus } from '@/services/mypage'
import { deleteTrip } from '@/services/trips'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import EmptyState from '@/components/common/EmptyState.vue'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import TripCard from '@/features/mypage/TripCard.vue'

const router = useRouter()

// 탭: 내 여행(mine) / 참여중(joined)
const tab = ref('mine')

// 탭별 데이터·상태(로딩/에러) — 탭 전환 시 각자 캐시.
const trips = ref({ mine: [], joined: [] })
const loading = ref({ mine: false, joined: false })
const error = ref({ mine: '', joined: '' })
const loaded = ref({ mine: false, joined: false })

const currentTrips = computed(() => trips.value[tab.value])
const currentLoading = computed(() => loading.value[tab.value])
const currentError = computed(() => error.value[tab.value])

const mineCount = computed(() => trips.value.mine.length)
const joinedCount = computed(() => trips.value.joined.length)

// 상태가 없으면 startDate~endDate 로 산출(CON-07).
function withStatus(trip) {
  return {
    ...trip,
    status: trip.status || tripStatus(trip.startDate, trip.endDate),
  }
}

async function loadTrips(scope) {
  loading.value[scope] = true
  error.value[scope] = ''
  try {
    const list = await getMyTrips(scope)
    trips.value[scope] = list.map(withStatus)
    loaded.value[scope] = true
  } catch {
    error.value[scope] = '여행을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.'
  } finally {
    loading.value[scope] = false
  }
}

// 탭이 바뀌면 아직 안 불러온 scope 만 로드.
watch(
  tab,
  (scope) => {
    if (!loaded.value[scope] && !loading.value[scope]) loadTrips(scope)
  },
  { immediate: false },
)

onMounted(() => loadTrips('mine'))

function goCreate() {
  router.push('/plans/new')
}

function openTrip(tripId) {
  router.push(`/trips/${tripId}`)
}

// ── 삭제(D6) ──────────────────────────────────────────────
const deleteTarget = ref(null)
const deleting = ref(false)
const deleteOpen = computed({
  get: () => deleteTarget.value !== null,
  set: (v) => {
    if (!v) deleteTarget.value = null
  },
})

function askDelete(trip) {
  deleteTarget.value = trip
}

async function confirmDelete() {
  const target = deleteTarget.value
  if (!target) return
  const scope = tab.value
  // 낙관적 제거 — 실패하면 복원.
  const snapshot = trips.value[scope]
  trips.value[scope] = snapshot.filter((t) => t.tripId !== target.tripId)
  deleting.value = true
  try {
    await deleteTrip(target.tripId)
    toast.success('여행을 정리했어요')
    deleteTarget.value = null
  } catch {
    trips.value[scope] = snapshot
    toast.error('삭제하지 못했어요. 잠시 후 다시 시도해 주세요.')
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <div class="mx-auto w-full max-w-[1280px] px-5 py-6 md:px-8">
    <!-- 페이지 헤더 -->
    <header class="mb-5 flex items-center justify-between gap-3">
      <h1 class="text-2xl font-extrabold text-[var(--ink)] md:text-[26px]">내 여행</h1>
      <!-- 데스크탑·태블릿: 헤더 우측 Primary -->
      <Button class="hidden md:inline-flex" @click="goCreate"> ＋ 새 여행 만들기 </Button>
    </header>

    <!-- 탭바 (모바일 sticky) -->
    <Tabs v-model="tab" class="gap-0">
      <TabsList
        class="sticky top-0 z-10 mb-5 h-auto w-full justify-start gap-5 rounded-none border-b border-[var(--border)] bg-[var(--paper)] p-0"
      >
        <TabsTrigger
          value="mine"
          class="flex-none rounded-none border-0 border-b-2 border-transparent px-0.5 py-2.5 text-sm font-semibold text-[var(--ink-3)] shadow-none data-[state=active]:border-[var(--brand)] data-[state=active]:bg-transparent data-[state=active]:text-[var(--ink)] data-[state=active]:shadow-none"
        >
          내 여행 <span class="font-medium text-[var(--ink-3)]">({{ mineCount }})</span>
        </TabsTrigger>
        <TabsTrigger
          value="joined"
          class="flex-none rounded-none border-0 border-b-2 border-transparent px-0.5 py-2.5 text-sm font-semibold text-[var(--ink-3)] shadow-none data-[state=active]:border-[var(--brand)] data-[state=active]:bg-transparent data-[state=active]:text-[var(--ink)] data-[state=active]:shadow-none"
        >
          참여중 여행 <span class="font-medium text-[var(--ink-3)]">({{ joinedCount }})</span>
        </TabsTrigger>
      </TabsList>
    </Tabs>

    <!-- 로딩: Skeleton 카드 -->
    <div
      v-if="currentLoading"
      class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      aria-busy="true"
    >
      <div
        v-for="n in 3"
        :key="n"
        class="overflow-hidden rounded-[10px] border border-[var(--border)] bg-[var(--paper)]"
      >
        <Skeleton class="h-24 w-full rounded-none" />
        <div class="space-y-2.5 p-3.5">
          <Skeleton class="h-4 w-2/3" />
          <Skeleton class="h-3 w-1/2" />
          <div class="flex items-center justify-between pt-1.5">
            <Skeleton class="h-5 w-16" />
            <Skeleton class="h-5 w-14" />
          </div>
        </div>
      </div>
    </div>

    <!-- 에러: 인라인 + 재시도 -->
    <div
      v-else-if="currentError"
      class="flex flex-col items-center gap-3 rounded-[10px] border border-[var(--border)] bg-[var(--bg-subtle)] px-6 py-12 text-center"
    >
      <p class="text-sm text-[var(--ink-2)]">{{ currentError }}</p>
      <Button variant="outline" size="sm" @click="loadTrips(tab)">다시 시도</Button>
    </div>

    <!-- 빈 상태 -->
    <EmptyState
      v-else-if="tab === 'mine' && !currentTrips.length"
      icon="🧳"
      title="아직 계획이 없어요!"
      description="첫 여행을 만들어볼까요?"
    >
      <Button @click="goCreate">＋ 새 여행 만들기</Button>
    </EmptyState>

    <EmptyState
      v-else-if="tab === 'joined' && !currentTrips.length"
      icon="👥"
      title="아직 함께하는 여행이 없어요"
      description="친구의 모임에 들어가보세요."
    >
      <Button variant="outline" @click="router.push('/groups')">모임 둘러보기</Button>
    </EmptyState>

    <!-- 기본: 카드 그리드 (데스크탑 3열) -->
    <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <TripCard
        v-for="trip in currentTrips"
        :key="trip.tripId"
        :trip="trip"
        @open="openTrip"
        @delete="askDelete"
      />
    </div>

    <!-- 모바일: 풀폭 새 여행 버튼 (FAB) -->
    <Button
      class="fixed right-4 bottom-4 z-20 h-11 shadow-[var(--shadow-pop)] md:hidden"
      @click="goCreate"
    >
      ＋ 새 여행
    </Button>

    <!-- 삭제 확인 다이얼로그 (D6) -->
    <Dialog v-model:open="deleteOpen">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>이 여행을 삭제할까요?</DialogTitle>
          <DialogDescription>
            일정은 사라지지만, 함께 남긴 추억 사진은 모임 지도에 그대로 있어요.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" :disabled="deleting" @click="deleteTarget = null">취소</Button>
          <Button variant="destructive" :disabled="deleting" @click="confirmDelete">
            {{ deleting ? '삭제 중…' : '삭제' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
