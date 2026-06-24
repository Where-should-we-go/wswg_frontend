<script setup>
// TripGalleryView — 🖼️ 갤러리 뷰 (화면정의서 S6).
// 모든 블록 media[] 를 정방형 그리드로 모은다. 클릭 → 라이트박스.
// 호버 → "⭐ 대표로 선정" 버튼(대표 미디어 표시). 미디어 없으면 빈 상태.
import { ref, computed } from 'vue'
import { Star } from '@lucide/vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { typeEmojiOf } from '@/features/trip/lib/blockMeta'

const props = defineProps({
  // data.items[] (미디어 평탄화 소스)
  items: { type: Array, default: () => [] },
})

const emit = defineEmits(['set-representative'])

// 모든 media 를 { blockId, blockTitle, mediaIndex, media, emoji } 로 평탄화.
const photos = computed(() => {
  const out = []
  for (const b of props.items) {
    ;(b.media ?? []).forEach((m, mediaIndex) => {
      out.push({
        blockId: b.id,
        blockTitle: b.title,
        mediaIndex,
        media: m,
        emoji: typeEmojiOf(b.type),
        isVideo: m.type === 'VIDEO',
        isRep: !!m.representative,
      })
    })
  }
  return out
})

const lightbox = ref(null) // 라이트박스에 띄운 photo | null
function openLightbox(p) {
  lightbox.value = p
}
function closeLightbox() {
  lightbox.value = null
}

function selectRepresentative(p) {
  emit('set-representative', p.blockId, p.mediaIndex)
}
</script>

<template>
  <div>
    <EmptyState
      v-if="!photos.length"
      icon="🖼️"
      title="아직 사진이 없어요"
      description="블록에 사진이나 영상을 더하면 여기에 한눈에 모여요."
    />

    <div
      v-else
      class="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4"
    >
      <button
        v-for="p in photos"
        :key="`${p.blockId}-${p.mediaIndex}`"
        type="button"
        class="group/photo relative aspect-square overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-[linear-gradient(135deg,#cfe0f5,#e7d9c6)]"
        @click="openLightbox(p)"
      >
        <!-- 영상 표시 -->
        <img
          v-if="p.media.type === 'PHOTO' && p.media.url"
          :src="p.media.url"
          alt=""
          class="h-full w-full object-cover"
        />
        <span
          v-if="p.isVideo"
          class="absolute inset-0 grid place-items-center text-[22px] text-white"
          aria-hidden="true"
          >▶</span
        >
        <span
          v-else-if="p.media.type === 'AUDIO'"
          class="absolute inset-0 grid place-items-center text-[24px] text-white"
          aria-hidden="true"
          >🎙</span
        >
        <!-- 대표 배지 -->
        <span
          v-if="p.isRep"
          class="absolute left-1.5 top-1.5 inline-flex items-center gap-1 rounded-full bg-[var(--brand)] px-2 py-0.5 text-[10.5px] font-bold text-white"
        >
          <Star class="size-3 fill-current" /> 대표
        </span>
        <!-- 하단 캡션(블록 제목) -->
        <span
          class="absolute inset-x-0 bottom-0 truncate bg-[linear-gradient(to_top,rgba(0,0,0,0.45),transparent)] px-2 py-1 text-left text-[11px] font-medium text-white"
        >
          <span aria-hidden="true">{{ p.emoji }}</span> {{ p.blockTitle }}
        </span>
        <!-- 호버 대표 선정 -->
        <span
          class="absolute inset-0 hidden items-center justify-center bg-black/30 group-hover/photo:flex"
        >
          <span
            class="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-[12px] font-semibold text-[var(--ink)]"
            role="button"
            tabindex="0"
            @click.stop="selectRepresentative(p)"
            @keydown.enter.stop="selectRepresentative(p)"
          >
            <Star class="size-3.5" /> 대표로 선정
          </span>
        </span>
      </button>
    </div>

    <!-- 라이트박스 -->
    <div
      v-if="lightbox"
      class="fixed inset-0 z-50 grid place-items-center bg-black/70 p-6"
      role="dialog"
      aria-label="사진 보기"
      @click="closeLightbox"
    >
      <div
        class="relative max-h-[80vh] w-full max-w-[720px] overflow-hidden rounded-[var(--radius-win)] bg-[linear-gradient(135deg,#cfe0f5,#e7d9c6)]"
        @click.stop
      >
        <div class="grid aspect-video place-items-center">
          <video
            v-if="lightbox.isVideo && lightbox.media.url"
            :src="lightbox.media.url"
            controls
            class="h-full w-full bg-black object-contain"
          />
          <audio
            v-else-if="lightbox.media.type === 'AUDIO' && lightbox.media.url"
            :src="lightbox.media.url"
            controls
            class="w-4/5"
          />
          <img
            v-else-if="lightbox.media.type === 'PHOTO' && lightbox.media.url"
            :src="lightbox.media.url"
            alt=""
            class="h-full w-full object-contain"
          />
          <span v-else-if="lightbox.isVideo" class="text-[48px] text-white" aria-hidden="true"
            >▶</span
          >
          <span v-else class="text-[15px] font-medium text-white/90"
            >{{ lightbox.emoji }} {{ lightbox.blockTitle }}</span
          >
        </div>
        <button
          type="button"
          class="absolute right-3 top-3 grid size-8 place-items-center rounded-full bg-black/40 text-[16px] text-white"
          aria-label="닫기"
          @click="closeLightbox"
        >
          ✕
        </button>
        <button
          type="button"
          class="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[12.5px] font-semibold text-[var(--ink)]"
          @click="selectRepresentative(lightbox)"
        >
          <Star class="size-3.5" /> 대표로 선정
        </button>
      </div>
    </div>
  </div>
</template>
