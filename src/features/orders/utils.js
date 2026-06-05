export function createDefaultOrderForm() {
  return {
    orderNo: "",
    customer: "",
    productId: "",
    quantity: "",
    dueDate: "",
    productionStartDate: "",
    productionManager: "",
    customerManager: "",
    contractAmount: "",
    latePenaltyAmount: "",
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

  const source = String(value);
  const date = new Date(source.includes("T") ? source : `${source}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}.${month}.${day} (${weekdays[date.getDay()]})`;
}

export function formatDateTimeLabel(value) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}.${month}.${day} ${hours}:${minutes}`;
}

export function formatCurrency(value) {
  if (value === null || value === undefined || value === "") return "-";
  const number = Number(value);
  if (!Number.isFinite(number)) return value;
  return `${number.toLocaleString("ko-KR")}원`;
}

export function formatDurationHours(value) {
  if (value === null || value === undefined || value === "") return "-";
  const number = Number(value);
  if (!Number.isFinite(number)) return `${value}시간`;
  return `${number.toLocaleString("ko-KR", { maximumFractionDigits: 1 })}시간`;
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
    id: form.orderNo.trim() || `ORD-${fallbackNumber}`,
    customer: form.customer.trim() || "신규 고객사",
    productId: form.productId,
    product: form.productId ? `제품 ${form.productId}` : "신규 제품",
    quantity: parseNumber(form.quantity),
    dueDate: form.dueDate || "",
    productionStartDate: form.productionStartDate || "",
    productionManager: form.productionManager.trim() || "미정",
    customerManager: form.customerManager.trim() || "미정",
    status: "WAITING",
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

function normalizeDateValue(value) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

function normalizeOrderStatus(value) {
  if (value === "PLANNED") return "WAITING";
  return value || "WAITING";
}

export function normalizeOrderSummary(order) {
  const orderNo = order.orderNo || String(order.orderId ?? "");

  return {
    orderId: order.orderId,
    id: orderNo,
    orderNo,
    customer: order.customerName || "-",
    productId: order.productId,
    productCode: order.productCode || "",
    product: order.productName || order.productCode || `제품 ${order.productId ?? "-"}`,
    quantity: order.orderQuantity ?? 0,
    dueDate: order.dueDate || "",
    status: normalizeOrderStatus(order.orderStatus),
    statusLabel: order.orderStatusLabel || "",
    productionStartDate: "",
    productionManager: "-",
    customerManager: "-",
    priority: null,
    expectedLeadDays: null,
  };
}

export function normalizeOrderDetail(order) {
  const summary = normalizeOrderSummary(order);

  return {
    ...summary,
    productCategory: order.productCategory || "",
    productUnit: order.productUnit || "",
    orderDate: order.orderDate || "",
    customerManager: order.customerContactName || "-",
    contractAmount: order.contractAmount,
    latePenaltyAmount: order.latePenaltyAmount,
    priority: order.priorityRank,
    priorityMessage: order.priorityMessage || "",
    planSequence: order.planSequence,
    productionStartDate: normalizeDateValue(order.plannedStartAt),
    plannedStartAt: order.plannedStartAt,
    plannedEndAt: order.plannedEndAt,
    estimatedDurationHr: order.estimatedDurationHr,
    lineNames: order.lineNames || "-",
    productionManager: order.operatorNames || "-",
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

function parseOptionalDecimal(value) {
  const numeric = String(value ?? "").replace(/[^\d.]/g, "");
  if (!numeric) return null;
  const number = Number(numeric);
  return Number.isFinite(number) ? number : null;
}

export function validateOrderForm(form) {
  if (!form.customer?.trim()) return "고객사를 입력해주세요.";
  if (!Number.isFinite(Number(form.productId)) || Number(form.productId) <= 0) {
    return "제품 ID를 입력해주세요.";
  }
  if (parseNumber(form.quantity) <= 0) return "수량을 입력해주세요.";
  if (!form.dueDate) return "납기일을 선택해주세요.";
  if (!form.productionStartDate) return "생산 시작일을 선택해주세요.";
  if (!form.productionManager?.trim()) return "생산 담당자를 입력해주세요.";
  if (!form.customerManager?.trim()) return "고객사 담당자를 입력해주세요.";
  return "";
}

export function buildOrderCreatePayload(form) {
  const payload = {
    customerName: form.customer.trim(),
    productId: Number(form.productId),
    orderQuantity: parseNumber(form.quantity),
    dueDate: form.dueDate,
    productionStartDate: form.productionStartDate,
    operatorName: form.productionManager.trim(),
    customerContactName: form.customerManager.trim(),
  };

  const contractAmount = parseOptionalDecimal(form.contractAmount);
  const latePenaltyAmount = parseOptionalDecimal(form.latePenaltyAmount);

  if (contractAmount !== null) payload.contractAmount = contractAmount;
  if (latePenaltyAmount !== null) payload.latePenaltyAmount = latePenaltyAmount;

  return payload;
}
