<script setup>
// S5 여행 자동 생성 (/plans/new) — 담당 A5.
// 앱 셸 안에서 본문 캔버스만 렌더. 지역·기간·인원·스타일 칩 → "자동 생성 ✨" →
// 진행 인디케이터 오버레이 → autoGeneratePlan → /trips/{tripId} 이동.
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Sparkles } from '@lucide/vue'
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { getGuguns, getSidos } from '@/services/attractions'
import { autoGeneratePlan } from '@/services/trips'
import { getGroups } from '@/services/groups'
import StyleChipGroup from '@/features/plan/StyleChipGroup.vue'
import FormSummaryBar from '@/features/plan/FormSummaryBar.vue'
import EmptyState from '@/components/common/EmptyState.vue'

const router = useRouter()
const route = useRoute()

const STYLE_OPTIONS = [
  { label: '바다', emoji: '🌊' },
  { label: '맛집', emoji: '🍜' },
  { label: '자연', emoji: '🏞️' },
  { label: '문화', emoji: '🏛️' },
  { label: '카페', emoji: '☕' },
  { label: '액티비티', emoji: '🎡' },
  { label: '쇼핑', emoji: '🛍️' },
  { label: '도보', emoji: '🚶' },
  { label: '야경', emoji: '🌙' },
  { label: '힐링', emoji: '🧘' },
]

// ── 옵션 로드 ────────────────────────────────────────────────
const sidos = ref([])
const guguns = ref([])
const groups = ref([])

// ── 폼 상태 ──────────────────────────────────────────────────
const sidoCode = ref(undefined)
const gugunCode = ref(undefined)
const startDate = ref('')
const endDate = ref('')
// 개인 여행(모임 없음) 기본 인원 = 1명. 모임을 고르면 아래 watch 에서 멤버 수로 맞춘다.
const DEFAULT_HEADCOUNT = 1
const headcount = ref(DEFAULT_HEADCOUNT)
const styles = ref([])
const groupId = ref(undefined)
const NOTE_MAX = 500
// 사용자가 직접 적는 자유 서술(원하는 여행). 선택 입력 — 생성 가능 조건엔 넣지 않는다.
const note = ref('')

const generating = ref(false)
// 후보 0건(empty) · 권한 403 · 모임 없음 → 화면에 머물며 EmptyState/안내 표시.
const emptyResult = ref(false)
const forbidden = ref(false)

// 라우트 쿼리로 모임 진입했는지.
const enteredAsGroup = computed(() => route.query.groupId != null)
// 모임 진입인데 선택 가능한 모임이 없을 때(옵션 로드 후 판정).
const noGroups = ref(false)

const sidoOptions = computed(() =>
  sidos.value.map((s) => ({ value: s.sidoCode, label: s.sidoName })),
)
const gugunOptions = computed(() =>
  guguns.value.map((g) => ({ value: g.gugunCode, label: g.gugunName })),
)
const groupOptions = computed(() => [
  { value: undefined, label: '개인 여행 (모임 없이)' },
  ...groups.value.map((g) => ({ value: g.groupId, label: `${g.emoji} ${g.groupName}` })),
])

onMounted(async () => {
  const [s, g] = await Promise.all([getSidos(), getGroups()])
  sidos.value = s
  groups.value = g
  // 모임 진입(?groupId=)인데 선택 가능한 모임이 없으면 빈 상태로.
  if (enteredAsGroup.value && g.length === 0) {
    noGroups.value = true
    return
  }
  // 쿼리로 들어온 모임을 기본 선택.
  if (enteredAsGroup.value) {
    const q = Number(route.query.groupId)
    if (g.some((it) => it.groupId === q)) groupId.value = q
  }
})

// 시/도 바뀌면 구/군 다시 로드 + 선택 초기화.
watch(sidoCode, async (code) => {
  gugunCode.value = undefined
  guguns.value = []
  if (code != null) guguns.value = await getGuguns(code)
})

// 모임을 고르면 인원 기본값을 그 모임의 멤버 수로 맞춘다(1~20 범위).
// 개인 여행(모임 없음)으로 되돌리면 기본값으로 복귀.
watch(groupId, (id) => {
  if (id == null) {
    headcount.value = DEFAULT_HEADCOUNT
    return
  }
  const g = groups.value.find((it) => it.groupId === id)
  if (g?.memberCount != null) {
    headcount.value = Math.min(20, Math.max(1, g.memberCount))
  }
})

// ── 기간 계산 ────────────────────────────────────────────────
const dayCount = computed(() => {
  if (!startDate.value || !endDate.value) return 0
  const start = new Date(startDate.value)
  const end = new Date(endDate.value)
  const diff = Math.round((end - start) / 86400000)
  return diff < 0 ? 0 : diff + 1
})
const nightCount = computed(() => (dayCount.value > 0 ? dayCount.value - 1 : 0))

