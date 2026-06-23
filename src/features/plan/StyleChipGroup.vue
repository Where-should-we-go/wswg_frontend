<script setup>
// S5 여행 스타일 다중 선택 칩 그리드.
// 선택 시 --selected-bg 틴트 + --brand 보더. v-model 은 선택된 라벨 문자열 배열.
const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  options: { type: Array, default: () => [] }, // [{ label, emoji }] 또는 [label]
})
const emits = defineEmits(['update:modelValue'])

function normalize(opt) {
  return typeof opt === 'string' ? { label: opt, emoji: '' } : opt
}

function isSelected(label) {
  return props.modelValue.includes(label)
}

function toggle(label) {
  const next = isSelected(label)
    ? props.modelValue.filter((l) => l !== label)
    : [...props.modelValue, label]
  emits('update:modelValue', next)
}
</script>

<template>
  <div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
    <button
      v-for="opt in options.map(normalize)"
      :key="opt.label"
      type="button"
      :aria-pressed="isSelected(opt.label)"
      class="flex h-11 items-center justify-center gap-1.5 rounded-[var(--radius)] border px-3 text-sm font-medium transition-colors"
      :class="
        isSelected(opt.label)
          ? 'border-[var(--brand)] bg-[var(--selected-bg)] text-[var(--brand-ink)]'
          : 'border-[var(--border)] bg-[var(--card)] text-[var(--ink-2)] hover:bg-[var(--hover)]'
      "
      @click="toggle(opt.label)"
    >
      <span v-if="opt.emoji" aria-hidden="true">{{ opt.emoji }}</span>
      <span>{{ opt.label }}</span>
    </button>
  </div>
</template>
