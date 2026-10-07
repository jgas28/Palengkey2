import { useMutation, useQueryClient } from "@tanstack/react-query";
import Icon from "@/components/pk/Icon";
import { removeRecipeBundle } from "@/services/api/paluto";
import { cartQueryKey } from "@/features/cart/useCart";
import { useToastStore } from "@/stores/toastStore";
import { formatPeso } from "@/utils/currency";
import type { CartRecipeBundle } from "@/types/paluto";

export interface CartRecipeBundleRowProps {
  bundle: CartRecipeBundle;
  selected: boolean;
  onToggleSelect: () => void;
}

/** A Paluto dish or Buy Raw recipe in the basket, as a design .cart-line. */
export default function CartRecipeBundleRow({ bundle, selected, onToggleSelect }: CartRecipeBundleRowProps) {
  const queryClient = useQueryClient();
  const showToast = useToastStore((state) => state.showToast);

  const removeMutation = useMutation({
    mutationFn: () => removeRecipeBundle(bundle.id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: cartQueryKey }),
    onError: (error) =>
      showToast(error instanceof Error ? error.message : "Could not remove.", "error"),
  });

  const cookingFee = Number(bundle.cooking_fee);
  const quantityLabel = `${Number(bundle.quantity)} ${bundle.pricing_unit === "kg" ? "kg" : "serving(s)"}`;

  return (
    <article className="cart-line" style={selected ? undefined : { opacity: 0.6 }}>
      <label className="cart-thumb" style={{ position: "relative", overflow: "hidden", cursor: "pointer" }}>
        {bundle.image ? <img src={bundle.image} alt="" /> : <Icon name="sparkle" />}
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelect}
          aria-label={`Include ${bundle.recipe_name} in this order`}
          style={{ position: "absolute", left: 4, top: 4, width: 16, height: 16, accentColor: "var(--teal)" }}
        />
      </label>
      <div className="cart-info">
        <p className="eyebrow">
          {bundle.stall_name ? `Paluto · ${bundle.stall_name}` : "Recipe ingredients"}
        </p>
        <h3>{bundle.recipe_name}</h3>
        <small>
          {quantityLabel}
          {cookingFee > 0 ? ` · includes ${formatPeso(cookingFee)} cooking fee` : ""}
        </small>
        {bundle.ingredients.length > 0 && (
          <small>
            {bundle.stall_name ? "We'll buy: " : "Ingredients: "}
            {bundle.ingredients.map((ingredient) => ingredient.name).join(", ")}
          </small>
        )}
        <button type="button" disabled={removeMutation.isPending} onClick={() => removeMutation.mutate()}>
          Remove
        </button>
      </div>
      <span />
      <strong>{formatPeso(Number(bundle.subtotal))}</strong>
    </article>
  );
}
