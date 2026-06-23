<script setup>
// S9 모임 관리 `/groups` — 앱 셸 본문 캔버스.
// 데스크탑: 2분할(좌 모임 리스트 / 우 상세 패널).
// 모바일: 1열 리스트 → 카드 탭 시 상세로 push(인-뷰 전환), 생성·초대·멤버추가는 풀스크린 시트.
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, ChevronLeft, RefreshCcw } from '@lucide/vue'
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { AvatarStack } from '@/components/ui/avatar-stack'
import EmptyState from '@/components/common/EmptyState.vue'
import { getGroups, getGroup, removeMember } from '@/services/groups'
import GroupCreateDialog from '@/features/group/components/GroupCreateDialog.vue'
import GroupDetailPanel from '@/features/group/components/GroupDetailPanel.vue'
import InviteLinkDialog from '@/features/group/components/InviteLinkDialog.vue'
import AddMemberDialog from '@/features/group/components/AddMemberDialog.vue'
import { useIsMobile } from '@/features/group/composables/useIsMobile'

const router = useRouter()
const { isMobile } = useIsMobile()

// 리스트 상태
const groups = ref([])
const listLoading = ref(true)
const listError = ref(false)

// 상세 상태
const selectedId = ref(null)
const detail = ref(null)
const detailLoading = ref(false)
const removingId = ref(null)

// 다이얼로그/시트 열림
const createOpen = ref(false)
const inviteOpen = ref(false)
const addMemberOpen = ref(false)

// 모바일: 상세 화면으로 전환했는지
const mobileShowDetail = ref(false)

const hasGroups = computed(() => groups.value.length > 0)

async function loadGroups({ keepSelection = false } = {}) {
  listLoading.value = true
  listError.value = false
  try {
    groups.value = (await getGroups()) ?? []
    // 데스크탑은 첫 모임을 자동 선택해 우측 패널을 채워요.
    if (!keepSelection && !isMobile.value && hasGroups.value && selectedId.value == null) {
      selectGroup(groups.value[0].groupId)
    }
  } catch {
    listError.value = true
    toast.error('모임을 불러오지 못했어요. 다시 시도해 주세요.')
  } finally {
    listLoading.value = false
  }
}

async function loadDetail(id) {
  detailLoading.value = true
  try {
    detail.value = await getGroup(id)
  } catch {
    toast.error('모임 정보를 불러오지 못했어요.')
  } finally {
    detailLoading.value = false
  }
}

function selectGroup(id) {
  selectedId.value = id
  if (isMobile.value) mobileShowDetail.value = true
  loadDetail(id)
}

function backToList() {
  mobileShowDetail.value = false
}

function onCreated(group) {
  toast.success('새 모임을 만들었어요!')
  loadGroups({ keepSelection: true })
  if (group?.groupId != null) selectGroup(group.groupId)
}

function onMemberAdded() {
  toast.success('멤버를 추가했어요!')
  if (selectedId.value != null) loadDetail(selectedId.value)
  loadGroups({ keepSelection: true })
}

async function onRemoveMember(member) {
  if (selectedId.value == null) return
  if (!window.confirm(`'${member.name}'님을 모임에서 제거할까요?`)) return
  removingId.value = member.userId
  try {
    await removeMember(selectedId.value, member.userId)
    toast.success('멤버를 제거했어요.')
    await loadDetail(selectedId.value)
    loadGroups({ keepSelection: true })
  } catch {
    toast.error('멤버를 제거하지 못했어요. 다시 시도해 주세요.')
  } finally {
    removingId.value = null
  }
}

function goNewPlan() {
  router.push({ path: '/plans/new', query: { groupId: selectedId.value } })
}

function goMap() {
  if (selectedId.value != null) router.push(`/groups/${selectedId.value}/map`)
}

onMounted(() => loadGroups())
</script>

