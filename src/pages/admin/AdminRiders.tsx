import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  useMutation,
  useQuery,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import {
  ArrowRight,
  Check,
  ChevronRight,
  PackageCheck,
  Plus,
  Radar,
  Search,
  Truck,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import ErrorState from "@/components/common/ErrorState";
import { Card, EmptyPanel, SkeletonRows } from "@/components/admin/AdminUi";
import { listAdminMarkets } from "@/services/api/adminLookups";
import {
  createAdminRider,
  listAdminRiders,
  updateAdminRider,
} from "@/services/api/adminRiders";
import { useAdminAuthStore } from "@/stores/adminAuthStore";
import { useToastStore } from "@/stores/toastStore";
import type { AdminRider, AdminRiderStatusFilter } from "@/types/adminRider";

interface RiderFormState {
  name: string;
  phone: string;
  vehicle_type: string;
  market_id: string;
}

const EMPTY_FORM: RiderFormState = {
  name: "",
  phone: "",
  vehicle_type: "",
  market_id: "",
};

const TABS: { key: AdminRiderStatusFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "available", label: "Available" },
  { key: "delivering", label: "Delivering" },
  { key: "offline", label: "Offline" },
];

type RiderState = "available" | "delivering" | "offline";

function riderState(rider: AdminRider): RiderState {
  if (!rider.is_active) return "offline";
  return (rider.delivering_count ?? 0) > 0 ? "delivering" : "available";
}

