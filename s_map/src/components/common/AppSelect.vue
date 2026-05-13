<script setup>
defineProps({
  modelValue: { type: [String, Number], default: '' },
  options: { type: Array, default: () => [] },
  optionValueKey: { type: String, default: 'value' },
  optionLabelKey: { type: String, default: 'label' },
})

const emit = defineEmits(['update:modelValue', 'change'])

function onChange(event) {
  const value = event.target.value
  emit('update:modelValue', value)
  emit('change', value)
}
</script>

<template>
  <div class="relative min-w-[160px]">
    <select
      :value="modelValue"
      class="h-[52px] w-full appearance-none rounded-[14px] border border-slate-200 bg-white px-4 pr-11 text-[15px] font-semibold text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
      @change="onChange"
    >
      <option
        v-for="option in options"
        :key="String(option[optionValueKey])"
        :value="option[optionValueKey]"
      >
        {{ option[optionLabelKey] }}
      </option>
    </select>

    <span class="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-500">
      <svg class="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M6 8l4 4 4-4" />
      </svg>
    </span>
  </div>
</template>
