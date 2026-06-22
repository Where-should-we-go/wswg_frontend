<script setup>
// PlaceCard — 관광지/장소 카드 (시안 §C4 검색 결과 행).
// 썸네일(firstImage) + 제목 + 테마 BlockTag + 주소·휴무 메타 + 우측 액션 슬롯.
// 검색 결과·대표 추억 등에서 재사용. 색·모양은 토큰만(하드코딩 금지).
//   - thumbnail: 이미지 URL. 없으면 그라데이션 플레이스홀더.
//   - title / meta: 제목 · 보조 텍스트(주소 · ⭐ · 휴무 등).
//   - tagType / tagLabel: BlockTag 타입(테마)·라벨. 없으면 태그 생략.
// 우측 액션은 #action 슬롯(예: "＋ 담기" 버튼).
import { cn } from "@/lib/utils";
import { BlockTag } from "@/components/ui/block-tag";

const props = defineProps({
  thumbnail: { type: String, default: "" },
  title: { type: String, required: true },
  meta: { type: String, default: "" },
  tagType: { type: String, default: "" },
  tagLabel: { type: String, default: "" },
  class: { type: null, required: false },
});
</script>

<template>
  <div
    :class="
      cn(
        'flex items-center gap-[11px] rounded-lg border border-[var(--border)] bg-[var(--card)] p-[9px] transition-colors hover:bg-[var(--accent)]',
        props.class,
      )
    "
  >
    <img
      v-if="thumbnail"
      :src="thumbnail"
      alt=""
      class="size-[46px] shrink-0 rounded-[7px] object-cover"
    />
    <div
      v-else
      class="size-[46px] shrink-0 rounded-[7px] bg-[linear-gradient(135deg,#cfe0f5,#e7d9c6)]"
      aria-hidden="true"
    />

    <div class="min-w-0 flex-1">
      <div class="flex items-center gap-1.5 text-[13.5px] font-semibold text-[var(--ink)]">
        <span class="truncate">{{ title }}</span>
        <BlockTag v-if="tagType" :type="tagType" :label="tagLabel" hide-emoji class="shrink-0" />
      </div>
      <div v-if="meta" class="mt-0.5 text-[12px] text-[var(--ink-3)]">{{ meta }}</div>
    </div>

    <div class="shrink-0">
      <slot name="action" />
    </div>
  </div>
</template>
