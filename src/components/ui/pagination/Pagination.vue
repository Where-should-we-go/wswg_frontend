<script setup>
// 목록 페이징 (S3·S-ADM). 0-based page. totalElements/size 로 총 페이지 계산.
// v-model:page 로 현재 페이지(0-based) 양방향. 페이지 변경 시 emit.
import { computed } from 'vue'
import { ChevronLeft, ChevronRight } from '@lucide/vue'
import { cn } from '@/lib/utils'

const props = defineProps({
  page: { type: Number, default: 0 }, // 0-based
  size: { type: Number, default: 12 },
  totalElements: { type: Number, default: 0 },
  class: { type: null, required: false },
})
const emit = defineEmits(['update:page'])

const totalPages = computed(() => Math.max(1, Math.ceil(props.totalElements / props.size)))

// 최대 5개 페이지 번호 윈도우.
const pages = computed(() => {
  const total = totalPages.value
  const cur = props.page
  const start = Math.max(0, Math.min(cur - 2, total - 5))
  const end = Math.min(total, start + 5)
  const arr = []
  for (let i = start; i < end; i++) arr.push(i)
  return arr
})

function go(p) {
  if (p < 0 || p >= totalPages.value || p === props.page) return
  emit('update:page', p)
}
</script>

<template>
  <nav
    v-if="totalPages > 1"
    :class="cn('flex items-center justify-center gap-1', props.class)"
    aria-label="페이지네이션"
  >
    <button
      type="button"
      class="grid size-9 place-items-center rounded-md text-[var(--ink-2)] transition-colors hover:bg-[var(--hover)] disabled:opacity-40"
      :disabled="page === 0"
      aria-label="이전 페이지"
      @click="go(page - 1)"
    >
      <ChevronLeft class="size-4" />
    </button>

    <button
      v-for="p in pages"
      :key="p"
      type="button"
      class="grid size-9 place-items-center rounded-md text-sm transition-colors"
      :class="
        p === page
          ? 'bg-[var(--selected-bg)] font-semibold text-[var(--brand-ink)]'
          : 'text-[var(--ink-2)] hover:bg-[var(--hover)]'
      "
      :aria-current="p === page ? 'page' : undefined"
      @click="go(p)"
    >
      {{ p + 1 }}
    </button>

    <button
      type="button"
      class="grid size-9 place-items-center rounded-md text-[var(--ink-2)] transition-colors hover:bg-[var(--hover)] disabled:opacity-40"
      :disabled="page >= totalPages - 1"
      aria-label="다음 페이지"
      @click="go(page + 1)"
    >
      <ChevronRight class="size-4" />
    </button>
  </nav>
</template>
