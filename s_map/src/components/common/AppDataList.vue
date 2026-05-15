<script setup>
defineProps({
  columns:   { type: Array,  default: () => [] },
  rows:      { type: Array,  default: () => [] },
  emptyText: { type: String, default: '데이터가 없습니다.' },
})

function alignClass(align) {
  if (align === 'center') return 'text-center'
  if (align === 'right')  return 'text-right'
  return 'text-left'
}
</script>

<template>
  <div class="overflow-x-auto">
    <table class="w-full text-[13px]">
      <thead class="border-b border-slate-200 bg-[var(--color-bg-soft)]">
        <tr>
          <th
            v-for="col in columns"
            :key="col.key"
            class="px-4 py-3 text-[12px] font-bold text-[var(--color-text-subtle)]"
            :class="alignClass(col.align)"
          >
            {{ col.label }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="rows.length === 0">
          <td :colspan="columns.length" class="py-10 text-center text-[13px] text-[var(--color-text-subtle)]">
            {{ emptyText }}
          </td>
        </tr>
        <tr
          v-for="(row, i) in rows"
          :key="i"
          class="border-b border-slate-100 transition-colors hover:bg-[var(--color-bg-soft)]"
        >
          <td
            v-for="col in columns"
            :key="col.key"
            class="px-4 py-3 text-[var(--color-text-main)]"
            :class="alignClass(col.align)"
          >
            <slot :name="`cell-${col.key}`" :row="row">{{ row[col.key] }}</slot>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
