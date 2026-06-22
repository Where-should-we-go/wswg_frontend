<script setup>
// PlaceSearchView — 관광지 검색 화면 (시안 §C4). AppShell 안 /places 라우트 본문.
// 검색 input + 시도/구군 필터 칩 + 관광지 결과 리스트(PlaceCard) + "＋ 담기".
// 얇게: ui/ 조각(SearchInput·FilterChips·PlaceCard·Button) 조립 + 목 데이터 필터링.
import { computed, ref } from "vue";
import { Plus } from "@lucide/vue";
import { SearchInput } from "@/components/ui/search-input";
import { FilterChips } from "@/components/ui/filter-chips";
import { PlaceCard } from "@/components/ui/place-card";
import { Button } from "@/components/ui/button";
import { SIDOS, GUGUNS, MOCK_ATTRACTIONS } from "@/features/place/data/mockPlaces";

const keyword = ref("");
const sido = ref(26); // 기본 부산(시안 §C4)
const gugun = ref(null); // null = 전체

// 선택 시도의 구군 옵션(맨 앞 "전체").
const gugunOptions = computed(() => [
  { value: null, label: "전체" },
  ...(GUGUNS[sido.value] || []),
]);

function onSido(next) {
  sido.value = next;
  gugun.value = null; // 시도 바뀌면 구군 초기화
}

const results = computed(() =>
  MOCK_ATTRACTIONS.filter((a) => {
    if (a.sido_code !== sido.value) return false;
    if (gugun.value != null && a.gugun_code !== gugun.value) return false;
    if (keyword.value.trim() && !a.title.includes(keyword.value.trim())) return false;
    return true;
  }),
);

function metaOf(place) {
  const parts = [place.addr];
  if (place.rating) parts.push(`⭐ ${place.rating.toFixed(1)}`);
  if (place.restDate) parts.push(place.restDate);
  return parts.join(" · ");
}

function addToTrip(place) {
  // TODO(backend): 현재 여행 data.items에 추가 (content_id 소프트참조 블록 생성 → 동기화).
  void place;
}
</script>

<template>
  <div class="mx-auto max-w-[760px] px-6 py-7">
    <header class="mb-5">
      <h1 class="text-[22px] font-extrabold tracking-tight text-[var(--ink)]">관광지 검색</h1>
      <p class="mt-1.5 text-[13.5px] text-[var(--ink-2)]">
        마음에 드는 곳을 찾아 여행 일정에 담아 보세요.
      </p>
    </header>

    <SearchInput
      v-model="keyword"
      placeholder="해운대, 감천문화마을…"
      class="mb-3"
    />

    <!-- 시도 필터 -->
    <FilterChips
      :options="SIDOS"
      :model-value="sido"
      class="mb-2"
      @update:model-value="onSido"
    />
    <!-- 구군 필터 -->
    <FilterChips
      v-model="gugun"
      :options="gugunOptions"
      size="sm"
      class="mb-3.5"
    />

    <!-- 결과 리스트 -->
    <div class="flex flex-col gap-2">
      <PlaceCard
        v-for="place in results"
        :key="place.content_id"
        :title="place.title"
        :meta="metaOf(place)"
        :thumbnail="place.firstImage"
        :tag-type="place.theme"
        :tag-label="place.themeLabel"
      >
        <template #action>
          <Button
            variant="outline"
            size="sm"
            class="h-auto px-[11px] py-1.5 text-[12.5px]"
            @click="addToTrip(place)"
          >
            <Plus class="size-3.5" /> 담기
          </Button>
        </template>
      </PlaceCard>

      <p
        v-if="!results.length"
        class="rounded-lg border border-[var(--border)] bg-[var(--sunken)] px-4 py-8 text-center text-[13px] text-[var(--ink-3)]"
      >
        조건에 맞는 관광지가 아직 없어요. 검색어나 지역을 바꿔 보세요.
      </p>
    </div>
  </div>
</template>
