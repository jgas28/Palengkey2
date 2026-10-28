import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Icon from "@/components/pk/Icon";
import { removeCartItem, updateCartItem } from "@/services/api/cart";
import { cartQueryKey } from "@/features/cart/useCart";
import { useToastStore } from "@/stores/toastStore";
import { formatPeso } from "@/utils/currency";
import { isOrderable, type CartItemRow as CartItemRowType } from "@/types/cart";

export interface CartItemRowProps {
  item: CartItemRowType;
  selected: boolean;
  onToggleSelect: () => void;
}

function unavailableText(item: CartItemRowType): string {
  if (item.availability !== "out_of_stock") return "No longer available";
  if (!item.available_on) return "Out of stock today";
  const date = new Date(`${item.available_on}T00:00:00`).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
  });
  return `Out of stock · back ${date}`;
}

function formatWeight(kg: number): string {
  return kg < 1 ? `${Math.round(kg * 1000)} g` : `${kg} kg`;
}

/** The design's basket line (.cart-line) with selection, note, quantity and remove. */
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
  const onError = (fallback: string) => (error: unknown) =>
    showToast(error instanceof Error ? error.message : fallback, "error");

  const updateMutation = useMutation({
    mutationFn: (quantity: number) => updateCartItem(item.id, quantity),
    onSuccess: invalidate,
    onError: onError("Could not update item."),
  });
  const noteMutation = useMutation({
    mutationFn: (note: string) => updateCartItem(item.id, item.item_quantity, note),
    onSuccess: () => {
      void invalidate();
      setEditingNote(false);
    },
    onError: onError("Could not save note."),
  });
  const removeMutation = useMutation({
    mutationFn: () => removeCartItem(item.id),
    onSuccess: invalidate,
    onError: onError("Could not remove item."),
  });

  const orderable = isOrderable(item);

  return (
    <article
      className={`cart-line ${orderable ? "" : "is-unavailable"}`}
      style={selected && orderable ? undefined : { opacity: 0.6 }}
    >
      <label
        className="cart-thumb"
        style={{ position: "relative", overflow: "hidden", cursor: "pointer" }}
      >
        {item.image ? <img src={item.image} alt="" /> : <Icon name="leaf" />}
        <input
          type="checkbox"
          checked={selected && orderable}
          disabled={!orderable}
          onChange={onToggleSelect}
          aria-label={`Select ${item.name}`}
          style={{
            position: "absolute",
            left: 4,
            top: 4,
            width: 16,
            height: 16,
            accentColor: "var(--teal)",
          }}
        />
      </label>
      <div className="cart-info">
        <p className="eyebrow">
          {item.is_bulk ? "Bulk price" : (item.category ?? "Fresh market item")}
          {item.is_cutoff ? " · Order later" : ""}
        </p>
        <h3>{item.name}</h3>
        {!orderable && <span className="cart-unavailable">{unavailableText(item)}</span>}
        <small>
          {item.weight_kg !== null ? `${formatWeight(item.weight_kg)} each · ` : ""}
          {item.is_bulk && item.regular_unit_price ? (
            <>
              <del>{formatPeso(Number(item.regular_unit_price))}</del>{" "}
              {formatPeso(Number(item.unit_price))}/{item.unit ?? "kg"}
            </>
          ) : (
            `${formatPeso(Number(item.price))} each`
          )}
        </small>
        {editingNote ? (
          <span
            style={{ display: "flex", gap: 8, alignItems: "center", margin: "4px 0 6px" }}
          >
            <input
              value={noteDraft}
              onChange={(event) => setNoteDraft(event.target.value)}
              placeholder="e.g. Please choose ripe ones"
              maxLength={500}
              autoFocus
              aria-label="Note for your shopper"
              style={{
                flex: 1,
                height: 30,
                padding: "0 8px",
                border: "1px solid #cfdddd",
                borderRadius: 8,
                fontSize: 10,
              }}
            />
            <button
              type="button"
              style={{ color: "var(--teal-dark)" }}
              disabled={noteMutation.isPending}
              onClick={() => noteMutation.mutate(noteDraft.trim())}
            >
              Save
            </button>
            <button
              type="button"
              style={{ color: "var(--muted)" }}
              onClick={() => setEditingNote(false)}
            >
              Cancel
            </button>
          </span>
        ) : (
          <small
            style={{ cursor: "pointer", color: "var(--teal-dark)" }}
            onClick={() => setEditingNote(true)}
          >
            {item.customer_note
              ? `Note: ${item.customer_note}`
              : "+ Add note for your shopper"}
          </small>
        )}
        <button
          type="button"
          aria-label={`Remove ${item.name}`}
          disabled={removeMutation.isPending}
          onClick={() => removeMutation.mutate()}
        >
          Remove
        </button>
      </div>
      <div className="quantity">
        <button
          type="button"
          aria-label="Decrease quantity"
          disabled={updateMutation.isPending}
          onClick={() => updateMutation.mutate(Math.max(1, item.item_quantity - 1))}
        >
          <Icon name="minus" size={15} />
        </button>
        <span>{item.item_quantity}</span>
        <button
          type="button"
          aria-label="Increase quantity"
          disabled={updateMutation.isPending}
          onClick={() => updateMutation.mutate(item.item_quantity + 1)}
        >
          <Icon name="plus" size={15} />
        </button>
      </div>
      <strong>{formatPeso(Number(item.subtotal))}</strong>
    </article>
  );
}
