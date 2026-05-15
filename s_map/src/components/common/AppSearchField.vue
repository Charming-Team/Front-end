<script setup>

const props = defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  buttonLabel: { type: String, default: '검색' },
})

const emit = defineEmits(['update:modelValue', 'search'])

function onInput(event) {
  emit('update:modelValue', event.target.value)
}

function onKeydown(event) {
  if (event.key === 'Enter') emit('search')
}
</script>

<template>
  <div class="flex min-w-0 flex-1 overflow-hidden rounded-[14px] border border-slate-200 bg-white shadow-sm">
    <input
      :value="modelValue"
      type="text"
      :placeholder="placeholder"
      class="h-[52px] min-w-0 flex-1 border-0 bg-transparent px-4 text-[15px] text-slate-900 outline-none placeholder:text-slate-400"
      @input="onInput"
      @keydown="onKeydown"
    />

    <AppButton
      variant="subtle"
      class="h-[52px] rounded-none border-0 border-l border-slate-200 px-5 text-[15px] font-semibold shadow-none"
      @click="emit('search')"
    >
      {{ buttonLabel }}
    </AppButton>
  </div>
</template>
