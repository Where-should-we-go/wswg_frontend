<script setup>
// TripViewTabs — "하나의 원본 → 여러 뷰" 뷰 탭 (디자인시스템.md §6.2, 시안 §B `.views`).
// 탭: 📅 일정 / 🖼️ 미디어 / 🗺️ 지도 / 📋 보드 (선택 밑줄 --brand).
// 각 뷰는 부모가 슬롯으로 주입(같은 원본 items 공유).
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

const TABS = [
  { value: 'schedule', emoji: '📅', label: '일정' },
  { value: 'gallery', emoji: '🖼️', label: '미디어' },
  { value: 'map', emoji: '🗺️', label: '지도' },
  { value: 'board', emoji: '📋', label: '보드' },
]
</script>

<template>
  <Tabs default-value="schedule" class="gap-0">
    <!-- 탭 헤더 (underline, 선택 밑줄 --brand) -->
    <TabsList
      class="h-auto justify-start gap-0.5 rounded-none border-b border-[var(--border)] bg-transparent p-0"
    >
      <TabsTrigger
        v-for="t in TABS"
        :key="t.value"
        :value="t.value"
        class="h-auto flex-none rounded-none border-0 border-b-2 border-transparent bg-transparent px-[11px] py-[7px] text-[13.5px] font-medium text-[var(--ink-2)] shadow-none data-[state=active]:border-[var(--brand)] data-[state=active]:bg-transparent data-[state=active]:font-semibold data-[state=active]:text-[var(--ink)] data-[state=active]:shadow-none"
      >
        <span aria-hidden="true">{{ t.emoji }}</span> {{ t.label }}
      </TabsTrigger>
    </TabsList>

    <TabsContent value="schedule" class="mt-2.5">
      <slot name="schedule" />
    </TabsContent>
    <TabsContent value="gallery" class="mt-2.5">
      <slot name="gallery" />
    </TabsContent>
    <TabsContent value="map" class="mt-2.5">
      <slot name="map" />
    </TabsContent>
    <TabsContent value="board" class="mt-2.5">
      <slot name="board" />
    </TabsContent>
  </Tabs>
</template>
