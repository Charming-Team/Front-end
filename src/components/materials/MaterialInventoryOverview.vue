<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import AppCard from "../common/AppCard.vue";
import AppSectionHeader from "../common/AppSectionHeader.vue";
import AppStatusBadge from "../common/AppStatusBadge.vue";
import { formatMaterialQuantity } from "../../features/materials/utils.js";

const props = defineProps({
  items: {
    type: Array,
    default: () => [],
  },
  statusMeta: {
    type: Object,
    required: true,
  },
});

const startIndex = ref(0);
const visibleCount = ref(5);

const maxStartIndex = computed(() =>
  Math.max(0, props.items.length - visibleCount.value)
);

const visibleItems = computed(() =>
  props.items.slice(startIndex.value, startIndex.value + visibleCount.value)
);

function updateVisibleCount() {
  if (window.innerWidth < 560) {
    visibleCount.value = 1;
  } else if (window.innerWidth < 760) {
    visibleCount.value = 2;
  } else if (window.innerWidth < 1200) {
    visibleCount.value = 3;
  } else {
    visibleCount.value = 5;
  }
}

function showPrev() {
  startIndex.value = Math.max(0, startIndex.value - 1);
}

function showNext() {
  startIndex.value = Math.min(maxStartIndex.value, startIndex.value + 1);
}

function getAvailableStock(material) {
  return Number(material.availableStock ?? material.currentStock ?? 0);
}

function getSafeStock(material) {
  return Number(material.safeStock ?? 0);
}

function getAvailabilityRate(material) {
  const availableStock = getAvailableStock(material);
  const safeStock = getSafeStock(material);

  if (safeStock <= 0) return 0;

  return Math.round((availableStock / safeStock) * 100);
}

function getAvailabilityBarWidth(material) {
  return Math.min(getAvailabilityRate(material), 100);
}

function formatSafetyStockMessage(material) {
  const availableStock = getAvailableStock(material);
  const safeStock = getSafeStock(material);
  const gap = availableStock - safeStock;
  const absoluteGap = Math.abs(gap);
  const formattedGap = formatMaterialQuantity(absoluteGap, material.unit);

  if (gap < 0) {
    return `${formattedGap} 필요`;
  }

  if (gap > 0) {
    return `${formattedGap} 충족`;
  }

  return "기준 충족";
}

watch(
  () => props.items.length,
  () => {
    startIndex.value = Math.min(startIndex.value, maxStartIndex.value);
  }
);

watch(visibleCount, () => {
  startIndex.value = Math.min(startIndex.value, maxStartIndex.value);
});

onMounted(() => {
  updateVisibleCount();
  window.addEventListener("resize", updateVisibleCount);
});

onUnmounted(() => {
  window.removeEventListener("resize", updateVisibleCount);
});
</script>

<template>
  <AppCard class="section-card">
    <AppSectionHeader class="section-header-shell" title="재고 현황">
      <template #actions>
        <div class="carousel-actions">
          <button
            class="nav-button"
            type="button"
            :disabled="startIndex === 0"
            aria-label="이전 자재 보기"
            @click="showPrev"
          >
            <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M11.5 5 7 10l4.5 5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>

          <button
            class="nav-button"
            type="button"
            :disabled="startIndex >= maxStartIndex"
            aria-label="다음 자재 보기"
            @click="showNext"
          >
            <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="m8.5 5 4.5 5-4.5 5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
        </div>
      </template>
    </AppSectionHeader>

    <div class="inventory-caption">
      가용률 기준 · 안전재고 대비 부족/초과 수량 표시
    </div>

    <div class="inventory-grid">
      <article
        v-for="material in visibleItems"
        :key="material.id"
        class="inventory-item"
      >
        <p class="inventory-name">{{ material.name }}</p>
        <strong class="inventory-rate">{{ getAvailabilityRate(material) }}%</strong>
        <div class="inventory-bar">
          <span
            class="inventory-bar-fill"
            :class="`inventory-bar-fill--${statusMeta[material.status].tone}`"
            :style="{ width: `${getAvailabilityBarWidth(material)}%` }"
          ></span>
        </div>
        <div class="inventory-footer">
          <span class="inventory-stock">
            {{ formatSafetyStockMessage(material) }}
          </span>
          <AppStatusBadge
            :label="statusMeta[material.status].label"
            :tone="statusMeta[material.status].tone"
          />
        </div>
      </article>
    </div>
  </AppCard>
</template>

<style scoped>
.section-card {
  padding: 12px 20px;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.04);
}

.section-header-shell {
  margin: 0 -20px 1px;
  padding: 0 26px 0px;
}

.carousel-actions {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.nav-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 30px;
  width: 30px;
  border: 1px solid #e4eaf3;
  border-radius: 7px;
  background: #ffffff;
  color: #475467;
  transition: background-color 0.15s ease, color 0.15s ease, opacity 0.15s ease;
}

.nav-button svg {
  width: 14px;
  height: 14px;
}

.nav-button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.nav-button:not(:disabled):hover {
  background: #f8fbff;
}

.inventory-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
  padding: 0 6px 2px;
}

.inventory-item {
  min-width: 0;
  border: 1px solid #e4eaf3;
  border-radius: 8px;
  background: #ffffff;
  padding: 14px 12px 12px;
}

.inventory-name {
  margin: 0 0 8px;
  color: #344054;
  font-size: 14px;
  font-weight: 700;
}

.inventory-rate {
  display: block;
  margin-bottom: 12px;
  color: #111827;
  font-size: 20px;
  line-height: 1;
  font-weight: 800;
}

.inventory-bar {
  height: 4px;
  margin-bottom: 12px;
  border-radius: 999px;
  background: #edf2f7;
  overflow: hidden;
}

.inventory-bar-fill {
  display: block;
  height: 100%;
  border-radius: inherit;
}

.inventory-bar-fill--normal {
  background: #0f9b8e;
}

.inventory-bar-fill--risk {
  background: #ff8f1f;
}

.inventory-bar-fill--shortage {
  background: #ef4444;
}

.inventory-bar-fill--pending {
  background: #4a78d1;
}

.inventory-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.inventory-stock {
  min-width: 0;
  color: #667085;
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
}

@media (max-width: 1200px) {
  .inventory-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .inventory-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 560px) {
  .section-card {
    padding: 12px 16px;
  }

  .section-header-shell {
    margin: 0 -16px 12px;
    padding: 0 16px 8px;
  }

  .inventory-grid {
    grid-template-columns: 1fr;
    padding: 0;
  }
}

.section-title-group {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.section-title-hint {
  color: #3d424e;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.inventory-caption {
  margin: -8px 6px 14px;
  color: #3d424e;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: -0.01em;
}
</style>
