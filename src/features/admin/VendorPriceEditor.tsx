import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import { updateAdminOrderItemVendorPrice } from "@/services/api/adminOrders";
import { useToastStore } from "@/stores/toastStore";
import type { AdminOrderItem } from "@/types/adminOrder";
import { vendorSavings } from "@/features/admin/vendorSavings";

function peso(amount: number): string {
  return `₱${amount.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export interface VendorPriceEditorProps {
  orderId: number;
  item: AdminOrderItem;
}

/**
 * Admin-only note under an ordered line: the vendor's listed price, what staff
 * actually paid after haggling, and why. Never shown to the customer.
 */
export default function VendorPriceEditor({ orderId, item }: VendorPriceEditorProps) {
  const queryClient = useQueryClient();
  const showToast = useToastStore((state) => state.showToast);
  const [open, setOpen] = useState(false);
  const [price, setPrice] = useState("");
  const [note, setNote] = useState("");

  const unit = item.unit_name ?? "unit";
  const listed =
    item.vendor_list_price !== null && item.vendor_list_price !== undefined
      ? Number(item.vendor_list_price)
      : null;
  const paid =
    item.vendor_price !== null && item.vendor_price !== undefined
      ? Number(item.vendor_price)
      : null;
  const saved = vendorSavings(item);

  const mutation = useMutation({
    mutationFn: () =>
      updateAdminOrderItemVendorPrice(orderId, item.id, {
        vendor_price: price === "" ? null : Number(price),
        vendor_note: note.trim() || null,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["adminOrder", orderId] });
      showToast("Vendor price saved.", "success");
      setOpen(false);
    },
    onError: (error) => {
      showToast(
        error instanceof Error ? error.message : "Could not save vendor price.",
        "error",
      );
    },
  });

  function openEditor() {
    setPrice(paid !== null ? String(paid) : "");
    setNote(item.vendor_note ?? "");
    setOpen(true);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    mutation.mutate();
  }

  // The API only sends these fields once the vendor-price migration has run.
  if (!("vendor_list_price" in item)) return null;

  return (
    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
      <span className="text-text-muted">
        Vendor listed {listed !== null ? `${peso(listed)}/${unit}` : "price not recorded"}
        {paid !== null && (
          <>
            {" · "}paid{" "}
            <span className="font-medium text-text">
              {peso(paid)}/{unit}
            </span>
          </>
        )}
      </span>
      {saved !== null && saved !== 0 && (
        <span
          className={`font-medium ${saved > 0 ? "text-status-delivered" : "text-status-cancelled"}`}
        >
          {saved > 0 ? `saved ${peso(saved)}` : `over by ${peso(-saved)}`}
        </span>
      )}
      <button
        type="button"
        onClick={openEditor}
        className="font-medium text-primary hover:underline"
      >
        {paid !== null || item.vendor_note ? "Edit vendor price" : "Record vendor price"}
      </button>
      {item.vendor_note && (
        <span className="basis-full italic text-text-muted">
          Admin note: {item.vendor_note}
        </span>
      )}

      <Modal isOpen={open} onClose={() => setOpen(false)} title="Vendor price">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <p className="font-medium text-text">{item.item_name}</p>
            <p className="text-sm text-text-muted">
              {Number(Number(item.quantity).toFixed(3))} {unit} · listed{" "}
              {listed !== null
                ? `${peso(listed)}/${unit}`
                : "price not recorded for this order"}
            </p>
          </div>
          <Input
            label={`Actual price paid (₱ per ${unit})`}
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder={listed !== null ? String(listed) : "e.g. 280"}
            helperText="What the vendor actually charged after haggling. Leave blank to clear."
            autoFocus
          />
          <label className="flex flex-col gap-1.5 text-sm font-medium text-text">
            Admin note
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="e.g. Suki discount from Aling Nena, ₱10 off per kilo"
              className="rounded-xl border border-border bg-surface px-4 py-3 text-base font-normal text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-300"
            />
          </label>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={mutation.isPending}>
              Save
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
