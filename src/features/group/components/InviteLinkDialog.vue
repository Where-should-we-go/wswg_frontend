<script setup>
// 초대 링크 — 열리면 createInviteLink 로 링크를 발급해 보여줘요. v-model:open.
// 데스크탑: 모달 / 모바일: 풀스크린 바텀시트.
import { ref, watch } from 'vue'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { createInviteLink } from '@/services/groups'
import { useIsMobile } from '../composables/useIsMobile'
import InviteLinkField from './InviteLinkField.vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  groupId: { type: [String, Number], default: null },
})

const emit = defineEmits(['update:open'])

const { isMobile } = useIsMobile()

const link = ref(null)
const loading = ref(false)
const errorMsg = ref('')

async function issue() {
  if (props.groupId == null) return
  loading.value = true
  errorMsg.value = ''
  link.value = null
  try {
    link.value = await createInviteLink(props.groupId)
  } catch (e) {
    errorMsg.value = e.message ?? '초대 링크를 만들지 못했어요.'
  } finally {
    loading.value = false
  }
}

watch(
  () => props.open,
  (open) => {
    if (open) issue()
    else {
      link.value = null
      errorMsg.value = ''
    }
  },
)
</script>

<template>
  <component
    :is="isMobile ? Sheet : Dialog"
    :open="open"
    @update:open="emit('update:open', $event)"
  >
    <component
      :is="isMobile ? SheetContent : DialogContent"
      :side="isMobile ? 'bottom' : undefined"
      :class="isMobile ? 'h-[70vh]' : 'sm:max-w-[460px]'"
    >
      <component :is="isMobile ? SheetHeader : DialogHeader" class="gap-1">
        <component
          :is="isMobile ? SheetTitle : DialogTitle"
          class="text-[18px] font-extrabold tracking-tight text-[var(--ink)]"
        >
          초대 링크로 불러요
        </component>
        <component
          :is="isMobile ? SheetDescription : DialogDescription"
          class="text-[13px] text-[var(--ink-2)]"
        >
          링크를 공유하면 친구가 바로 모임에 들어올 수 있어요.
        </component>
      </component>

      <div class="min-w-0 px-1 pt-1">
        <div v-if="loading" class="flex flex-col gap-2">
          <Skeleton class="h-11 w-full" />
          <Skeleton class="h-4 w-32" />
        </div>

        <div v-else-if="errorMsg" class="flex flex-col gap-3">
          <p class="text-[13px] text-[var(--danger)]">{{ errorMsg }}</p>
          <Button variant="outline" size="sm" class="w-fit" @click="issue">다시 시도</Button>
        </div>

        <InviteLinkField v-else :link="link" />
      </div>
    </component>
  </component>
</template>
