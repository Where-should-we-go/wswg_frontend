<script setup>
// TripPropertyTable — 상단 속성 테이블 (디자인시스템.md §6.2 하단, 시안 §B `.props`).
// 노션 데이터베이스 프로퍼티 스타일: 날짜·지역·동행·스타일·예산.
// 동행은 member pill(AvatarStack 와 같은 --collab-* 색), 지역/스타일은 BlockTag.
import { computed } from "vue";
import { Calendar, MapPin, Users, Palette, Wallet, X } from "@lucide/vue";
import { BlockTag } from "@/components/ui/block-tag";
import { formatBudget } from "@/features/trip/lib/blockMeta";

const props = defineProps({
  trip: { type: Object, required: true },
  // 편집 권한(여행 소유자). true 면 날짜 행을 date 입력으로 바꿔 직접 수정할 수 있다.
  editable: { type: Boolean, default: false },
});

const emit = defineEmits(["set-dates", "remove-companion"]);

function fmt(d) {
  if (!d) return "미정";
  const dt = new Date(d + "T00:00:00");
  return `${dt.getFullYear()}. ${dt.getMonth() + 1}. ${dt.getDate()}`;
}
const dateRange = computed(() => `${fmt(props.trip.start_date)} → ${fmt(props.trip.end_date)}`);

function onStartDate(e) {
  emit("set-dates", { startDate: e.target.value || null, endDate: props.trip.end_date ?? null });
}
function onEndDate(e) {
  emit("set-dates", { startDate: props.trip.start_date ?? null, endDate: e.target.value || null });
}

// 지역: { label } 객체 | 문자열 | null 모두 허용.
const regionLabel = computed(() => {
  const r = props.trip.region;
  if (!r) return null;
  return typeof r === "string" ? r : (r.label ?? null);
});

// 스타일: "맛집"(문자열) | { label, emoji?, type? } 둘 다 허용 → 통일 형태.
const styleTags = computed(() =>
  (props.trip.styles ?? []).map((s) =>
    typeof s === "string"
      ? { label: s, emoji: "", type: "tour" }
      : { label: s.label, emoji: s.emoji ?? "", type: s.type ?? "tour" },
  ),
);

const members = computed(() => props.trip.members ?? []);

// 예산: 블록별 properties.budget 합계를 라이브로 보여준다(블록 예산을 더하면 즉시 반영).
// 트립 레벨 budgetLabel(메타)이 있으면 그걸 우선.
const budgetText = computed(() => {
  if (props.trip.budgetLabel) return props.trip.budgetLabel;
  const total = (props.trip.data?.items ?? []).reduce(
    (sum, it) => sum + (Number(it.properties?.budget) || 0),
    0,
  );
  return total > 0 ? formatBudget(total) : "미정";
});

// AvatarStack 의 --collab-* 라운드로빈과 일치시키기 위한 fallback.
const ROTATION = ["var(--collab-1)", "var(--collab-2)", "var(--collab-3)"];
function memberColor(m, i) {
  return m.color ?? ROTATION[i % ROTATION.length];
}
</script>

