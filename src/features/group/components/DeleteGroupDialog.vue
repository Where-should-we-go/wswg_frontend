<script setup>
// 모임 삭제 확인 — 파괴적 작업이라 모달/바텀시트로 한 번 더 확인받는다. v-model:open.
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
  group: { type: Object, default: null },
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
          ‘{{ group?.groupName }}’ 모임을 삭제할까요?
        </component>
        <component
          :is="isMobile ? SheetDescription : DialogDescription"
          class="text-[13px] text-[var(--ink-2)]"
        >
          모임을 삭제하면 멤버·여행 계획·발자취 기록이 모두 사라지고 되돌릴 수 없어요.
        </component>
      </component>

      <component :is="isMobile ? SheetFooter : DialogFooter" class="gap-2">
        <Button
          variant="outline"
          class="flex-1"
          :disabled="loading"
          @click="emit('update:open', false)"
        >
          그대로 둘게요
        </Button>
        <Button
          class="flex-1 bg-[var(--danger)] text-white hover:bg-[var(--danger)]/90"
          :disabled="loading"
          @click="emit('confirm')"
        >
          {{ loading ? '삭제 중…' : '모임 삭제' }}
        </Button>
      </component>
    </component>
  </component>
</template>
