<script setup>
// RegionGallerySheet — 권역/핀 클릭 시 E4 지역 미디어 갤러리. 모바일은 풀스크린
// 바텀시트, 데스크탑은 우측 시트로 표현. 지역별 여행 기록 미디어를 감상한다.
// 카피는 해요체.
import { computed, ref } from 'vue'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import EmptyState from '@/components/common/EmptyState.vue'
import { MEDIA_BADGE } from '@/features/map/data/koreaSido'
import MediaLightbox from '@/features/trip/components/MediaLightbox.vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  regionLabel: { type: String, default: '' },
  // 그 지역의 미디어 집계(드릴다운 getGroupMap(groupId,{sidoCode,gugunCode})).
  items: { type: Array, default: () => [] },
  representativeId: { type: [String, Number], default: null },
})

const emit = defineEmits(['update:open', 'curate', 'remove'])

const title = computed(() => props.regionLabel || '이 지역')

// 미디어 클릭 → 라이트박스(사진 확대 / 영상·녹음 인라인 재생).
const selectedMedia = ref(null)
function openMedia(m) {
  if (!m.mediaUrl) return
  selectedMedia.value = { type: m.mediaType, url: m.mediaUrl, ...m }
}
</script>

<template>
  <Sheet :open="open" @update:open="emit('update:open', $event)">
    <SheetContent side="right" class="w-full max-w-md sm:max-w-md max-md:inset-0 max-md:h-full max-md:max-w-none max-md:rounded-none">
      <SheetHeader class="p-0">
        <SheetTitle class="text-[15px] font-bold">{{ title }} 갤러리</SheetTitle>
        <SheetDescription class="text-[12.5px] text-[var(--ink-3)]">
          함께 남긴 사진, 녹음, 영상을 지역별로 모아봤어요.
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
          class="cursor-pointer overflow-hidden rounded-[var(--radius)] border border-[var(--border)] transition hover:border-[var(--brand)]"
          role="button"
          :aria-label="`${MEDIA_BADGE[m.mediaType]?.label || '미디어'} 보기`"
          @click="openMedia(m)"
        >
          <div class="relative aspect-square">
            <img
              v-if="m.mediaType === 'PHOTO' && m.mediaUrl"
              :src="m.mediaUrl"
              alt=""
              class="h-full w-full object-cover"
            />
            <div
              v-else
              class="grid h-full w-full place-items-center bg-[linear-gradient(135deg,var(--brand-soft),var(--bg-subtle))] text-3xl"
              aria-hidden="true"
            >
              {{ MEDIA_BADGE[m.mediaType]?.emoji || '📍' }}
            </div>
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
            <Badge variant="outline" class="flex-none rounded-[var(--radius-sm)] px-1.5 py-0">
              {{ m.visitDate || m.tripTitle || '기록' }}
            </Badge>
          </figcaption>
        </figure>
      </div>
    </SheetContent>
  </Sheet>

  <!-- 미디어 확대/재생 라이트박스 -->
  <MediaLightbox
    :media="selectedMedia"
    :caption="selectedMedia?.caption ?? ''"
    @close="selectedMedia = null"
  />
</template>
