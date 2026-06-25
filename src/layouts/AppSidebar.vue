<script setup>
// 앱 셸 좌측 사이드바(228px). 디자인시스템 §6.1.
// 구조(B안): nav(검색/모임) → 현재 모임 드롭다운(전체 포함) → 내 여행/참여 중 → 새 여행/모임.
// 모임 드롭다운으로 보고 있는 모임을 바꾸면 아래 내 여행/참여 중이 그 모임 것만 보인다('전체'면 모두).
// 데이터는 서비스 레이어(mock↔실제 자동 전환)에서 로드 — 화면 본문과 정합.
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { Search, Users, Plus, ChevronDown, MoreHorizontal } from '@lucide/vue'
import { NavItem } from '@/components/ui/nav-item'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { getGroups } from '@/services/groups'
import { getMyTrips } from '@/services/mypage'
import { deleteTrip } from '@/services/trips'
import { getCurrentUser } from '@/services/auth'
import { displayTripTitle } from '@/stores/tripUiState'

const route = useRoute()
const router = useRouter()
const currentUserId = ref(null)

const ALL = '__all__' // 드롭다운 '전체 여행' 센티넬

const groups = ref([])
const myTrips = ref([])
const joinedTrips = ref([])

// 현재 보고 있는 모임. 셸↔attractions 간 같은 컴포넌트가 다시 마운트돼도 선택이 유지되도록 localStorage 동기화.
const selectedGroupId = ref(loadSelected())

function loadSelected() {
  if (typeof localStorage === 'undefined') return ALL
  return localStorage.getItem('wswg.sidebar.group') ?? ALL
}
watch(selectedGroupId, (v) => {
  try {
    localStorage.setItem('wswg.sidebar.group', v)
  } catch {
    /* 저장 불가 환경 무시 */
  }
})

const currentGroup = computed(() =>
  selectedGroupId.value === ALL
    ? null
    : (groups.value.find((g) => String(g.groupId) === String(selectedGroupId.value)) ?? null),
)

async function loadSidebar() {
  const [gs, mine, joined] = await Promise.all([
    getGroups().catch(() => []),
    getMyTrips('mine').catch(() => []),
    getMyTrips('joined').catch(() => []),
  ])
  groups.value = gs
  myTrips.value = mine
  joinedTrips.value = joined
  // 저장된 선택이 사라진 모임이면 전체로 복귀.
  if (
    selectedGroupId.value !== ALL &&
    !gs.some((g) => String(g.groupId) === String(selectedGroupId.value))
  ) {
    selectedGroupId.value = ALL
  }
}

onMounted(loadSidebar)
onMounted(() => {
  getCurrentUser()
    .then((me) => (currentUserId.value = me?.id ?? null))
    .catch(() => (currentUserId.value = null))
})
// 다른 화면에서 여행/모임을 만들고 돌아오면 트리도 최신으로(가벼운 갱신).
watch(() => route.name, loadSidebar)

// 모임 생성/이름변경/삭제 등으로 목록이 바뀌면(같은 화면 내에서도) 사이드바를 갱신한다.
onMounted(() => window.addEventListener('wswg:groups-changed', loadSidebar))
onUnmounted(() => window.removeEventListener('wswg:groups-changed', loadSidebar))

// 선택 모임으로 여행 필터.
// TODO(backend): 실데이터엔 트립 groupId가 없어 '전체'가 아니면 필터 결과가 비게 된다(mock 에서만 동작).
//   트립↔모임 연동되면 getMyTrips(scope, groupId) 형태의 서버 필터로 대체.
function filterByGroup(list) {
  if (selectedGroupId.value === ALL) return list
  return list.filter((t) => String(t.groupId) === String(selectedGroupId.value))
}
const visibleMyTrips = computed(() => filterByGroup(myTrips.value))
const visibleJoinedTrips = computed(() => filterByGroup(joinedTrips.value))

// 현재 보고 있는 여행인지(활성 표시).
function isActiveTrip(tripId) {
  return route.name === 'trip-editor' && String(route.params.id) === String(tripId)
}

// 삭제 권한(백엔드 validateWritable과 일치): 개인 여행은 본인(내 여행),
// 그룹 여행은 그 모임의 소유자만. getGroups()가 ownerId를 주므로 사이드바에서 판정 가능.
function canDeleteTrip(trip) {
  if (trip.groupId == null) return true
  const g = groups.value.find((x) => String(x.groupId) === String(trip.groupId))
  return !!g && currentUserId.value != null && g.ownerId === currentUserId.value
}

