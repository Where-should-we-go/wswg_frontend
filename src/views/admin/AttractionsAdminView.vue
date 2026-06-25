<script setup>
// S-ADM 관광지 관리 `/admin/attractions` — 앱 셸 위 본문 캔버스만 그려요(사이드바·토픽바 제외).
// 헤더(추가·동기화·마지막 적재 시각) + 필터바 + 데이터 테이블 + Pagination + 푸터.
// CRUD = Dialog 폼, 삭제·동기화 = 확인 Dialog. 모바일(<768) 미지원 안내.
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useMediaQuery } from '@vueuse/core'
import { toast } from 'vue-sonner'
import { Plus, RefreshCw, Search, Monitor, AlertCircle } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Pagination } from '@/components/ui/pagination'
import EmptyState from '@/components/common/EmptyState.vue'
import DataTable from '@/features/admin/DataTable.vue'
import SyncProgress from '@/features/admin/SyncProgress.vue'
import AttractionFormDialog from '@/features/admin/AttractionFormDialog.vue'
import {
  searchAttractions,
  getSidos,
  getGuguns,
  getContentTypes,
  createAttraction,
  updateAttraction,
  deleteAttraction,
  triggerTourApiSync,
} from '@/services/attractions'

const isDesktop = useMediaQuery('(min-width: 768px)')

// ── 옵션 ──────────────────────────────────────────────────────
const sidoOptions = ref([])
const gugunOptions = ref([])
const typeOptions = ref([])
const typeNameById = ref({})

// ── 필터(입력 중) ─────────────────────────────────────────────
const draft = reactive({
  keyword: '',
  sidoCode: undefined,
  gugunCode: undefined,
  contentTypeId: undefined,
})
// 실제 적용된 필터(검색 시점에 복사).
const applied = reactive({ ...draft })

// ── 목록 상태 ─────────────────────────────────────────────────
const rows = ref([])
const page = ref(0)
const size = ref(10)
const totalElements = ref(0)
const loading = ref(false)
const loadError = ref(false)

// ── 동기화·다이얼로그 ─────────────────────────────────────────
const syncing = ref(false)
const lastSyncedAt = ref('')
const syncConfirmOpen = ref(false)

const formOpen = ref(false)
const formMode = ref('create')
const editing = ref(null)
const saving = ref(false)

const deleteOpen = ref(false)
const deleting = ref(false)
const target = ref(null)

const showEmpty = computed(() => !loading.value && !loadError.value && rows.value.length === 0)
const lastSyncedLabel = computed(() =>
  lastSyncedAt.value ? formatDateTime(lastSyncedAt.value) : '아직 적재 기록이 없어요',
)

function formatDateTime(iso) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

function decorate(list) {
  return list.map((a) => ({
    ...a,
    typeName: typeNameById.value[a.contentTypeId] ?? a.contentTypeId,
    source: a.source ?? (a.contentId == null ? 'MANUAL' : 'TOUR_API'),
  }))
}

async function loadList() {
  loading.value = true
  loadError.value = false
  try {
    const res = await searchAttractions({
      keyword: applied.keyword || undefined,
      sidoCode: applied.sidoCode ?? undefined,
      gugunCode: applied.gugunCode ?? undefined,
      contentTypeId: applied.contentTypeId ?? undefined,
      page: page.value,
      size: size.value,
    })
    rows.value = decorate(res.content ?? [])
    totalElements.value = res.totalElements ?? rows.value.length
    page.value = res.page ?? page.value
  } catch {
    loadError.value = true
    rows.value = []
    totalElements.value = 0
  } finally {
    loading.value = false
  }
}

async function loadGugunOptions(sidoCode) {
  if (sidoCode == null) {
    gugunOptions.value = []
    return
  }
  const list = await getGuguns(sidoCode)
  gugunOptions.value = list.map((g) => ({ value: g.gugunCode, label: g.gugunName }))
}

// 필터바 시/도 변경 → 구/군 옵션 갱신·선택 초기화.
watch(
  () => draft.sidoCode,
  async (next, prev) => {
    if (next === prev) return
    draft.gugunCode = undefined
    await loadGugunOptions(next)
  },
)

