<script setup>
// MemoryCard — 우측 대표 패널의 지역별 대표 추억 카드. 썸네일 + 지역 + 타입 배지
// (📷🎙️🎬 + 라벨) + "대표 변경". 클릭 시 지도 포커스(상위 위임).
// 색·모양은 토큰만(하드코딩 금지).
import { Badge } from '@/components/ui/badge'
import { MEDIA_BADGE } from '@/features/map/data/koreaSido'

defineProps({
  // getGroupMap 항목: { id, sidoCode, gugunCode, mediaType, mediaUrl, regionLabel, caption }
  item: { type: Object, required: true },
  active: { type: Boolean, default: false },
})

const emit = defineEmits(['focus', 'change'])
</script>

<template>
  <article
    class="flex cursor-pointer items-center gap-3 rounded-[var(--radius)] border p-2.5 transition-colors"
    :class="
      active
        ? 'border-[var(--brand)] bg-[var(--selected-bg)]'
        : 'border-[var(--border)] hover:bg-[var(--hover)]'
    "
    role="button"
    :aria-label="`${item.regionLabel} 대표 추억`"
    @click="emit('focus', item)"
  >
    <img
      v-if="item.mediaUrl"
      :src="item.mediaUrl"
      alt=""
      class="size-13 flex-none rounded-[var(--radius)] object-cover"
    />
    <div
      v-else
      class="size-13 flex-none rounded-[var(--radius)] bg-[linear-gradient(135deg,var(--brand-soft),var(--bg-subtle))]"
      aria-hidden="true"
    />
    <div class="min-w-0 flex-1">
      <div class="truncate text-[13.5px] font-bold text-[var(--ink)]">{{ item.regionLabel }}</div>
      <div class="mt-1 flex items-center gap-1.5 text-[11.5px] text-[var(--ink-3)]">
        <Badge variant="secondary" class="rounded-[var(--radius-sm)] px-1.5 py-0">
          {{ MEDIA_BADGE[item.mediaType]?.emoji }} {{ MEDIA_BADGE[item.mediaType]?.label }}
        </Badge>
        <span class="truncate">{{ item.caption }}</span>
      </div>
    </div>
    <button
      type="button"
      class="flex-none text-[11.5px] whitespace-nowrap text-[var(--link)] hover:underline"
      @click.stop="emit('change', item)"
    >
      변경
    </button>
  </article>
</template>
