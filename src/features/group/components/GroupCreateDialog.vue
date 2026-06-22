<script setup>
// GroupCreateDialog — 새 그룹 생성 모달. ui/dialog 기반.
// 그룹명을 입력하면 groups 스토어로 생성 요청. 카피 해요체.
// 진입은 그룹 목록/지도 화면의 "＋ 새 그룹"에서 v-model:open 으로 연다.
// 얇게: ui/ 조각(Dialog·Input·Button) 조립 + 로컬 입력/제출 상태.
import { ref, watch } from "vue";
import { Users } from "@lucide/vue";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useGroupStore } from "@/stores/groups";

const props = defineProps({
  open: { type: Boolean, default: false },
});

const emit = defineEmits(["update:open", "created"]);

const groupStore = useGroupStore();

const groupName = ref("");
const submitting = ref(false);
const errorMsg = ref("");

// trim 후 1~100자 (백엔드 INVALID_GROUP_NAME 방어).
function isValid() {
  const len = groupName.value.trim().length;
  return len >= 1 && len <= 100;
}

async function submit() {
  if (submitting.value || !isValid()) return;
  submitting.value = true;
  errorMsg.value = "";
  try {
    const group = await groupStore.createGroup(groupName.value.trim());
    emit("created", group);
    groupName.value = "";
    emit("update:open", false);
  } catch (e) {
    errorMsg.value = e.message;
  } finally {
    submitting.value = false;
  }
}

// 모달이 닫히면 입력/에러 초기화.
watch(
  () => props.open,
  (open) => {
    if (!open) {
      groupName.value = "";
      errorMsg.value = "";
      submitting.value = false;
    }
  },
);
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="sm:max-w-[420px]">
      <DialogHeader class="gap-1">
        <DialogTitle class="text-[18px] font-extrabold tracking-tight text-[var(--ink)]">
          새 그룹을 만들어요
        </DialogTitle>
        <DialogDescription class="text-[13px] text-[var(--ink-2)]">
          함께 여행할 그룹 이름을 정해 주세요.
        </DialogDescription>
      </DialogHeader>

      <div class="flex flex-col gap-2">
        <p class="text-[11.5px] font-bold tracking-[0.05em] text-[var(--ink-3)] uppercase">
          그룹 이름
        </p>
        <Input
          v-model="groupName"
          placeholder="예: 제주 우정여행"
          maxlength="100"
          :aria-invalid="!!errorMsg"
          @keydown.enter="submit"
        />
        <p v-if="errorMsg" class="text-[12.5px] text-[var(--destructive)]">
          {{ errorMsg }}
        </p>
      </div>

      <DialogFooter>
        <Button
          class="w-full py-[11px]"
          :disabled="submitting || !isValid()"
          @click="submit"
        >
          <Users class="size-4" />
          {{ submitting ? "만드는 중…" : "그룹 만들기" }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
