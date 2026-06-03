<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { setRefreshToken, setToken, setUserInfo, setUserRole } from '../../../utils/storage.js'
import { login } from '../api.js'
import AuthCard from '../components/AuthCard.vue'
import LoginForm from '../components/LoginForm.vue'
import logoMain from '../../../assets/logo_main.svg'

const router = useRouter()
const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function handleLogin() {
  error.value = ''
  loading.value = true

  try {
    const user = await login({
      email: email.value,
      password: password.value,
    })

    setToken(user.accessToken)
    setRefreshToken(user.refreshToken)
    setUserRole(user.role)
    setUserInfo({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    })

    router.push(user.role === 'ADMIN' ? '/admin' : '/')
  } catch (err) {
    error.value = err.message || '로그인에 실패했습니다.'
  } finally {
    loading.value = false
  }
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
