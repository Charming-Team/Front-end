<script setup>
defineProps({
  title: {
    type: String,
    required: true,
  },
});
</script>

<template>
  <div class="app-section-header">
    <h2 class="app-section-title">{{ title }}</h2>
    <div v-if="$slots.actions" class="app-section-actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<style scoped>
.app-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 46px;
}

.app-section-title {
  margin: 0;
  color: #111827;
  font-size: 17px;
  font-weight: 800;
  letter-spacing: -0.2px;
}

.app-section-actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
</style>
