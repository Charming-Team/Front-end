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
    <img :src="logoSrc" alt="S-MAP" class="login-logo" />

    <h1 class="login-title">로그인</h1>
    <p class="login-sub">S-MAP 스마트 생산관리 시스템</p>

    <form class="login-form" @submit.prevent="emit('submit')">
      <div class="field-group">
        <label class="field-label" for="login-email">이메일</label>
        <input
          id="login-email"
          :value="email"
          type="email"
          class="field-input"
          placeholder="admin@s-map.com"
          required
          autocomplete="email"
          @input="emit('update:email', $event.target.value)"
        />
      </div>

      <div class="field-group">
        <label class="field-label" for="login-password">비밀번호</label>
        <input
          id="login-password"
          :value="password"
          type="password"
          class="field-input"
          placeholder="비밀번호를 입력하세요"
          required
          autocomplete="current-password"
          @input="emit('update:password', $event.target.value)"
        />
      </div>

      <p v-if="error" class="login-error">{{ error }}</p>

      <AppButton type="submit" variant="primary" size="lg" :disabled="loading" :block="true">
        {{ loading ? '로그인 중...' : '로그인' }}
      </AppButton>
    </form>
  </div>
</template>

<style scoped src="../styles/login-form.css"></style>
