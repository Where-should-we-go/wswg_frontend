<script setup>
// TripBlock — data.items[] 한 블록의 노션식 표현 (디자인시스템.md §6.2, 시안 §B `.block`).
// ui/ 프리미티브(BlockTag·PropertyPill·CollabCaret)를 조합한다.
//
// §6.2 매핑:
//   type        → BlockTag(타입 태그)
//   time        → 좌측 시간 라벨
//   properties  → PropertyPill 순회(💰/⭐/⏱…)
//   media[]     → 하단 썸네일 스트립(PHOTO/VIDEO)
//   content_id null → "TourAPI 없음 · 직접 추가" faint pill
//   편집 중(presence) → CollabCaret + 해당 색 옅은 배경
//
// hover 시 드래그 핸들 ⋮⋮ + ＋ 노출(시안). 실제 DnD/추가는 미구현.
import { computed } from "vue";
import { GripVertical, Plus } from "@lucide/vue";
import { BlockTag } from "@/components/ui/block-tag";
import { PropertyPill } from "@/components/ui/property-pill";
import { CollabCaret } from "@/components/ui/collab-caret";
import { typeKeyOf, propertyPills } from "@/features/trip/lib/blockMeta";

const props = defineProps({
  // data.items[] 의 한 항목
  block: { type: Object, required: true },
  // 이 블록을 편집 중인 협업자 { name, color } | null
  editor: { type: Object, default: null },
});

const typeKey = computed(() => typeKeyOf(props.block.type));
const pills = computed(() => propertyPills(props.block.properties));
const media = computed(() => props.block.media ?? []);
const isManual = computed(
  () => props.block.content_id === null || props.block.content_id === undefined,
);
const editing = computed(() => !!props.editor);

// 편집 중 블록의 옅은 배경/보더 색(협업자 색 기반).
const editingStyle = computed(() =>
  editing.value
    ? {
        backgroundColor: "color-mix(in srgb, " + props.editor.color + " 8%, transparent)",
        boxShadow: "inset 0 0 0 1.5px color-mix(in srgb, " + props.editor.color + " 45%, transparent)",
      }
    : null,
);
</script>

<template>
  <div
    class="group relative -ml-[26px] flex items-start gap-1.5 rounded-md px-2 py-[7px]"
    :class="editing ? '' : 'hover:bg-[var(--sunken)]'"
    :style="editingStyle"
  >
    <!-- 드래그 핸들 + 추가(hover 노출). TODO(backend): 드래그 정렬 시 order 재계산. -->
    <button
      type="button"
      class="flex shrink-0 cursor-grab items-center pt-1 text-[var(--ink-3)] opacity-0 transition-opacity group-hover:opacity-100"
      aria-label="블록 이동"
      title="드래그해서 순서 바꾸기"
    >
      <GripVertical class="size-4" />
    </button>
    <button
      type="button"
      class="flex shrink-0 items-center pt-1 text-[var(--ink-3)] opacity-0 transition-opacity hover:text-[var(--ink-2)] group-hover:opacity-100"
      aria-label="아래에 블록 추가"
      title="아래에 블록 추가"
    >
      <Plus class="size-4" />
    </button>

    <!-- 본문 -->
    <div class="min-w-0 flex-1">
      <!-- line1: 시간 · 타입 태그 · 제목 (+ 편집 카렛) -->
      <div class="flex flex-wrap items-center gap-2">
        <span
          v-if="block.time"
          class="min-w-[38px] text-[12px] font-semibold tabular-nums text-[var(--ink-3)]"
          >{{ block.time }}</span
        >
        <BlockTag :type="typeKey" />
        <span class="inline-flex items-start text-[14.5px] font-medium">
          <span>{{ block.title }}</span>
          <CollabCaret v-if="editing" :name="editor.name" :color="editor.color" />
        </span>
      </div>

      <!-- line2: 속성 pill 들 + 직접추가 표기 -->
      <div
        v-if="pills.length || isManual"
        class="mt-1 flex flex-wrap items-center gap-[7px]"
      >
        <PropertyPill v-for="p in pills" :key="p.key">
          <span aria-hidden="true">{{ p.emoji }}</span>{{ p.text }}
        </PropertyPill>
        <PropertyPill v-if="isManual" variant="faint">
          TourAPI 없음 · 직접 추가
        </PropertyPill>
      </div>

      <!-- 미디어 썸네일 스트립 -->
      <div v-if="media.length" class="mt-[7px] flex gap-1.5">
        <div
          v-for="(m, i) in media"
          :key="i"
          class="relative h-10 w-[54px] rounded-md bg-[linear-gradient(135deg,#cfe0f5,#e7d9c6)]"
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
