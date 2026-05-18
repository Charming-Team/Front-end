<script setup>
import AppButton from "./AppButton.vue";

const props = defineProps({
  modelValue: { type: String, default: "" },
  placeholder: { type: String, default: "" },
  buttonLabel: { type: String, default: "검색" },
});

const emit = defineEmits(["update:modelValue", "search"]);

function onInput(event) {
  emit("update:modelValue", event.target.value);
}

function onKeydown(event) {
  if (event.key === "Enter") emit("search");
}
</script>

<template>
  <div
    class="flex min-w-0 flex-1 overflow-hidden rounded-[14px] border border-slate-200 bg-white transition-colors duration-150 focus-within:border-slate-300"
  >
    <input
      :value="modelValue"
      type="text"
      :placeholder="placeholder"
      class="h-[44px] min-w-0 flex-1 border-0 bg-transparent px-4 text-[14px] text-slate-900 outline-none placeholder:text-slate-400"
      @input="onInput"
      @keydown="onKeydown"
    />

    <AppButton
      variant="subtle"
      class="h-[44px] rounded-none border-0 border-l border-slate-200 bg-transparent px-4 text-[13px] font-semibold text-slate-600 shadow-none hover:bg-slate-50"
      @click="emit('search')"
    >
      {{ buttonLabel }}
    </AppButton>
  </div>
</template>
