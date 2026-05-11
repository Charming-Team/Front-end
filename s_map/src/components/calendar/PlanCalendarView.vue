<script setup>
import AppButton from '../common/AppButton.vue'

defineProps({
  monthLabel: { type: String, required: true },
  dowLabels: { type: Array, required: true },
  weeks: { type: Array, required: true },
  legendItems: { type: Array, required: true },
})

const emit = defineEmits(['prev-month', 'next-month', 'go-today', 'select-plan'])
</script>

<template>
  <div class="plan-cal-root">
    <div class="d-flex align-items-center gap-2 mb-3">
      <AppButton class="plan-cal-nav-btn" variant="secondary" size="sm" @click="emit('prev-month')">‹</AppButton>
      <span class="plan-cal-range fw-semibold">{{ monthLabel }}</span>
      <AppButton class="plan-cal-nav-btn" variant="secondary" size="sm" @click="emit('next-month')">›</AppButton>
      <AppButton class="plan-cal-today-btn ms-1" variant="primary" size="sm" @click="emit('go-today')">오늘</AppButton>
    </div>

    <div class="plan-cal-grid">
      <div class="plan-cal-dow-row">
        <div
          v-for="(label, index) in dowLabels"
          :key="index"
          class="plan-cal-dow-cell"
          :class="{ 'dow-weekend': index === 0 || index === 6 }"
        >
          {{ label }}
        </div>
      </div>

      <div v-for="week in weeks" :key="week.key" class="plan-cal-week">
        <div class="plan-cal-date-row">
          <div
            v-for="day in week.days"
            :key="day.key"
            class="plan-cal-date-cell"
            :class="day.classes"
          >
            <span class="date-num">{{ day.date }}</span>
          </div>
        </div>

        <div class="plan-cal-events-row" :style="{ height: `${week.eventsHeight}px` }">
          <div
            v-for="item in week.items"
            :key="item.key"
            class="plan-cal-event-bar"
            :style="item.style"
            :title="item.title"
            tabindex="0"
            role="button"
            @click="emit('select-plan', item.plan)"
            @keydown.enter="emit('select-plan', item.plan)"
          >
            <span class="event-bar-arrow event-bar-arrow-l"></span>
            <span class="event-bar-label">{{ item.label }}</span>
            <span class="event-bar-arrow event-bar-arrow-r"></span>
          </div>
        </div>
      </div>
    </div>

    <div class="d-flex flex-wrap gap-2 mt-3">
      <span
        v-for="item in legendItems"
        :key="item.label"
        class="plan-cal-legend-item"
        :class="item.className"
      >
        {{ item.label }}
      </span>
    </div>
  </div>
</template>

<style scoped src="./styles/plan-calendar.css"></style>
