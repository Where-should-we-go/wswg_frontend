<script setup>
// S7 여행 카드 — 썸네일·제목·기간·동행(AvatarStack)·상태태그(Badge) + ⋮ 메뉴.
// 카드 클릭 → 상세(S6). ⋮ → 삭제. 카피·색은 토큰만.
import { computed } from 'vue'
import { Badge } from '@/components/ui/badge'
import { AvatarStack } from '@/components/ui/avatar-stack'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const props = defineProps({
  trip: { type: Object, required: true },
})

const emit = defineEmits(['open', 'delete'])

// 상태태그 ↔ 토큰(예정 blue · 진행중 yellow · 완료 green).
const STATUS_STYLE = {
  예정: 'bg-[var(--tag-blue-bg)] text-[var(--tag-blue-fg)]',
  진행중: 'bg-[var(--tag-yellow-bg)] text-[var(--tag-yellow-fg)]',
  완료: 'bg-[var(--tag-green-bg)] text-[var(--tag-green-fg)]',
}
const statusClass = computed(() => STATUS_STYLE[props.trip.status] ?? STATUS_STYLE['예정'])

// 기간 표기 "7/1 – 7/3" (월/일).
function md(iso) {
  if (!iso) return ''
  const [, m, d] = iso.split('-')
  return `${Number(m)}/${Number(d)}`
}
const dateRange = computed(() => `${md(props.trip.startDate)} – ${md(props.trip.endDate)}`)

// 동행 아바타(인원 수만큼 placeholder, 최대 4 + 나머지).
const members = computed(() => {
  const count = props.trip.memberCount ?? 0
  const max = 3
  const shown = Array.from({ length: Math.min(count, max) }, (_, i) => ({ name: `동행 ${i + 1}` }))
  if (count > max) shown.push({ name: `+${count - max}`, initial: `+${count - max}`, color: 'var(--ink-3)' })
  return shown
})
</script>

<template>
  <article
    class="group cursor-pointer overflow-hidden rounded-[10px] border border-[var(--border)] bg-[var(--paper)] transition-colors hover:border-[var(--border-strong)]"
    @click="emit('open', trip.tripId)"
  >
    <!-- 커버 -->
    <div
      class="relative h-24 bg-[linear-gradient(135deg,var(--brand-soft),var(--bg-subtle))] bg-cover bg-center"
      :style="trip.thumbnailUrl ? { backgroundImage: `url(${trip.thumbnailUrl})` } : undefined"
    >
      <DropdownMenu>
        <DropdownMenuTrigger
          class="absolute top-2 right-2 grid h-7 w-7 place-items-center rounded-md bg-[var(--paper)]/85 text-[var(--ink-2)] backdrop-blur transition-colors hover:bg-[var(--paper)]"
          aria-label="여행 메뉴 열기"
          @click.stop
        >
          ⋯
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" @click.stop>
          <DropdownMenuItem class="text-[var(--danger)]" @select="emit('delete', trip)">
            삭제
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>

    <!-- 본문 -->
    <div class="p-3 pb-3.5">
      <h3 class="truncate text-[15px] font-bold text-[var(--ink)]">{{ trip.title }}</h3>
      <p class="mt-0.5 text-xs text-[var(--ink-3)]">{{ dateRange }} · {{ trip.memberCount }}명</p>
      <div class="mt-3 flex items-center justify-between">
        <Badge
          :class="['gap-1 rounded-[5px] px-2 py-0.5 text-[11.5px] font-semibold', statusClass]"
        >
          <span class="h-[5px] w-[5px] rounded-full bg-current"></span>
          {{ trip.status }}
        </Badge>
        <AvatarStack v-if="members.length" :members="members" :size="22" />
      </div>
    </div>
  </article>
</template>
