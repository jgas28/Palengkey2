import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, ImagePlus, Plus, Sparkles, X } from "lucide-react";
import { Spinner } from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";
import { Card } from "@/components/admin/AdminUi";
import useWizardStep from "@/hooks/useWizardStep";
import {
  createAdminItem,
  deactivateAdminItem,
  deleteAdminItemImage,
  getAdminItem,
  listAdminItems,
  replaceAdminItemCover,
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
import type { AdminItemAvailability, AdminItemMarketListing } from "@/types/adminItem";

const WIZARD_STEPS = [
  { id: 1, title: "Details", hint: "Customer-facing information" },
  { id: 2, title: "Pricing & availability", hint: "Market price, stock, and bulk" },
  { id: 3, title: "Photos", hint: "Cover and gallery images" },
  { id: 4, title: "Review", hint: "Check before publishing" },
] as const;

const AVAILABILITY_OPTIONS: {
  value: AdminItemAvailability;
  title: string;
  hint: string;
}[] = [
  {
    value: "available",
    title: "Available",
    hint: "In the market and ready for today's orders.",
  },
  {
    value: "out_of_stock",
    title: "Out of stock",
    hint: "Sold out today — comes back automatically tomorrow.",
  },
  {
    value: "unavailable",
    title: "Unavailable",
    hint: "Seasonal or hard to source — hidden until you turn it back on.",
  },
];

const AVAILABILITY_LABEL: Record<AdminItemAvailability, string> = {
  available: "Available now",
  out_of_stock: "Out of stock · back tomorrow",
  unavailable: "Unavailable",
};

function listingAvailability(listing: AdminItemMarketListing): AdminItemAvailability {
  return listing.availability ?? (listing.is_available ? "available" : "unavailable");
}

const fieldLabel = "mb-1.5 block text-xs font-semibold text-slate-700";
const fieldBase =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100 disabled:bg-slate-50 disabled:text-slate-500";
const field = `${fieldBase} h-11`;

function peso(value: number): string {
  return `₱${value.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** "15:00" → "3:00 PM". */
function clock(time: string): string {
  const [h, m] = time.split(":").map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

function relativeDay(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const day = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
  const diff = Math.round(
    (new Date(day(new Date())).getTime() - new Date(day(new Date(iso))).getTime()) /
      86400000,
  );
  if (diff <= 0) return "Updated today";
  if (diff === 1) return "Updated yesterday";
  return `Updated ${diff} days ago`;
}

function StepPanel({
  title,
  intro,
  badge,
  footer,
  children,
}: {
  title: string;
  intro: string;
  badge?: string;
  footer: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h3 className="font-display text-xl font-semibold text-slate-900">{title}</h3>
          <p className="text-xs text-slate-500">{intro}</p>
        </div>
        {badge && (
          <span className="rounded-full bg-primary-50 px-2.5 py-1 text-[11px] font-semibold text-primary-700">
            {badge}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-4 py-5">{children}</div>
      <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
        {footer}
      </div>
    </Card>
  );
}

function BackButton({
  onClick,
  label = "Back",
}: {
  onClick: () => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 rounded-xl border border-primary-300 px-4 py-2.5 text-sm font-semibold text-primary-800 hover:bg-primary-50"
    >
      <ArrowLeft size={16} aria-hidden="true" /> {label}
    </button>
  );
}

function PrimaryButton({
  onClick,
  loading,
  children,
}: {
  onClick: () => void;
  loading?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 disabled:opacity-60"
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}

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
  const coverInput = useRef<HTMLInputElement>(null);
  const galleryInput = useRef<HTMLInputElement>(null);

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
    isFetchedAfterMount: itemFresh,
    refetch: refetchItem,
  } = useQuery({
    queryKey: ["adminItem", id, marketId],
    queryFn: () => getAdminItem(id!, marketId),
    enabled: isEditing && id !== null,
    // Availability can change elsewhere (Inventory, the list); never trust the cache here.
    refetchOnMount: "always",
  });

  // New items have no item payload yet; borrow the markup from the catalog list.
  const { data: markupSample } = useQuery({
    queryKey: ["adminItems", "markupSample"],
    queryFn: () => listAdminItems({ page: 1 }),
    enabled: !isEditing,
    staleTime: 5 * 60 * 1000,
  });
  const markupPercent = item?.markup_percent ?? markupSample?.data[0]?.markup_percent;

  const [name, setName] = useState(item?.name ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [categoryId, setCategoryId] = useState<number | "">(item?.category_id ?? "");
  const [typeId, setTypeId] = useState<number | "">(item?.type_id ?? "");
  const [unitId, setUnitId] = useState<number | "">(item?.unit_id ?? "");
  const [bulkMinKg, setBulkMinKg] = useState("");
  const [bulkDiscountPerKg, setBulkDiscountPerKg] = useState("");
  const [price, setPrice] = useState(item?.market?.price?.toString() ?? "");
  const [availability, setAvailability] = useState<AdminItemAvailability>(
    item?.market ? listingAvailability(item.market) : "available",
  );
  const isAvailable = availability === "available";
  const [cutoffTime, setCutoffTime] = useState(item?.market?.cutoff_time ?? "");
  const [coverImage, setCoverImage] = useState<File | null>(null);
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
  const [hydratedListing, setHydratedListing] = useState<string | undefined>(undefined);

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

  // Refill the listing when the market changes, and once more when the fresh
  // copy replaces the cached one; later background refetches keep unsaved edits.
  const listingKey = `${item?.market?.market_id ?? marketId}:${itemFresh}`;
  if (item && hydratedListing !== listingKey) {
    setPrice((item.market?.price ?? item.market?.last_price)?.toString() ?? "");
    setAvailability(item.market ? listingAvailability(item.market) : "available");
    setCutoffTime(item.market?.cutoff_time ?? "");
    setHydratedListing(listingKey);
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

  function invalidateItem() {
    void queryClient.invalidateQueries({ queryKey: ["adminItems"] });
    void queryClient.invalidateQueries({ queryKey: ["adminItem", id] });
  }
  const errorToast = (fallback: string) => (error: unknown) =>
    showToast(error instanceof Error ? error.message : fallback, "error");

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
        { replace: true },
      );
    },
    onError: errorToast("Could not create item."),
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
    onSuccess: invalidateItem,
    onError: errorToast("Could not save item."),
  });

  const marketMutation = useMutation({
    mutationFn: (next?: { availability: AdminItemAvailability }) =>
      updateAdminItemMarketListing(id!, {
        market_id: isSuperAdmin ? marketId : undefined,
        price: price ? Number(price) : null,
        is_available: (next?.availability ?? availability) === "available",
        availability: next?.availability ?? availability,
        cutoff_time: cutoffTime || undefined,
      }),
    onSuccess: invalidateItem,
    onError: errorToast("Could not save market listing."),
  });

  const coverMutation = useMutation({
    mutationFn: (file: File) => replaceAdminItemCover(id!, file, marketId),
    onSuccess: () => {
      invalidateItem();
      showToast("Cover photo replaced.", "success");
    },
    onError: errorToast("Could not replace the cover photo."),
  });

  const uploadImagesMutation = useMutation({
    mutationFn: (files: File[]) => uploadAdminItemImages(id!, files),
    onSuccess: () => {
      invalidateItem();
      showToast("Gallery photos added.", "success");
    },
    onError: errorToast("Could not upload images."),
  });

  const deleteImageMutation = useMutation({
    mutationFn: (imageId: number) => deleteAdminItemImage(id!, imageId),
    onSuccess: invalidateItem,
    onError: errorToast("Could not remove image."),
  });

  const deactivateMutation = useMutation({
    mutationFn: () => deactivateAdminItem(id!),
    onSuccess: (data) => {
      invalidateItem();
      showToast(data.message, "success");
    },
    onError: errorToast("Could not deactivate item."),
  });

  const restoreMutation = useMutation({
    mutationFn: () => restoreAdminItem(id!),
    onSuccess: (data) => {
      invalidateItem();
      showToast(data.message, "success");
    },
    onError: errorToast("Could not restore item."),
  });

  function validateListing(): boolean {
    if (isSuperAdmin && !marketId) {
      showToast("Choose a market for this item.", "error");
      return false;
    }
    if (isAvailable && !(Number(price) > 0)) {
      showToast("Enter a vendor price, or mark it unavailable.", "error");
      return false;
    }
    return true;
  }

  /** Header "Save changes": saves the details and, when a market is chosen, its listing. */
  function saveAll(after?: () => void) {
    if (!detailsValid) return showToast("Fill in the name, category and unit.", "error");
    const withMarket = Boolean(marketId || !isSuperAdmin);
    if (withMarket && !validateListing()) return;
    updateMutation.mutate(undefined, {
      onSuccess: () => {
        if (!withMarket) {
          showToast("Item details saved.", "success");
          return after?.();
        }
        marketMutation.mutate(undefined, {
          onSuccess: () => {
            showToast("Changes saved.", "success");
            after?.();
          },
        });
      },
    });
  }

  /** Edit mode saves as you go; create mode only validates until Review. */
  function continueFrom(current: number) {
    if (current === 1) {
      if (!detailsValid)
        return showToast("Fill in the name, category and unit.", "error");
      if (isEditing)
        return updateMutation.mutate(undefined, { onSuccess: () => goToStep(2) });
    }
    if (current === 2) {
      if (!validateListing()) return;
      if (isEditing) return saveAll(() => goToStep(3));
    }
    if (current === 3 && !photosValid) return showToast("Add a cover photo.", "error");
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
  const type = types.find((t) => t.id === typeId);
  const unit = units.find((u) => u.id === unitId);
  const unitLabel = unit?.short_name || unit?.name || "unit";
  const marketName = isSuperAdmin
    ? markets.find((m) => m.id === marketId)?.name
    : (item?.market?.market_name ?? "Your market");
  const vendorPrice = Number(price) || 0;
  const customerPrice =
    vendorPrice > 0 && markupPercent !== undefined
      ? Math.round(vendorPrice * (1 + markupPercent / 100) * 100) / 100
      : null;
  const margin =
    customerPrice && customerPrice > 0
      ? Math.round(((customerPrice - vendorPrice) / customerPrice) * 100)
      : null;
  const coverUrl = coverPreview ?? item?.image_url ?? null;
  const busy = updateMutation.isPending || marketMutation.isPending;

  const completeness = [
    { label: "Customer details", done: detailsValid },
    { label: "Market pricing", done: vendorPrice > 0 },
    { label: "Availability", done: Boolean(marketId || !isSuperAdmin) },
    { label: "Cover photo", done: Boolean(coverUrl) },
  ];
  const completePercent = Math.round(
    (completeness.filter((c) => c.done).length / completeness.length) * 100,
  );
  const stepDone: Record<number, boolean> = {
    1: detailsValid,
    2: vendorPrice > 0 && Boolean(marketId || !isSuperAdmin),
    3: Boolean(coverUrl),
    4: isEditing && Boolean(item?.status),
  };

  const bulkSummary =
    bulkMinKg || bulkDiscountPerKg
      ? `${bulkDiscountPerKg !== "" ? `₱${bulkDiscountPerKg}/kg off` : "Category ₱/kg off"} at ${
          bulkMinKg ? `${bulkMinKg} kg+` : "category minimum"
        }`
      : "Uses category settings";

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <Link
          to="/admin/items"
          className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary-700 hover:underline"
        >
          <ArrowLeft size={14} aria-hidden="true" /> Back to items
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-700">
              {isEditing ? item?.sku : "New item"}
              {isEditing && item && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] normal-case tracking-normal ${
                    item.status
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {item.status ? "Live" : "Inactive"}
                </span>
              )}
            </p>
            <h2 className="font-display text-3xl font-semibold text-slate-900">
              {name.trim() || (isEditing ? "Edit item" : "New item")}
            </h2>
            <p className="text-xs text-slate-500">
              {[category?.name, type?.name, relativeDay(item?.updated_at)]
                .filter(Boolean)
                .join(" · ") || "Fill in the steps below to list it for sale."}
            </p>
          </div>
          {isEditing && item && (
            <div className="flex gap-2">
              {item.market && (
                <button
                  type="button"
                  disabled={marketMutation.isPending}
                  onClick={() => {
                    const next: AdminItemAvailability = isAvailable
                      ? "out_of_stock"
                      : "available";
                    if (next === "available" && !(Number(price) > 0)) {
                      showToast(
                        "Add a vendor price before making it available.",
                        "error",
                      );
                      return;
                    }
                    marketMutation.mutate(
                      { availability: next },
                      {
                        onSuccess: () => {
                          setAvailability(next);
                          showToast(
                            next === "available"
                              ? "Marked available."
                              : "Marked out of stock — it comes back tomorrow.",
                            "success",
                          );
                        },
                      },
                    );
                  }}
                  className={`rounded-xl border px-4 py-2.5 text-sm font-semibold disabled:opacity-60 ${
                    isAvailable
                      ? "border-rose-200 text-rose-600 hover:bg-rose-50"
                      : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                  }`}
                >
                  {isAvailable ? "Mark out of stock" : "Mark available"}
                </button>
              )}
              <button
                type="button"
                disabled={busy}
                onClick={() => saveAll()}
                className="flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 disabled:opacity-60"
              >
                <Check size={16} aria-hidden="true" /> Save changes
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stepper */}
      <ol className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {WIZARD_STEPS.map((wizardStep) => {
          const active = wizardStep.id === step;
          const locked = isStepLocked(wizardStep.id);
          const done = stepDone[wizardStep.id] && !active;
          return (
            <li key={wizardStep.id}>
              <button
                type="button"
                disabled={locked}
                onClick={() => goToStep(wizardStep.id)}
                aria-current={active ? "step" : undefined}
                className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                  active
                    ? "border-primary-400 bg-primary-50/70"
                    : "border-slate-200 bg-white hover:border-primary-200"
                }`}
              >
                <span
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-semibold ${
                    active
                      ? "bg-primary-600 text-white"
                      : done
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {done ? <Check size={15} /> : wizardStep.id}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-slate-900">
                    {wizardStep.title}
                  </span>
                  <span className="block truncate text-[11px] text-slate-500">
                    {wizardStep.hint}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div>
          {step === 1 && (
            <StepPanel
              title="Item details"
              intro="Information customers see while browsing the catalog."
              badge="Required fields"
              footer={
                <>
                  <BackButton onClick={() => navigate("/admin/items")} />
                  <PrimaryButton
                    loading={updateMutation.isPending}
                    onClick={() => continueFrom(1)}
                  >
                    {isEditing ? "Save & continue" : "Continue"}
                    <ArrowRight size={16} aria-hidden="true" />
                  </PrimaryButton>
                </>
              }
            >
              <label className="block">
                <span className={fieldLabel}>Item name</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className={field}
                />
              </label>
              <label className="block">
                <span className={fieldLabel}>Customer description</span>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className={`${fieldBase} py-3`}
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-3">
                <label className="block">
                  <span className={fieldLabel}>Category</span>
                  <select
                    value={categoryId}
                    onChange={(e) =>
                      setCategoryId(e.target.value ? Number(e.target.value) : "")
                    }
                    className={field}
                  >
                    <option value="">Select</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className={fieldLabel}>Product type</span>
                  <select
                    value={typeId}
                    onChange={(e) =>
                      setTypeId(e.target.value ? Number(e.target.value) : "")
                    }
                    className={field}
                  >
                    <option value="">Select</option>
                    {types.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className={fieldLabel}>Selling unit</span>
                  <select
                    value={unitId}
                    onChange={(e) =>
                      setUnitId(e.target.value ? Number(e.target.value) : "")
                    }
                    className={field}
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
              <label className="block">
                <span className={fieldLabel}>Internal SKU</span>
                <input
                  value={item?.sku ?? "Assigned when the item is created"}
                  disabled
                  className={field}
                />
              </label>
            </StepPanel>
          )}

          {step === 2 && (
            <StepPanel
              title="Pricing & availability"
              intro="Configure the item for its assigned market."
              badge="Prices in PHP"
              footer={
                <>
                  <BackButton onClick={() => goToStep(1)} />
                  <PrimaryButton loading={busy} onClick={() => continueFrom(2)}>
                    {isEditing ? "Save & continue" : "Continue"}
                    <ArrowRight size={16} aria-hidden="true" />
                  </PrimaryButton>
                </>
              }
            >
              <label className="block">
                <span className={fieldLabel}>Assigned market</span>
                {isSuperAdmin ? (
                  <select
                    value={marketId ?? ""}
                    onChange={(e) =>
                      setMarketId(e.target.value ? Number(e.target.value) : undefined)
                    }
                    className={field}
                  >
                    <option value="">Select a market</option>
                    {markets.map((market) => (
                      <option key={market.id} value={market.id}>
                        {market.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input value={marketName ?? "Your market"} disabled className={field} />
                )}
              </label>

              <div className="grid gap-4 sm:grid-cols-3">
                <label className="block">
                  <span className={fieldLabel}>Vendor price</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className={field}
                  />
                </label>
                <label className="block">
                  <span className={fieldLabel}>Customer price</span>
                  <input
                    value={customerPrice !== null ? customerPrice.toFixed(2) : ""}
                    placeholder="Auto"
                    disabled
                    className={field}
                  />
                  {markupPercent !== undefined && (
                    <span className="mt-1 block text-[11px] text-slate-400">
                      Vendor price + {markupPercent}% app markup
                    </span>
                  )}
                </label>
                <label className="block">
                  <span className={fieldLabel}>Gross margin</span>
                  <input
                    value={margin !== null ? `${margin}%` : ""}
                    placeholder="—"
                    disabled
                    className={field}
                  />
                </label>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <p className="text-sm font-semibold text-slate-800">Availability</p>
                <p className="mb-3 text-xs text-slate-500">
                  Choose whether customers can order this item.
                </p>
                <div className="grid gap-3 sm:grid-cols-3">
                  {AVAILABILITY_OPTIONS.filter(
                    (option) => isEditing || option.value !== "out_of_stock",
                  ).map((option) => {
                    const selected = availability === option.value;
                    return (
                      <button
                        key={option.title}
                        type="button"
                        onClick={() => setAvailability(option.value)}
                        aria-pressed={selected}
                        className={`flex items-start gap-3 rounded-xl border bg-white p-3.5 text-left transition-colors ${
                          selected
                            ? "border-primary-400 bg-primary-50/60 ring-1 ring-primary-200"
                            : "border-slate-200 hover:border-primary-200"
                        }`}
                      >
                        <span
                          className={`grid h-6 w-6 shrink-0 place-items-center rounded-full ${
                            selected ? "bg-primary-600 text-white" : "bg-slate-200"
                          }`}
                        >
                          {selected && <Check size={14} />}
                        </span>
                        <span>
                          <span className="block text-sm font-semibold text-slate-900">
                            {option.title}
                          </span>
                          <span className="block text-xs text-slate-500">
                            {option.hint}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className={fieldLabel}>Same-day cutoff</span>
                  <input
                    type="time"
                    value={cutoffTime}
                    onChange={(e) => setCutoffTime(e.target.value)}
                    className={field}
                  />
                  <span className="mt-1 block text-[11px] text-slate-400">
                    Orders after this time go to the next available slot.
                  </span>
                </label>
                <label className="block">
                  <span className={fieldLabel}>Selling unit</span>
                  <input
                    value={unit?.name ?? "Set in Details"}
                    disabled
                    className={field}
                  />
                </label>
              </div>

              <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-600">
                  <Sparkles size={18} aria-hidden="true" />
                </span>
                <div className="min-w-[180px] flex-1">
                  <p className="text-sm font-semibold text-slate-800">Bulk pricing</p>
                  <p className="text-xs text-slate-500">
                    Discount per kg for bigger orders. Leave blank to use the category's
                    settings (only when the category has bulk pricing on).
                  </p>
                </div>
                <label className="w-28">
                  <span className="mb-1 block text-[11px] font-semibold text-slate-600">
                    Minimum kg
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.25"
                    value={bulkMinKg}
                    onChange={(e) => setBulkMinKg(e.target.value)}
                    placeholder={
                      item?.category_bulk_min_kg
                        ? String(Number(item.category_bulk_min_kg))
                        : "—"
                    }
                    className={field}
                  />
                </label>
                <label className="w-28">
                  <span className="mb-1 block text-[11px] font-semibold text-slate-600">
                    ₱ off per kg
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={bulkDiscountPerKg}
                    onChange={(e) => setBulkDiscountPerKg(e.target.value)}
                    placeholder={
                      item?.category_bulk_discount_per_kg
                        ? String(Number(item.category_bulk_discount_per_kg))
                        : "—"
                    }
                    className={field}
                  />
                </label>
              </div>
            </StepPanel>
          )}

          {step === 3 && (
            <StepPanel
              title="Photos"
              intro="Use clear, well-lit photos with the item centered."
              badge={`${(coverUrl ? 1 : 0) + (item?.images.length ?? 0)} image${
                (coverUrl ? 1 : 0) + (item?.images.length ?? 0) === 1 ? "" : "s"
              }`}
              footer={
                <>
                  <BackButton onClick={() => goToStep(2)} />
                  <PrimaryButton onClick={() => continueFrom(3)}>
                    Continue <ArrowRight size={16} aria-hidden="true" />
                  </PrimaryButton>
                </>
              }
            >
              <input
                ref={coverInput}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (!file) return;
                  if (isEditing) coverMutation.mutate(file);
                  else setCoverImage(file);
                }}
              />
              <input
                ref={galleryInput}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  const files = Array.from(e.target.files ?? []);
                  e.target.value = "";
                  if (files.length) uploadImagesMutation.mutate(files);
                }}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                {coverUrl ? (
                  <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-slate-100">
                    <img
                      src={coverUrl}
                      alt={name}
                      className="h-full w-full object-cover"
                    />
                    <span className="absolute left-3 top-3 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow-sm">
                      Cover photo
                    </span>
                    <button
                      type="button"
                      disabled={coverMutation.isPending}
                      onClick={() => coverInput.current?.click()}
                      className="absolute bottom-3 right-3 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"
                    >
                      {coverMutation.isPending ? "Uploading…" : "Replace"}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => coverInput.current?.click()}
                    className="flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary-200 bg-primary-50/40 text-center hover:bg-primary-50"
                  >
                    <ImagePlus
                      size={26}
                      className="text-primary-600"
                      aria-hidden="true"
                    />
                    <span className="text-sm font-semibold text-slate-800">
                      Add cover photo
                    </span>
                    <span className="text-xs text-slate-500">
                      Required · PNG or JPG up to 4 MB
                    </span>
                  </button>
                )}

                {isEditing ? (
                  <button
                    type="button"
                    disabled={uploadImagesMutation.isPending}
                    onClick={() => galleryInput.current?.click()}
                    className="flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 text-center hover:border-primary-200 disabled:opacity-60"
                  >
                    <span className="grid h-11 w-11 place-items-center rounded-full bg-primary-50 text-primary-700">
                      {uploadImagesMutation.isPending ? <Spinner /> : <Plus size={20} />}
                    </span>
                    <span className="text-sm font-semibold text-primary-800">
                      Add gallery photos
                    </span>
                    <span className="text-xs text-slate-500">
                      PNG or JPG, several at once
                    </span>
                  </button>
                ) : (
                  <div className="flex aspect-[4/3] items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 p-6 text-center text-xs text-slate-500">
                    Gallery photos can be added after the item is created.
                  </div>
                )}
              </div>

              {isEditing && item && item.images.length > 0 && (
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
                  {item.images.map((image) => (
                    <div key={image.id} className="relative">
                      <img
                        src={image.url}
                        alt=""
                        className="aspect-square w-full rounded-xl object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => deleteImageMutation.mutate(image.id)}
                        aria-label="Remove image"
                        className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-white hover:bg-black/80"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </StepPanel>
          )}

          {step === 4 && (
            <StepPanel
              title="Review item"
              intro="Confirm the storefront listing and market configuration."
              badge={
                completePercent === 100
                  ? "Ready to publish"
                  : `${completePercent}% complete`
              }
              footer={
                <>
                  <BackButton onClick={() => goToStep(3)} />
                  <div className="flex gap-2">
                    {isEditing && item ? (
                      <>
                        {item.status ? (
                          <button
                            type="button"
                            disabled={deactivateMutation.isPending}
                            onClick={() => deactivateMutation.mutate()}
                            className="rounded-xl border border-rose-200 px-4 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-60"
                          >
                            Deactivate
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={restoreMutation.isPending}
                            onClick={() => restoreMutation.mutate()}
                            className="rounded-xl border border-emerald-200 px-4 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-60"
                          >
                            Restore
                          </button>
                        )}
                        <PrimaryButton
                          loading={busy}
                          onClick={() => saveAll(() => navigate("/admin/items"))}
                        >
                          Save item <Check size={16} aria-hidden="true" />
                        </PrimaryButton>
                      </>
                    ) : (
                      <PrimaryButton
                        loading={createMutation.isPending}
                        onClick={() => createMutation.mutate()}
                      >
                        Create item <Check size={16} aria-hidden="true" />
                      </PrimaryButton>
                    )}
                  </div>
                </>
              }
            >
              <dl className="grid overflow-hidden rounded-xl border border-slate-100 sm:grid-cols-2">
                {(
                  [
                    ["Item name", name || "—", 1],
                    ["Category", category?.name ?? "—", 1],
                    ["Type", type?.name ?? "—", 1],
                    ["Unit", unit?.name ?? "—", 1],
                    ["Market", marketName ?? "—", 2],
                    ["Vendor price", vendorPrice ? peso(vendorPrice) : "—", 2],
                    ["Customer price", customerPrice ? peso(customerPrice) : "—", 2],
                    ["Availability", AVAILABILITY_LABEL[availability], 2],
                    ["Cutoff", cutoffTime ? clock(cutoffTime) : "None", 2],
                    ["Bulk pricing", bulkSummary, 2],
                  ] as const
                ).map(([label, value, fix]) => (
                  <div
                    key={label}
                    className="flex items-start justify-between gap-3 border-b border-slate-100 p-4 sm:odd:border-r"
                  >
                    <div>
                      <dt className="text-[11px] text-slate-500">{label}</dt>
                      <dd className="mt-1 text-sm font-semibold text-slate-900">
                        {value}
                      </dd>
                    </div>
                    <button
                      type="button"
                      onClick={() => goToStep(fix)}
                      className="text-[11px] font-semibold text-primary-700 hover:underline"
                    >
                      Edit
                    </button>
                  </div>
                ))}
              </dl>
              {completePercent === 100 ? (
                <div className="flex items-center gap-3 rounded-xl bg-emerald-50 p-4">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-emerald-600">
                    <Check size={18} />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-emerald-800">
                      Ready to save
                    </span>
                    <span className="block text-xs text-emerald-700">
                      The required item details, pricing, availability, and cover photo
                      are complete.
                    </span>
                  </span>
                </div>
              ) : (
                <div className="rounded-xl bg-amber-50 p-4 text-xs text-amber-800">
                  Still missing:{" "}
                  {completeness
                    .filter((c) => !c.done)
                    .map((c) => c.label.toLowerCase())
                    .join(", ")}
                  .
                </div>
              )}
            </StepPanel>
          )}
        </div>

        {/* Right column */}
        <aside className="flex flex-col gap-4">
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Storefront preview
              </span>
              <span
                className={`text-[11px] font-semibold ${
                  item?.status && isAvailable ? "text-emerald-600" : "text-slate-400"
                }`}
              >
                {!isEditing ? "Draft" : item?.status && isAvailable ? "Live" : "Hidden"}
              </span>
            </div>
            <div className="aspect-[4/3] bg-slate-100">
              {coverUrl && (
                <img src={coverUrl} alt="" className="h-full w-full object-cover" />
              )}
            </div>
            <div className="p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-primary-700">
                {category?.name ?? "Category"}
              </p>
              <p className="font-display text-xl font-semibold text-slate-900">
                {name.trim() || "Item name"}
              </p>
              <p className="line-clamp-2 min-h-[2rem] text-xs text-slate-500">
                {description || "Customer description"}
              </p>
              <p className="mt-3 font-display text-2xl font-semibold text-slate-900">
                {customerPrice ? peso(customerPrice) : "₱—"}
                <span className="ml-1 font-sans text-xs font-normal text-slate-500">
                  / {unitLabel}
                </span>
              </p>
              <span className="mt-3 block rounded-xl bg-primary-600 py-2.5 text-center text-sm font-semibold text-white">
                Add to basket
              </span>
            </div>
          </Card>

          <Card className="p-4">
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">Listing completeness</span>
              <span className="font-semibold text-slate-900">{completePercent}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-primary-600 transition-all"
                style={{ width: `${completePercent}%` }}
              />
            </div>
            <ul className="mt-3 flex flex-col gap-1.5">
              {completeness.map((check) => (
                <li
                  key={check.label}
                  className={`flex items-center gap-2 text-xs ${
                    check.done ? "text-slate-700" : "text-slate-400"
                  }`}
                >
                  {check.done ? (
                    <Check size={13} className="text-emerald-600" />
                  ) : (
                    <span className="h-[13px] w-[13px] rounded-full border border-slate-300" />
                  )}
                  {check.label}
                </li>
              ))}
            </ul>
          </Card>
        </aside>
      </div>
    </div>
  );
}
