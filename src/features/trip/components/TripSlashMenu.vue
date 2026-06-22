<script setup>
// TripSlashMenu — `/` 슬래시 메뉴 팝오버 (시안 §B `.slash`).
// 블록 종류(관광지/식당/이동/메모) 선택지 + 설명. ui/ 토큰만 사용.
// 실제 추가는 미구현 — 선택 시 select 이벤트만 emit.
import { BLOCK_KINDS } from "@/features/trip/lib/blockMeta";

defineProps({
  // 현재 하이라이트(키보드 강조)할 항목 typeKey
  activeKey: { type: String, default: "tour" },
});

const emit = defineEmits(["select"]);

function onSelect(kind) {
  // TODO(backend): 선택한 종류로 새 블록 생성 → Redis 동기화 / batch flush.
  emit("select", kind);
}
</script>

<template>
  <div
    class="w-[248px] rounded-[9px] border border-[var(--input)] bg-[var(--popover)] p-1.5 text-[13px] shadow-[0_14px_38px_-10px_rgba(20,22,26,0.26)]"
    role="menu"
  >
    <div class="px-2 pt-[5px] pb-[3px] text-[11px] text-[var(--ink-3)]">블록 종류</div>
    <button
      v-for="kind in BLOCK_KINDS"
      :key="kind.typeKey"
      type="button"
      role="menuitem"
      class="flex w-full items-center gap-[9px] rounded-md p-2 text-left transition-colors hover:bg-[var(--accent)]"
      :class="kind.typeKey === activeKey ? 'bg-[var(--accent)]' : ''"
      @click="onSelect(kind)"
    >
      <span
        class="grid size-[26px] shrink-0 place-items-center rounded-md bg-[var(--sunken)] text-[14px]"
        aria-hidden="true"
        >{{ kind.emoji }}</span
      >
      <span class="min-w-0">
        <span class="block font-medium text-[var(--ink)]">{{ kind.title }}</span>
        <span class="block text-[11px] text-[var(--ink-3)]">{{ kind.desc }}</span>
      </span>
    </button>
  </div>
</template>
