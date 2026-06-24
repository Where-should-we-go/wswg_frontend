<script setup>
// S-ADM 관광지 데이터 테이블. no·썸네일·제목·시도/구군·타입(Badge)·content_id·출처·수정일·행 액션.
// 로딩이면 Skeleton 행, 비었으면 부모가 EmptyState 를 그려요(여긴 행만 담당).
import { computed } from 'vue'
import { Pencil, Trash2, ImageOff } from '@lucide/vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

const props = defineProps({
  rows: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  page: { type: Number, default: 0 },
  size: { type: Number, default: 12 },
})
const emit = defineEmits(['edit', 'delete'])

const skeletonRows = computed(() => Array.from({ length: Math.min(props.size, 8) }))

function rowNo(idx) {
  return props.page * props.size + idx + 1
}

function regionLabel(row) {
  return [row.sidoName, row.gugunName].filter(Boolean).join(' · ') || '—'
}

function rowKey(row, idx) {
  return row.no ?? row.contentId ?? idx
}
</script>

<template>
  <div class="overflow-x-auto rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)]">
    <table class="w-full min-w-[860px] border-collapse text-sm">
      <thead>
        <tr class="border-b border-[var(--border)] text-left text-xs font-medium text-[var(--ink-3)]">
          <th class="w-12 px-3 py-3">no</th>
          <th class="w-16 px-3 py-3">썸네일</th>
          <th class="px-3 py-3">제목</th>
          <th class="px-3 py-3">시도 / 구군</th>
          <th class="px-3 py-3">타입</th>
          <th class="px-3 py-3">content_id</th>
          <th class="px-3 py-3">출처</th>
          <th class="px-3 py-3">수정일</th>
          <th class="w-24 px-3 py-3 text-right">관리</th>
        </tr>
      </thead>

      <tbody v-if="loading">
        <tr
          v-for="(_, i) in skeletonRows"
          :key="`sk-${i}`"
          class="border-b border-[var(--border)] last:border-0"
        >
          <td class="px-3 py-3"><Skeleton class="h-4 w-6" /></td>
          <td class="px-3 py-3"><Skeleton class="size-10 rounded-md" /></td>
          <td class="px-3 py-3"><Skeleton class="h-4 w-40" /></td>
          <td class="px-3 py-3"><Skeleton class="h-4 w-24" /></td>
          <td class="px-3 py-3"><Skeleton class="h-5 w-14 rounded-full" /></td>
          <td class="px-3 py-3"><Skeleton class="h-4 w-16" /></td>
          <td class="px-3 py-3"><Skeleton class="h-4 w-12" /></td>
          <td class="px-3 py-3"><Skeleton class="h-4 w-20" /></td>
          <td class="px-3 py-3"><Skeleton class="ml-auto h-4 w-16" /></td>
        </tr>
      </tbody>

      <tbody v-else>
        <tr
          v-for="(row, i) in rows"
          :key="rowKey(row, i)"
          class="border-b border-[var(--border)] text-[var(--ink)] transition-colors last:border-0 hover:bg-[var(--hover)]"
        >
          <td class="px-3 py-3 text-[var(--ink-3)]">{{ rowNo(i) }}</td>
          <td class="px-3 py-3">
            <img
              v-if="row.firstImage1"
              :src="row.firstImage1"
              :alt="row.title"
              class="size-10 rounded-md object-cover"
              loading="lazy"
            />
            <span
              v-else
              class="grid size-10 place-items-center rounded-md bg-[var(--bg-subtle)] text-[var(--ink-3)]"
              aria-label="이미지 없음"
            >
              <ImageOff class="size-4" />
            </span>
          </td>
          <td class="px-3 py-3 font-medium">{{ row.title }}</td>
          <td class="px-3 py-3 text-[var(--ink-2)]">{{ regionLabel(row) }}</td>
          <td class="px-3 py-3">
            <Badge variant="secondary">{{ row.typeName || row.contentTypeId }}</Badge>
          </td>
          <td class="px-3 py-3 text-[var(--ink-2)]">
            {{ row.contentId ?? '—' }}
          </td>
          <td class="px-3 py-3">
            <Badge :variant="row.source === 'MANUAL' ? 'outline' : 'default'">
              {{ row.source === 'MANUAL' ? '직접' : 'TourAPI' }}
            </Badge>
          </td>
          <td class="px-3 py-3 text-[var(--ink-2)]">{{ row.updatedAt || '—' }}</td>
          <td class="px-3 py-3">
            <div class="flex items-center justify-end gap-1">
              <Button
                variant="ghost"
                size="icon-sm"
                :aria-label="`${row.title} 수정`"
                @click="emit('edit', row)"
              >
                <Pencil class="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                class="text-[var(--danger)] hover:text-[var(--danger)]"
                :aria-label="`${row.title} 삭제`"
                @click="emit('delete', row)"
              >
                <Trash2 class="size-4" />
              </Button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
