<script setup>
// TripEditorView — /trips/:id 라우트 본문 (S6 여행 편집·협업). AppShell 안에서 렌더.
// route param id → getTrip(id). 로딩(Skeleton) · 404/403(멤버 안내) · 정상(TripEditor) 분기.
// 삭제(D6 소유자) → deleteTrip → /mypage.
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { getTrip, deleteTrip } from '@/services/trips'
import { getCurrentUser } from '@/services/auth'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import EmptyState from '@/components/common/EmptyState.vue'
import { TripEditor } from '@/features/trip/components'

const route = useRoute()
const router = useRouter()

const trip = ref(null)
const loading = ref(true)
const errorStatus = ref(null) // 404 | 403 | null
const currentUserId = ref(null)

// 삭제 권한: 개인 여행은 본인, 그룹 여행은 그룹 소유자(백엔드 validateWritable과 일치).
const canDelete = computed(() => {
  const t = trip.value
  const uid = currentUserId.value
  if (!t || !uid) return false
  if (t.user_id != null) return t.user_id === uid
  const owner = (t.members ?? []).find((m) => m.role === 'OWNER')
  return owner != null && owner.userId === uid
})

async function load(id) {
  loading.value = true
  errorStatus.value = null
  trip.value = null
  try {
    getCurrentUser()
      .then((me) => (currentUserId.value = me?.id ?? null))
      .catch(() => (currentUserId.value = null))
    trip.value = await getTrip(id)
  } catch (err) {
    // mock 은 없는 여행을 404(멤버만 열람) 로 던진다. 권한(403)도 같은 안내로.
    errorStatus.value = err?.status === 403 ? 403 : 404
  } finally {
    loading.value = false
  }
}

watch(
  () => route.params.id,
  (id) => id && load(id),
  { immediate: true },
)

async function onDelete() {
  try {
    await deleteTrip(route.params.id)
    toast.success('여행을 삭제했어요')
    router.push('/mypage')
  } catch {
    toast.error('삭제하지 못했어요. 잠시 후 다시 시도해 주세요')
  }
}
</script>

<template>
  <!-- 로딩(Skeleton) -->
  <div v-if="loading" class="mx-auto max-w-[820px] px-5 pt-[30px] sm:px-10 lg:px-14">
    <Skeleton class="mb-[18px] h-[120px] w-full rounded-[10px]" />
    <Skeleton class="mb-3.5 h-10 w-2/3" />
    <div class="space-y-2">
      <Skeleton class="h-6 w-1/2" />
      <Skeleton class="h-6 w-1/3" />
      <Skeleton class="h-6 w-2/5" />
    </div>
    <Skeleton class="mt-6 h-9 w-72" />
    <div class="mt-5 space-y-3">
      <Skeleton class="h-16 w-full" />
      <Skeleton class="h-16 w-full" />
      <Skeleton class="h-16 w-full" />
    </div>
  </div>

  <!-- 404 / 403 — 멤버 안내 -->
  <EmptyState
    v-else-if="errorStatus"
    icon="🔒"
    title="이 여행은 모임 멤버만 볼 수 있어요"
    description="초대받은 모임의 멤버인지 확인해 주세요. 링크가 잘못되었을 수도 있어요."
  >
    <Button variant="outline" @click="router.push('/mypage')">내 여행으로 가기</Button>
  </EmptyState>

  <!-- 정상 -->
  <TripEditor v-else-if="trip" :trip="trip" :can-delete="canDelete" @delete="onDelete" />
</template>