const dateInvalid = computed(
  () => !!startDate.value && !!endDate.value && new Date(endDate.value) < new Date(startDate.value),
)

// ── 요약 ────────────────────────────────────────────────────
const regionLabel = computed(() => {
  const sido = sidos.value.find((s) => s.sidoCode === sidoCode.value)
  if (!sido) return ''
  const gugun = guguns.value.find((g) => g.gugunCode === gugunCode.value)
  return gugun ? `${sido.sidoName} ${gugun.gugunName}` : sido.sidoName
})

// ── 인원 스테퍼 ──────────────────────────────────────────────
function stepHeadcount(delta) {
  headcount.value = Math.min(20, Math.max(1, headcount.value + delta))
}

// ── 검증 ────────────────────────────────────────────────────
const canGenerate = computed(
  () =>
    sidoCode.value != null &&
    !!startDate.value &&
    !!endDate.value &&
    !dateInvalid.value &&
    styles.value.length >= 1 &&
    !generating.value,
)

// ── 자동 생성 ────────────────────────────────────────────────
async function generate() {
  if (!canGenerate.value) return
  generating.value = true
  emptyResult.value = false
  forbidden.value = false
  try {
    const { tripId, partial, empty } = await autoGeneratePlan({
      sidoCode: sidoCode.value,
      gugunCode: gugunCode.value,
      startDate: startDate.value,
      endDate: endDate.value,
      headcount: headcount.value,
      styles: styles.value,
      groupId: groupId.value,
      // 자유 서술 — 비어 있으면 보내지 않는다. 실서버(/api/plans/auto)에서 AI 프롬프트로 활용.
      note: note.value.trim() || undefined,
    })
    // 후보 0건 → 이동하지 않고 화면 잔류(입력 보존) + EmptyState.
    if (empty || tripId == null) {
      emptyResult.value = true
      generating.value = false
      return
    }
    await router.push(`/trips/${tripId}`)
    if (partial) {
      toast('후보가 적어 일부만 채웠어요')
    }
  } catch (err) {
    generating.value = false
    // 비멤버 groupId → 개인 여행 전환 안내(입력 보존).
    if (err?.status === 403) {
      forbidden.value = true
      toast.error('이 여행은 모임 멤버만 만들 수 있어요')
      return
    }
    toast.error('일정을 짜다가 문제가 생겼어요. 잠시 후 다시 시도해 주세요.')
  }
}

// 403 안내에서 개인 여행으로 전환(groupId 비우기).
function switchToPersonal() {
  groupId.value = undefined
  forbidden.value = false
}

function cancel() {
  router.back()
}
</script>

