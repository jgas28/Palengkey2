import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ChefHat, Clock, ShoppingCart, BookOpen } from "lucide-react";
import Drawer from "@/components/ui/Drawer";
import PriceDisplay from "@/components/ui/PriceDisplay";
import QuantitySelector from "@/components/ui/QuantitySelector";
import Button from "@/components/ui/Button";
import { Spinner } from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";
import { getRecipe, addRecipeToCart } from "@/services/api/paluto";
import { cartQueryKey } from "@/features/cart/useCart";
import { useToastStore } from "@/stores/toastStore";
import { formatPeso } from "@/utils/currency";
import type { PalutoStall, RecipeIngredient } from "@/types/paluto";

const KIND_LABELS: Record<RecipeIngredient["kind"], string> = {
  meat: "Meat",
  vegetable: "Vegetable",
  condiment: "Condiment",
  spice: "Spice",
};

export interface RecipeDetailDrawerProps {
  recipeId: number | null;
  marketId: number;
  onClose: () => void;
}

/** Trims a scaled ingredient/quantity value to at most 2 decimals for display. */
function formatQuantity(value: number): string {
  return Number(value.toFixed(2)).toString();
}

/** Mirrors the backend's round(max(rate * quantity, minimum_fee ?? 0), 2) exactly
 * (CheckoutController) so the pre-add preview matches the cart total after adding. */
function computeCookingFee(stall: PalutoStall, quantity: number): number {
  const rateFee = Number(stall.rate) * quantity;
  const fee = stall.minimum_fee !== null ? Math.max(rateFee, Number(stall.minimum_fee)) : rateFee;
  return Math.round(fee * 100) / 100;
}

type Mode = "raw" | "cook" | "stall";

