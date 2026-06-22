<script setup>
// MapRegionMemoCard — 그룹 지도 우측 "대표 추억" 카드 (시안 §C3 `.memo-card`).
// 썸네일 헤더 + 지역 라벨 + 미디어 캡션. group_region_media 한 건 표현(도메인 전용).
// 색·모양은 토큰만 사용(하드코딩 금지).
import { MEDIA_EMOJI } from "@/features/map/data/mockGroupMap";

defineProps({
  // group_region_media 항목: { regionLabel, mediaType, caption, thumbnail }
  item: { type: Object, required: true },
});
</script>

<template>
  <article class="overflow-hidden rounded-[9px] border border-[var(--border)] bg-[var(--card)]">
    <img
      v-if="item.thumbnail"
      :src="item.thumbnail"
      alt=""
      class="h-16 w-full object-cover"
    />
    <div
      v-else
      class="h-16 w-full bg-[linear-gradient(135deg,#cfe0f5,#e7d9c6)]"
      aria-hidden="true"
    />
    <div class="px-2.5 py-[7px]">
      <div class="text-[12.5px] font-bold text-[var(--ink)]">{{ item.regionLabel }}</div>
      <div class="mt-px text-[11px] text-[var(--ink-3)]">
        {{ MEDIA_EMOJI[item.mediaType] }} {{ item.caption }}
      </div>
    </div>
  </article>
</template>
