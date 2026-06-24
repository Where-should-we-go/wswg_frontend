<script setup>
// FilterChip — 선택 가능한 단일 칩 (시안 §C2 자동생성 모달 · §C4 검색 필터 `.chip`).
// 선택 시 채워지는 토글 칩. 색은 토큰만 사용(하드코딩 금지).
//   - on: 선택 상태.
//   - tone: "ink"(기본, 먹색) | "brand"(블루). 시안 `.chip.on` vs `.chip.on.blue`.
//   - size: "md"(기본) | "sm"(검색 구군 필터처럼 작은 칩).
import { computed } from "vue";
import { cn } from "@/lib/utils";

const props = defineProps({
  on: { type: Boolean, default: false },
  tone: { type: String, default: "ink", validator: (v) => ["ink", "brand"].includes(v) },
  size: { type: String, default: "md", validator: (v) => ["md", "sm"].includes(v) },
  class: { type: null, required: false },
});

const chipClass = computed(() =>
  cn(
    "inline-flex cursor-pointer items-center gap-1 rounded-[7px] border font-semibold transition-colors select-none",
    props.size === "sm" ? "px-[11px] py-[5px] text-[12px]" : "px-3 py-1.5 text-[12.5px]",
    props.on
      ? props.tone === "brand"
        ? "border-[color-mix(in_srgb,var(--primary)_35%,transparent)] bg-[var(--brand-soft)] text-[var(--brand-ink)]"
        : "border-[var(--foreground)] bg-[var(--foreground)] text-white"
      : "border-[var(--input)] bg-[var(--card)] text-[var(--ink-2)] hover:bg-[var(--accent)]",
    props.class,
  ),
);
</script>

<template>
  <button type="button" :class="chipClass" :aria-pressed="on">
    <slot />
  </button>
</template>
