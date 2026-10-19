import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Spinner } from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";
import {
  downloadActivitiesReport,
  downloadSalesReport,
  downloadVerificationsReport,
  getActivitiesReport,
  getSalesReport,
  getVerificationsReport,
} from "@/services/api/adminReports";
import { useToastStore } from "@/stores/toastStore";
import {
  DiscountsPanel,
  PaymentsPanel,
  ProductsPanel,
} from "@/pages/admin/reports/ExtraReportPanels";
import { ManageHeader, ManageTabs, PagedRows } from "@/components/admin/AdminManageList";

function peso(amount: number): string {
  return `₱${amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;
}

function defaultStartDate(): string {
  const date = new Date();
  date.setDate(date.getDate() - 30);
  return date.toISOString().slice(0, 10);
}

function defaultEndDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

type Tab =
  "sales" | "products" | "payments" | "discounts" | "activities" | "verifications";

const TABS: { value: Tab; label: string }[] = [
  { value: "sales", label: "Sales" },
  { value: "products", label: "Products & categories" },
  { value: "payments", label: "Payments" },
  { value: "discounts", label: "Margins & vendor savings" },
  { value: "activities", label: "Markets & riders" },
  { value: "verifications", label: "Verifications" },
];

export default function AdminReports() {
  const [tab, setTab] = useState<Tab>("sales");
  const [startDate, setStartDate] = useState(defaultStartDate());
  const [endDate, setEndDate] = useState(defaultEndDate());

  return (
    <div className="flex flex-col gap-6">
      <ManageHeader
        eyebrow="Administration"
        title="Reports"
        description="Sales, orders and market performance for any date range."
      />

      <ManageTabs
        label="Report"
        tabs={TABS.map((item) => ({
          value: item.value,
          label: item.label,
          count: null,
        }))}
        value={tab}
        onChange={setTab}
      />

      <div className="flex flex-wrap items-end gap-3">
        <Input
          label="Start date"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
        <Input
          label="End date"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
      </div>

      {tab === "sales" && <SalesPanel startDate={startDate} endDate={endDate} />}
      {tab === "products" && <ProductsPanel startDate={startDate} endDate={endDate} />}
      {tab === "payments" && <PaymentsPanel startDate={startDate} endDate={endDate} />}
      {tab === "discounts" && <DiscountsPanel startDate={startDate} endDate={endDate} />}
      {tab === "verifications" && (
        <VerificationsPanel startDate={startDate} endDate={endDate} />
      )}
      {tab === "activities" && (
        <ActivitiesPanel startDate={startDate} endDate={endDate} />
      )}
    </div>
  );
}

interface PanelProps {
  startDate: string;
  endDate: string;
}

function SalesPanel({ startDate, endDate }: PanelProps) {
  const showToast = useToastStore((state) => state.showToast);
  const [downloading, setDownloading] = useState<"csv" | "xlsx" | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["salesReport", startDate, endDate],
    queryFn: () => getSalesReport({ startDate, endDate }),
  });

  async function handleDownload(format: "csv" | "xlsx") {
    setDownloading(format);
    try {
      const blob = await downloadSalesReport({ startDate, endDate }, format);
      triggerDownload(blob, `sales_report_${startDate}_to_${endDate}.${format}`);
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Could not download report.",
        "error",
      );
    } finally {
      setDownloading(null);
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    );
  }

  if (isError || !data) {
    return <ErrorState onRetry={() => void refetch()} />;
  }

  return (
    <>
      <div className="flex gap-3">
        <Button
          variant="secondary"
          loading={downloading === "csv"}
          onClick={() => void handleDownload("csv")}
        >
          Download CSV
        </Button>
        <Button
          variant="secondary"
          loading={downloading === "xlsx"}
          onClick={() => void handleDownload("xlsx")}
        >
          Download Excel
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="flex flex-col gap-1 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
          <span className="font-display text-2xl font-semibold text-slate-900">
            {data.total_orders}
          </span>
          <span className="text-xs text-slate-500">Total orders</span>
        </div>
        <div className="flex flex-col gap-1 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
          <span className="font-display text-2xl font-semibold text-slate-900">
            {peso(data.total_sales)}
          </span>
          <span className="text-xs text-slate-500">Total sales</span>
        </div>
        <div className="flex flex-col gap-1 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
          <span className="font-display text-2xl font-semibold text-slate-900">
            {data.total_items}
          </span>
          <span className="text-xs text-slate-500">Items sold</span>
        </div>
        <div className="flex flex-col gap-1 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
          <span className="font-display text-2xl font-semibold text-slate-900">
            {peso(data.average_order_value)}
          </span>
          <span className="text-xs text-slate-500">Avg. order value</span>
        </div>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-muted">
          Sales by market
        </h2>
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/70 text-[11px] uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-4 py-3">Market</th>
                <th className="px-4 py-3">Orders</th>
                <th className="px-4 py-3">Sales</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <PagedRows colSpan={4}>
                {data.sales_by_market.map((row) => (
                  <tr key={row.market_id}>
                    <td className="px-4 py-3 font-medium text-text">{row.market_name}</td>
                    <td className="px-4 py-3 text-text-muted">{row.total_orders}</td>
                    <td className="px-4 py-3 text-text-muted">{peso(row.total_sales)}</td>
                  </tr>
                ))}
              </PagedRows>
              {data.sales_by_market.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-text-muted">
                    No sales in this date range.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-muted">
          Orders
        </h2>
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/70 text-[11px] uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-4 py-3">Order #</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Market</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <PagedRows colSpan={6}>
                {data.orders.map((order) => (
                  <tr key={order.id}>
                    <td className="px-4 py-3 font-medium text-text">
                      {order.order_number}
                    </td>
                    <td className="px-4 py-3 text-text-muted">
                      {new Date(order.created_at).toLocaleDateString("en-PH")}
                    </td>
                    <td className="px-4 py-3 text-text-muted">{order.market_name}</td>
                    <td className="px-4 py-3 text-text-muted">{order.customer_name}</td>
                    <td className="px-4 py-3 text-text-muted">
                      {peso(order.total_amount)}
                    </td>
                  </tr>
                ))}
              </PagedRows>
              {data.orders.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-text-muted">
                    No orders in this date range.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function VerificationsPanel({ startDate, endDate }: PanelProps) {
  const showToast = useToastStore((state) => state.showToast);
  const [downloading, setDownloading] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["verificationsReport", startDate, endDate],
    queryFn: () => getVerificationsReport({ startDate, endDate }),
  });

  async function handleDownload() {
    setDownloading(true);
    try {
      const blob = await downloadVerificationsReport({ startDate, endDate });
      triggerDownload(blob, `verifications_report_${startDate}_to_${endDate}.csv`);
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Could not download report.",
        "error",
      );
    } finally {
      setDownloading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    );
  }

  if (isError || !data) {
    return <ErrorState onRetry={() => void refetch()} />;
  }

  return (
    <>
      <Button
        variant="secondary"
        loading={downloading}
        onClick={() => void handleDownload()}
      >
        Download CSV
      </Button>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="flex flex-col gap-1 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
          <span className="font-display text-2xl font-semibold text-slate-900">
            {data.total_submissions}
          </span>
          <span className="text-xs text-slate-500">Total submissions</span>
        </div>
        <div className="flex flex-col gap-1 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
          <span className="font-display text-2xl font-semibold text-slate-900">
            {data.approved}
          </span>
          <span className="text-xs text-slate-500">Approved</span>
        </div>
        <div className="flex flex-col gap-1 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
          <span className="font-display text-2xl font-semibold text-slate-900">
            {data.rejected}
          </span>
          <span className="text-xs text-slate-500">Rejected</span>
        </div>
        <div className="flex flex-col gap-1 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
          <span className="font-display text-2xl font-semibold text-slate-900">
            {data.approval_rate}%
          </span>
          <span className="text-xs text-slate-500">Approval rate</span>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50/70 text-[11px] uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">ID Type</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Submitted</th>
              <th className="px-4 py-3">Reviewed by</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            <PagedRows colSpan={6}>
              {data.verifications.map((v) => (
                <tr key={v.id}>
                  <td className="px-4 py-3 font-medium text-text">
                    {v.customer_name}
                    <div className="text-xs text-text-muted">{v.customer_email}</div>
                  </td>
                  <td className="px-4 py-3 text-text-muted">{v.id_type}</td>
                  <td className="px-4 py-3 capitalize text-text-muted">{v.status}</td>
                  <td className="px-4 py-3 text-text-muted">
                    {v.submitted_at &&
                      new Date(v.submitted_at).toLocaleDateString("en-PH")}
                  </td>
                  <td className="px-4 py-3 text-text-muted">{v.reviewed_by ?? "—"}</td>
                </tr>
              ))}
            </PagedRows>
            {data.verifications.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-text-muted">
                  No submissions in this date range.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

function ActivitiesPanel({ startDate, endDate }: PanelProps) {
  const showToast = useToastStore((state) => state.showToast);
  const [downloading, setDownloading] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["activitiesReport", startDate, endDate],
    queryFn: () => getActivitiesReport({ startDate, endDate }),
  });

  async function handleDownload() {
    setDownloading(true);
    try {
      const blob = await downloadActivitiesReport({ startDate, endDate });
      triggerDownload(blob, `activities_report_${startDate}_to_${endDate}.csv`);
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Could not download report.",
        "error",
      );
    } finally {
      setDownloading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    );
  }

  if (isError || !data) {
    return <ErrorState onRetry={() => void refetch()} />;
  }

  return (
    <>
      <Button
        variant="secondary"
        loading={downloading}
        onClick={() => void handleDownload()}
      >
        Download CSV
      </Button>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-muted">
          Market activity
        </h2>
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/70 text-[11px] uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-4 py-3">Market</th>
                <th className="px-4 py-3">Orders</th>
                <th className="px-4 py-3">Sales</th>
                <th className="px-4 py-3">Completed</th>
                <th className="px-4 py-3">Pending</th>
                <th className="px-4 py-3">Cancelled</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <PagedRows colSpan={7}>
                {data.market_activity.map((row) => (
                  <tr key={row.market_id}>
                    <td className="px-4 py-3 font-medium text-text">{row.market_name}</td>
                    <td className="px-4 py-3 text-text-muted">{row.total_orders}</td>
                    <td className="px-4 py-3 text-text-muted">{peso(row.total_sales)}</td>
                    <td className="px-4 py-3 text-text-muted">{row.completed_orders}</td>
                    <td className="px-4 py-3 text-text-muted">{row.pending_orders}</td>
                    <td className="px-4 py-3 text-text-muted">{row.cancelled_orders}</td>
                  </tr>
                ))}
              </PagedRows>
              {data.market_activity.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-text-muted">
                    No activity in this date range.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-muted">
          Rider activity
        </h2>
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/70 text-[11px] uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-4 py-3">Rider</th>
                <th className="px-4 py-3">Deliveries</th>
                <th className="px-4 py-3">Total amount</th>
                <th className="px-4 py-3">Avg. value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <PagedRows colSpan={5}>
                {data.rider_activity.map((row) => (
                  <tr key={row.rider_id}>
                    <td className="px-4 py-3 font-medium text-text">{row.rider_name}</td>
                    <td className="px-4 py-3 text-text-muted">{row.total_deliveries}</td>
                    <td className="px-4 py-3 text-text-muted">
                      {peso(row.total_delivery_amount)}
                    </td>
                    <td className="px-4 py-3 text-text-muted">
                      {peso(row.average_delivery_value)}
                    </td>
                  </tr>
                ))}
              </PagedRows>
              {data.rider_activity.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-text-muted">
                    No rider deliveries in this date range.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
