<script setup>
// FilterChips — 칩 그룹 래퍼 + 옵션 배열로 칩 묶음을 렌더하는 편의 컴포넌트.
// options 가 주어지면 자동으로 FilterChip 목록을 그린다(시안 §C2/§C4 `.chips`).
//   - options: [{ value, label, tone? }]
//   - modelValue: 단일 선택이면 value, 다중이면 value[] (multiple=true).
//   - multiple: 다중 선택 토글.
// options 미지정 시 기본 슬롯으로 자유 배치(직접 FilterChip 나열).
import { computed } from "vue";
import { cn } from "@/lib/utils";
import FilterChip from "./FilterChip.vue";

const props = defineProps({
  options: { type: Array, default: () => [] },
  modelValue: { type: [String, Number, Array, null], default: null },
  multiple: { type: Boolean, default: false },
  tone: { type: String, default: "ink" },
  size: { type: String, default: "md" },
  class: { type: null, required: false },
});

const emit = defineEmits(["update:modelValue"]);

const selected = computed(() =>
  props.multiple ? new Set(props.modelValue || []) : new Set([props.modelValue]),
);

function toggle(value) {
  if (props.multiple) {
    const next = new Set(props.modelValue || []);
    if (next.has(value)) {
      next.delete(value);
    } else {
      next.add(value);
    }
    emit("update:modelValue", [...next]);
  } else {
    emit("update:modelValue", value);
  }
}
</script>

<template>
  <div :class="cn('flex flex-wrap gap-[7px]', props.class)">
    <template v-if="options.length">
      <FilterChip
        v-for="opt in options"
        :key="opt.value"
        :on="selected.has(opt.value)"
        :tone="opt.tone || tone"
        :size="size"
        @click="toggle(opt.value)"
      >
        {{ opt.label }}
      </FilterChip>
    </template>
    <slot v-else />
  </div>
</template>
