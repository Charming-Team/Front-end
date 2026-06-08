import {
  ISSUE_IMPACT_LABELS,
  ISSUE_IMPACT_TONES,
  REPORT_TYPE_LABELS,
  REPORT_TYPE_TONES,
} from "./constants.js";

function formatDateTime(value) {
  if (!value) return "-";

  const date = new Date(value);
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

export function mapIssueForView(issue) {
  return {
    ...issue,
    impactLabel: ISSUE_IMPACT_LABELS[issue.impact] ?? issue.impact,
    impactTone: ISSUE_IMPACT_TONES[issue.impact] ?? "normal",
  };
}
