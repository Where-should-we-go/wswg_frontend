<script setup>
// 앱 셸 좌측 사이드바(228px). 시안 §B 사이드바 1:1 재현.
// 워크스페이스 스위처 + nav(검색/홈/그룹 지도) + 페이지 트리 + 참여 중 + 새 여행.
// 데이터(워크스페이스명/페이지 트리)는 props로 주입. 기본값은 목 데이터(시안 값).
// TODO(backend): workspace/pages/joined 는 추후 워크스페이스·trips API 응답으로 대체.
import { ref } from "vue";
import { RouterLink } from "vue-router";
import { Search, Home, Map, Plus, ChevronDown } from "@lucide/vue";
import { NavItem } from "@/components/ui/nav-item";
import { TripCreateDialog } from "@/features/trip/components";
import GroupCreateDialog from "@/features/group/components/GroupCreateDialog.vue";

// 여행 생성(수동) 모달 — "＋ 새 여행"에서 연다.
const createTripOpen = ref(false);
// 그룹 생성 모달 — "＋ 새 그룹"에서 연다.
const createGroupOpen = ref(false);

defineProps({
  // 워크스페이스: { name, mark } — mark 는 스위처 좌측 마크 글자.
  workspace: {
    type: Object,
    default: () => ({ name: "부산크루", mark: "W" }),
  },
  // "내 여행" 트리: [{ id, label, emoji, active?, days: [{ id, label, emoji, active? }] }]
  pages: {
    type: Array,
    default: () => [
      {
        id: "busan",
        label: "부산 2박 3일",
        emoji: "🏖️",
        active: true,
        to: "/trips/10",
        days: [
          { id: "d1", label: "1일차", emoji: "📅", active: true },
          { id: "d2", label: "2일차", emoji: "📅" },
          { id: "d3", label: "3일차", emoji: "📅" },
        ],
      },
      { id: "jeju", label: "제주 한 바퀴", emoji: "🌴" },
      { id: "yeosu", label: "여수 밤바다", emoji: "🌊" },
    ],
  },
  // "참여 중" 목록: [{ id, label, emoji }]
  joined: {
    type: Array,
    default: () => [{ id: "gangwon", label: "강원 겨울여행", emoji: "⛰️" }],
  },
});
</script>

<template>
  <aside
    class="w-[228px] shrink-0 border-r border-[var(--border)] bg-[var(--sidebar)] px-2 py-3 text-[13.5px] text-[var(--sidebar-foreground)]"
  >
    <!-- 워크스페이스 스위처 -->
    <button
      type="button"
      class="mb-2 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-[var(--accent)]"
    >
      <span
        class="grid size-[22px] place-items-center rounded-md bg-[linear-gradient(135deg,#3D7BEA,#2C6FE3)] text-[12px] font-extrabold text-white"
        >{{ workspace.mark }}</span
      >
      <span class="text-[13.5px] font-bold text-[var(--ink)]">{{
        workspace.name
      }}</span>
      <ChevronDown class="ml-auto size-3 text-[var(--ink-3)]" />
    </button>

    <!-- nav -->
    <NavItem :as="RouterLink" to="/attractions" :icon="Search" label="검색" />
    <NavItem :as="RouterLink" to="/mypage" :icon="Home" label="홈" />
    <NavItem :as="RouterLink" to="/groups" :icon="Map" label="모임" />

    <!-- 내 여행 -->
    <div
      class="px-2 pt-3.5 pb-[5px] text-[11px] font-bold tracking-[0.03em] text-[var(--ink-3)]"
    >
      내 여행
    </div>
    <template v-for="page in pages" :key="page.id">
      <NavItem
        :as="page.to ? RouterLink : 'div'"
        :to="page.to"
        :emoji="page.emoji"
        :label="page.label"
        page
        :active="page.active"
      />
      <NavItem
        v-for="day in page.days || []"
        :key="day.id"
        :emoji="day.emoji"
        :label="day.label"
        sub
        :active="day.active"
      />
    </template>

    <!-- 참여 중 -->
    <div
      class="px-2 pt-3.5 pb-[5px] text-[11px] font-bold tracking-[0.03em] text-[var(--ink-3)]"
    >
      참여 중
    </div>
    <NavItem
      v-for="trip in joined"
      :key="trip.id"
      :emoji="trip.emoji"
      :label="trip.label"
      page
    />

    <!-- 새 여행 → 여행 생성(수동) 모달 -->
    <NavItem
      :icon="Plus"
      label="새 여행"
      class="mt-2.5"
      @click="createTripOpen = true"
    />

    <!-- 새 그룹 → 그룹 생성 모달 -->
    <NavItem
      :icon="Plus"
      label="새 그룹"
      class="mt-0.5"
      @click="createGroupOpen = true"
    />

    <TripCreateDialog v-model:open="createTripOpen" />
    <GroupCreateDialog v-model:open="createGroupOpen" />
  </aside>
</template>
