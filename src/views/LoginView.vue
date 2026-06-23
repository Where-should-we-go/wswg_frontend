<script setup>
// S2 로그인 `/login` — 간소화 셸(로고 직접 그림) + 중앙 로그인 카드.
// 소셜 로그인 전용(이메일/비번 폼 없음). 화면정의서 §S2.
import { onMounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { isAuthenticated, startOAuthLogin } from '@/services/auth'
import SocialAuthButton from '@/features/auth/SocialAuthButton.vue'

const route = useRoute()
const router = useRouter()

// 클릭한 provider 동안 로딩 표시(다른 버튼도 같이 비활성).
const loadingProvider = ref(null)

// 이미 로그인된 사용자가 들어오면 우회(선택). redirect 쿼리가 있으면 우선.
onMounted(() => {
  if (isAuthenticated()) {
    const redirect = route.query.redirect
    const target = typeof redirect === 'string' && redirect ? redirect : '/attractions'
    router.replace(target)
  }
})

function handleLogin(provider) {
  if (loadingProvider.value) return
  loadingProvider.value = provider
  try {
    startOAuthLogin(provider)
    // startOAuthLogin 은 외부로 리다이렉트하므로 보통 이 줄 이후는 실행되지 않는다.
  } catch {
    loadingProvider.value = null
    toast.error('로그인을 시작하지 못했어요. 잠깐 뒤에 다시 시도해 주세요.')
  }
}
</script>

<template>
  <main class="flex min-h-screen flex-col bg-[var(--bg-subtle)] text-[var(--ink)]">
    <!-- 간소화 셸: 로고만 직접 그린다 -->
    <header class="flex h-14 items-center px-4 sm:px-6">
      <RouterLink
        to="/"
        class="flex items-center gap-1.5 font-extrabold tracking-tight text-[var(--ink)]"
      >
        <span class="grid size-6 place-items-center rounded-md bg-[var(--brand)] text-xs text-white">
          어
        </span>
        <span>어디갈래?</span>
      </RouterLink>
    </header>

    <!-- 본문 중앙 -->
    <div class="flex flex-1 items-center justify-center px-4 py-10">
      <Card class="w-full max-w-sm">
        <CardHeader class="text-center">
          <CardTitle class="text-xl leading-snug">
            어디갈래에 오신 걸 환영해요!
            <span class="mt-1 block text-sm font-normal text-[var(--ink-2)]">
              소셜 계정으로 바로 시작해요
            </span>
          </CardTitle>
        </CardHeader>

        <CardContent class="flex flex-col gap-3">
          <SocialAuthButton
            provider="google"
            label="구글로 시작하기"
            :loading="loadingProvider === 'google'"
            :disabled="loadingProvider !== null"
            @click="handleLogin"
          />
          <SocialAuthButton
            provider="kakao"
            label="카카오로 시작하기"
            :loading="loadingProvider === 'kakao'"
            :disabled="loadingProvider !== null"
            @click="handleLogin"
          />

          <!-- 로딩 안내 -->
          <p
            v-if="loadingProvider"
            role="status"
            class="flex items-center justify-center gap-2 pt-1 text-sm text-[var(--ink-2)]"
          >
            <svg class="size-4 animate-spin text-[var(--brand)]" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            잠깐만요, 로그인하고 있어요…
          </p>

          <!-- 약관 마이크로카피 -->
          <p class="pt-2 text-center text-xs leading-relaxed text-[var(--ink-3)]">
            로그인하면 이용약관과 개인정보 처리방침에 동의하는 것으로 볼게요
          </p>
        </CardContent>
      </Card>
    </div>
  </main>
</template>