function onSearch() {
  Object.assign(applied, draft)
  page.value = 0
  loadList()
}

function onPage(p) {
  page.value = p
  loadList()
}

// ── CRUD ──────────────────────────────────────────────────────
function openCreate() {
  formMode.value = 'create'
  editing.value = null
  formOpen.value = true
}

function openEdit(row) {
  formMode.value = 'edit'
  editing.value = row
  formOpen.value = true
}

async function onFormSubmit(payload) {
  saving.value = true
  try {
    if (formMode.value === 'edit' && editing.value) {
      await updateAttraction(editing.value.no ?? editing.value.contentId, payload)
    } else {
      await createAttraction(payload)
    }
    formOpen.value = false
    toast.success('관광지 정보가 저장됐어요!')
    await loadList()
  } catch {
    toast.error('저장하지 못했어요. 잠시 후 다시 시도해주세요.')
  } finally {
    saving.value = false
  }
}

function askDelete(row) {
  target.value = row
  deleteOpen.value = true
}

async function confirmDelete() {
  if (!target.value) return
  deleting.value = true
  try {
    await deleteAttraction(target.value.no ?? target.value.contentId)
    deleteOpen.value = false
    toast.success('관광지를 삭제했어요.')
    // 마지막 행을 지워 페이지가 비면 한 칸 앞으로.
    if (rows.value.length === 1 && page.value > 0) page.value -= 1
    await loadList()
  } catch {
    toast.error('삭제하지 못했어요. 잠시 후 다시 시도해주세요.')
  } finally {
    deleting.value = false
    target.value = null
  }
}

// ── TourAPI 동기화 ────────────────────────────────────────────
async function confirmSync() {
  syncConfirmOpen.value = false
  syncing.value = true
  try {
    const res = await triggerTourApiSync()
    lastSyncedAt.value = res?.lastSyncedAt ?? new Date().toISOString()
    toast.success('최신 관광지 정보를 받아왔어요!')
    await loadList()
  } catch {
    toast.error('한국관광공사에서 데이터를 받지 못했어요. 잠시 후 다시 시도해주세요.')
  } finally {
    syncing.value = false
  }
}

onMounted(async () => {
  loadList()
  try {
    const [sidos, types] = await Promise.all([getSidos(), getContentTypes()])
    sidoOptions.value = sidos.map((s) => ({ value: s.sidoCode, label: s.sidoName }))
    typeOptions.value = types.map((t) => ({ value: t.contentTypeId, label: t.contentTypeName }))
    typeNameById.value = Object.fromEntries(
      types.map((t) => [t.contentTypeId, t.contentTypeName]),
    )
    // 이미 로드된 행에 타입명 입혀요.
    rows.value = decorate(rows.value)
  } catch {
    // 옵션 로드 실패는 조용히 — 목록 검색은 키워드로 가능.
  }
})
</script>

