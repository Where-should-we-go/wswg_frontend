<script setup>
// S3 관광지 검색·목록 `/attractions` — 간소화 셸(GlobalHeader 직접 그림, 좌측 사이드바 없음).
// 헤더 아래 검색 본문은 features/place 의 AttractionSearch 에 위임.
import GlobalHeader from '@/components/common/GlobalHeader.vue'
import { AttractionSearch } from '@/features/place/components'
</script>

<template>
  <div class="min-h-screen bg-[var(--background)]">
    <GlobalHeader />
    <AttractionSearch />
  </div>
</template>
