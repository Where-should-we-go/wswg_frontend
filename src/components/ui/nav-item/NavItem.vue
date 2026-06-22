<script setup>
// 사이드바 nav 행. 시안 §B `.nav-i` 재현.
// - icon: @lucide/vue 컴포넌트(검색/홈/지도 등) — emoji 보다 우선.
// - emoji: 페이지 트리용 이모지 아이콘(🏖️/📅 …). icon 미지정 시 사용.
// - label: 행 텍스트.
// - page: 본문색(--ink) 강조(여행 = 페이지). 기본 nav는 --ink-2.
// - sub: 하위 들여쓰기(일차).
// - active: 선택 상태(hover 배경 + 굵게). 시안 `.on`.
// - as: 렌더 태그/컴포넌트(예: RouterLink). 기본 div.
import { computed } from "vue";
import { cn } from "@/lib/utils";

const props = defineProps({
  icon: { type: [Object, Function], required: false, default: null },
  emoji: { type: String, required: false, default: "" },
  label: { type: String, required: false, default: "" },
  page: { type: Boolean, default: false },
  sub: { type: Boolean, default: false },
  active: { type: Boolean, default: false },
  as: { type: [String, Object], default: "div" },
  class: { type: null, required: false },
});

const rowClass = computed(() =>
  cn(
    "flex items-center gap-[9px] rounded-md px-2 py-[5px] text-[13.5px] cursor-pointer select-none transition-colors hover:bg-[var(--accent)]",
    props.page ? "text-[var(--ink)]" : "text-[var(--ink-2)]",
    props.sub && "pl-6 text-[13px]",
    props.active && "bg-[var(--accent)] font-semibold",
    props.class,
  ),
);
</script>

<template>
  <component :is="as" :class="rowClass">
    <component
      :is="icon"
      v-if="icon"
      class="size-[15px] shrink-0 text-[var(--ink-2)] opacity-80"
    />
    <span
      v-else-if="emoji"
      class="w-[17px] shrink-0 text-center text-[14px] leading-none"
      >{{ emoji }}</span
    >
    <span v-if="label" class="min-w-0 truncate">{{ label }}</span>
    <slot v-else />
  </component>
</template>
