<script setup>
// 시트 본문. side: 'bottom'(기본, 바텀시트) | 'right' | 'left' | 'top'.
import { X } from '@lucide/vue'
import { reactiveOmit } from '@vueuse/core'
import { DialogClose, DialogContent, DialogOverlay, DialogPortal, useForwardPropsEmits } from 'reka-ui'
import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'

defineOptions({ inheritAttrs: false })

const props = defineProps({
  side: { type: String, default: 'bottom' }, // bottom | right | left | top
  showCloseButton: { type: Boolean, default: true },
  class: { type: null, required: false },
})
const emits = defineEmits([
  'escapeKeyDown',
  'pointerDownOutside',
  'focusOutside',
  'interactOutside',
  'openAutoFocus',
  'closeAutoFocus',
])

const delegatedProps = reactiveOmit(props, 'class', 'side', 'showCloseButton')
const forwarded = useForwardPropsEmits(delegatedProps, emits)

const sheetVariants = cva(
  'fixed z-50 flex flex-col gap-4 bg-[var(--card)] shadow-[var(--shadow-win)] transition-transform',
  {
    variants: {
      side: {
        bottom:
          'inset-x-0 bottom-0 max-h-[85vh] rounded-t-[var(--radius-win)] border-t border-[var(--border)] p-5',
        top: 'inset-x-0 top-0 max-h-[85vh] rounded-b-[var(--radius-win)] border-b border-[var(--border)] p-5',
        right: 'inset-y-0 right-0 h-full w-3/4 max-w-sm border-l border-[var(--border)] p-5',
        left: 'inset-y-0 left-0 h-full w-3/4 max-w-sm border-r border-[var(--border)] p-5',
      },
    },
    defaultVariants: { side: 'bottom' },
  },
)
</script>

<template>
  <DialogPortal>
    <DialogOverlay
      data-slot="sheet-overlay"
      class="fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
    />
    <DialogContent
      data-slot="sheet-content"
      v-bind="{ ...$attrs, ...forwarded }"
      :class="cn(sheetVariants({ side }), props.class)"
    >
      <slot />

      <DialogClose
        v-if="showCloseButton"
        class="absolute right-4 top-4 rounded-xs text-[var(--ink-3)] opacity-70 transition-opacity hover:opacity-100 focus:outline-none [&_svg]:size-4"
      >
        <X />
        <span class="sr-only">닫기</span>
      </DialogClose>
    </DialogContent>
  </DialogPortal>
</template>