const STATE_STYLE: Record<RiderState, string> = {
  available: "bg-emerald-50 text-emerald-700 border-emerald-100",
  delivering: "bg-sky-50 text-sky-700 border-sky-100",
  offline: "bg-slate-100 text-slate-500 border-slate-200",
};

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function riderCode(id: number): string {
  return `RDR-${String(id).padStart(3, "0")}`;
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

function SummaryCard({
  icon,
  tone,
  label,
  value,
  hint,
}: {
  icon: ReactNode;
  tone: string;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <Card className="flex items-center gap-4 p-4">
      <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${tone}`}>
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-xs text-slate-500">{label}</span>
        <span className="block font-display text-2xl font-semibold text-slate-900">
          {value}
        </span>
        <span className="block truncate text-xs text-slate-400">{hint}</span>
      </span>
    </Card>
  );
}

export default function AdminRiders() {
  const user = useAdminAuthStore((state) => state.user);
  const isSuperAdmin = user?.role === "super_admin";
  const queryClient = useQueryClient();
  const showToast = useToastStore((state) => state.showToast);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [tab, setTab] = useState<AdminRiderStatusFilter>("all");
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [editingRider, setEditingRider] = useState<AdminRider | null>(null);
  const [form, setForm] = useState<RiderFormState>(EMPTY_FORM);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["adminRiders", debouncedSearch, tab, page],
    queryFn: () => listAdminRiders(debouncedSearch || undefined, tab, page),
    placeholderData: keepPreviousData,
  });
  const summary = data?.summary;

  const { data: markets } = useQuery({
    queryKey: ["adminMarkets"],
    queryFn: listAdminMarkets,
    enabled: isSuperAdmin && showCreate,
  });

  function openCreate() {
    setForm(EMPTY_FORM);
    setShowCreate(true);
  }

  function openEdit(rider: AdminRider) {
    setEditingRider(rider);
    setForm({
      name: rider.name,
      phone: rider.phone,
      vehicle_type: rider.vehicle_type,
      market_id: String(rider.market_id),
    });
  }

  function closeModals() {
    setShowCreate(false);
    setEditingRider(null);
    setForm(EMPTY_FORM);
  }

  const createMutation = useMutation({
    mutationFn: () =>
      createAdminRider({
        name: form.name.trim(),
        phone: form.phone.trim(),
        vehicle_type: form.vehicle_type.trim(),
        market_id: isSuperAdmin ? Number(form.market_id) : undefined,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["adminRiders"] });
      showToast("Rider added.", "success");
      closeModals();
    },
    onError: (error) => {
      showToast(error instanceof Error ? error.message : "Could not add rider.", "error");
    },
  });

  const updateMutation = useMutation({
    mutationFn: () => {
      if (!editingRider) throw new Error("No rider selected.");
      return updateAdminRider(editingRider.id, {
        name: form.name.trim(),
        phone: form.phone.trim(),
        vehicle_type: form.vehicle_type.trim(),
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["adminRiders"] });
      showToast("Rider updated.", "success");
      closeModals();
    },
    onError: (error) => {
      showToast(
        error instanceof Error ? error.message : "Could not update rider.",
        "error",
      );
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (rider: AdminRider) =>
      updateAdminRider(rider.id, { is_active: !rider.is_active }),
    onSuccess: (_data, rider) => {
      void queryClient.invalidateQueries({ queryKey: ["adminRiders"] });
      void queryClient.invalidateQueries({ queryKey: ["adminActiveRiders"] });
      showToast(
        rider.is_active ? `${rider.name} is now offline.` : `${rider.name} is available.`,
        "success",
      );
    },
    onError: (error) => {
      showToast(
        error instanceof Error ? error.message : "Could not update rider.",
        "error",
      );
    },
  });

  function changeState(rider: AdminRider, next: RiderState) {
    const goingOffline = next === "offline";
    if (goingOffline === !rider.is_active) return;
    if (goingOffline && rider.active_orders_count > 0) {
      const confirmed = window.confirm(
        `${rider.name} has ${rider.active_orders_count} active order(s) in progress. ` +
          "Setting them offline won't reassign those orders. Continue?",
      );
      if (!confirmed) return;
    }
    toggleActiveMutation.mutate(rider);
  }

  const isFormValid =
    form.name.trim().length > 0 &&
    form.phone.trim().length > 0 &&
    form.vehicle_type.trim().length > 0 &&
    (!isSuperAdmin || !showCreate || form.market_id !== "");

  const tabCount = (key: AdminRiderStatusFilter) =>
    summary ? (key === "all" ? summary.total : summary[key]) : null;

  const inputClass =
    "rounded-lg border border-slate-200 bg-white p-3 text-sm font-normal text-slate-800 focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-700">
            Orders &amp; delivery
          </p>
          <h2 className="font-display text-3xl font-semibold text-slate-900">Riders</h2>
          <p className="text-sm text-slate-500">
            Manage rider availability, assignments, and delivery performance.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/admin/riders/tracking"
            className="flex items-center gap-2 rounded-xl border border-primary-300 bg-white px-4 py-2.5 text-sm font-semibold text-primary-800 shadow-sm hover:bg-primary-50"
          >
            <Radar size={16} aria-hidden="true" /> Live tracking
          </Link>
          <button
            type="button"
            onClick={openCreate}
            className="flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-700"
          >
            <Plus size={16} aria-hidden="true" /> Add rider
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon={<Truck size={20} />}
          tone="bg-primary-50 text-primary-700"
          label="Total riders"
          value={String(summary?.total ?? "–")}
          hint="Registered fleet"
        />
        <SummaryCard
          icon={<Check size={20} />}
          tone="bg-emerald-50 text-emerald-600"
          label="Available now"
          value={String(summary?.available ?? "–")}
          hint="Ready for assignment"
        />
        <SummaryCard
          icon={<ArrowRight size={20} />}
          tone="bg-sky-50 text-sky-600"
          label="On delivery"
          value={String(summary?.delivering ?? "–")}
          hint="Live active trips"
        />
        <SummaryCard
          icon={<PackageCheck size={20} />}
          tone="bg-amber-50 text-amber-600"
          label="Delivered today"
          value={String(summary?.delivered_today ?? "–")}
          hint="Completed drop-offs"
        />
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
          <div className="flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1">
            {TABS.map((item) => {
              const active = tab === item.key;
              const count = tabCount(item.key);
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    setTab(item.key);
                    setPage(1);
                  }}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold ${
                    active
                      ? "bg-primary-600 text-white shadow-sm"
                      : "text-slate-600 hover:text-primary-700"
                  }`}
                >
                  {item.label}
                  {count !== null && (
                    <span
                      className={`text-[10px] ${active ? "text-white/80" : "text-slate-400"}`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <label className="relative w-full sm:w-72">
            <Search
              size={15}
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-primary-600"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search rider, phone, or market"
              className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100"
            />
          </label>
        </div>

        {isLoading && <SkeletonRows rows={5} />}
        {isError && <ErrorState onRetry={() => void refetch()} />}

        {data && data.data.length === 0 && (
          <EmptyPanel
            title={
              debouncedSearch || tab !== "all" ? "No riders match." : "No riders yet."
            }
            description={
              debouncedSearch || tab !== "all"
                ? "Try another search or status."
                : "Add a rider to start assigning deliveries."
            }
          />
        )}

        {data && data.data.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="text-[11px] uppercase tracking-wide text-slate-400">
                <tr className="border-b border-slate-100">
                  <th className="px-5 py-3 font-semibold">Rider</th>
                  <th className="px-5 py-3 font-semibold">Market &amp; vehicle</th>
                  <th className="px-5 py-3 font-semibold">Today</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3">
                    <span className="sr-only">Track</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.data.map((rider) => {
                  const state = riderState(rider);
                  const today = rider.delivered_today_count ?? 0;
                  return (
                    <tr key={rider.id} className="hover:bg-slate-50/60">
                      <td className="px-5 py-3.5">
                        <button
                          type="button"
                          onClick={() => openEdit(rider)}
                          className="flex items-center gap-3 text-left"
                          title="Edit rider"
                        >
                          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary-50 text-xs font-semibold text-primary-800">
                            {initials(rider.name)}
                          </span>
                          <span>
                            <span className="block font-semibold text-slate-900 hover:text-primary-700">
                              {rider.name}
                            </span>
                            <span className="block text-xs text-slate-500">
                              {riderCode(rider.id)} · {rider.phone}
                            </span>
                          </span>
                        </button>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="block font-medium text-slate-800">
                          {rider.market?.name ?? "—"}
                        </span>
                        <span className="block text-xs text-slate-500">
                          {capitalize(rider.vehicle_type)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="block font-semibold text-slate-800">
                          {today} {today === 1 ? "delivery" : "deliveries"}
                        </span>
                        <span className="block text-xs text-slate-500">
                          {rider.active_orders_count > 0
                            ? `${rider.active_orders_count} active order${rider.active_orders_count === 1 ? "" : "s"}`
                            : "No active orders"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        {state === "delivering" ? (
                          <span
                            className={`inline-flex h-8 w-32 items-center rounded-lg border px-3 text-xs font-semibold ${STATE_STYLE.delivering}`}
                          >
                            Delivering
                          </span>
                        ) : (
                          <select
                            aria-label={`${rider.name} status`}
                            value={state}
                            disabled={toggleActiveMutation.isPending}
                            onChange={(e) =>
                              changeState(rider, e.target.value as RiderState)
                            }
                            className={`h-8 w-32 rounded-lg border px-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary-100 ${STATE_STYLE[state]}`}
                          >
                            <option value="available">Available</option>
                            <option value="offline">Offline</option>
                          </select>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Link
                          to="/admin/riders/tracking"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-primary-700"
                        >
                          Track <ChevronRight size={14} aria-hidden="true" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {data && data.last_page > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
            <span>
              Page {data.current_page} of {data.last_page}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= data.last_page}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </Card>

      <Modal
        isOpen={showCreate || editingRider !== null}
        onClose={closeModals}
        title={editingRider ? "Edit rider" : "Add rider"}
      >
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
            Name
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
            Phone
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
            Vehicle type
            <input
              type="text"
              value={form.vehicle_type}
              onChange={(e) => setForm((f) => ({ ...f, vehicle_type: e.target.value }))}
              placeholder="motorcycle, bicycle, ..."
              className={inputClass}
            />
          </label>
          {isSuperAdmin && showCreate && (
            <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
              Market
              <select
                value={form.market_id}
                onChange={(e) => setForm((f) => ({ ...f, market_id: e.target.value }))}
                className={inputClass}
              >
                <option value="">Select a market</option>
                {markets?.map((market) => (
                  <option key={market.id} value={market.id}>
                    {market.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          <Button
            loading={editingRider ? updateMutation.isPending : createMutation.isPending}
            disabled={!isFormValid}
            onClick={() =>
              editingRider ? updateMutation.mutate() : createMutation.mutate()
            }
          >
            {editingRider ? "Save changes" : "Add rider"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
