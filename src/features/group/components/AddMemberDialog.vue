<script setup>
// 멤버 추가 — 이름으로 멤버를 직접 추가해요(addMember). v-model:open.
// 데스크탑: 모달 / 모바일: 풀스크린 바텀시트.
import { ref, watch } from 'vue'
import { UserPlus } from '@lucide/vue'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { addMember } from '@/services/groups'
import { useIsMobile } from '../composables/useIsMobile'

const props = defineProps({
  open: { type: Boolean, default: false },
  groupId: { type: [String, Number], default: null },
})

const emit = defineEmits(['update:open', 'added'])

const { isMobile } = useIsMobile()

const name = ref('')
const submitting = ref(false)
const errorMsg = ref('')

function isValid() {
  return name.value.trim().length >= 1
}

async function submit() {
  if (submitting.value || !isValid() || props.groupId == null) return
  submitting.value = true
  errorMsg.value = ''
  try {
    const member = await addMember(props.groupId, { name: name.value.trim() })
    emit('added', member)
    name.value = ''
    emit('update:open', false)
  } catch (e) {
    errorMsg.value = e.message ?? '멤버를 추가하지 못했어요. 다시 시도해 주세요.'
  } finally {
    submitting.value = false
  }
}

watch(
  () => props.open,
  (open) => {
    if (!open) {
      name.value = ''
      errorMsg.value = ''
      submitting.value = false
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
      :class="isMobile ? 'h-[88vh]' : 'sm:max-w-[420px]'"
    >
      <component :is="isMobile ? SheetHeader : DialogHeader" class="gap-1">
        <component
          :is="isMobile ? SheetTitle : DialogTitle"
          class="text-[18px] font-extrabold tracking-tight text-[var(--ink)]"
        >
          멤버를 추가해요
        </component>
        <component
          :is="isMobile ? SheetDescription : DialogDescription"
          class="text-[13px] text-[var(--ink-2)]"
        >
          함께 여행할 친구의 이름을 적어 주세요.
        </component>
      </component>

      <div class="flex flex-col gap-2 px-1">
        <p class="text-[11.5px] font-bold tracking-[0.05em] text-[var(--ink-3)] uppercase">이름</p>
        <Input
          v-model="name"
          placeholder="예: 이민지"
          :aria-invalid="!!errorMsg"
          @keydown.enter="submit"
        />
        <p v-if="errorMsg" class="text-[12.5px] text-[var(--danger)]">{{ errorMsg }}</p>
      </div>

      <div class="mt-2 px-1">
        <Button class="w-full py-[11px]" :disabled="submitting || !isValid()" @click="submit">
          <UserPlus class="size-4" />
          {{ submitting ? '추가하는 중…' : '멤버 추가' }}
        </Button>
      </div>
    </component>
  </component>
</template>
