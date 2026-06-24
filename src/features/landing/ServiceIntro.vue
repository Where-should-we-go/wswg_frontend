<script setup>
// S1 서비스 소개 — 3가치 카드(자동 일정 / 실시간 공동 편집 / 관광지 검색).
// 평면(그림자 없음): hairline + hover. 데스크탑 3열, 모바일 1열 스택.
import { WandSparkles, Users, Search } from '@lucide/vue'
import { Card } from '@/components/ui/card'

const values = [
  {
    icon: WandSparkles,
    title: '일정을 자동으로 짜드려요',
    desc: '지역이랑 취향만 고르면, 하루 동선까지 알아서 채워드려요.',
  },
  {
    icon: Users,
    title: '친구랑 실시간으로 같이 편집해요',
    desc: '누가 어디를 고치는지 실시간으로 보면서 함께 다듬어요.',
  },
  {
    icon: Search,
    title: '가고 싶은 관광지를 찾아봐요',
    desc: '지역·테마로 검색해서 마음에 드는 곳을 일정에 담아요.',
  },
]
</script>

<template>
  <section class="border-t border-[var(--border)] px-6 py-12 sm:px-8">
    <div class="grid gap-4 md:grid-cols-3">
      <Card
        v-for="v in values"
        :key="v.title"
        class="gap-3 p-5 shadow-none transition-colors hover:bg-[var(--hover)]"
      >
        <div class="grid size-10 place-items-center rounded-[var(--radius)] bg-[var(--brand-soft)] text-[var(--brand)]">
          <component :is="v.icon" class="size-5" />
        </div>
        <h3 class="text-base font-semibold text-[var(--ink)]">{{ v.title }}</h3>
        <p class="text-sm leading-relaxed text-[var(--ink-2)]">{{ v.desc }}</p>
      </Card>
    </div>
  </section>
</template>
