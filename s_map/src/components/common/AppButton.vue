<script setup>
import { computed, useAttrs } from 'vue'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps({
  variant: { type: String, default: 'primary' },
  size: { type: String, default: 'md' },
  type: { type: String, default: 'button' },
  iconOnly: { type: Boolean, default: false },
  block: { type: Boolean, default: false },
})

const attrs = useAttrs()

const forwardedAttrs = computed(() => {
  const { class: _class, ...rest } = attrs
  return rest
})

const buttonClass = computed(() => [
  'inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border font-bold leading-none whitespace-nowrap no-underline transition-[background-color,border-color,color,transform,box-shadow] duration-150 ease-out active:scale-[0.99] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-65',
  props.size === 'sm'
    ? 'min-h-9 px-3.5 text-[13px]'
    : props.size === 'lg'
      ? 'min-h-[50px] px-6 text-[15px]'
      : props.size === 'icon'
        ? 'size-10 min-w-10 p-0'
        : 'min-h-[42px] px-[18px] text-sm',
  props.variant === 'secondary'
    ? 'border border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
    : props.variant === 'surface'
      ? 'border border-slate-300 bg-white text-[var(--color-navy)] shadow-[0_6px_18px_rgba(18,34,64,0.04)] hover:border-[#b7c7db] hover:bg-[#f8fbff]'
      : props.variant === 'subtle'
        ? 'border border-slate-300 bg-slate-50 text-[var(--color-navy)] hover:bg-blue-50'
        : props.variant === 'danger-outline'
          ? 'border border-red-600 bg-white text-red-700 hover:bg-red-50'
          : 'border border-transparent bg-[#1565c0] text-white hover:bg-[#0d47a1]',
  {
    'gap-0': props.iconOnly,
    'w-full': props.block,
  },
  attrs.class,
])
</script>

<template>
  <button
    v-bind="forwardedAttrs"
    :type="type"
    :class="buttonClass"
  >
    <slot />
  </button>
</template>
