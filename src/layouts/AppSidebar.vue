<script setup>
// 앱 셸 좌측 사이드바(228px). 디자인시스템 §6.1.
// 워크스페이스(모임) + nav(검색/홈/모임) + 내 여행/참여 중 트리 + 새 여행/그룹.
// 데이터는 서비스 레이어(mock↔실제 자동 전환)에서 로드 — 화면 본문과 정합.
import { onMounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { Search, Home, Users, Plus } from '@lucide/vue'
import { NavItem } from '@/components/ui/nav-item'
import { TripCreateDialog } from '@/features/trip/components'
import GroupCreateDialog from '@/features/group/components/GroupCreateDialog.vue'
import { getGroups } from '@/services/groups'
import { getMyTrips } from '@/services/mypage'

const route = useRoute()

const createTripOpen = ref(false)
const createGroupOpen = ref(false)

// 워크스페이스(모임) — 첫 모임을 대표로 표시. 드롭다운 없음(클릭 시 모임 관리로).
const workspace = ref(null)
const myTrips = ref([])
const joinedTrips = ref([])

async function loadSidebar() {
  const [groups, mine, joined] = await Promise.all([
    getGroups().catch(() => []),
    getMyTrips('mine').catch(() => []),
    getMyTrips('joined').catch(() => []),
  ])
  workspace.value = groups[0] ?? null
  myTrips.value = mine
  joinedTrips.value = joined
}

onMounted(loadSidebar)

// 현재 보고 있는 여행인지(활성 표시).
function isActiveTrip(tripId) {
  return route.name === 'trip-editor' && String(route.params.id) === String(tripId)
}
</script>

<template>
  <aside
    class="w-[228px] shrink-0 border-r border-[var(--border)] bg-[var(--sidebar)] px-2 py-3 text-[13.5px] text-[var(--sidebar-foreground)]"
  >
    <!-- 워크스페이스(모임) — 드롭다운 없이 모임 관리로 가는 링크 -->
    <RouterLink
      to="/groups"
      class="mb-2 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-[var(--accent)]"
    >
      <span
        class="grid size-[22px] place-items-center rounded-md bg-[var(--brand)] text-[12px] font-extrabold text-white"
        >{{ workspace?.emoji ?? '어' }}</span
      >
      <span class="truncate text-[13.5px] font-bold text-[var(--ink)]">
        {{ workspace?.groupName ?? '내 워크스페이스' }}
      </span>
    </RouterLink>

    <!-- nav -->
    <NavItem :as="RouterLink" to="/attractions" :icon="Search" label="검색" />
    <NavItem :as="RouterLink" to="/mypage" :icon="Home" label="홈" />
    <NavItem :as="RouterLink" to="/groups" :icon="Users" label="모임" />

    <!-- 내 여행 -->
    <div class="px-2 pt-3.5 pb-[5px] text-[11px] font-bold tracking-[0.03em] text-[var(--ink-3)]">
      내 여행
    </div>
    <NavItem
      v-for="trip in myTrips"
      :key="trip.tripId"
      :as="RouterLink"
      :to="`/trips/${trip.tripId}`"
      emoji="🧳"
      :label="trip.title"
      page
      :active="isActiveTrip(trip.tripId)"
    />
    <p v-if="myTrips.length === 0" class="px-2 py-1 text-[12px] text-[var(--ink-3)]">
      아직 여행이 없어요
    </p>

    <!-- 참여 중 -->
    <div class="px-2 pt-3.5 pb-[5px] text-[11px] font-bold tracking-[0.03em] text-[var(--ink-3)]">
      참여 중
    </div>
    <NavItem
      v-for="trip in joinedTrips"
      :key="trip.tripId"
      :as="RouterLink"
      :to="`/trips/${trip.tripId}`"
      emoji="🤝"
      :label="trip.title"
      page
      :active="isActiveTrip(trip.tripId)"
    />
    <p v-if="joinedTrips.length === 0" class="px-2 py-1 text-[12px] text-[var(--ink-3)]">
      참여 중인 여행이 없어요
    </p>

    <!-- 새 여행 → 여행 생성(수동) 모달 -->
    <NavItem :icon="Plus" label="새 여행" class="mt-2.5" @click="createTripOpen = true" />

    <!-- 새 그룹 → 그룹 생성 모달 -->
    <NavItem :icon="Plus" label="새 그룹" class="mt-0.5" @click="createGroupOpen = true" />

    <TripCreateDialog v-model:open="createTripOpen" @created="loadSidebar" />
    <GroupCreateDialog v-model:open="createGroupOpen" @created="loadSidebar" />
  </aside>
</template>
