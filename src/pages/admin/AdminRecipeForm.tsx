import { kindFromCategory } from "@/features/recipes/ingredientFormat";
import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import AdminStepper, { AdminFormHeader } from "@/components/admin/AdminStepper";
import useWizardStep from "@/hooks/useWizardStep";
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
import { listAdminRecipeTypes, listAdminUnits } from "@/services/api/adminLookups";
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

/** The wizard: details → ingredients → how to cook → review. */
const WIZARD_STEPS = [
  { id: 1, title: "Details", hint: "Name, type, pricing, photo" },
  { id: 2, title: "Ingredients", hint: "What to buy, per base quantity" },
  { id: 3, title: "How to cook", hint: "Steps and chef's tip" },
  { id: 4, title: "Review", hint: "Check and publish" },
] as const;

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
  // A new recipe has no id yet, so ingredients/steps unlock only after step 1 saves it.
  const isStepLocked = (stepId: number) => !isEditing && stepId > 1;
  const [step, goToStep] = useWizardStep(WIZARD_STEPS.length, isStepLocked);
  const showToast = useToastStore((state) => state.showToast);

  const { data: recipeTypes = [] } = useQuery({
    queryKey: ["adminRecipeTypesLookup"],
    queryFn: listAdminRecipeTypes,
  });
  const { data: units = [] } = useQuery({
    queryKey: ["adminUnits"],
    queryFn: listAdminUnits,
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
          (a, b) =>
            KIND_ORDER[a.kind] - KIND_ORDER[b.kind] || a.sort_order - b.sort_order,
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

  // Ingredient picker — debounced typeahead over the whole item catalog. Recipes
  // belong to every market; customers see prices and availability at their own.
  const [itemSearch, setItemSearch] = useState("");
  const [debouncedItemSearch, setDebouncedItemSearch] = useState("");

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedItemSearch(itemSearch.trim()), 300);
    return () => clearTimeout(timeout);
  }, [itemSearch]);

  const { data: itemResults, isFetching: itemsFetching } = useQuery({
    queryKey: ["adminItemSearch", debouncedItemSearch, "catalog"],
    queryFn: () =>
      listAdminItems({
        search: debouncedItemSearch,
        status: "1",
        catalog: true,
        page: 1,
      }),
    enabled: debouncedItemSearch.length > 1,
  });

  function addIngredient(item: {
    id: number;
    name: string;
    unit_id: number;
    category: string | null;
  }) {
    setIngredients((rows) => [
      ...rows,
      {
        key: nextRowKey(),
        item_id: item.id,
        item_name: item.name,
        kind: kindFromCategory(item.category),
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
      navigate(`/admin/recipes/${created.id}/edit?step=2`, { replace: true });
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
      showToast("Saved.", "success");
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

  function handleDetailsSubmit(event: FormEvent) {
    event.preventDefault();
    if (isEditing) {
      updateMutation.mutate(undefined, { onSuccess: () => goToStep(2) });
    } else {
      createMutation.mutate();
    }
  }

  function handleIngredientsContinue() {
    if (ingredients.length === 0) {
      goToStep(3);
      return;
    }
    saveIngredientsMutation.mutate(undefined, { onSuccess: () => goToStep(3) });
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

  const stepDone: Record<number, boolean> = {
    1: Boolean(recipe),
    2: Boolean(recipe && recipe.ingredients.length > 0),
    3: Boolean(recipe && recipe.steps.length > 0),
    4: Boolean(recipe?.status),
  };
  const typeName = recipeTypes.find((rt) => rt.id === recipeTypeId)?.name;

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <AdminFormHeader
        title={isEditing ? recipe?.name || "Edit recipe" : "New recipe"}
        onBack={() => navigate("/admin/recipes")}
        backLabel="Back to recipes"
        status={isEditing && recipe ? recipe.status : undefined}
      />

      <AdminStepper
        label="Recipe steps"
        steps={WIZARD_STEPS}
        current={step}
        done={stepDone}
        isLocked={isStepLocked}
        onSelect={goToStep}
      />

      {step === 1 && (
        <form
          onSubmit={handleDetailsSubmit}
          className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)] p-5"
        >
          <h2 className="text-base font-semibold text-text">Step 1 · Recipe details</h2>
          <Input
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

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
                onChange={(e) =>
                  setRecipeTypeId(e.target.value ? Number(e.target.value) : "")
                }
                className="h-12 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100"
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
                className="h-12 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100"
              >
                <option value="kg">Per kg</option>
                <option value="serving">Per serving</option>
              </select>
            </label>

            <Input
              label={
                pricingUnit === "kg" ? "Base quantity (kg)" : "Base quantity (servings)"
              }
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

          <div className="flex justify-end border-t border-border pt-4">
            <Button
              type="submit"
              loading={createMutation.isPending || updateMutation.isPending}
            >
              {isEditing ? "Save & continue" : "Create & add ingredients"} →
            </Button>
          </div>
        </form>
      )}

      {step === 2 && isEditing && recipe && (
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)] p-5">
          <div>
            <h2 className="text-base font-semibold text-text">Step 2 · Ingredients</h2>
            <p className="text-sm text-text-muted">
              Quantities are for {baseQuantity || "1"}{" "}
              {pricingUnit === "kg" ? "kg" : "serving(s)"} — customers scale from there,
              priced at their own selected market (prices differ per market).
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
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100"
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
                          category: item.category,
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
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-100 bg-slate-50/70 text-[11px] uppercase tracking-wide text-slate-400">
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
                        <span
                          title="Set from the item's category"
                          className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700"
                        >
                          {KIND_LABELS[row.kind]}
                        </span>
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
                          onChange={(e) =>
                            updateIngredient(row.key, { note: e.target.value })
                          }
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

          <div className="flex justify-between gap-2 border-t border-border pt-4">
            <Button type="button" variant="secondary" onClick={() => goToStep(1)}>
              ← Back
            </Button>
            <Button
              type="button"
              loading={saveIngredientsMutation.isPending}
              disabled={ingredientsInvalid}
              onClick={handleIngredientsContinue}
            >
              {ingredients.length === 0 ? "Skip for now →" : "Save & continue →"}
            </Button>
          </div>
        </div>
      )}

      {step === 3 && isEditing && recipe && (
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)] p-5">
          <div>
            <h2 className="text-base font-semibold text-text">Step 3 · How to cook</h2>
            <p className="text-sm text-text-muted">One instruction per step, in order.</p>
          </div>

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
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={addStep}
              className="self-start"
            >
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

          <div className="flex justify-between gap-2 border-t border-border pt-4">
            <Button type="button" variant="secondary" onClick={() => goToStep(2)}>
              ← Back
            </Button>
            <Button
              type="button"
              loading={updateMutation.isPending}
              onClick={() =>
                updateMutation.mutate(undefined, { onSuccess: () => goToStep(4) })
              }
            >
              Save & review →
            </Button>
          </div>
        </div>
      )}

      {step === 4 && isEditing && recipe && (
        <div className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)] p-5">
          <h2 className="text-base font-semibold text-text">Step 4 · Review</h2>

          <div className="flex gap-4">
            {recipe.image_url ? (
              <img
                src={recipe.image_url}
                alt={recipe.name}
                className="h-24 w-24 shrink-0 rounded-card object-cover"
              />
            ) : (
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-card bg-background text-xs text-text-muted">
                No photo
              </div>
            )}
            <div className="flex flex-col gap-1">
              <p className="font-semibold text-text">{recipe.name}</p>
              <p className="text-sm text-text-muted">
                {typeName ?? "No type"} · priced per{" "}
                {recipe.pricing_unit === "kg" ? "kg" : "serving"} · base{" "}
                {Number(recipe.base_quantity)}
              </p>
              {recipe.description && (
                <p className="text-sm text-text">{recipe.description}</p>
              )}
            </div>
          </div>

          <ul className="flex flex-col gap-2 text-sm">
            {[
              {
                ok: Boolean(recipe.image_url),
                label: "Cover photo",
                fix: 1,
              },
              {
                ok: recipe.ingredients.length > 0,
                label: `${recipe.ingredients.length} ingredient${recipe.ingredients.length === 1 ? "" : "s"}`,
                fix: 2,
              },
              {
                ok: recipe.steps.length > 0,
                label: `${recipe.steps.length} cooking step${recipe.steps.length === 1 ? "" : "s"}`,
                fix: 3,
              },
            ].map((check) => (
              <li
                key={check.label}
                className="flex items-center justify-between gap-3 rounded-lg bg-background px-3 py-2"
              >
                <span className={check.ok ? "text-text" : "text-status-cancelled"}>
                  {check.ok ? "✓" : "!"} {check.label}
                  {!check.ok && " — missing"}
                </span>
                <button
                  type="button"
                  onClick={() => goToStep(check.fix)}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Edit
                </button>
              </li>
            ))}
          </ul>

          {recipe.ingredients.length > 0 && (
            <div>
              <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-text-muted">
                Buy list
              </h3>
              <p className="text-sm text-text">
                {recipe.ingredients
                  .map(
                    (ingredient) =>
                      `${Number(ingredient.quantity)} ${units.find((u) => u.id === ingredient.unit_id)?.short_name ?? ""} ${ingredient.item_name}${ingredient.is_optional ? " (optional)" : ""}`,
                  )
                  .join(" · ")}
              </p>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
            <Button type="button" variant="secondary" onClick={() => goToStep(3)}>
              ← Back
            </Button>
            <div className="flex gap-2">
              {recipe.status ? (
                <Button
                  type="button"
                  variant="danger"
                  loading={deactivateMutation.isPending}
                  onClick={() => deactivateMutation.mutate()}
                >
                  Deactivate
                </Button>
              ) : (
                <Button
                  type="button"
                  loading={restoreMutation.isPending}
                  onClick={() => restoreMutation.mutate()}
                >
                  Publish (restore)
                </Button>
              )}
              <Button type="button" onClick={() => navigate("/admin/recipes")}>
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
