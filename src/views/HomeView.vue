<script setup>
// S1 랜딩 (게스트). 간소화 셸 — 화면이 GlobalHeader를 직접 그린다(풀스크린 main, 사이드바 없음).
// 위→아래 스택: GlobalHeader · Hero · 인기 여행지 · 서비스 소개 · 하단 CTA + 푸터.
// 데이터: getPopular (PopularCarousel 내부에서 로드). 인기 비면 섹션만 숨김(Hero·소개 유지).
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Sparkles } from '@lucide/vue'
import GlobalHeader from '@/components/common/GlobalHeader.vue'
import { Button } from '@/components/ui/button'
import HeroSection from '@/features/landing/HeroSection.vue'
import PopularCarousel from '@/features/landing/PopularCarousel.vue'
import ServiceIntro from '@/features/landing/ServiceIntro.vue'

const router = useRouter()

// 인기 집계가 비고 폴백도 없으면 섹션 자체를 숨겨 빈 캐러셀을 피한다.
const popularEmpty = ref(false)

function start() {
  router.push('/login')
}
</script>

<template>
  <main class="min-h-screen bg-[var(--background)] text-[var(--ink)]">
    <GlobalHeader>
      <template #actions>
        <Button variant="ghost" size="sm" class="hidden sm:inline-flex" @click="router.push('/attractions')">
          둘러보기
        </Button>
      </template>
    </GlobalHeader>

    <div class="mx-auto max-w-[1080px]">
      <!-- Hero -->
      <HeroSection />

      <!-- 인기 여행지 (집계 비면 숨김) -->
      <PopularCarousel v-show="!popularEmpty" @empty="popularEmpty = true" />

      <!-- 서비스 소개 -->
      <ServiceIntro />

      <!-- 하단 CTA -->
      <section class="border-t border-[var(--border)] px-6 py-14 text-center sm:px-8">
        <h2 class="text-xl font-bold text-[var(--ink)] sm:text-2xl">지금 떠날 곳을 골라볼까요?</h2>
        <p class="mt-2 text-sm text-[var(--ink-2)]">고르기만 하면, 나머지는 저희가 맡을게요.</p>
        <Button size="lg" class="mt-6 min-h-11" @click="start">
          <Sparkles class="size-4" />
          시작하기
        </Button>
      </section>

      <!-- 푸터 -->
      <footer class="border-t border-[var(--border)] px-6 py-8 text-center text-xs text-[var(--ink-3)] sm:px-8">
        어디갈래? — 고르기만 하세요, 일정은 저희가 짜드려요.
      </footer>
    </div>
  </main>
</template>
