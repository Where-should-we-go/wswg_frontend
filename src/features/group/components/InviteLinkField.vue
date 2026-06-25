<script setup>
// 초대 링크 표시 + 복사 버튼 + 만료 캡션. createInviteLink 응답을 받아 보여줘요.
// link: { token, url, expiresAt }
import { computed, ref } from 'vue'
import { Copy, Check } from '@lucide/vue'
import { Button } from '@/components/ui/button'

const props = defineProps({
  link: { type: Object, default: null },
})

const copied = ref(false)

async function copy(url) {
  let ok = false
  // 보안 컨텍스트(HTTPS·localhost)에서만 Clipboard API 사용 가능.
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url)
      ok = true
    }
  } catch {
    ok = false
  }
  // LAN IP·HTTP 등 비보안 컨텍스트 폴백: 임시 textarea + execCommand('copy').
  if (!ok) ok = fallbackCopy(url)
  if (!ok) return

  copied.value = true
  setTimeout(() => {
    copied.value = false
  }, 1600)
}

function fallbackCopy(text) {
  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.setAttribute('readonly', '')
    ta.style.position = 'fixed'
    ta.style.top = '-9999px'
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    return ok
  } catch {
    return false
  }
}

// 만료 캡션: 서버 ISO 면 사람이 읽는 형식으로, 이미 문자열(mock)이면 그대로.
const expiryLabel = computed(() => {
  const raw = props.link?.expiresAt
  if (!raw) return ''
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return raw
  return d.toLocaleString('ko-KR', {
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
})
</script>

<template>
  <div v-if="link" class="flex min-w-0 flex-col gap-2">
    <div
      class="flex min-w-0 items-center gap-2 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-subtle)] px-3 py-2"
    >
      <span class="min-w-0 flex-1 truncate text-[13px] text-[var(--ink-2)]" :title="link.url">
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
      링크는 일정 시간 뒤 만료돼요<template v-if="expiryLabel"> · {{ expiryLabel }}</template>
    </p>
  </div>
</template>
