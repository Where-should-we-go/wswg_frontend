<script setup>
// S3 관광지 검색·목록 `/attractions`.
//  · 로그인 사용자: 워크스페이스 셸(좌측 패널 AppSidebar) 안에서 탐색 — '갑자기 다른 서비스로
//    넘어가는' 느낌을 없애고 내 여행/모임 맥락을 유지. 데스크탑(lg+)만 패널 노출.
//  · 게스트: 간소화 셸(GlobalHeader)만.
// 검색 본문은 features/place 의 AttractionSearch 에 위임.
import GlobalHeader from '@/components/common/GlobalHeader.vue'
import AppSidebar from '@/layouts/AppSidebar.vue'
import { AttractionSearch } from '@/features/place/components'
import { isAuthenticated } from '@/services/auth'

const authed = isAuthenticated()
</script>

<template>
  <!-- 로그인: 좌측 패널 + 본문 -->
  <div v-if="authed" class="flex h-screen min-h-screen overflow-hidden bg-[var(--background)]">
    <AppSidebar class="hidden lg:block" />
    <section class="flex min-w-0 flex-1 flex-col">
      <!-- 패널이 없는 모바일에선 글로벌 헤더로 로고·메뉴 유지 -->
      <GlobalHeader class="lg:hidden" />
      <div class="min-h-0 flex-1 overflow-auto">
        <AttractionSearch />
      </div>
    </section>
  </div>

  <!-- 게스트: 간소화 셸 -->
  <div v-else class="min-h-screen bg-[var(--background)]">
    <GlobalHeader />
    <AttractionSearch />
  </div>
</template>
