<script setup>
// AttractionPickerDialog — 블록 추가 "관광지" 선택 시 뜨는 검색·선택 다이얼로그.
// 키워드 + 시/도·구/군으로 TourAPI 관광지를 검색하고, 결과를 클릭하면 그 장소를
// 블록으로 가져온다(pick 이벤트). 데이터는 서비스 레이어(@/services/attractions)만 사용.
import { ref, reactive, computed, watch } from 'vue'
import { Search } from '@lucide/vue'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import EmptyState from '@/components/common/EmptyState.vue'
import { getSidos, getGuguns, searchAttractions } from '@/services/attractions'

const props = defineProps({
  open: { type: Boolean, default: false },
  // 추가될 일차(YYYY-MM-DD) — 헤더 안내용
  date: { type: String, default: null },
})
const emit = defineEmits(['update:open', 'pick'])

const PAGE_SIZE = 12

const sidos = ref([])
const guguns = ref([])
const optionsLoaded = ref(false)
const form = reactive({ keyword: '', sidoCode: undefined, gugunCode: undefined })

const results = ref([])
const loading = ref(false)
const searched = ref(false)

const sidoOptions = computed(() => sidos.value.map((s) => ({ value: s.sidoCode, label: s.sidoName })))
const gugunOptions = computed(() =>
  guguns.value.map((g) => ({ value: g.gugunCode, label: g.gugunName })),
)

async function ensureOptions() {
  if (optionsLoaded.value) return
  optionsLoaded.value = true
  try {
    sidos.value = await getSidos()
  } catch {
    sidos.value = []
  }
}

// 다이얼로그가 열릴 때 옵션 로드 + (처음이면) 기본 검색.
watch(
  () => props.open,
  (o) => {
    if (!o) return
    ensureOptions()
    if (!searched.value) runSearch()
  },
)

// 시/도 변경 시 구/군 옵션 갱신.
watch(
  () => form.sidoCode,
  async (code) => {
    form.gugunCode = undefined
    guguns.value = []
    if (code == null) return
    try {
      guguns.value = await getGuguns(code)
    } catch {
      guguns.value = []
    }
  },
)

async function runSearch() {
  loading.value = true
  searched.value = true
  try {
    const res = await searchAttractions({
      keyword: form.keyword.trim() || undefined,
      sidoCode: form.sidoCode ?? undefined,
      gugunCode: form.gugunCode ?? undefined,
      page: 0,
      size: PAGE_SIZE,
    })
    results.value = res?.content ?? []
  } catch {
    results.value = []
  } finally {
    loading.value = false
  }
}

function regionLabel(a) {
  return [a.sidoName, a.gugunName].filter(Boolean).join(' ')
}

function pick(a) {
  emit('pick', a)
  emit('update:open', false)
}

// 직접 추가(커스텀) — TourAPI 에 없는 장소를 키워드를 이름으로 삼아 추가. content_id 는 null.
const customTitle = computed(() => form.keyword.trim())
function addCustom() {
  const title = customTitle.value
  if (!title) return
  const sido = sidos.value.find((s) => s.sidoCode === form.sidoCode)
  const gugun = guguns.value.find((g) => g.gugunCode === form.gugunCode)
  emit('pick', {
    contentId: null, // 직접 추가 → TourAPI 참조 없음
    title,
    contentTypeId: 12, // 관광
    sidoName: sido?.sidoName,
    gugunName: gugun?.gugunName,
  })
  emit('update:open', false)
}
</script>

<template>
  <Dialog :open="open" @update:open="(v) => emit('update:open', v)">
    <DialogContent class="max-w-[640px]">
      <DialogHeader>
        <DialogTitle>관광지 검색해서 추가<span v-if="date" class="text-[var(--ink-3)]"> · {{ date }}</span></DialogTitle>
      </DialogHeader>

      <!-- 검색바 -->
      <div class="flex flex-wrap items-center gap-2">
        <div class="relative min-w-[170px] flex-1">
          <Search
            class="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-[var(--ink-3)]"
          />
          <Input
            v-model="form.keyword"
            placeholder="관광지·장소 이름"
            class="pl-8"
            @keyup.enter="runSearch"
          />
        </div>
        <Select v-model="form.sidoCode" :options="sidoOptions" placeholder="시/도" class="w-[104px]" />
        <Select
          v-model="form.gugunCode"
          :options="gugunOptions"
          placeholder="구/군"
          class="w-[104px]"
        />
        <Button class="shrink-0" @click="runSearch">
          <Search class="mr-1 size-4" /> 검색
        </Button>
      </div>

      <!-- 결과 목록 -->
      <div class="mt-3 max-h-[46vh] space-y-1.5 overflow-y-auto pr-1">
        <!-- 직접 추가(커스텀) — 키워드가 있으면 항상 맨 위에 노출 -->
        <button
          v-if="customTitle"
          type="button"
          class="flex w-full items-center gap-3 rounded-lg border border-dashed border-[var(--border)] p-2 text-left transition-colors hover:border-[var(--brand)] hover:bg-[var(--hover)]"
          @click="addCustom"
        >
          <span
            class="grid size-12 shrink-0 place-items-center rounded-md bg-[var(--sunken)] text-[18px]"
            aria-hidden="true"
            >✏️</span
          >
          <span class="min-w-0 flex-1">
            <span class="block truncate text-[14px] font-semibold text-[var(--ink)]"
              >‘{{ customTitle }}’ 직접 추가</span
            >
            <span class="block truncate text-[12px] text-[var(--ink-3)]"
              >TourAPI에 없는 나만의 장소로 추가해요</span
            >
          </span>
          <span class="shrink-0 text-[12px] font-semibold text-[var(--brand)]">＋ 추가</span>
        </button>

        <template v-if="loading">
          <Skeleton v-for="i in 5" :key="i" class="h-[64px] w-full rounded-lg" />
        </template>
        <template v-else-if="results.length">
          <button
            v-for="a in results"
            :key="a.contentId"
            type="button"
            class="flex w-full items-center gap-3 rounded-lg border border-[var(--border)] p-2 text-left transition-colors hover:border-[var(--brand)] hover:bg-[var(--hover)]"
            @click="pick(a)"
          >
            <img
              v-if="a.firstImage1"
              :src="a.firstImage1"
              alt=""
              class="size-12 shrink-0 rounded-md object-cover"
            />
            <span
              v-else
              class="grid size-12 shrink-0 place-items-center rounded-md bg-[var(--sunken)] text-[18px]"
              aria-hidden="true"
              >📍</span
            >
            <span class="min-w-0 flex-1">
              <span class="block truncate text-[14px] font-semibold text-[var(--ink)]">{{
                a.title
              }}</span>
              <span class="block truncate text-[12px] text-[var(--ink-3)]">
                {{ regionLabel(a) }}<template v-if="a.addr1"> · {{ a.addr1 }}</template>
              </span>
            </span>
            <span class="shrink-0 text-[12px] font-semibold text-[var(--brand)]">＋ 추가</span>
          </button>
        </template>
        <EmptyState
          v-else-if="searched && !customTitle"
          icon="🔍"
          title="검색 결과가 없어요"
          description="이름을 입력하면 직접 추가할 수 있어요"
        />
      </div>
    </DialogContent>
  </Dialog>
</template>
