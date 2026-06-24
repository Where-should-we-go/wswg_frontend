<script setup>
// RegionGallerySheet — 권역/핀 클릭 시 E4 지역 미디어 갤러리. 모바일은 풀스크린
// 바텀시트, 데스크탑은 우측 시트로 표현. 각 미디어에서 "대표로 지정"(E3) →
// 카드·핀 갱신. 현재 대표는 "대표 해제" 가능. 카피는 해요체.
import { computed } from 'vue'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import EmptyState from '@/components/common/EmptyState.vue'
import { MEDIA_BADGE } from '@/features/map/data/koreaSido'

const props = defineProps({
  open: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  regionLabel: { type: String, default: '' },
  // 그 지역의 미디어 집계(드릴다운 getGroupMap(groupId,{sidoCode,gugunCode})).
  items: { type: Array, default: () => [] },
  // 현재 대표 추억 id(있으면 해제 버튼 노출).
  representativeId: { type: Number, default: null },
})

const emit = defineEmits(['update:open', 'curate', 'remove'])

const title = computed(() => props.regionLabel || '이 지역')
</script>

<template>
  <Sheet :open="open" @update:open="emit('update:open', $event)">
    <SheetContent side="right" class="w-full max-w-md sm:max-w-md max-md:inset-0 max-md:h-full max-md:max-w-none max-md:rounded-none">
      <SheetHeader class="p-0">
        <SheetTitle class="text-[15px] font-bold">{{ title }} 갤러리</SheetTitle>
        <SheetDescription class="text-[12.5px] text-[var(--ink-3)]">
          함께 남긴 순간 중 하나를 이 지역 대표로 정할 수 있어요.
        </SheetDescription>
      </SheetHeader>

      <!-- 로딩 -->
      <div v-if="loading" class="grid grid-cols-2 gap-3">
        <Skeleton v-for="n in 4" :key="n" class="aspect-square w-full" />
      </div>

      <!-- 빈 -->
      <EmptyState
        v-else-if="!items.length"
        icon="🖼️"
        title="아직 이 지역의 추억이 없어요"
        description="여행에서 사진·음성·영상을 남기면 여기에 모여요."
      />

      <!-- 갤러리 -->
      <div v-else class="grid grid-cols-2 gap-3 overflow-auto">
        <figure
          v-for="m in items"
          :key="m.id"
          class="overflow-hidden rounded-[var(--radius)] border border-[var(--border)]"
        >
          <div class="relative aspect-square">
            <img v-if="m.mediaUrl" :src="m.mediaUrl" alt="" class="h-full w-full object-cover" />
            <div
              v-else
              class="h-full w-full bg-[linear-gradient(135deg,var(--brand-soft),var(--bg-subtle))]"
              aria-hidden="true"
            />
            <Badge
              variant="secondary"
              class="absolute top-1.5 left-1.5 rounded-[var(--radius-sm)] px-1.5 py-0"
            >
              {{ MEDIA_BADGE[m.mediaType]?.emoji }} {{ MEDIA_BADGE[m.mediaType]?.label }}
            </Badge>
            <Badge
              v-if="m.id === representativeId"
              class="absolute top-1.5 right-1.5 rounded-[var(--radius-sm)] px-1.5 py-0"
            >
              ⭐ 대표
            </Badge>
          </div>
          <figcaption class="flex items-center justify-between gap-2 p-2">
            <span class="truncate text-[12px] text-[var(--ink-2)]">{{ m.caption }}</span>
            <Button
              v-if="m.id === representativeId"
              variant="ghost"
              size="sm"
              class="h-7 flex-none px-2 text-[11.5px] text-[var(--danger)]"
              @click="emit('remove', m)"
            >
              대표 해제
            </Button>
            <Button
              v-else
              variant="outline"
              size="sm"
              class="h-7 flex-none px-2 text-[11.5px]"
              @click="emit('curate', m)"
            >
              대표로 지정
            </Button>
          </figcaption>
        </figure>
      </div>
    </SheetContent>
  </Sheet>
</template>
