import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Spinner } from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";
import AdminStepper, {
  AdminFormHeader,
  AdminStepCard,
} from "@/components/admin/AdminStepper";
import useWizardStep from "@/hooks/useWizardStep";
import {
  createAdminItem,
  deactivateAdminItem,
  deleteAdminItemImage,
  getAdminItem,
  restoreAdminItem,
  updateAdminItem,
  updateAdminItemMarketListing,
  uploadAdminItemImages,
} from "@/services/api/adminItems";
import {
  listAdminCategories,
  listAdminMarkets,
  listAdminTypes,
  listAdminUnits,
} from "@/services/api/adminLookups";
import { useAdminAuthStore } from "@/stores/adminAuthStore";
import { useToastStore } from "@/stores/toastStore";

const WIZARD_STEPS = [
  { id: 1, title: "Details", hint: "Name, category, unit" },
  { id: 2, title: "Price & stock", hint: "Market price, cutoff, bulk" },
  { id: 3, title: "Photos", hint: "Cover and gallery" },
  { id: 4, title: "Review", hint: "Check and save" },
] as const;

export default function AdminItemForm() {
  const { itemId } = useParams<{ itemId: string }>();
  const isEditing = Boolean(itemId);
  const id = itemId ? Number(itemId) : null;

  const [searchParams] = useSearchParams();
  const marketIdParam = searchParams.get("market_id");

  const user = useAdminAuthStore((state) => state.user);
  const isSuperAdmin = user?.role === "super_admin";
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const showToast = useToastStore((state) => state.showToast);

  const [marketId, setMarketId] = useState<number | undefined>(
    marketIdParam ? Number(marketIdParam) : (user?.market_id ?? undefined),
  );

  const { data: categories = [] } = useQuery({
    queryKey: ["adminCategories"],
    queryFn: listAdminCategories,
  });
  const { data: types = [] } = useQuery({
    queryKey: ["adminTypes"],
    queryFn: listAdminTypes,
  });
  const { data: units = [] } = useQuery({
    queryKey: ["adminUnits"],
    queryFn: listAdminUnits,
  });
  const { data: markets = [] } = useQuery({
    queryKey: ["adminMarkets"],
    queryFn: listAdminMarkets,
    enabled: isSuperAdmin,
  });

  const {
    data: item,
    isLoading: itemLoading,
    isError: itemError,
    refetch: refetchItem,
  } = useQuery({
    queryKey: ["adminItem", id, marketId],
    queryFn: () => getAdminItem(id!, marketId),
    enabled: isEditing && id !== null,
  });

  const [name, setName] = useState(item?.name ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [categoryId, setCategoryId] = useState<number | "">(item?.category_id ?? "");
  const [typeId, setTypeId] = useState<number | "">(item?.type_id ?? "");
  const [unitId, setUnitId] = useState<number | "">(item?.unit_id ?? "");
  const [bulkMinKg, setBulkMinKg] = useState("");
  const [bulkDiscountPerKg, setBulkDiscountPerKg] = useState("");
  const [price, setPrice] = useState(item?.market?.price?.toString() ?? "");
  const [isAvailable, setIsAvailable] = useState(item?.market?.is_available ?? true);
  const [cutoffTime, setCutoffTime] = useState(item?.market?.cutoff_time ?? "");
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [newImages, setNewImages] = useState<File[]>([]);
  const coverPreview = useMemo(
    () => (coverImage ? URL.createObjectURL(coverImage) : null),
    [coverImage],
  );
  useEffect(
    () => () => {
      if (coverPreview) URL.revokeObjectURL(coverPreview);
    },
    [coverPreview],
  );
  const [hydratedFromItem, setHydratedFromItem] = useState(false);
  const [hydratedMarketId, setHydratedMarketId] = useState<number | undefined>(undefined);

  if (item && !hydratedFromItem) {
    setName(item.name);
    setDescription(item.description ?? "");
    setCategoryId(item.category_id);
    setTypeId(item.type_id ?? "");
    setUnitId(item.unit_id);
    setBulkMinKg(item.bulk_min_kg ? String(Number(item.bulk_min_kg)) : "");
    setBulkDiscountPerKg(
      item.bulk_discount_per_kg !== null && item.bulk_discount_per_kg !== undefined
        ? String(Number(item.bulk_discount_per_kg))
        : "",
    );
    setHydratedFromItem(true);
  }

  if (item && hydratedMarketId !== (item.market?.market_id ?? marketId)) {
    setPrice(item.market?.price?.toString() ?? "");
    setIsAvailable(item.market?.is_available ?? true);
    setCutoffTime(item.market?.cutoff_time ?? "");
    setHydratedMarketId(item.market?.market_id ?? marketId);
  }

  // A new item is only created at the Review step, so each step must be valid before the next.
  const detailsValid = Boolean(name.trim() && categoryId && unitId);
  const listingValid =
    (!isSuperAdmin || Boolean(marketId)) && (!isAvailable || Number(price) > 0);
  const photosValid = isEditing || Boolean(coverImage);
  const isStepLocked = (stepId: number) =>
    !isEditing &&
    ((stepId > 1 && !detailsValid) ||
      (stepId > 2 && !listingValid) ||
      (stepId > 3 && !photosValid));
  const [step, goToStep] = useWizardStep(WIZARD_STEPS.length, isStepLocked);

  const createMutation = useMutation({
    mutationFn: () =>
      createAdminItem({
        name,
        description: description || undefined,
        picture_url: coverImage!,
        category_id: Number(categoryId),
        type_id: typeId ? Number(typeId) : undefined,
        unit_id: Number(unitId),
        bulk_min_kg: bulkMinKg ? Number(bulkMinKg) : null,
        bulk_discount_per_kg: bulkDiscountPerKg !== "" ? Number(bulkDiscountPerKg) : null,
        price: Number(price),
        is_available: isAvailable,
        cutoff_time: cutoffTime || undefined,
        market_id: isSuperAdmin ? marketId : undefined,
      }),
    onSuccess: (created) => {
      void queryClient.invalidateQueries({ queryKey: ["adminItems"] });
      showToast("Item created. Add more gallery photos if you like.", "success");
      navigate(
        `/admin/items/${created.id}/edit?step=3${marketId ? `&market_id=${marketId}` : ""}`,
        {
          replace: true,
        },
      );
    },
    onError: (error) => {
      showToast(
        error instanceof Error ? error.message : "Could not create item.",
        "error",
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      updateAdminItem(id!, {
        name,
        description: description || undefined,
        category_id: Number(categoryId),
        type_id: typeId ? Number(typeId) : undefined,
        unit_id: Number(unitId),
        bulk_min_kg: bulkMinKg ? Number(bulkMinKg) : null,
        bulk_discount_per_kg: bulkDiscountPerKg !== "" ? Number(bulkDiscountPerKg) : null,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["adminItems"] });
      void queryClient.invalidateQueries({ queryKey: ["adminItem", id] });
      showToast("Item details saved.", "success");
    },
    onError: (error) => {
      showToast(error instanceof Error ? error.message : "Could not save item.", "error");
    },
  });

  const marketMutation = useMutation({
    mutationFn: () =>
      updateAdminItemMarketListing(id!, {
        market_id: isSuperAdmin ? marketId : undefined,
        price: price ? Number(price) : null,
        is_available: isAvailable,
        cutoff_time: cutoffTime || undefined,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["adminItems"] });
      void queryClient.invalidateQueries({ queryKey: ["adminItem", id] });
      showToast("Market listing saved.", "success");
    },
    onError: (error) => {
      showToast(
        error instanceof Error ? error.message : "Could not save market listing.",
        "error",
      );
    },
  });

  const uploadImagesMutation = useMutation({
    mutationFn: () => uploadAdminItemImages(id!, newImages),
    onSuccess: () => {
      setNewImages([]);
      void queryClient.invalidateQueries({ queryKey: ["adminItem", id] });
      showToast("Images uploaded.", "success");
    },
    onError: (error) => {
      showToast(
        error instanceof Error ? error.message : "Could not upload images.",
        "error",
      );
    },
  });

  const deleteImageMutation = useMutation({
    mutationFn: (imageId: number) => deleteAdminItemImage(id!, imageId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["adminItem", id] });
    },
    onError: (error) => {
      showToast(
        error instanceof Error ? error.message : "Could not remove image.",
        "error",
      );
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: () => deactivateAdminItem(id!),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ["adminItem", id] });
      void queryClient.invalidateQueries({ queryKey: ["adminItems"] });
      showToast(data.message, "success");
    },
    onError: (error) => {
      showToast(
        error instanceof Error ? error.message : "Could not deactivate item.",
        "error",
      );
    },
  });

  const restoreMutation = useMutation({
    mutationFn: () => restoreAdminItem(id!),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ["adminItem", id] });
      void queryClient.invalidateQueries({ queryKey: ["adminItems"] });
      showToast(data.message, "success");
    },
    onError: (error) => {
      showToast(
        error instanceof Error ? error.message : "Could not restore item.",
        "error",
      );
    },
  });

  /** Edit mode saves as you go; create mode only validates until Review. */
  function continueFrom(current: number) {
    if (current === 1) {
      if (!detailsValid)
        return showToast("Fill in the name, category and unit.", "error");
      if (isEditing)
        return updateMutation.mutate(undefined, { onSuccess: () => goToStep(2) });
    }
    if (current === 2) {
      if (isSuperAdmin && !marketId)
        return showToast("Choose a market for this item.", "error");
      if (isAvailable && !(Number(price) > 0))
        return showToast("Enter a price, or mark it unavailable.", "error");
      if (isEditing) {
        return updateMutation.mutate(undefined, {
          onSuccess: () =>
            marketMutation.mutate(undefined, { onSuccess: () => goToStep(3) }),
        });
      }
    }
    if (current === 3 && !photosValid) return showToast("Add a cover image.", "error");
    goToStep(current + 1);
  }

  if (isEditing && itemLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    );
  }

  if (isEditing && itemError) {
    return <ErrorState onRetry={() => void refetchItem()} />;
  }

  const category = categories.find((c) => c.id === categoryId);
  const unit = units.find((u) => u.id === unitId);
  const marketName = isSuperAdmin
    ? markets.find((m) => m.id === marketId)?.name
    : "Your market";
  const stepDone: Record<number, boolean> = {
    1: isEditing,
    2: Boolean(item?.market?.price),
    3: Boolean(item?.image_url),
    4: Boolean(item?.status),
  };

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <AdminFormHeader
        title={isEditing ? item?.name || "Edit item" : "New item"}
        onBack={() => navigate("/admin/items")}
        backLabel="Back to items"
        status={isEditing && item ? item.status : undefined}
      />

      <AdminStepper
        label="Item steps"
        steps={WIZARD_STEPS}
        current={step}
        done={stepDone}
        isLocked={isStepLocked}
        onSelect={goToStep}
      />

      {step === 1 && (
        <AdminStepCard
          title="Step 1 · Details"
          intro="What customers see in the catalog."
          footer={
            <>
              <span />
              <Button
                type="button"
                loading={updateMutation.isPending}
                onClick={() => continueFrom(1)}
              >
                {isEditing ? "Save & continue →" : "Continue →"}
              </Button>
            </>
          }
        >
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
              Category
              <select
                value={categoryId}
                onChange={(e) =>
                  setCategoryId(e.target.value ? Number(e.target.value) : "")
                }
                required
                className="h-12 rounded-lg border border-border bg-surface px-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary-300"
              >
                <option value="">Select</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1.5 text-sm font-medium text-text">
              Type
              <select
                value={typeId}
                onChange={(e) => setTypeId(e.target.value ? Number(e.target.value) : "")}
                className="h-12 rounded-lg border border-border bg-surface px-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary-300"
              >
                <option value="">Select</option>
                {types.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1.5 text-sm font-medium text-text">
              Unit
              <select
                value={unitId}
                onChange={(e) => setUnitId(e.target.value ? Number(e.target.value) : "")}
                required
                className="h-12 rounded-lg border border-border bg-surface px-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary-300"
              >
                <option value="">Select</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </AdminStepCard>
      )}

      {step === 2 && (
        <AdminStepCard
          title="Step 2 · Price & stock"
          intro="Prices are per market — this is the vendor price before the app markup."
          footer={
            <>
              <Button type="button" variant="secondary" onClick={() => goToStep(1)}>
                ← Back
              </Button>
              <Button
                type="button"
                loading={updateMutation.isPending || marketMutation.isPending}
                onClick={() => continueFrom(2)}
              >
                {isEditing ? "Save & continue →" : "Continue →"}
              </Button>
            </>
          }
        >
          {isSuperAdmin && (
            <label className="flex flex-col gap-1.5 text-sm font-medium text-text">
              Market
              <select
                value={marketId ?? ""}
                onChange={(event) =>
                  setMarketId(event.target.value ? Number(event.target.value) : undefined)
                }
                className="h-12 rounded-lg border border-border bg-surface px-4 text-base text-text focus:outline-none focus:ring-2 focus:ring-primary-300"
              >
                <option value="">Select a market</option>
                {markets.map((market) => (
                  <option key={market.id} value={market.id}>
                    {market.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <Input
            label="Price (₱)"
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required={isAvailable}
          />

          <label className="flex items-center gap-2 text-sm text-text">
            <input
              type="checkbox"
              checked={isAvailable}
              onChange={(e) => setIsAvailable(e.target.checked)}
            />
            Available for order
          </label>

          <Input
            label="Cutoff time (optional)"
            type="time"
            value={cutoffTime}
            onChange={(e) => setCutoffTime(e.target.value)}
            helperText="Orders placed after this time are reserved for the next available slot."
          />

          <details
            className="rounded-lg border border-border p-3"
            open={Boolean(bulkMinKg || bulkDiscountPerKg)}
          >
            <summary className="cursor-pointer text-sm font-medium text-text">
              Bulk pricing overrides (optional)
            </summary>
            <p className="mt-1 text-xs text-text-muted">
              Only applies when this item's category has bulk pricing turned on (Admin →
              Categories).
            </p>
            <div className="mt-3 flex flex-col gap-4">
              <Input
                label="Bulk order minimum (kg) — optional override"
                type="number"
                min="0"
                step="0.25"
                value={bulkMinKg}
                onChange={(e) => setBulkMinKg(e.target.value)}
                placeholder={
                  item?.category_bulk_min_kg
                    ? `Category default: ${Number(item.category_bulk_min_kg)} kg`
                    : "Uses the category's bulk minimum"
                }
                helperText="Only for items sold by weight. Leave blank to use the category's bulk minimum."
              />

              <Input
                label="Bulk discount (₱ off per kg) — optional override"
                type="number"
                min="0"
                step="0.5"
                value={bulkDiscountPerKg}
                onChange={(e) => setBulkDiscountPerKg(e.target.value)}
                placeholder={
                  item?.category_bulk_discount_per_kg
                    ? `Category default: ₱${Number(item.category_bulk_discount_per_kg)}/kg`
                    : "Uses the category's ₱/kg discount"
                }
                helperText="Taken off this item's per-kg price in bulk. Leave blank to use the category's amount."
              />
            </div>
          </details>
        </AdminStepCard>
      )}

      {step === 3 && (
        <AdminStepCard
          title="Step 3 · Photos"
          intro="A clear cover photo on a plain background works best."
          footer={
            <>
              <Button type="button" variant="secondary" onClick={() => goToStep(2)}>
                ← Back
              </Button>
              <Button type="button" onClick={() => continueFrom(3)}>
                Continue →
              </Button>
            </>
          }
        >
          {isEditing && item ? (
            <>
              <div className="flex items-center gap-4">
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="h-28 w-28 rounded-card object-cover"
                />
                <p className="text-sm text-text-muted">Cover photo</p>
              </div>
              <h3 className="text-sm font-semibold text-text">Gallery</h3>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {item.images.map((image) => (
                  <div key={image.id} className="relative">
                    <img
                      src={image.url}
                      alt=""
                      className="aspect-square w-full rounded-card object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => deleteImageMutation.mutate(image.id)}
                      aria-label="Remove image"
                      className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-xs text-white"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setNewImages(Array.from(e.target.files ?? []))}
                className="text-sm text-text-muted"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={newImages.length === 0}
                loading={uploadImagesMutation.isPending}
                onClick={() => uploadImagesMutation.mutate()}
              >
                Upload images
              </Button>
            </>
          ) : (
            <label className="flex flex-col gap-1.5 text-sm font-medium text-text">
              Cover image
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setCoverImage(e.target.files?.[0] ?? null)}
                className="text-sm text-text-muted"
              />
              {coverPreview && (
                <img
                  src={coverPreview}
                  alt=""
                  className="mt-2 h-28 w-28 rounded-card object-cover"
                />
              )}
              <span className="text-xs font-normal text-text-muted">
                You can add more gallery photos after the item is created.
              </span>
            </label>
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
                {isEditing && item ? (
                  <>
                    {item.status ? (
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
                        variant="secondary"
                        loading={restoreMutation.isPending}
                        onClick={() => restoreMutation.mutate()}
                      >
                        Restore
                      </Button>
                    )}
                    <Button type="button" onClick={() => navigate("/admin/items")}>
                      Done
                    </Button>
                  </>
                ) : (
                  <Button
                    type="button"
                    loading={createMutation.isPending}
                    onClick={() => createMutation.mutate()}
                  >
                    Create item
                  </Button>
                )}
              </div>
            </>
          }
        >
          <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
            {[
              ["Name", name || "—", 1],
              ["Category", category?.name ?? "—", 1],
              ["Type", types.find((t) => t.id === typeId)?.name ?? "—", 1],
              ["Unit", unit?.name ?? "—", 1],
              ["Market", marketName ?? "—", 2],
              [
                "Vendor price",
                price
                  ? `₱${Number(price).toFixed(2)} / ${unit?.short_name ?? "unit"}`
                  : "—",
                2,
              ],
              ["Availability", isAvailable ? "Available" : "Unavailable", 2],
              ["Cutoff", cutoffTime || "None", 2],
              [
                "Bulk overrides",
                bulkMinKg || bulkDiscountPerKg
                  ? `${bulkMinKg ? `${bulkMinKg} kg+` : "category min"} · ${bulkDiscountPerKg !== "" ? `₱${bulkDiscountPerKg}/kg off` : "category ₱/kg"}`
                  : "Uses category",
                2,
              ],
              [
                "Photos",
                isEditing
                  ? `Cover + ${item?.images.length ?? 0} gallery`
                  : coverImage
                    ? "Cover selected"
                    : "Missing cover",
                3,
              ],
            ].map(([label, value, fix]) => (
              <div
                key={label as string}
                className="flex items-start justify-between gap-3 border-b border-border pb-2"
              >
                <div>
                  <dt className="text-xs text-text-muted">{label}</dt>
                  <dd className="font-medium text-text">{value}</dd>
                </div>
                <button
                  type="button"
                  onClick={() => goToStep(fix as number)}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Edit
                </button>
              </div>
            ))}
          </dl>
          {description && <p className="text-sm text-text-muted">{description}</p>}
        </AdminStepCard>
      )}
    </div>
  );
}