<template>
  <div class="flex h-full min-h-0 flex-col text-[var(--ink)] md:flex-row">
    <!-- 좌: 모임 리스트 -->
    <aside
      class="flex min-h-0 flex-col border-[var(--border)] md:w-[360px] md:shrink-0 md:border-r"
      :class="{ 'hidden md:flex': isMobile && mobileShowDetail }"
    >
      <div class="flex items-center justify-between gap-2 px-6 pt-6 pb-4">
        <div class="flex flex-col gap-1">
          <h1 class="text-[22px] font-extrabold tracking-tight">모임</h1>
          <p class="text-[13px] text-[var(--ink-3)]">함께 떠날 친구들, 모임으로 모아봐요</p>
        </div>
        <Button size="sm" @click="createOpen = true">
          <Plus class="size-4" />
          새 모임
        </Button>
      </div>

      <!-- 로딩 -->
      <div v-if="listLoading" class="flex flex-col gap-3 px-6">
        <Skeleton v-for="i in 3" :key="i" class="h-[84px] w-full rounded-[var(--radius-win)]" />
      </div>

      <!-- 에러 -->
      <div v-else-if="listError" class="flex flex-col items-center gap-3 px-6 py-16 text-center">
        <p class="text-[14px] text-[var(--ink-2)]">모임을 불러오지 못했어요.</p>
        <Button variant="outline" size="sm" @click="loadGroups()">
          <RefreshCcw class="size-4" />
          다시 시도
        </Button>
      </div>

      <!-- 빈 상태 -->
      <EmptyState
        v-else-if="!hasGroups"
        icon="🧑‍🤝‍🧑"
        title="아직 모임이 없어요!"
        description="첫 모임을 만들어 친구를 불러볼까요?"
      >
        <Button @click="createOpen = true">
          <Plus class="size-4" />
          새 모임 만들기
        </Button>
      </EmptyState>

      <!-- 리스트 -->
      <div v-else class="flex flex-col gap-2.5 overflow-y-auto px-6 pb-6">
        <Card
          v-for="g in groups"
          :key="g.groupId"
          role="button"
          tabindex="0"
          class="cursor-pointer gap-0 p-3.5 transition-colors hover:bg-[var(--hover)]"
          :class="
            !isMobile && selectedId === g.groupId
              ? 'border-[var(--brand)] bg-[var(--selected-bg)]'
              : ''
          "
          @click="selectGroup(g.groupId)"
          @keydown.enter="selectGroup(g.groupId)"
        >
          <div class="flex items-center gap-3">
            <div
              class="grid size-11 shrink-0 place-items-center rounded-[var(--radius-win)] bg-[var(--bg-subtle)] text-xl"
            >
              {{ g.emoji || '✨' }}
            </div>
            <div class="flex min-w-0 flex-1 flex-col gap-1">
              <span class="truncate text-[15px] font-bold">{{ g.groupName }}</span>
              <div class="flex items-center gap-2">
                <AvatarStack :members="g.members ?? []" :size="22" />
                <span class="text-[12px] text-[var(--ink-3)]">여행 {{ g.tripCount ?? 0 }}개</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </aside>

    <!-- 우: 상세 패널 -->
    <main
      class="min-h-0 flex-1 md:block"
      :class="isMobile ? (mobileShowDetail ? 'flex flex-col' : 'hidden') : 'block'"
    >
      <!-- 모바일 뒤로가기 -->
      <div v-if="isMobile && mobileShowDetail" class="px-4 pt-4">
        <Button variant="ghost" size="sm" class="-ml-2" @click="backToList">
          <ChevronLeft class="size-4" />
          모임 목록
        </Button>
      </div>

      <GroupDetailPanel
        v-if="selectedId != null"
        :group="detail"
        :loading="detailLoading"
        :removing-id="removingId"
        @invite="inviteOpen = true"
        @add-member="addMemberOpen = true"
        @remove-member="onRemoveMember"
        @go-new-plan="goNewPlan"
        @go-map="goMap"
      />

      <!-- 데스크탑: 아무 모임도 안 골랐을 때 -->
      <div
        v-else-if="!isMobile && !listLoading && hasGroups"
        class="grid h-full place-items-center px-6"
      >
        <p class="text-[14px] text-[var(--ink-3)]">왼쪽에서 모임을 골라 멤버를 관리해요.</p>
      </div>
    </main>

    <!-- 다이얼로그/시트 -->
    <GroupCreateDialog v-model:open="createOpen" @created="onCreated" />
    <InviteLinkDialog v-model:open="inviteOpen" :group-id="selectedId" />
    <AddMemberDialog v-model:open="addMemberOpen" :group-id="selectedId" @added="onMemberAdded" />
  </div>
</template>
