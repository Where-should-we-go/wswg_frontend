<script setup>
// HomeView — 랜딩(Guest). 시안 §C1 1:1 재현. 풀스크린(셸 없음).
// 상단 nav(로고 + 로그인) · 히어로 헤드라인(해요체) · 서브카피 · CTA ·
// 우측 비주얼(블록 미리보기 스택 + 협업 마커). 색·모양은 토큰만(하드코딩 금지).
// "무료로 시작하기"는 로그인 진입(OAuth), "데모 보기"는 앱 셸로 이동.
import { useRouter } from "vue-router";
import { Sparkles } from "@lucide/vue";
import { Button } from "@/components/ui/button";
import { BlockTag } from "@/components/ui/block-tag";
import { startOAuthLogin } from "@/services/auth";

const router = useRouter();

function start() {
  // 무료로 시작하기 → 소셜 로그인 진입(시안의 단일 CTA). 기본 google.
  startOAuthLogin("google");
}

function demo() {
  // 데모 보기 → 로그인 없이 앱 셸(여행 에디터)로 둘러보기.
  router.push("/trips/10");
}

// 우측 비주얼 블록 미리보기 스택(시안 §C1 `.vis`).
const previewBlocks = [
  { type: "tour", title: "해운대 해수욕장", editing: false },
  { type: "food", title: "돼지국밥 본가", editing: false },
  { type: "stay", title: "광안리 호텔", editing: true, editor: "준영" },
];
</script>

<template>
  <main class="min-h-screen bg-[#F4F3F0] p-7 text-[var(--ink)]">
    <div
      class="relative mx-auto max-w-[1080px] overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-[0_24px_60px_-16px_rgba(20,22,26,0.18)]"
    >
      <!-- 상단 nav -->
      <nav class="flex items-center justify-between px-6 py-3.5">
        <RouterLink to="/" class="flex items-center gap-2 font-extrabold tracking-tight">
          <span
            class="grid size-[22px] place-items-center rounded-md bg-[linear-gradient(135deg,#3D7BEA,#2C6FE3)] text-[12px] font-extrabold text-white"
            >W</span
          >
          어디갈래?
        </RouterLink>
        <Button variant="outline" size="sm" @click="start">로그인</Button>
      </nav>

      <!-- 히어로 -->
      <div
        class="grid items-center gap-6 px-9 py-10 md:grid-cols-[1.1fr_0.9fr]"
      >
        <div>
          <h1 class="text-[clamp(1.9rem,3.4vw,2.4rem)] font-extrabold leading-[1.18] tracking-tight">
            고르기만 하세요,<br />
            <span class="text-[var(--primary)]">일정은 저희가 짜드려요.</span>
          </h1>
          <p class="mt-3 max-w-[460px] text-[14px] leading-relaxed text-[var(--ink-2)]">
            지역과 스타일만 선택하면 데이터 기반으로 일정을 자동 생성해요. 노션처럼 블록으로 짜고,
            친구와 실시간으로 함께 다듬어요.
          </p>
          <div class="mt-[18px] flex flex-wrap gap-[9px]">
            <Button @click="start">
              <Sparkles class="size-4" /> 무료로 시작하기
            </Button>
            <Button variant="outline" @click="demo">데모 보기</Button>
          </div>
        </div>

        <!-- 우측 비주얼: 블록 미리보기 스택 -->
        <div
          class="relative h-[200px] overflow-hidden rounded-[10px] border border-[var(--border)] bg-[var(--sunken)] p-3.5"
        >
          <div
            v-for="block in previewBlocks"
            :key="block.title"
            class="mb-[7px] flex items-center gap-[7px] rounded-[7px] border bg-[var(--card)] px-2.5 py-[7px] text-[12px] shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
            :class="
              block.editing
                ? 'border-[#F0CBB6] bg-[#FCF3EE]'
                : 'border-[var(--border)]'
            "
          >
            <BlockTag :type="block.type" />
            <span class="text-[var(--ink)]">{{ block.title }}</span>
            <!-- 실시간 협업 마커(시안 │준영) -->
            <span
              v-if="block.editing"
              class="ml-auto text-[11px] font-bold text-[var(--collab-2)]"
              >│{{ block.editor }}</span
            >
          </div>
        </div>
      </div>
    </div>
  </main>
</template>
