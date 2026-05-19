<script setup>
defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: "완료되었습니다",
  },
  message: {
    type: String,
    default: "",
  },
  type: {
    type: String,
    default: "success",
  },
});
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="translate-y-3 opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="translate-y-3 opacity-0"
    >
      <div
        v-if="show"
        class="fixed bottom-8 right-8 z-[10000] w-[360px] rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-2xl"
      >
        <div class="flex gap-3">
          <div
            class="grid h-9 w-9 shrink-0 place-items-center rounded-full text-white"
            :class="type === 'success' ? 'bg-emerald-500' : 'bg-[#0b4ea2]'"
          >
            ✓
          </div>

          <div>
            <p class="text-[15px] font-black text-[#0f2f5f]">
              {{ title }}
            </p>
            <p
              v-if="message"
              class="mt-1 text-[13px] font-semibold leading-5 text-slate-500"
            >
              {{ message }}
            </p>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>