import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Spinner } from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";
import {
  createAdminRecipe,
  deactivateAdminRecipe,
  getAdminRecipe,
  restoreAdminRecipe,
  updateAdminRecipe,
  updateAdminRecipeIngredients,
  type RecipeIngredientInput,
} from "@/services/api/adminRecipes";
import { listAdminItems } from "@/services/api/adminItems";
import {
  listAdminMarkets,
  listAdminRecipeTypes,
  listAdminUnits,
} from "@/services/api/adminLookups";
import { useToastStore } from "@/stores/toastStore";
import type { RecipeIngredientKind, RecipePricingUnit } from "@/types/adminRecipe";

const KIND_LABELS: Record<RecipeIngredientKind, string> = {
  meat: "Meat",
  vegetable: "Vegetable",
  condiment: "Condiment",
  spice: "Spice",
};

interface IngredientRow {
  key: string;
  item_id: number;
  item_name: string;
  kind: RecipeIngredientKind;
  quantity: string;
  unit_id: number | "";
  is_optional: boolean;
  note: string;
}

interface StepRow {
  key: string;
  text: string;
}

let rowKeySeq = 0;
function nextRowKey(): string {
  rowKeySeq += 1;
  return `row-${rowKeySeq}`;
}

export default function AdminRecipeForm() {
  const { recipeId } = useParams<{ recipeId: string }>();
  const isEditing = Boolean(recipeId);
  const id = recipeId ? Number(recipeId) : null;

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const showToast = useToastStore((state) => state.showToast);

  const { data: recipeTypes = [] } = useQuery({
    queryKey: ["adminRecipeTypesLookup"],
    queryFn: listAdminRecipeTypes,
  });
  const { data: units = [] } = useQuery({
    queryKey: ["adminUnits"],
    queryFn: listAdminUnits,
  });
  const { data: markets = [] } = useQuery({
    queryKey: ["adminMarkets"],
    queryFn: listAdminMarkets,
  });

  const {
    data: recipe,
    isLoading: recipeLoading,
    isError: recipeError,
    refetch: refetchRecipe,
  } = useQuery({
    queryKey: ["adminRecipe", id],
    queryFn: () => getAdminRecipe(id!),
    enabled: isEditing && id !== null,
  });

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [recipeTypeId, setRecipeTypeId] = useState<number | "">("");
  const [pricingUnit, setPricingUnit] = useState<RecipePricingUnit>("kg");
  const [baseQuantity, setBaseQuantity] = useState("1");
  const [image, setImage] = useState<File | null>(null);
  const [ingredients, setIngredients] = useState<IngredientRow[]>([]);
  const [steps, setSteps] = useState<StepRow[]>([]);
  const [tips, setTips] = useState("");
  const [hydrated, setHydrated] = useState(false);

  const KIND_ORDER: Record<RecipeIngredientKind, number> = {
    meat: 0,
    vegetable: 1,
    condiment: 2,
    spice: 3,
  };

  if (recipe && !hydrated) {
    setName(recipe.name);
    setDescription(recipe.description ?? "");
    setRecipeTypeId(recipe.recipe_type_id ?? "");
    setPricingUnit(recipe.pricing_unit);
    setBaseQuantity(recipe.base_quantity);
    setIngredients(
      recipe.ingredients
        .slice()
        .sort(
          (a, b) => KIND_ORDER[a.kind] - KIND_ORDER[b.kind] || a.sort_order - b.sort_order,
        )
        .map((ingredient) => ({
          key: nextRowKey(),
          item_id: ingredient.item_id,
          item_name: ingredient.item_name,
          kind: ingredient.kind,
          quantity: ingredient.quantity,
          unit_id: ingredient.unit_id,
          is_optional: ingredient.is_optional,
          note: ingredient.note ?? "",
        })),
    );
    setSteps(recipe.steps.map((text) => ({ key: nextRowKey(), text })));
    setTips(recipe.tips ?? "");
    setHydrated(true);
  }

  function addStep() {
    setSteps((rows) => [...rows, { key: nextRowKey(), text: "" }]);
  }

  function updateStep(key: string, text: string) {
    setSteps((rows) => rows.map((row) => (row.key === key ? { ...row, text } : row)));
  }

  function removeStep(key: string) {
    setSteps((rows) => rows.filter((row) => row.key !== key));
  }

  // Ingredient picker — simple debounced typeahead against the existing item catalog,
  // optionally scoped to items actually sold at one market so recipes are only built
  // from ingredients that are realistically available where they'll be cooked.
  const [itemSearch, setItemSearch] = useState("");
  const [debouncedItemSearch, setDebouncedItemSearch] = useState("");
  const [ingredientMarketId, setIngredientMarketId] = useState<number | "">("");

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedItemSearch(itemSearch.trim()), 300);
    return () => clearTimeout(timeout);
  }, [itemSearch]);

  const { data: itemResults, isFetching: itemsFetching } = useQuery({
    queryKey: ["adminItemSearch", debouncedItemSearch, ingredientMarketId],
    queryFn: () =>
      listAdminItems({
        search: debouncedItemSearch,
        status: "1",
        marketId: ingredientMarketId || undefined,
        page: 1,
      }),
    enabled: debouncedItemSearch.length > 1,
  });

  function addIngredient(item: { id: number; name: string; unit_id: number }) {
    setIngredients((rows) => [
      ...rows,
      {
        key: nextRowKey(),
        item_id: item.id,
        item_name: item.name,
        kind: "meat",
        quantity: "1",
        unit_id: item.unit_id,
        is_optional: false,
        note: "",
      },
    ]);
    setItemSearch("");
    setDebouncedItemSearch("");
  }

  function updateIngredient(key: string, patch: Partial<IngredientRow>) {
    setIngredients((rows) =>
      rows.map((row) => (row.key === key ? { ...row, ...patch } : row)),
    );
  }

  function removeIngredient(key: string) {
    setIngredients((rows) => rows.filter((row) => row.key !== key));
  }

  const createMutation = useMutation({
    mutationFn: () =>
      createAdminRecipe({
        name,
        description: description || undefined,
        steps: steps.map((row) => row.text.trim()).filter(Boolean),
        tips: tips || undefined,
        recipe_type_id: recipeTypeId ? Number(recipeTypeId) : undefined,
        pricing_unit: pricingUnit,
        base_quantity: Number(baseQuantity),
        image: image ?? undefined,
      }),
    onSuccess: (created) => {
      void queryClient.invalidateQueries({ queryKey: ["adminRecipes"] });
      showToast("Recipe created. Now add its ingredients.", "success");
      navigate(`/admin/recipes/${created.id}/edit`, { replace: true });
    },
    onError: (error) => {
      showToast(
        error instanceof Error ? error.message : "Could not create recipe.",
        "error",
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      updateAdminRecipe(id!, {
        name,
        description: description || undefined,
        steps: steps.map((row) => row.text.trim()).filter(Boolean),
        tips: tips || undefined,
        recipe_type_id: recipeTypeId ? Number(recipeTypeId) : undefined,
        pricing_unit: pricingUnit,
        base_quantity: Number(baseQuantity),
        image: image ?? undefined,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["adminRecipes"] });
      void queryClient.invalidateQueries({ queryKey: ["adminRecipe", id] });
      setImage(null);
      showToast("Recipe details saved.", "success");
    },
    onError: (error) => {
      showToast(
        error instanceof Error ? error.message : "Could not save recipe.",
        "error",
      );
    },
  });

  const saveIngredientsMutation = useMutation({
    mutationFn: () => {
      const payload: RecipeIngredientInput[] = ingredients.map((row, index) => ({
        item_id: row.item_id,
        kind: row.kind,
        quantity: Number(row.quantity),
        unit_id: Number(row.unit_id),
        is_optional: row.is_optional,
        note: row.note || undefined,
        sort_order: index,
      }));
      return updateAdminRecipeIngredients(id!, payload);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["adminRecipe", id] });
      showToast("Ingredients saved.", "success");
    },
    onError: (error) => {
      showToast(
        error instanceof Error ? error.message : "Could not save ingredients.",
        "error",
      );
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: () => deactivateAdminRecipe(id!),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ["adminRecipe", id] });
      void queryClient.invalidateQueries({ queryKey: ["adminRecipes"] });
      showToast(data.message, "success");
    },
    onError: (error) => {
      showToast(
        error instanceof Error ? error.message : "Could not deactivate recipe.",
        "error",
      );
    },
  });

  const restoreMutation = useMutation({
    mutationFn: () => restoreAdminRecipe(id!),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ["adminRecipe", id] });
      void queryClient.invalidateQueries({ queryKey: ["adminRecipes"] });
      showToast(data.message, "success");
    },
    onError: (error) => {
      showToast(
        error instanceof Error ? error.message : "Could not restore recipe.",
        "error",
      );
    },
  });

  function handleCreateSubmit(event: FormEvent) {
    event.preventDefault();
    createMutation.mutate();
  }

  const ingredientsInvalid = ingredients.some(
    (row) => !row.quantity || Number(row.quantity) <= 0 || !row.unit_id,
  );

  if (isEditing && recipeLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    );
  }

  if (isEditing && recipeError) {
    return <ErrorState onRetry={() => void refetchRecipe()} />;
  }

  return (
    <div className="flex max-w-2xl flex-col gap-8">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-lg font-semibold">{isEditing ? "Edit recipe" : "Add recipe"}</h1>
        {isEditing && recipe && (
          <span
            className={`text-xs font-semibold ${
              recipe.status ? "text-status-delivered" : "text-text-muted"
            }`}
          >
            {recipe.status ? "Active" : "Deactivated"}
          </span>
        )}
      </div>

      <form
        onSubmit={isEditing ? (e) => e.preventDefault() : handleCreateSubmit}
        className="flex flex-col gap-4"
      >
        <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
          Recipe details
        </h2>

        <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} required />

        <label className="flex flex-col gap-1.5 text-sm font-medium text-text">
          Description
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="rounded-lg border border-border bg-surface p-3 text-sm font-normal text-text focus:outline-none focus:ring-2 focus:ring-primary-300"
          />
        </label>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-text">
            Recipe type
            <select
              value={recipeTypeId}
              onChange={(e) => setRecipeTypeId(e.target.value ? Number(e.target.value) : "")}
              className="h-12 rounded-lg border border-border bg-surface px-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary-300"
            >
              <option value="">None</option>
              {recipeTypes.map((rt) => (
                <option key={rt.id} value={rt.id}>
                  {rt.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-medium text-text">
            Pricing unit
            <select
              value={pricingUnit}
              onChange={(e) => setPricingUnit(e.target.value as RecipePricingUnit)}
              required
              className="h-12 rounded-lg border border-border bg-surface px-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary-300"
            >
              <option value="kg">Per kg</option>
              <option value="serving">Per serving</option>
            </select>
          </label>

          <Input
            label={pricingUnit === "kg" ? "Base quantity (kg)" : "Base quantity (servings)"}
            type="number"
            min="0"
            step="0.01"
            value={baseQuantity}
            onChange={(e) => setBaseQuantity(e.target.value)}
            helperText="The quantity the ingredient list below is written for."
            required
          />
        </div>

        <label className="flex flex-col gap-1.5 text-sm font-medium text-text">
          {isEditing ? "Replace cover image (optional)" : "Cover image (optional)"}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImage(e.target.files?.[0] ?? null)}
            className="text-sm text-text-muted"
          />
        </label>

        {isEditing && recipe?.image_url && !image && (
          <img
            src={recipe.image_url}
            alt={recipe.name}
            className="h-32 w-32 rounded-card object-cover"
          />
        )}

        <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
          How to cook
        </h2>

        <div className="flex flex-col gap-2">
          {steps.length === 0 && (
            <p className="text-sm text-text-muted">
              No steps yet. Add steps to show a cooking guide to customers.
            </p>
          )}
          {steps.map((row, index) => (
            <div key={row.key} className="flex items-start gap-2">
              <span className="mt-2.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-50 text-xs font-bold text-primary-700">
                {index + 1}
              </span>
              <textarea
                value={row.text}
                onChange={(e) => updateStep(row.key, e.target.value)}
                rows={2}
                placeholder={`Step ${index + 1}`}
                className="flex-1 rounded-lg border border-border bg-surface p-2.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary-300"
              />
              <button
                type="button"
                onClick={() => removeStep(row.key)}
                className="mt-2 shrink-0 text-xs font-medium text-status-cancelled"
              >
                Remove
              </button>
            </div>
          ))}
          <Button type="button" variant="secondary" size="sm" onClick={addStep} className="self-start">
            Add step
          </Button>
        </div>

        <label className="flex flex-col gap-1.5 text-sm font-medium text-text">
          Chef's tip
          <textarea
            value={tips}
            onChange={(e) => setTips(e.target.value)}
            rows={2}
            placeholder="Optional cooking tip shown alongside the steps"
            className="rounded-lg border border-border bg-surface p-3 text-sm font-normal text-text focus:outline-none focus:ring-2 focus:ring-primary-300"
          />
        </label>

        {isEditing ? (
          <Button
            type="button"
            loading={updateMutation.isPending}
            onClick={() => updateMutation.mutate()}
            className="self-start"
          >
            Save details
          </Button>
        ) : (
          <Button type="submit" loading={createMutation.isPending} className="self-start">
            Create recipe
          </Button>
        )}
      </form>

      {isEditing && recipe && (
        <div className="flex flex-col gap-4 border-t border-border pt-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
            Ingredients
          </h2>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text" htmlFor="ingredient-market">
              Filter by market
            </label>
            <select
              id="ingredient-market"
              value={ingredientMarketId}
              onChange={(e) =>
                setIngredientMarketId(e.target.value ? Number(e.target.value) : "")
              }
              className="h-11 rounded-lg border border-border bg-surface px-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary-300"
            >
              <option value="">All markets</option>
              {markets.map((market) => (
                <option key={market.id} value={market.id}>
                  {market.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-text-muted">
              Only shows items sold at the selected market, so ingredients are ones this
              recipe can realistically source.
            </p>
          </div>

          <div className="relative flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text" htmlFor="ingredient-search">
              Add ingredient from catalog
            </label>
            <input
              id="ingredient-search"
              value={itemSearch}
              onChange={(e) => setItemSearch(e.target.value)}
              placeholder="Search items by name…"
              className="h-11 rounded-lg border border-border bg-surface px-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary-300"
            />
            {debouncedItemSearch.length > 1 && (
              <div className="absolute top-full z-10 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-border bg-surface shadow-lifted">
                {itemsFetching && (
                  <div className="flex justify-center p-3">
                    <Spinner />
                  </div>
                )}
                {!itemsFetching && itemResults && itemResults.data.length === 0 && (
                  <p className="p-3 text-sm text-text-muted">No matching items.</p>
                )}
                {!itemsFetching &&
                  itemResults?.data.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() =>
                        addIngredient({
                          id: item.id,
                          name: item.name,
                          unit_id: item.unit_id,
                        })
                      }
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-background"
                    >
                      <span className="font-medium text-text">{item.name}</span>
                      {item.category && (
                        <span className="text-xs text-text-muted">{item.category}</span>
                      )}
                    </button>
                  ))}
              </div>
            )}
          </div>

          {ingredients.length === 0 ? (
            <p className="text-sm text-text-muted">
              No ingredients yet. Search the catalog above to add some.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-card border border-border">
              <table className="w-full text-left text-sm">
                <thead className="bg-background text-xs uppercase text-text-muted">
                  <tr>
                    <th className="px-3 py-2">Item</th>
                    <th className="px-3 py-2">Category</th>
                    <th className="px-3 py-2">Quantity</th>
                    <th className="px-3 py-2">Unit</th>
                    <th className="px-3 py-2">Optional</th>
                    <th className="px-3 py-2">Note</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {ingredients.map((row) => (
                    <tr key={row.key}>
                      <td className="px-3 py-2 font-medium text-text">{row.item_name}</td>
                      <td className="px-3 py-2">
                        <select
                          value={row.kind}
                          onChange={(e) =>
                            updateIngredient(row.key, {
                              kind: e.target.value as RecipeIngredientKind,
                            })
                          }
                          className="h-9 rounded-lg border border-border bg-surface px-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                        >
                          {(Object.keys(KIND_LABELS) as RecipeIngredientKind[]).map((kind) => (
                            <option key={kind} value={kind}>
                              {KIND_LABELS[kind]}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={row.quantity}
                          onChange={(e) =>
                            updateIngredient(row.key, { quantity: e.target.value })
                          }
                          className="h-9 w-24 rounded-lg border border-border bg-surface px-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                        />
                      </td>
                      <td className="px-3 py-2 text-text-muted">
                        {/* Locked to the item's own unit — price is always computed as
                            quantity × the item's live per-unit price, so letting this
                            diverge from the item's actual selling unit (e.g. picking "g"
                            for a per-kg item) would silently miscompute the ingredient
                            cost with no conversion applied. */}
                        {units.find((u) => u.id === row.unit_id)?.short_name ?? "—"}
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={row.is_optional}
                          onChange={(e) =>
                            updateIngredient(row.key, { is_optional: e.target.checked })
                          }
                          className="h-4 w-4 rounded border-border"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={row.note}
                          onChange={(e) => updateIngredient(row.key, { note: e.target.value })}
                          placeholder="Optional note"
                          className="h-9 w-32 rounded-lg border border-border bg-surface px-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          onClick={() => removeIngredient(row.key)}
                          className="text-xs font-medium text-status-cancelled"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <Button
            type="button"
            loading={saveIngredientsMutation.isPending}
            disabled={ingredients.length === 0 || ingredientsInvalid}
            onClick={() => saveIngredientsMutation.mutate()}
            className="self-start"
          >
            Save ingredients
          </Button>
        </div>
      )}

      {isEditing && recipe && (
        <div className="flex flex-col gap-2 border-t border-border pt-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
            Danger zone
          </h2>
          {recipe.status ? (
            <Button
              type="button"
              variant="danger"
              size="sm"
              className="self-start"
              loading={deactivateMutation.isPending}
              onClick={() => deactivateMutation.mutate()}
            >
              Deactivate recipe
            </Button>
          ) : (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="self-start"
              loading={restoreMutation.isPending}
              onClick={() => restoreMutation.mutate()}
            >
              Restore recipe
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
