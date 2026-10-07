import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/pk/Icon";
import PkDrawer from "@/components/pk/PkDrawer";
import { photos } from "@/components/pk/photos";
import { getRecipe, addRecipeToCart } from "@/services/api/recipes";
import { cartQueryKey } from "@/features/cart/useCart";
import {
  INGREDIENT_KIND_LABELS,
  formatBatch,
  formatQuantity,
  quantityStepFor,
} from "@/features/recipes/ingredientFormat";
import { useToastStore } from "@/stores/toastStore";
import { formatPeso } from "@/utils/currency";

export interface RecipeDetailDrawerProps {
  recipeId: number | null;
  /** The customer's selected market — ingredients are priced and bought there. */
  marketId: number | null;
  marketName: string | null;
  onChooseMarket: () => void;
  onClose: () => void;
}

/** The design's recipe drawer — ingredients priced at the selected market, steps, and "Add all ingredients". */
export default function RecipeDetailDrawer({
  recipeId,
  marketId,
  marketName,
  onChooseMarket,
  onClose,
}: RecipeDetailDrawerProps) {
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [excludedIds, setExcludedIds] = useState<Set<number>>(new Set());
  const showToast = useToastStore((state) => state.showToast);
  const queryClient = useQueryClient();

  const { data: recipe, isLoading, isError, refetch } = useQuery({
    queryKey: ["recipe", recipeId, marketId],
    queryFn: () => getRecipe(recipeId!, marketId ?? undefined),
    enabled: recipeId !== null,
  });

  // Reset to the recipe's natural batch size each time a different recipe is opened.
  useEffect(() => {
    if (recipe) setQuantity(Number(recipe.base_quantity));
    setExcludedIds(new Set());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipe?.id]);

  function toggleExcluded(ingredientId: number) {
    setExcludedIds((prev) => {
      const next = new Set(prev);
      if (next.has(ingredientId)) next.delete(ingredientId);
      else next.add(ingredientId);
      return next;
    });
  }

  const baseQuantity = recipe ? Number(recipe.base_quantity) : 0;
  const scale = baseQuantity > 0 ? quantity / baseQuantity : 1;

  // Ingredients the selected market doesn't sell are always left out of the cart —
  // the recipe is the same everywhere, only what's buyable differs per market.
  const ingredients = recipe?.ingredients ?? [];
  const priced = marketId !== null;
  const unavailableIds = new Set(
    priced ? ingredients.filter((i) => i.unit_price === null).map((i) => i.id) : [],
  );
  const isIncluded = (id: number) => !excludedIds.has(id) && !unavailableIds.has(id);
  const includedIngredients = ingredients.filter((ingredient) => isIncluded(ingredient.id));
  const estimatedTotal = includedIngredients.reduce(
    (sum, ingredient) =>
      sum + Number(ingredient.unit_price ?? 0) * Number(ingredient.quantity) * scale,
    0,
  );

  const addMutation = useMutation({
    mutationFn: () =>
      addRecipeToCart({
        recipe_id: recipe!.id,
        market_id: marketId!,
        quantity,
        excluded_ingredient_ids: ingredients
          .filter((ingredient) => !isIncluded(ingredient.id))
          .map((ingredient) => ingredient.id),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: cartQueryKey });
      showToast(`${recipe?.name ?? "Recipe"} ingredients added to your basket`, "success");
      onClose();
    },
    onError: (error) => {
      showToast(error instanceof Error ? error.message : "Could not add to cart.", "error");
    },
  });

  const quantitySettings = quantityStepFor(recipe?.pricing_unit ?? "serving");

  return (
    <PkDrawer
      isOpen={recipeId !== null}
      onClose={onClose}
      label={recipe?.name ?? "Recipe"}
      photo={recipe ? <img src={recipe.image ?? photos.vendor} alt={recipe.name} /> : undefined}
      action={
        recipe && (
          <>
            <div>
              <small>{priced ? `Ingredient bundle · ${marketName}` : "Ingredient bundle"}</small>
              <strong>{priced ? formatPeso(estimatedTotal) : "—"}</strong>
            </div>
            {priced ? (
              <button
                type="button"
                className="btn primary"
                disabled={includedIngredients.length === 0 || addMutation.isPending}
                onClick={() => addMutation.mutate()}
              >
                {addMutation.isPending ? "Adding…" : "Add all ingredients"} <Icon name="cart" size={18} />
              </button>
            ) : (
              <button type="button" className="btn primary" onClick={onChooseMarket}>
                Choose market <Icon name="bag" size={18} />
              </button>
            )}
          </>
        )
      }
    >
      {isLoading && <p>Loading…</p>}
      {isError && (
        <button type="button" className="btn primary" onClick={() => void refetch()}>
          Try again
        </button>
      )}
      {recipe && (
        <>
          <p className="kicker">
            {formatBatch(recipe.pricing_unit, recipe.base_quantity)}
            {recipe.recipe_type ? ` · ${recipe.recipe_type}` : ""}
          </p>
          <h2>{recipe.name}</h2>
          {recipe.description && <p>{recipe.description}</p>}

          <div className="quantity-row" style={{ marginTop: 18 }}>
            <div>
              <strong>How much are you cooking?</strong>
              <small>Ingredient amounts scale with this</small>
            </div>
            <div className="modal-quantity">
              <button
                type="button"
                aria-label="Decrease"
                onClick={() => setQuantity(Math.max(quantitySettings.min, quantity - quantitySettings.step))}
              >
                <Icon name="minus" size={16} />
              </button>
              <span>
                {formatQuantity(quantity)} {quantitySettings.label}
              </span>
              <button
                type="button"
                aria-label="Increase"
                onClick={() => setQuantity(quantity + quantitySettings.step)}
              >
                <Icon name="plus" size={16} />
              </button>
            </div>
          </div>

          <h3>Fresh ingredients</h3>
          <ul>
            {ingredients.map((ingredient) => {
              const unavailable = unavailableIds.has(ingredient.id);
              const included = isIncluded(ingredient.id);
              const scaledQty = Number(ingredient.quantity) * scale;
              return (
                <li key={ingredient.id} style={{ justifyContent: "space-between", opacity: included || !priced ? 1 : 0.55 }}>
                  <label style={{ display: "flex", gap: 9, cursor: unavailable ? "not-allowed" : "pointer" }}>
                    <input
                      type="checkbox"
                      checked={included}
                      disabled={unavailable}
                      onChange={() => toggleExcluded(ingredient.id)}
                      aria-label={`Include ${ingredient.name}`}
                      style={{ accentColor: "var(--teal)" }}
                    />
                    <span>
                      {ingredient.name} — {formatQuantity(scaledQty)} {ingredient.unit}
                      {ingredient.is_optional ? " (optional)" : ""}
                      <br />
                      <small style={{ color: unavailable ? "#b26a00" : "var(--muted)" }}>
                        {unavailable
                          ? `Not sold at ${marketName}`
                          : `${INGREDIENT_KIND_LABELS[ingredient.kind]}${ingredient.note ? ` · ${ingredient.note}` : ""}`}
                      </small>
                    </span>
                  </label>
                  {priced && !unavailable && (
                    <strong style={{ whiteSpace: "nowrap" }}>
                      {formatPeso(Number(ingredient.unit_price) * scaledQty)}
                    </strong>
                  )}
                </li>
              );
            })}
          </ul>

          {recipe.steps.length > 0 && (
            <>
              <h3>How to cook</h3>
              <ol>
                {recipe.steps.map((step, index) => (
                  <li key={index}>
                    <span>{index + 1}</span>
                    {step}
                  </li>
                ))}
              </ol>
            </>
          )}

          {recipe.tips && (
            <div className="paluto-note">
              <Icon name="sparkle" />
              <div>
                <strong>Chef&apos;s tip</strong>
                <p>{recipe.tips}</p>
              </div>
            </div>
          )}

          <div className="paluto-note" style={{ cursor: "pointer" }} onClick={() => navigate("/paluto")}>
            <Icon name="bag" />
            <div>
              <strong>Rather have it cooked?</strong>
              <p>Order from a Paluto stall in your market →</p>
            </div>
          </div>
        </>
      )}
    </PkDrawer>
  );
}
