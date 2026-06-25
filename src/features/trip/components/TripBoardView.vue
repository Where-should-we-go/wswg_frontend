<script setup>
// TripBoardView — 📋 보드(칸반) 뷰 (화면정의서 S6, 데스크탑 우선).
// 컬럼 = Day N(visitDate). 카드 = 블록. 드래그&드롭으로 다른 컬럼에 놓으면 visitDate 변경.
// 모바일(<lg)에서는 미제공 — "보드는 큰 화면에서 편해요" 칩만 노출.
// 네이티브 HTML5 드래그앤드롭(라이브러리 미사용).
import { ref } from 'vue'
import { BlockTag } from '@/components/ui/block-tag'
import AddBlockRow from './AddBlockRow.vue'
import BlockTitleInput from './BlockTitleInput.vue'
import { typeKeyOf, typeEmojiOf, overlineOf } from '@/features/trip/lib/blockMeta'

defineProps({
  // [{ date, dayIndex, blocks }]
  days: { type: Array, default: () => [] },
})

const emit = defineEmits(['board-drop', 'add-block', 'edit-title'])

// 제목 편집 중인 카드 — 그 동안은 드래그를 끈다(입력과 충돌 방지).
const editingId = ref(null)

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']
function dateLabel(date) {
  const d = new Date(date + 'T00:00:00')
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${WEEKDAYS[d.getDay()]})`
}

const draggingId = ref(null)
const overDate = ref(null) // 빈 영역(맨 끝) 드롭 대상 컬럼
const overCardId = ref(null) // 삽입 라인을 띄울 대상 카드
const cardPos = ref('before') // 대상 카드의 위/아래

function onDragStart(block) {
  draggingId.value = block.id
}
function onDragEnd() {
  draggingId.value = null
  overDate.value = null
  overCardId.value = null
}
// 카드 위로: 상단/하단 절반으로 before/after 판정 + 삽입 라인. (자기 자신엔 표시 안 함)
function onCardDragOver(e, block) {
  if (!draggingId.value || draggingId.value === block.id) return
  const r = e.currentTarget.getBoundingClientRect()
  cardPos.value = e.clientY - r.top > r.height / 2 ? 'after' : 'before'
  overCardId.value = block.id
  overDate.value = null
}
function onCardDrop(date, block) {
  if (draggingId.value && draggingId.value !== block.id) {
    emit('board-drop', draggingId.value, date, block.id, cardPos.value)
  }
  onDragEnd()
}
// 컬럼 빈 영역: 맨 끝에 추가.
function onColDragOver(date) {
  overDate.value = date
  overCardId.value = null
}
function onColDrop(date) {
  if (draggingId.value) emit('board-drop', draggingId.value, date, null, 'append')
  onDragEnd()
}
</script>

<template>
  <div>
    <!-- 모바일 안내 칩 -->
    <div
      class="mb-3 inline-flex items-center gap-1.5 rounded-full bg-[var(--sunken)] px-3 py-1.5 text-[12.5px] text-[var(--ink-2)] lg:hidden"
    >
      <span aria-hidden="true">🖥️</span> 보드는 큰 화면에서 편해요
    </div>

    <!-- 칸반 보드(데스크탑) -->
    <div class="hidden gap-3 overflow-x-auto pb-2 lg:flex">
      <div
        v-for="d in days"
        :key="d.date"
        class="flex w-[256px] shrink-0 flex-col rounded-[var(--radius-win)] border border-[var(--border)] bg-[var(--sunken)] p-2.5 transition-colors"
        :class="overDate === d.date && !overCardId ? 'ring-2 ring-[var(--brand)]' : ''"
        @dragover.prevent="onColDragOver(d.date)"
        @dragleave="overDate === d.date && (overDate = null)"
        @drop.prevent="onColDrop(d.date)"
      >
        <!-- 컬럼 헤더 -->
        <div class="mb-2 flex items-baseline gap-2 px-1">
          <span class="text-[14px] font-extrabold">Day {{ d.dayIndex }}</span>
          <span class="text-[11.5px] text-[var(--ink-3)]">{{ dateLabel(d.date) }}</span>
          <span class="ml-auto text-[11.5px] text-[var(--ink-3)]">{{ d.blocks.length }}</span>
        </div>

        <!-- 카드들 -->
        <div class="flex flex-col gap-2">
          <div
            v-for="b in d.blocks"
            :key="b.id"
            :draggable="editingId !== b.id"
            class="relative rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background)] p-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
            :class="[
              draggingId === b.id ? 'opacity-40' : '',
              editingId === b.id ? '' : 'cursor-grab active:cursor-grabbing',
            ]"
            @dragstart="onDragStart(b)"
            @dragend="onDragEnd"
            @dragover.prevent.stop="onCardDragOver($event, b)"
            @drop.prevent.stop="onCardDrop(d.date, b)"
          >
            <!-- 삽입 라인(노션식) — 대상 카드 위/아래. -->
            <span
              v-if="overCardId === b.id && draggingId !== b.id"
              class="pointer-events-none absolute inset-x-0 z-10 h-[2.5px] rounded-full bg-[var(--brand)]"
              :class="cardPos === 'after' ? '-bottom-[5px]' : '-top-[5px]'"
              aria-hidden="true"
            />
            <div class="flex items-start gap-1.5">
              <span aria-hidden="true">{{ typeEmojiOf(b.type) }}</span>
              <!-- 제목 인라인 편집(빈 메모·이동도 바로 작성) -->
              <BlockTitleInput
                :value="b.title"
                placeholder="제목 없는 블록"
                class="min-w-0 flex-1 text-[13.5px] font-medium leading-[1.35]"
                @commit="(t) => emit('edit-title', b.id, t)"
                @focus="editingId = b.id"
                @blur="editingId = null"
              />
            </div>
            <div class="mt-1.5 flex items-center gap-2">
              <BlockTag :type="typeKeyOf(b.type)" class="px-[6px] py-px text-[10px]" />
              <span class="text-[10.5px] tabular-nums text-[var(--ink-3)]">{{
                overlineOf({ time: b.time, durationMin: b.durationMin })
              }}</span>
            </div>
          </div>

          <!-- 빈 컬럼 힌트 -->
          <p
            v-if="!d.blocks.length"
            class="rounded-[var(--radius)] border border-dashed border-[var(--border)] px-2 py-4 text-center text-[12px] text-[var(--ink-3)]"
          >
            여기로 끌어다 놓아요
          </p>

          <!-- 블록 추가 (슬래시 메뉴는 body 로 Teleport — 잘림 방지) -->
          <AddBlockRow variant="plain" @add="(t) => emit('add-block', t, d.date)" />
        </div>
      </div>
    </div>
  </div>
</template>
