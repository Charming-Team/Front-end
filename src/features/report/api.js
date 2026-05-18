import { mockIssues, mockReports } from "./mock.js";

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
  await delay(500);

  return {
    id: Date.now(),
    title: `${payload.monthLabel} 생산 보고서`,
    createdAt: new Date().toISOString(),
    status: "DRAFT",
  };
}