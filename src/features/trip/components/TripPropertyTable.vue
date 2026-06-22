<script setup>
// TripPropertyTable — 상단 속성 테이블 (디자인시스템.md §6.2 하단, 시안 §B `.props`).
// 노션 데이터베이스 프로퍼티 스타일: 날짜·지역·동행·스타일·예산.
// 동행은 member pill(AvatarStack 와 같은 --collab-* 색), 지역/스타일은 BlockTag.
import { computed } from "vue";
import { Calendar, MapPin, Users, Palette, Wallet } from "@lucide/vue";
import { BlockTag } from "@/components/ui/block-tag";

const props = defineProps({
  trip: { type: Object, required: true },
});

function fmt(d) {
  const dt = new Date(d + "T00:00:00");
  return `${dt.getFullYear()}. ${dt.getMonth() + 1}. ${dt.getDate()}`;
}
const dateRange = computed(() => `${fmt(props.trip.start_date)} → ${fmt(props.trip.end_date)}`);

// AvatarStack 의 --collab-* 라운드로빈과 일치시키기 위한 fallback.
const ROTATION = ["var(--collab-1)", "var(--collab-2)", "var(--collab-3)"];
function memberColor(m, i) {
  return m.color ?? ROTATION[i % ROTATION.length];
}
</script>

<template>
  <div class="mb-2 grid max-w-[560px] grid-cols-[max-content_1fr] gap-y-0.5">
    <!-- 날짜 -->
    <div class="flex items-center gap-2 py-[5px] pr-2.5 text-[13.5px] text-[var(--ink-2)]">
      <Calendar class="size-4 text-[var(--ink-3)]" /> 날짜
    </div>
    <div class="flex items-center rounded-sm px-2 py-[5px] text-[13.5px] hover:bg-[var(--accent)]">
      {{ dateRange }}
    </div>

    <!-- 지역 -->
    <div class="flex items-center gap-2 py-[5px] pr-2.5 text-[13.5px] text-[var(--ink-2)]">
      <MapPin class="size-4 text-[var(--ink-3)]" /> 지역
    </div>
    <div class="flex flex-wrap items-center gap-1.5 rounded-sm px-2 py-[5px] hover:bg-[var(--accent)]">
      <BlockTag type="tour" :label="trip.region.label" hide-emoji />
    </div>

    <!-- 동행 -->
    <div class="flex items-center gap-2 py-[5px] pr-2.5 text-[13.5px] text-[var(--ink-2)]">
      <Users class="size-4 text-[var(--ink-3)]" /> 동행
    </div>
    <div class="flex flex-wrap items-center gap-1.5 rounded-sm px-2 py-[5px] hover:bg-[var(--accent)]">
      <span
        v-for="(m, i) in trip.members"
        :key="m.id"
        class="inline-flex items-center gap-1.5 rounded-full bg-[var(--accent)] py-0.5 pr-2.5 pl-[3px] text-[12.5px] font-medium"
      >
        <span
          class="grid size-[18px] place-items-center rounded-full text-[10px] font-bold text-white"
          :style="{ backgroundColor: memberColor(m, i) }"
          >{{ m.initial }}</span
        >
        {{ m.name }}
      </span>
    </div>

    <!-- 스타일 -->
    <div class="flex items-center gap-2 py-[5px] pr-2.5 text-[13.5px] text-[var(--ink-2)]">
      <Palette class="size-4 text-[var(--ink-3)]" /> 스타일
    </div>
    <div class="flex flex-wrap items-center gap-1.5 rounded-sm px-2 py-[5px] hover:bg-[var(--accent)]">
      <BlockTag
        v-for="s in trip.styles"
        :key="s.label"
        :type="s.type"
        :label="`${s.emoji} ${s.label}`"
        hide-emoji
      />
    </div>

    <!-- 예산 -->
    <div class="flex items-center gap-2 py-[5px] pr-2.5 text-[13.5px] text-[var(--ink-2)]">
      <Wallet class="size-4 text-[var(--ink-3)]" /> 예산
    </div>
    <div class="flex items-center rounded-sm px-2 py-[5px] text-[13.5px] text-[var(--ink-2)] hover:bg-[var(--accent)]">
      {{ trip.budgetLabel }}
    </div>
  </div>
</template>
