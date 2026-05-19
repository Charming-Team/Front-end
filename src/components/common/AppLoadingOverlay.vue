<script setup>
defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: "처리 중입니다",
  },
  description: {
    type: String,
    default: "잠시만 기다려 주세요.",
  },
});
</script>

<template>
  <Teleport to="body">
    <div
      v-if="show"
      class="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/35 backdrop-blur-[2px]"
    >
      <div
        class="grid w-[360px] justify-items-center gap-5 rounded-2xl bg-white px-8 py-9 text-center shadow-2xl"
      >
        <div class="relative h-14 w-14">
          <div
            class="absolute inset-0 rounded-full border-4 border-slate-200"
          />
          <div
            class="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-[#0b4ea2]"
          />
        </div>

        <div>
          <p class="text-[20px] font-black text-[#0f2f5f]">
            {{ title }}
          </p>
          <p class="mt-2 text-[14px] font-semibold leading-6 text-slate-500">
            {{ description }}
          </p>
        </div>
      </div>
    </div>
  </Teleport>
</template>