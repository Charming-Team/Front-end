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
  'app-btn',
  `app-btn--${props.variant}`,
  `app-btn--${props.size}`,
  {
    'app-btn--icon-only': props.iconOnly,
    'app-btn--block': props.block,
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
