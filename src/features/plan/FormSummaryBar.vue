<script setup>
// S5 폼 요약 한 줄 — "부산 · 2박3일 · 2명 · 자연·도보".
import { computed } from 'vue'

const props = defineProps({
  region: { type: String, default: '' }, // "부산" 또는 "부산 해운대구"
  nights: { type: Number, default: 0 }, // 박 수 (0이면 미표시)
  days: { type: Number, default: 0 }, // 일 수
  headcount: { type: Number, default: 0 },
  styles: { type: Array, default: () => [] },
})

const parts = computed(() => {
  const out = []
  if (props.region) out.push(props.region)
  if (props.days > 0) out.push(`${props.nights}박${props.days}일`)
  if (props.headcount > 0) out.push(`${props.headcount}명`)
  if (props.styles.length) out.push(props.styles.join('·'))
  return out
})
</script>

<template>
  <p v-if="parts.length" class="text-sm text-[var(--ink-2)]" data-testid="form-summary">
    {{ parts.join(' · ') }}
  </p>
  <p v-else class="text-sm text-[var(--ink-3)]" data-testid="form-summary">
    조건을 골라주시면 여기 요약해 드릴게요.
  </p>
</template>
