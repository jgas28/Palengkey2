import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Info, PenLine, X } from "lucide-react";
import { removeCartItem, updateCartItem } from "@/services/api/cart";
import { cartQueryKey } from "@/features/cart/useCart";
import { useToastStore } from "@/stores/toastStore";
import { formatPeso } from "@/utils/currency";
import type { CartItemRow as CartItemRowType } from "@/types/cart";

export interface CartItemRowProps {
  item: CartItemRowType;
  selected: boolean;
  onToggleSelect: () => void;
}

export default function CartItemRow({
  item,
  selected,
  onToggleSelect,
}: CartItemRowProps) {
  const queryClient = useQueryClient();
  const showToast = useToastStore((state) => state.showToast);
  const [editingNote, setEditingNote] = useState(false);
  const [noteDraft, setNoteDraft] = useState(item.customer_note ?? "");

  const invalidate = () => queryClient.invalidateQueries({ queryKey: cartQueryKey });

  const updateMutation = useMutation({
    mutationFn: (quantity: number) => updateCartItem(item.id, quantity),
    onSuccess: invalidate,
    onError: (error) => {
      showToast(
        error instanceof Error ? error.message : "Could not update item.",
        "error",
      );
    },
  });

  const noteMutation = useMutation({
    mutationFn: (note: string) => updateCartItem(item.id, item.item_quantity, note),
    onSuccess: () => {
      invalidate();
      setEditingNote(false);
    },
    onError: (error) => {
      showToast(
        error instanceof Error ? error.message : "Could not save note.",
        "error",
      );
    },
  });

  const removeMutation = useMutation({
    mutationFn: () => removeCartItem(item.id),
    onSuccess: invalidate,
    onError: (error) => {
      showToast(
        error instanceof Error ? error.message : "Could not remove item.",
        "error",
      );
    },
  });

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-[#DDE9EA] bg-white p-4">
      <div className="flex gap-4">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelect}
          aria-label={`Select ${item.name}`}
          className="mt-1 h-5 w-5 shrink-0 self-start accent-[#0097A7]"
        />

        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-[#F7FAFA]">
          {item.image && (
            <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate font-semibold leading-tight text-[#203238]">
              {item.name}
            </h3>
            <button
              type="button"
              onClick={() => removeMutation.mutate()}
              disabled={removeMutation.isPending}
              aria-label={`Remove ${item.name}`}
              className="shrink-0 p-1 text-[#66777C] transition-colors hover:text-[#F05A47] disabled:opacity-50"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>

          {item.weight_kg !== null && (
            <p className="mt-0.5 text-xs text-[#66777C]">
              {item.weight_kg < 1
                ? `${Math.round(item.weight_kg * 1000)} g`
                : `${item.weight_kg} kg`}{" "}
              each
            </p>
          )}

          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2 rounded-xl border border-[#DDE9EA] bg-[#F7FAFA] px-1 py-0.5">
              <button
                type="button"
                aria-label="Decrease quantity"
                onClick={() => updateMutation.mutate(Math.max(1, item.item_quantity - 1))}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#DDE9EA] bg-white font-bold text-[#203238] transition-colors hover:border-[#0097A7] hover:text-[#0097A7]"
              >
                −
              </button>
              <span className="w-6 text-center text-sm font-bold text-[#203238]">
                {item.item_quantity}
              </span>
              <button
                type="button"
                aria-label="Increase quantity"
                onClick={() => updateMutation.mutate(item.item_quantity + 1)}
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0097A7] font-bold text-white transition-colors hover:bg-[#006D77]"
              >
                +
              </button>
            </div>
            <div className="text-right">
              <p className="font-bold text-[#203238]">{formatPeso(Number(item.subtotal))}</p>
              <p className="text-xs text-[#66777C]">{formatPeso(Number(item.price))}/unit</p>
            </div>
          </div>
        </div>
      </div>

      {item.is_cutoff && (
        <p className="flex items-start gap-1.5 rounded-xl bg-[#FFF9F0] p-2 text-xs text-[#B8860B]">
          <Info size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
          Order later — choose the delivery time slot at checkout.
        </p>
      )}

      {editingNote ? (
        <div className="flex items-center gap-2">
          <input
            value={noteDraft}
            onChange={(event) => setNoteDraft(event.target.value)}
            placeholder="e.g. Please choose ripe ones"
            maxLength={500}
            autoFocus
            className="h-9 flex-1 rounded-lg border border-[#DDE9EA] bg-[#F7FAFA] px-2.5 text-xs text-[#203238] outline-none focus:border-[#0097A7]"
          />
          <button
            type="button"
            onClick={() => noteMutation.mutate(noteDraft.trim())}
            disabled={noteMutation.isPending}
            className="text-xs font-semibold text-[#0097A7] disabled:opacity-50"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => {
              setNoteDraft(item.customer_note ?? "");
              setEditingNote(false);
            }}
            className="text-xs font-medium text-[#66777C]"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setEditingNote(true)}
          className="flex items-center gap-1 self-start text-xs font-medium text-[#0097A7]"
        >
          <PenLine size={12} aria-hidden="true" />
          {item.customer_note ? `"${item.customer_note}"` : "Add note for picker"}
        </button>
      )}
    </div>
  );
}
