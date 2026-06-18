import {
  ISSUE_IMPACT_LABELS,
  ISSUE_IMPACT_TONES,
  REPORT_TYPE_LABELS,
  REPORT_TYPE_TONES,
} from "./constants.js";

function formatDateTime(value) {
  if (!value) return "-";

  const normalizedValue = typeof value === "string"
    && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)
    && !/(Z|[+-]\d{2}:\d{2})$/.test(value)
    ? `${value}Z`
    : value;
  const date = new Date(normalizedValue);
  if (Number.isNaN(date.getTime())) return String(value);

  const pad = (number) => String(number).padStart(2, "0");
  return [
    `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())}`,
    `${pad(date.getHours())}:${pad(date.getMinutes())}`,
  ].join(" ");
}

function formatDate(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).replaceAll("-", ".");

  const pad = (number) => String(number).padStart(2, "0");
  return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())}`;
}

function formatPeriod(startDate, endDate) {
  const start = formatDate(startDate);
  const end = formatDate(endDate);

  if (start && end) return `${start} ~ ${end}`;
  return start || end || "-";
}

function countCollection(value) {
  if (Array.isArray(value)) return value.length;
  if (value && typeof value === "object") return Object.keys(value).length;
  return 0;
}

function hasRows(value) {
  return Array.isArray(value) && value.length > 0;
}

function displayText(value, fallback = "-") {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
}

function isMeaningfulText(value) {
  const text = String(value ?? "").trim();
  return text !== "" && text !== "-" && text !== "—";
}

function toPercent(value) {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "string") return value.includes("%") ? value : `${value}%`;
  return `${Number(value).toLocaleString()}%`;
}

function toQuantity(value) {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "string") return value;
  return Number(value).toLocaleString();
}

function pickArray(source, keys) {
  if (!source || typeof source !== "object") return [];

  for (const key of keys) {
    if (Array.isArray(source[key])) return source[key];
  }

  return [];
}

function mapLineRows(sections) {
  return pickArray(sections, ["lineRows", "linePerformance", "linePerformances", "lines"])
    .map((line, index) => ({
      line: line.line ?? line.lineName ?? line.name ?? `라인 ${index + 1}`,
      utilization: toPercent(line.utilization ?? line.operationRate ?? line.operationRatePercent),
      completed: toQuantity(line.completed ?? line.completedQuantity ?? line.productionQuantity),
      defectRate: toPercent(line.defectRate ?? line.defectRatePercent),
      note: line.note ?? line.status ?? line.summary ?? "-",
    }));
}

function mapEquipmentRows(sections) {
  return pickArray(sections, ["equipmentRows", "equipmentStatus", "equipments", "machines"])
    .map((equipment, index) => ({
      name: equipment.name ?? equipment.machineName ?? equipment.equipmentName ?? `설비 ${index + 1}`,
      utilization: toPercent(equipment.utilization ?? equipment.operationRate ?? equipment.operationRatePercent),
      downTime: equipment.downTime ?? equipment.downtime ?? equipment.downtimeHours ?? "-",
      status: equipment.status ?? equipment.operationStatusLabel ?? "정상",
    }));
}

function normalizeSummaryRows(rows) {
  return rows
    .map(row => ({
      label: displayText(row.label, ""),
      value: displayText(row.value),
      change: displayText(row.change),
    }))
    .filter(row => row.label || row.value !== "-");
}

function normalizeLineRows(rows) {
  return rows
    .map((row, index) => ({
      line: displayText(row.line, `라인 ${index + 1}`),
      utilization: displayText(row.utilization),
      completed: displayText(row.completed),
      defectRate: displayText(row.defectRate),
      note: displayText(row.note),
    }))
    .filter(row =>
      row.line !== "-"
      || row.utilization !== "-"
      || row.completed !== "-"
      || row.defectRate !== "-"
      || row.note !== "-"
    );
}

function normalizeEquipmentRows(rows) {
  return rows
    .map((row, index) => ({
      name: displayText(row.name, `설비 ${index + 1}`),
      utilization: displayText(row.utilization),
      downTime: displayText(row.downTime),
      status: displayText(row.status, "정상"),
    }))
    .filter(row =>
      row.name !== "-"
      || row.utilization !== "-"
      || row.downTime !== "-"
      || row.status !== "-"
    );
}

function normalizeMarkdownLines(markdown) {
  return String(markdown ?? "")
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);
}

/**
 * 목적: 구조화된 analysis가 없을 때 마크다운 본문을 화면 분석 모델로 변환한다.
 * 입력: 보고서 마크다운 문자열.
 * 출력: overview, sections, recommendation, markdown을 담은 분석 객체.
 * 처리 흐름:
 * 1. 빈 줄을 제거한 뒤 제목 행(#)을 섹션 경계로 인식한다.
 * 2. 제목 이전 문장은 overview 후보로, 제목 이후 문장은 섹션 item으로 모은다.
 * 3. 종합/제안/권고 성격의 섹션은 recommendation으로 분리한다.
 * 4. overview가 비면 첫 섹션 내용 또는 기본 안내 문구를 사용한다.
 */
function parseMarkdownAnalysis(markdown) {
  const lines = normalizeMarkdownLines(markdown);
  const sections = [];
  let currentSection = null;
  const overviewLines = [];

  lines.forEach((line) => {
    const headingMatch = line.match(/^#{1,6}\s+(.+)$/);
    if (headingMatch) {
      currentSection = {
        title: headingMatch[1].trim(),
        items: [],
      };
      sections.push(currentSection);
      return;
    }

    const itemText = line.replace(/^[-*]\s+/, "").replace(/^\d+\.\s+/, "").trim();
    if (currentSection) {
      currentSection.items.push(itemText);
    } else {
      overviewLines.push(itemText);
    }
  });

  const filteredSections = sections
    .map(section => ({
      ...section,
      items: section.items.filter(isMeaningfulText),
    }))
    .filter(section => section.items.length > 0);

  const recommendationIndex = filteredSections.findIndex(section =>
    /종합|제안|권고|recommend/i.test(section.title)
  );
  const recommendation = recommendationIndex >= 0
    ? filteredSections.splice(recommendationIndex, 1)[0].items.join(" ")
    : "";

  return {
    overview: overviewLines.join(" ") || filteredSections[0]?.items?.[0] || "보고서 본문을 확인해 주세요.",
    sections: filteredSections,
    recommendation,
    markdown: markdown || "",
  };
}

/**
 * 목적: 보고서 analysis 응답을 상세 화면이 기대하는 균일한 분석 모델로 정규화한다.
 * 입력: 구조화 analysis 객체와 원본 markdown 문자열.
 * 출력: overview, sections, recommendation, markdown을 포함한 객체.
 * 처리 흐름:
 * 1. analysis가 객체가 아니면 마크다운 파서로 대체한다.
 * 2. sections 배열의 제목과 항목을 문자열로 보정하고 의미 없는 항목을 제거한다.
 * 3. overview/recommendation 누락값은 빈 문자열 또는 기본 표시값으로 정리한다.
 */
function normalizeAnalysis(analysis, markdown) {
  if (!analysis || typeof analysis !== "object") {
    return parseMarkdownAnalysis(markdown);
  }

  const sections = Array.isArray(analysis.sections)
    ? analysis.sections
      .map((section, index) => ({
        title: displayText(section.title, `분석 ${index + 1}`),
        items: Array.isArray(section.items)
          ? section.items.map(item => displayText(item, "")).filter(isMeaningfulText)
          : [],
      }))
      .filter(section => section.title || section.items.length > 0)
    : [];

  return {
    overview: displayText(analysis.overview, ""),
    sections,
    recommendation: displayText(analysis.recommendation, ""),
    markdown: markdown || "",
  };
}

/**
 * 목적: 보고서 목록 API 응답을 리스트 카드/테이블 공통 표시 모델로 변환한다.
 * 입력: 백엔드 보고서 요약 객체.
 * 출력: id, title, author, createdAt, typeLabel/tone 등이 보강된 보고서 객체.
 * 처리 흐름:
 * 1. reportId/id, title/reportTitle처럼 가능한 필드 별칭을 흡수한다.
 * 2. 생성일과 대상 기간을 화면 표기 형식으로 포맷한다.
 * 3. 보고서 유형 코드에 맞는 라벨과 tone을 매핑한다.
 */
export function mapReportForView(report) {
  const type = report.reportType ?? report.type;
  const createdAt = formatDateTime(report.createdAt);

  return {
    ...report,
    id: report.reportId ?? report.id,
    title: report.title ?? report.reportTitle ?? "보고서",
    type,
    author: report.authorName ?? report.author ?? "작성자 미확인",
    createdAt,
    configuredAt: report.configuredAt ?? formatPeriod(report.targetStartDate, report.targetEndDate),
    typeLabel: REPORT_TYPE_LABELS[type] ?? type,
    typeTone: REPORT_TYPE_TONES[type] ?? "pending",
  };
}

/**
 * 목적: 보고서 상세 API 응답을 상세 화면 전체가 사용하는 뷰 모델로 변환한다.
 * 입력: 백엔드 보고서 상세 객체.
 * 출력: 기본 보고서 정보, 기간, 요약/라인/설비 행, 분석 모델을 담은 객체.
 * 처리 흐름:
 * 1. mapReportForView로 목록 공통 필드를 먼저 정규화한다.
 * 2. summaryRows/lineRows/equipmentRows가 있으면 정규화하고, 없으면 sections에서 추출한다.
 * 3. 근거 데이터 개수와 보고서 기간으로 fallback 요약 행을 구성한다.
 * 4. analysis 객체와 markdown 본문을 normalizeAnalysis로 통합한다.
 */
export function mapReportDetailForView(report) {
  const baseReport = mapReportForView(report);
  const sections = report.sections && typeof report.sections === "object" ? report.sections : {};
  const evidenceCount = countCollection(report.evidence);
  const period = formatPeriod(report.targetStartDate, report.targetEndDate);
  const fallbackSummaryRows = [
    { label: "보고서 기간", value: period, change: "-" },
    { label: "보고서 유형", value: baseReport.typeLabel, change: "-" },
    { label: "작성자", value: baseReport.author, change: "-" },
    { label: "생성 근거 데이터", value: `${evidenceCount}건`, change: "-" },
  ];

  return {
    ...baseReport,
    reportMode: /_BUSINESS$/.test(baseReport.type) ? "EXECUTIVE" : "NORMAL",
    period: {
      startDate: formatDate(report.targetStartDate),
      endDate: formatDate(report.targetEndDate),
    },
    summaryRows: hasRows(report.summaryRows)
      ? normalizeSummaryRows(report.summaryRows)
      : fallbackSummaryRows,
    lineRows: hasRows(report.lineRows)
      ? normalizeLineRows(report.lineRows)
      : mapLineRows(sections),
    equipmentRows: hasRows(report.equipmentRows)
      ? normalizeEquipmentRows(report.equipmentRows)
      : mapEquipmentRows(sections),
    analysis: normalizeAnalysis(report.analysis, report.markdown),
  };
}

export function mapIssueForView(issue) {
  return {
    ...issue,
    impactLabel: ISSUE_IMPACT_LABELS[issue.impact] ?? issue.impact,
    impactTone: ISSUE_IMPACT_TONES[issue.impact] ?? "normal",
  };
}
