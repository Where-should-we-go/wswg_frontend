<script setup>
// SearchInput — 검색 input (시안 §C4 검색 박스 `.sunken` 칩).
// 좌측 돋보기 아이콘 + sunken 배경 입력. ui/input 의 v-model 패턴을 따른다.
// 색·모양은 토큰만 사용(하드코딩 금지).
import { Search } from "@lucide/vue";
import { useVModel } from "@vueuse/core";
import { cn } from "@/lib/utils";

const props = defineProps({
  modelValue: { type: String, default: "" },
  defaultValue: { type: String, default: "" },
  placeholder: { type: String, default: "" },
  class: { type: null, required: false },
});

const emit = defineEmits(["update:modelValue"]);

const model = useVModel(props, "modelValue", emit, {
  passive: true,
  defaultValue: props.defaultValue,
});
</script>

<template>
  <div
    :class="
      cn(
        'flex items-center gap-2 rounded-lg border border-[var(--input)] bg-[var(--sunken)] px-3 py-[9px] text-[13.5px] focus-within:border-[var(--ring)]',
        props.class,
      )
    "
  >
    <Search class="size-4 shrink-0 text-[var(--ink-3)]" aria-hidden="true" />
    <input
      v-model="model"
      type="search"
      :placeholder="placeholder"
      class="w-full min-w-0 bg-transparent text-[var(--ink)] outline-none placeholder:text-[var(--ink-3)]"
    />
  </div>
</template>
