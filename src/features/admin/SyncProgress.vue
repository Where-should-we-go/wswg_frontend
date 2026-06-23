<script setup>
// S-ADM TourAPI 동기 적재 진행 배너. 적재 중에만 노출돼요.
// 진행 메시지 + 인디터미닛 프로그레스 바(토큰만 사용).
defineProps({
  message: { type: String, default: '관광지 정보를 불러오고 있어요…' },
})
</script>

<template>
  <div
    role="status"
    aria-live="polite"
    class="flex items-center gap-3 rounded-[var(--radius)] border border-[var(--brand-soft)] bg-[var(--brand-soft)] px-4 py-3"
  >
    <span
      class="size-4 shrink-0 animate-spin rounded-full border-2 border-[var(--brand)] border-t-transparent"
      aria-hidden="true"
    />
    <div class="min-w-0 flex-1">
      <p class="text-sm font-medium text-[var(--brand-ink)]">{{ message }}</p>
      <div class="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--card)]">
        <div class="h-full w-1/3 animate-pulse rounded-full bg-[var(--brand)]" />
      </div>
    </div>
  </div>
</template>
