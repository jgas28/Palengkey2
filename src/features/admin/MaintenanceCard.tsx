import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Construction, ExternalLink } from "lucide-react";
import { Card } from "@/components/admin/AdminUi";
import {
  getMaintenance,
  maintenanceQueryKey,
  setMaintenance,
} from "@/services/api/adminSettings";
import { useToastStore } from "@/stores/toastStore";

const DURATIONS = [
  { label: "30 minutes", minutes: 30 },
  { label: "1 hour", minutes: 60 },
  { label: "2 hours", minutes: 120 },
  { label: "4 hours", minutes: 240 },
  { label: "Not sure yet", minutes: 0 },
];

function manilaTime(iso: string): string {
  return new Date(iso).toLocaleString("en-PH", {
    timeZone: "Asia/Manila",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Super admin switch for the customer maintenance page. Only the customer
 * website and app are closed — the admin panel and rider app keep working.
 */
export default function MaintenanceCard() {
  const queryClient = useQueryClient();
  const showToast = useToastStore((state) => state.showToast);
  const [minutes, setMinutes] = useState(60);

  const { data: state, isLoading } = useQuery({
    queryKey: maintenanceQueryKey,
    queryFn: getMaintenance,
  });

  const mutation = useMutation({
    mutationFn: (enabled: boolean) =>
      setMaintenance({
        enabled,
        until:
          enabled && minutes > 0
            ? new Date(Date.now() + minutes * 60_000).toISOString()
            : null,
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(maintenanceQueryKey, data);
      showToast(data.message, "success");
    },
    onError: (error) =>
      showToast(
        error instanceof Error ? error.message : "Could not change maintenance mode.",
        "error",
      ),
  });

  function turnOn() {
    if (
      window.confirm(
        "Turn on maintenance mode? Customers on the website and app will see the maintenance page until you turn it off.",
      )
    ) {
      mutation.mutate(true);
    }
  }

  const enabled = Boolean(state?.enabled);

  return (
    <Card
      className={`flex flex-wrap items-center gap-4 p-5 ${
        enabled ? "border-amber-300 bg-amber-50/60" : ""
      }`}
    >
      <span
        className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${
          enabled ? "bg-amber-100 text-amber-700" : "bg-primary-50 text-primary-700"
        }`}
      >
        <Construction size={20} aria-hidden="true" />
      </span>
      <div className="min-w-[220px] flex-1">
        <p className="flex items-center gap-2 font-semibold text-slate-900">
          Maintenance mode
          <span
            className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
              enabled ? "bg-amber-100 text-amber-800" : "bg-emerald-50 text-emerald-700"
            }`}
          >
            {isLoading
              ? "…"
              : enabled
                ? "On — customers see the maintenance page"
                : "Off — site is live"}
          </span>
        </p>
        <p className="mt-0.5 text-xs text-slate-500">
          {enabled
            ? [
                state?.until
                  ? `Back online expected ${manilaTime(state.until)}`
                  : "No end time set",
                state?.changed_by && `turned on by ${state.changed_by}`,
              ]
                .filter(Boolean)
                .join(" · ")
            : "Closes the customer website and app only. The admin panel and rider app keep working."}
        </p>
        <a
          href="/maintenance"
          target="_blank"
          rel="noreferrer"
          className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-primary-700 hover:underline"
        >
          Preview the maintenance page <ExternalLink size={12} aria-hidden="true" />
        </a>
      </div>

      {enabled ? (
        <button
          type="button"
          disabled={mutation.isPending}
          onClick={() => mutation.mutate(false)}
          className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
        >
          {mutation.isPending ? "Turning off…" : "Turn off — go live"}
        </button>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-xs text-slate-500">
            Expected to take
            <select
              value={minutes}
              onChange={(e) => setMinutes(Number(e.target.value))}
              className="ml-2 h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100"
            >
              {DURATIONS.map((d) => (
                <option key={d.minutes} value={d.minutes}>
                  {d.label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            disabled={mutation.isPending || isLoading}
            onClick={turnOn}
            className="rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-600 disabled:opacity-60"
          >
            {mutation.isPending ? "Turning on…" : "Turn on maintenance"}
          </button>
        </div>
      )}
    </Card>
  );
}
