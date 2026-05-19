<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { setToken, setUserRole } from '../../../utils/storage.js'
import AuthCard from '../components/AuthCard.vue'
import LoginForm from '../components/LoginForm.vue'
import logoMain from '../../../assets/logo_main.svg'

const MOCK_USERS = [
  {
    email: 'ad@sk.com',
    password: 'smap1234!',
    role: 'ADMIN',
  },
  {
    email: 'admin@sk.com',
    password: 'smap1234!',
    role: 'OPERATOR',
  },
  {
    email: 'worker@sk.com',
    password: 'worker1234!',
    role: 'OPERATOR',
  },
  {
    email: 'manager@sk.com',
    password: 'smap1234!',
    role: 'MANUFACTURING_MANAGER',
  },
  {
    email: 'executive@sk.com',
    password: 'smap1234!',
    role: 'EXECUTIVE',
  },
]

const router = useRouter()
const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function handleLogin() {
  error.value = ''
  loading.value = true
  await new Promise(resolve => setTimeout(resolve, 320))

  const user = MOCK_USERS.find(
    item => item.email === email.value && item.password === password.value
  )

  if (!user) {
    error.value = '이메일 또는 비밀번호가 올바르지 않습니다.'
    loading.value = false
    return
  }

  setToken('mock-token-s-map')
  setUserRole(user.role)
  router.push(user.role === 'ADMIN' ? '/admin' : '/')
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
