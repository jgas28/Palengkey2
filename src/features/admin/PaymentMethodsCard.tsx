import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CreditCard } from "lucide-react";
import { Card } from "@/components/admin/AdminUi";
import {
  getPaymentMethods,
  paymentMethodsQueryKey,
  setPaymentMethod,
  type PaymentMethodStatus,
} from "@/services/api/adminSettings";
import { useToastStore } from "@/stores/toastStore";

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
 * Turn a payment method off while PayMongo, a wallet or a bank has an outage
 * (e.g. GCash maintenance). Checkout greys it out and the API refuses it.
 * Applies to every market.
 */
export default function PaymentMethodsCard() {
  const queryClient = useQueryClient();
  const showToast = useToastStore((state) => state.showToast);
  const [reasons, setReasons] = useState<Record<string, string>>({});

  const { data: methods, isLoading, isError } = useQuery({
    queryKey: paymentMethodsQueryKey,
    queryFn: getPaymentMethods,
  });

  const mutation = useMutation({
    mutationFn: (vars: { method: string; enabled: boolean; reason?: string | null }) =>
      setPaymentMethod(vars.method, { enabled: vars.enabled, reason: vars.reason }),
    onSuccess: (result) => {
      queryClient.setQueryData(paymentMethodsQueryKey, result.data);
      showToast(result.message, "success");
    },
    onError: (error) =>
      showToast(
        error instanceof Error ? error.message : "Could not change the payment method.",
        "error",
      ),
  });

  function turnOff(method: PaymentMethodStatus) {
    const reason = (reasons[method.method] ?? "").trim();
    if (
      window.confirm(
        `Turn off ${method.label}? Customers in every market won't be able to choose it until you turn it back on.`,
      )
    ) {
      mutation.mutate({ method: method.method, enabled: false, reason: reason || null });
    }
  }

  const offCount = methods?.filter((m) => !m.enabled).length ?? 0;

  return (
    <Card className={`p-5 ${offCount > 0 ? "border-amber-300 bg-amber-50/40" : ""}`}>
      <div className="flex items-start gap-4">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary-50 text-primary-700">
          <CreditCard size={20} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-900">Payment methods</p>
          <p className="mt-0.5 text-xs text-slate-500">
            Turn a method off during a PayMongo, e-wallet or bank outage. Applies to all
            markets. Orders already paid are not affected.
          </p>
        </div>
      </div>

      {isLoading && <p className="mt-4 text-sm text-slate-500">Loading…</p>}
      {isError && (
        <p className="mt-4 text-sm text-red-600">Could not load payment methods.</p>
      )}

      {methods && (
        <ul className="mt-4 divide-y divide-slate-100 rounded-xl border border-slate-100 bg-white">
          {methods.map((method) => {
            const busy = mutation.isPending && mutation.variables?.method === method.method;
            return (
              <li
                key={method.method}
                className="flex flex-wrap items-center gap-3 px-4 py-3"
              >
                <div className="min-w-[160px] flex-1">
                  <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    {method.label}
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        method.enabled
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {method.enabled ? "On" : "Off"}
                    </span>
                  </p>
                  {!method.enabled && (
                    <p className="mt-0.5 text-xs text-slate-500">
                      {[
                        method.reason && `“${method.reason}”`,
                        method.changed_by && `turned off by ${method.changed_by}`,
                        method.changed_at && manilaTime(method.changed_at),
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  )}
                </div>

                {method.enabled ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="sr-only" htmlFor={`pm-reason-${method.method}`}>
                      Note to customers for {method.label}
                    </label>
                    <input
                      id={`pm-reason-${method.method}`}
                      type="text"
                      maxLength={120}
                      placeholder="Note to customers (optional)"
                      value={reasons[method.method] ?? ""}
                      onChange={(e) =>
                        setReasons((r) => ({ ...r, [method.method]: e.target.value }))
                      }
                      className="h-9 w-56 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100"
                    />
                    <button
                      type="button"
                      disabled={mutation.isPending}
                      onClick={() => turnOff(method)}
                      className="rounded-xl border border-amber-300 bg-white px-3 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-50 disabled:opacity-60"
                    >
                      {busy ? "Turning off…" : `Turn off ${method.label}`}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={mutation.isPending}
                    onClick={() => mutation.mutate({ method: method.method, enabled: true })}
                    className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {busy ? "Turning on…" : `Turn on ${method.label}`}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
