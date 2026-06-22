<script setup>
// WSWG 앱 셸 — 좌측 사이드바(228px) + 상단 토픽바 + 본문 캔버스.
// 디자인시스템 §6.1, 시안(artifact/design-flow.html) §B 레퍼런스.
//
// 사용:
//   - 라우터 layout route 의 부모 컴포넌트로 쓰면 본문은 <RouterView/> 로 렌더.
//   - 슬롯이 주어지면(직접 래핑) 슬롯을 본문으로 렌더.
//
// 셸에 표시할 워크스페이스/페이지트리/브레드크럼/동행인 데이터는 하위
// AppSidebar / AppTopicBar 의 props 기본값(목 데이터)에서 온다.
// TODO(backend): 라우트/스토어에서 받은 실데이터를 여기로 내려 props 로 전달.
import { useSlots } from "vue";
import { RouterView } from "vue-router";
import AppSidebar from "./AppSidebar.vue";
import AppTopicBar from "./AppTopicBar.vue";

const slots = useSlots();
const hasSlot = !!slots.default;
</script>

<template>
  <div class="flex h-screen min-h-screen overflow-hidden bg-[var(--background)]">
    <AppSidebar />

    <section class="flex min-w-0 flex-1 flex-col">
      <AppTopicBar />
      <main class="min-h-0 flex-1 overflow-auto">
        <slot v-if="hasSlot" />
        <RouterView v-else />
      </main>
    </section>
  </div>
</template>
