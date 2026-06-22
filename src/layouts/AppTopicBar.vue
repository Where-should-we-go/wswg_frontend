<script setup>
// 앱 셸 상단 토픽바. 시안 §B `.topbar` 1:1 재현.
// 브레드크럼 + 실시간 동기화(LiveIndicator) + 동행인 아바타 스택(AvatarStack) + 공유 버튼.
// 데이터는 props로 주입. 기본값은 목 데이터(시안 값).
// TODO(backend): crumb(워크스페이스/현재 trip 제목), members(실시간 참여자),
//   live 라벨("N명 편집 중")은 추후 trips API + 협업(Redis) 상태로 대체.
import { Button } from "@/components/ui/button";
import { LiveIndicator } from "@/components/ui/live-indicator";
import { AvatarStack } from "@/components/ui/avatar-stack";

defineProps({
  // 브레드크럼: { workspace, title } — title 만 강조.
  crumb: {
    type: Object,
    default: () => ({ workspace: "부산크루", title: "부산 2박 3일" }),
  },
  liveLabel: { type: String, default: "실시간 동기화" },
  // 동행인: AvatarStack members 형식.
  members: {
    type: Array,
    default: () => [
      { name: "태호", initial: "태" },
      { name: "민지", initial: "민" },
      { name: "준", initial: "준" },
    ],
  },
});

defineEmits(["share"]);
</script>

<template>
  <header
    class="flex h-11 items-center gap-2.5 border-b border-[var(--border)] px-[18px]"
  >
    <div class="text-[13px] text-[var(--ink-2)]">
      {{ crumb.workspace }} /
      <b class="font-semibold text-[var(--ink)]">{{ crumb.title }}</b>
    </div>

    <div class="ml-auto flex items-center gap-3">
      <LiveIndicator :label="liveLabel" />
      <AvatarStack :members="members" />
      <Button size="sm" class="h-auto px-[13px] py-1.5 text-[12.5px]" @click="$emit('share')"
        >공유</Button
      >
    </div>
  </header>
</template>
