<script setup>
import AppButton from "../common/AppButton.vue";
import AppModal from "../common/AppModal.vue";

const emit = defineEmits(["add-more", "proceed"]);
</script>

<template>
  <AppModal title="주문이 저장되었습니다" @close="emit('proceed')">
    <div class="post-save-content">
      <p class="post-save-message">다음 작업을 선택해주세요.</p>
      <p class="post-save-note">이대로 닫으면 AI 스케줄 검토가 자동으로 진행됩니다.</p>
    </div>

    <template #footer>
      <div class="post-save-actions">
        <AppButton
          variant="secondary"
          size="sm"
          class="post-save-button"
          @click="emit('add-more')"
        >
          주문 더 추가하기
        </AppButton>

        <AppButton
          variant="primary"
          size="sm"
          class="post-save-button"
          @click="emit('proceed')"
        >
          닫기
        </AppButton>
      </div>
    </template>
  </AppModal>
</template>

<style scoped>
.post-save-content {
  display: grid;
  gap: 10px;
  padding: 10px 4px 2px;
}

.post-save-message {
  margin: 0;
  color: #0f172a;
  font-size: 18px;
  font-weight: 800;
  line-height: 1.5;
}

.post-save-note {
  margin: 0;
  color: #475467;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.6;
}

.post-save-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.post-save-button {
  min-width: 112px;
}

@media (max-width: 560px) {
  .post-save-actions {
    flex-direction: column;
  }

  .post-save-button {
    width: 100%;
  }
}
</style>
