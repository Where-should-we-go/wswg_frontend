<script setup>
// 멤버 제거 확인 — window.confirm 대신 토큰 적용된 모달/바텀시트. v-model:open.
// 데스크탑: 모달 / 모바일: 바텀시트.
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { useIsMobile } from '../composables/useIsMobile'

defineProps({
  open: { type: Boolean, default: false },
  member: { type: Object, default: null },
  loading: { type: Boolean, default: false },
})

const emit = defineEmits(['update:open', 'confirm'])

const { isMobile } = useIsMobile()
</script>

<template>
  <component :is="isMobile ? Sheet : Dialog" :open="open" @update:open="emit('update:open', $event)">
    <component
      :is="isMobile ? SheetContent : DialogContent"
      :side="isMobile ? 'bottom' : undefined"
      :class="isMobile ? undefined : 'sm:max-w-[420px]'"
    >
      <component :is="isMobile ? SheetHeader : DialogHeader" class="gap-1">
        <component
          :is="isMobile ? SheetTitle : DialogTitle"
          class="text-[18px] font-extrabold tracking-tight text-[var(--ink)]"
        >
          {{ member?.name }}님을 모임에서 뺄까요?
        </component>
        <component
          :is="isMobile ? SheetDescription : DialogDescription"
          class="text-[13px] text-[var(--ink-2)]"
        >
          모임 멤버에서 빠지면 이 모임의 여행을 더 이상 함께 편집할 수 없어요.
        </component>
      </component>

      <component :is="isMobile ? SheetFooter : DialogFooter" class="gap-2">
        <Button variant="outline" class="flex-1" :disabled="loading" @click="emit('update:open', false)">
          그대로 둘게요
        </Button>
        <Button
          class="flex-1 bg-[var(--danger)] text-white hover:bg-[var(--danger)]/90"
          :disabled="loading"
          @click="emit('confirm')"
        >
          {{ loading ? '빼는 중…' : '멤버 제거' }}
        </Button>
      </component>
    </component>
  </component>
</template>
