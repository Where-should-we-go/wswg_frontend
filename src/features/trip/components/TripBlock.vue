<script setup>
// TripBlock — data.items[] 한 블록의 레일형 표현 + S6 편집 인터랙션.
// 표시: 레일 점(타입색) · 선두 이모지 · 오버라인 시간 · 제목(+협업 카렛) · 타입태그 · region · 속성 pill · 미디어 썸네일.
// 편집(데스크탑 hover): 드래그핸들 ⋮⋮ · + 추가 · ⋮ 블록 메뉴. 제목 인라인 편집(클릭→input).
//   드래그핸들 ⋮⋮ 로 같은 날 안에서 위/아래 블록 위로 드롭 → 순서(order) 재배치(reorder).
//   다른 날 섹션 위로 드롭 → visitDate 변경(상위 day-group 에서 처리).
// 미디어(E1): ＋사진 버튼 + 파일 input(모바일 카메라/갤러리) · 데스크탑 드래그앤드롭 드롭존.
//   업로드 중 스켈레톤 썸네일 표시, 완료되면 media[] 에 append.
// 프레즌스: editor 있으면 옅은 배경(편집 중 표시) + CollabCaret.
// ui/ 프리미티브 + blockMeta 헬퍼만 조합. 색은 토큰만.
import { computed, ref, nextTick } from 'vue'
import { GripVertical, Plus, MoreVertical, ImagePlus } from '@lucide/vue'
import { BlockTag } from '@/components/ui/block-tag'
import { PropertyPill } from '@/components/ui/property-pill'
import { CollabCaret } from '@/components/ui/collab-caret'
import {
  typeKeyOf,
  typeEmojiOf,
  railColorOf,
  propertyPills,
  regionOf,
  overlineOf,
} from '@/features/trip/lib/blockMeta'

const props = defineProps({
  block: { type: Object, required: true },
  // 이 블록을 편집 중인 협업자 { name, color } | null
  editor: { type: Object, default: null },
  // 읽기 전용(모바일 조회 등에서 인라인 편집 끔)
  readonly: { type: Boolean, default: false },
  // 이 블록에 업로드 중인 미디어 개수(스켈레톤 표시용)
  uploadingCount: { type: Number, default: 0 },
})

const emit = defineEmits([
  'edit-title',
  'add-after',
  'open-menu',
  'dragstart',
  'dragend',
  'reorder-drop',
  'upload-media',
])

const typeKey = computed(() => typeKeyOf(props.block.type))
const emoji = computed(() => typeEmojiOf(props.block.type))
const railColor = computed(() => railColorOf(props.block.type))
const pills = computed(() => propertyPills(props.block.properties))
const region = computed(() => regionOf(props.block.properties))
const media = computed(() => props.block.media ?? [])
const isManual = computed(
  () => props.block.content_id === null || props.block.content_id === undefined,
)
const editingByOther = computed(() => !!props.editor)

const overline = computed(() =>
  overlineOf({ time: props.block.time, durationMin: props.block.durationMin }),
)

// ── 제목 인라인 편집 ───────────────────────────────────────
const editing = ref(false)
const draft = ref('')
const inputEl = ref(null)

async function startEdit() {
  if (props.readonly) return
  draft.value = props.block.title
  editing.value = true
  await nextTick()
  inputEl.value?.focus()
}
function commitEdit() {
  if (!editing.value) return
  editing.value = false
  if (draft.value !== props.block.title) emit('edit-title', props.block.id, draft.value)
}

// ── 같은 날 순서 재배치(드래그핸들 ⋮⋮) ─────────────────────
// 핸들에서 드래그 시작, 다른 블록 위로 드롭하면 그 블록 앞으로 재배치(reorder).
const reorderOver = ref(false)
function onHandleDragStart() {
  emit('dragstart', props.block.id)
}
function onBlockDrop() {
  reorderOver.value = false
  emit('reorder-drop', props.block.id)
}

// ── 미디어 업로드(E1) ─────────────────────────────────────
const fileInput = ref(null)
const dropActive = ref(false)

function pickFiles() {
  fileInput.value?.click()
}
function onFilesPicked(e) {
  const files = [...(e.target.files ?? [])]
  if (files.length) emit('upload-media', props.block.id, files)
  e.target.value = '' // 같은 파일 재선택 허용
}
function onDrop(e) {
  dropActive.value = false
  const files = [...(e.dataTransfer?.files ?? [])].filter((f) => f.type.startsWith('image/') || f.type.startsWith('video/'))
  if (files.length) emit('upload-media', props.block.id, files)
}
</script>

