<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { setToken } from '../utils/storage.js'
import logoMain from '../assets/logo_main.png'

const MOCK_EMAIL = 'admin@s-map.com'
const MOCK_PASSWORD = 'smap1234!'

const router = useRouter()
const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function handleLogin() {
  error.value = ''
  loading.value = true
  await new Promise((r) => setTimeout(r, 320))

  if (email.value !== MOCK_EMAIL || password.value !== MOCK_PASSWORD) {
    error.value = '이메일 또는 비밀번호가 올바르지 않습니다.'
    loading.value = false
    return
  }

  setToken('mock-token-s-map')
  router.push('/')
}
</script>

<template>
  <div class="login-shell">
    <div class="login-card">
      <img :src="logoMain" alt="S-MAP" class="login-logo" />

      <h1 class="login-title">로그인</h1>
      <p class="login-sub">S-MAP 스마트 생산관리 시스템</p>

      <form class="login-form" @submit.prevent="handleLogin">
        <div class="field-group">
          <label class="field-label" for="login-email">이메일</label>
          <input
            id="login-email"
            v-model="email"
            type="email"
            class="field-input"
            placeholder="admin@s-map.com"
            required
            autocomplete="email"
          />
        </div>

        <div class="field-group">
          <label class="field-label" for="login-password">비밀번호</label>
          <input
            id="login-password"
            v-model="password"
            type="password"
            class="field-input"
            placeholder="비밀번호를 입력하세요"
            required
            autocomplete="current-password"
          />
        </div>

        <p v-if="error" class="login-error">{{ error }}</p>

        <button type="submit" class="btn-login" :disabled="loading">
          {{ loading ? '로그인 중...' : '로그인' }}
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.login-shell {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8fafc;
  font-family: "Pretendard Variable", Pretendard, "Noto Sans KR", Inter, -apple-system, BlinkMacSystemFont, sans-serif;
  -webkit-font-smoothing: antialiased;
}

.login-card {
  width: 100%;
  max-width: 440px;
  padding: 48px 44px 44px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 12px 40px rgba(13, 31, 60, 0.1);
}

.login-logo {
  display: block;
  max-width: 200px;
  margin: 0 auto 28px;
}

.login-title {
  margin: 0 0 6px;
  color: #0d1f3c;
  font-size: 26px;
  font-weight: 800;
  text-align: center;
  letter-spacing: -0.3px;
}

.login-sub {
  margin: 0 0 32px;
  color: #4a5568;
  font-size: 15px;
  text-align: center;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field-label {
  color: #0d1f3c;
  font-size: 14px;
  font-weight: 650;
}

.field-input {
  height: 52px;
  padding: 0 16px;
  border: 1px solid #cbd5e0;
  border-radius: 8px;
  background: #fff;
  color: #0d1f3c;
  font-size: 15px;
  font-family: inherit;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.field-input:focus {
  border-color: #1565c0;
  box-shadow: 0 0 0 3px rgba(21, 101, 192, 0.12);
}

.field-input::placeholder {
  color: #a0aec0;
}

.login-error {
  margin: 0;
  padding: 12px 14px;
  border-radius: 8px;
  background: #fdecea;
  color: #c62828;
  font-size: 14px;
  font-weight: 600;
}

.btn-login {
  height: 54px;
  border: none;
  border-radius: 8px;
  background: #1565c0;
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.15s, transform 0.1s;
}

.btn-login:hover:not(:disabled) {
  background: #0d47a1;
}

.btn-login:active:not(:disabled) {
  transform: scale(0.99);
}

.btn-login:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}
</style>
