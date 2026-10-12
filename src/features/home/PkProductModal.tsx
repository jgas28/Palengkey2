import { useState } from "react";
import { createPortal } from "react-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Icon from "@/components/pk/Icon";
import { getItem } from "@/services/api/items";
import { addToCart } from "@/services/api/cart";
import { cartQueryKey } from "@/features/cart/useCart";
import { formatKg, kgToGo } from "@/features/bulk/bulkFormat";
import { useToastStore } from "@/stores/toastStore";
import { formatPeso } from "@/utils/currency";
import { isWeightUnit } from "@/utils/unit";

const WEIGHT_PRESETS = [
  { label: "125 g", kg: 0.125 },
  { label: "250 g", kg: 0.25 },
  { label: "500 g", kg: 0.5 },
  { label: "750 g", kg: 0.75 },
  { label: "1 kg", kg: 1 },
];

export interface PkProductModalProps {
  itemId: number;
  marketId: number;
  onClose: () => void;
}

/** The design's product quick view (.product-modal), backed by the real item and cart. */
export default function PkProductModal({
  itemId,
  marketId,
  onClose,
}: PkProductModalProps) {
  const queryClient = useQueryClient();
  const showToast = useToastStore((state) => state.showToast);
  const [quantity, setQuantity] = useState(1);
  const [weightKg, setWeightKg] = useState(1);
  const [instructions, setInstructions] = useState("");

  const {
    data: item,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["item", itemId, marketId],
    queryFn: () => getItem(itemId, marketId),
  });

  const weighted = item ? isWeightUnit(item.unit) : false;
  const selectedKg = weighted ? weightKg * quantity : 0;
  const bulkReached = Boolean(
    weighted &&
    item?.bulk_min_kg &&
    item.bulk_price !== null &&
    selectedKg + 0.0001 >= item.bulk_min_kg,
  );
  const unitPrice = item
    ? bulkReached
      ? Number(item.bulk_price)
      : Number(item.price)
    : 0;
  const total = Math.round(unitPrice * (weighted ? weightKg : 1) * quantity * 100) / 100;
  const saved =
    item && bulkReached ? (Number(item.price) - unitPrice) * weightKg * quantity : 0;

  const addMutation = useMutation({
    mutationFn: () =>
      addToCart({
        item_id: itemId,
        market_id: marketId,
        quantity,
        weight_kg: weighted ? weightKg : undefined,
        customer_note: instructions.trim() || undefined,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: cartQueryKey });
      showToast(`${quantity}× ${item?.name ?? "item"} added to your basket`, "success");
      onClose();
    },
    onError: (error) => {
      showToast(
        error instanceof Error ? error.message : "Could not add to cart.",
        "error",
      );
    },
  });

  return createPortal(
    <div className="product-modal-backdrop" onClick={onClose}>
      <section
        className="product-modal"
        role="dialog"
        aria-modal="true"
        aria-label={item?.name ?? "Product details"}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="drawer-close"
          onClick={onClose}
          aria-label="Close product details"
        >
          <Icon name="x" />
        </button>

        {(isLoading || isError || !item) && (
          <div
            className="product-details"
            style={{ gridColumn: "1 / -1", minHeight: 320 }}
          >
            {isError ? (
              <>
                <h2>Couldn&apos;t load this item</h2>
                <button
                  type="button"
                  className="btn primary"
                  onClick={() => void refetch()}
                >
                  Try again
                </button>
              </>
            ) : (
              <p className="product-description">Loading…</p>
            )}
          </div>
        )}

        {item && (
          <>
            <div className="product-gallery">
              <div className="product-main-image">
                {item.image ? (
                  <img src={item.image} alt={item.name} />
                ) : (
                  <div
                    style={{
                      display: "grid",
                      placeItems: "center",
                      height: "100%",
                      color: "var(--teal)",
                    }}
                  >
                    <Icon name="leaf" size={48} />
                  </div>
                )}
                {item.bulk_min_kg && <span>Bulk deal</span>}
                {item.is_cutoff && (
                  <b className="modal-stock" style={{ background: "var(--teal-dark)" }}>
                    Order later
                  </b>
                )}
              </div>
            </div>

            <div className="product-details">
              <p className="eyebrow">
                {item.category ?? "Market item"}
                {item.type ? ` · ${item.type}` : ""}
                {item.is_muslim_friendly ? " · Halal" : ""}
              </p>
              <h2>{item.name}</h2>
              <div className="modal-price">
                <strong>{formatPeso(unitPrice)}</strong>
                <span>/ {item.unit ?? "pc"}</span>
                {bulkReached && (
                  <>
                    <del>{formatPeso(item.price)}</del>
                    <b>Bulk price</b>
                  </>
                )}
              </div>
              <p className="product-description">
                {item.description ??
                  "Freshly selected from a trusted market stall. Your personal shopper checks quality before packing."}
              </p>

              {weighted && item.bulk_min_kg && item.bulk_price !== null && (
                <div className="bulk-banner">
                  <Icon name="sparkle" />
                  <div>
                    <strong>
                      {bulkReached
                        ? "Bulk Suki unlocked!"
                        : `Buy ${formatKg(item.bulk_min_kg)}kg or more, save more`}
                    </strong>
                    <p>
                      <span>
                        {formatPeso(item.bulk_price)}/{item.unit ?? "kg"} wholesale
                      </span>
                      {item.bulk_delivery_subsidy_cap ? (
                        <span>
                          Delivery up to {formatPeso(item.bulk_delivery_subsidy_cap)}{" "}
                          covered
                        </span>
                      ) : null}
                      {!bulkReached && (
                        <span>
                          {formatKg(kgToGo(selectedKg, item.bulk_min_kg))}kg to go
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              )}

              {item.is_cutoff && (
                <div
                  className="bulk-banner"
                  style={{
                    color: "var(--teal-dark)",
                    background: "var(--teal-pale)",
                    borderColor: "#b9dadd",
                  }}
                >
                  <Icon name="clock" />
                  <div>
                    <strong>Past today&apos;s cutoff</strong>
                    <p>
                      Add it now and it&apos;ll be delivered on the next available slot.
                    </p>
                  </div>
                </div>
              )}

              {weighted && (
                <div className="quantity-row" style={{ borderBottom: 0 }}>
                  <div>
                    <strong>Weight</strong>
                    <small>Per piece — your shopper weighs it at the stall</small>
                  </div>
                  <div className="filter-pills" style={{ flexWrap: "wrap" }}>
                    {WEIGHT_PRESETS.map((preset) => (
                      <button
                        type="button"
                        key={preset.kg}
                        className={weightKg === preset.kg ? "active" : ""}
                        onClick={() => setWeightKg(preset.kg)}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="quantity-row">
                <div>
                  <strong>Quantity</strong>
                  <small>
                    {weighted
                      ? `${formatKg(selectedKg)} kg total`
                      : `Each item is ${item.unit ?? "1 pc"}`}
                  </small>
                </div>
                <div className="modal-quantity">
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    <Icon name="minus" size={16} />
                  </button>
                  <span>{quantity}</span>
                  <button
                    type="button"
                    aria-label="Increase quantity"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    <Icon name="plus" size={16} />
                  </button>
                </div>
              </div>

              <label className="instruction-field">
                Special instructions <small>Optional</small>
                <textarea
                  value={instructions}
                  maxLength={500}
                  onChange={(event) => setInstructions(event.target.value)}
                  placeholder="Hal. hinog pero matigas, clean and slice, no plastic..."
                />
              </label>

              <div className="modal-total">
                <div>
                  <small>
                    {saved > 0
                      ? `Total · You save ${formatPeso(saved)}`
                      : "Estimated total"}
                  </small>
                  <strong>{formatPeso(total)}</strong>
                </div>
                <button
                  type="button"
                  className="btn primary"
                  disabled={addMutation.isPending}
                  onClick={() => addMutation.mutate()}
                >
                  <Icon name="cart" size={18} />{" "}
                  {addMutation.isPending ? "Adding…" : `Add ${quantity} to cart`}
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </div>,
    document.body,
  );
}
