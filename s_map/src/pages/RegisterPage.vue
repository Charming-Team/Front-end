<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import DashboardLayout from '../layouts/DashboardLayout.vue'

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
  <DashboardLayout>
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
                <option v-for="r in roles" :key="r.value" :value="r.value">{{ r.label }}</option>
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
            <button type="button" class="btn-cancel" @click="router.push('/')">취소</button>
            <button type="submit" class="btn-submit">등록</button>
          </div>
        </form>
      </div>
    </div>
  </DashboardLayout>
</template>

<style scoped>
.register-wrap {
  padding: 0;
}

.register-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 7px 18px rgba(0, 0, 0, 0.05);
  padding: 40px 48px 44px;
}

.register-header {
  margin-bottom: 36px;
  padding-bottom: 24px;
  border-bottom: 1px solid #e2e8f0;
}

.register-title {
  margin: 0 0 8px;
  color: #0d1f3c;
  font-size: 26px;
  font-weight: 800;
  letter-spacing: -0.3px;
}

.register-sub {
  margin: 0;
  color: #4a5568;
  font-size: 15px;
}

.required-note {
  color: #e53935;
  font-weight: 600;
}

.register-success {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 22px 24px;
  border-radius: 10px;
  background: #e6f4ea;
  color: #00897b;
  font-size: 16px;
  font-weight: 700;
}

.register-success svg {
  width: 28px;
  height: 28px;
  flex: 0 0 auto;
  fill: none;
  stroke: currentColor;
  stroke-width: 2.6;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.register-form {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px 32px;
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

.req {
  color: #e53935;
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
  appearance: none;
}

.field-input:focus {
  border-color: #1565c0;
  box-shadow: 0 0 0 3px rgba(21, 101, 192, 0.12);
}

.field-input::placeholder {
  color: #a0aec0;
}

.register-error {
  margin: 0;
  padding: 12px 14px;
  border-radius: 8px;
  background: #fdecea;
  color: #c62828;
  font-size: 14px;
  font-weight: 600;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 14px;
  padding-top: 8px;
  border-top: 1px solid #e2e8f0;
}

.btn-cancel,
.btn-submit {
  height: 50px;
  padding: 0 32px;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.15s, transform 0.1s;
}

.btn-cancel {
  border: 1px solid #cbd5e0;
  background: #fff;
  color: #4a5568;
}

.btn-cancel:hover {
  background: #f7fafc;
}

.btn-submit {
  border: none;
  background: #1565c0;
  color: #fff;
}

.btn-submit:hover {
  background: #0d47a1;
}

.btn-submit:active {
  transform: scale(0.99);
}

@media (max-width: 768px) {
  .register-card {
    padding: 28px 20px 32px;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
