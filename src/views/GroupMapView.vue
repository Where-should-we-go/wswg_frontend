<script setup>
// GroupMapView (route entry) — /map. AppShell 안에서 렌더.
// 얇게: features/map 의 그룹 지도 화면을 그대로 위임.
import { GroupMapView } from "@/features/map/components";
</script>

<template>
  <GroupMapView />
</template>
