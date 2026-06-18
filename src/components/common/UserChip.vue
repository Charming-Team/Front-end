<script setup>
defineProps({
  label: { type: String, required: true },
})
</script>

<template>
  <div class="app-user-chip">
    <span class="app-user-chip-avatar" aria-hidden="true">
      <svg viewBox="0 0 24 24">
        <path d="M20 21a8 8 0 0 0-16 0" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    </span>
    <span>{{ label }}</span>
    <span class="app-user-chip-chevron" aria-hidden="true"></span>
  </div>
</template>

<style scoped src="./styles/user-chip.css"></style>
