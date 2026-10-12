import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { ImagePlus } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Spinner } from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";
import AdminStepper, {
  AdminFormHeader,
  AdminStepCard,
} from "@/components/admin/AdminStepper";
import useWizardStep from "@/hooks/useWizardStep";
import DishIngredientsEditor from "@/features/admin/paluto/DishIngredientsEditor";
import {
  hasInvalidQuantity,
  isBlockingRow,
  rowsFromDish,
  rowsFromRecipe,
  toIngredientInputs,
  type IngredientRow,
} from "@/features/admin/paluto/dishIngredientRows";
import {
  createAdminPalutoDish,
  deactivateAdminPalutoDish,
  getAdminPalutoDish,
  listAdminPalutoDishes,
  restoreAdminPalutoDish,
  updateAdminPalutoDish,
  updateAdminPalutoDishIngredients,
  type PalutoDishFormPayload,
} from "@/services/api/adminPalutoDishes";
import { getAdminRecipe, listAdminRecipes } from "@/services/api/adminRecipes";
import { listAdminRecipeTypes } from "@/services/api/adminLookups";
import { useToastStore } from "@/stores/toastStore";
import type { RecipePricingUnit } from "@/types/adminRecipe";

const selectClass =
  "h-12 rounded-lg border border-border bg-surface px-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary-300";

const WIZARD_STEPS = [
  { id: 1, title: "Dish", hint: "Name, photo, type" },
  { id: 2, title: "Cooking fee", hint: "Sold per, batch, fee" },
  { id: 3, title: "Items to buy", hint: "What customers pay for at the market" },
  { id: 4, title: "Review", hint: "Check and put on the menu" },
] as const;

