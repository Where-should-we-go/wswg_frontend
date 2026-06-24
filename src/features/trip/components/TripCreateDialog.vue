<script setup>
// TripCreateDialog — 여행 생성(수동) 모달. ui/dialog 기반.
// 제목 · 일정 · 그룹을 직접 입력해 새 여행을 만든다. 자동(AI) 생성은 /plans/new(PlanNewView).
// 카피 해요체. 생성 성공 시 created 이벤트 + trip-editor 라우트로 이동.
// 얇게: ui/ 조각(Dialog·Input·Button·DropdownMenu) 조립 + 로컬 입력/검증 상태.
import { ref, computed, watch } from "vue";
import { ChevronDown } from "@lucide/vue";
import { useRouter } from "vue-router";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useTripStore } from "@/stores/trips";
import { useGroupStore } from "@/stores/groups";

const props = defineProps({
  open: { type: Boolean, default: false },
});

const emit = defineEmits(["update:open", "created"]);

const router = useRouter();
const tripStore = useTripStore();
const groupStore = useGroupStore();

// ── 로컬 입력 상태 ──
const title = ref("");
const startDate = ref("");
const endDate = ref("");
const selectedGroupId = ref(null);
const submitting = ref(false);
const errorMsg = ref("");

// 선택된 그룹 라벨(트리거 버튼 표시용). null 이면 개인 여행.
const selectedGroupLabel = computed(() => {
  if (selectedGroupId.value == null) return "개인 여행";
  const found = groupStore.groups.find((g) => g.groupId === selectedGroupId.value);
  return found?.groupName ?? "개인 여행";
});

// 제목은 trim 후 1~255자.
const trimmedTitle = computed(() => title.value.trim());
const dateOrderInvalid = computed(
  () => !!startDate.value && !!endDate.value && endDate.value < startDate.value,
);
const canSubmit = computed(
  () =>
    !submitting.value &&
    trimmedTitle.value.length >= 1 &&
    trimmedTitle.value.length <= 255 &&
    !dateOrderInvalid.value,
);

function reset() {
  title.value = "";
  startDate.value = "";
  endDate.value = "";
  selectedGroupId.value = null;
  submitting.value = false;
  errorMsg.value = "";
}

function selectGroup(groupId) {
  selectedGroupId.value = groupId;
}

// 모달이 열리면 그룹 목록을 준비(없을 때만). 실패해도 개인 여행은 가능하니 조용히 무시.
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      if (groupStore.groups.length === 0) {
        groupStore.fetchGroups().catch(() => {})
      }
    } else {
      reset();
    }
  },
);

async function submit() {
  // 클라 검증.
  if (trimmedTitle.value.length < 1 || trimmedTitle.value.length > 255) {
    errorMsg.value = "제목은 1자 이상 255자 이하로 입력해요.";
    return;
  }
  if (dateOrderInvalid.value) {
    errorMsg.value = "종료일은 시작일과 같거나 이후여야 해요.";
    return;
  }

  submitting.value = true;
  errorMsg.value = "";
  try {
    const trip = await tripStore.createTrip({
      title: trimmedTitle.value,
      startDate: startDate.value || null,
      endDate: endDate.value || null,
      groupId: selectedGroupId.value,
    });
    emit("created", trip);
    emit("update:open", false);
    router.push({ name: "trip-editor", params: { id: trip.tripId } });
  } catch (e) {
    errorMsg.value = e.message;
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="sm:max-w-[460px]">
      <DialogHeader class="gap-1">
        <DialogTitle class="text-[18px] font-extrabold tracking-tight text-[var(--ink)]">
          새 여행을 시작해요
        </DialogTitle>
        <DialogDescription class="text-[13px] text-[var(--ink-2)]">
          제목과 일정을 정하면 여행이 만들어져요.
        </DialogDescription>
      </DialogHeader>

      <div class="flex flex-col gap-3.5">
        <section>
          <p class="mb-[7px] text-[11.5px] font-bold tracking-[0.05em] text-[var(--ink-3)] uppercase">
            제목
          </p>
          <Input
            v-model="title"
            placeholder="예: 부산 2박 3일"
            maxlength="255"
            :disabled="submitting"
            @keydown.enter="submit"
          />
        </section>

        <section>
          <p class="mb-[7px] text-[11.5px] font-bold tracking-[0.05em] text-[var(--ink-3)] uppercase">
            일정
          </p>
          <div class="flex items-center gap-2">
            <input
              v-model="startDate"
              type="date"
              :disabled="submitting"
              class="h-9 w-full min-w-0 rounded-md border border-[var(--border)] bg-transparent px-3 py-1 text-sm text-[var(--ink)] shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-[var(--ring)] focus-visible:ring-3 focus-visible:ring-[color-mix(in_srgb,var(--ring)_50%,transparent)] disabled:pointer-events-none disabled:opacity-50"
            />
            <span class="text-[13px] text-[var(--ink-3)]">~</span>
            <input
              v-model="endDate"
              type="date"
              :min="startDate || undefined"
              :disabled="submitting"
              class="h-9 w-full min-w-0 rounded-md border border-[var(--border)] bg-transparent px-3 py-1 text-sm text-[var(--ink)] shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-[var(--ring)] focus-visible:ring-3 focus-visible:ring-[color-mix(in_srgb,var(--ring)_50%,transparent)] disabled:pointer-events-none disabled:opacity-50"
            />
          </div>
          <p v-if="dateOrderInvalid" class="mt-[6px] text-[12px] text-[var(--destructive)]">
            종료일은 시작일과 같거나 이후여야 해요.
          </p>
        </section>

        <section>
          <p class="mb-[7px] text-[11.5px] font-bold tracking-[0.05em] text-[var(--ink-3)] uppercase">
            그룹
          </p>
          <DropdownMenu>
            <DropdownMenuTrigger as-child :disabled="submitting">
              <Button
                variant="outline"
                class="w-full justify-between font-normal text-[var(--ink)]"
              >
                {{ selectedGroupLabel }}
                <ChevronDown class="size-4 text-[var(--ink-3)]" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" class="w-[var(--reka-dropdown-menu-trigger-width)]">
              <DropdownMenuItem @select="selectGroup(null)"> 개인 여행 </DropdownMenuItem>
              <DropdownMenuItem
                v-for="group in groupStore.groups"
                :key="group.groupId"
                @select="selectGroup(group.groupId)"
              >
                {{ group.groupName }}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </section>

        <p v-if="errorMsg" class="text-[12.5px] text-[var(--destructive)]">
          {{ errorMsg }}
        </p>
      </div>

      <Button class="mt-1 w-full py-[11px]" :disabled="!canSubmit" @click="submit">
        {{ submitting ? "여행을 만드는 중…" : "여행 만들기" }}
      </Button>
    </DialogContent>
  </Dialog>
</template>
