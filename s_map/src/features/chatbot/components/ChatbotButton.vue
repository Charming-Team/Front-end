<script setup>

defineProps({
  label: { type: String, default: '챗봇' },
})
</script>

<template>
  <AppButton class="app-chatbot-button" :aria-label="label">
    <span class="app-chatbot-button__bubble" aria-hidden="true">
      <i></i>
      <i></i>
      <i></i>
    </span>
    <span>{{ label }}</span>
  </AppButton>
</template>

<style scoped src="../styles/chatbot-button.css"></style>
