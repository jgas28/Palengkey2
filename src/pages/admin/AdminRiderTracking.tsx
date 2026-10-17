import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, MessageCircle, Truck } from "lucide-react";
import { useLiveRiderPositions } from "@/features/admin/useLiveRiderPositions";
import ErrorState from "@/components/common/ErrorState";
import { Card, EmptyPanel, SkeletonRows } from "@/components/admin/AdminUi";
import AdminTrackingMap from "@/features/admin/AdminTrackingMap";
import { getAdminRiderTracking } from "@/services/api/adminRiders";
import { listAdminMarketsFull } from "@/services/api/adminMarkets";
import type { AdminRiderTrackingEntry } from "@/types/adminRider";

type RiderStatus = NonNullable<AdminRiderTrackingEntry["status"]>;

const STATUS_PILL: Record<RiderStatus, string> = {
  available: "bg-emerald-50 text-emerald-700",
  delivering: "bg-sky-50 text-sky-700",
  offline: "bg-slate-100 text-slate-500",
};
const STATUS_DOT: Record<RiderStatus, string> = {
  available: "bg-emerald-500",
  delivering: "bg-sky-500",
  offline: "bg-slate-400",
};

function statusOf(rider: AdminRiderTrackingEntry): RiderStatus {
  return rider.status ?? "available";
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function initials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 3)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "?"
  );
}

function timeAgo(isoDate: string | null, offline = false): string {
  if (!isoDate) return "No location yet";
  const minutes = Math.max(
    0,
    Math.round((Date.now() - new Date(isoDate).getTime()) / 60000),
  );
  const prefix = offline ? "Last seen" : "Updated";
  if (minutes === 0) return `${prefix} just now`;
  if (minutes < 60) return `${prefix} ${minutes} min ago`;
  if (minutes < 60 * 24) return `${prefix} ${Math.round(minutes / 60)} h ago`;
  return `${prefix} ${Math.round(minutes / 1440)} d ago`;
}

/** Compact age for the stat tile: "now", "4m", "3h", "12d", or "—". */
function shortAge(isoDate: string | null): string {
  if (!isoDate) return "—";
  const minutes = Math.max(
    0,
    Math.round((Date.now() - new Date(isoDate).getTime()) / 60000),
  );
  if (minutes === 0) return "now";
  if (minutes < 60) return `${minutes}m`;
  if (minutes < 60 * 24) return `${Math.round(minutes / 60)}h`;
  return `${Math.round(minutes / 1440)}d`;
}

