<script setup>
// S4 "내 여행에 추가" — 대상 여행 선택 목록. Dialog(데스크탑)·Sheet(모바일) 공용.
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import EmptyState from '@/components/common/EmptyState.vue'
import { tripStatus } from '@/services/mypage'

defineProps({
  trips: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  adding: { type: Boolean, default: false },
})
const emit = defineEmits(['select', 'create'])
</script>

<template>
  <div v-if="loading" class="space-y-2 py-2">
    <Skeleton class="h-14 w-full" />
    <Skeleton class="h-14 w-full" />
  </div>

  <EmptyState
    v-else-if="!trips.length"
    icon="🧳"
    title="아직 만든 여행이 없어요"
    description="새 여행을 먼저 만들어 볼까요?"
    class="py-8"
  >
    <Button variant="outline" @click="emit('create')">새 여행 만들기</Button>
  </EmptyState>

  <ul v-else class="space-y-1.5">
    <li v-for="t in trips" :key="t.tripId">
      <button
        type="button"
        :disabled="adding"
        class="flex min-h-11 w-full items-center gap-3 rounded-[var(--radius)] border border-[var(--border)] p-3 text-left transition-colors hover:bg-[var(--hover)] disabled:opacity-60"
        @click="emit('select', t)"
      >
        <span class="min-w-0 flex-1">
          <span class="block truncate text-sm font-medium">{{ t.title }}</span>
          <span class="block text-xs text-[var(--ink-3)]">{{ t.startDate }} ~ {{ t.endDate }}</span>
        </span>
        <Badge variant="secondary">{{ t.status ?? tripStatus(t.startDate, t.endDate) }}</Badge>
      </button>
    </li>
  </ul>
</template>
