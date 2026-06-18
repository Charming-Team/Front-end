<script setup>
import AppCard from "../common/AppCard.vue";
import AppSearchField from "../common/AppSearchField.vue";

defineProps({
  modelValue: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["update:modelValue", "search"]);
</script>

<template>
  <AppCard class="search-card">
    <div class="search-card-body">
      <AppSearchField
        class="search-card-field"
        :model-value="modelValue"
        placeholder="자재 ID, 자재명, 관련 제품명을 검색하세요"
        button-label="검색"
        @update:model-value="emit('update:modelValue', $event)"
        @search="emit('search')"
      />
    </div>
  </AppCard>
</template>

<style scoped>
.search-card-body {
  padding: 12px 20px;
}

@media (max-width: 560px) {
  .search-card-body {
    padding: 12px 16px;
  }
}
</style>
