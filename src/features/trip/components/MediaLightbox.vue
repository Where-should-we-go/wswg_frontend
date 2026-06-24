<script setup>
// MediaLightbox — 사진/영상/오디오 확대 뷰. 갤러리·타임라인(블록 썸네일)에서 동일하게 재사용한다.
// media: { type:'PHOTO'|'VIDEO'|'AUDIO', url, ... } | null. null 이면 닫힌 상태.
import { computed } from 'vue'
import { Star, Trash2 } from '@lucide/vue'

const props = defineProps({
  media: { type: Object, default: null },
  // 하단 캡션(블록 제목 등) — 미디어 없을 때 placeholder 로도 사용.
  caption: { type: String, default: '' },
  // 갤러리에서만 노출하는 액션.
  canDelete: { type: Boolean, default: false },
  canSetRepresentative: { type: Boolean, default: false },
})
const emit = defineEmits(['close', 'delete', 'set-representative'])

const isVideo = computed(() => props.media?.type === 'VIDEO')
const isAudio = computed(() => props.media?.type === 'AUDIO')
</script>

<template>
  <div
    v-if="media"
    class="fixed inset-0 z-50 grid place-items-center bg-black/70 p-6"
    role="dialog"
    aria-label="사진 보기"
    @click="emit('close')"
  >
    <div
      class="relative max-h-[80vh] w-full max-w-[720px] overflow-hidden rounded-[var(--radius-win)] bg-[linear-gradient(135deg,#cfe0f5,#e7d9c6)]"
      @click.stop
    >
      <video
        v-if="isVideo && media.url"
        :src="media.url"
        controls
        autoplay
        class="max-h-[80vh] w-full bg-black"
      />
      <div v-else-if="isAudio && media.url" class="grid aspect-video place-items-center px-6">
        <audio :src="media.url" controls autoplay class="w-4/5" />
      </div>
      <img
        v-else-if="media.url"
        :src="media.url"
        alt=""
        class="max-h-[80vh] w-full bg-black object-contain"
      />
      <div v-else class="grid aspect-video place-items-center">
        <span class="text-[15px] font-medium text-white/90">{{ caption }}</span>
      </div>

      <button
        type="button"
        class="absolute right-3 top-3 grid size-8 place-items-center rounded-full bg-black/40 text-[16px] text-white"
        aria-label="닫기"
        @click="emit('close')"
      >
        ✕
      </button>
      <button
        v-if="canSetRepresentative"
        type="button"
        class="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[12.5px] font-semibold text-[var(--ink)]"
        @click="emit('set-representative')"
      >
        <Star class="size-3.5" /> 대표로 선정
      </button>
      <button
        v-if="canDelete"
        type="button"
        class="absolute right-3 bottom-3 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-[12.5px] font-semibold text-[var(--danger)] hover:bg-white"
        @click="emit('delete')"
      >
        <Trash2 class="size-3.5" /> 삭제
      </button>
    </div>
  </div>
</template>
