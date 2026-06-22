<script setup>
// GroupMapView — 그룹 지도 화면 (시안 §C3). AppShell 안 /map(또는 /groups/:id/map) 본문.
// 좌측: CSS 그리드 지도(지역 색칠 + 대표 추억 핀). 우측: 대표 추억 카드 목록.
// "지역당 대표 추억 1개"(group_region_media). 색은 --collab-* 토큰만(하드코딩 금지).
// 얇게: MapRegionMemoCard(ui 조합) + 목 데이터. 핀/지역 좌표는 데모용 %.
import { REGION_MEDIA, MEDIA_EMOJI } from "@/features/map/data/mockGroupMap";
import MapRegionMemoCard from "./MapRegionMemoCard.vue";

// 색칠할 지역 박스만 추림(region 좌표가 있는 항목).
const regions = REGION_MEDIA.filter((m) => m.region);
</script>

<template>
  <div class="grid h-full min-h-[420px] grid-cols-[1fr_240px]">
    <!-- 좌측 지도 -->
    <div class="wswg-map relative">
      <!-- 지역 색칠 -->
      <div
        v-for="m in regions"
        :key="`region-${m.id}`"
        class="absolute rounded-[40%] opacity-[0.16]"
        :style="{
          left: m.region.left,
          top: m.region.top,
          width: m.region.width,
          height: m.region.height,
          background: `var(--${m.collab})`,
        }"
        aria-hidden="true"
      />
      <!-- 대표 추억 핀 -->
      <div
        v-for="m in REGION_MEDIA"
        :key="`pin-${m.id}`"
        class="absolute size-[30px] rotate-[-45deg] rounded-[50%_50%_50%_0] border-[2.5px] border-white shadow-[0_3px_8px_rgba(0,0,0,0.18)]"
        :style="{ left: m.pin.left, top: m.pin.top, background: `var(--${m.collab})` }"
        :title="`${m.regionLabel} · ${m.caption}`"
      >
        <span class="block rotate-45 text-center text-[13px] leading-[26px]">{{
          MEDIA_EMOJI[m.mediaType]
        }}</span>
      </div>
    </div>

    <!-- 우측 대표 추억 패널 -->
    <aside class="border-l border-[var(--border)] p-3.5">
      <div
        class="mb-2.5 text-[11px] font-bold tracking-[0.05em] text-[var(--ink-3)] uppercase"
      >
        대표 추억
      </div>
      <div class="flex flex-col gap-2.5">
        <MapRegionMemoCard v-for="m in REGION_MEDIA" :key="m.id" :item="m" />
      </div>
    </aside>
  </div>
</template>

<style scoped>
/* 시안 §C3 `.map` CSS 그리드 배경 재현. */
.wswg-map {
  background:
    linear-gradient(0deg, rgba(0, 0, 0, 0.02), rgba(0, 0, 0, 0.02)),
    repeating-linear-gradient(
      0deg,
      transparent 0 38px,
      rgba(44, 111, 227, 0.05) 38px 39px
    ),
    repeating-linear-gradient(
      90deg,
      transparent 0 38px,
      rgba(44, 111, 227, 0.05) 38px 39px
    ),
    var(--sunken);
}
</style>
