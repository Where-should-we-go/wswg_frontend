<script setup>
// 초대 링크 표시 + 복사 버튼 + 만료 캡션. createInviteLink 응답을 받아 보여줘요.
// link: { token, url, expiresAt }
import { ref } from 'vue'
import { Copy, Check } from '@lucide/vue'
import { Button } from '@/components/ui/button'

defineProps({
  link: { type: Object, default: null },
})

const copied = ref(false)

async function copy(url) {
  try {
    await navigator.clipboard.writeText(url)
  } catch {
    // 클립보드 권한이 없으면 조용히 넘어가요(링크는 화면에 노출돼 있어요).
  }
  copied.value = true
  setTimeout(() => {
    copied.value = false
  }, 1600)
}
</script>

<template>
  <div v-if="link" class="flex flex-col gap-2">
    <div
      class="flex items-center gap-2 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-subtle)] px-3 py-2"
    >
      <span class="flex-1 truncate text-[13px] text-[var(--ink-2)]" :title="link.url">
        {{ link.url }}
      </span>
      <Button size="sm" variant="outline" class="shrink-0" @click="copy(link.url)">
        <Check v-if="copied" class="size-3.5 text-[var(--success)]" />
        <Copy v-else class="size-3.5" />
        {{ copied ? '복사했어요' : '복사' }}
      </Button>
    </div>
    <!-- §9 정본 안내문: 서버 expiresAt raw 대신 고정 카피. -->
    <p class="text-[13px] text-[var(--ink-2)]">이 링크를 친구에게 보내면 바로 같이 다닐 수 있어요</p>
    <p class="text-[12px] text-[var(--ink-3)]">
      링크는 일정 시간 뒤 만료돼요<template v-if="link.expiresAt"> · {{ link.expiresAt }}</template>
    </p>
  </div>
</template>
