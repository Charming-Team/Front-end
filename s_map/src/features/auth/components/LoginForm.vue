<script setup>
import AppButton from '../../../components/common/AppButton.vue'

defineProps({
  email: { type: String, default: '' },
  password: { type: String, default: '' },
  error: { type: String, default: '' },
  loading: { type: Boolean, default: false },
  logoSrc: { type: String, required: true },
})

const emit = defineEmits(['update:email', 'update:password', 'submit'])
</script>

<template>
  <div>
    <img :src="logoSrc" alt="S-MAP" class="mx-auto mb-7 block max-w-[200px]" />

    <h1 class="mb-1.5 text-center text-[26px] font-extrabold tracking-[-0.3px] text-[var(--color-navy)]">로그인</h1>
    <p class="mb-8 text-center text-[15px] text-slate-600">S-MAP 스마트 생산관리 시스템</p>

    <form class="flex flex-col gap-5" @submit.prevent="emit('submit')">
      <div class="flex flex-col gap-2">
        <label class="text-sm font-semibold text-[var(--color-navy)]" for="login-email">이메일</label>
        <input
          id="login-email"
          :value="email"
          type="email"
          class="h-[52px] rounded-lg border border-slate-300 bg-white px-4 text-[15px] text-[var(--color-navy)] outline-none transition focus:border-[#1565c0] focus:ring-4 focus:ring-[#1565c0]/12"
          placeholder="admin@s-map.com"
          required
          autocomplete="email"
          @input="emit('update:email', $event.target.value)"
        />
      </div>

      <div class="flex flex-col gap-2">
        <label class="text-sm font-semibold text-[var(--color-navy)]" for="login-password">비밀번호</label>
        <input
          id="login-password"
          :value="password"
          type="password"
          class="h-[52px] rounded-lg border border-slate-300 bg-white px-4 text-[15px] text-[var(--color-navy)] outline-none transition focus:border-[#1565c0] focus:ring-4 focus:ring-[#1565c0]/12"
          placeholder="비밀번호를 입력하세요"
          required
          autocomplete="current-password"
          @input="emit('update:password', $event.target.value)"
        />
      </div>

      <p v-if="error" class="m-0 rounded-lg bg-red-50 px-[14px] py-3 text-sm font-semibold text-red-700">{{ error }}</p>

      <AppButton type="submit" variant="primary" size="lg" :disabled="loading" :block="true">
        {{ loading ? '로그인 중...' : '로그인' }}
      </AppButton>
    </form>
  </div>
</template>
