import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import { removeAdminOrderItem, updateAdminOrderItem } from "@/services/api/adminOrders";
import { useToastStore } from "@/stores/toastStore";
import type { AdminOrderItem } from "@/types/adminOrder";

const REASONS = [
  "Partially out of stock",
  "Market price changed",
  "Customer requested change",
  "Other",
];

function peso(amount: number): string {
  return `₱${amount.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export interface OrderItemEditorProps {
  orderId: number;
  item: AdminOrderItem;
  /** The order is paid online — any lower total has to be refunded by staff. */
  isPaid: boolean;
}

/**
 * Lets staff fix a line the market can't fill as ordered: change the quantity or
 * price, or drop it as out of stock. The API recalculates the order totals.
 */
export default function OrderItemEditor({ orderId, item, isPaid }: OrderItemEditorProps) {
  const queryClient = useQueryClient();
  const showToast = useToastStore((state) => state.showToast);
  const [open, setOpen] = useState(false);
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [reason, setReason] = useState(REASONS[0]);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const unit = item.unit_name ?? "unit";
  const preview = Number(quantity) * Number(price);

  function afterChange(result: {
    message: string;
    total_difference: number;
    refund_due: number;
  }) {
    void queryClient.invalidateQueries({ queryKey: ["adminOrder", orderId] });
    void queryClient.invalidateQueries({ queryKey: ["adminOrders"] });
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
    setOpen(false);
  }

  function onError(error: unknown) {
    showToast(
      error instanceof Error ? error.message : "Could not change this item.",
      "error",
    );
  }

  const updateMutation = useMutation({
    mutationFn: () =>
      updateAdminOrderItem(orderId, item.id, {
        quantity: Number(quantity),
        price: Number(price),
        reason,
      }),
    onSuccess: afterChange,
    onError,
  });

  const removeMutation = useMutation({
    mutationFn: () => removeAdminOrderItem(orderId, item.id, "Out of stock"),
    onSuccess: afterChange,
    onError,
  });

  function openEditor() {
    setQuantity(String(Number(Number(item.quantity).toFixed(3))));
    setPrice(String(Number(item.price ?? 0)));
    setReason(REASONS[0]);
    setConfirmRemove(false);
    setOpen(true);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    updateMutation.mutate();
  }

  return (
    <>
      <button
        type="button"
        onClick={openEditor}
        className="text-xs font-medium text-primary hover:underline"
      >
        Edit
      </button>

      <Modal isOpen={open} onClose={() => setOpen(false)} title="Edit order item">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <p className="font-medium text-text">{item.item_name}</p>
            <p className="text-sm text-text-muted">
              Ordered {Number(Number(item.quantity).toFixed(3))} {unit} · ₱{item.subtotal}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label={`Quantity (${unit})`}
              type="number"
              min="0.001"
              step="0.001"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
              autoFocus
            />
            <Input
              label={`Price per ${unit} (₱)`}
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
          </div>

          <label className="flex flex-col gap-1.5 text-sm font-medium text-text">
            Reason
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="h-11 rounded-lg border border-border bg-surface px-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary-300"
            >
              {REASONS.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>

          <p className="rounded-lg bg-background px-3 py-2 text-sm text-text">
            New line total:{" "}
            <strong>{Number.isFinite(preview) ? peso(preview) : "—"}</strong>
            <span className="block text-xs text-text-muted">
              Service fee and voucher are recalculated for the whole order.
              {isPaid &&
                " This order is already paid online — refund any difference to the customer."}
            </span>
          </p>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
            {confirmRemove ? (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  loading={removeMutation.isPending}
                  onClick={() => removeMutation.mutate()}
                >
                  Yes, remove
                </Button>
                <button
                  type="button"
                  onClick={() => setConfirmRemove(false)}
                  className="text-xs text-text-muted"
                >
                  Keep it
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmRemove(true)}
                className="text-sm font-medium text-status-cancelled hover:underline"
              >
                Remove — out of stock
              </button>
            )}
            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={updateMutation.isPending}>
                Save
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </>
  );
}
