<script setup>
// S1 Hero — 헤드라인 + 서브카피 + CTA(시작하기/관광지 둘러보기).
// 색 면적 최소(블루 절제): 헤드라인 일부만 브랜드 색, 배경은 paper.
import { useRouter } from 'vue-router'
import { Sparkles } from '@lucide/vue'
import { Button } from '@/components/ui/button'

const router = useRouter()

function start() {
  router.push('/login')
}
function browse() {
  router.push('/attractions')
}
</script>

<template>
  <section class="px-6 py-12 text-center sm:px-8 md:py-[72px]">
    <h1
      class="mx-auto max-w-[640px] text-[clamp(1.75rem,5vw,2.6rem)] font-extrabold leading-[1.18] tracking-tight text-[var(--ink)]"
    >
      고르기만 하세요,<br />
      <span class="text-[var(--brand)]">일정은 저희가 짜드려요.</span>
    </h1>
    <p class="mx-auto mt-[18px] max-w-[480px] text-[15px] leading-relaxed text-[var(--ink-2)] sm:text-base">
      지역이랑 취향만 정하면, 친구들이랑 같이 일정을 다듬을 수 있어요.
    </p>
    <div class="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
      <Button size="lg" class="min-h-11 w-full sm:w-auto" @click="start">
        <Sparkles class="size-4" />
        시작하기
      </Button>
      <Button variant="ghost" size="lg" class="min-h-11 w-full sm:w-auto" @click="browse">
        관광지 둘러보기
      </Button>
    </div>
  </section>
</template>
