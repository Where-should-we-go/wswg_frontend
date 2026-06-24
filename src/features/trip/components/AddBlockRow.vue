<script setup>
// AddBlockRow — "＋ 블록 추가" 행/버튼 (시안 §B `.addblock`). 클릭/'/'→ 슬래시 메뉴.
// 종류 선택 시 add(koType) emit. variant 로 뷰별 모양을 바꾼다:
//   · rail  : 타임라인 행(레일 음수 마진) — 기본
//   · plain : 점선 박스 버튼(보드 컬럼·지도 하단)
//   · icon  : ＋ 아이콘 버튼(캘린더 DAY 헤더처럼 좁은 곳)
// 슬래시 메뉴는 body 로 Teleport — overflow 컨테이너(캘린더 가로 스크롤 등)에 잘리지 않고,
// 화면 밖으로 나가면 위로 뒤집거나 좌우로 당겨 항상 보이게 한다.
import { ref, watch, nextTick, onBeforeUnmount } from 'vue'
import { Plus } from '@lucide/vue'
import { onClickOutside } from '@vueuse/core'
import TripSlashMenu from './TripSlashMenu.vue'

defineProps({
  variant: { type: String, default: 'rail' }, // 'rail' | 'plain' | 'icon'
})

const emit = defineEmits(['add'])

const open = ref(false)
const root = ref(null)
const menuRef = ref(null)
const menuPos = ref({ top: 0, left: 0 })
const MENU_W = 248

onClickOutside(root, () => (open.value = false), { ignore: [menuRef] })

function place() {
  const btn = root.value?.querySelector('button')
  if (!btn) return
  const r = btn.getBoundingClientRect()
  const margin = 8
  const left = Math.min(Math.max(margin, r.left), window.innerWidth - MENU_W - margin)
  menuPos.value = { top: r.bottom + 4, left }
  // 렌더 후 실제 높이로 아래 넘치면 위로 뒤집기.
  nextTick(() => {
    const h = menuRef.value?.offsetHeight ?? 220
    let top = r.bottom + 4
    if (top + h > window.innerHeight - margin) top = Math.max(margin, r.top - h - 4)
    menuPos.value = { top, left }
  })
}

function toggle() {
  open.value = !open.value
  if (open.value) nextTick(place)
}

function onKeydown(e) {
  if (e.key === '/') {
    e.preventDefault()
    open.value = true
    nextTick(place)
  }
}

function onSelect(kind) {
  emit('add', kind.koType)
  open.value = false
}

// 스크롤·리사이즈 시 메뉴가 버튼과 어긋나지 않게 닫는다.
function closeMenu() {
  open.value = false
}
watch(open, (v) => {
  if (v) {
    window.addEventListener('scroll', closeMenu, true)
    window.addEventListener('resize', closeMenu)
  } else {
    window.removeEventListener('scroll', closeMenu, true)
    window.removeEventListener('resize', closeMenu)
  }
})
onBeforeUnmount(() => {
  window.removeEventListener('scroll', closeMenu, true)
  window.removeEventListener('resize', closeMenu)
})
</script>

<template>
  <div ref="root" class="relative" :class="variant === 'rail' ? '-ml-[26px]' : ''">
    <!-- rail: 타임라인 행 -->
    <button
      v-if="variant === 'rail'"
      type="button"
      class="flex w-full items-center gap-[7px] rounded-md px-2 py-[7px] text-left text-[13.5px] text-[var(--ink-3)] transition-colors hover:text-[var(--ink-2)]"
      @click="toggle"
      @keydown="onKeydown"
    >
      <Plus class="size-[15px]" />
      <span class="text-[var(--ink-2)]">블록 추가</span>
      <span>· '/' 입력하면 종류 선택</span>
    </button>

    <!-- plain: 점선 박스 버튼 -->
    <button
      v-else-if="variant === 'plain'"
      type="button"
      class="flex w-full items-center justify-center gap-1.5 rounded-[var(--radius)] border border-dashed border-[var(--border)] px-2 py-2 text-[12.5px] font-medium text-[var(--ink-3)] transition-colors hover:border-[var(--brand)] hover:text-[var(--brand)]"
      @click="toggle"
      @keydown="onKeydown"
    >
      <Plus class="size-[14px]" /> 블록 추가
    </button>

    <!-- icon: ＋ 아이콘 버튼 -->
    <button
      v-else
      type="button"
      class="grid size-6 place-items-center rounded-md text-[var(--ink-3)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--brand)]"
      aria-label="블록 추가"
      title="이 날에 블록 추가"
      @click="toggle"
      @keydown="onKeydown"
    >
      <Plus class="size-[15px]" />
    </button>

    <!-- 슬래시 메뉴 (body 로 Teleport, fixed 위치) -->
    <Teleport to="body">
      <div
        v-if="open"
        ref="menuRef"
        class="fixed z-[60]"
        :style="{ top: `${menuPos.top}px`, left: `${menuPos.left}px` }"
      >
        <TripSlashMenu @select="onSelect" />
      </div>
    </Teleport>
  </div>
</template>
