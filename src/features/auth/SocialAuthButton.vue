<script setup>
// S2 전용 소셜 로그인 버튼. 브랜드 식별색 + 아이콘 + 라벨.
// provider 별 식별색은 인라인 style 로 브랜드 공식색을 직접 표현한다
// (구글 흰색/카카오 노랑은 디자인 토큰 대상이 아닌 외부 브랜드 색).
import { computed } from 'vue'

const props = defineProps({
  provider: { type: String, required: true }, // 'google' | 'kakao'
  label: { type: String, required: true },
  loading: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['click'])

// 외부 브랜드 식별색(토큰 대상 아님 — 구글/카카오 공식 색).
const BRAND = {
  google: {
    bg: '#ffffff',
    fg: '#1f1f1f',
    border: '#dadce0',
  },
  kakao: {
    bg: '#fee500',
    fg: 'rgba(0,0,0,0.85)',
    border: 'transparent',
  },
}

const style = computed(() => {
  const b = BRAND[props.provider] ?? BRAND.google
  return {
    backgroundColor: b.bg,
    color: b.fg,
    borderColor: b.border,
  }
})

function onClick() {
  if (props.disabled || props.loading) return
  emit('click', props.provider)
}
</script>

<template>
  <button
    type="button"
    :disabled="disabled || loading"
    :style="style"
    class="inline-flex min-h-[44px] w-full items-center justify-center gap-3 rounded-[var(--radius)] border px-4 text-sm font-semibold shadow-[var(--shadow-pop,none)] transition-all hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
    :aria-busy="loading"
    @click="onClick"
  >
    <!-- 로딩 스피너 -->
    <svg
      v-if="loading"
      class="size-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
      <path
        class="opacity-90"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>

    <!-- 구글 아이콘 -->
    <svg
      v-else-if="provider === 'google'"
      class="size-5"
      viewBox="0 0 18 18"
      aria-hidden="true"
    >
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.616z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.583-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.706A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.997 8.997 0 000 9c0 1.452.348 2.827.957 4.038l3.007-2.332z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.962L3.964 7.294C4.672 5.166 6.656 3.58 9 3.58z"
      />
    </svg>

    <!-- 카카오 아이콘 -->
    <svg
      v-else
      class="size-5"
      viewBox="0 0 18 18"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        d="M9 1.5C4.589 1.5 1 4.31 1 7.776c0 2.243 1.49 4.21 3.737 5.318-.165.598-.598 2.17-.684 2.507-.107.418.153.412.322.3.133-.088 2.114-1.435 2.972-2.02.54.08 1.094.122 1.653.122 4.411 0 8-2.81 8-6.227C17 4.31 13.411 1.5 9 1.5z"
      />
    </svg>

    <span>{{ label }}</span>
  </button>
</template>
