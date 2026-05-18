<script setup>

defineProps({
  count: { type: [Number, String], default: '' },
  label: { type: String, default: '알림' },
})
</script>

<template>
  <AppButton
    class="app-alarm-button"
    variant="surface"
    size="icon"
    :icon-only="true"
    :aria-label="label"
  >
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M10 21h4" />
    </svg>
    <span v-if="count !== '' && count != null" class="app-alarm-button__badge">{{ count }}</span>
  </AppButton>
</template>

<style scoped src="./styles/alarm-button.css"></style>