<template>
  <div class="mb-2 grid max-w-[560px] grid-cols-[max-content_1fr] gap-y-0.5">
    <!-- 날짜 -->
    <div class="flex items-center gap-2 py-[5px] pr-2.5 text-[13.5px] text-[var(--ink-2)]">
      <Calendar class="size-4 text-[var(--ink-3)]" /> 날짜
    </div>
    <div
      v-if="editable"
      class="flex items-center gap-1.5 rounded-sm px-1 py-[3px] text-[13.5px]"
    >
      <input
        type="date"
        :value="trip.start_date ?? ''"
        :max="trip.end_date || undefined"
        aria-label="여행 시작일"
        class="rounded-sm bg-transparent px-1.5 py-0.5 text-[13.5px] text-[var(--ink)] outline-none hover:bg-[var(--accent)] focus:bg-[var(--accent)] focus:ring-1 focus:ring-[var(--ring)]/40"
        @change="onStartDate"
      />
      <span class="text-[var(--ink-3)]">→</span>
      <input
        type="date"
        :value="trip.end_date ?? ''"
        :min="trip.start_date || undefined"
        aria-label="여행 종료일"
        class="rounded-sm bg-transparent px-1.5 py-0.5 text-[13.5px] text-[var(--ink)] outline-none hover:bg-[var(--accent)] focus:bg-[var(--accent)] focus:ring-1 focus:ring-[var(--ring)]/40"
        @change="onEndDate"
      />
    </div>
    <div
      v-else
      class="flex items-center rounded-sm px-2 py-[5px] text-[13.5px] hover:bg-[var(--accent)]"
    >
      {{ dateRange }}
    </div>

    <!-- 지역 -->
    <div class="flex items-center gap-2 py-[5px] pr-2.5 text-[13.5px] text-[var(--ink-2)]">
      <MapPin class="size-4 text-[var(--ink-3)]" /> 지역
    </div>
    <div class="flex flex-wrap items-center gap-1.5 rounded-sm px-2 py-[5px] hover:bg-[var(--accent)]">
      <BlockTag v-if="regionLabel" type="tour" :label="regionLabel" hide-emoji />
      <span v-else class="text-[13.5px] text-[var(--ink-3)]">미정</span>
    </div>

    <!-- 동행 -->
    <div class="flex items-center gap-2 py-[5px] pr-2.5 text-[13.5px] text-[var(--ink-2)]">
      <Users class="size-4 text-[var(--ink-3)]" /> 동행
    </div>
    <div class="flex flex-wrap items-center gap-1.5 rounded-sm px-2 py-[5px] hover:bg-[var(--accent)]">
      <span
        v-for="(m, i) in members"
        :key="m.id"
        class="group/companion inline-flex items-center gap-1.5 rounded-full bg-[var(--accent)] py-0.5 pl-[3px] text-[12.5px] font-medium"
        :class="editable ? 'pr-1' : 'pr-2.5'"
      >
        <span
          class="grid size-[18px] place-items-center rounded-full text-[10px] font-bold text-white"
          :style="{ backgroundColor: memberColor(m, i) }"
          >{{ m.initial }}</span
        >
        {{ m.name }}
        <button
          v-if="editable"
          type="button"
          class="ml-0.5 grid size-[18px] place-items-center rounded-full text-[var(--ink-3)] opacity-0 transition group-hover/companion:opacity-100 hover:bg-[var(--card)] hover:text-[var(--destructive)] focus-visible:opacity-100"
          :aria-label="`${m.name} 동행에서 빼기`"
          @click.stop="emit('remove-companion', m.id)"
        >
          <X class="size-3" />
        </button>
      </span>
    </div>

    <!-- 스타일 -->
    <div class="flex items-center gap-2 py-[5px] pr-2.5 text-[13.5px] text-[var(--ink-2)]">
      <Palette class="size-4 text-[var(--ink-3)]" /> 스타일
    </div>
    <div class="flex flex-wrap items-center gap-1.5 rounded-sm px-2 py-[5px] hover:bg-[var(--accent)]">
      <BlockTag
        v-for="s in styleTags"
        :key="s.label"
        :type="s.type"
        :label="s.emoji ? `${s.emoji} ${s.label}` : s.label"
        hide-emoji
      />
      <span v-if="!styleTags.length" class="text-[13.5px] text-[var(--ink-3)]">미정</span>
    </div>

    <!-- 예산 -->
    <div class="flex items-center gap-2 py-[5px] pr-2.5 text-[13.5px] text-[var(--ink-2)]">
      <Wallet class="size-4 text-[var(--ink-3)]" /> 예산
    </div>
    <div class="flex items-center rounded-sm px-2 py-[5px] text-[13.5px] text-[var(--ink-2)] hover:bg-[var(--accent)]">
      {{ budgetText }}
    </div>
  </div>
</template>
