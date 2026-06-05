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