// ── 삭제 ──────────────────────────────────────────────
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
  deleting.value = true
  try {
    await deleteTrip(target.tripId)
    toast.success('여행을 삭제했어요')
    deleteTarget.value = null
    // 지금 열려 있는 여행을 지웠으면 마이페이지로 이동.
    if (route.name === 'trip-editor' && String(route.params.id) === String(target.tripId)) {
      router.push('/mypage')
    }
    await loadSidebar()
    window.dispatchEvent(new CustomEvent('wswg:groups-changed'))
  } catch {
    toast.error('삭제하지 못했어요. 잠시 후 다시 시도해 주세요.')
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <aside
    class="w-[228px] shrink-0 border-r border-[var(--border)] bg-[var(--sidebar)] px-2 py-3 text-[13.5px] text-[var(--sidebar-foreground)]"
  >
    <!-- nav (상단) -->
    <NavItem
      :as="RouterLink"
      to="/attractions"
      :icon="Search"
      label="검색"
      :active="route.name === 'attractions'"
    />
    <NavItem
      :as="RouterLink"
      to="/groups"
      :icon="Users"
      label="모임"
      :active="route.name === 'groups' || route.name === 'group-map'"
    />

    <!-- 현재 모임 드롭다운 (전체 포함) -->
    <DropdownMenu>
      <DropdownMenuTrigger
        class="mt-2.5 flex w-full items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--card)] px-2 py-1.5 text-left transition-colors hover:bg-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]/40"
        aria-label="모임 선택"
      >
        <span
          class="grid size-[22px] shrink-0 place-items-center rounded-md bg-[var(--brand)] text-[12px] font-extrabold text-white"
          >{{ currentGroup?.emoji ?? '🧭' }}</span
        >
        <span class="min-w-0 flex-1 truncate text-[13.5px] font-bold text-[var(--ink)]">
          {{ currentGroup?.groupName ?? '전체 여행' }}
        </span>
        <ChevronDown class="size-3.5 shrink-0 text-[var(--ink-3)]" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" class="w-[212px]">
        <DropdownMenuLabel>모임 선택</DropdownMenuLabel>
        <DropdownMenuRadioGroup v-model="selectedGroupId">
          <DropdownMenuRadioItem :value="ALL">전체 여행</DropdownMenuRadioItem>
          <DropdownMenuRadioItem v-for="g in groups" :key="g.groupId" :value="String(g.groupId)">
            <span class="mr-1">{{ g.emoji }}</span
            >{{ g.groupName }}
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>

    <!-- 내 여행 -->
    <div class="px-2 pt-3.5 pb-[5px] text-[11px] font-bold tracking-[0.03em] text-[var(--ink-3)]">
      내 여행
    </div>
    <div v-for="trip in visibleMyTrips" :key="trip.tripId" class="group/triprow relative">
      <NavItem
        :as="RouterLink"
        :to="`/trips/${trip.tripId}`"
        emoji="🧳"
        :label="displayTripTitle(trip.tripId, trip.title)"
        page
        :active="isActiveTrip(trip.tripId)"
        class="pr-7"
      />
      <DropdownMenu v-if="canDeleteTrip(trip)">
        <DropdownMenuTrigger
          class="absolute top-1/2 right-1 grid size-6 -translate-y-1/2 place-items-center rounded text-[var(--ink-3)] opacity-0 transition-opacity group-hover/triprow:opacity-100 hover:bg-[var(--accent)] focus-visible:opacity-100 data-[state=open]:opacity-100"
          aria-label="여행 메뉴 열기"
        >
          <MoreHorizontal class="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" class="w-32">
          <DropdownMenuItem variant="destructive" @select="askDelete(trip)">삭제</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
    <p v-if="visibleMyTrips.length === 0" class="px-2 py-1 text-[12px] text-[var(--ink-3)]">
      {{ selectedGroupId === ALL ? '아직 여행이 없어요' : '이 모임의 여행이 없어요' }}
    </p>

    <!-- 참여 중 -->
    <div class="px-2 pt-3.5 pb-[5px] text-[11px] font-bold tracking-[0.03em] text-[var(--ink-3)]">
      참여 중
    </div>
    <div v-for="trip in visibleJoinedTrips" :key="trip.tripId" class="group/triprow relative">
      <NavItem
        :as="RouterLink"
        :to="`/trips/${trip.tripId}`"
        emoji="🤝"
        :label="displayTripTitle(trip.tripId, trip.title)"
        page
        :active="isActiveTrip(trip.tripId)"
        class="pr-7"
      />
      <DropdownMenu v-if="canDeleteTrip(trip)">
        <DropdownMenuTrigger
          class="absolute top-1/2 right-1 grid size-6 -translate-y-1/2 place-items-center rounded text-[var(--ink-3)] opacity-0 transition-opacity group-hover/triprow:opacity-100 hover:bg-[var(--accent)] focus-visible:opacity-100 data-[state=open]:opacity-100"
          aria-label="여행 메뉴 열기"
        >
          <MoreHorizontal class="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" class="w-32">
          <DropdownMenuItem variant="destructive" @select="askDelete(trip)">삭제</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
    <p v-if="visibleJoinedTrips.length === 0" class="px-2 py-1 text-[12px] text-[var(--ink-3)]">
      {{
        selectedGroupId === ALL ? '참여 중인 여행이 없어요' : '이 모임에 참여 중인 여행이 없어요'
      }}
    </p>

    <!-- 새 여행 만들기 → 자동 생성(S5). 마이페이지 버튼과 동일 동작 -->
    <NavItem :as="RouterLink" to="/plans/new" :icon="Plus" label="새 여행 만들기" class="mt-2.5" />

    <!-- 새 모임 → 모임 관리(S9)로 가며 생성 모달 자동 오픈 -->
    <NavItem
      :as="RouterLink"
      :to="{ path: '/groups', query: { create: 'group' } }"
      :icon="Plus"
      label="새 모임"
      class="mt-0.5"
    />

    <!-- 여행 삭제 확인 -->
    <Dialog v-model:open="deleteOpen">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>이 여행을 삭제할까요?</DialogTitle>
          <DialogDescription>
            「{{ deleteTarget?.title }}」 일정이 사라져요. 이 작업은 되돌릴 수 없어요.
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
  </aside>
</template>
