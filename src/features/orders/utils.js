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

/**
 * 목적: 주문 등록 폼 값을 화면 목록에서 바로 사용할 수 있는 임시 주문 객체로 변환한다.
 * 입력: 주문 폼 상태와 현재 목록 인덱스.
 * 출력: 주문 테이블 표시 형식에 맞춘 주문 객체.
 * 처리 흐름:
 * 1. 주문번호가 없으면 인덱스 기반 임시 번호를 만든다.
 * 2. 필수 표시값은 trim 처리하고 비어 있으면 기본 문구를 채운다.
 * 3. 수량/상태/우선순위 등 목록 렌더링에 필요한 필드를 보강한다.
 */
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

/**
 * 목적: 주문 목록 API 응답을 주문 테이블의 표준 행 모델로 변환한다.
 * 입력: 백엔드 주문 요약 객체.
 * 출력: 화면 컴포넌트가 기대하는 주문 요약 객체.
 * 처리 흐름:
 * 1. orderNo/orderId를 기준으로 화면 식별자를 만든다.
 * 2. 고객/제품/수량/납기/상태 필드를 화면 명칭으로 매핑한다.
 * 3. 목록에 없는 상세 전용 필드는 안전한 기본값으로 채운다.
 */
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

/**
 * 목적: 주문 상세 API 응답을 모달/상세 화면 표시 모델로 확장한다.
 * 입력: 백엔드 주문 상세 객체.
 * 출력: 주문 요약 필드와 상세 필드가 합쳐진 화면 모델.
 * 처리 흐름:
 * 1. normalizeOrderSummary로 공통 목록 필드를 먼저 맞춘다.
 * 2. 제품 분류, 담당자, 금액, 일정, 라인/작업자 정보를 추가한다.
 * 3. 날짜 입력에 필요한 plannedStartAt은 yyyy-mm-dd 형태로 보정한다.
 */
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

/**
 * 목적: 주문 등록 폼을 백엔드 생성 API payload로 변환한다.
 * 입력: 사용자가 입력한 주문 등록 폼 객체.
 * 출력: createOrder API가 요구하는 payload 객체.
 * 처리 흐름:
 * 1. 문자열 필드는 trim하고 숫자 필드는 Number/parseNumber로 변환한다.
 * 2. 필수 주문 정보와 담당자/일정 정보를 API 필드명으로 매핑한다.
 * 3. 선택 금액 필드는 유효한 숫자일 때만 payload에 포함한다.
 */
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
