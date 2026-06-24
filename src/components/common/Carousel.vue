<script setup>
// 가로 캐러셀 (S1 인기 여행지·S8 대표 카드). 의존성 없이 scroll-snap + 화살표.
// 데스크탑: 좌우 화살표. 모바일: 스와이프(카드 peek). 슬롯에 카드들을 넣는다.
import { ref } from 'vue'
import { ChevronLeft, ChevronRight } from '@lucide/vue'
import { cn } from '@/lib/utils'

defineOptions({ name: 'BaseCarousel' })

const props = defineProps({
  arrows: { type: Boolean, default: true }, // 데스크탑 화살표 표시
  class: { type: null, required: false },
})

const track = ref(null)

function scrollByPage(dir) {
  const el = track.value
  if (!el) return
  el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: 'smooth' })
}
</script>

<template>
  <div class="relative">
    <button
      v-if="arrows"
      type="button"
      class="absolute left-0 top-1/2 z-10 hidden size-9 -translate-y-1/2 place-items-center rounded-full border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-pop)] md:grid"
      aria-label="이전"
      @click="scrollByPage(-1)"
    >
      <ChevronLeft class="size-4 text-[var(--ink-2)]" />
    </button>

    <div
      ref="track"
      data-slot="carousel"
      :class="
        cn(
          'flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
          props.class,
        )
      "
    >
      <slot />
    </div>

    <button
      v-if="arrows"
      type="button"
      class="absolute right-0 top-1/2 z-10 hidden size-9 -translate-y-1/2 place-items-center rounded-full border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-pop)] md:grid"
      aria-label="다음"
      @click="scrollByPage(1)"
    >
      <ChevronRight class="size-4 text-[var(--ink-2)]" />
    </button>
  </div>
</template>
