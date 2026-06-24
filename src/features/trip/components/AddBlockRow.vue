<script setup>
// AddBlockRow — "＋ 블록 추가 · '/' 입력하면 종류 선택" 행 (시안 §B `.addblock`).
// 클릭 또는 '/' 입력 → 슬래시 메뉴 팝오버. 종류 선택 시 add(koType) emit.
import { ref } from 'vue'
import { Plus } from '@lucide/vue'
import { onClickOutside } from '@vueuse/core'
import TripSlashMenu from './TripSlashMenu.vue'

const emit = defineEmits(['add'])

const open = ref(false)
const root = ref(null)

onClickOutside(root, () => (open.value = false))

function toggle() {
  open.value = !open.value
}

function onKeydown(e) {
  if (e.key === '/') {
    e.preventDefault()
    open.value = true
  }
}

function onSelect(kind) {
  emit('add', kind.koType)
  open.value = false
}
</script>

<template>
  <div ref="root" class="relative -ml-[26px]">
    <button
      type="button"
      class="flex w-full items-center gap-[7px] rounded-md px-2 py-[7px] text-left text-[13.5px] text-[var(--ink-3)] transition-colors hover:text-[var(--ink-2)]"
      @click="toggle"
      @keydown="onKeydown"
    >
      <Plus class="size-[15px]" />
      <span class="text-[var(--ink-2)]">블록 추가</span>
      <span>· '/' 입력하면 종류 선택</span>
    </button>

    <!-- 슬래시 메뉴 팝오버 -->
    <div v-if="open" class="absolute left-7 top-full z-10 mt-1">
      <TripSlashMenu @select="onSelect" />
    </div>
  </div>
</template>
