<script setup>
// BlockTitleInput — 블록 제목 인라인 라이브 입력(노션식). 보드 카드·캘린더 트레이 등에서 재사용.
// uncontrolled input 으로 커서 보존, 한글 IME 조합 가드, 입력 즉시 commit(value) emit.
// 드래그 컨테이너 안에서도 쓸 수 있도록 pointerdown/click 전파를 막는다.
import { ref, watch, onMounted } from 'vue'

const props = defineProps({
  value: { type: String, default: '' },
  placeholder: { type: String, default: '제목을 적어 주세요' },
})
const emit = defineEmits(['commit', 'focus', 'blur'])

const el = ref(null)
const composing = ref(false)

onMounted(() => {
  if (el.value) el.value.value = props.value ?? ''
})

// 외부(원격/다른 뷰) 변경은 내가 편집 중이 아닐 때만 반영(커서 안 튐).
watch(
  () => props.value,
  (v) => {
    if (!el.value || document.activeElement === el.value) return
    if (el.value.value !== (v ?? '')) el.value.value = v ?? ''
  },
)

function onInput(e) {
  if (composing.value) return // 한글 조합 중엔 커밋 보류
  emit('commit', e.target.value)
}
function onCompositionEnd(e) {
  composing.value = false
  emit('commit', e.target.value)
}
</script>

<template>
  <input
    ref="el"
    type="text"
    :placeholder="placeholder"
    class="w-full min-w-0 bg-transparent outline-none placeholder:text-[var(--ink-3)]"
    @input="onInput"
    @compositionstart="composing = true"
    @compositionend="onCompositionEnd"
    @focus="emit('focus')"
    @blur="emit('blur')"
    @keydown.enter.prevent="el?.blur()"
    @pointerdown.stop
    @click.stop
  />
</template>
