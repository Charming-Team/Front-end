<script setup>
defineProps({
  label: {
    type: String,
    required: true,
  },
  tone: {
    type: String,
    default: "normal",
  },
});
</script>

<template>
  <span class="app-status-badge" :class="`app-status-badge-${tone}`">
    {{ label }}
  </span>
</template>

<style scoped>
.app-status-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 42px;
  height: 22px;
  padding: 0 8px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 800;
}

.app-status-badge-normal {
  background: #e8f8ef;
  color: #00897b;
}

.app-status-badge-risk {
  background: #fff1df;
  color: #f08a24;
}

.app-status-badge-shortage {
  background: #ffe5e5;
  color: #e53935;
}

.app-status-badge-pending {
  background: #eaf1ff;
  color: #2f62c9;
}

.app-status-badge-cancelled {
  background: #eef0f3;
  color: #5f6673;
}
</style>
