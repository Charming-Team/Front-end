export function createDefaultOrderForm() {
  return {
    id: "",
    customer: "",
    product: "",
    quantity: "",
    dueDate: "",
    productionStartDate: "",
    productionManager: "",
    customerManager: "",
  };
}

export function parseNumber(value) {
  const numeric = String(value ?? "").replace(/[^\d]/g, "");
  return numeric ? Number(numeric) : 0;
}

export function formatNumber(value) {
  return Number(value ?? 0).toLocaleString("ko-KR");
}

export function formatDateLabel(value) {
  if (!value) return "-";

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}.${month}.${day} (${weekdays[date.getDay()]})`;
}

export function buildSelectOptions(items, key, allLabel) {
  const values = [...new Set(items.map((item) => item[key]).filter(Boolean))];

  return [{ value: "all", label: allLabel }, ...values.map((value) => ({ value, label: value }))];
}

export function matchesDateRange(targetDate, startDate, endDate) {
  if (!startDate && !endDate) return true;
  if (!targetDate) return false;
  if (startDate && targetDate < startDate) return false;
  if (endDate && targetDate > endDate) return false;
  return true;
}

export function createOrderFromForm(form, index) {
  const fallbackNumber = String(index + 1).padStart(3, "0");

  return {
    id: form.id.trim() || `ORD-${fallbackNumber}`,
    customer: form.customer.trim() || "신규 고객사",
    product: form.product.trim() || "신규 제품",
    quantity: parseNumber(form.quantity),
    dueDate: form.dueDate || "",
    productionStartDate: form.productionStartDate || "",
    productionManager: form.productionManager.trim() || "미정",
    customerManager: form.customerManager.trim() || "미정",
    status: "PLANNED",
    priority: 3,
    expectedLeadDays: 14,
  };
}

export function getVisiblePages(currentPage, pageCount) {
  const pages = [];
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(pageCount, start + 4);

  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }

  return pages;
}
