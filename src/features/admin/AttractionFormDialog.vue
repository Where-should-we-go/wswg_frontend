<script setup>
// S-ADM 관광지 추가·수정 폼 Dialog. mode='create'|'edit'.
// 입력: title·sidoCode·gugunCode·contentTypeId·addr1·tel·homepage·overview·firstImage1.
import { ref, reactive, watch, computed } from 'vue'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { getGuguns } from '@/services/attractions'

const props = defineProps({
  open: { type: Boolean, default: false },
  mode: { type: String, default: 'create' }, // 'create' | 'edit'
  attraction: { type: Object, default: null },
  sidos: { type: Array, default: () => [] }, // [{ value, label }]
  contentTypes: { type: Array, default: () => [] }, // [{ value, label }]
  saving: { type: Boolean, default: false },
})
const emit = defineEmits(['update:open', 'submit'])

const blank = () => ({
  title: '',
  sidoCode: undefined,
  gugunCode: undefined,
  contentTypeId: undefined,
  addr1: '',
  tel: '',
  homepage: '',
  overview: '',
  firstImage1: '',
})

const form = reactive(blank())
const gugunOptions = ref([])

const isEdit = computed(() => props.mode === 'edit')
const title = computed(() => (isEdit.value ? '관광지 수정' : '관광지 추가'))
const canSubmit = computed(
  () => form.title.trim() && form.sidoCode != null && form.contentTypeId != null,
)

async function loadGuguns(sidoCode) {
  if (sidoCode == null) {
    gugunOptions.value = []
    return
  }
  const list = await getGuguns(sidoCode)
  gugunOptions.value = list.map((g) => ({ value: g.gugunCode, label: g.gugunName }))
}

// 다이얼로그가 열릴 때 폼을 채워요(수정이면 기존값).
watch(
  () => props.open,
  async (open) => {
    if (!open) return
    Object.assign(form, blank())
    if (isEdit.value && props.attraction) {
      const a = props.attraction
      Object.assign(form, {
        title: a.title ?? '',
        sidoCode: a.sidoCode ?? undefined,
        gugunCode: a.gugunCode ?? undefined,
        contentTypeId: a.contentTypeId ?? undefined,
        addr1: a.addr1 ?? '',
        tel: a.tel ?? '',
        homepage: a.homepage ?? '',
        overview: a.overview ?? '',
        firstImage1: a.firstImage1 ?? '',
      })
    }
    await loadGuguns(form.sidoCode)
  },
)

// 시/도가 바뀌면 구/군을 다시 불러오고 선택을 비워요.
watch(
  () => form.sidoCode,
  async (next, prev) => {
    if (!props.open || next === prev) return
    form.gugunCode = undefined
    await loadGuguns(next)
  },
)

function onSubmit() {
  if (!canSubmit.value || props.saving) return
  emit('submit', { ...form })
}
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="sm:max-w-[560px]">
      <DialogHeader>
        <DialogTitle>{{ title }}</DialogTitle>
        <DialogDescription>관광지 정보를 입력해 주세요. 제목·시/도·타입은 필수예요.</DialogDescription>
      </DialogHeader>

      <form class="grid gap-4 py-2" @submit.prevent="onSubmit">
        <label class="grid gap-1.5">
          <span class="text-sm font-medium text-[var(--ink)]">제목 *</span>
          <Input v-model="form.title" placeholder="예: 경복궁" />
        </label>

        <div class="grid grid-cols-2 gap-3">
          <label class="grid gap-1.5">
            <span class="text-sm font-medium text-[var(--ink)]">시 / 도 *</span>
            <Select v-model="form.sidoCode" :options="sidos" placeholder="시/도 선택" />
          </label>
          <label class="grid gap-1.5">
            <span class="text-sm font-medium text-[var(--ink)]">구 / 군</span>
            <Select
              v-model="form.gugunCode"
              :options="gugunOptions"
              placeholder="구/군 선택"
              :disabled="!gugunOptions.length"
            />
          </label>
        </div>

        <label class="grid gap-1.5">
          <span class="text-sm font-medium text-[var(--ink)]">콘텐츠 타입 *</span>
          <Select
            v-model="form.contentTypeId"
            :options="contentTypes"
            placeholder="타입 선택"
          />
        </label>

        <label class="grid gap-1.5">
          <span class="text-sm font-medium text-[var(--ink)]">주소</span>
          <Input v-model="form.addr1" placeholder="도로명 주소" />
        </label>

        <div class="grid grid-cols-2 gap-3">
          <label class="grid gap-1.5">
            <span class="text-sm font-medium text-[var(--ink)]">전화</span>
            <Input v-model="form.tel" placeholder="02-0000-0000" />
          </label>
          <label class="grid gap-1.5">
            <span class="text-sm font-medium text-[var(--ink)]">홈페이지</span>
            <Input v-model="form.homepage" placeholder="https://" />
          </label>
        </div>

        <label class="grid gap-1.5">
          <span class="text-sm font-medium text-[var(--ink)]">이미지 URL</span>
          <Input v-model="form.firstImage1" placeholder="https://" />
        </label>

        <label class="grid gap-1.5">
          <span class="text-sm font-medium text-[var(--ink)]">소개</span>
          <textarea
            v-model="form.overview"
            rows="3"
            placeholder="관광지 소개를 적어 주세요"
            class="w-full rounded-md border border-[var(--input)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--ink)] outline-none focus-visible:border-[var(--ring)] focus-visible:ring-[3px] focus-visible:ring-[var(--ring)]/40"
          />
        </label>
      </form>

      <DialogFooter>
        <Button variant="outline" :disabled="saving" @click="emit('update:open', false)">
          취소
        </Button>
        <Button :disabled="!canSubmit || saving" @click="onSubmit">
          {{ saving ? '저장 중…' : '저장' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
