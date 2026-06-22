<script setup>
// TripEditorView — /trips/:id 라우트 본문. AppShell(layout route) 안에서 렌더.
// 목 데이터(mockTrip)를 TripEditor 에 주입한다.
// TODO(backend): route.params.id 로 GET /trips/:id 호출해 data 주입.
import { TripEditor } from "@/features/trip/components";
import { mockTrip } from "@/features/trip/data/mockTrip";
</script>

<template>
  <TripEditor :trip="mockTrip" />
</template>
