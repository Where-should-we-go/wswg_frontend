<script setup>
// PlaceSearchView (route entry) — /places. AppShell 안에서 렌더.
// 얇게: features/place 의 검색 화면을 그대로 위임.
import { PlaceSearchView } from "@/features/place/components";
</script>

<template>
  <PlaceSearchView />
</template>
