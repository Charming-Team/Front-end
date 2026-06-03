<script setup>
defineProps({
  label: {
    type: String,
    default: "더보기",
  },
});
</script>

<template>
  <button class="panel-more-button" type="button">
    <span>{{ label }}</span>
    <span class="panel-more-button__arrow" aria-hidden="true"></span>
  </button>
</template>

<style scoped>
.panel-more-button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--color-text-main);
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  text-decoration: none;
}

.panel-more-button:not(:disabled) {
  cursor: pointer;
}

.panel-more-button__arrow {
  width: 7px;
  height: 7px;
  display: inline-block;
  border-top: 2px solid currentColor;
  border-right: 2px solid currentColor;
  transform: rotate(45deg);
}
</style>
