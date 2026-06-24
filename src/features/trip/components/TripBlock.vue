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
import { computed, ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { GripVertical, Plus, MoreVertical, ImagePlus, Mic, Square } from '@lucide/vue'
import { BlockTag } from '@/components/ui/block-tag'
import { PropertyPill } from '@/components/ui/property-pill'
import { CollabCaret } from '@/components/ui/collab-caret'
import MediaLightbox from './MediaLightbox.vue'
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
const canRecordAudio = computed(
  () =>
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof MediaRecorder !== 'undefined',
)
const recording = ref(false)
const recordError = ref('')
let recorder = null
let recordStream = null
let recordChunks = []
const isManual = computed(
  () => props.block.content_id === null || props.block.content_id === undefined,
)
const editingByOther = computed(() => !!props.editor)

const overline = computed(() =>
  overlineOf({ time: props.block.time, durationMin: props.block.durationMin }),
)

// ── 제목 라이브 인라인 편집(노션식) ───────────────────────
// 모드 전환 없이 항상 제자리 편집. 키 입력마다 즉시 반영하되, 한글 IME 조합 중에는
// 커밋하지 않는다(조합이 끝난 뒤 한 번). uncontrolled input 으로 커서 위치를 보존하고,
// 원격(다른 참가자) 변경은 내가 편집 중이 아닐 때만 DOM 에 반영한다.
const inputEl = ref(null)
const composing = ref(false)

onMounted(() => {
  if (inputEl.value) inputEl.value.value = props.block.title ?? ''
})

watch(
  () => props.block.title,
  (title) => {
    const el = inputEl.value
    if (!el || document.activeElement === el) return // 내가 타이핑 중이면 건드리지 않음
    if (el.value !== (title ?? '')) el.value = title ?? ''
  },
)

// uncontrolled + 포커스 중 DOM 미갱신(watch 가드)이라 조합 중에 커밋해도 IME 가 안 끊긴다.
// → 한글 조합 중에도 라이브 반영(조합 완료까지 기다리지 않음).
function onTitleInput(e) {
  emit('edit-title', props.block.id, e.target.value)
}
function onCompositionEnd(e) {
  composing.value = false
  emit('edit-title', props.block.id, e.target.value) // 최종 확정 보정
}

// ── 같은 날 순서 재배치(드래그핸들 ⋮⋮) ─────────────────────
// 핸들에서 드래그 시작, 다른 블록 위로 드롭하면 그 블록 앞으로 재배치(reorder).
const reorderOver = ref(false)
// 드롭 위치: 포인터가 블록 상단 절반이면 'before'(위), 하단 절반이면 'after'(아래).
const dropPos = ref('before')
const rootEl = ref(null)
const dragging = ref(false)
function onDragOver(ev) {
  if (props.readonly) return
  reorderOver.value = true
  const r = rootEl.value?.getBoundingClientRect()
  if (r) dropPos.value = ev.clientY - r.top > r.height / 2 ? 'after' : 'before'
}
function onHandleDragStart(ev) {
  // 드래그 고스트를 작은 핸들이 아니라 블록 카드 전체로 잡는다(노션식 반투명 미리보기가 따라옴).
  // setDragImage 는 호출 시점의 렌더를 스냅샷 → opacity 흐리기는 이 뒤에 적용해 고스트엔 영향 없음.
  if (ev.dataTransfer && rootEl.value) {
    ev.dataTransfer.effectAllowed = 'move'
    const r = rootEl.value.getBoundingClientRect()
    ev.dataTransfer.setDragImage(rootEl.value, ev.clientX - r.left, ev.clientY - r.top)
  }
  dragging.value = true
  emit('dragstart', props.block.id)
}
function onHandleDragEnd() {
  dragging.value = false
  emit('dragend')
}
function onBlockDrop() {
  reorderOver.value = false
  emit('reorder-drop', props.block.id, dropPos.value)
}

// ── 미디어 업로드(E1) ─────────────────────────────────────
const fileInput = ref(null)
const dropActive = ref(false)
// 썸네일 클릭 → 확대(라이트박스). 갤러리와 동일 컴포넌트(MediaLightbox), 보기 전용.
const previewMedia = ref(null)

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
  const files = [...(e.dataTransfer?.files ?? [])].filter(isSupportedMediaFile)
  if (files.length) emit('upload-media', props.block.id, files)
}
// 미디어 드롭존은 "파일" 드래그일 때만 가로챈다(stop). 블록 reorder 드래그면 막지 않아
// 이벤트가 블록으로 버블 → 블록 하단(=after 영역)에서도 순서/시간 끌어넣기가 동작한다.
function isFileDrag(e) {
  return !!e.dataTransfer && Array.from(e.dataTransfer.types || []).includes('Files')
}
function onMediaDragOver(e) {
  if (props.readonly || !isFileDrag(e)) return
  e.preventDefault()
  e.stopPropagation()
  dropActive.value = true
}
function onMediaDrop(e) {
  if (props.readonly || !isFileDrag(e)) return
  e.preventDefault()
  e.stopPropagation()
  onDrop(e)
}

