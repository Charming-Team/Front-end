<script setup>
import { computed } from "vue";
import AppCard from "../common/AppCard.vue";
import AppSearchField from "../common/AppSearchField.vue";

const props = defineProps({
  keyword: { type: String, default: "" },
});

const emit = defineEmits(["update:keyword", "search"]);

const keywordValue = computed({
  get: () => props.keyword,
  set: (value) => emit("update:keyword", value),
});
</script>

<template>
  <AppCard class="line-search-card">
    <div class="line-search-card-body">
      <AppSearchField
        class="line-search-card-field"
        :model-value="keywordValue"
        placeholder="주문번호, 제품명, 라인명으로 검색하세요."
        button-label="검색"
        @update:model-value="keywordValue = $event"
        @search="emit('search')"
      />

      <p class="line-search-card-hint">
        주문번호를 외우지 않아도 됩니다. 예: ABS-Black, PP-Heat, Line A
      </p>
    </div>
  </AppCard>
</template>

<style scoped>
.line-search-card-body {
  padding: 10px 20px;
}

.line-search-card-field {
  flex: 1;
  min-width: 0;
}

.line-search-card-field:deep(input) {
  height: 38px;
  font-size: 13px;
}

.line-search-card-field:deep(.h-\[44px\]) {
  height: 38px;
}

.line-search-card-field:deep(button) {
  height: 38px;
  padding-inline: 14px;
  font-size: 12px;
}

.line-search-card-hint {
  margin: 8px 2px 0;
  color: #64748b;
  font-size: 12px;
  font-weight: 600;
}

@media (max-width: 760px) {
  .line-search-card-body {
    padding: 10px 16px;
  }
}
</style>