<template>
  <div
    class="group relative flex gap-[11px] rounded-[7px] px-2 py-[9px] transition-colors"
    :class="[
      editingByOther ? 'bg-[var(--selected-bg)]' : 'hover:bg-[var(--hover)]',
      reorderOver ? 'ring-2 ring-[var(--brand)]' : '',
    ]"
    @dragover.prevent="!readonly && (reorderOver = true)"
    @dragleave="reorderOver = false"
    @drop.prevent="!readonly && onBlockDrop()"
  >
    <!-- 레일 점(타입색) -->
    <span
      class="absolute top-4 size-[9px] rounded-full bg-[var(--background)] ring-[3px] ring-[var(--background)]"
      :style="{ left: '-26px', border: `2px solid ${railColor}` }"
      aria-hidden="true"
    />

    <!-- 드래그 핸들 + 추가(hover, 데스크탑) -->
    <div
      v-if="!readonly"
      class="absolute -left-12 top-[9px] hidden items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 lg:flex"
    >
      <button
        type="button"
        class="grid size-5 place-items-center rounded text-[var(--ink-3)] hover:bg-[var(--hover)]"
        aria-label="블록 추가"
        title="아래에 블록 추가"
        @click="emit('add-after', block.id)"
      >
        <Plus class="size-[15px]" />
      </button>
      <span
        class="grid size-5 cursor-grab place-items-center rounded text-[var(--ink-3)] hover:bg-[var(--hover)]"
        :draggable="true"
        aria-label="블록 이동·순서 변경"
        title="드래그해서 옮기기 · 순서 변경"
        @dragstart="onHandleDragStart"
        @dragend="emit('dragend')"
      >
        <GripVertical class="size-[15px]" />
      </span>
    </div>

    <!-- 선두 이모지 -->
    <span class="w-[22px] shrink-0 text-center text-[18px] leading-[1.4]" aria-hidden="true">{{
      emoji
    }}</span>

    <!-- 본문 -->
    <div class="min-w-0 flex-1">
      <!-- 오버라인 시간 -->
      <div
        class="mb-[3px] text-[10.5px] font-bold tracking-[0.05em] tabular-nums uppercase text-[var(--ink-3)]"
      >
        {{ overline }}
      </div>

      <!-- 제목 (인라인 편집) -->
      <div class="text-[15.5px] font-medium leading-[1.4]">
        <input
          v-if="editing"
          ref="inputEl"
          v-model="draft"
          type="text"
          class="w-full rounded-sm border border-[var(--brand)] bg-[var(--background)] px-1 py-0.5 text-[15.5px] font-medium outline-none"
          placeholder="제목을 적어 주세요"
          @blur="commitEdit"
          @keydown.enter.prevent="commitEdit"
          @keydown.esc="editing = false"
        />
        <template v-else>
          <span
            :class="readonly ? '' : 'cursor-text rounded-sm hover:bg-[var(--hover)]'"
            @click="startEdit"
            >{{ block.title || '제목을 적어 주세요' }}</span
          >
          <CollabCaret v-if="editingByOther" :name="editor.name" :color="editor.color" />
        </template>
      </div>

      <!-- 타입 태그 · region · 속성 pill · 직접추가 -->
      <div class="mt-[5px] flex flex-wrap items-center gap-2">
        <BlockTag :type="typeKey" />
        <span v-if="region" class="text-[12.5px] text-[var(--ink-3)]">{{ region }}</span>
        <PropertyPill v-for="p in pills" :key="p.key">
          <span aria-hidden="true">{{ p.emoji }}</span>{{ p.text }}
        </PropertyPill>
        <span v-if="isManual" class="text-[12.5px] text-[var(--ink-3)]">직접 추가</span>
      </div>

      <!-- 미디어 썸네일 스트립 + ＋사진 / 드롭존 (E1, 양쪽 1급) -->
      <div
        v-if="!readonly || media.length"
        class="mt-[9px] flex flex-wrap items-center gap-1.5 rounded-[9px] transition-colors"
        :class="dropActive ? 'bg-[var(--brand-soft)] p-1.5 ring-1 ring-[var(--brand)]' : ''"
        @dragover.prevent.stop="!readonly && (dropActive = true)"
        @dragleave.stop="dropActive = false"
        @drop.prevent.stop="!readonly && onDrop($event)"
      >
        <!-- 기존 미디어 -->
        <div
          v-for="(m, i) in media"
          :key="i"
          class="relative h-12 w-16 overflow-hidden rounded-[7px] border border-[var(--border)] bg-[linear-gradient(135deg,#cfe0f5,#e7d9c6)]"
        >
          <img v-if="m.url" :src="m.url" alt="" class="h-full w-full object-cover" />
          <span
            v-if="m.type === 'VIDEO'"
            class="absolute inset-0 grid place-items-center text-[11px] text-white"
            aria-label="동영상"
            >▶</span
          >
        </div>

        <!-- 업로드 중 스켈레톤 -->
        <div
          v-for="n in uploadingCount"
          :key="`up-${n}`"
          class="h-12 w-16 animate-pulse rounded-[7px] border border-[var(--border)] bg-[var(--sunken)]"
          aria-label="사진 올리는 중"
        />

        <!-- ＋사진 버튼 (모바일=카메라/갤러리, 데스크탑=클릭 + 드롭존) -->
        <button
          v-if="!readonly"
          type="button"
          class="grid h-12 w-16 place-items-center rounded-[7px] border border-dashed border-[var(--border)] text-[var(--ink-3)] transition-colors hover:border-[var(--brand)] hover:text-[var(--brand)]"
          :title="dropActive ? '여기에 놓아 주세요' : '사진 추가 (드래그앤드롭도 돼요)'"
          aria-label="사진 추가"
          @click="pickFiles"
        >
          <ImagePlus class="size-[18px]" />
        </button>
        <span
          v-if="!readonly && !media.length && !uploadingCount"
          class="text-[11.5px] text-[var(--ink-3)]"
          >＋ 사진</span
        >
        <input
          v-if="!readonly"
          ref="fileInput"
          type="file"
          accept="image/*,video/*"
          capture="environment"
          multiple
          class="hidden"
          @change="onFilesPicked"
        />
      </div>
    </div>

    <!-- 블록 메뉴 ⋮ (데스크탑 hover / 모바일 항상) -->
    <button
      v-if="!readonly"
      type="button"
      class="absolute right-1.5 top-[9px] grid size-6 place-items-center rounded text-[var(--ink-3)] opacity-100 transition-opacity hover:bg-[var(--hover)] lg:opacity-0 lg:group-hover:opacity-100"
      aria-label="블록 메뉴"
      @click="emit('open-menu', block)"
    >
      <MoreVertical class="size-4" />
    </button>
  </div>
</template>
