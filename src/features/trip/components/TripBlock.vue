<script setup>
// TripBlock — data.items[] 한 블록의 레일형 표현 (시안 schedule-final.html `.block`).
// 레일 위 작은 점(타입색) + hover 드래그핸들 + 선두 이모지 + 오버라인 시간 +
// 제목(+ 협업 카렛) + 인라인 타입 태그(BlockTag) + region meta + 속성 pill(PropertyPill)
// + content_id null → "직접 추가" meta + 미디어 썸네일.
// ui/ 프리미티브 + blockMeta 헬퍼만 조합한다(인라인 컴포넌트·하드코딩 색 금지).
import { computed } from "vue";
import { GripVertical } from "@lucide/vue";
import { BlockTag } from "@/components/ui/block-tag";
import { PropertyPill } from "@/components/ui/property-pill";
import { CollabCaret } from "@/components/ui/collab-caret";
import {
  typeKeyOf,
  typeEmojiOf,
  railColorOf,
  propertyPills,
  regionOf,
  overlineOf,
} from "@/features/trip/lib/blockMeta";

const props = defineProps({
  // data.items[] 의 한 항목
  block: { type: Object, required: true },
  // 이 블록을 편집 중인 협업자 { name, color } | null
  editor: { type: Object, default: null },
});

const typeKey = computed(() => typeKeyOf(props.block.type));
const emoji = computed(() => typeEmojiOf(props.block.type));
const railColor = computed(() => railColorOf(props.block.type));
const pills = computed(() => propertyPills(props.block.properties));
const region = computed(() => regionOf(props.block.properties));
const media = computed(() => props.block.media ?? []);
const isManual = computed(
  () => props.block.content_id === null || props.block.content_id === undefined,
);
const editing = computed(() => !!props.editor);

// 오버라인(kicker): "10:00 · 1시간" | "10:00" | "시간 미정"(time 없음).
const overline = computed(() =>
  overlineOf({ time: props.block.time, durationMin: props.block.durationMin }),
);
</script>

<template>
  <div class="group relative flex gap-[11px] rounded-[7px] px-2 py-[9px] hover:bg-[var(--hover)]">
    <!-- 레일 점(타입색) — 시안 .block:before. 레일 위에 음수 left 로 얹는다. -->
    <span
      class="absolute top-4 size-[9px] rounded-full bg-[var(--background)] ring-[3px] ring-[var(--background)]"
      :style="{ left: '-26px', border: `2px solid ${railColor}` }"
      aria-hidden="true"
    />

    <!-- 드래그 핸들(hover 노출). TODO(backend): 드래그 정렬 시 order 재계산. -->
    <button
      type="button"
      class="absolute -left-0.5 top-[11px] flex cursor-grab items-center text-[var(--ink-3)] opacity-0 transition-opacity group-hover:opacity-100"
      aria-label="블록 이동"
      title="드래그해서 순서 바꾸기"
    >
      <GripVertical class="size-[15px]" />
    </button>

    <!-- 선두 이모지 .em -->
    <span class="w-[22px] shrink-0 text-center text-[18px] leading-[1.4]" aria-hidden="true">{{
      emoji
    }}</span>

    <!-- 본문 .main -->
    <div class="min-w-0 flex-1">
      <!-- 오버라인 시간 .kicker -->
      <div
        class="mb-[3px] text-[10.5px] font-bold tracking-[0.05em] tabular-nums uppercase text-[var(--ink-3)]"
      >
        {{ overline }}
      </div>

      <!-- 제목 (+ 편집 카렛) -->
      <div class="text-[15.5px] font-medium leading-[1.4]">
        <span>{{ block.title }}</span>
        <CollabCaret v-if="editing" :name="editor.name" :color="editor.color" />
      </div>

      <!-- l2: 타입 태그 · region meta · 속성 pill · 직접추가 -->
      <div class="mt-[5px] flex flex-wrap items-center gap-2">
        <BlockTag :type="typeKey" />
        <span v-if="region" class="text-[12.5px] text-[var(--ink-3)]">{{ region }}</span>
        <PropertyPill v-for="p in pills" :key="p.key">
          <span aria-hidden="true">{{ p.emoji }}</span>{{ p.text }}
        </PropertyPill>
        <span v-if="isManual" class="text-[12.5px] text-[var(--ink-3)]">직접 추가</span>
      </div>

      <!-- 미디어 썸네일 스트립 .thumbs -->
      <div v-if="media.length" class="mt-[9px] flex gap-1.5">
        <div
          v-for="(m, i) in media"
          :key="i"
          class="relative h-12 w-16 rounded-[7px] border border-[var(--border)] bg-[linear-gradient(135deg,#cfe0f5,#e7d9c6)]"
        >
          <span
            v-if="m.type === 'VIDEO'"
            class="absolute inset-0 grid place-items-center text-[11px] text-white"
            aria-label="동영상"
            >▶</span
          >
        </div>
      </div>
    </div>
  </div>
</template>