function isSupportedMediaFile(file) {
  return (
    file.type.startsWith('image/') ||
    file.type.startsWith('video/') ||
    file.type.startsWith('audio/')
  )
}

function mediaIcon(mediaItem) {
  if (mediaItem.type === 'VIDEO') return '▶'
  if (mediaItem.type === 'AUDIO') return '🎙'
  return ''
}

function mediaLabel(mediaItem) {
  if (mediaItem.type === 'VIDEO') return '동영상'
  if (mediaItem.type === 'AUDIO') return '녹음'
  return '사진'
}

async function toggleRecording() {
  if (recording.value) {
    recorder?.stop()
    return
  }

  if (!canRecordAudio.value) {
    recordError.value = '이 브라우저에서는 녹음을 사용할 수 없어요.'
    return
  }

  recordError.value = ''
  try {
    recordStream = await navigator.mediaDevices.getUserMedia({ audio: true })
    recordChunks = []
    recorder = new MediaRecorder(recordStream)
    recorder.ondataavailable = (event) => {
      if (event.data?.size > 0) recordChunks.push(event.data)
    }
    recorder.onstop = () => {
      const mimeType = recorder?.mimeType || 'audio/webm'
      const file = new File([new Blob(recordChunks, { type: mimeType })], `recording-${Date.now()}.webm`, {
        type: mimeType,
      })
      stopRecordStream()
      recorder = null
      recording.value = false
      if (file.size > 0) emit('upload-media', props.block.id, [file])
    }
    recorder.start()
    recording.value = true
  } catch {
    stopRecordStream()
    recorder = null
    recording.value = false
    recordError.value = '마이크 권한을 확인해 주세요.'
  }
}

function stopRecordStream() {
  recordStream?.getTracks?.().forEach((track) => track.stop())
  recordStream = null
}

onBeforeUnmount(() => {
  if (recorder?.state === 'recording') recorder.stop()
  stopRecordStream()
})
</script>

