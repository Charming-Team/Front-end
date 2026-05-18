<script setup>
defineProps({
  title: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["close"]);
</script>

<template>
  <div class="app-modal-backdrop" @click.self="emit('close')">
    <div class="app-modal-panel">
      <div class="app-modal-header">
        <h3 v-if="title" class="app-modal-title">{{ title }}</h3>
        <slot name="header" />
        <button class="app-modal-close" type="button" aria-label="닫기" @click="emit('close')">
          <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="m5 5 10 10M15 5 5 15" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
          </svg>
        </button>
      </div>

      <div class="app-modal-body">
        <slot />
      </div>

      <div v-if="$slots.footer" class="app-modal-footer">
        <slot name="footer" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.app-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: grid;
  place-items: center;
  background: rgba(15, 23, 42, 0.14);
}

.app-modal-panel {
  width: 520px;
  max-width: calc(100vw - 32px);
  border: 1px solid #e8eef7;
  border-radius: 18px;
  background: #ffffff;
  padding: 18px 18px 16px;
  box-shadow: 0 24px 48px rgba(15, 23, 42, 0.14);
}

.app-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.app-modal-title {
  margin: 0;
  color: #111827;
  font-size: 17px;
  font-weight: 800;
}

.app-modal-close {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border: 0;
  background: transparent;
  color: #475467;
  flex: 0 0 auto;
}

.app-modal-close svg {
  width: 16px;
  height: 16px;
}

.app-modal-footer {
  margin-top: 18px;
}
</style>
