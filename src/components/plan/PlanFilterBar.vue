<script setup>
import { computed } from 'vue'
import AppSearchField from '../common/AppSearchField.vue'
import AppSelect from '../common/AppSelect.vue'

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

function onStatusChange(value) {
  statusValue.value = value
  emit('status-change')
}

</script>

<template>
  <div class="flex items-center gap-2">
    <AppSelect
      :model-value="statusValue"
      :options="statusOptions"
      class="w-[160px] shrink-0"
      @update:model-value="statusValue = $event"
      @change="onStatusChange"
    />

    <AppSearchField
      class="flex-1 min-w-0"
      :model-value="searchValue"
      placeholder="계획ID, 주문ID, 제품명, 라인, 담당자 검색"
      @update:model-value="searchValue = $event"
      @search="emit('search')"
    />
  </div>
</template>
