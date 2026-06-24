<script setup>
// S1 인기 여행지 섹션 — 타이틀 + 가로 캐러셀(카드 그리드).
// 상태: 로딩(Card Skeleton) · 에러(인라인 "다시 불러오기") · 빈(섹션 자체를 숨김 — 부모가 v-if 처리).
// 전체 화면을 차단하지 않도록 에러도 이 섹션 안에서만 인라인 처리.
import { onMounted, ref } from 'vue'
import { getPopular } from '@/services/curation'
import Carousel from '@/components/common/Carousel.vue'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import PopularCard from './PopularCard.vue'

const items = ref([])
const loading = ref(true)
const errored = ref(false)

const emit = defineEmits(['empty'])

async function load() {
  loading.value = true
  errored.value = false
  try {
    const res = await getPopular({ period: 'week', limit: 8 })
    items.value = Array.isArray(res) ? res : []
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

    <!-- 기본: 가로 캐러셀 -->
    <Carousel v-else-if="items.length">
      <PopularCard v-for="item in items" :key="item.contentId" :item="item" />
    </Carousel>
  </section>
</template>
