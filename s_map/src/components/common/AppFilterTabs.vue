<script setup>
defineProps({
  tabs:       { type: Array,  default: () => [] },
  modelValue: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue'])
</script>

<template>
  <div class="flex gap-0 border-b border-slate-200">
    <button
      v-for="tab in tabs"
      :key="tab.key"
      type="button"
      class="px-4 py-2.5 text-[13px] font-semibold transition-colors"
      :class="modelValue === tab.key
        ? 'border-b-2 border-blue-600 -mb-px font-bold text-[var(--color-primary)]'
        : 'border-b-2 border-transparent -mb-px text-[var(--color-text-subtle)] hover:text-[var(--color-text-main)]'"
      @click="emit('update:modelValue', tab.key)"
    >
      {{ tab.label }}
      <span
        class="ml-1.5 inline-flex items-center justify-center rounded-full px-1.5 py-px text-[11px] font-bold"
        :class="modelValue === tab.key ? 'bg-blue-100 text-blue-700' : 'bg-[var(--color-track-light)] text-[var(--color-text-subtle)]'"
      >{{ tab.count }}</span>
    </button>
  </div>
</template>
