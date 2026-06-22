<script setup>
// AddBlockRow — "＋ 블록 추가 · '/' 입력하면 종류 선택" 행 (시안 §B `.addblock`).
// 클릭하면 슬래시 메뉴를 토글한다(팝오버는 부모/자체에서 열림).
// 여기서는 행 + 슬래시 메뉴 토글 동작까지 담당.
import { ref } from "vue";
import { Plus } from "@lucide/vue";
import { onClickOutside } from "@vueuse/core";
import TripSlashMenu from "./TripSlashMenu.vue";

const open = ref(false);
const root = ref(null);

onClickOutside(root, () => (open.value = false));

function toggle() {
  open.value = !open.value;
}

function onSelect() {
  // TODO(backend): 선택 종류로 새 블록 추가 → Redis 동기화 / batch flush.
  open.value = false;
}
</script>

<template>
  <div ref="root" class="relative -ml-[26px]">
    <button
      type="button"
      class="flex w-full items-center gap-[7px] rounded-md px-2 py-[7px] text-left text-[13.5px] text-[var(--ink-3)] transition-colors hover:text-[var(--ink-2)]"
      @click="toggle"
    >
      <Plus class="size-[15px]" />
      <span class="text-[var(--ink-2)]">블록 추가</span>
      <span>· '/' 입력하면 종류 선택</span>
    </button>

    <!-- 슬래시 메뉴 팝오버 -->
    <div v-if="open" class="absolute left-7 top-full z-10 mt-1">
      <TripSlashMenu @select="onSelect" />
    </div>
  </div>
</template>
