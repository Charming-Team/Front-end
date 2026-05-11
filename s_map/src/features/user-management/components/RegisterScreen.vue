<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppButton from '../../../components/common/AppButton.vue'

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
  <div class="flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-4 py-8">
    <div class="w-full max-w-[980px]">
      <div class="rounded-xl border border-slate-200 bg-white px-5 py-8 shadow-[0_7px_18px_rgba(0,0,0,0.05)] sm:px-8 lg:px-12 lg:py-10">
        <div class="mb-9 border-b border-slate-200 pb-6">
          <h1 class="mb-2 text-[26px] font-extrabold tracking-[-0.3px] text-[var(--color-navy)]">사용자 등록</h1>
          <p class="text-[15px] text-slate-600">새 사용자 계정을 등록합니다. <span class="font-semibold text-[#e53935]">* 필수 항목</span></p>
        </div>

        <div v-if="success" class="flex items-center gap-3.5 rounded-[10px] bg-emerald-50 px-6 py-[22px] text-base font-bold text-[#00897b]">
          <svg viewBox="0 0 24 24" aria-hidden="true" class="size-7 shrink-0 fill-none stroke-current [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:2.6]"><path d="M20 6 9 17l-5-5" /></svg>
          사용자가 등록되었습니다. 대시보드로 이동합니다...
        </div>

        <form v-else class="flex flex-col gap-7" @submit.prevent="handleSubmit">
          <div class="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2">
            <div class="flex flex-col gap-2">
              <label class="text-sm font-semibold text-[var(--color-navy)]" for="reg-name">이름 <span class="text-[#e53935]">*</span></label>
              <input id="reg-name" v-model="form.name" type="text" class="h-[52px] rounded-lg border border-slate-300 bg-white px-4 text-[15px] text-[var(--color-navy)] outline-none transition focus:border-[#1565c0] focus:ring-4 focus:ring-[#1565c0]/12" placeholder="이름을 입력하세요" required />
            </div>

            <div class="flex flex-col gap-2">
              <label class="text-sm font-semibold text-[var(--color-navy)]" for="reg-email">이메일 <span class="text-[#e53935]">*</span></label>
              <input id="reg-email" v-model="form.email" type="email" class="h-[52px] rounded-lg border border-slate-300 bg-white px-4 text-[15px] text-[var(--color-navy)] outline-none transition focus:border-[#1565c0] focus:ring-4 focus:ring-[#1565c0]/12" placeholder="이메일을 입력하세요" required />
            </div>

            <div class="flex flex-col gap-2">
              <label class="text-sm font-semibold text-[var(--color-navy)]" for="reg-password">비밀번호 <span class="text-[#e53935]">*</span></label>
              <input id="reg-password" v-model="form.password" type="password" class="h-[52px] rounded-lg border border-slate-300 bg-white px-4 text-[15px] text-[var(--color-navy)] outline-none transition focus:border-[#1565c0] focus:ring-4 focus:ring-[#1565c0]/12" placeholder="비밀번호를 입력하세요" required />
            </div>

            <div class="flex flex-col gap-2">
              <label class="text-sm font-semibold text-[var(--color-navy)]" for="reg-confirm">비밀번호 확인 <span class="text-[#e53935]">*</span></label>
              <input id="reg-confirm" v-model="form.confirmPassword" type="password" class="h-[52px] rounded-lg border border-slate-300 bg-white px-4 text-[15px] text-[var(--color-navy)] outline-none transition focus:border-[#1565c0] focus:ring-4 focus:ring-[#1565c0]/12" placeholder="비밀번호를 다시 입력하세요" required />
            </div>

            <div class="flex flex-col gap-2">
              <label class="text-sm font-semibold text-[var(--color-navy)]" for="reg-role">권한 <span class="text-[#e53935]">*</span></label>
              <select id="reg-role" v-model="form.role" class="h-[52px] appearance-none rounded-lg border border-slate-300 bg-white px-4 text-[15px] text-[var(--color-navy)] outline-none transition focus:border-[#1565c0] focus:ring-4 focus:ring-[#1565c0]/12" required>
                <option value="" disabled>권한을 선택하세요</option>
                <option v-for="role in roles" :key="role.value" :value="role.value">{{ role.label }}</option>
              </select>
            </div>

            <div class="flex flex-col gap-2">
              <label class="text-sm font-semibold text-[var(--color-navy)]" for="reg-company">회사명 <span class="text-[#e53935]">*</span></label>
              <input id="reg-company" v-model="form.company" type="text" class="h-[52px] rounded-lg border border-slate-300 bg-white px-4 text-[15px] text-[var(--color-navy)] outline-none transition focus:border-[#1565c0] focus:ring-4 focus:ring-[#1565c0]/12" placeholder="회사명을 입력하세요" required />
            </div>

            <div class="flex flex-col gap-2">
              <label class="text-sm font-semibold text-[var(--color-navy)]" for="reg-dept">부서</label>
              <input id="reg-dept" v-model="form.department" type="text" class="h-[52px] rounded-lg border border-slate-300 bg-white px-4 text-[15px] text-[var(--color-navy)] outline-none transition focus:border-[#1565c0] focus:ring-4 focus:ring-[#1565c0]/12" placeholder="부서를 입력하세요" />
            </div>

            <div class="flex flex-col gap-2">
              <label class="text-sm font-semibold text-[var(--color-navy)]" for="reg-phone">연락처</label>
              <input id="reg-phone" v-model="form.phone" type="tel" class="h-[52px] rounded-lg border border-slate-300 bg-white px-4 text-[15px] text-[var(--color-navy)] outline-none transition focus:border-[#1565c0] focus:ring-4 focus:ring-[#1565c0]/12" placeholder="연락처를 입력하세요" />
            </div>
          </div>

          <p v-if="error" class="m-0 rounded-lg bg-red-50 px-[14px] py-3 text-sm font-semibold text-red-700">{{ error }}</p>

          <div class="flex justify-end gap-3.5 border-t border-slate-200 pt-2">
            <AppButton variant="secondary" size="lg" @click="router.push('/login')">취소</AppButton>
            <AppButton type="submit" variant="primary" size="lg">등록</AppButton>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
