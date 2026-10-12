import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Icon from "@/components/pk/Icon";
import PkDrawer from "@/components/pk/PkDrawer";
import { photos } from "@/components/pk/photos";
import { addPalutoDishToCart } from "@/services/api/paluto";
import { cartQueryKey } from "@/features/cart/useCart";
import {
  INGREDIENT_KIND_LABELS,
  formatQuantity,
  quantityStepFor,
} from "@/features/recipes/ingredientFormat";
import {
  computeCookingFee,
  estimateIngredientsCost,
  hasUnavailableIngredient,
} from "@/features/paluto/palutoPricing";
import { useToastStore } from "@/stores/toastStore";
import { formatPeso } from "@/utils/currency";
import type { PalutoDish, PalutoStallMenu } from "@/types/paluto";

export interface PalutoDishDrawerProps {
  stall: PalutoStallMenu;
  dish: PalutoDish | null;
  onClose: () => void;
}

export default function PalutoDishDrawer({
  stall,
  dish,
  onClose,
}: PalutoDishDrawerProps) {
  const [quantity, setQuantity] = useState(1);
  const showToast = useToastStore((state) => state.showToast);
  const queryClient = useQueryClient();

  // Reset to the dish's natural batch size whenever a different dish is opened —
  // keyed on id so a background refetch doesn't wipe the customer's quantity.
  useEffect(() => {
    if (dish) setQuantity(Number(dish.base_quantity));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dish?.id]);

  const addMutation = useMutation({
    mutationFn: () => addPalutoDishToCart({ paluto_dish_id: dish!.id, quantity }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: cartQueryKey });
      showToast(`Added to cart — cooked by ${stall.name}`, "success");
      onClose();
    },
    onError: (error) => {
      showToast(
        error instanceof Error ? error.message : "Could not add to cart.",
        "error",
      );
    },
  });

  if (!dish) return null;

  const baseQuantity = Number(dish.base_quantity);
  const scale = baseQuantity > 0 ? quantity / baseQuantity : 1;
  const quantitySettings = quantityStepFor(dish.pricing_unit);
  const ingredientsCost = estimateIngredientsCost(dish, quantity);
  const cookingFee = computeCookingFee(dish, quantity);
  const unavailable = hasUnavailableIngredient(dish);
  const boughtIngredients = dish.ingredients.filter(
    (ingredient) => !ingredient.is_provided,
  );
  const providedIngredients = dish.ingredients.filter(
    (ingredient) => ingredient.is_provided,
  );
  const total = ingredientsCost + cookingFee;

  return (
    <PkDrawer
      isOpen
      onClose={onClose}
      label={dish.name}
      photo={<img src={dish.image ?? photos.fish} alt={dish.name} />}
      action={
        <>
          <div>
            <small>Ingredients + cooking fee (estimate)</small>
            <strong>{formatPeso(total)}</strong>
          </div>
          <button
            type="button"
            className="btn primary"
            disabled={unavailable || !stall.is_accepting_orders || addMutation.isPending}
            onClick={() => addMutation.mutate()}
          >
            {!stall.is_accepting_orders
              ? "Stall not taking orders"
              : unavailable
                ? "Unavailable today"
                : addMutation.isPending
                  ? "Adding…"
                  : "Add order"}{" "}
            <Icon name="cart" size={18} />
          </button>
        </>
      }
    >
      <p className="kicker">Cooked by {stall.name}</p>
      <h2>{dish.name}</h2>
      <p>
        {dish.description ?? "Cooked fresh by the stall from ingredients we buy for you."}
      </p>

      <div className="quantity-row" style={{ marginTop: 18 }}>
        <div>
          <strong>Quantity</strong>
          <small>{quantitySettings.label}</small>
        </div>
        <div className="modal-quantity">
          <button
            type="button"
            aria-label="Decrease quantity"
            onClick={() =>
              setQuantity(
                Math.max(quantitySettings.min, quantity - quantitySettings.step),
              )
            }
          >
            <Icon name="minus" size={16} />
          </button>
          <span>{formatQuantity(quantity)}</span>
          <button
            type="button"
            aria-label="Increase quantity"
            onClick={() => setQuantity(quantity + quantitySettings.step)}
          >
            <Icon name="plus" size={16} />
          </button>
        </div>
      </div>

      <h3>What we&apos;ll buy for the stall</h3>
      <ul>
        {boughtIngredients.map((ingredient) => {
          const scaledQty = Number(ingredient.quantity) * scale;
          const missing = ingredient.unit_price === null;
          return (
            <li key={ingredient.id} style={{ justifyContent: "space-between" }}>
              <span style={{ display: "flex", gap: 9 }}>
                <Icon name={missing ? "x" : "check"} size={15} />
                <span>
                  {ingredient.name} — {formatQuantity(scaledQty)} {ingredient.unit}
                  {ingredient.is_optional ? " (optional)" : ""}
                  <br />
                  <small style={{ color: "var(--muted)" }}>
                    {INGREDIENT_KIND_LABELS[ingredient.kind]}
                    {ingredient.note ? ` · ${ingredient.note}` : ""}
                  </small>
                </span>
              </span>
              <strong style={{ whiteSpace: "nowrap" }}>
                {missing
                  ? ingredient.is_optional
                    ? "Skipped"
                    : "Not available"
                  : formatPeso(Number(ingredient.unit_price) * scaledQty)}
              </strong>
            </li>
          );
        })}
      </ul>

      {providedIngredients.length > 0 && (
        <div className="paluto-note">
          <Icon name="leaf" />
          <div>
            <strong>Already included by {stall.name}</strong>
            <p>
              {providedIngredients.map((ingredient) => ingredient.name).join(", ")} — no
              extra charge.
            </p>
          </div>
        </div>
      )}

      <h3>Price breakdown</h3>
      <ol>
        <li>
          <span>1</span>Ingredients at today&apos;s market prices:{" "}
          {formatPeso(ingredientsCost)}
        </li>
        <li>
          <span>2</span>Cooking fee: {formatPeso(cookingFee)}
        </li>
      </ol>
    </PkDrawer>
  );
}
