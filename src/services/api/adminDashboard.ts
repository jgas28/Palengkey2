import { adminApiClient } from "@/services/api/adminClient";
import type { AdminDashboard, DashboardPeriod, LatestOrdersPage } from "@/types/adminDashboard";

/** KPI overview for the period (default today), compared with the stretch just before it. */
export async function getAdminDashboard(days: DashboardPeriod = 0): Promise<AdminDashboard> {
  const { data } = await adminApiClient.get<AdminDashboard>("/admin/dashboard", {
    params: { days },
  });
  return data;
}

/** Newest-first orders in the same period, 8 per page. */
export async function getDashboardOrders(
  days: DashboardPeriod,
  page: number,
): Promise<LatestOrdersPage> {
  const { data } = await adminApiClient.get<LatestOrdersPage>("/admin/dashboard/orders", {
    params: { days, page },
  });
  return data;
}
