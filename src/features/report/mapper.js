import {
  ISSUE_IMPACT_LABELS,
  ISSUE_IMPACT_TONES,
  REPORT_TYPE_LABELS,
  REPORT_TYPE_TONES,
} from "./constants.js";

export function mapReportForView(report) {
  return {
    ...report,
    typeLabel: REPORT_TYPE_LABELS[report.type] ?? report.type,
    typeTone: REPORT_TYPE_TONES[report.type] ?? "pending",
  };
}

export function mapIssueForView(issue) {
  return {
    ...issue,
    impactLabel: ISSUE_IMPACT_LABELS[issue.impact] ?? issue.impact,
    impactTone: ISSUE_IMPACT_TONES[issue.impact] ?? "normal",
  };
}