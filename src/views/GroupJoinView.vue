<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import { joinByToken } from '@/services/groups'

const route = useRoute()
const router = useRouter()
const status = ref('joining')
const message = ref('모임장에게 가입 요청을 보내는 중이에요.')

async function join() {
  const token = route.query.token
  if (!token || Array.isArray(token)) {
    status.value = 'error'
    message.value = '초대 링크가 올바르지 않아요.'
    return
  }

  status.value = 'joining'
  message.value = '모임장에게 가입 요청을 보내는 중이에요.'

  try {
    const result = await joinByToken(token)
    if (result?.status === 'ALREADY_MEMBER') {
      toast.success('이미 참여 중인 모임이에요.')
      router.replace({ path: '/groups' })
      return
    }

    status.value = 'requested'
    message.value = '가입 요청을 보냈어요. 모임장이 수락하면 참여할 수 있어요.'
    toast.success('가입 요청을 보냈어요.')
  } catch (e) {
    status.value = 'error'
    message.value = e.message ?? '가입 요청을 보내지 못했어요.'
  }
}

onMounted(join)
</script>

<template>
  <main class="grid min-h-full place-items-center px-6 py-16 text-center text-[var(--ink)]">
    <div class="flex max-w-sm flex-col items-center gap-4">
      <div
        class="grid size-12 place-items-center rounded-[var(--radius-win)] bg-[var(--brand-soft)] text-[var(--brand)]"
      >
        🔗
      </div>
      <div class="flex flex-col gap-1">
        <h1 class="text-[20px] font-extrabold tracking-tight">초대 링크 확인</h1>
        <p class="text-[14px] text-[var(--ink-2)]">{{ message }}</p>
      </div>
      <Button v-if="status === 'error'" variant="outline" @click="join">다시 시도</Button>
      <Button v-else-if="status === 'requested'" variant="outline" @click="router.replace('/groups')">
        모임으로 돌아가기
      </Button>
    </div>
  </main>
</template>
