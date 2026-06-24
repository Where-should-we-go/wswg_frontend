<script setup>
// 모임 상세 패널 — 헤더 + 액션바(초대 링크·멤버 추가) + 멤버 목록 + "이 모임의 여행" 바로가기.
// group: getGroup 응답 { groupId, groupName, emoji, tripCount, members[], memberCount }
import { Link2, UserPlus, Map, Plus, ArrowRight } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import MemberList from './MemberList.vue'

defineProps({
  group: { type: Object, default: null },
  loading: { type: Boolean, default: false },
  removingId: { type: [String, Number], default: null },
})

const emit = defineEmits(['invite', 'add-member', 'remove-member', 'go-new-plan', 'go-map'])
</script>

<template>
  <section class="flex h-full flex-col">
    <!-- 로딩 -->
    <div v-if="loading" class="flex flex-col gap-5 p-6">
      <div class="flex items-center gap-3">
        <Skeleton class="size-12 rounded-[var(--radius-win)]" />
        <Skeleton class="h-6 w-40" />
      </div>
      <Skeleton class="h-9 w-full max-w-xs" />
      <div class="flex flex-col gap-3">
        <Skeleton class="h-12 w-full" />
        <Skeleton class="h-12 w-full" />
      </div>
    </div>

    <template v-else-if="group">
      <!-- 헤더 -->
      <header class="flex items-center gap-3 p-6 pb-4">
        <div
          class="grid size-12 shrink-0 place-items-center rounded-[var(--radius-win)] bg-[var(--bg-subtle)] text-2xl"
        >
          {{ group.emoji || '✨' }}
        </div>
        <div class="flex min-w-0 flex-col">
          <h2 class="truncate text-[20px] font-extrabold tracking-tight text-[var(--ink)]">
            {{ group.groupName }}
          </h2>
          <p class="text-[13px] text-[var(--ink-3)]">
            멤버 {{ group.memberCount ?? group.members?.length ?? 0 }}명 · 여행
            {{ group.tripCount ?? 0 }}개
          </p>
        </div>
      </header>

      <!-- 액션바 -->
      <div class="flex flex-wrap gap-2 px-6">
        <Button variant="outline" size="sm" @click="emit('invite')">
          <Link2 class="size-4" />
          초대 링크
        </Button>
        <Button variant="outline" size="sm" @click="emit('add-member')">
          <UserPlus class="size-4" />
          멤버 추가
        </Button>
      </div>

      <Separator class="my-5" />

      <!-- 멤버 목록 -->
      <div class="flex flex-1 flex-col overflow-y-auto px-4">
        <p class="px-2 pb-1 text-[11.5px] font-bold tracking-[0.05em] text-[var(--ink-3)] uppercase">
          멤버
        </p>
        <MemberList
          :members="group.members ?? []"
          :removing-id="removingId"
          @remove="(m) => emit('remove-member', m)"
        />

        <!-- 이 모임의 여행 바로가기 -->
        <Separator class="my-4" />
        <p class="px-2 pb-2 text-[11.5px] font-bold tracking-[0.05em] text-[var(--ink-3)] uppercase">
          이 모임의 여행
        </p>
        <div class="flex flex-col gap-2 px-2 pb-6">
          <button
            type="button"
            class="flex items-center gap-3 rounded-[var(--radius)] border border-[var(--border)] px-3 py-3 text-left transition-colors hover:bg-[var(--hover)]"
            @click="emit('go-new-plan')"
          >
            <span class="grid size-8 place-items-center rounded-[var(--radius)] bg-[var(--brand-soft)] text-[var(--brand)]">
              <Plus class="size-4" />
            </span>
            <span class="flex-1 text-[14px] font-semibold text-[var(--ink)]">새 여행 만들기</span>
            <ArrowRight class="size-4 text-[var(--ink-3)]" />
          </button>
          <button
            type="button"
            class="flex items-center gap-3 rounded-[var(--radius)] border border-[var(--border)] px-3 py-3 text-left transition-colors hover:bg-[var(--hover)]"
            @click="emit('go-map')"
          >
            <span class="grid size-8 place-items-center rounded-[var(--radius)] bg-[var(--bg-subtle)] text-[var(--ink-2)]">
              <Map class="size-4" />
            </span>
            <span class="flex-1 text-[14px] font-semibold text-[var(--ink)]">발자취 지도 보기</span>
            <ArrowRight class="size-4 text-[var(--ink-3)]" />
          </button>
        </div>
      </div>
    </template>
  </section>
</template>
