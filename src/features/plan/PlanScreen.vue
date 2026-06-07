<script setup>
import { computed, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import AppModal from '../../components/common/AppModal.vue'
import PlanStatusBadge from '../../components/plan/PlanStatusBadge.vue'
import { getUserRole } from '../../utils/storage.js'
import PlanCalendar from './PlanCalendar.vue'

const props = defineProps({
  store: { type: Object, required: true },
  filters: { type: Object, required: true },
})

const store = props.store
const {
  statusOptions,
  status,
  search,
  hasFilters,
  submitSearch,
  applyStatusFilter,
} = props.filters

const NON_EDITABLE = ['COMPLETED', 'CANCELLED']
const PLAN_WRITE_ROLES = ['ADMIN', 'EXECUTIVE', 'MANUFACTURING_MANAGER']

const canManagePlans = computed(() =>
  PLAN_WRITE_ROLES.includes(getUserRole())
)

const canEdit = computed(() =>
  canManagePlans.value
  && !!store.selectedPlan.value
  && !NON_EDITABLE.includes(store.selectedPlan.value.planStatus)
)
const bulkUploadOpen = ref(false)
const bulkUploadFileName = ref('')

watch(() => store.selectedPlan.value?.planId, id => {
  if (id != null) store.loadUpdateHistory(id)
})

function formatDate(iso) {
  if (!iso) return '-'
  return new Date(iso).toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

function formatDuration(minutes) {
  if (minutes == null) return null
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}시간 ${m}분` : `${h}시간`
}

function onSubmitUpdate() {
  store.submitUpdate()
}

function openBulkUpload() {
  if (!canManagePlans.value) return
  bulkUploadOpen.value = true
}

function closeBulkUpload() {
  bulkUploadOpen.value = false
  bulkUploadFileName.value = ''
}

function onBulkUploadFileChange(event) {
  const file = event.target.files?.[0]
  bulkUploadFileName.value = file?.name ?? ''
}

function closeScheduleConflict() {
  store.closeScheduleConflict()
}
</script>

<template>
  <div class="plan-screen">
    <PlanCalendar
      :plans="store.visibleCalendarPlans.value"
      :preview-plans="store.calendarPreviewPlans.value"
      :lines="store.lines.value"
      :status-options="statusOptions"
      v-model:status="status"
      v-model:search="search"
      :loading="store.calendarLoading.value"
      :error="store.calendarError.value ?? ''"
      :has-filters="hasFilters"
      :selected-plan-id="store.selectedPlan.value?.planId ?? null"
      :calendar-editing="store.calendarEditing.value"
      :calendar-saving="store.calendarSaving.value"
      :calendar-save-error="store.calendarSaveError.value ?? ''"
      :can-manage-plans="canManagePlans"
      @retry="store.loadCalendarPlans()"
      @search="submitSearch"
      @status-change="applyStatusFilter"
      @select-plan="plan => store.loadPlanDetail(plan.planId)"
      @enter-calendar-edit="store.enterCalendarEditMode()"
      @complete-calendar-edit="store.completeCalendarEdit()"
      @open-bulk-upload="openBulkUpload"
      @move-plan="({ planId, deltaDays, revert }) => store.movePlan(planId, deltaDays, revert)"
      @preview-plan-move="({ planId, deltaDays }) => store.previewPlanMove(planId, deltaDays)"
      @clear-plan-move-preview="store.clearPlanMovePreview()"
    />

    <AppModal
      v-if="store.scheduleConflict.value"
      title="AI 분석이 필요합니다"
      @close="closeScheduleConflict"
    >
      <div class="space-y-3 text-[14px] leading-6 text-slate-700">
        <p class="font-semibold text-slate-900">
          {{ store.scheduleConflict.value.message }}
        </p>
        <p>
          선택한 시간대에 이미 다른 생산계획이 있어 일정 이동이 저장되지 않았습니다.
          AI 분석 API가 준비되면 이 충돌 상황을 기준으로 대안을 생성할 수 있습니다.
        </p>
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <AppButton variant="secondary" @click="closeScheduleConflict">닫기</AppButton>
          <RouterLink
            to="/ai/analysis"
            class="inline-flex items-center justify-center rounded-[10px] bg-[var(--color-primary)] px-4 py-2 text-[14px] font-semibold text-white transition hover:brightness-110"
            style="text-decoration: none;"
            @click="closeScheduleConflict"
          >
            AI 분석으로 이동
          </RouterLink>
        </div>
      </template>
    </AppModal>

    <Transition name="fade">
      <div v-if="bulkUploadOpen" class="bulk-upload-backdrop" @click="closeBulkUpload" />
    </Transition>

    <Transition name="bulk-upload">
      <div
        v-if="bulkUploadOpen"
        class="bulk-upload-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bulk-upload-title"
      >
        <AppCard>
          <div class="bulk-upload-header">
            <div>
              <h2 id="bulk-upload-title">생산계획 일괄 등록</h2>
              <p>파일을 선택하면 일괄 등록 준비가 완료됩니다.</p>
            </div>
            <button class="close-btn" type="button" aria-label="닫기" @click="closeBulkUpload">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <div class="bulk-upload-body">
            <label class="bulk-upload-dropzone" for="plan-bulk-upload-file">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M12 16V4"/>
                <path d="M7 9l5-5 5 5"/>
                <path d="M20 16.5V19a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2.5"/>
              </svg>
              <span class="bulk-upload-main-text">파일 선택</span>
              <span class="bulk-upload-sub-text">CSV, XLS, XLSX 파일을 업로드할 수 있습니다.</span>
              <input
                id="plan-bulk-upload-file"
                type="file"
                accept=".csv,.xls,.xlsx"
                @change="onBulkUploadFileChange"
              />
            </label>

            <div v-if="bulkUploadFileName" class="bulk-upload-selected">
              선택된 파일: <strong>{{ bulkUploadFileName }}</strong>
            </div>

            <div class="bulk-upload-actions">
              <AppButton variant="secondary" @click="closeBulkUpload">닫기</AppButton>
              <AppButton variant="primary" :disabled="!bulkUploadFileName">업로드</AppButton>
            </div>
          </div>
        </AppCard>
      </div>
    </Transition>

    <Transition name="drawer">
      <aside v-if="store.selectedPlan.value || store.detailLoading.value" class="detail-drawer">
        <div class="drawer-header">
          <h2>{{ store.isEditing.value ? '생산계획 수정' : '생산계획 상세' }}</h2>
          <div class="drawer-header-actions">
            <AppButton
              v-if="!store.isEditing.value && canEdit"
              variant="primary"
              size="sm"
              @click="store.enterEditMode()"
            >
              수정
            </AppButton>
            <button class="close-btn" type="button" aria-label="닫기" @click="store.clearSelectedPlan()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        <div v-if="store.detailLoading.value" class="drawer-loading">
          <div class="spinner"></div>
        </div>

        <div v-else-if="store.detailError.value" class="drawer-error">
          {{ store.detailError.value }}
        </div>

        <template v-else-if="store.selectedPlan.value">
          <div v-if="store.updateSuccess.value && !store.isEditing.value" class="update-success">
            수정이 완료되었습니다.
          </div>

          <template v-if="!store.isEditing.value">
            <dl class="detail-grid">
              <div class="detail-row"><dt>계획 ID</dt><dd>{{ store.selectedPlan.value.planId }}</dd></div>
              <div class="detail-row"><dt>주문 ID</dt><dd>{{ store.selectedPlan.value.orderId }}</dd></div>
              <div class="detail-row"><dt>제품명</dt><dd>{{ store.selectedPlan.value.productName }}</dd></div>
              <div class="detail-row"><dt>라인</dt><dd>{{ store.selectedPlan.value.lineName }}</dd></div>
              <div class="detail-row"><dt>라인 내 순서</dt><dd>{{ store.selectedPlan.value.planSequence }}</dd></div>
              <div class="detail-row"><dt>계획 시작</dt><dd>{{ formatDate(store.selectedPlan.value.plannedStartAt) }}</dd></div>
              <div class="detail-row"><dt>계획 종료</dt><dd>{{ formatDate(store.selectedPlan.value.plannedEndAt) }}</dd></div>
              <div class="detail-row"><dt>계획 수량</dt><dd>{{ store.selectedPlan.value.plannedQuantity.toLocaleString() }}</dd></div>
              <div class="detail-row">
                <dt>예상 소요 시간</dt>
                <dd>
                  <span v-if="store.selectedPlan.value.estimatedDurationMin != null">
                    {{ formatDuration(store.selectedPlan.value.estimatedDurationMin) }}
                  </span>
                  <span v-else class="no-result-tag">NO_LATEST_RESULT</span>
                </dd>
              </div>
              <div class="detail-row"><dt>상태</dt><dd><PlanStatusBadge :status="store.selectedPlan.value.planStatus" /></dd></div>
              <div class="detail-row"><dt>담당자</dt><dd>{{ store.selectedPlan.value.operatorName }}</dd></div>
              <div class="detail-row"><dt>생성일시</dt><dd>{{ formatDate(store.selectedPlan.value.createdAt) }}</dd></div>
              <div class="detail-row"><dt>수정일시</dt><dd>{{ formatDate(store.selectedPlan.value.updatedAt) }}</dd></div>
            </dl>

            <div class="related-section">
              <h3 class="related-title">연관 데이터</h3>
              <div class="check-required-box">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <div>
                  <strong>CHECK_REQUIRED</strong>
                  <p>주문, 자재, 리스크 요약 정보는 각 기능 구현 후 연동됩니다.</p>
                </div>
              </div>
            </div>

            <div v-if="store.updateHistory.value.length > 0" class="related-section">
              <h3 class="related-title">수정 이력</h3>
              <div v-for="history in store.updateHistory.value" :key="history.historyId" class="history-entry">
                <div class="history-meta">
                  {{ formatDate(history.updatedAt) }} · {{ history.updatedBy }}
                  <span v-if="history.recalculationRequired" class="recalc-badge">재계산 대상</span>
                </div>
                <div v-for="field in history.changedFields" :key="field.field" class="history-change">
                  <span class="history-label">{{ field.label }}</span>
                  <span>{{ ['plannedStartAt', 'plannedEndAt'].includes(field.field) ? formatDate(field.before) : field.before }}</span>
                  <span class="history-arrow">→</span>
                  <span>{{ ['plannedStartAt', 'plannedEndAt'].includes(field.field) ? formatDate(field.after) : field.after }}</span>
                </div>
              </div>
            </div>
          </template>

          <template v-else>
            <div v-if="store.updateError.value" class="update-fail">{{ store.updateError.value }}</div>
            <form @submit.prevent="onSubmitUpdate">
              <dl class="detail-grid">
                <div class="detail-row"><dt>계획 ID</dt><dd>{{ store.selectedPlan.value.planId }}</dd></div>
                <div class="detail-row"><dt>주문 ID</dt><dd>{{ store.selectedPlan.value.orderId }}</dd></div>
                <div class="detail-row"><dt>제품명</dt><dd>{{ store.selectedPlan.value.productName }}</dd></div>
                <div class="detail-row"><dt>담당자</dt><dd>{{ store.selectedPlan.value.operatorName }}</dd></div>
                <div class="detail-row"><dt>상태</dt><dd><PlanStatusBadge :status="store.selectedPlan.value.planStatus" /></dd></div>

                <div class="detail-row">
                  <dt>라인 *</dt>
                  <dd>
                    <select v-model.number="store.editForm.lineId" class="form-field-input">
                      <option :value="null" disabled>라인 선택</option>
                      <option v-for="line in store.lines.value" :key="line.lineId" :value="line.lineId">{{ line.lineName }}</option>
                    </select>
                    <span v-if="store.editErrors.value.lineId" class="field-error">{{ store.editErrors.value.lineId }}</span>
                  </dd>
                </div>
                <div class="detail-row">
                  <dt>라인 내 순서 *</dt>
                  <dd>
                    <input v-model.number="store.editForm.planSequence" type="number" min="1" class="form-field-input" />
                    <span v-if="store.editErrors.value.planSequence" class="field-error">{{ store.editErrors.value.planSequence }}</span>
                  </dd>
                </div>
                <div class="detail-row">
                  <dt>계획 시작 *</dt>
                  <dd>
                    <input v-model="store.editForm.plannedStartAt" type="datetime-local" class="form-field-input" />
                    <span v-if="store.editErrors.value.plannedStartAt" class="field-error">{{ store.editErrors.value.plannedStartAt }}</span>
                  </dd>
                </div>
                <div class="detail-row">
                  <dt>계획 종료 *</dt>
                  <dd>
                    <input v-model="store.editForm.plannedEndAt" type="datetime-local" class="form-field-input" />
                    <span v-if="store.editErrors.value.plannedEndAt" class="field-error">{{ store.editErrors.value.plannedEndAt }}</span>
                  </dd>
                </div>
                <div class="detail-row">
                  <dt>계획 수량 *</dt>
                  <dd>
                    <input v-model.number="store.editForm.plannedQuantity" type="number" min="1" class="form-field-input" />
                    <span v-if="store.editErrors.value.plannedQuantity" class="field-error">{{ store.editErrors.value.plannedQuantity }}</span>
                  </dd>
                </div>
              </dl>

              <div class="drawer-actions">
                <AppButton type="submit" variant="primary" :disabled="store.updateLoading.value">
                  {{ store.updateLoading.value ? '저장 중...' : '저장' }}
                </AppButton>
                <AppButton variant="secondary" @click="store.exitEditMode()">취소</AppButton>
              </div>
            </form>
          </template>
        </template>
      </aside>
    </Transition>

    <Transition name="fade">
      <div
        v-if="store.selectedPlan.value || store.detailLoading.value"
        class="drawer-backdrop"
        @click="store.clearSelectedPlan()"
      />
    </Transition>
  </div>
</template>

<style scoped src="./styles/plan-page.css"></style>
