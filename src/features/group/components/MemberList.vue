<script setup>
// 멤버 목록. 각 행: 아바타 · 이름 · 역할 · 생성자(OWNER) 배지 · 멤버 제거 버튼.
// members: [{ userId, name, profileImageUrl, role, joinedAt }]
import { computed } from 'vue'
import { Trash2 } from '@lucide/vue'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const props = defineProps({
  members: { type: Array, default: () => [] },
  removingId: { type: [String, Number], default: null },
})

const emit = defineEmits(['remove'])

const ROTATION = ['var(--collab-1)', 'var(--collab-2)', 'var(--collab-3)']

const rows = computed(() =>
  props.members.map((m, i) => ({
    ...m,
    initial: m.name ? m.name.charAt(0) : '?',
    color: ROTATION[i % ROTATION.length],
    isOwner: m.role === 'OWNER',
  })),
)

// 멤버가 생성자 1명뿐이면 동행인을 부르도록 안내해요(§7 빈 카피).
const isSolo = computed(() => props.members.length <= 1)

function roleLabel(role) {
  return role === 'OWNER' ? '관리자' : '멤버'
}
</script>

<template>
  <ul class="flex flex-col">
    <li
      v-for="m in rows"
      :key="m.userId"
      class="group flex items-center gap-3 rounded-[var(--radius)] px-2 py-2.5 hover:bg-[var(--hover)]"
    >
      <Avatar
        class="size-9 shrink-0 text-[13px] font-bold text-white"
        :style="{ backgroundColor: m.color }"
      >
        <AvatarImage v-if="m.profileImageUrl" :src="m.profileImageUrl" :alt="m.name" />
        <AvatarFallback class="bg-transparent text-white">{{ m.initial }}</AvatarFallback>
      </Avatar>

      <div class="flex min-w-0 flex-1 flex-col">
        <div class="flex items-center gap-1.5">
          <span class="truncate text-[14px] font-semibold text-[var(--ink)]">{{ m.name }}</span>
          <Badge v-if="m.isOwner" variant="secondary" class="shrink-0">생성자</Badge>
        </div>
        <span class="text-[12px] text-[var(--ink-3)]">{{ roleLabel(m.role) }}</span>
      </div>

      <Button
        v-if="!m.isOwner"
        size="sm"
        variant="ghost"
        class="shrink-0 text-[var(--danger)] hover:bg-[var(--danger)]/10 hover:text-[var(--danger)] sm:opacity-0 sm:group-hover:opacity-100"
        :disabled="removingId === m.userId"
        @click="emit('remove', m)"
      >
        <Trash2 class="size-3.5" />
        {{ removingId === m.userId ? '빼는 중…' : '멤버 제거' }}
      </Button>
    </li>
  </ul>

  <p v-if="isSolo" class="px-2 py-2 text-[13px] text-[var(--ink-3)]">
    아직 동행인이 없어요, 링크로 친구를 불러보세요
  </p>
</template>
