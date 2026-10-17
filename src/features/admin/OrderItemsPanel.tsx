import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Clock, Leaf, Minus, Plus, X } from "lucide-react";
import {
  removeAdminOrderItem,
  updateAdminOrderItem,
  updateAdminOrderItemVendorPrice,
} from "@/services/api/adminOrders";
import { useToastStore } from "@/stores/toastStore";
import type { AdminOrderItem } from "@/types/adminOrder";

const REASONS = [
  "Partially out of stock",
  "Out of stock",
  "Market price changed",
  "Item substituted",
  "Customer requested change",
  "Other",
];

function peso(amount: number): string {
  return `₱${amount.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** "" for null/undefined, otherwise the number without trailing zeros. */
function plain(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "";
  return String(Number(value));
}

/** "" for null/undefined, otherwise a 2-decimal amount for the price inputs. */
function money(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "";
  return Number(value).toFixed(2);
}

const fieldLabel =
  "mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500";
const moneyInput =
  "flex h-10 items-center rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 focus-within:border-primary-300 focus-within:ring-2 focus-within:ring-primary-100";

function MoneyField({
  label,
  value,
  onChange,
  onCommit,
  disabled,
  accent,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onCommit: () => void;
  disabled?: boolean;
  accent?: boolean;
}) {
  return (
    <label className="block">
      <span className={`${fieldLabel} ${accent ? "!text-primary-700" : ""}`}>
        {label}
      </span>
      <span className={`${moneyInput} ${disabled ? "bg-slate-50 text-slate-400" : ""}`}>
        <span className="mr-1.5 text-slate-400">₱</span>
        <input
          type="number"
          min="0"
          step="0.01"
          inputMode="decimal"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onCommit}
          onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
          className="w-full min-w-0 bg-transparent focus:outline-none"
        />
      </span>
    </label>
  );
}

interface RowProps {
  orderId: number;
  item: AdminOrderItem;
  editable: boolean;
  reasonText: string | null;
}

function ItemRow({ orderId, item, editable, reasonText }: RowProps) {
  const queryClient = useQueryClient();
  const showToast = useToastStore((state) => state.showToast);
  const unit = item.unit_name ?? "pc";
  const hasVendorFields = "vendor_list_price" in item;

  const [qty, setQty] = useState(plain(item.quantity));
  const [price, setPrice] = useState(money(item.price));
  const [haggled, setHaggled] = useState(money(item.vendor_price));
  const [note, setNote] = useState(item.vendor_note ?? "");

  useEffect(() => {
    setQty(plain(item.quantity));
    setPrice(money(item.price));
    setHaggled(money(item.vendor_price));
    setNote(item.vendor_note ?? "");
  }, [item.quantity, item.price, item.vendor_price, item.vendor_note]);

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["adminOrder", orderId] });
    void queryClient.invalidateQueries({ queryKey: ["adminOrders"] });
  };
  const onError = (error: unknown) => {
    showToast(
      error instanceof Error ? error.message : "Could not update this item.",
      "error",
    );
    setQty(plain(item.quantity));
    setPrice(money(item.price));
  };
  const afterLineChange = (result: {
    message: string;
    total_difference: number;
    refund_due: number;
  }) => {
    refresh();
    const change =
      result.total_difference === 0
        ? ""
        : ` Total ${result.total_difference < 0 ? "down" : "up"} ${peso(Math.abs(result.total_difference))}.`;
    const refund =
      result.refund_due > 0 ? ` Refund ${peso(result.refund_due)} to the customer.` : "";
    showToast(
      `${result.message}${change}${refund}`,
      result.refund_due > 0 ? "info" : "success",
    );
  };

  const lineMutation = useMutation({
    mutationFn: (next: { quantity: number; price: number }) =>
      updateAdminOrderItem(orderId, item.id, {
        ...next,
        reason: reasonText ?? undefined,
      }),
    onSuccess: afterLineChange,
    onError,
  });
  const removeMutation = useMutation({
    mutationFn: () => removeAdminOrderItem(orderId, item.id, reasonText ?? undefined),
    onSuccess: afterLineChange,
    onError,
  });
  const vendorMutation = useMutation({
    mutationFn: () =>
      updateAdminOrderItemVendorPrice(orderId, item.id, {
        vendor_price: haggled === "" ? null : Number(haggled),
        vendor_note: note.trim() || null,
      }),
    onSuccess: refresh,
    onError: (error) =>
      showToast(
        error instanceof Error ? error.message : "Could not save vendor pricing.",
        "error",
      ),
  });

  const busy = lineMutation.isPending || removeMutation.isPending;
  const needsReason = () => {
    if (reasonText) return false;
    showToast("Choose a reason for changing this order first.", "error");
    setQty(plain(item.quantity));
    setPrice(money(item.price));
    return true;
  };

  function commitLine(nextQty: string, nextPrice: string) {
    const q = Number(nextQty);
    const p = Number(nextPrice);
    if (q === Number(item.quantity) && p === Number(item.price ?? 0)) return;
    if (!(q > 0) || !(p >= 0) || nextPrice === "") {
      setQty(plain(item.quantity));
      setPrice(money(item.price));
      return;
    }
    if (needsReason()) return;
    lineMutation.mutate({ quantity: q, price: p });
  }

  const isWeight = !Number.isInteger(Number(item.quantity));
  const step = isWeight ? 0.25 : 1;
  function bump(direction: 1 | -1) {
    const next = Math.round((Number(qty || 0) + direction * step) * 1000) / 1000;
    if (next <= 0) return;
    setQty(String(next));
    commitLine(String(next), price);
  }

  function commitVendor() {
    const same =
      haggled === money(item.vendor_price) && note.trim() === (item.vendor_note ?? "");
    if (!same) vendorMutation.mutate();
  }

  function remove() {
    if (needsReason()) return;
    if (window.confirm(`Remove ${item.item_name} from this order?`))
      removeMutation.mutate();
  }

  return (
    <li className={`py-4 ${busy ? "opacity-60" : ""}`}>
      <div className="flex flex-wrap items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-50 text-primary-700">
          <Leaf size={17} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-900">{item.item_name}</p>
          <p className="text-xs text-slate-500">
            {plain(item.quantity)} {unit}
            {item.selected_size && ` · ${item.selected_size}`} ·{" "}
            {peso(Number(item.subtotal))}
          </p>
          {item.customer_note && (
            <p className="mt-0.5 text-xs text-amber-700">
              Customer note: {item.customer_note}
            </p>
          )}
        </div>
        <div className="flex items-end gap-2">
          <div className="flex h-10 items-center rounded-lg border border-slate-200 bg-white">
            <button
              type="button"
              aria-label="Decrease quantity"
              disabled={!editable || busy}
              onClick={() => bump(-1)}
              className="grid h-full w-9 place-items-center text-slate-500 hover:text-primary-700 disabled:opacity-40"
            >
              <Minus size={14} />
            </button>
            <input
              aria-label="Quantity"
              type="number"
              min="0.001"
              step={step}
              value={qty}
              disabled={!editable || busy}
              onChange={(e) => setQty(e.target.value)}
              onBlur={() => commitLine(qty, price)}
              onKeyDown={(e) =>
                e.key === "Enter" && (e.target as HTMLInputElement).blur()
              }
              className="w-12 border-x border-slate-200 bg-transparent text-center text-sm font-semibold text-slate-800 focus:outline-none"
            />
            <button
              type="button"
              aria-label="Increase quantity"
              disabled={!editable || busy}
              onClick={() => bump(1)}
              className="grid h-full w-9 place-items-center text-slate-500 hover:text-primary-700 disabled:opacity-40"
            >
              <Plus size={14} />
            </button>
          </div>
          <div className="w-28">
            <MoneyField
              label="Customer price"
              accent
              value={price}
              disabled={!editable || busy}
              onChange={setPrice}
              onCommit={() => commitLine(qty, price)}
            />
          </div>
          <button
            type="button"
            aria-label={`Remove ${item.item_name}`}
            disabled={!editable || busy}
            onClick={remove}
            className="grid h-10 w-10 place-items-center rounded-lg bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="mt-3 rounded-xl bg-slate-50 p-3 sm:ml-[52px]">
        <div className="grid gap-3 sm:grid-cols-[120px_120px_minmax(0,1fr)]">
          {/* Encoded vendor price per unit, captured at checkout — read-only. */}
          <div>
            <span className={fieldLabel}>Vendor list price</span>
            <span
              className="flex h-10 items-center rounded-lg border border-dashed border-slate-200 px-3 text-sm font-semibold text-slate-700"
              title="Encoded vendor price at checkout"
            >
              {item.vendor_list_price != null ? (
                peso(Number(item.vendor_list_price))
              ) : (
                <span className="font-normal text-slate-400">—</span>
              )}
            </span>
          </div>
          <MoneyField
            label="Haggled price"
            value={haggled}
            disabled={!hasVendorFields}
            onChange={setHaggled}
            onCommit={commitVendor}
          />
          <label className="block">
            <span className={fieldLabel}>Shopper pricing note</span>
            <input
              value={note}
              disabled={!hasVendorFields}
              maxLength={500}
              onChange={(e) => setNote(e.target.value)}
              onBlur={commitVendor}
              onKeyDown={(e) =>
                e.key === "Enter" && (e.target as HTMLInputElement).blur()
              }
              placeholder="e.g. Vendor agreed after buying 3kg"
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100 disabled:bg-slate-50 disabled:text-slate-400"
            />
          </label>
        </div>
        {!hasVendorFields && (
          <p className="mt-2 text-xs text-slate-500">
            Vendor pricing unlocks after the latest database migration runs.
          </p>
        )}
      </div>
    </li>
  );
}

export interface OrderItemsPanelProps {
  orderId: number;
  items: AdminOrderItem[];
  /** Lines can change until the order leaves the market. */
  editable: boolean;
  isPaid: boolean;
}

/**
 * Inline editor for the ordered lines: quantity and customer price (needs a reason,
 * recalculates the order), plus the admin-only vendor list / haggled price and note.
 */
export default function OrderItemsPanel({
  orderId,
  items,
  editable,
  isPaid,
}: OrderItemsPanelProps) {
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const reasonText = reason
    ? (note.trim() ? `${reason} — ${note.trim()}` : reason).slice(0, 255)
    : null;

  return (
    <div>
      {editable && (
        <div className="mb-2 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-slate-700">
                Reason for changing this order
              </span>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100"
              >
                <option value="">Select a required reason</option>
                {REASONS.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-slate-700">
                Internal note
              </span>
              <input
                value={note}
                maxLength={200}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add context for the audit trail"
                className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100"
              />
            </label>
          </div>
          <p className="mt-2 flex items-center gap-1.5 text-xs text-primary-700">
            <Clock size={13} aria-hidden="true" />
            Choose a reason before editing or removing an item.
            {isPaid &&
              " This order is paid online — refund any lower total to the customer."}
          </p>
        </div>
      )}

      {items.length === 0 ? (
        <p className="py-4 text-sm text-slate-500">
          No separate items — see the buy lists below.
        </p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {items.map((item) => (
            <ItemRow
              key={item.id}
              orderId={orderId}
              item={item}
              editable={editable}
              reasonText={reasonText}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
