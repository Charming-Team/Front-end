<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { setToken } from '../../../utils/storage.js'
import AuthCard from '../components/AuthCard.vue'
import LoginForm from '../components/LoginForm.vue'
import logoMain from '../../../assets/logo_main.svg'

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
  await new Promise(resolve => setTimeout(resolve, 320))

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
  <AuthCard>
    <LoginForm
      v-model:email="email"
      v-model:password="password"
      :error="error"
      :loading="loading"
      :logo-src="logoMain"
      @submit="handleLogin"
    />
  </AuthCard>
</template>
