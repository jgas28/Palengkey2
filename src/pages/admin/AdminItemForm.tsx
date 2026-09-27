import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Spinner } from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";
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
  const [price, setPrice] = useState(item?.market?.price?.toString() ?? "");
  const [isAvailable, setIsAvailable] = useState(item?.market?.is_available ?? true);
  const [cutoffTime, setCutoffTime] = useState(item?.market?.cutoff_time ?? "");
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [hydratedFromItem, setHydratedFromItem] = useState(false);

  if (item && !hydratedFromItem) {
    setName(item.name);
    setDescription(item.description ?? "");
    setCategoryId(item.category_id);
    setTypeId(item.type_id ?? "");
    setUnitId(item.unit_id);
    setPrice(item.market?.price?.toString() ?? "");
    setIsAvailable(item.market?.is_available ?? true);
    setCutoffTime(item.market?.cutoff_time ?? "");
    setHydratedFromItem(true);
  }

  const createMutation = useMutation({
    mutationFn: () =>
      createAdminItem({
        name,
        description: description || undefined,
        picture_url: coverImage!,
        category_id: Number(categoryId),
        type_id: typeId ? Number(typeId) : undefined,
        unit_id: Number(unitId),
        price: Number(price),
        is_available: isAvailable,
        cutoff_time: cutoffTime || undefined,
        market_id: isSuperAdmin ? marketId : undefined,
      }),
    onSuccess: (created) => {
      void queryClient.invalidateQueries({ queryKey: ["adminItems"] });
      showToast("Item created.", "success");
      navigate(
        `/admin/items/${created.id}/edit${marketId ? `?market_id=${marketId}` : ""}`,
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
      showToast(error instanceof Error ? error.message : "Could not deactivate item.", "error");
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
      showToast(error instanceof Error ? error.message : "Could not restore item.", "error");
    },
  });

  function handleCreateSubmit(event: FormEvent) {
    event.preventDefault();
    if (!coverImage) {
      showToast("Add a cover image.", "error");
      return;
    }
    if (isSuperAdmin && !marketId) {
      showToast("Choose a market for this item.", "error");
      return;
    }
    createMutation.mutate();
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

  return (
    <div className="flex max-w-2xl flex-col gap-8">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-lg font-semibold">{isEditing ? "Edit item" : "Add item"}</h1>
        {isEditing && item && (
          <span
            className={`text-xs font-semibold ${
              item.status ? "text-status-delivered" : "text-text-muted"
            }`}
          >
            {item.status ? "Active" : "Deactivated"}
          </span>
        )}
      </div>

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

      <form
        onSubmit={isEditing ? (e) => e.preventDefault() : handleCreateSubmit}
        className="flex flex-col gap-4"
      >
        <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
          Catalog details
        </h2>

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

        {!isEditing && (
          <label className="flex flex-col gap-1.5 text-sm font-medium text-text">
            Cover image
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setCoverImage(e.target.files?.[0] ?? null)}
              required
              className="text-sm text-text-muted"
            />
          </label>
        )}

        {isEditing && item && (
          <img
            src={item.image_url}
            alt={item.name}
            className="h-32 w-32 rounded-card object-cover"
          />
        )}

        <h2 className="mt-2 text-sm font-semibold uppercase tracking-wide text-text-muted">
          Market listing
        </h2>

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

        {isEditing ? (
          <div className="flex gap-3">
            <Button
              type="button"
              loading={updateMutation.isPending}
              onClick={() => updateMutation.mutate()}
            >
              Save details
            </Button>
            <Button
              type="button"
              variant="secondary"
              loading={marketMutation.isPending}
              onClick={() => marketMutation.mutate()}
            >
              Save market listing
            </Button>
          </div>
        ) : (
          <Button type="submit" loading={createMutation.isPending}>
            Create item
          </Button>
        )}
      </form>

      {isEditing && item && (
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
            Gallery images
          </h2>

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
        </div>
      )}

      {isEditing && item && (
        <div className="flex flex-col gap-2 border-t border-border pt-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
            Danger zone
          </h2>
          {item.status ? (
            <Button
              type="button"
              variant="danger"
              size="sm"
              className="self-start"
              loading={deactivateMutation.isPending}
              onClick={() => deactivateMutation.mutate()}
            >
              Deactivate item
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
              Restore item
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
