<script setup>
import { computed, onMounted, ref } from 'vue'
import AppButton from '../../../components/common/AppButton.vue'
import AppModal from '../../../components/common/AppModal.vue'
import AppSearchField from '../../../components/common/AppSearchField.vue'
import { deleteUser, fetchUsers } from '../api.js'

const ROLE_LABELS = {
  ADMIN: '서버관리자',
  OPERATOR: '작업자',
  EXECUTIVE: '경영진',
  MANUFACTURING_MANAGER: '제조관리직',
}

const STATUS_LABELS = {
  ACTIVE: '활성',
  SUSPENDED: '정지',
  BANNED: '차단',
  WITHDRAWN: '탈퇴',
}

const search = ref('')
const page = ref(0)
const pageSize = ref(10)
const users = ref([])
const pageInfo = ref({
  totalElements: 0,
  totalPages: 0,
  numberOfElements: 0,
  page: 0,
  first: true,
  last: true,
  empty: true,
})
const loading = ref(false)
const deleting = ref(false)
const error = ref('')
const deleteTarget = ref(null)

function getPageNumber(info) {
  return info.page ?? info.number ?? 0
}

const pageSummary = computed(() => {
  const currentPage = pageInfo.value.totalPages === 0 ? 0 : getPageNumber(pageInfo.value) + 1
  return `${currentPage} / ${pageInfo.value.totalPages}`
})

function roleLabel(role) {
  return ROLE_LABELS[role] ?? role
}

function statusLabel(status) {
  return STATUS_LABELS[status] ?? status
}

async function loadUsers(targetPage = page.value) {
  loading.value = true
  error.value = ''

  try {
    const response = await fetchUsers({
      page: targetPage,
      size: pageSize.value,
      search: search.value,
    })

    if (!response.success) {
      throw new Error(response.message || '사용자 목록을 불러오지 못했습니다.')
    }

    users.value = response.data.content
    pageInfo.value = response.data
    page.value = getPageNumber(response.data)
  } catch (err) {
    error.value = err.message || '사용자 목록을 불러오지 못했습니다.'
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  loadUsers(0)
}

function goPrevPage() {
  if (!pageInfo.value.first) loadUsers(page.value - 1)
}

function goNextPage() {
  if (!pageInfo.value.last) loadUsers(page.value + 1)
}

function openDeleteModal(user) {
  error.value = ''
  deleteTarget.value = user
}

function closeDeleteModal() {
  if (!deleting.value) deleteTarget.value = null
}

async function handleDeleteUser() {
  if (!deleteTarget.value) return

  deleting.value = true
  error.value = ''

  try {
    const response = await deleteUser(deleteTarget.value.id)

    if (!response.success) {
      throw new Error(response.message || '사용자 탈퇴 처리에 실패했습니다.')
    }

    deleteTarget.value = null
    await loadUsers(page.value)
  } catch (err) {
    error.value = err.message || '사용자 탈퇴 처리에 실패했습니다.'
  } finally {
    deleting.value = false
  }
}

onMounted(() => loadUsers())
</script>

<template>
  <section class="user-list-screen" aria-label="사용자 조회">
    <div class="user-list-toolbar">
      <AppSearchField
        v-model="search"
        placeholder="이름, 이메일, 부서, 회사명 검색"
        button-label="검색"
        @search="handleSearch"
      />
    </div>

    <article class="user-list-card">
      <div class="user-list-card-header">
        <div>
          <h2>사용자 목록</h2>
          <p>총 {{ pageInfo.totalElements }}명</p>
        </div>
      </div>

      <p v-if="error" class="user-list-message user-list-message-error">{{ error }}</p>

      <div class="user-table-wrap">
        <table class="user-table">
          <thead>
            <tr>
              <th>이름</th>
              <th>이메일</th>
              <th>권한</th>
              <th>상태</th>
              <th>부서</th>
              <th>회사명</th>
              <th>연락처</th>
              <th class="user-table-actions-heading" aria-label="탈퇴"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="8" class="user-table-empty">사용자 목록을 불러오는 중입니다.</td>
            </tr>
            <tr v-else-if="pageInfo.empty">
              <td colspan="8" class="user-table-empty">조회된 사용자가 없습니다.</td>
            </tr>
            <tr v-for="user in users" v-else :key="user.id">
              <td>
                <strong>{{ user.name }}</strong>
              </td>
              <td>{{ user.email }}</td>
              <td>{{ roleLabel(user.role) }}</td>
              <td>
                <span class="user-status" :class="`user-status-${String(user.status).toLowerCase()}`">
                  {{ statusLabel(user.status) }}
                </span>
              </td>
              <td>{{ user.department }}</td>
              <td>{{ user.companyName }}</td>
              <td>{{ user.phoneNumber }}</td>
              <td class="user-table-actions">
                <AppButton variant="danger-outline" size="sm" @click="openDeleteModal(user)">탈퇴</AppButton>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="user-list-footer">
        <span>페이지 {{ pageSummary }}</span>
        <div class="user-pagination">
          <AppButton variant="secondary" size="sm" :disabled="pageInfo.first || loading" @click="goPrevPage">이전</AppButton>
          <AppButton variant="secondary" size="sm" :disabled="pageInfo.last || loading" @click="goNextPage">다음</AppButton>
        </div>
      </div>
    </article>

    <AppModal
      v-if="deleteTarget"
      title="회원 탈퇴"
      @close="closeDeleteModal"
    >
      <div class="delete-modal-body">
        <p>
          <strong>{{ deleteTarget.name }}</strong> 사용자를 탈퇴 처리하시겠습니까?
        </p>
        <span>{{ deleteTarget.email }}</span>
      </div>

      <template #footer>
        <div class="delete-modal-actions">
          <AppButton variant="secondary" :disabled="deleting" @click="closeDeleteModal">취소</AppButton>
          <AppButton variant="danger-outline" :disabled="deleting" @click="handleDeleteUser">
            {{ deleting ? '처리 중...' : '탈퇴 처리' }}
          </AppButton>
        </div>
      </template>
    </AppModal>
  </section>
</template>

<style scoped src="../styles/user-list-page.css"></style>
