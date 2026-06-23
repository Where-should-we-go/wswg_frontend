<script setup>
// TripEditor — 여행 계획 블록 에디터 최상위 (S6 협업 편집, 디자인시스템.md §6.2/§6.3).
// 앱 셸 안에서 본문 캔버스만 그린다(사이드바·토픽바 없음).
//   Z2 페이지 헤더: 커버 · 이모지 · 제목(인라인 편집) · 속성 테이블 + 협업 툴바(AvatarStack·동기화 배지).
//   Z3 뷰 탭: 📅 일정 / 🖼️ 갤러리 / 🗺️ 지도 / 📋 보드.
//   일정 뷰: 보조 토글로 레일 ↔ 캘린더 전환.
// 편집은 useTripEditor 로컬 낙관적 → updateTrip 전체 저장. 실시간(WS)은 mock stub.
import { ref } from 'vue'
import { toast } from 'vue-sonner'
import { AvatarStack } from '@/components/ui/avatar-stack'
import { LiveIndicator } from '@/components/ui/live-indicator'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import EmptyState from '@/components/common/EmptyState.vue'
import TripPropertyTable from './TripPropertyTable.vue'
import TripViewTabs from './TripViewTabs.vue'
import TripDayGroup from './TripDayGroup.vue'
import TripCalendar from './TripCalendar.vue'
import TripGalleryView from './TripGalleryView.vue'
import TripMapView from './TripMapView.vue'
import TripBoardView from './TripBoardView.vue'
import { useTripEditor } from '@/features/trip/lib/useTripEditor'
import { BLOCK_KINDS, typeEmojiOf } from '@/features/trip/lib/blockMeta'

const props = defineProps({
  trip: { type: Object, required: true },
  // 소유자 여부(삭제 노출). user_id === 현재 사용자.
  isOwner: { type: Boolean, default: false },
})

const emit = defineEmits(['delete'])

const ed = useTripEditor(props.trip)

// 일정 뷰 보조 토글: 'rail' | 'calendar'
const scheduleMode = ref('rail')

// 블록 드래그(보드 외 일정뷰 day 간 이동)
const draggingBlockId = ref(null)
function onBlockDragStart(id) {
  draggingBlockId.value = id
}
function onBlockDragEnd() {
  draggingBlockId.value = null
}
function onDropOnDay(date) {
  if (draggingBlockId.value) ed.moveBlockToDate(draggingBlockId.value, date)
  draggingBlockId.value = null
}

// 블록 추가(슬래시/+ 행). 추가 후 토스트.
function onAddBlock(koType, date) {
  ed.addBlock(koType, date)
  toast.success('블록을 더했어요')
}
function onAddAfter(id) {
  const b = ed.findBlock(id)
  if (b) onAddBlock(b.type, b.visitDate)
}

// 블록 메뉴(⋮): 데스크탑·모바일 공용 시트.
const menuBlock = ref(null)
function openMenu(block) {
  menuBlock.value = block
}
function closeMenu() {
  menuBlock.value = null
}
function deleteBlock() {
  if (menuBlock.value) {
    ed.removeBlock(menuBlock.value.id)
    toast('블록을 삭제했어요')
  }
  closeMenu()
}
function moveBlockDay(date) {
  if (menuBlock.value) ed.moveBlockToDate(menuBlock.value.id, date)
  closeMenu()
}

// 갤러리: 대표 미디어 선정.
function onSetRepresentative(blockId, mediaIndex) {
  ed.setRepresentative(blockId, mediaIndex)
  toast.success('대표 사진으로 선정했어요')
}

// 모바일 블록 추가 바텀시트
const addSheetOpen = ref(false)
const addSheetDate = ref(null)
function openAddSheet() {
  // 첫 날 기본. 날짜 없으면 막음.
  addSheetDate.value = ed.days.value[0]?.date ?? null
  addSheetOpen.value = true
}
function addFromSheet(koType) {
  if (addSheetDate.value) onAddBlock(koType, addSheetDate.value)
  addSheetOpen.value = false
}

// 삭제(여행 전체, D6 소유자)
const confirmDeleteOpen = ref(false)

// 동기화 배지 라벨
function syncLabel() {
  if (ed.syncState.value === 'saving') return '저장 중…'
  if (ed.syncState.value === 'error') return '저장 실패 · 다시 시도'
  return '실시간 동기화'
}
</script>

