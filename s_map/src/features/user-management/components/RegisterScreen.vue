<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const form = reactive({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: '',
  company: '',
  department: '',
  phone: '',
})

const error = ref('')
const success = ref(false)

const roles = [
  { value: 'factory_admin', label: '공장 관리자' },
  { value: 'process_engineer', label: '공정 엔지니어' },
  { value: 'executive', label: '경영자' },
  { value: 'server_admin', label: '서버 관리자' },
]

function handleSubmit() {
  error.value = ''
  if (form.password !== form.confirmPassword) {
    error.value = '비밀번호가 일치하지 않습니다.'
    return
  }

  success.value = true
  setTimeout(() => router.push('/'), 2000)
}
</script>

<template>
  <div class="register-shell">
    <div class="register-wrap">
      <div class="register-card">
        <div class="register-header">
          <h1 class="register-title">사용자 등록</h1>
          <p class="register-sub">새 사용자 계정을 등록합니다. <span class="required-note">* 필수 항목</span></p>
        </div>

        <div v-if="success" class="register-success">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
          사용자가 등록되었습니다. 대시보드로 이동합니다...
        </div>

        <form v-else class="register-form" @submit.prevent="handleSubmit">
          <div class="form-grid">
            <div class="field-group">
              <label class="field-label" for="reg-name">이름 <span class="req">*</span></label>
              <input id="reg-name" v-model="form.name" type="text" class="field-input" placeholder="이름을 입력하세요" required />
            </div>

            <div class="field-group">
              <label class="field-label" for="reg-email">이메일 <span class="req">*</span></label>
              <input id="reg-email" v-model="form.email" type="email" class="field-input" placeholder="이메일을 입력하세요" required />
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
              <input id="reg-company" v-model="form.company" type="text" class="field-input" placeholder="회사명을 입력하세요" required />
            </div>

            <div class="field-group">
              <label class="field-label" for="reg-dept">부서</label>
              <input id="reg-dept" v-model="form.department" type="text" class="field-input" placeholder="부서를 입력하세요" />
            </div>

            <div class="field-group">
              <label class="field-label" for="reg-phone">연락처</label>
              <input id="reg-phone" v-model="form.phone" type="tel" class="field-input" placeholder="연락처를 입력하세요" />
            </div>
          </div>

          <p v-if="error" class="register-error">{{ error }}</p>

          <div class="form-actions">
            <AppButton variant="secondary" size="lg" @click="router.push('/login')">취소</AppButton>
            <AppButton type="submit" variant="primary" size="lg">등록</AppButton>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped src="../styles/register-page.css"></style>
