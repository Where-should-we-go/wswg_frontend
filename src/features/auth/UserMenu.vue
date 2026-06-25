<script setup>
// 로그인한 사용자 메뉴 — 아바타 트리거 + 드롭다운(내 여행 / 로그아웃).
// 앱 셸 토픽바와 게스트 헤더(GlobalHeader) 양쪽에서 재사용한다.
// 현재 사용자 정보는 서비스 레이어(mock↔실제 자동 전환)에서 로드.
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { LogOut, User } from '@lucide/vue'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { getCurrentUser, logout } from '@/services/auth'

const router = useRouter()

const user = ref(null)
const loggingOut = ref(false)

onMounted(async () => {
  try {
    user.value = await getCurrentUser()
  } catch {
    /* 미로그인이면 부모가 로그인 진입점을 그린다 — 메뉴는 표시하지 않음 */
  }
})

const initial = (name) => (name ? name.charAt(0) : '?')

async function onLogout() {
  if (loggingOut.value) return
  loggingOut.value = true
  try {
    await logout()
    toast.success('로그아웃했어요')
    router.push('/login')
  } finally {
    loggingOut.value = false
  }
}
</script>

<template>
  <DropdownMenu v-if="user">
    <DropdownMenuTrigger
      class="rounded-full transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]/40"
      aria-label="사용자 메뉴"
    >
      <Avatar class="size-8 bg-[var(--brand)]">
        <AvatarImage v-if="user.profileImageUrl" :src="user.profileImageUrl" :alt="user.name" />
        <AvatarFallback class="bg-transparent text-[13px] font-bold text-white">
          {{ initial(user.name) }}
        </AvatarFallback>
      </Avatar>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" class="w-56">
      <DropdownMenuLabel class="flex flex-col gap-0.5">
        <span class="truncate text-[13.5px] font-bold text-[var(--ink)]">{{ user.name }}</span>
        <span v-if="user.email" class="truncate text-[12px] font-normal text-[var(--ink-3)]">
          {{ user.email }}
        </span>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem @select="router.push('/mypage')">
        <User class="size-4" />
        내 여행
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        class="text-[var(--danger)]"
        :disabled="loggingOut"
        @select="onLogout"
      >
        <LogOut class="size-4" />
        {{ loggingOut ? '로그아웃 중…' : '로그아웃' }}
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
