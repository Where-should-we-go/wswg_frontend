<script setup>
// 앱 셸 상단 토픽바. 현재 라우트 기반 브레드크럼만 표시(셸 공통).
// 실시간 동기화·동행인 아바타·공유 등 협업 표시는 여행 편집(S6) 화면이
// 자체 헤더에서 그린다 — 셸 토픽바는 어느 화면에서나 맞는 정보만 둔다.
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

// 라우트별 브레드크럼 라벨(디자인시스템 §6.1).
const LABELS = {
  mypage: '내 여행',
  groups: '모임',
  'group-map': '발자취 지도',
  'plan-new': '여행 자동 생성',
  'trip-editor': '여행 편집',
  'admin-attractions': '관광지 관리',
}

const crumb = computed(() => LABELS[route.name] ?? '')
</script>

<template>
  <header class="flex h-11 items-center gap-2.5 border-b border-[var(--border)] px-[18px]">
    <div class="text-[13px] text-[var(--ink-2)]">
      <b class="font-semibold text-[var(--ink)]">{{ crumb }}</b>
    </div>
  </header>
</template>