export default function RecipeDetailDrawer({
  recipeId,
  marketId,
  onClose,
}: RecipeDetailDrawerProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedStallId, setSelectedStallId] = useState<number | null>(null);
  const [mode, setMode] = useState<Mode>("raw");
  const [excludedIds, setExcludedIds] = useState<Set<number>>(new Set());
  const showToast = useToastStore((state) => state.showToast);
  const queryClient = useQueryClient();

  const {
    data: recipe,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["recipe", recipeId, marketId],
    queryFn: () => getRecipe(recipeId!, marketId),
    enabled: recipeId !== null,
  });

  // Reset the scaling quantity to the recipe's natural batch size each time a
  // different recipe is opened — keyed on id, not the `recipe` object, so a
  // background refetch that changes the object reference (e.g. stall data
  // updating) doesn't silently wipe out a quantity the customer already chose.
  useEffect(() => {
    if (recipe) setQuantity(Number(recipe.base_quantity));
    setMode("raw");
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

  const selectedStall = useMemo(
    () => recipe?.stalls.find((stall) => stall.id === selectedStallId) ?? null,
    [recipe, selectedStallId],
  );

  const cookingFee = selectedStall ? computeCookingFee(selectedStall, quantity) : 0;

  const addMutation = useMutation({
    mutationFn: (stallId: number | null) =>
      addRecipeToCart({
        recipe_id: recipe!.id,
        market_id: marketId,
        quantity,
        paluto_stall_id: stallId ?? undefined,
        excluded_ingredient_ids: stallId ? undefined : Array.from(excludedIds),
      }),
    onSuccess: (_, stallId) => {
      void queryClient.invalidateQueries({ queryKey: cartQueryKey });
      showToast(
        stallId
          ? "Added to cart — paluto sa stall"
          : "Added to cart — ingredients only",
        "success",
      );
      handleClose();
    },
    onError: (error) => {
      showToast(
        error instanceof Error ? error.message : "Could not add to cart.",
        "error",
      );
    },
  });

  function handleClose() {
    setQuantity(1);
    setSelectedStallId(null);
    setMode("raw");
    setExcludedIds(new Set());
    onClose();
  }

  function handleAdd(stallId: number | null) {
    addMutation.mutate(stallId);
  }

  const quantityStep = recipe?.pricing_unit === "kg" ? 0.25 : 1;
  const quantityMin = recipe?.pricing_unit === "kg" ? 0.25 : 1;
  const unitLabel = recipe?.pricing_unit === "kg" ? "kg" : "serving(s)";

  const isAddingIngredientsOnly = addMutation.isPending && addMutation.variables === null;
  const isAddingWithStall =
    addMutation.isPending && typeof addMutation.variables === "number";

  return (
    <Drawer
      isOpen={recipeId !== null}
      onClose={handleClose}
      side="bottom"
      title={recipe?.name}
    >
      {isLoading && (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      )}

      {isError && <ErrorState onRetry={() => void refetch()} />}

      {recipe && (
        <div className="flex flex-col gap-4">
          {recipe.image && (
            <img
              src={recipe.image}
              alt={recipe.name}
              className="aspect-square w-full rounded-2xl object-cover"
            />
          )}

          {recipe.recipe_type && (
            <span className="self-start rounded-full bg-[#E8F7F7] px-2.5 py-1 text-xs font-semibold text-[#0097A7]">
              {recipe.recipe_type}
            </span>
          )}

          {recipe.description && (
            <p className="text-sm text-[#66777C]">{recipe.description}</p>
          )}

          <div className="flex gap-1 rounded-xl bg-[#F7FAFA] p-1">
            <button
              type="button"
              onClick={() => setMode("raw")}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all ${
                mode === "raw" ? "bg-white text-[#0097A7] shadow-sm" : "text-[#66777C]"
              }`}
            >
              <ShoppingCart size={14} aria-hidden="true" /> Buy Raw
            </button>
            <button
              type="button"
              onClick={() => recipe.steps.length > 0 && setMode("cook")}
              disabled={recipe.steps.length === 0}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-40 ${
                mode === "cook" ? "bg-white text-[#0097A7] shadow-sm" : "text-[#66777C]"
              }`}
            >
              <BookOpen size={14} aria-hidden="true" /> How to Cook
            </button>
            <button
              type="button"
              onClick={() => setMode("stall")}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all ${
                mode === "stall" ? "bg-white text-[#0097A7] shadow-sm" : "text-[#66777C]"
              }`}
            >
              <ChefHat size={14} aria-hidden="true" /> Cook for Me
            </button>
          </div>

          {mode === "raw" && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between rounded-2xl border border-[#DDE9EA] bg-[#F7FAFA] p-3">
                <span className="text-sm font-semibold text-[#203238]">
                  Quantity ({unitLabel})
                </span>
                <QuantitySelector
                  value={quantity}
                  onChange={setQuantity}
                  min={quantityMin}
                  step={quantityStep}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-[#203238]">Ingredients</span>
                  <span className="text-xs text-[#66777C]">Uncheck what you don't need</span>
                </div>
                <ul className="flex flex-col divide-y divide-[#DDE9EA] rounded-2xl border border-[#DDE9EA] bg-white px-3">
                  {recipe.ingredients.map((ingredient) => {
                    const checked = !excludedIds.has(ingredient.id);
                    return (
                      <li key={ingredient.id} className="flex items-center gap-3 py-2.5">
                        <button
                          type="button"
                          role="checkbox"
                          aria-checked={checked}
                          aria-label={`Include ${ingredient.name}`}
                          onClick={() => toggleExcluded(ingredient.id)}
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                            checked
                              ? "border-[#0097A7] bg-[#0097A7] text-white"
                              : "border-[#DDE9EA] bg-white"
                          }`}
                        >
                          {checked && <Check size={13} strokeWidth={3} aria-hidden="true" />}
                        </button>
                        <div className="min-w-0 flex-1">
                          <span
                            className={`block text-sm ${checked ? "text-[#203238]" : "text-[#66777C] line-through"}`}
                          >
                            {ingredient.name}
                            <span className="ml-1.5 text-xs font-medium text-[#66777C]">
                              ({KIND_LABELS[ingredient.kind]})
                            </span>
                            {ingredient.is_optional && (
                              <span className="ml-1.5 text-xs font-medium text-[#66777C]">
                                (optional)
                              </span>
                            )}
                          </span>
                          {ingredient.note && (
                            <span className="block text-xs italic text-[#66777C]">
                              {ingredient.note}
                            </span>
                          )}
                        </div>
                        <span className="shrink-0 text-sm font-semibold text-[#66777C]">
                          {formatQuantity(Number(ingredient.quantity) * scale)} {ingredient.unit}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <Button
                variant="secondary"
                fullWidth
                loading={isAddingIngredientsOnly}
                disabled={
                  (addMutation.isPending && !isAddingIngredientsOnly) ||
                  excludedIds.size === recipe.ingredients.length
                }
                onClick={() => handleAdd(null)}
              >
                Get ingredients only
              </Button>
            </div>
          )}

          {mode === "cook" && recipe.steps.length > 0 && (
            <div className="flex flex-col gap-4">
              <ol className="flex flex-col gap-3">
                {recipe.steps.map((step, index) => (
                  <li key={index} className="flex gap-3">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0097A7] text-xs font-bold text-white">
                      {index + 1}
                    </span>
                    <p className="text-sm leading-relaxed text-[#203238]">{step}</p>
                  </li>
                ))}
              </ol>

              {recipe.tips && (
                <div className="flex gap-2.5 rounded-2xl border border-[#FFF9F0] bg-[#FFF9F0] p-3">
                  <ChefHat size={16} className="mt-0.5 shrink-0 text-[#B8860B]" aria-hidden="true" />
                  <div>
                    <p className="mb-0.5 text-xs font-bold text-[#B8860B]">Chef's Tip</p>
                    <p className="text-xs leading-relaxed text-[#B8860B]/80">{recipe.tips}</p>
                  </div>
                </div>
              )}

              <Button variant="secondary" fullWidth onClick={() => setMode("raw")}>
                Order ingredients to cook this
              </Button>
            </div>
          )}

          {mode === "stall" && (
            <div className="flex flex-col gap-4">
              {recipe.stalls.length === 0 ? (
                <p className="rounded-2xl bg-[#F7FAFA] p-3 text-sm text-[#66777C]">
                  No stalls are cooking this recipe in your market right now. You can still
                  get the raw ingredients delivered.
                </p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {recipe.stalls.map((stall) => {
                    const isSelected = stall.id === selectedStallId;
                    const fee = computeCookingFee(stall, quantity);
                    return (
                      <li key={stall.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedStallId(isSelected ? null : stall.id)}
                          className={`flex w-full items-start justify-between gap-3 rounded-2xl border p-3.5 text-left transition-colors ${
                            isSelected
                              ? "border-[#0097A7] bg-[#E8F7F7]"
                              : "border-[#DDE9EA] bg-white md:hover:border-[#0097A7]/40"
                          }`}
                        >
                          <span className="flex flex-col gap-0.5">
                            <span className="font-semibold text-[#203238]">{stall.name}</span>
                            {stall.prep_time_minutes !== null && (
                              <span className="flex items-center gap-1 text-xs text-[#66777C]">
                                <Clock size={12} aria-hidden="true" />
                                ~{stall.prep_time_minutes} min prep
                              </span>
                            )}
                          </span>
                          <PriceDisplay amount={fee} size="sm" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}

              {selectedStall && selectedStall.provided_ingredient_ids.length > 0 && (
                <div className="flex flex-col gap-1.5 rounded-2xl border border-[#DDE9EA] bg-[#F7FAFA] p-3">
                  <p className="text-xs font-semibold text-[#203238]">
                    Already included by {selectedStall.name}
                  </p>
                  <p className="text-xs leading-relaxed text-[#66777C]">
                    {recipe.ingredients
                      .filter((ingredient) =>
                        selectedStall.provided_ingredient_ids.includes(ingredient.id),
                      )
                      .map((ingredient) => ingredient.name)
                      .join(", ")}{" "}
                    — you won't be charged for these separately.
                  </p>
                </div>
              )}

              <Button
                variant="solid"
                fullWidth
                disabled={!selectedStallId || (addMutation.isPending && !isAddingWithStall)}
                loading={isAddingWithStall}
                onClick={() => handleAdd(selectedStallId)}
              >
                {selectedStall
                  ? `Paluto at ${selectedStall.name} — +${formatPeso(cookingFee)} fee`
                  : "Choose a stall to have it cooked"}
              </Button>
            </div>
          )}
        </div>
      )}
    </Drawer>
  );
}
