<script setup>
// 앱 셸 좌측 사이드바(228px). 디자인시스템 §6.1.
// 워크스페이스(모임) + nav(검색/홈/모임) + 내 여행/참여 중 트리 + 새 여행/모임.
// 데이터는 서비스 레이어(mock↔실제 자동 전환)에서 로드 — 화면 본문과 정합.
import { onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { Search, Home, Users, Plus } from '@lucide/vue'
import { NavItem } from '@/components/ui/nav-item'
import { getGroups } from '@/services/groups'
import { getMyTrips } from '@/services/mypage'

const route = useRoute()

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
// 다른 화면에서 여행/모임을 만들고 돌아오면 트리도 최신으로(가벼운 갱신).
watch(() => route.name, loadSidebar)

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

    <!-- 새 여행 만들기 → 자동 생성(S5). 마이페이지 버튼과 동일 동작 -->
    <NavItem
      :as="RouterLink"
      to="/plans/new"
      :icon="Plus"
      label="새 여행 만들기"
      class="mt-2.5"
    />

    <!-- 새 모임 → 모임 관리(S9)에서 생성 -->
    <NavItem :as="RouterLink" to="/groups" :icon="Plus" label="새 모임" class="mt-0.5" />
  </aside>
</template>
