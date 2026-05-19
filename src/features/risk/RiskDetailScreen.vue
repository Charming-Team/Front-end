<template>
  <section class="risk-detail-page">
    <button type="button" class="risk-back-button" @click="goBack">← 리스크 목록으로 돌아가기</button>

    <template v-if="riskItem && detail">
      <section class="risk-detail-hero">
        <div>
          <p class="risk-detail-kicker">주문 리스크 상세</p>
          <h2>{{ riskItem.orderNo }} · {{ riskItem.productName }}</h2>
          <p>{{ detail.summary }}</p>
        </div>

        <div class="risk-detail-score">
          <span :class="getRiskBadgeClass(detail.riskLevel)">
            {{ getRiskLevelLabel(detail.riskLevel) }}
          </span>
          <strong>{{ Math.round(detail.delayProbability * 100) }}%</strong>
          <small>지연 확률</small>
        </div>
      </section>

      <section class="risk-detail-metrics">
        <article>
          <span>고객사</span>
          <strong>{{ riskItem.customerName }}</strong>
        </article>
        <article>
          <span>납기일</span>
          <strong>{{ riskItem.dueDate }}</strong>
        </article>
        <article>
          <span>예상 완료일</span>
          <strong>{{ detail.expectedCompletionDate }}</strong>
        </article>
        <article>
          <span>예상 지연</span>
          <strong>{{ detail.predictedDelayDays }}일</strong>
        </article>
      </section>

      <section class="risk-detail-card">
        <div class="risk-tab-list">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            type="button"
            class="risk-tab"
            :class="{ active: activeTab === tab.key }"
            @click="activeTab = tab.key"
          >
            {{ tab.label }}
          </button>
        </div>

        <div v-if="activeTab === 'summary'" class="risk-tab-panel">
          <h3>분석 요약</h3>
          <p>{{ detail.summary }}</p>

          <div class="risk-summary-note">
            현재 주문은 납기일까지 목표 생산량을 달성하기 어려운 상태입니다. 자재 확보와 생산 라인 재배정을 함께 검토하는 것이 적절합니다.
          </div>
        </div>

        <div v-if="activeTab === 'causes'" class="risk-tab-panel">
          <h3>원인 분석</h3>

          <div class="risk-cause-list">
            <article v-for="cause in detail.causes" :key="cause.type" class="risk-cause-card">
              <div>
                <strong>{{ cause.label }}</strong>
                <span>{{ cause.impact }}</span>
              </div>
              <p>{{ cause.description }}</p>
              <small>{{ cause.evidence }}</small>
            </article>
          </div>
        </div>

        <div v-if="activeTab === 'actions'" class="risk-tab-panel">
          <h3>대응 권고</h3>

          <div class="risk-action-list">
            <article v-for="action in detail.actions" :key="action.title" class="risk-action-card">
              <strong>{{ action.title }}</strong>
              <p>{{ action.description }}</p>
            </article>
          </div>

          <button type="button" class="risk-primary-button" @click="goToPlanPage">생산 계획 수정하러 가기</button>
        </div>

        <div v-if="activeTab === 'data'" class="risk-tab-panel">
          <h3>관련 생산계획</h3>

          <div class="risk-detail-table-wrap">
            <table class="risk-detail-table">
              <thead>
                <tr>
                  <th>계획 ID</th>
                  <th>라인</th>
                  <th>시작 예정</th>
                  <th>종료 예정</th>
                  <th>상태</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="plan in detail.relatedPlans" :key="plan.planId">
                  <td>{{ plan.planId }}</td>
                  <td>{{ plan.lineName }}</td>
                  <td>{{ plan.plannedStartAt }}</td>
                  <td>{{ plan.plannedEndAt }}</td>
                  <td>{{ plan.status }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </template>

    <section v-else class="risk-detail-empty">
      <h2>상세 분석 데이터가 없습니다.</h2>
      <p>선택한 주문에 대한 리스크 상세 분석 결과가 아직 생성되지 않았습니다.</p>
    </section>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { riskDetailMap, riskItems } from './mockData';
import { getRiskBadgeClass, getRiskLevelLabel } from './utils';
import './styles/risk-detail-page.css';

const route = useRoute();
const router = useRouter();

const activeTab = ref('summary');

const tabs = [
  { key: 'summary', label: '요약' },
  { key: 'causes', label: '원인 분석' },
  { key: 'actions', label: '대응 권고' },
  { key: 'data', label: '관련 데이터' },
];

const orderNo = computed(() => String(route.params.orderNo ?? ''));

const riskItem = computed(() => riskItems.find((item) => item.orderNo === orderNo.value));

const detail = computed(() => riskDetailMap[orderNo.value]);

function goBack() {
  router.push('/risk');
}

function goToPlanPage() {
  router.push('/plan');
}
</script>
