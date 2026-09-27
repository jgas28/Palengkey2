import { adminApiClient } from "@/services/api/adminClient";
import type { ActivitiesReport, SalesReport, VerificationsReport } from "@/types/adminReport";

export interface SalesReportParams {
  startDate: string;
  endDate: string;
}

export async function getSalesReport(params: SalesReportParams): Promise<SalesReport> {
  const { data } = await adminApiClient.get<SalesReport>("/admin/reports/sales", {
    params: { start_date: params.startDate, end_date: params.endDate },
  });
  return data;
}

export async function downloadSalesReport(
  params: SalesReportParams,
  format: "csv" | "xlsx",
): Promise<Blob> {
  const { data } = await adminApiClient.get<Blob>("/admin/reports/sales", {
    params: { start_date: params.startDate, end_date: params.endDate, format },
    responseType: "blob",
  });
  return data;
}

export async function getVerificationsReport(
  params: SalesReportParams,
): Promise<VerificationsReport> {
  const { data } = await adminApiClient.get<VerificationsReport>("/admin/reports/verifications", {
    params: { start_date: params.startDate, end_date: params.endDate },
  });
  return data;
}

export async function downloadVerificationsReport(params: SalesReportParams): Promise<Blob> {
  const { data } = await adminApiClient.get<Blob>("/admin/reports/verifications", {
    params: { start_date: params.startDate, end_date: params.endDate, format: "csv" },
    responseType: "blob",
  });
  return data;
}

export async function getActivitiesReport(params: SalesReportParams): Promise<ActivitiesReport> {
  const { data } = await adminApiClient.get<ActivitiesReport>("/admin/reports/activities", {
    params: { start_date: params.startDate, end_date: params.endDate },
  });
  return data;
}

export async function downloadActivitiesReport(params: SalesReportParams): Promise<Blob> {
  const { data } = await adminApiClient.get<Blob>("/admin/reports/activities", {
    params: { start_date: params.startDate, end_date: params.endDate, format: "csv" },
    responseType: "blob",
  });
  return data;
}
