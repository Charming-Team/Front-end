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

/**
 * 목적: 생산계획/라인상태 기간 데이터를 주간 막대 차트의 percent segment로 변환한다.
 * 입력: 원본 segment, 주간 시작 시각(ms), 전체 범위(ms), 선택적 타입 override.
 * 출력: type, left, width를 가진 segment 객체 또는 유효하지 않으면 null.
 * 처리 흐름:
 * 1. segmentStartAt/segmentEndAt 또는 plannedStartAt/plannedEndAt을 읽는다.
 * 2. 시작일은 해당 날짜 00:00, 종료일은 다음 날짜 경계로 확장한다.
 * 3. 주간 범위 대비 left/right percent를 계산하고 0~100으로 제한한다.
 * 4. 폭이 없는 항목은 제외하고, 너무 얇은 막대는 최소 폭을 보장한다.
 */
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

/**
 * 목적: 같은 타입으로 바로 이어지는 segment를 합쳐 DOM 렌더링 단위를 줄인다.
 * 입력: left 순서로 정렬 가능한 segment 배열.
 * 출력: 인접 동일 타입 segment가 병합된 배열.
 * 처리 흐름:
 * 1. 이전 segment의 끝 위치와 현재 segment의 시작 위치를 비교한다.
 * 2. 타입이 같고 위치가 거의 맞닿아 있으면 이전 width를 확장한다.
 * 3. 병합할 수 없으면 현재 segment 복사본을 결과에 추가한다.
 */
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

/**
 * 목적: 계획 segment가 없는 주간 구간을 "계획 없음" segment로 채운다.
 * 입력: 실제 계획 segment 배열.
 * 출력: 0~100% 전체 범위가 빈틈 없이 채워진 segment 배열.
 * 처리 흐름:
 * 1. segment를 left 기준으로 정렬한다.
 * 2. cursor와 다음 segment 시작 사이의 빈 구간을 no-plan으로 추가한다.
 * 3. 마지막 segment 이후 남은 범위도 no-plan으로 채운다.
 * 4. 너무 얇아 화면에 의미 없는 segment는 제외한다.
 */
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

/**
 * 목적: 계획 막대 위에 라인 상태 segment를 우선순위에 따라 덮어씌운다.
 * 입력: 기본 계획 segment 배열과 RUNNING/SETUP/비가동 overlay 배열.
 * 출력: 상태 우선순위가 반영되고 인접 구간이 병합된 segment 배열.
 * 처리 흐름:
 * 1. 각 overlay와 겹치는 기본 segment를 앞/겹침/뒤 구간으로 분할한다.
 * 2. 겹침 구간은 segmentPriority가 높은 타입을 선택한다.
 * 3. 모든 overlay 적용 후 같은 타입의 인접 segment를 다시 병합한다.
 */
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

/**
 * 목적: 대시보드 요약 API 응답을 상단 지표 카드 배열로 변환한다.
 * 입력: delay/material/order/saved time 값을 포함한 summary 객체.
 * 출력: 카드 컴포넌트가 렌더링할 metric 객체 배열.
 * 처리 흐름:
 * 1. 각 지표 값을 정수 또는 percent 표시값으로 포맷한다.
 * 2. 카드 제목, 단위, 보조 문구, tone을 화면 기준으로 붙인다.
 * 3. 절약 시간은 API의 단위 코드가 DAY이면 한글 단위로 표시한다.
 */
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

/**
 * 목적: 주간 생산계획 API 응답과 현재 활성 라인을 스케줄 패널 표시 모델로 변환한다.
 * 입력: schedule(startDate/endDate/lines) 객체와 activeLines 배열.
 * 출력: baseWeekStart와 라인별 segment rows를 담은 객체.
 * 처리 흐름:
 * 1. 주간 시작/종료일로 percent 계산에 사용할 시간 범위를 만든다.
 * 2. schedule에 없는 활성 라인도 빈 row로 추가해 라인 목록을 유지한다.
 * 3. PLAN segment 또는 schedules를 기본 막대로 변환하고 빈 구간은 no-plan으로 채운다.
 * 4. LINE_STATUS segment를 overlay로 적용한 뒤 고정 라인 순서 기준으로 정렬한다.
 */
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

/**
 * 목적: 주문 납기 상태 응답을 납기 현황 패널 모델로 변환한다.
 * 입력: 평균 진척률과 주문 배열을 가진 orderStatus 객체.
 * 출력: averageRate와 주문별 due/progress/delayed/statusLabel 배열.
 * 처리 흐름:
 * 1. 평균/주문 진척률을 0~100 사이 정수로 제한한다.
 * 2. 납기일은 월.일(요일) 형식으로 표시한다.
 * 3. 지연 여부는 상태 코드 또는 표시 상태가 지연인지로 판정한다.
 */
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

/**
 * 목적: 라인 가동률 응답을 가동률 패널의 gauge 카드 모델로 변환한다.
 * 입력: utilization.lines 배열.
 * 출력: 라인명, 가동률 값, 저조 여부, 상태 라벨을 가진 배열.
 * 처리 흐름:
 * 1. 각 라인의 가동률을 0~100 사이 정수로 제한한다.
 * 2. displayStatus가 없으면 가동률 기준으로 기본 상태 문구를 만든다.
 * 3. 상태 문구 또는 50% 미만 기준으로 low 플래그를 결정한다.
 */
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
