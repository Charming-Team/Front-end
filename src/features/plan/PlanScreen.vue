<script setup>
import { computed, ref, watch } from 'vue'
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

function formatNumber(value) {
  const number = Number(value)
  if (!Number.isFinite(number)) return '-'
  return number.toLocaleString('ko-KR')
}

function formatDelayHours(value) {
  const number = Number(value)
  if (!Number.isFinite(number)) return '-'
  return `${number.toLocaleString('ko-KR', { maximumFractionDigits: 1 })}시간`
}

function isDelayWorse(option) {
  return Number(option?.delayChangeHr) < 0
}

function formatDelayChangeHours(option) {
  const change = Number(option?.delayChangeHr)
  if (!Number.isFinite(change)) return '-'
  return formatDelayHours(Math.abs(change))
}

function formatRecommendationTitle(option) {
  if (!option?.variantName) return 'AI 추천안'
  if (option.variantName === 'Due-Date Optimal') return '납기 최적화 추천안'
  if (option.variantName === 'Amount Optimal') return '금액 최적화 추천안'
  return option.variantName
}

function getConflictPlanTitle(conflict) {
  const plan = conflict?.movedPlan ?? conflict?.originalPlan
  if (!plan) return '-'
  return `${plan.productName ?? `계획 #${plan.planId}`} · ${plan.lineName ?? `라인 #${plan.lineId}`}`
}

