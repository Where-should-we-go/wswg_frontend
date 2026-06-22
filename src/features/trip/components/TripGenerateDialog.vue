<script setup>
// TripGenerateDialog — 일정 자동 생성 모달 (시안 §C2). ui/dialog 기반.
// 지역 · 기간 · 인원 · 스타일을 칩으로 고르면(목 상태) "✨ 일정 자동 생성".
// 카피 해요체. 진입은 "＋ 새 여행"(사이드바/마이페이지)에서 v-model:open 으로 연다.
// 얇게: ui/ 조각(Dialog·FilterChips·Button) 조립 + 로컬 선택 상태.
import { ref } from "vue";
import { Sparkles } from "@lucide/vue";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { FilterChips } from "@/components/ui/filter-chips";
import { Button } from "@/components/ui/button";

defineProps({
  open: { type: Boolean, default: false },
});

const emit = defineEmits(["update:open", "generate"]);

// ── 선택 옵션(목). value/label 만 — 실제 코드 매핑은 백엔드 연동 시. ──
const REGIONS = [
  { value: "busan", label: "부산", tone: "brand" },
  { value: "jeju", label: "제주", tone: "brand" },
  { value: "yeosu", label: "여수", tone: "brand" },
  { value: "gangwon", label: "강원", tone: "brand" },
];
const DURATIONS = [
  { value: "2n3d", label: "2박 3일" },
  { value: "day", label: "당일" },
];
const HEADCOUNTS = [
  { value: 2, label: "👥 2명" },
  { value: 4, label: "👥 4명" },
];
const STYLES = [
  { value: "activity", label: "🎢 액티비티", tone: "brand" },
  { value: "healing", label: "🏖️ 힐링", tone: "brand" },
  { value: "food", label: "🍜 맛집", tone: "brand" },
  { value: "sensible", label: "📸 감성", tone: "brand" },
];

// 시안 기본 선택값과 정렬.
const region = ref("busan");
const duration = ref("2n3d");
const headcount = ref(4);
const styles = ref(["activity", "healing"]);

function generate() {
  // TODO(backend): 자동생성 API — 선택값으로 POST /trips/generate 호출 후 에디터로 이동.
  emit("generate", {
    region: region.value,
    duration: duration.value,
    headcount: headcount.value,
    styles: styles.value,
  });
  emit("update:open", false);
}
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="sm:max-w-[460px]">
      <DialogHeader class="gap-1">
        <DialogTitle class="text-[18px] font-extrabold tracking-tight text-[var(--ink)]">
          어떤 여행을 그려볼까요?
        </DialogTitle>
        <DialogDescription class="text-[13px] text-[var(--ink-2)]">
          선택하면 관광 데이터에서 일정을 자동으로 채워드려요.
        </DialogDescription>
      </DialogHeader>

      <div class="flex flex-col gap-3.5">
        <section>
          <p class="mb-[7px] text-[11.5px] font-bold tracking-[0.05em] text-[var(--ink-3)] uppercase">
            지역
          </p>
          <FilterChips v-model="region" :options="REGIONS" />
        </section>

        <section>
          <p class="mb-[7px] text-[11.5px] font-bold tracking-[0.05em] text-[var(--ink-3)] uppercase">
            기간 · 인원
          </p>
          <div class="flex flex-wrap gap-[7px]">
            <FilterChips v-model="duration" :options="DURATIONS" />
            <FilterChips v-model="headcount" :options="HEADCOUNTS" />
          </div>
        </section>

        <section>
          <p class="mb-[7px] text-[11.5px] font-bold tracking-[0.05em] text-[var(--ink-3)] uppercase">
            스타일
          </p>
          <FilterChips v-model="styles" :options="STYLES" multiple />
        </section>
      </div>

      <Button class="mt-1 w-full py-[11px]" @click="generate">
        <Sparkles class="size-4" /> 일정 자동 생성
      </Button>
    </DialogContent>
  </Dialog>
</template>
