<script setup>
// 게스트 탐색 상단 글로벌 헤더 (S1·S3·S4 공용). 간소화 셸.
// 좌: 로고(→S1) / 중앙: #center 슬롯(브레드크럼·검색 등) / 우: #actions 슬롯 + 로그인/프로필.
import { RouterLink, useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { isAuthenticated } from '@/services/auth'
import UserMenu from '@/features/auth/UserMenu.vue'

const router = useRouter()
const authed = isAuthenticated()

function goLogin() {
  router.push('/login')
}
</script>

<template>
  <header
    class="sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-[var(--border)] bg-[var(--card)]/90 px-4 backdrop-blur sm:px-6"
  >
    <RouterLink to="/" class="flex items-center gap-1.5 font-extrabold tracking-tight text-[var(--ink)]">
      <span class="grid size-6 place-items-center rounded-md bg-[var(--brand)] text-xs text-white">
        어
      </span>
      <span class="hidden sm:inline">어디갈래?</span>
    </RouterLink>

    <div class="min-w-0 flex-1">
      <slot name="center" />
    </div>

    <div class="flex items-center gap-2">
      <slot name="actions" />
      <UserMenu v-if="authed" />
      <Button v-else size="sm" @click="goLogin">시작하기</Button>
    </div>
  </header>
</template>
