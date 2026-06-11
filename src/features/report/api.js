import { apiRequest } from "../../utils/api.js";
import { REPORT_TYPES } from "./constants.js";
import { mockIssues } from "./mock.js";

const REPORT_JOB_POLL_INTERVAL_MS = 1500;
const REPORT_JOB_TIMEOUT_MS = 120000;

function delay(ms = 200) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchReports({ page = 0, size = 100 } = {}) {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
  });
  const response = await apiRequest(`/api/reports?${params.toString()}`);
  return Array.isArray(response?.content) ? response.content : [];
}

export async function fetchRecentIssues() {
  await delay();
  return [...mockIssues];
}

export async function createReport(payload) {
  return apiRequest("/api/reports/generate", {
    method: "POST",
    body: JSON.stringify({
      reportType: payload.reportType ?? REPORT_TYPES.ON_DEMAND,
      period: {
        startDate: payload.startDate,
        endDate: payload.endDate,
      },
      includeExecutiveSummary: payload.includeExecutiveSummary ?? true,
      includeEvidence: payload.includeEvidence ?? true,
    }),
  });
}

export async function fetchReportDetail(reportId) {
  return apiRequest(`/api/reports/${encodeURIComponent(reportId)}`);
}

export async function createBusinessReport(reportId) {
  return apiRequest("/api/reports/business", {
    method: "POST",
    body: JSON.stringify({
      report_id: Number(reportId),
    }),
  });
}

export async function fetchReportJob(reportJobId) {
  return apiRequest(`/api/reports/jobs/${encodeURIComponent(reportJobId)}`);
}

export async function waitForReportJobSuccess(
  reportJobId,
  {
    intervalMs = REPORT_JOB_POLL_INTERVAL_MS,
    timeoutMs = REPORT_JOB_TIMEOUT_MS,
  } = {}
) {
  if (!reportJobId) {
    throw new Error("보고서 생성 Job ID가 없습니다.");
  }

  const startedAt = Date.now();

  while (Date.now() - startedAt <= timeoutMs) {
    const job = await fetchReportJob(reportJobId);
    const status = job.jobStatus ?? job.status;

    if (status === "SUCCESS") {
      const resultReportId = job.resultReportId ?? job.reportId;

      if (!resultReportId) {
        throw new Error("생성된 보고서 ID가 응답에 없습니다.");
      }

      return {
        ...job,
        resultReportId,
      };
    }

    if (status === "FAILED") {
      throw new Error(
        job.failureReason
        ?? job.errorMessage
        ?? "보고서 생성에 실패했습니다."
      );
    }

    await delay(intervalMs);
  }

  throw new Error("보고서 생성 시간이 초과되었습니다. 잠시 후 다시 확인해 주세요.");
}