function getConflictTargetSchedule(conflict) {
  const plan = conflict?.movedPlan
  if (!plan) return '-'
  return `${formatDate(plan.plannedStartAt)} ~ ${formatDate(plan.plannedEndAt)}`
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
      <div class="space-y-4 text-[14px] leading-6 text-slate-700">
        <p class="font-semibold text-slate-900">
          {{ store.scheduleConflict.value.message }}
        </p>
        <p>
          선택한 시간대에 이미 다른 생산계획이 있어 일정 이동이 저장되지 않았습니다.
          기존안을 유지하거나, AI 추천안을 생성한 뒤 선택한 대안을 실제 생산계획에 반영할 수 있습니다.
        </p>

        <div class="rounded-[10px] border border-slate-200 bg-slate-50 p-3">
          <div class="text-[12px] font-bold uppercase tracking-wide text-slate-500">이동 대상</div>
          <div class="mt-1 font-bold text-slate-900">{{ getConflictPlanTitle(store.scheduleConflict.value) }}</div>
          <div class="mt-1 text-[13px] text-slate-600">{{ getConflictTargetSchedule(store.scheduleConflict.value) }}</div>
        </div>

        <div
          v-if="store.aiRecommendationLoading.value"
          class="flex items-center gap-3 rounded-[10px] border border-blue-100 bg-blue-50 px-3 py-3 text-blue-800"
        >
          <div class="spinner h-4 w-4"></div>
          <span class="font-semibold">AI 추천안을 생성하는 중입니다.</span>
        </div>

        <p
          v-if="store.aiRecommendationError.value"
          class="rounded-[10px] border border-red-100 bg-red-50 px-3 py-2 font-semibold text-red-600"
        >
          {{ store.aiRecommendationError.value }}
        </p>

        <div v-if="store.aiRecommendationOptions.value.length > 0" class="space-y-3">
          <div class="rounded-[10px] border border-slate-200 bg-white p-3">
            <div class="flex items-center justify-between gap-3">
              <div>
                <div class="font-extrabold text-slate-900">기존안</div>
                <div class="mt-1 text-[13px] text-slate-500">충돌난 이동을 적용하지 않고 현재 캘린더 상태를 유지합니다.</div>
              </div>
              <span class="rounded-full bg-slate-100 px-3 py-1 text-[12px] font-bold text-slate-600">API 호출 없음</span>
            </div>
          </div>

          <button
            v-for="option in store.aiRecommendationOptions.value"
            :key="option.variantCode"
            type="button"
            class="w-full rounded-[10px] border p-3 text-left transition"
            :class="store.selectedAiVariantCode.value === option.variantCode
              ? 'border-blue-500 bg-blue-50 shadow-sm'
              : 'border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50'"
            @click="store.selectAiRecommendation(option.variantCode)"
          >
            <div class="flex items-start justify-between gap-3">
              <div>
                <div class="font-extrabold text-slate-900">{{ formatRecommendationTitle(option) }}</div>
                <div class="mt-1 text-[13px] font-semibold text-slate-500">
                  {{ option.status }} · 계획 {{ formatNumber(option.plans.length) }}건
                  <span v-if="option.unscheduledPlanIds.length > 0" class="text-red-600">
                    · 미배정 {{ formatNumber(option.unscheduledPlanIds.length) }}건
                  </span>
                </div>
              </div>
              <span
                class="rounded-full px-3 py-1 text-[12px] font-bold"
                :class="option.unscheduledPlanIds.length > 0
                  ? 'bg-red-100 text-red-700'
                  : option.recommendationGrade === 'HIGH'
                  ? 'bg-emerald-100 text-emerald-700'
                  : option.recommendationGrade === 'LOW'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-amber-100 text-amber-700'"
              >
                {{ option.unscheduledPlanIds.length > 0 ? '미배정' : option.recommendationGrade }}
              </span>
            </div>

            <div class="mt-3 grid grid-cols-3 gap-2 text-center">
              <div class="rounded-[8px] bg-white px-2 py-2">
                <div class="text-[11px] font-bold text-slate-400">기존 지연</div>
                <div class="mt-1 font-extrabold text-slate-900">{{ formatDelayHours(option.beforeDelayHr) }}</div>
              </div>
              <div class="rounded-[8px] bg-white px-2 py-2">
                <div class="text-[11px] font-bold text-slate-400">추천 후</div>
                <div class="mt-1 font-extrabold text-blue-700">{{ formatDelayHours(option.afterDelayHr) }}</div>
              </div>
              <div class="rounded-[8px] bg-white px-2 py-2">
                <div class="text-[11px] font-bold text-slate-400">{{ isDelayWorse(option) ? '증가' : '감소' }}</div>
                <div
                  class="mt-1 font-extrabold"
                  :class="isDelayWorse(option) ? 'text-red-600' : 'text-emerald-700'"
                >
                  {{ formatDelayChangeHours(option) }}
                </div>
              </div>
            </div>

            <p class="mt-3 text-[13px] font-semibold text-slate-700">
              {{ option.summaryText }}
            </p>
            <ul v-if="option.reasons.length > 0" class="mt-2 list-disc space-y-1 pl-5 text-[13px] text-slate-600">
              <li v-for="reason in option.reasons.slice(0, 2)" :key="reason">{{ reason }}</li>
            </ul>
            <p
              v-if="option.unscheduledPlanIds.length > 0"
              class="mt-3 rounded-[8px] border border-red-100 bg-red-50 px-3 py-2 text-[13px] font-bold text-red-700"
            >
              {{ option.unscheduledWarningText }}
            </p>
          </button>
        </div>
      </div>

      <template #footer>
        <div class="flex flex-wrap justify-end gap-2">
          <AppButton
            variant="secondary"
            :disabled="store.aiRecommendationLoading.value || store.applyingAiRecommendation.value"
            @click="closeScheduleConflict"
          >
            기존안 유지
          </AppButton>
          <AppButton
            v-if="store.aiRecommendationOptions.value.length === 0"
            variant="primary"
            :disabled="store.aiRecommendationLoading.value"
            @click="store.generateScheduleAiRecommendation()"
          >
            {{ store.aiRecommendationLoading.value ? '분석 중...' : 'AI 분석하기' }}
          </AppButton>
          <AppButton
            v-else
            variant="primary"
            :disabled="!store.selectedAiRecommendation.value
              || store.applyingAiRecommendation.value
              || store.selectedAiRecommendation.value.unscheduledPlanIds.length > 0"
            @click="store.applySelectedAiRecommendation()"
          >
            {{ store.applyingAiRecommendation.value ? '반영 중...' : '선택 반영' }}
          </AppButton>
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