<template>
  <div class="relative mx-auto w-full max-w-3xl px-4 py-8 text-[var(--ink)] sm:px-6 sm:py-12">
    <header class="mb-6">
      <h1 class="text-2xl font-bold">어디로, 어떤 여행을 떠나볼까요?</h1>
      <p class="mt-1 text-sm text-[var(--ink-2)]">
        지역과 스타일만 고르면, 일정은 저희가 짜드릴게요.
      </p>
    </header>

    <!-- 모임 없음 빈 상태(모임 진입인데 선택 가능 모임 없음) -->
    <EmptyState
      v-if="noGroups"
      icon="👥"
      title="함께 갈 모임부터 만들어볼까요?"
      description="여행을 같이 짤 모임이 아직 없어요. 모임을 먼저 만들면 함께 떠날 수 있어요."
    >
      <Button type="button" @click="router.push('/groups')">모임 만들러 가기</Button>
    </EmptyState>

    <!-- 폼 캔버스 -->
    <template v-else>
    <div
      class="relative rounded-[var(--radius-win)] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-win)] sm:p-7"
    >
      <div class="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2">
        <!-- 1열: 지역 -->
        <section>
          <h2 class="mb-2 text-sm font-semibold text-[var(--ink)]">어디로 갈까요?</h2>
          <div class="grid grid-cols-2 gap-2">
            <Select v-model="sidoCode" :options="sidoOptions" placeholder="시/도" />
            <Select
              v-model="gugunCode"
              :options="gugunOptions"
              placeholder="구/군 (선택)"
              :disabled="sidoCode == null || gugunOptions.length === 0"
            />
          </div>
        </section>

        <!-- 2열: 인원 -->
        <section>
          <h2 class="mb-2 text-sm font-semibold text-[var(--ink)]">몇 명이 가나요?</h2>
          <div class="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="인원 줄이기"
              :disabled="headcount <= 1"
              @click="stepHeadcount(-1)"
            >
              −
            </Button>
            <span class="min-w-12 text-center text-lg font-semibold" aria-live="polite"
              >{{ headcount }}명</span
            >
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="인원 늘리기"
              :disabled="headcount >= 20"
              @click="stepHeadcount(1)"
            >
              +
            </Button>
          </div>
        </section>

        <!-- 1열: 기간 -->
        <section>
          <h2 class="mb-2 text-sm font-semibold text-[var(--ink)]">언제 떠나요?</h2>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="mb-1 block text-xs text-[var(--ink-3)]">떠나는 날</label>
              <Input v-model="startDate" type="date" />
            </div>
            <div>
              <label class="mb-1 block text-xs text-[var(--ink-3)]">돌아오는 날</label>
              <Input
                v-model="endDate"
                type="date"
                :class="dateInvalid ? 'border-[var(--danger)] focus-visible:border-[var(--danger)]' : ''"
              />
            </div>
          </div>
          <p v-if="dateInvalid" class="mt-2 text-xs text-[var(--danger)]">
            돌아오는 날이 떠나는 날보다 빨라요. 다시 골라볼까요?
          </p>
        </section>

        <!-- 2열: 스타일 -->
        <section>
          <h2 class="mb-2 text-sm font-semibold text-[var(--ink)]">어떤 여행을 원해요?</h2>
          <StyleChipGroup v-model="styles" :options="STYLE_OPTIONS" />
        </section>

        <!-- 자유 서술: 원하는 여행을 직접 작성 (선택) -->
        <section class="md:col-span-2">
          <h2 class="mb-2 text-sm font-semibold text-[var(--ink)]">
            원하는 여행을 자유롭게 적어주세요
            <span class="font-normal text-[var(--ink-3)]">(선택)</span>
          </h2>
          <Textarea
            v-model="note"
            rows="3"
            :maxlength="NOTE_MAX"
            placeholder="예) 조용한 곳에서 푹 쉬고 싶어요. 아이와 함께라 일정은 너무 빡빡하지 않게, 맛집 위주로 부탁해요."
          />
          <p class="mt-1 text-right text-xs text-[var(--ink-3)]">{{ note.length }}/{{ NOTE_MAX }}</p>
        </section>

        <!-- 모임 선택 (선택) -->
        <section class="md:col-span-2">
          <h2 class="mb-2 text-sm font-semibold text-[var(--ink)]">누구와 함께하나요?</h2>
          <Select v-model="groupId" :options="groupOptions" placeholder="개인 여행 (모임 없이)" />
        </section>
      </div>
    </div>

    <!-- 권한 403: 비멤버 groupId 안내 + 개인 여행 전환 -->
    <div
      v-if="forbidden"
      class="mt-4 rounded-[var(--radius-win)] border border-[var(--danger)] bg-[var(--card)] p-4 text-sm"
    >
      <p class="font-medium text-[var(--danger)]">이 여행은 모임 멤버만 만들 수 있어요</p>
      <p class="mt-1 text-[var(--ink-2)]">
        개인 여행으로 바꾸면 바로 만들 수 있어요. 모임 선택을 비워 볼까요?
      </p>
      <Button type="button" variant="outline" class="mt-3" @click="switchToPersonal">
        개인 여행으로 전환
      </Button>
    </div>

    <!-- 후보 0건: 이동하지 않고 이 화면에 머물며 안내(입력 보존) -->
    <EmptyState
      v-if="emptyResult"
      icon="🗺️"
      title="이 조건엔 갈 곳이 부족해요. 지역이나 스타일을 바꿔볼까요?"
      class="mt-4"
    />

    <!-- 액션바 (데스크탑: 캔버스 아래 / 모바일: 하단 고정 풀폭) -->
    <div
      class="fixed inset-x-0 bottom-0 z-20 flex flex-col gap-3 border-t border-[var(--border)] bg-[var(--card)] p-4 sm:static sm:mt-5 sm:flex-row sm:items-center sm:justify-between sm:rounded-[var(--radius-win)] sm:border sm:p-4 sm:shadow-[var(--shadow-win)]"
    >
      <FormSummaryBar
        :region="regionLabel"
        :nights="nightCount"
        :days="dayCount"
        :headcount="headcount"
        :styles="styles"
      />
      <div class="flex items-center gap-2">
        <Button type="button" variant="ghost" @click="cancel">취소</Button>
        <Button type="button" :disabled="!canGenerate" @click="generate">
          <Sparkles class="size-4" />
          자동 생성
        </Button>
      </div>
    </div>

    <!-- 진행 인디케이터 오버레이 -->
    <div
      v-if="generating"
      class="fixed inset-0 z-50 grid place-items-center bg-[var(--card)]/80 backdrop-blur-sm"
      role="status"
      aria-live="assertive"
    >
      <div class="flex flex-col items-center gap-4">
        <div
          class="size-10 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--brand)]"
        />
        <p class="text-base font-medium text-[var(--ink)]">일정을 짜고 있어요…</p>
        <p class="text-sm text-[var(--ink-3)]">잠깐이면 돼요. 곧 보여 드릴게요.</p>
      </div>
    </div>

      <!-- 모바일 고정 액션바에 본문이 가리지 않도록 여백 -->
      <div class="h-28 sm:hidden" aria-hidden="true" />
    </template>
  </div>
</template>
