<script setup>
// 셀렉트 (S3·S5·S-ADM). 견고성·접근성·모바일 호환을 위해 네이티브 <select> 기반 래퍼.
// 사용:
//   <Select v-model="sidoCode" :options="sidos" placeholder="시/도" />
//   options: [{ value, label }]  (또는 기본 슬롯으로 <option> 직접)
import { useVModel } from '@vueuse/core'
import { ChevronDown } from '@lucide/vue'
import { cn } from '@/lib/utils'

const props = defineProps({
  modelValue: { type: [String, Number, null], required: false },
  options: { type: Array, default: () => [] },
  placeholder: { type: String, default: '선택' },
  disabled: { type: Boolean, default: false },
  class: { type: null, required: false },
})
const emits = defineEmits(['update:modelValue'])

const model = useVModel(props, 'modelValue', emits, { passive: true })
</script>

<template>
  <div class="relative">
    <select
      v-model="model"
      :disabled="disabled"
      data-slot="select"
      :class="
        cn(
          'h-9 w-full min-w-0 appearance-none rounded-md border border-[var(--input)] bg-[var(--card)] px-3 pr-8 text-sm text-[var(--ink)] shadow-xs outline-none transition-[color,box-shadow]',
          'focus-visible:border-[var(--ring)] focus-visible:ring-[3px] focus-visible:ring-[var(--ring)]/40',
          'disabled:pointer-events-none disabled:opacity-50',
          props.class,
        )
      "
    >
      <option :value="undefined" disabled hidden>{{ placeholder }}</option>
      <slot>
        <option v-for="opt in options" :key="opt.value" :value="opt.value">
          {{ opt.label }}
        </option>
      </slot>
    </select>
    <ChevronDown
      class="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-[var(--ink-3)]"
    />
  </div>
</template>
