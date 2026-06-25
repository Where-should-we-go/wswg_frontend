<script setup>
// S1 인기 여행지 섹션 — 타이틀 + 무한 가로 마퀴(자동 흐름).
// 데이터: 관광지 검색(이미지 있는 것만)에서 랜덤 10개를 뽑아 카드로 흘려보낸다.
// 상태: 로딩(Card Skeleton) · 에러(인라인 "다시 불러오기") · 빈(섹션 숨김 — 부모가 v-if).
// 전체 화면을 차단하지 않도록 에러도 이 섹션 안에서만 인라인 처리.
import { computed, onMounted, ref } from 'vue'
import { searchAttractions } from '@/services/attractions'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import PopularCard from './PopularCard.vue'

const PICK = 10 // 화면에 흘려보낼 카드 수

const items = ref([])
const loading = ref(true)
const errored = ref(false)

const emit = defineEmits(['empty'])

// 마퀴 이음새가 매끄럽도록 같은 목록을 두 번 이어 붙인다(translateX -50% 루프).
const loopItems = computed(() => [...items.value, ...items.value])

// Fisher–Yates 셔플 후 앞에서 n개.
function pickRandom(arr, n) {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy.slice(0, n)
}

async function load() {
  loading.value = true
  errored.value = false
  try {
    // 이미지가 있는 관광지 풀을 넉넉히 받아 그 중 랜덤으로 고른다.
    const res = await searchAttractions({ hasImage: true, size: 100 })
    const pool = Array.isArray(res?.content) ? res.content : []
    items.value = pickRandom(pool, PICK).map((a) => ({
      contentId: a.contentId,
      name: a.title,
      regionName: [a.sidoName, a.gugunName].filter(Boolean).join(' '),
      thumbnailUrl: a.firstImage1 || a.firstImage2 || '',
    }))
    if (items.value.length === 0) emit('empty')
  } catch {
    errored.value = true
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <section class="border-t border-[var(--border)] px-6 py-10 sm:px-8">
    <h2 class="mb-4 text-lg font-bold text-[var(--ink)] sm:text-xl">요즘 다들 여기로 떠나요</h2>

    <!-- 로딩: Card Skeleton -->
    <div v-if="loading" class="flex gap-4 overflow-hidden">
      <Card
        v-for="n in 4"
        :key="n"
        class="w-[210px] shrink-0 gap-0 overflow-hidden py-0 sm:w-[200px]"
      >
        <Skeleton class="aspect-[4/3] w-full rounded-none" />
        <div class="flex flex-col gap-2 p-3.5">
          <Skeleton class="h-4 w-3/4" />
          <Skeleton class="h-3 w-1/2" />
          <Skeleton class="h-3 w-2/3" />
        </div>
      </Card>
    </div>

    <!-- 에러: 인라인 + 다시 불러오기 (전체 차단 금지) -->
    <div
      v-else-if="errored"
      class="flex flex-col items-center gap-3 rounded-[var(--radius-win)] border border-[var(--border)] px-6 py-10 text-center"
    >
      <p class="text-sm text-[var(--ink-2)]">잠깐, 길을 잃었어요. 다시 불러올까요?</p>
      <Button variant="outline" size="sm" @click="load">다시 불러오기</Button>
    </div>

    <!-- 기본: 자동으로 흐르는 무한 마퀴 (마우스 올리면 멈춤) -->
    <div v-else-if="items.length" class="marquee group relative overflow-hidden">
      <div class="marquee__track flex w-max">
        <div v-for="(item, i) in loopItems" :key="i" class="mr-4 shrink-0" :aria-hidden="i >= items.length">
          <PopularCard :item="item" />
        </div>
      </div>
      <!-- 양끝 페이드: 카드가 화면 밖으로 자연스럽게 사라지게 -->
      <div
        class="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-[var(--background)] to-transparent"
      />
      <div
        class="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-[var(--background)] to-transparent"
      />
    </div>
  </section>
</template>

<style scoped>
.marquee__track {
  animation: marquee-scroll 45s linear infinite;
  will-change: transform;
}

/* 마우스를 올리면 잠깐 멈춰 카드를 살펴볼 수 있게 */
.marquee:hover .marquee__track {
  animation-play-state: paused;
}

@keyframes marquee-scroll {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-50%);
  }
}

/* 모션 최소화 선호 시 자동 흐름 정지 */
@media (prefers-reduced-motion: reduce) {
  .marquee__track {
    animation: none;
  }
}
</style>