<template>
  <!-- 모바일 미지원 안내 -->
  <div v-if="!isDesktop" class="grid place-items-center px-6 py-20 text-center">
    <Monitor class="mb-3 size-10 text-[var(--ink-3)]" aria-hidden="true" />
    <p class="text-base font-semibold text-[var(--ink)]">관광지 관리는 데스크탑에서 이용해주세요</p>
    <p class="mt-1 text-sm text-[var(--ink-2)]">더 넓은 화면에서 편하게 관리할 수 있어요.</p>
  </div>

  <div v-else class="mx-auto flex max-w-6xl flex-col gap-5 px-6 py-6">
    <!-- ① 헤더 -->
    <header class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 class="text-xl font-semibold text-[var(--ink)]">관광지 관리</h1>
        <p class="mt-1 text-sm text-[var(--ink-2)]">관광지 정보를 깔끔하게 관리해요</p>
        <p class="mt-1 text-xs text-[var(--ink-3)]">마지막 적재 시각 · {{ lastSyncedLabel }}</p>
      </div>
      <div class="flex items-center gap-2">
        <Button variant="outline" :disabled="syncing" @click="syncConfirmOpen = true">
          <RefreshCw class="size-4" :class="syncing ? 'animate-spin' : ''" />
          TourAPI 동기화
        </Button>
        <Button @click="openCreate">
          <Plus class="size-4" />
          관광지 추가
        </Button>
      </div>
    </header>

    <!-- 동기화 진행 배너 -->
    <SyncProgress v-if="syncing" />

    <!-- ② 필터바 -->
    <form
      class="flex flex-wrap items-end gap-3 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] p-4"
      @submit.prevent="onSearch"
    >
      <div class="min-w-[200px] flex-1">
        <label class="mb-1.5 block text-xs font-medium text-[var(--ink-3)]">키워드</label>
        <Input v-model="draft.keyword" placeholder="제목으로 검색해요" />
      </div>
      <div class="w-36">
        <label class="mb-1.5 block text-xs font-medium text-[var(--ink-3)]">시 / 도</label>
        <Select v-model="draft.sidoCode" :options="sidoOptions" placeholder="전체" />
      </div>
      <div class="w-36">
        <label class="mb-1.5 block text-xs font-medium text-[var(--ink-3)]">구 / 군</label>
        <Select
          v-model="draft.gugunCode"
          :options="gugunOptions"
          placeholder="전체"
          :disabled="!gugunOptions.length"
        />
      </div>
      <div class="w-40">
        <label class="mb-1.5 block text-xs font-medium text-[var(--ink-3)]">콘텐츠 타입</label>
        <Select v-model="draft.contentTypeId" :options="typeOptions" placeholder="전체" />
      </div>
      <Button type="submit" variant="secondary">
        <Search class="size-4" />
        검색
      </Button>
    </form>

    <!-- ③ 데이터 테이블 / 상태 -->
    <div
      v-if="loadError"
      class="flex flex-col items-center gap-3 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] px-6 py-14 text-center"
    >
      <AlertCircle class="size-8 text-[var(--danger)]" aria-hidden="true" />
      <p class="text-sm text-[var(--ink-2)]">목록을 불러오지 못했어요. 다시 시도해볼까요?</p>
      <Button variant="outline" @click="loadList">다시 시도</Button>
    </div>

    <EmptyState
      v-else-if="showEmpty"
      icon="🧭"
      title="조건에 맞는 관광지가 없어요"
      description="필터를 바꾸거나 새로 추가해볼까요?"
    >
      <Button @click="openCreate">
        <Plus class="size-4" />
        관광지 추가
      </Button>
    </EmptyState>

    <template v-else>
      <DataTable
        :rows="rows"
        :loading="loading"
        :page="page"
        :size="size"
        @edit="openEdit"
        @delete="askDelete"
      />

      <Pagination
        :page="page"
        :size="size"
        :total-elements="totalElements"
        @update:page="onPage"
      />
    </template>

    <!-- ④ 푸터 -->
    <footer class="text-xs text-[var(--ink-3)]">
      총 {{ totalElements }}건 · 페이지당 {{ size }}건
    </footer>
  </div>

  <!-- CRUD 폼 다이얼로그 -->
  <AttractionFormDialog
    v-model:open="formOpen"
    :mode="formMode"
    :attraction="editing"
    :sidos="sidoOptions"
    :content-types="typeOptions"
    :saving="saving"
    @submit="onFormSubmit"
  />

  <!-- 삭제 확인 -->
  <Dialog v-model:open="deleteOpen">
    <DialogContent class="sm:max-w-[420px]">
      <DialogHeader>
        <DialogTitle>관광지를 삭제할까요?</DialogTitle>
        <DialogDescription>
          “{{ target?.title }}” 정보가 사라져요. 이 작업은 되돌릴 수 없어요.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline" :disabled="deleting" @click="deleteOpen = false">취소</Button>
        <Button variant="destructive" :disabled="deleting" @click="confirmDelete">
          {{ deleting ? '삭제 중…' : '삭제' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <!-- 동기화 확인 -->
  <Dialog v-model:open="syncConfirmOpen">
    <DialogContent class="sm:max-w-[440px]">
      <DialogHeader>
        <DialogTitle>TourAPI 동기화</DialogTitle>
        <DialogDescription>
          지금 한국관광공사에서 최신 관광지 정보를 받아올까요?
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline" @click="syncConfirmOpen = false">취소</Button>
        <Button @click="confirmSync">동기화 시작</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
