import { mockIssues, mockReports, mockReportDetail } from "./mock.js";

function delay(ms = 200) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchReports() {
  await delay();
  return [...mockReports];
}

export async function fetchRecentIssues() {
  await delay();
  return [...mockIssues];
}

export async function createReport(payload) {
  await delay(1800);

  return {
    id: Date.now(),
    title: `${payload.startDate} ~ ${payload.endDate} 생산 보고서`,
    createdAt: new Date().toISOString(),
    status: "DRAFT",
  };
}

export async function fetchReportDetail() {
  await delay();
  return { ...mockReportDetail };
}