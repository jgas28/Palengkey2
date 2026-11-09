import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Store } from "lucide-react";
import { Card } from "@/components/admin/AdminUi";
import Button from "@/components/ui/Button";
import {
  closeMarket,
  getMarketClosure,
  marketClosureQueryKey,
  reopenMarket,
} from "@/services/api/adminMarketClosure";
import { useToastStore } from "@/stores/toastStore";

function manilaDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-PH", {
    timeZone: "Asia/Manila",
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const fieldClass =
  "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100";

/**
 * "Close market" for holidays: every item becomes Order Later only, deliveries
 * start on the reopen date, and the market reopens by itself that morning.
 */
export default function MarketClosureCard({ marketId }: { marketId?: number }) {
  const queryClient = useQueryClient();
  const showToast = useToastStore((state) => state.showToast);
  const [reopenDate, setReopenDate] = useState("");
  const [reason, setReason] = useState("");

  const { data: state, isLoading } = useQuery({
    queryKey: marketClosureQueryKey(marketId),
    queryFn: () => getMarketClosure(marketId),
  });

  const mutationOptions = {
    onSuccess: (data: Awaited<ReturnType<typeof reopenMarket>>) => {
      queryClient.setQueryData(marketClosureQueryKey(marketId), data);
      setReopenDate("");
      setReason("");
      showToast(data.message, "success");
    },
    onError: (error: unknown) =>
      showToast(
        error instanceof Error ? error.message : "Could not update the market.",
        "error",
      ),
  };

  const closeMutation = useMutation({
    mutationFn: () =>
      closeMarket({
        market_id: marketId,
        reopen_date: reopenDate,
        closed_reason: reason.trim() || undefined,
      }),
    ...mutationOptions,
  });

  const reopenMutation = useMutation({
    mutationFn: () => reopenMarket(marketId),
    ...mutationOptions,
  });

  if (isLoading || !state) return null;
  const closed = state.is_closed;

  return (
    <Card className={`p-5 ${closed ? "border-amber-300 bg-amber-50/60" : ""}`}>
      <div className="flex flex-wrap items-center gap-4">
        <span
          className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${
            closed ? "bg-amber-100 text-amber-700" : "bg-primary-50 text-primary-700"
          }`}
        >
          <Store size={20} aria-hidden="true" />
        </span>
        <div className="min-w-[220px] flex-1">
          <p className="font-semibold text-slate-900">
            {closed ? "Market closed — Order Later only" : "Close market"}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            {closed && state.closed_until
              ? `Every item in ${state.market_name} is Order Later only until ${manilaDateTime(state.closed_until)}. It reopens by itself.`
              : "For holidays or closures: every item becomes Order Later only, and deliveries start on the reopen date. Paluto can't be ordered while closed. It reopens by itself at opening time that day."}
          </p>
          {closed && state.closed_reason && (
            <p className="mt-1 text-xs text-amber-800">
              Note shown to customers: “{state.closed_reason}”
            </p>
          )}
        </div>
        {closed && (
          <Button
            size="sm"
            loading={reopenMutation.isPending}
            onClick={() => reopenMutation.mutate()}
          >
            Reopen now
          </Button>
        )}
      </div>

      {!closed && (
        <div className="mt-4 grid gap-3 sm:grid-cols-[180px_1fr_auto] sm:items-end">
          <label className="text-xs font-semibold text-slate-600">
            Reopen on
            <input
              type="date"
              value={reopenDate}
              min={state.min_reopen_date}
              max={state.max_reopen_date}
              onChange={(event) => setReopenDate(event.target.value)}
              className={`mt-1 ${fieldClass}`}
            />
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Note to customers (optional)
            <input
              type="text"
              value={reason}
              maxLength={160}
              placeholder="e.g. Closed for All Saints' Day"
              onChange={(event) => setReason(event.target.value)}
              className={`mt-1 ${fieldClass}`}
            />
          </label>
          <Button
            variant="danger"
            disabled={!reopenDate}
            loading={closeMutation.isPending}
            onClick={() => closeMutation.mutate()}
          >
            Close market
          </Button>
        </div>
      )}
    </Card>
  );
}
