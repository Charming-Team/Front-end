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
  <div class="mb-4 flex flex-wrap items-center gap-3">
    <select
      :value="statusValue"
      class="min-w-[130px] rounded-lg border border-slate-300 bg-white px-[14px] py-2.5 text-sm font-semibold text-[var(--color-navy)] outline-none transition focus:border-[#1565c0] focus:ring-4 focus:ring-[#1565c0]/12"
      @change="onStatusChange"
    >
      <option v-for="item in statusOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
    </select>
    <div class="flex min-w-[260px] max-w-[480px] flex-1 items-center overflow-hidden rounded-lg border border-slate-300 bg-white">
      <input
        :value="searchValue"
        class="h-[42px] flex-1 bg-transparent px-[14px] text-sm text-[var(--color-navy)] outline-none placeholder:text-slate-400"
        type="text"
        placeholder="계획ID, 주문ID, 제품명, 라인, 담당자 검색"
        @input="searchValue = $event.target.value"
        @keydown="onSearchKeydown"
      />
      <AppButton variant="subtle" class="min-h-[42px] rounded-none border-0 border-l border-l-slate-300 shadow-none" @click="emit('search')">검색</AppButton>
    </div>
  </div>
</template>