/** Dish details, cooking fee and the items to buy — a step-by-step wizard. */
export default function AdminPalutoDishForm() {
  const { stallId, dishId } = useParams<{ stallId: string; dishId: string }>();
  const stall = Number(stallId);
  const id = dishId ? Number(dishId) : null;
  const isEditing = id !== null;

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const showToast = useToastStore((state) => state.showToast);

  const { data: recipeTypes = [] } = useQuery({
    queryKey: ["adminRecipeTypesLookup"],
    queryFn: listAdminRecipeTypes,
  });

  // The stall's market decides which items can be bought and at what price.
  const { data: stallMenu } = useQuery({
    queryKey: ["adminPalutoDishes", stall],
    queryFn: () => listAdminPalutoDishes(stall),
    enabled: Number.isFinite(stall),
  });

  const {
    data: dish,
    isLoading: dishLoading,
    isError: dishError,
    refetch: refetchDish,
  } = useQuery({
    queryKey: ["adminPalutoDish", id],
    queryFn: () => getAdminPalutoDish(id!),
    enabled: isEditing,
  });

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [recipeTypeId, setRecipeTypeId] = useState<number | "">("");
  const [pricingUnit, setPricingUnit] = useState<RecipePricingUnit>("kg");
  const [baseQuantity, setBaseQuantity] = useState("1");
  const [rate, setRate] = useState("");
  const [minimumFee, setMinimumFee] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [rows, setRows] = useState<IngredientRow[]>([]);
  const [rowsDirty, setRowsDirty] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  if (dish && !hydrated) {
    setName(dish.name);
    setDescription(dish.description ?? "");
    setRecipeTypeId(dish.recipe_type_id ?? "");
    setPricingUnit(dish.pricing_unit);
    setBaseQuantity(dish.base_quantity);
    setRate(dish.rate);
    setMinimumFee(dish.minimum_fee ?? "");
    setRows(rowsFromDish(dish));
    setHydrated(true);
  }

  useEffect(() => {
    if (!image) {
      setImagePreview(null);
      return;
    }
    const url = URL.createObjectURL(image);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  function changeRows(next: IngredientRow[]) {
    setRows(next);
    setRowsDirty(true);
  }

  // "Start from a recipe" (create only) — copies a catalog recipe's details and items
  // into this form once; the admin trims it to what the stall actually needs bought.
  const [recipeSearch, setRecipeSearch] = useState("");
  const [debouncedRecipeSearch, setDebouncedRecipeSearch] = useState("");
  const [fromRecipe, setFromRecipe] = useState<{
    id: number;
    name: string;
    imageUrl: string | null;
  } | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedRecipeSearch(recipeSearch.trim()), 300);
    return () => clearTimeout(timeout);
  }, [recipeSearch]);

  const { data: recipeResults, isFetching: recipesFetching } = useQuery({
    queryKey: ["adminRecipePicker", debouncedRecipeSearch],
    queryFn: () =>
      listAdminRecipes({ search: debouncedRecipeSearch, status: "1", page: 1 }),
    enabled: !isEditing && debouncedRecipeSearch.length > 1,
  });

  const pickRecipeMutation = useMutation({
    mutationFn: getAdminRecipe,
    onSuccess: (recipe) => {
      setFromRecipe({ id: recipe.id, name: recipe.name, imageUrl: recipe.image_url });
      setName(recipe.name);
      setDescription(recipe.description ?? "");
      setRecipeTypeId(recipe.recipe_type_id ?? "");
      setPricingUnit(recipe.pricing_unit);
      setBaseQuantity(recipe.base_quantity);
      setRows(rowsFromRecipe(recipe.ingredients));
      setRecipeSearch("");
      setDebouncedRecipeSearch("");
    },
    onError: () => showToast("Could not load that recipe.", "error"),
  });

  function detailsPayload(): PalutoDishFormPayload {
    return {
      name,
      description: description || undefined,
      recipe_type_id: recipeTypeId ? Number(recipeTypeId) : undefined,
      pricing_unit: pricingUnit,
      base_quantity: Number(baseQuantity),
      rate: Number(rate),
      minimum_fee: minimumFee === "" ? null : Number(minimumFee),
      image: image ?? undefined,
    };
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!isEditing) {
        return createAdminPalutoDish(stall, {
          ...detailsPayload(),
          from_recipe_id: fromRecipe?.id,
          ingredients: toIngredientInputs(rows),
        });
      }
      const saved = await updateAdminPalutoDish(id, detailsPayload());
      return rowsDirty
        ? updateAdminPalutoDishIngredients(id, toIngredientInputs(rows))
        : saved;
    },
    onSuccess: (saved) => {
      queryClient.setQueryData(["adminPalutoDish", saved.id], saved);
      void queryClient.invalidateQueries({ queryKey: ["adminPalutoDishes", stall] });
      setImage(null);
      setRows(rowsFromDish(saved));
      setRowsDirty(false);
      if (isEditing) {
        showToast("Dish saved.", "success");
      } else {
        showToast("Dish added to the menu.", "success");
        navigate(`/admin/paluto-stalls/${stall}/dishes/${saved.id}/edit?step=4`, {
          replace: true,
        });
      }
    },
    onError: (error) => {
      showToast(error instanceof Error ? error.message : "Could not save dish.", "error");
    },
  });

  const statusMutation = useMutation({
    mutationFn: (activate: boolean) =>
      activate ? restoreAdminPalutoDish(id!) : deactivateAdminPalutoDish(id!),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ["adminPalutoDish", id] });
      void queryClient.invalidateQueries({ queryKey: ["adminPalutoDishes", stall] });
      showToast(data.message, "success");
    },
    onError: (error) => {
      showToast(
        error instanceof Error ? error.message : "Could not update dish.",
        "error",
      );
    },
  });

  // A new dish is created at Review; each step must be valid before the next unlocks.
  const detailsValid = Boolean(name.trim());
  const feeValid = Number(baseQuantity) > 0 && rate !== "" && Number(rate) >= 0;
  const isStepLocked = (stepId: number) =>
    !isEditing && ((stepId > 1 && !detailsValid) || (stepId > 2 && !feeValid));
  const [step, goToStep] = useWizardStep(WIZARD_STEPS.length, isStepLocked);

  function continueFrom(current: number) {
    if (current === 1 && !detailsValid)
      return showToast("Give the dish a name.", "error");
    if (current === 2 && !feeValid)
      return showToast("Enter the batch size and cooking fee.", "error");
    if (isEditing) {
      saveMutation.mutate(undefined, { onSuccess: () => goToStep(current + 1) });
      return;
    }
    goToStep(current + 1);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (step < 4) continueFrom(step);
    else saveMutation.mutate();
  }

  if (isEditing && dishLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    );
  }

  if (isEditing && dishError) {
    return <ErrorState onRetry={() => void refetchDish()} />;
  }

  const marketId = dish?.market_id ?? stallMenu?.stall.market_id;
  const marketName = dish?.market_name ?? stallMenu?.stall.market_name ?? null;
  const stallName = dish?.stall_name ?? stallMenu?.stall.name;
  const currentImage = imagePreview ?? dish?.image_url ?? fromRecipe?.imageUrl ?? null;
  const batchLabel = `${Number(baseQuantity) || 0} ${pricingUnit === "kg" ? "kg" : "serving(s)"}`;
  const rowsInvalid = hasInvalidQuantity(rows) || rows.some(isBlockingRow);

  const typeName = recipeTypes.find((rt) => rt.id === recipeTypeId)?.name;
  const stepDone: Record<number, boolean> = {
    1: isEditing,
    2: isEditing,
    3: Boolean(dish && dish.ingredients.length > 0),
    4: Boolean(dish?.status),
  };

  return (
    <form onSubmit={handleSubmit} className="flex max-w-4xl flex-col gap-6">
      <AdminFormHeader
        title={isEditing ? dish?.name || "Edit dish" : "New dish"}
        subtitle={stallName ? `${stallName} · ${marketName ?? "No market"}` : undefined}
        onBack={() => navigate(`/admin/paluto-stalls/${stall}/dishes`)}
        backLabel="Back to menu"
        status={dish ? dish.status : undefined}
        statusLabels={["On the menu", "Removed from menu"]}
      />

      <AdminStepper
        label="Dish steps"
        steps={WIZARD_STEPS}
        current={step}
        done={stepDone}
        isLocked={isStepLocked}
        onSelect={goToStep}
      />

      {step === 1 && (
        <AdminStepCard
          title="Step 1 · Dish"
          intro="Start from a catalog recipe to copy its details and items, or fill it in yourself."
          footer={
            <>
              <span />
              <Button type="submit" loading={saveMutation.isPending}>
                {isEditing ? "Save & continue →" : "Continue →"}
              </Button>
            </>
          }
        >
          {!isEditing && (
            <div className="relative flex flex-col gap-1.5">
              <label
                className="text-sm font-medium text-text"
                htmlFor="from-recipe-search"
              >
                Start from a recipe (optional)
              </label>
              {fromRecipe ? (
                <div className="flex items-center justify-between gap-3 rounded-lg border border-primary bg-primary-50 px-3 py-2 text-sm">
                  <span>
                    Copied from <strong>{fromRecipe.name}</strong>. Remove what the stall
                    doesn&apos;t need bought.
                  </span>
                  <button
                    type="button"
                    onClick={() => setFromRecipe(null)}
                    className="shrink-0 text-xs font-medium text-status-cancelled"
                  >
                    Clear
                  </button>
                </div>
              ) : (
                <>
                  <input
                    id="from-recipe-search"
                    value={recipeSearch}
                    onChange={(e) => setRecipeSearch(e.target.value)}
                    placeholder="Search the Recipes catalog…"
                    className="h-11 rounded-lg border border-border bg-surface px-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary-300"
                  />
                  <p className="text-xs text-text-muted">
                    Fills in the details and items below once. Later recipe changes
                    don&apos;t affect this dish.
                  </p>
                </>
              )}
              {!fromRecipe && debouncedRecipeSearch.length > 1 && (
                <div className="absolute top-[4.5rem] z-10 max-h-64 w-full overflow-y-auto rounded-lg border border-border bg-surface shadow-lifted">
                  {(recipesFetching || pickRecipeMutation.isPending) && (
                    <div className="flex justify-center p-3">
                      <Spinner />
                    </div>
                  )}
                  {!recipesFetching &&
                    recipeResults &&
                    recipeResults.data.length === 0 && (
                      <p className="p-3 text-sm text-text-muted">No matching recipes.</p>
                    )}
                  {!recipesFetching &&
                    recipeResults?.data.map((recipe) => (
                      <button
                        key={recipe.id}
                        type="button"
                        onClick={() => pickRecipeMutation.mutate(recipe.id)}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-background"
                      >
                        <span className="font-medium text-text">{recipe.name}</span>
                        {recipe.recipe_type && (
                          <span className="text-xs text-text-muted">
                            {recipe.recipe_type}
                          </span>
                        )}
                      </button>
                    ))}
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col gap-4 sm:flex-row">
            <label className="flex shrink-0 cursor-pointer flex-col gap-1.5 text-sm font-medium text-text">
              Photo
              <span className="relative flex h-36 w-36 items-center justify-center overflow-hidden rounded-card border-2 border-dashed border-border bg-background text-text-muted hover:border-primary">
                {currentImage ? (
                  <img src={currentImage} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex flex-col items-center gap-1 text-xs">
                    <ImagePlus size={24} aria-hidden="true" />
                    Upload photo
                  </span>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImage(e.target.files?.[0] ?? null)}
                  className="absolute inset-0 cursor-pointer opacity-0"
                  aria-label="Upload dish photo"
                />
              </span>
              <span className="text-xs font-normal text-text-muted">
                {currentImage ? "Click to replace · max 4 MB" : "JPG or PNG · max 4 MB"}
              </span>
            </label>

            <div className="flex flex-1 flex-col gap-4">
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
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <label className="flex flex-col gap-1.5 text-sm font-medium text-text">
              Type
              <select
                value={recipeTypeId}
                onChange={(e) =>
                  setRecipeTypeId(e.target.value ? Number(e.target.value) : "")
                }
                className={selectClass}
              >
                <option value="">None</option>
                {recipeTypes.map((recipeType) => (
                  <option key={recipeType.id} value={recipeType.id}>
                    {recipeType.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </AdminStepCard>
      )}

      {step === 2 && (
        <AdminStepCard
          title="Step 2 · Cooking fee"
          intro="What the stall charges to cook — the items themselves are priced from the market."
          footer={
            <>
              <Button type="button" variant="secondary" onClick={() => goToStep(1)}>
                ← Back
              </Button>
              <Button type="submit" loading={saveMutation.isPending}>
                {isEditing ? "Save & continue →" : "Continue →"}
              </Button>
            </>
          }
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-sm font-medium text-text">
              Sold per
              <select
                value={pricingUnit}
                onChange={(e) => setPricingUnit(e.target.value as RecipePricingUnit)}
                required
                className={selectClass}
              >
                <option value="kg">Kg</option>
                <option value="serving">Serving</option>
              </select>
            </label>

            <Input
              label={pricingUnit === "kg" ? "Batch size (kg)" : "Batch size (servings)"}
              type="number"
              min="0"
              step="0.01"
              value={baseQuantity}
              onChange={(e) => setBaseQuantity(e.target.value)}
              helperText="The quantity the items below are for."
              required
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label={`Cooking fee per ${pricingUnit} (₱)`}
              type="number"
              min="0"
              step="0.01"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              required
            />
            <Input
              label="Minimum cooking fee (₱, optional)"
              type="number"
              min="0"
              step="0.01"
              value={minimumFee}
              onChange={(e) => setMinimumFee(e.target.value)}
            />
          </div>
        </AdminStepCard>
      )}

      {step === 3 && (
        <AdminStepCard
          title="Step 3 · Items to buy"
          intro={`Only what customers buy at the market for ${batchLabel} — the stall supplies the rest.`}
          footer={
            <>
              <Button type="button" variant="secondary" onClick={() => goToStep(2)}>
                ← Back
              </Button>
              <Button
                type="submit"
                loading={saveMutation.isPending}
                disabled={rowsInvalid}
              >
                {isEditing ? "Save & continue →" : "Continue →"}
              </Button>
            </>
          }
        >
          {marketId !== undefined ? (
            <DishIngredientsEditor
              stallId={stall}
              marketId={marketId}
              marketName={marketName}
              batchLabel={batchLabel}
              rows={rows}
              onChange={changeRows}
            />
          ) : (
            <div className="flex justify-center py-4">
              <Spinner />
            </div>
          )}
          {rows.length === 0 && (
            <p className="text-xs text-text-muted">
              You can continue without items, but customers can&apos;t order the dish
              until you add some.
            </p>
          )}
        </AdminStepCard>
      )}

      {step === 4 && (
        <AdminStepCard
          title="Step 4 · Review"
          footer={
            <>
              <Button type="button" variant="secondary" onClick={() => goToStep(3)}>
                ← Back
              </Button>
              <div className="flex gap-2">
                {dish ? (
                  <>
                    <Button
                      type="button"
                      variant={dish.status ? "danger" : "secondary"}
                      loading={statusMutation.isPending}
                      onClick={() => statusMutation.mutate(!dish.status)}
                    >
                      {dish.status ? "Remove from menu" : "Put back on menu"}
                    </Button>
                    <Button
                      type="button"
                      onClick={() => navigate(`/admin/paluto-stalls/${stall}/dishes`)}
                    >
                      Done
                    </Button>
                  </>
                ) : (
                  <Button
                    type="submit"
                    loading={saveMutation.isPending}
                    disabled={rowsInvalid}
                  >
                    Add dish to menu
                  </Button>
                )}
              </div>
            </>
          }
        >
          <div className="flex gap-4">
            {currentImage ? (
              <img
                src={currentImage}
                alt=""
                className="h-24 w-24 shrink-0 rounded-card object-cover"
              />
            ) : (
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-card bg-background text-xs text-text-muted">
                No photo
              </div>
            )}
            <div className="flex flex-col gap-1 text-sm">
              <p className="font-semibold text-text">{name || "—"}</p>
              <p className="text-text-muted">
                {typeName ?? "No type"} · sold per {pricingUnit} · batch {batchLabel}
              </p>
              <p className="text-text">
                Cooking fee ₱{Number(rate || 0).toFixed(2)}/{pricingUnit}
                {minimumFee !== "" && ` · minimum ₱${Number(minimumFee).toFixed(2)}`}
              </p>
              {description && <p className="text-text-muted">{description}</p>}
            </div>
          </div>

          <ul className="flex flex-col gap-2 text-sm">
            {[
              { ok: Boolean(currentImage), label: "Photo", fix: 1 },
              {
                ok: rows.length > 0,
                label: `${rows.length} item${rows.length === 1 ? "" : "s"} to buy`,
                fix: 3,
              },
              { ok: !rowsInvalid, label: "Every item available with a quantity", fix: 3 },
            ].map((check) => (
              <li
                key={check.label}
                className="flex items-center justify-between gap-3 rounded-lg bg-background px-3 py-2"
              >
                <span className={check.ok ? "text-text" : "text-status-cancelled"}>
                  {check.ok ? "✓" : "!"} {check.label}
                  {!check.ok && " — needs attention"}
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
        </AdminStepCard>
      )}
    </form>
  );
}
