import { useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import Button from "@/components/ui/Button";
import { Spinner } from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";
import {
  downloadSimpleReport,
  getSimpleReport,
  type SimpleReport,
} from "@/services/api/adminReports";
import { useToastStore } from "@/stores/toastStore";

export interface ReportPanelProps {
  startDate: string;
  endDate: string;
}

function peso(amount: number): string {
  return `₱${amount.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function qty(value: number): string {
  return Number(value.toFixed(3)).toLocaleString("en-PH");
}

function StatCard({
  value,
  label,
  tone = "brand",
}: {
  value: ReactNode;
  label: string;
  tone?: "brand" | "plain";
}) {
  return tone === "brand" ? (
    <div className="flex flex-col gap-1 rounded-card bg-gradient-brand p-4 text-white shadow-soft">
      <span className="text-2xl font-bold">{value}</span>
      <span className="text-xs text-white/80">{label}</span>
    </div>
  ) : (
    <div className="flex flex-col gap-1 rounded-card border border-border bg-surface p-4">
      <span className="text-xl font-bold text-text">{value}</span>
      <span className="text-xs text-text-muted">{label}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-muted">
        {title}
      </h2>
      <div className="overflow-x-auto rounded-card border border-border">{children}</div>
    </section>
  );
}

function Table({
  head,
  children,
  empty,
  colSpan,
}: {
  head: string[];
  children: ReactNode;
  empty: boolean;
  colSpan?: number;
}) {
  return (
    <table className="w-full text-left text-sm">
      <thead className="bg-background text-xs uppercase text-text-muted">
        <tr>
          {head.map((label) => (
            <th key={label} className="px-4 py-3">
              {label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-border">
        {children}
        {empty && (
          <tr>
            <td
              colSpan={colSpan ?? head.length}
              className="px-4 py-6 text-center text-text-muted"
            >
              Nothing in this date range.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

const td = "px-4 py-3 text-text-muted";
const tdStrong = "px-4 py-3 font-medium text-text";

/** Loads one of the simple JSON reports for the selected date range. */
function useReport<K extends SimpleReport>(
  report: K,
  { startDate, endDate }: ReportPanelProps,
) {
  return useQuery({
    queryKey: ["report", report, startDate, endDate],
    queryFn: () => getSimpleReport(report, { startDate, endDate }),
  });
}

function CsvButton({
  report,
  startDate,
  endDate,
  label,
}: ReportPanelProps & { report: SimpleReport; label: string }) {
  const showToast = useToastStore((state) => state.showToast);
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    setDownloading(true);
    try {
      const blob = await downloadSimpleReport(report, { startDate, endDate });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${report}_report_${startDate}_to_${endDate}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Could not download report.",
        "error",
      );
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div>
      <Button
        variant="secondary"
        loading={downloading}
        onClick={() => void handleDownload()}
      >
        {label}
      </Button>
    </div>
  );
}

function Loading() {
  return (
    <div className="flex justify-center py-8">
      <Spinner />
    </div>
  );
}

export function ProductsPanel(props: ReportPanelProps) {
  const { data, isLoading, isError, refetch } = useReport("products", props);

  if (isLoading) return <Loading />;
  if (isError || !data) return <ErrorState onRetry={() => void refetch()} />;

  const bestDay = Math.max(1, ...data.daily_sales.map((day) => day.sales));
  const categoryTotal = data.sales_by_category.reduce((sum, row) => sum + row.revenue, 0);

  return (
    <>
      <CsvButton {...props} report="products" label="Download product sales CSV" />

      <Section title="Sales by category">
        <Table
          head={["Category", "Products sold", "Revenue", "Share"]}
          empty={data.sales_by_category.length === 0}
        >
          {data.sales_by_category.map((row) => (
            <tr key={row.category}>
              <td className={tdStrong}>{row.category}</td>
              <td className={td}>{row.items}</td>
              <td className={td}>{peso(row.revenue)}</td>
              <td className={td}>
                {categoryTotal > 0
                  ? `${((row.revenue / categoryTotal) * 100).toFixed(1)}%`
                  : "—"}
              </td>
            </tr>
          ))}
        </Table>
      </Section>

      <Section title="Best sellers (top 50 by revenue)">
        <Table
          head={["#", "Item", "Category", "Qty sold", "Orders", "Revenue"]}
          empty={data.top_items.length === 0}
        >
          {data.top_items.map((row, index) => (
            <tr key={`${row.item_id}-${row.item_name}-${row.unit_name}`}>
              <td className={td}>{index + 1}</td>
              <td className={tdStrong}>{row.item_name}</td>
              <td className={td}>{row.category ?? "—"}</td>
              <td className={td}>
                {qty(row.quantity)} {row.unit_name ?? ""}
              </td>
              <td className={td}>{row.orders}</td>
              <td className={td}>{peso(row.revenue)}</td>
            </tr>
          ))}
        </Table>
      </Section>

      <Section title="Daily sales">
        <Table
          head={["Date", "Orders", "Sales", ""]}
          empty={data.daily_sales.length === 0}
        >
          {data.daily_sales.map((day) => (
            <tr key={day.day}>
              <td className={tdStrong}>
                {new Date(`${day.day}T00:00:00`).toLocaleDateString("en-PH", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </td>
              <td className={td}>{day.orders}</td>
              <td className={td}>{peso(day.sales)}</td>
              <td className="w-1/3 px-4 py-3">
                <div className="h-2 rounded-full bg-primary-50" aria-hidden="true">
                  <div
                    className="h-2 rounded-full bg-primary"
                    style={{ width: `${(day.sales / bestDay) * 100}%` }}
                  />
                </div>
              </td>
            </tr>
          ))}
        </Table>
      </Section>
    </>
  );
}

export function PaymentsPanel(props: ReportPanelProps) {
  const { data, isLoading, isError, refetch } = useReport("payments", props);

  if (isLoading) return <Loading />;
  if (isError || !data) return <ErrorState onRetry={() => void refetch()} />;

  const cashless = data.methods.filter((row) => row.payment_method !== "cod");

  return (
    <>
      <CsvButton {...props} report="payments" label="Download payments CSV" />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard value={peso(data.total)} label="Completed sales" />
        <StatCard
          value={peso(cashless.reduce((sum, row) => sum + row.total, 0))}
          label="Cashless (PayMongo)"
        />
        <StatCard
          value={peso(
            data.methods.find((row) => row.payment_method === "cod")?.total ?? 0,
          )}
          label="Cash on delivery"
        />
      </div>

      <Section title="By payment method">
        <Table
          head={["Method", "Orders", "Total", "Share"]}
          empty={data.methods.length === 0}
        >
          {data.methods.map((row) => (
            <tr key={row.payment_method ?? "unknown"}>
              <td className={tdStrong}>{row.label}</td>
              <td className={td}>{row.orders}</td>
              <td className={td}>{peso(row.total)}</td>
              <td className={td}>{row.share}%</td>
            </tr>
          ))}
        </Table>
      </Section>
    </>
  );
}

export function DiscountsPanel(props: ReportPanelProps) {
  const { data, isLoading, isError, refetch } = useReport("discounts", props);

  if (isLoading) return <Loading />;
  if (isError || !data) return <ErrorState onRetry={() => void refetch()} />;

  const { totals } = data;

  return (
    <>
      <CsvButton {...props} report="discounts" label="Download vendor savings CSV" />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          value={peso(totals.markup_earned)}
          label={`Markup earned (~${data.markup_percent}%)`}
        />
        <StatCard value={peso(totals.vendor_savings)} label="Vendor haggle savings" />
        <StatCard
          value={peso(totals.bulk_discount)}
          label={`Bulk discounts (${totals.bulk_orders} orders)`}
        />
        <StatCard
          value={peso(totals.bulk_delivery_subsidy + totals.voucher_discount)}
          label="Delivery subsidy + vouchers"
        />
      </div>

      <Section title="By market">
        <Table
          head={[
            "Market",
            "Orders",
            "Markup",
            "Vendor savings",
            "Bulk discount",
            "Delivery subsidy",
            "Vouchers",
          ]}
          empty={data.by_market.length === 0}
        >
          {data.by_market.map((row) => (
            <tr key={row.market_id}>
              <td className={tdStrong}>{row.market_name}</td>
              <td className={td}>{row.orders}</td>
              <td className={td}>{peso(row.markup_earned)}</td>
              <td className={td}>{peso(row.vendor_savings)}</td>
              <td className={td}>{peso(row.bulk_discount)}</td>
              <td className={td}>{peso(row.bulk_delivery_subsidy)}</td>
              <td className={td}>{peso(row.voucher_discount)}</td>
            </tr>
          ))}
        </Table>
      </Section>

      <Section
        title={`Vendor prices recorded by staff (${totals.vendor_lines_recorded})`}
      >
        <Table
          head={["Order", "Item", "Qty", "Listed", "Paid", "Saved", "Admin note"]}
          empty={data.vendor_lines.length === 0}
        >
          {data.vendor_lines.map((line) => (
            <tr key={line.id}>
              <td className={tdStrong}>
                <Link
                  to={`/admin/orders/${line.order_id}`}
                  className="text-primary hover:underline"
                >
                  #{line.order_number}
                </Link>
                <div className="text-xs font-normal text-text-muted">
                  {line.market_name}
                </div>
              </td>
              <td className={td}>{line.item_name}</td>
              <td className={td}>
                {qty(line.quantity)} {line.unit_name ?? ""}
              </td>
              <td className={td}>
                {line.listed_price !== null ? peso(line.listed_price) : "—"}
              </td>
              <td className={td}>
                {line.paid_price !== null ? peso(line.paid_price) : "—"}
              </td>
              <td
                className={`px-4 py-3 font-medium ${(line.savings ?? 0) < 0 ? "text-status-cancelled" : "text-status-delivered"}`}
              >
                {line.savings !== null ? peso(line.savings) : "—"}
              </td>
              <td className={td}>{line.note ?? ""}</td>
            </tr>
          ))}
        </Table>
      </Section>
      <p className="text-xs text-text-muted">
        Staff record vendor prices on each order (Orders → open an order → “Record vendor
        price”). Markup is estimated from the current markup setting.
      </p>
    </>
  );
}