<template>
  <article class="relative mx-auto max-w-[820px] px-5 pt-[26px] pb-24 sm:px-10 lg:px-14 lg:pt-[30px]">
    <!-- 협업 툴바 (우상단): 동행 아바타 · 동기화 배지 -->
    <div class="mb-3 flex items-center justify-end gap-3">
      <AvatarStack :members="ed.trip.value.members" />
      <button
        v-if="ed.syncState.value === 'error'"
        type="button"
        class="inline-flex items-center gap-1.5 rounded-full bg-[var(--danger)]/10 px-2.5 py-1 text-[12px] font-semibold text-[var(--danger)]"
        @click="ed.flush()"
      >
        <span class="size-[7px] rounded-full bg-[var(--danger)]" /> {{ syncLabel() }}
      </button>
      <span
        v-else-if="ed.syncState.value === 'saving'"
        class="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[var(--ink-3)]"
      >
        <span class="size-[7px] animate-pulse rounded-full bg-[var(--ink-3)]" /> {{ syncLabel() }}
      </span>
      <LiveIndicator v-else :label="syncLabel()" />
    </div>

    <!-- 커버 -->
    <div
      class="mb-[18px] h-[120px] rounded-[10px] bg-[linear-gradient(120deg,#D4E4F7,#EAEFF6_50%,#F6EEDD)]"
    />
    <!-- 페이지 아이콘 -->
    <div class="-mt-[52px] mb-2 pl-1 text-[46px] leading-none">{{ ed.trip.value.icon }}</div>

    <!-- 타이틀(인라인 편집) -->
    <input
      :value="ed.trip.value.title"
      type="text"
      class="mt-[18px] mb-3.5 w-full bg-transparent text-[30px] font-extrabold tracking-[-0.03em] outline-none sm:text-[38px]"
      placeholder="여행 제목"
      @input="ed.setTitle($event.target.value)"
    />

    <!-- 속성 테이블 -->
    <TripPropertyTable :trip="ed.trip.value" />

    <div class="my-[18px] h-px bg-[var(--border)]" />

    <!-- 빈 상태(새 여행) -->
    <EmptyState
      v-if="ed.isEmpty.value"
      icon="🗒️"
      title="아직 일정이 비어 있어요! 첫 블록을 더해볼까요?"
      description="관광지·식당·이동·메모를 블록으로 쌓아 여행을 완성해요."
    >
      <Button @click="openAddSheet">＋ 첫 블록 더하기</Button>
    </EmptyState>

    <!-- 뷰 탭 -->
    <TripViewTabs v-else>
      <!-- 📅 일정: 레일 ↔ 캘린더 보조 토글 -->
      <template #schedule>
        <div class="mb-2 flex items-center gap-1">
          <button
            type="button"
            class="rounded-full px-3 py-1 text-[12.5px] font-medium transition-colors"
            :class="
              scheduleMode === 'rail'
                ? 'bg-[var(--selected-bg)] text-[var(--brand-ink)]'
                : 'text-[var(--ink-3)] hover:bg-[var(--hover)]'
            "
            @click="scheduleMode = 'rail'"
          >
            🗒️ 타임라인
          </button>
          <button
            type="button"
            class="rounded-full px-3 py-1 text-[12.5px] font-medium transition-colors"
            :class="
              scheduleMode === 'calendar'
                ? 'bg-[var(--selected-bg)] text-[var(--brand-ink)]'
                : 'text-[var(--ink-3)] hover:bg-[var(--hover)]'
            "
            @click="scheduleMode = 'calendar'"
          >
            📅 캘린더
          </button>
        </div>

        <!-- 레일(기본) -->
        <template v-if="scheduleMode === 'rail'">
          <TripDayGroup
            v-for="d in ed.days.value"
            :key="d.date"
            :day-index="d.dayIndex"
            :date="d.date"
            :blocks="d.blocks"
            :editors="ed.editorsByBlock.value"
            @edit-title="(id, t) => ed.patchBlock(id, { title: t })"
            @add-block="onAddBlock"
            @add-after="onAddAfter"
            @open-menu="openMenu"
            @block-dragstart="onBlockDragStart"
            @block-dragend="onBlockDragEnd"
            @drop-on-day="onDropOnDay"
          />
        </template>

        <!-- 캘린더(시간 그리드) -->
        <TripCalendar
          v-else
          :items="ed.items.value"
          :start-date="ed.trip.value.start_date"
        />
      </template>

      <!-- 🖼️ 갤러리 -->
      <template #gallery>
        <TripGalleryView :items="ed.items.value" @set-representative="onSetRepresentative" />
      </template>

      <!-- 🗺️ 지도 -->
      <template #map>
        <TripMapView :items="ed.items.value" />
      </template>

      <!-- 📋 보드(칸반) -->
      <template #board>
        <TripBoardView :days="ed.days.value" @move-block="ed.moveBlockToDate" />
      </template>
    </TripViewTabs>

    <!-- 소유자: 여행 삭제 -->
    <div v-if="isOwner && !ed.isEmpty.value" class="mt-12 border-t border-[var(--border)] pt-6">
      <Button variant="ghost" class="text-[var(--danger)]" @click="confirmDeleteOpen = true">
        여행 삭제하기
      </Button>
    </div>

    <!-- 모바일 플로팅 추가 버튼 -->
    <button
      v-if="!ed.isEmpty.value"
      type="button"
      class="fixed bottom-6 right-6 z-30 grid size-14 place-items-center rounded-full bg-[var(--brand)] text-[26px] text-white shadow-[var(--shadow-pop)] lg:hidden"
      aria-label="블록 추가"
      @click="openAddSheet"
    >
      ＋
    </button>

    <!-- 블록 메뉴 시트(데스크탑·모바일 공용) -->
    <Sheet :open="!!menuBlock" @update:open="(v) => !v && closeMenu()">
      <SheetContent side="bottom" class="rounded-t-[var(--radius-win)]">
        <SheetHeader>
          <SheetTitle>
            <span aria-hidden="true">{{ menuBlock ? typeEmojiOf(menuBlock.type) : '' }}</span>
            {{ menuBlock?.title || '블록' }}
          </SheetTitle>
        </SheetHeader>
        <div class="flex flex-col gap-1 px-4 pb-6">
          <p class="px-1 pb-1 text-[11.5px] text-[var(--ink-3)]">다른 날로 옮기기</p>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="d in ed.days.value"
              :key="d.date"
              type="button"
              class="rounded-full border border-[var(--border)] px-3 py-1 text-[12.5px] disabled:opacity-40"
              :disabled="menuBlock?.visitDate === d.date"
              @click="moveBlockDay(d.date)"
            >
              Day {{ d.dayIndex }}
            </button>
          </div>
          <button
            type="button"
            class="mt-3 rounded-[var(--radius)] px-3 py-2.5 text-left text-[14px] font-medium text-[var(--danger)] hover:bg-[var(--hover)]"
            @click="deleteBlock"
          >
            블록 삭제
          </button>
        </div>
      </SheetContent>
    </Sheet>

    <!-- 모바일 블록 추가 바텀시트 -->
    <Sheet v-model:open="addSheetOpen">
      <SheetContent side="bottom" class="rounded-t-[var(--radius-win)]">
        <SheetHeader>
          <SheetTitle>어떤 블록을 더할까요?</SheetTitle>
        </SheetHeader>
        <div class="grid grid-cols-2 gap-2 px-4 pb-6">
          <button
            v-for="kind in BLOCK_KINDS"
            :key="kind.typeKey"
            type="button"
            class="flex items-center gap-2.5 rounded-[var(--radius)] border border-[var(--border)] p-3 text-left hover:bg-[var(--hover)]"
            @click="addFromSheet(kind.koType)"
          >
            <span class="grid size-9 place-items-center rounded-md bg-[var(--sunken)] text-[18px]">{{
              kind.emoji
            }}</span>
            <span class="min-w-0">
              <span class="block text-[13.5px] font-semibold">{{ kind.title }}</span>
              <span class="block truncate text-[11px] text-[var(--ink-3)]">{{ kind.desc }}</span>
            </span>
          </button>
        </div>
      </SheetContent>
    </Sheet>

    <!-- 여행 삭제 확인 -->
    <Dialog v-model:open="confirmDeleteOpen">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>이 여행을 삭제할까요?</DialogTitle>
        </DialogHeader>
        <p class="text-[14px] text-[var(--ink-2)]">
          삭제하면 일정과 사진이 모두 사라져요. 이 작업은 되돌릴 수 없어요.
        </p>
        <DialogFooter>
          <Button variant="ghost" @click="confirmDeleteOpen = false">취소</Button>
          <Button variant="destructive" @click="emit('delete')">삭제</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </article>
</template>