<template>
  <div
    ref="rootEl"
    class="group relative flex gap-[11px] rounded-[7px] px-2 py-[9px] transition-[opacity,background-color] duration-150"
    :class="[
      editingByOther ? 'bg-[var(--selected-bg)]' : 'hover:bg-[var(--hover)]',
      dragging ? 'opacity-40' : '',
    ]"
    @dragover.prevent="onDragOver"
    @dragleave="reorderOver = false"
    @drop.prevent="!readonly && onBlockDrop()"
  >
    <!-- 드롭 위치 삽입 라인(노션식) — 상단 절반=위, 하단 절반=아래. -->
    <span
      v-if="reorderOver && !dragging"
      class="pointer-events-none absolute left-0 right-0 z-10 h-[2.5px] rounded-full bg-[var(--brand)]"
      :class="dropPos === 'after' ? '-bottom-px' : '-top-px'"
      aria-hidden="true"
    />
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
        @dragend="onHandleDragEnd"
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

      <!-- 제목 (노션식 라이브 인라인 편집 — 항상 제자리 편집, 모드 전환 없음) -->
      <div class="flex items-center text-[15.5px] font-medium leading-[1.4]">
        <input
          ref="inputEl"
          type="text"
          :readonly="readonly || editingByOther"
          placeholder="제목을 적어 주세요"
          class="min-w-0 flex-1 bg-transparent px-1 py-0.5 text-[15.5px] font-medium outline-none placeholder:text-[var(--ink-3)]"
          :class="readonly || editingByOther ? 'cursor-default' : 'cursor-text'"
          @input="onTitleInput"
          @compositionstart="composing = true"
          @compositionend="onCompositionEnd"
          @keydown.enter.prevent="inputEl?.blur()"
          @click.stop
        />
        <CollabCaret v-if="editingByOther" :name="editor.name" :color="editor.color" />
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
        @dragover="onMediaDragOver"
        @dragleave="dropActive = false"
        @drop="onMediaDrop"
      >
        <!-- 기존 미디어 -->
        <div
          v-for="(m, i) in media"
          :key="i"
          class="relative h-12 w-16 cursor-zoom-in overflow-hidden rounded-[7px] border border-[var(--border)] bg-[linear-gradient(135deg,#cfe0f5,#e7d9c6)]"
          role="button"
          :aria-label="`${mediaLabel(m)} 크게 보기`"
          @click.stop="previewMedia = m"
        >
          <img
            v-if="m.url && m.type === 'PHOTO'"
            :src="m.url"
            alt=""
            class="h-full w-full object-cover"
          />
          <span
            v-if="mediaIcon(m)"
            class="absolute inset-0 grid place-items-center bg-black/25 text-[16px] text-white"
            aria-hidden="true"
            >{{ mediaIcon(m) }}</span
          >
        </div>

        <!-- 업로드 중 스켈레톤 -->
        <div
          v-for="n in uploadingCount"
          :key="`up-${n}`"
          class="h-12 w-16 animate-pulse rounded-[7px] border border-[var(--border)] bg-[var(--sunken)]"
          aria-label="사진 올리는 중"
        />

        <!-- 파일 버튼 (사진·동영상·오디오, 데스크탑 드롭존 포함) -->
        <button
          v-if="!readonly"
          type="button"
          class="grid h-12 w-16 place-items-center rounded-[7px] border border-dashed border-[var(--border)] text-[var(--ink-3)] transition-colors hover:border-[var(--brand)] hover:text-[var(--brand)]"
          :title="dropActive ? '여기에 놓아 주세요' : '파일 추가 (사진·동영상·오디오)'"
          aria-label="파일 추가"
          @click="pickFiles"
        >
          <ImagePlus class="size-[18px]" />
        </button>
        <button
          v-if="!readonly"
          type="button"
          class="grid h-12 w-12 place-items-center rounded-[7px] border border-dashed border-[var(--border)] text-[var(--ink-3)] transition-colors hover:border-[var(--brand)] hover:text-[var(--brand)] disabled:cursor-not-allowed disabled:opacity-50"
          :class="recording ? 'border-[var(--danger)] text-[var(--danger)]' : ''"
          :disabled="!canRecordAudio"
          :aria-label="recording ? '녹음 중지' : '녹음 시작'"
          :title="recording ? '녹음 중지' : '녹음해서 올리기'"
          @click="toggleRecording"
        >
          <Square v-if="recording" class="size-[15px] fill-current" />
          <Mic v-else class="size-[17px]" />
        </button>
        <span
          v-if="!readonly && !media.length && !uploadingCount"
          class="text-[11.5px] text-[var(--ink-3)]"
          >사진·동영상·녹음</span
        >
        <span v-if="recording" class="text-[11.5px] font-semibold text-[var(--danger)]">
          녹음 중
        </span>
        <span v-else-if="recordError" class="text-[11.5px] text-[var(--danger)]">
          {{ recordError }}
        </span>
        <input
          v-if="!readonly"
          ref="fileInput"
          type="file"
          accept="image/*,video/*,audio/*"
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

    <!-- 썸네일 클릭 확대 — 갤러리와 동일 컴포넌트. 타임라인에선 보기 전용. -->
    <Teleport to="body">
      <MediaLightbox :media="previewMedia" :caption="block.title" @close="previewMedia = null" />
    </Teleport>
  </div>
</template>
