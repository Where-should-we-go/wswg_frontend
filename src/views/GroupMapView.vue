<script setup>
// GroupMapView (route entry) — /groups/:id/map. AppShell 안 본문 캔버스만 렌더.
// 얇게: features/map 의 발자취 지도 화면에 위임(route param id 는 내부에서 읽음).
import { GroupMapView } from '@/features/map/components'
</script>

<template>
  <GroupMapView />
</template>
