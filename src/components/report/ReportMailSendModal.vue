<script setup>
import { computed, ref } from "vue";
import AppButton from "../common/AppButton.vue";
import AppModal from "../common/AppModal.vue";

const props = defineProps({
  recipients: {
    type: Array,
    default: () => [],
  },
  selectedRecipientIds: {
    type: Array,
    default: () => [],
  },
  subject: {
    type: String,
    default: "",
  },
  body: {
    type: String,
    default: "",
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits([
  "close",
  "add-recipient",
  "update:selectedRecipientIds",
  "update:subject",
  "update:body",
  "send",
]);

const searchKeyword = ref("");

const filteredRecipients = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase();

  if (!keyword) return props.recipients;

  return props.recipients.filter((recipient) =>
    [recipient.name, recipient.email].some((value) =>
      String(value).toLowerCase().includes(keyword)
    )
  );
});

const selectedCount = computed(() => props.selectedRecipientIds.length);

const canAddEmail = computed(() => {
  const email = searchKeyword.value.trim().toLowerCase();
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  return (
    emailPattern.test(email) &&
    !props.recipients.some((recipient) => recipient.email.toLowerCase() === email)
  );
});

const canSend = computed(() => {
  return (
    selectedCount.value > 0 &&
    props.subject.trim().length > 0 &&
    props.body.trim().length > 0 &&
    !props.loading
  );
});

function isSelected(id) {
  return props.selectedRecipientIds.includes(id);
}

function toggleRecipient(id) {
  const next = isSelected(id)
    ? props.selectedRecipientIds.filter((recipientId) => recipientId !== id)
    : [...props.selectedRecipientIds, id];

  emit("update:selectedRecipientIds", next);
}

function addEmailRecipient() {
  if (!canAddEmail.value) return;

  emit("add-recipient", searchKeyword.value.trim().toLowerCase());
  searchKeyword.value = "";
}
</script>

<template>
  <AppModal title="메일 발송" @close="emit('close')">
    <div class="grid gap-5">
      <p class="text-[15px] font-bold leading-6 text-[#173967]">
        보고서를 이메일로 공유할 수 있습니다.
      </p>

      <div class="grid gap-2">
        <label class="text-[14px] font-black text-[#0f3a70]">
          받을 사람
        </label>

        <div
          class="flex h-11 items-center rounded-xl border border-slate-200 bg-white px-4 focus-within:border-[#0b4ea2] focus-within:ring-4 focus-within:ring-blue-100"
        >
          <input
            v-model="searchKeyword"
            type="text"
            placeholder="이메일 또는 이름 검색"
            class="min-w-0 flex-1 bg-transparent text-[14px] font-semibold text-[#173967] outline-none placeholder:text-slate-400"
          />
          <span class="text-xl text-[#173967]">⌕</span>
        </div>

        <button
          v-if="canAddEmail"
          type="button"
          class="w-fit rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-[13px] font-black text-[#0b4ea2] transition hover:border-[#0b4ea2] hover:bg-blue-100"
          @click="addEmailRecipient"
        >
          {{ searchKeyword.trim().toLowerCase() }} 추가
        </button>

        <div class="mt-2 flex items-center justify-between">
          <span class="text-[14px] font-black text-[#0f3a70]">
            보낼 사람 리스트
          </span>
          <span class="text-[13px] font-bold text-slate-500">
            {{ selectedCount }} / {{ recipients.length }}명 선택됨
          </span>
        </div>

        <div
          class="max-h-[180px] overflow-y-auto rounded-xl border border-slate-200 bg-white p-2"
        >
          <button
            v-for="recipient in filteredRecipients"
            :key="recipient.id"
            type="button"
            class="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left transition hover:bg-blue-50"
            @click="toggleRecipient(recipient.id)"
          >
            <span
              class="grid h-5 w-5 shrink-0 place-items-center rounded-full border text-[12px] font-black"
              :class="
                isSelected(recipient.id)
                  ? 'border-[#0b4ea2] bg-[#0b4ea2] text-white'
                  : 'border-slate-400 bg-white text-transparent'
              "
            >
              ✓
            </span>

            <span class="grid">
              <span class="text-[14px] font-extrabold text-[#173967]">
                {{ recipient.email }}
              </span>
              <span
                v-if="recipient.name"
                class="text-[12px] font-semibold text-slate-500"
              >
                {{ recipient.name }}
              </span>
            </span>
          </button>

          <p
            v-if="filteredRecipients.length === 0"
            class="py-8 text-center text-[14px] font-bold text-slate-400"
          >
            검색 결과가 없습니다.
          </p>
        </div>
      </div>

      <div class="grid gap-2">
        <label class="text-[14px] font-black text-[#0f3a70]">
          메일 제목
        </label>
        <input
          :value="subject"
          type="text"
          class="h-11 rounded-xl border border-slate-200 bg-white px-4 text-[14px] font-bold text-[#173967] outline-none transition focus:border-[#0b4ea2] focus:ring-4 focus:ring-blue-100"
          placeholder="메일 제목을 입력하세요"
          @input="emit('update:subject', $event.target.value)"
        />
      </div>

      <div class="grid gap-2">
        <label class="text-[14px] font-black text-[#0f3a70]">
          메일 내용
        </label>
        <textarea
          :value="body"
          rows="7"
          class="resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-[14px] font-semibold leading-6 text-[#173967] outline-none transition focus:border-[#0b4ea2] focus:ring-4 focus:ring-blue-100"
          placeholder="메일 내용을 입력하세요"
          @input="emit('update:body', $event.target.value)"
        />
      </div>

      <div class="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
        <p class="text-[13px] font-semibold leading-5 text-[#31527c]">
          선택한 이메일 주소로 보고서 PDF 파일이 첨부 발송됩니다.
          최신 저장 버전 기준으로 PDF가 생성됩니다.
        </p>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end">
        <AppButton
          variant="primary"
          class="min-w-[140px]"
          :disabled="!canSend"
          @click="emit('send')"
        >
          {{ loading ? "발송 중..." : "발송" }}
        </AppButton>
      </div>
    </template>
  </AppModal>
</template>
