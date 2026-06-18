export function formatKg(value) {
  return `${Number(value).toLocaleString("ko-KR")} kg`;
}

export function formatPercent(value) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? Math.round(number) : 0;
}

export function getVisiblePages(currentPage, pageCount) {
  if (pageCount <= 5) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }

  const start = Math.max(1, Math.min(currentPage - 2, pageCount - 4));
  return Array.from({ length: 5 }, (_, index) => start + index);
}

export function buildLineOptions(items) {
  return [
    { value: "all", label: "전체 라인" },
    ...items.map((item) => ({ value: String(item.lineId ?? item.id), label: item.name })),
  ];
}

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function normalizeMachineStatus(value) {
  return String(value ?? "IDLE").toUpperCase();
}

function createMachineLabel(machine) {
  const name = machine.machineName || machine.machineCode || "-";

  if (machine.machineName) {
    const parts = machine.machineName.trim().split(/\s+/);
    return parts.slice(0, 2).join(" ");
  }

  return name;
}

/**
 * 목적: 라인 가동 현황 API 응답을 운영 현황 테이블 행 모델로 변환한다.
 * 입력: 백엔드 라인 가동 상태 객체.
 * 출력: 라인 ID, 이름, 가동률, 현재/다음 제품, 상태를 담은 화면 모델.
 * 처리 흐름:
 * 1. lineId/lineCode/lineName을 화면 식별자와 이름으로 매핑한다.
 * 2. 가동률은 percent 값 우선, 비율 값은 100을 곱해 정수화한다.
 * 3. 제품명과 상태 라벨이 없으면 화면에서 깨지지 않도록 기본값을 채운다.
 */
export function normalizeLineOperationStatus(item) {
  return {
    id: String(item.lineId),
    lineId: item.lineId,
    lineCode: item.lineCode || "",
    name: item.lineName || "-",
    utilizationRate: formatPercent(item.utilizationRatePercent ?? toNumber(item.utilizationRate) * 100),
    currentProduct: item.currentProductName || "-",
    nextProduct: item.nextProductName || "-",
    nextChangeEta: item.transitionExpectedTime || "-",
    status: item.operationStatus || "IDLE",
    statusLabel: item.operationStatusLabel || "",
  };
}

/**
 * 목적: 라인별 설비 상태 응답을 구성도 차트가 사용할 계층 모델로 변환한다.
 * 입력: 백엔드 라인/설비 상태 객체.
 * 출력: 라인 정보와 정렬된 설비 목록을 포함한 화면 모델.
 * 처리 흐름:
 * 1. 라인 기본 정보를 식별자와 표시명으로 매핑한다.
 * 2. machines 배열을 machineOrder 기준으로 정렬한다.
 * 3. 각 설비의 표시명, 짧은 라벨, 상태 코드/라벨을 정규화한다.
 */
export function normalizeLineMachineStatus(item) {
  return {
    id: String(item.lineId),
    lineId: item.lineId,
    lineCode: item.lineCode || "",
    name: item.lineName || "-",
    equipments: [...(item.machines ?? [])]
      .sort((left, right) => toNumber(left.machineOrder) - toNumber(right.machineOrder))
      .map((machine) => ({
        id: machine.machineId,
        name: machine.machineName || machine.machineCode || "-",
        label: createMachineLabel(machine),
        status: normalizeMachineStatus(machine.operationStatus),
        statusLabel: machine.operationStatusLabel || "",
      })),
  };
}

/**
 * 목적: 주문별 라인 배분/진척 응답을 분포 섹션 표시 모델로 변환한다.
 * 입력: 백엔드 주문 배분 현황 객체.
 * 출력: 주문 총량/진척률과 라인별 상세 진척 정보를 담은 객체.
 * 처리 흐름:
 * 1. 주문 식별자와 제품/수량/라인 수/전체 생산량을 숫자로 보정한다.
 * 2. 전체 진척률은 percent 값 우선, 비율 값은 100을 곱해 사용한다.
 * 3. lines 배열을 lineDetails로 변환해 라인별 계획량, 생산량, 상태를 담는다.
 */
export function normalizeOrderDistribution(item) {
  return {
    id: item.orderNo || String(item.orderId ?? ""),
    orderId: item.orderId,
    product: item.productName || "-",
    orderAmountKg: toNumber(item.orderQuantity),
    lineCount: toNumber(item.assignedLineCount),
    totalProducedKg: toNumber(item.totalProductionQuantity),
    progressRate: formatPercent(item.progressRatePercent ?? toNumber(item.progressRate) * 100),
    daysUntilDeadlineLabel: item.daysUntilDueDateLabel || "-",
    lineDetails: (item.lines ?? []).map((line) => ({
      lineName: line.lineName || "-",
      productName: line.productName || "-",
      plannedKg: toNumber(line.plannedQuantity),
      producedKg: toNumber(line.productionQuantity),
      progressRate: formatPercent(line.progressRatePercent ?? toNumber(line.progressRate) * 100),
      status: line.planStatus || "SCHEDULED",
      statusLabel: line.planStatusLabel || "",
      changeEta: line.transitionExpectedTime || "-",
    })),
  };
}

/**
 * 목적: 주문 검색 결과를 배분 카드와 같은 표시 모델로 맞춘다.
 * 입력: 검색 API의 주문 요약 객체.
 * 출력: 라인 상세를 포함한 주문 분포 호환 객체.
 * 처리 흐름:
 * 1. 쉼표로 전달된 lineNames 문자열을 라인명 배열로 나눈다.
 * 2. 검색 결과에 없는 생산량/진척률은 0 또는 기본값으로 채운다.
 * 3. 각 라인명을 lineDetails 항목으로 만들어 기존 UI를 재사용한다.
 */
export function normalizeOrderSearchResult(item) {
  const lineNames = String(item.lineNames ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  return {
    id: item.orderNo || String(item.orderId ?? ""),
    orderId: item.orderId,
    product: item.productName || "-",
    orderAmountKg: toNumber(item.orderQuantity),
    lineCount: lineNames.length,
    totalProducedKg: 0,
    progressRate: 0,
    daysUntilDeadlineLabel: item.dueDate || "-",
    lineDetails: lineNames.map((lineName) => ({
      lineName,
      productName: item.productName || "-",
      plannedKg: 0,
      producedKg: 0,
      progressRate: 0,
      status: "SCHEDULED",
      changeEta: "-",
    })),
  };
}
