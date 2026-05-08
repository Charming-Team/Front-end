<script setup>
import { computed } from 'vue'
import AppButton from '../common/AppButton.vue'

const props = defineProps({
  statusOptions: { type: Array, required: true },
  status: { type: String, default: '' },
  search: { type: String, default: '' },
})

const emit = defineEmits(['update:status', 'update:search', 'search', 'status-change'])

const statusValue = computed({
  get: () => props.status,
  set: value => emit('update:status', value),
})

const searchValue = computed({
  get: () => props.search,
  set: value => emit('update:search', value),
})

function onStatusChange(event) {
  statusValue.value = event.target.value
  emit('status-change')
}

function onSearchKeydown(event) {
  if (event.key === 'Enter') emit('search')
}
</script>

<template>
  <div class="filter-bar">
    <select :value="statusValue" class="filter-select" @change="onStatusChange">
      <option v-for="item in statusOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
    </select>
    <div class="search-wrap">
      <input
        :value="searchValue"
        class="search-input"
        type="text"
        placeholder="계획ID, 주문ID, 제품명, 라인, 담당자 검색"
        @input="searchValue = $event.target.value"
        @keydown="onSearchKeydown"
      />
      <AppButton variant="subtle" class="search-button" @click="emit('search')">검색</AppButton>
    </div>
  </div>
</template>

<style scoped src="./styles/plan-filter-bar.css"></style>
