<script setup>
// 인기 여행지 카드 — 썸네일(없으면 플레이스홀더) · name · regionName · "N개 여행에 담겼어요".
// 카드 클릭 → /attractions/{contentId} (S4).
import { useRouter } from 'vue-router'
import { Card } from '@/components/ui/card'

const props = defineProps({
  item: { type: Object, required: true }, // { contentId, name, regionName, tripCount, thumbnailUrl }
})

const router = useRouter()

function goDetail() {
  router.push(`/attractions/${props.item.contentId}`)
}
</script>

<template>
  <Card
    role="button"
    tabindex="0"
    class="group w-[210px] shrink-0 cursor-pointer snap-start gap-0 overflow-hidden py-0 transition-colors hover:border-[var(--border-strong)] hover:bg-[var(--hover)] sm:w-[200px]"
    @click="goDetail"
    @keyup.enter="goDetail"
  >
    <img
      v-if="item.thumbnailUrl"
      :src="item.thumbnailUrl"
      :alt="item.name"
      loading="lazy"
      class="aspect-[4/3] w-full object-cover"
    />
    <div
      v-else
      class="grid aspect-[4/3] w-full place-items-center bg-[linear-gradient(135deg,var(--brand-soft),var(--bg-subtle))] text-3xl text-[var(--ink-3)]"
      aria-hidden="true"
    >
      📍
    </div>

    <div class="flex flex-col gap-1 p-3.5">
      <h3 class="truncate text-sm font-semibold text-[var(--ink)]">{{ item.name }}</h3>
      <p class="truncate text-xs text-[var(--ink-3)]">{{ item.regionName }}</p>
      <p class="mt-0.5 text-xs text-[var(--ink-3)]">{{ item.tripCount }}개 여행에 담겼어요</p>
    </div>
  </Card>
</template>
