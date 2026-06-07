const DAY_MS = 24 * 60 * 60 * 1000;
const inactiveOperationStatuses = new Set(["STOPPED", "ERROR", "MAINTENANCE", "IDLE"]);
const segmentPriority = {
  delay: 6,
  change: 5,
  inactive: 4,
  running: 3,
  planned: 2,
  completed: 1,
  "no-plan": 0,
};
const fixedLineOrder = [
  "ABS 주 생산 Line",
  "ABS 보조 생산 Line",
  "PP 범용 생산 Line",
  "PE 범용 생산 Line",
  "PE 특화 생산 Line",
  "PP 기능성 생산 Line",
];

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function formatInteger(value) {
  return Math.round(toNumber(value)).toLocaleString("ko-KR");
}

function formatPercent(value) {
  return Math.round(toNumber(value));
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function parseLocalDate(dateString) {
  if (!dateString) return new Date();

  const [year, month, day] = String(dateString).split("-").map(Number);
  return new Date(year, month - 1, day);
}

function getStartOfDayMs(value) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

function getNextDayBoundaryMs(value) {
  const date = new Date(value);
  const isStartOfDay =
    date.getHours() === 0 &&
    date.getMinutes() === 0 &&
    date.getSeconds() === 0 &&
    date.getMilliseconds() === 0;

  date.setHours(0, 0, 0, 0);

  if (!isStartOfDay) {
    date.setDate(date.getDate() + 1);
  }

  return date.getTime();
}

function formatDueDate(dateString) {
  if (!dateString) return "-";

  const date = parseLocalDate(dateString);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const weekday = ["일", "월", "화", "수", "목", "금", "토"][date.getDay()];

  return `${month}.${day} (${weekday})`;
}

function toScheduleSegmentType(status) {
  const normalized = String(status || "").trim();

  if (normalized === "생산 중") return "running";
  if (normalized === "예정") return "planned";
  if (normalized === "셋업") return "change";
  if (normalized === "지연") return "delay";
  if (normalized === "비가동") return "inactive";
  if (normalized === "완료") return "completed";

  return "no-plan";
}

function toLineStatusSegmentType(segment) {
  if (segment.operationStatus === "RUNNING") return "running";
  if (segment.operationStatus === "SETUP") return "change";
  if (inactiveOperationStatuses.has(segment.operationStatus)) return "inactive";
  return null;
}

function mapSegment(segment, rangeStartMs, rangeMs, typeOverride) {
  const rawStartMs = new Date(segment.segmentStartAt ?? segment.plannedStartAt).getTime();
  const rawEndMs = new Date(segment.segmentEndAt ?? segment.plannedEndAt).getTime();

  if (!Number.isFinite(rawStartMs) || !Number.isFinite(rawEndMs)) return null;

  const startMs = getStartOfDayMs(rawStartMs);
  const endMs = getNextDayBoundaryMs(rawEndMs);

  const left = clamp(((startMs - rangeStartMs) / rangeMs) * 100, 0, 100);
  const right = clamp(((endMs - rangeStartMs) / rangeMs) * 100, 0, 100);
  const width = right - left;

  if (width <= 0) return null;

  return {
    type: typeOverride ?? toScheduleSegmentType(segment.displayStatus),
    left,
    width: Math.max(width, 0.8),
  };
}

function mergeAdjacentSegments(segments) {
  return segments.reduce((mergedSegments, segment) => {
    const previous = mergedSegments.at(-1);
    const previousEnd = previous ? previous.left + previous.width : null;

    if (previous && previous.type === segment.type && Math.abs(previousEnd - segment.left) < 0.01) {
      previous.width += segment.width;
      return mergedSegments;
    }

    mergedSegments.push({ ...segment });
    return mergedSegments;
  }, []);
}

function fillNoPlanScheduleGaps(segments) {
  const sortedSegments = [...segments].sort((left, right) => left.left - right.left);
  const filledSegments = [];
  let cursor = 0;

  sortedSegments.forEach((segment) => {
    if (segment.left > cursor) {
      filledSegments.push({
        type: "no-plan",
        left: cursor,
        width: segment.left - cursor,
      });
    }

    filledSegments.push(segment);
    cursor = Math.max(cursor, segment.left + segment.width);
  });

  if (cursor < 100) {
    filledSegments.push({
      type: "no-plan",
      left: cursor,
      width: 100 - cursor,
    });
  }

  return filledSegments.filter((segment) => segment.width > 0.4);
}

function applyStatusOverlay(baseSegments, overlays) {
  const segments = overlays.reduce((currentSegments, overlay) => {
    const overlayStart = overlay.left;
    const overlayEnd = overlay.left + overlay.width;

    return currentSegments.flatMap((segment) => {
      const segmentStart = segment.left;
      const segmentEnd = segment.left + segment.width;

      if (overlayEnd <= segmentStart || overlayStart >= segmentEnd) {
        return [segment];
      }

      const nextSegments = [];
      const overlapStart = Math.max(segmentStart, overlayStart);
      const overlapEnd = Math.min(segmentEnd, overlayEnd);
      const selectedType =
        segmentPriority[overlay.type] > segmentPriority[segment.type] ? overlay.type : segment.type;

      if (segmentStart < overlapStart) {
        nextSegments.push({
          ...segment,
          left: segmentStart,
          width: overlapStart - segmentStart,
        });
      }

      nextSegments.push({
        ...segment,
        type: selectedType,
        left: overlapStart,
        width: overlapEnd - overlapStart,
      });

      if (overlapEnd < segmentEnd) {
        nextSegments.push({
          ...segment,
          left: overlapEnd,
          width: segmentEnd - overlapEnd,
        });
      }

      return nextSegments;
    });
  }, baseSegments);

  return mergeAdjacentSegments(segments).filter((segment) => segment.width > 0.4);
}

export function mapSummaryToMetrics(summary = {}) {
  return [
    {
      title: "지연 위험 주문",
      value: formatInteger(summary.delayRiskOrderCount),
      unit: "건",
      caption: "전체 주문 대비",
      change: `${formatPercent(summary.delayRiskOrderRate)}%`,
      tone: "danger",
    },
    {
      title: "자재 부족 품목",
      value: formatInteger(summary.materialShortageCount),
      unit: "건",
      caption: "전체 품목 대비",
      change: `${formatPercent(summary.materialShortageRate)}%`,
      tone: "warning",
    },
    {
      title: "주문별 달성률",
      value: formatPercent(summary.orderAchievementRate),
      unit: "%",
      caption: "목표 대비",
      change: `${formatPercent(summary.orderAchievementRate)}%`,
      tone: "success",
    },
    {
      title: "생산계획 절약시간",
      value: formatInteger(summary.savedDelayDays),
      unit: summary.savedDelayUnit === "DAY" ? "일" : summary.savedDelayUnit || "일",
    },
  ];
}

function createScheduleLineKey(line) {
  return line.lineId != null ? `id:${line.lineId}` : `name:${line.lineName || line.name}`;
}

function createNoPlanSegments() {
  return [{ type: "no-plan", left: 0, width: 100 }];
}

function compareLineRows(left, right) {
  const leftIndex = fixedLineOrder.indexOf(left.name);
  const rightIndex = fixedLineOrder.indexOf(right.name);

  if (leftIndex !== -1 || rightIndex !== -1) {
    return (leftIndex === -1 ? Number.MAX_SAFE_INTEGER : leftIndex) -
      (rightIndex === -1 ? Number.MAX_SAFE_INTEGER : rightIndex);
  }

  return left.name.localeCompare(right.name, "ko-KR");
}

export function mapWeeklySchedule(schedule = {}, activeLines = []) {
  const startDate = schedule.startDate || new Date().toISOString().slice(0, 10);
  const endDate = schedule.endDate || startDate;
  const rangeStartMs = parseLocalDate(startDate).getTime();
  const rangeEndMs = parseLocalDate(endDate).getTime() + DAY_MS;
  const rangeMs = Math.max(DAY_MS, rangeEndMs - rangeStartMs);
  const scheduleLineMap = new Map(
    (schedule.lines ?? []).map((line) => [createScheduleLineKey(line), line]),
  );
  const mergedLines = [...(schedule.lines ?? [])];

  activeLines.forEach((line) => {
    const key = createScheduleLineKey(line);

    if (!scheduleLineMap.has(key)) {
      mergedLines.push({
        lineId: line.lineId,
        lineName: line.lineName || line.name,
        schedules: [],
        segments: [],
      });
    }
  });

  return {
    baseWeekStart: startDate,
    rows: mergedLines.map((line) => {
      const planSegments = (line.segments ?? []).filter(
        (segment) => segment.segmentType === "PLAN",
      );
      const statusSegments = (line.segments ?? [])
        .map((segment) => {
          if (segment.segmentType !== "LINE_STATUS") return null;

          const type = toLineStatusSegmentType(segment);
          if (!type) return null;

          return mapSegment(segment, rangeStartMs, rangeMs, type);
        })
        .filter(Boolean);
      const rawSegments = planSegments.length > 0 ? planSegments : line.schedules ?? [];
      const baseSegments = fillNoPlanScheduleGaps(
        rawSegments
          .map((segment) => mapSegment(segment, rangeStartMs, rangeMs))
          .filter(Boolean),
      );

      return {
        name: line.lineName || `Line ${line.lineId}`,
        segments:
          baseSegments.length > 0
            ? applyStatusOverlay(baseSegments, statusSegments)
            : createNoPlanSegments(),
      };
    }).sort(compareLineRows),
  };
}

export function mapOrderDeliveryStatus(orderStatus = {}) {
  return {
    averageRate: clamp(formatPercent(orderStatus.averageProgressRate), 0, 100),
    orders: (orderStatus.orders ?? []).map((order) => ({
      id: order.orderNo || String(order.orderId),
      due: formatDueDate(order.dueDate),
      progress: clamp(formatPercent(order.progressRate), 0, 100),
      delayed: order.orderStatus === "DELAYED" || order.displayStatus === "지연",
      statusLabel: order.displayStatus || "확인 필요",
    })),
  };
}

export function mapLineUtilization(utilization = {}) {
  return (utilization.lines ?? []).map((line) => {
    const value = clamp(formatPercent(line.utilizationRate), 0, 100);
    const statusLabel = line.displayStatus || (value < 50 ? "가동 저조" : "가동 중");

    return {
      name: line.lineName || `Line ${line.lineId}`,
      value,
      low: statusLabel !== "가동 중" || value < 50,
      statusLabel,
    };
  });
}

export const dashboardLegend = [
  { label: "생산 중", type: "running" },
  { label: "예정", type: "planned" },
  { label: "셋업", type: "change" },
  { label: "지연", type: "delay" },
  { label: "완료", type: "completed" },
  { label: "비가동", type: "inactive" },
  { label: "계획 없음", type: "no-plan" },
];
