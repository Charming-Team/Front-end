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
    <div class="search-card__body">
      <AppSearchField
        :model-value="modelValue"
        placeholder="주문번호, 고객사, 제품명 검색하세요"
        button-label="검색"
        @update:model-value="emit('update:modelValue', $event)"
        @search="emit('search')"
      />
    </div>
  </AppCard>
</template>

<style scoped>
.search-card__body {
  padding: 12px 20px;
}

@media (max-width: 560px) {
  .search-card__body {
    padding: 12px 16px;
  }
}
</style>
