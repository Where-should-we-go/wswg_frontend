<script setup>
// 동행인 아바타 스택. 시안 §B `.avs`/`.av` 재현. ui/avatar 위에 구축.
// - members: [{ name, initial?, color?, image? }]
//     name    표시명(이니셜 자동 추출에 사용, title 툴팁)
//     initial 표기 이니셜(없으면 name 첫 글자)
//     color   배경색. 미지정 시 --collab-1/2/3 라운드로빈(§3.4).
//     image   아바타 이미지 URL(선택)
// - size: 지름(px). 기본 26(시안 값).
import { computed } from "vue";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const props = defineProps({
  members: { type: Array, default: () => [] },
  size: { type: Number, default: 26 },
});

// §3.4 협업 카렛 색 라운드로빈 토큰
const ROTATION = ["var(--collab-1)", "var(--collab-2)", "var(--collab-3)"];

const resolved = computed(() =>
  props.members.map((m, i) => ({
    name: m.name ?? "",
    initial: m.initial ?? (m.name ? m.name.charAt(0) : "?"),
    color: m.color ?? ROTATION[i % ROTATION.length],
    image: m.image ?? null,
  })),
);
</script>

<template>
  <div class="flex">
    <Avatar
      v-for="(m, i) in resolved"
      :key="i"
      :title="m.name"
      class="border-2 border-[var(--background)] text-[11px] font-bold text-white first:ml-0 -ml-[7px]"
      :style="{
        width: size + 'px',
        height: size + 'px',
        backgroundColor: m.color,
      }"
    >
      <AvatarImage v-if="m.image" :src="m.image" :alt="m.name" />
      <AvatarFallback
        class="bg-transparent text-white"
        :style="{ fontSize: Math.round(size * 0.42) + 'px' }"
        >{{ m.initial }}</AvatarFallback
      >
    </Avatar>
  </div>
</template>
