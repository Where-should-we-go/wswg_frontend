<script setup>
// TripViewTabs — "하나의 원본 → 여러 뷰" 뷰 탭 (디자인시스템.md §6.2, 시안 §B `.views`).
// 탭: 📅 일정 / 🖼️ 갤러리 / 🗺️ 지도 / 📋 보드.
// 일정 탭만 실제 구현(default 슬롯). 나머지는 빈 상태 + 해요체 안내(placeholder).
// ui/tabs(reka-ui) 위에 노션식 underline 스타일을 입혀 재사용한다.
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const TABS = [
  { value: "schedule", emoji: "📝", label: "일정" },
  { value: "calendar", emoji: "📅", label: "캘린더", soon: "캘린더 뷰는 곧 만나요" },
  { value: "gallery", emoji: "🖼️", label: "갤러리", soon: "갤러리 뷰는 곧 만나요" },
  { value: "map", emoji: "🗺️", label: "지도", soon: "지도 뷰는 곧 만나요" },
];
</script>

<template>
  <Tabs default-value="schedule" class="gap-0">
    <!-- 탭 헤더 (underline) -->
    <TabsList
      class="h-auto justify-start gap-0.5 rounded-none border-b border-[var(--border)] bg-transparent p-0"
    >
      <TabsTrigger
        v-for="t in TABS"
        :key="t.value"
        :value="t.value"
        class="h-auto flex-none rounded-none border-0 border-b-2 border-transparent bg-transparent px-[11px] py-[7px] text-[13.5px] font-medium text-[var(--ink-2)] shadow-none data-[state=active]:border-[var(--ink)] data-[state=active]:bg-transparent data-[state=active]:font-semibold data-[state=active]:text-[var(--ink)] data-[state=active]:shadow-none"
      >
        <span aria-hidden="true">{{ t.emoji }}</span> {{ t.label }}
      </TabsTrigger>
    </TabsList>

    <!-- 일정 뷰: 실제 구현(부모가 일차 그룹 주입) -->
    <TabsContent value="schedule" class="mt-1.5">
      <slot />
    </TabsContent>

    <!-- 나머지 뷰: placeholder 빈 상태 -->
    <TabsContent
      v-for="t in TABS.filter((x) => x.soon)"
      :key="t.value"
      :value="t.value"
      class="mt-1.5"
    >
      <div
        class="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-[var(--border)] bg-[var(--sunken)] px-6 py-14 text-center"
      >
        <span class="text-[28px]" aria-hidden="true">{{ t.emoji }}</span>
        <p class="text-[14px] font-semibold text-[var(--ink)]">{{ t.soon }}</p>
        <p class="text-[12.5px] text-[var(--ink-3)]">
          같은 일정을 {{ t.label }}(으)로도 볼 수 있게 준비하고 있어요.
        </p>
      </div>
    </TabsContent>
  </Tabs>
</template>
