<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { createAdminUser, registerUser } from '../api.js'

const props = defineProps({
  redirectPath: {
    type: String,
    default: '/',
  },
  cancelPath: {
    type: String,
    default: '/login',
  },
  elevated: {
    type: Boolean,
    default: false,
  },
  adminMode: {
    type: Boolean,
    default: false,
  },
})

const router = useRouter()

const form = reactive({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: '',
  companyName: '',
  department: '',
  phoneNumber: '',
})

const error = ref('')
const success = ref(false)
const loading = ref(false)
const registeredUser = ref(null)
const emailPattern = /^[a-z0-9._%+-]+@sk\.com$/i
const passwordPattern = /^(?=.*[A-Z])(?=.*[!@#$~])(?=(?:.*\d){2,}).{11,100}$/
const phonePattern = /^010-\d{4}-\d{4}$/

const roles = [
  { value: 'ADMIN', label: '서버 관리자' },
  { value: 'OPERATOR', label: '작업자' },
  { value: 'EXECUTIVE', label: '경영진' },
  { value: 'MANUFACTURING_MANAGER', label: '제조관리직' },
]

function formatPhoneNumber(value) {
  const digits = value.replace(/\D/g, '').slice(0, 11)

  if (digits.length <= 3) return digits
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
}

function handlePhoneInput(event) {
  form.phoneNumber = formatPhoneNumber(event.target.value)
}

async function handleSubmit() {
  error.value = ''
  form.phoneNumber = formatPhoneNumber(form.phoneNumber)

  if (form.password !== form.confirmPassword) {
    error.value = '비밀번호가 일치하지 않습니다.'
    return
  }
  if (props.adminMode && !emailPattern.test(form.email.trim())) {
    error.value = '이메일은 sk.com 도메인만 사용할 수 있습니다.'
    return
  }
  if (props.adminMode && !passwordPattern.test(form.password)) {
    error.value = '비밀번호는 대문자 1개, 특수기호(!,@,#,$,~) 1개, 숫자 2개를 포함하고 11자 이상이어야 합니다.'
    return
  }
  if (props.adminMode && !phonePattern.test(form.phoneNumber.trim())) {
    error.value = '연락처는 010-1234-5678 형식이어야 합니다.'
    return
  }

  loading.value = true

  try {
    const payload = {
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password,
      passwordConfirm: form.confirmPassword,
      role: form.role,
      department: form.department.trim(),
      companyName: form.companyName.trim(),
      phoneNumber: form.phoneNumber.trim(),
    }
    const response = props.adminMode
      ? await createAdminUser(payload)
      : await registerUser(payload)

    if (!response.success) {
      throw new Error(response.message || '사용자 등록에 실패했습니다.')
    }

    registeredUser.value = response.data
    success.value = true
    setTimeout(() => router.push(props.redirectPath), 2000)
  } catch (err) {
    error.value = err.message || '사용자 등록에 실패했습니다.'
  } finally {
    loading.value = false
  }
}

function handleCancel() {
  router.push(props.cancelPath)
}
</script>

<template>
  <div class="register-shell" :class="{ 'register-shell--elevated': elevated }">
    <div class="register-wrap">
      <div class="register-card">
        <div class="register-header">
          <h1 class="register-title">사용자 등록</h1>
          <p class="register-sub">새 사용자 계정을 등록합니다. <span class="required-note">* 필수 항목</span></p>
        </div>

        <div v-if="success" class="register-success">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
          {{ registeredUser?.name || '사용자' }} 사용자가 등록되었습니다. 대시보드로 이동합니다...
        </div>

        <form v-else class="register-form" @submit.prevent="handleSubmit">
          <div class="form-grid">
            <div class="field-group">
              <label class="field-label" for="reg-name">이름 <span class="req">*</span></label>
              <input id="reg-name" v-model="form.name" type="text" class="field-input" placeholder="이름을 입력하세요" required />
            </div>

            <div class="field-group">
              <label class="field-label" for="reg-email">이메일 <span class="req">*</span></label>
              <input
                id="reg-email"
                v-model="form.email"
                type="email"
                class="field-input"
                placeholder="user@sk.com"
                inputmode="email"
                autocomplete="email"
                :pattern="adminMode ? '[a-zA-Z0-9._%+-]+@sk\\.com' : undefined"
                title="이메일은 sk.com 도메인만 사용할 수 있습니다."
                required
              />
            </div>

            <div class="field-group">
              <label class="field-label" for="reg-password">비밀번호 <span class="req">*</span></label>
              <input id="reg-password" v-model="form.password" type="password" class="field-input" placeholder="비밀번호를 입력하세요" required />
            </div>

            <div class="field-group">
              <label class="field-label" for="reg-confirm">비밀번호 확인 <span class="req">*</span></label>
              <input id="reg-confirm" v-model="form.confirmPassword" type="password" class="field-input" placeholder="비밀번호를 다시 입력하세요" required />
            </div>

            <div class="field-group">
              <label class="field-label" for="reg-role">권한 <span class="req">*</span></label>
              <select id="reg-role" v-model="form.role" class="field-input" required>
                <option value="" disabled>권한을 선택하세요</option>
                <option v-for="role in roles" :key="role.value" :value="role.value">{{ role.label }}</option>
              </select>
            </div>

            <div class="field-group">
              <label class="field-label" for="reg-company">회사명 <span class="req">*</span></label>
              <input id="reg-company" v-model="form.companyName" type="text" class="field-input" placeholder="회사명을 입력하세요" required />
            </div>

            <div class="field-group">
              <label class="field-label" for="reg-dept">부서 <span class="req">*</span></label>
              <input id="reg-dept" v-model="form.department" type="text" class="field-input" placeholder="부서를 입력하세요" required />
            </div>

            <div class="field-group">
              <label class="field-label" for="reg-phone">연락처 <span class="req">*</span></label>
              <input
                id="reg-phone"
                :value="form.phoneNumber"
                type="tel"
                class="field-input"
                placeholder="010-1234-5678"
                inputmode="numeric"
                autocomplete="tel"
                maxlength="13"
                pattern="010-[0-9]{4}-[0-9]{4}"
                title="연락처는 010-1234-5678 형식이어야 합니다."
                required
                @input="handlePhoneInput"
              />
            </div>
          </div>

          <p v-if="error" class="register-error">{{ error }}</p>

          <div class="form-actions">
            <AppButton variant="secondary" size="lg" :disabled="loading" @click="handleCancel">취소</AppButton>
            <AppButton type="submit" variant="primary" size="lg" :disabled="loading">{{ loading ? '등록 중...' : '사용자 등록' }}</AppButton>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped src="../styles/register-page.css"></style>
