<script setup>
// TripMoveStrip — type:"이동" 블록 (시안 schedule-final.html `.move`).
// 레일 위 점이 아니라 작은 회색 사각 마커 + 회색 한 줄("🚄 호텔 → 광안대교 · 택시 15분").
// 구간(daypart) 노드 분류에서 제외되고, 앞 블록 뒤 회색 스트립으로만 렌더한다(스키마 §3).
import { computed } from "vue";
import { typeEmojiOf, transportOf } from "@/features/trip/lib/blockMeta";

const props = defineProps({
  // data.items[] 의 type:"이동" 항목
  block: { type: Object, required: true },
});

const emoji = computed(() => typeEmojiOf(props.block.type));
const transport = computed(() => transportOf(props.block.properties));
// 본문: "제목 · 교통수단" (교통수단 없으면 제목만).
const text = computed(() =>
  transport.value ? `${props.block.title} · ${transport.value}` : props.block.title,
);
</script>

<template>
  <div
    class="relative -ml-[26px] flex items-center gap-[7px] px-2 py-[5px] text-[12.5px] text-[var(--ink-3)]"
  >
    <!-- 레일 위 작은 회색 사각 마커(시안 .move:before) -->
    <span
      class="absolute left-[3px] size-[7px] rounded-[2px] bg-[var(--tag-gray-bg)] ring-[3px] ring-[var(--background)]"
      aria-hidden="true"
    />
    <span aria-hidden="true">{{ emoji }}</span>
    <span class="truncate">{{ text }}</span>
  </div>
</template>