function StatusPill({ status }: { status: RiderStatus }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUS_PILL[status]}`}
    >
      {capitalize(status)}
    </span>
  );
}

export default function AdminRiderTracking() {
  const [selectedRiderId, setSelectedRiderId] = useState<number | null>(null);

  const { data, isLoading, isError, refetch, dataUpdatedAt } = useQuery({
    queryKey: ["adminRiderTracking"],
    queryFn: getAdminRiderTracking,
    refetchInterval: 10000,
  });

  // Firebase gives live fixes from the rider app; use whichever is newer than the API's last saved one.
  const live = useLiveRiderPositions((data ?? []).map((rider) => rider.id));
  const riders = (data ?? []).map((rider) => {
    const fix = live[rider.id];
    const apiTime = rider.last_location_update
      ? new Date(rider.last_location_update).getTime()
      : 0;
    return fix && (fix.updatedAt ?? 0) >= apiTime
      ? {
          ...rider,
          latitude: fix.lat,
          longitude: fix.lng,
          last_location_update: fix.updatedAt
            ? new Date(fix.updatedAt).toISOString()
            : rider.last_location_update,
        }
      : rider;
  });

  const { data: marketsPage } = useQuery({
    queryKey: ["adminMarketsFull", "active"],
    queryFn: () => listAdminMarketsFull({ status: 1 }),
  });
  const activeMarkets = marketsPage?.data ?? [];

  // Default focus: first rider out on a delivery, otherwise the first rider.
  useEffect(() => {
    if (selectedRiderId !== null || !data || data.length === 0) return;
    setSelectedRiderId((data.find((r) => r.status === "delivering") ?? data[0]).id);
  }, [data, selectedRiderId]);

  const selected = riders.find((rider) => rider.id === selectedRiderId) ?? null;
  const onlineCount = riders.filter((rider) => statusOf(rider) !== "offline").length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-700">
            Orders &amp; delivery
          </p>
          <h2 className="font-display text-3xl font-semibold text-slate-900">
            Rider tracking
          </h2>
          <p className="text-sm text-slate-500">
            Live locations and delivery activity from the rider app.
          </p>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
          Live ·{" "}
          {dataUpdatedAt ? timeAgo(new Date(dataUpdatedAt).toISOString()) : "Connecting…"}
        </span>
      </div>

      <AdminTrackingMap
        riders={riders}
        markets={activeMarkets}
        selectedRiderId={selectedRiderId}
        onSelectRider={setSelectedRiderId}
      >
        {selected && (
          <div className="absolute bottom-4 left-4 flex w-[calc(100%-2rem)] max-w-xs items-center gap-3 rounded-xl bg-white p-3 shadow-lg">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary-50 text-[11px] font-semibold text-primary-800">
              {initials(selected.name)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-slate-900">
                {selected.name}
              </span>
              <span className="block truncate text-xs text-slate-500">
                {capitalize(statusOf(selected))} ·{" "}
                {timeAgo(selected.last_location_update, statusOf(selected) === "offline")}
              </span>
            </span>
            {selected.active_order && (
              <Link
                to={`/admin/orders/${selected.active_order.id}`}
                className="text-xs font-semibold text-primary-700 hover:underline"
              >
                {selected.active_order.order_number}
              </Link>
            )}
          </div>
        )}
      </AdminTrackingMap>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 p-5">
            <div>
              <h3 className="font-display text-lg font-semibold text-slate-900">
                Riders in the field
              </h3>
              <p className="text-xs text-slate-500">Select a rider to focus the map.</p>
            </div>
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
              {onlineCount} online
            </span>
          </div>

          {isLoading && <SkeletonRows rows={5} />}
          {isError && <ErrorState onRetry={() => void refetch()} />}
          {data && data.length === 0 && (
            <EmptyPanel
              title="No riders yet."
              description="Add riders on the Riders page to track them here."
            />
          )}

          <ul className="divide-y divide-slate-100">
            {riders.map((rider) => {
              const status = statusOf(rider);
              const isSelected = rider.id === selectedRiderId;
              return (
                <li key={rider.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedRiderId(rider.id)}
                    className={`flex w-full items-center gap-3 border-l-[3px] px-5 py-3 text-left transition-colors ${
                      isSelected
                        ? "border-primary-500 bg-primary-50/60"
                        : "border-transparent hover:bg-slate-50"
                    }`}
                  >
                    <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary-50 text-xs font-semibold text-primary-800">
                      {initials(rider.name)}
                      <span
                        className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ring-2 ring-white ${STATUS_DOT[status]}`}
                      />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-slate-900">
                        {rider.name}
                      </span>
                      <span className="block truncate text-xs text-slate-500">
                        {capitalize(rider.vehicle_type)}
                        {rider.market_name && ` · ${rider.market_name}`}
                      </span>
                      <span className="block text-[11px] text-slate-400">
                        {timeAgo(rider.last_location_update, status === "offline")}
                      </span>
                    </span>
                    <StatusPill status={status} />
                    <ChevronRight
                      size={16}
                      className="text-slate-400"
                      aria-hidden="true"
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        </Card>

        {selected && (
          <Card className="h-fit p-5">
            <div className="flex items-start gap-3 border-b border-slate-100 pb-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#f9a825] text-sm font-semibold text-white">
                {initials(selected.name)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[10px] font-semibold uppercase tracking-wide text-primary-700">
                  RDR-{String(selected.id).padStart(3, "0")}
                </span>
                <span className="block break-words font-display text-lg leading-tight font-semibold text-slate-900">
                  {selected.name}
                </span>
                <span className="block text-xs text-slate-500">{selected.phone}</span>
              </span>
              <StatusPill status={statusOf(selected)} />
            </div>

            <div className="grid grid-cols-3 gap-2 py-4">
              {[
                {
                  label: "Completed today",
                  value: String(selected.delivered_today_count ?? 0),
                },
                {
                  label: "Active orders",
                  value: String(selected.active_orders_count ?? 0),
                },
                {
                  label: "Last ping",
                  value: shortAge(selected.last_location_update),
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl bg-slate-50 px-2 py-3 text-center"
                >
                  <p className="text-[10px] text-slate-500">{stat.label}</p>
                  <p className="font-display text-xl font-semibold text-slate-900">
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>

            <dl className="flex flex-col gap-2.5 border-t border-slate-100 pt-4 text-xs">
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">Current area</dt>
                <dd className="font-semibold text-slate-800">
                  {selected.market_name ?? "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">Vehicle</dt>
                <dd className="font-semibold text-slate-800">
                  {capitalize(selected.vehicle_type)}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">Active order</dt>
                <dd className="font-semibold text-slate-800">
                  {selected.active_order?.order_number ?? "—"}
                </dd>
              </div>
            </dl>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <a
                href={`sms:${selected.phone}`}
                className="flex items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-primary-600 px-2 py-2.5 text-[11px] font-semibold text-white hover:bg-primary-700"
              >
                <MessageCircle size={15} aria-hidden="true" /> Message rider
              </a>
              {selected.active_order ? (
                <Link
                  to={`/admin/orders/${selected.active_order.id}`}
                  className="flex items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border border-primary-300 px-2 py-2.5 text-[11px] font-semibold text-primary-800 hover:bg-primary-50"
                >
                  <Truck size={15} aria-hidden="true" /> View assignment
                </Link>
              ) : (
                <span className="flex cursor-not-allowed items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border border-slate-200 px-2 py-2.5 text-[11px] font-semibold text-slate-400">
                  <Truck size={15} aria-hidden="true" /> No assignment
                </span>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
