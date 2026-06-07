import { apiRequest } from "../../utils/api.js";

function appendParam(params, key, value) {
  if (value === undefined || value === null || value === "") return;
  params.set(key, String(value));
}

export function fetchDashboardSummary() {
  return apiRequest("/api/dashboard/summary");
}

export function fetchDashboardWeeklySchedule({ startDate, endDate } = {}) {
  const params = new URLSearchParams();
  appendParam(params, "startDate", startDate);
  appendParam(params, "endDate", endDate);

  const query = params.toString();
  return apiRequest(`/api/dashboard/weekly-schedule${query ? `?${query}` : ""}`);
}

export function fetchDashboardOrderDeliveryStatus({ limit = 5 } = {}) {
  const params = new URLSearchParams({ limit: String(limit) });
  return apiRequest(`/api/dashboard/order-delivery-status?${params.toString()}`);
}

export function fetchDashboardLineUtilization() {
  return apiRequest("/api/dashboard/line-utilization");
}
